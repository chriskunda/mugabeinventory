import AccessRequest from "../models/AccessRequest.js";
import { findBranch } from "../utils/branches.js";
import { notifyAdmins, notifyUser } from "../utils/notify.js";
import { todayKigali, addDays, daysBetween } from "../utils/access.js";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export const requestBranchWork = async (req, res, next) => {
  try {
    const { branch, date, reason } = req.body;
    if (!branch || !YMD.test(date || "")) return res.status(400).json({ message: "Choose a branch and a date" });
    const b = await findBranch(branch);
    if (String(b._id) === String(req.user.branch?._id)) return res.status(400).json({ message: "That's already your branch" });

    const dupe = await AccessRequest.findOne({ manager: req.user._id, kind: "branch", branch: b._id, date, status: { $in: ["pending", "approved"] } });
    if (dupe) return res.status(409).json({ message: `You already have a ${dupe.status} request for ${b.name} on that day` });

    const doc = await AccessRequest.create({ manager: req.user._id, kind: "branch", branch: b._id, date, reason });
    await notifyAdmins("Branch access request", `${req.user.name} asks to work at ${b.name} from ${date}.`);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const requestLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!YMD.test(startDate || "") || !YMD.test(endDate || "") || endDate < startDate) {
      return res.status(400).json({ message: "Choose a start day and an end day" });
    }
    if (startDate < todayKigali()) return res.status(400).json({ message: "Time off can't start in the past" });
    const days = daysBetween(startDate, endDate);

    const overlap = await AccessRequest.findOne({
      manager: req.user._id, kind: "leave", status: { $in: ["pending", "approved"] },
      date: { $lte: endDate }, endDate: { $gte: startDate },
    });
    if (overlap) return res.status(409).json({ message: "You already have time off requested for some of those days" });

    const doc = await AccessRequest.create({ manager: req.user._id, kind: "leave", date: startDate, endDate, reason });
    await notifyAdmins("Time off request", `${req.user.name} asks for ${days} day(s) off: ${startDate} to ${endDate}.`);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const requestRestock = async (req, res, next) => {
  try {
    const product = String(req.body.product || "").trim();
    const quantity = Math.floor(Number(req.body.quantity));
    if (!product || !(quantity > 0)) return res.status(400).json({ message: "Enter the product and how many you need" });
    const doc = await AccessRequest.create({
      manager: req.user._id, kind: "restock", branch: req.user.branch?._id,
      date: todayKigali(), product, quantity, reason: req.body.reason,
    });
    await notifyAdmins("Restock request", `${req.user.name} (${req.user.branch?.name}) needs ${quantity} x ${product}.`);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const myRequests = async (req, res, next) => {
  try {
    res.json(
      await AccessRequest.find({ manager: req.user._id, kind: { $in: ["branch", "leave", "restock"] } })
        .populate("branch", "name").sort({ createdAt: -1 }).limit(60)
    );
  } catch (err) {
    next(err);
  }
};

export const listRequests = async (req, res, next) => {
  try {
    res.json(
      await AccessRequest.find({ status: req.query.status || "pending" })
        .populate("manager", "name email").populate("branch", "name").sort({ createdAt: 1 })
    );
  } catch (err) {
    next(err);
  }
};

const label = (r) =>
  r.kind === "leave" ? `time off (${r.date} to ${r.endDate})`
  : r.kind === "restock" ? `restock request (${r.quantity} x ${r.product})`
  : r.kind === "branch" ? `request to work at ${r.branch?.name} (${r.date}${r.endDate && r.endDate !== r.date ? ` to ${r.endDate}` : ""})`
  : `access for today (${r.date})`;

// body: { approve, days? }. For "branch" requests the admin sets how many days when approving.
export const resolveRequest = async (req, res, next) => {
  try {
    const r = await AccessRequest.findById(req.params.id).populate("branch", "name");
    if (!r) return res.status(404).json({ message: "Request not found" });
    if (r.status !== "pending") return res.status(400).json({ message: "That request was already answered" });

    const approve = !!req.body.approve;
    if (approve && r.kind === "branch") {
      const days = Math.floor(Number(req.body.days));
      if (!(days >= 1 && days <= 90)) return res.status(400).json({ message: "Set how many days (1 to 90)" });
      r.endDate = addDays(r.date, days - 1);
    }
    r.status = approve ? "approved" : "rejected";
    r.resolvedBy = req.user._id;
    r.resolvedAt = new Date();
    await r.save();

    await notifyUser(r.manager, approve ? "Request approved" : "Request not approved",
      `Your ${label(r)} was ${approve ? "approved" : "not approved"}.`, approve ? "approved" : "rejected");
    res.json(r);
  } catch (err) {
    next(err);
  }
};