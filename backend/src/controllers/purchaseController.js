import Purchase from "../models/Purchase.js";
import { findBranch } from "../utils/branches.js";
import { getRange } from "../utils/period.js";
import { notifyAdmins, notifyUser } from "../utils/notify.js";

export const createPurchase = async (req, res, next) => {
  try {
    const { date, category, item, supplier, quantity, amount, notes, branch } = req.body;
    if (!date || !String(category || "").trim() || !(Number(amount) > 0)) {
      return res.status(400).json({ message: "Date, category and amount are required" });
    }
    const isAdmin = req.user.role === "admin";
    const branchDoc = isAdmin ? (branch ? await findBranch(branch) : null) : req.user.branch;

    const doc = await Purchase.create({
      branch: branchDoc?._id, createdBy: req.user._id, date, category: String(category).trim(),
      item, supplier, quantity: Number(quantity) || undefined, amount: Number(amount), notes,
      status: isAdmin ? "approved" : "pending",
      ...(isAdmin && { resolvedBy: req.user._id, resolvedAt: new Date() }),
    });
    if (!isAdmin) {
      await notifyAdmins("Purchase awaiting approval",
        `${req.user.name} recorded ${item || category}: ${Number(amount).toLocaleString("en-US")} RWF (${branchDoc?.name}).`);
    }
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.month) {
      const { start, end } = getRange("month", req.query.month);
      filter.date = { $gte: start, $lt: end };
    }
    if (req.user.role !== "admin") filter.$or = [{ branch: req.user.branch._id }, { createdBy: req.user._id }];
    else if (req.query.branch) filter.branch = (await findBranch(req.query.branch))._id;

    res.json(await Purchase.find(filter).populate("branch", "name").populate("createdBy", "name").sort({ date: -1, createdAt: -1 }));
  } catch (err) {
    next(err);
  }
};

export const resolvePurchase = async (req, res, next) => {
  try {
    const p = await Purchase.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Purchase not found" });
    if (p.status !== "pending") return res.status(400).json({ message: "That purchase was already answered" });
    const approve = !!req.body.approve;
    p.status = approve ? "approved" : "rejected";
    p.resolvedBy = req.user._id;
    p.resolvedAt = new Date();
    await p.save();
    await notifyUser(p.createdBy, approve ? "Purchase approved" : "Purchase not approved",
      `Your purchase "${p.item || p.category}" (${p.amount.toLocaleString("en-US")} RWF) was ${approve ? "approved" : "not approved"}.`,
      approve ? "approved" : "rejected");
    res.json(p);
  } catch (err) {
    next(err);
  }
};

export const deletePurchase = async (req, res, next) => {
  try {
    const p = await Purchase.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: "Purchase not found" });
    res.json({ message: "Purchase deleted" });
  } catch (err) {
    next(err);
  }
};