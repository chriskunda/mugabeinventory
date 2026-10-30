import AccessRequest from "../models/AccessRequest.js";
import { findBranch } from "../utils/branches.js";
import { notifyAdmins, notifyUser } from "../utils/notify.js";

// manager: "I'll be working at another branch on this date"
export const requestBranchWork = async (req, res, next) => {
  try {
    const { branch, date, reason } = req.body;
    if (!branch || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return res.status(400).json({ message: "Choose a branch and a date" });

    const b = await findBranch(branch);
    if (String(b._id) === String(req.user.branch?._id)) return res.status(400).json({ message: "That's already your branch" });

    const dupe = await AccessRequest.findOne({ manager: req.user._id, kind: "branch", branch: b._id, date, status: { $in: ["pending", "approved"] } });
    if (dupe) return res.status(409).json({ message: `You already have a ${dupe.status} request for ${b.name} on that day` });

    const doc = await AccessRequest.create({ manager: req.user._id, kind: "branch", branch: b._id, date, reason });
    await notifyAdmins("Branch access request", `${req.user.name} asks to work at ${b.name} on ${date}.`);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const myRequests = async (req, res, next) => {
  try {
    res.json(await AccessRequest.find({ manager: req.user._id, kind: "branch" }).populate("branch", "name").sort({ createdAt: -1 }).limit(50));
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

export const resolveRequest = async (req, res, next) => {
  try {
    const r = await AccessRequest.findById(req.params.id).populate("branch", "name");
    if (!r) return res.status(404).json({ message: "Request not found" });
    if (r.status !== "pending") return res.status(400).json({ message: "That request was already answered" });

    r.status = req.body.approve ? "approved" : "rejected";
    r.resolvedBy = req.user._id;
    r.resolvedAt = new Date();
    await r.save();

    if (r.kind === "branch") {
      await notifyUser(r.manager, `Branch access ${r.status}`,
        `Your request to work at ${r.branch?.name} on ${r.date} was ${r.status}.`,
        r.status === "approved" ? "achieved" : "failed");
    }
    res.json(r);
  } catch (err) {
    next(err);
  }
};