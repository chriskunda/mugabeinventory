import Return from "../models/Return.js";
import Branch from "../models/Branch.js";
import { findOrCreateBranch } from "../utils/branches.js";
import { getRange } from "../utils/period.js";

export const createReturn = async (req, res, next) => {
  try {
    const { date, tireName, size, dot, quantity, condition, refundAmount, reason, branch } = req.body;
    if (!date || !tireName || !size || !["good", "damaged"].includes(condition)) {
      return res.status(400).json({ message: "Date, tire, size and condition are required" });
    }
    let branchId = req.user.branch?._id;
    if (req.user.role === "admin") {
      if (!branch) return res.status(400).json({ message: "Choose a branch" });
      branchId = (await findOrCreateBranch(branch))._id;
    }

    const doc = await Return.create({
      branch: branchId, createdBy: req.user._id, date, tireName, size, dot,
      quantity: Number(quantity) || 1, condition, refundAmount: Number(refundAmount) || 0, reason,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const getReturns = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== "admin") filter.branch = req.user.branch._id;
    else if (req.query.branch) {
      const b = await Branch.findOne({ name: req.query.branch });
      if (b) filter.branch = b._id;
    }
    if (req.query.month) {
      const { start, end } = getRange("month", req.query.month);
      filter.date = { $gte: start, $lt: end };
    }
    const list = await Return.find(filter)
      .populate("branch", "name").populate("createdBy", "name").sort({ date: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// GET /api/returns/summary?month=YYYY-MM (admin): per-branch totals for the month
export const getReturnsSummary = async (req, res, next) => {
  try {
    const { start, end } = getRange("month", req.query.month);
    const rows = await Return.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: { branch: "$branch", condition: "$condition" }, qty: { $sum: "$quantity" }, refunds: { $sum: "$refundAmount" } } },
    ]);
    const branches = await Branch.find().sort({ createdAt: 1 });
    res.json(
      branches.map((b) => {
        const mine = rows.filter((r) => String(r._id.branch) === String(b._id));
        const qty = (c) => mine.find((r) => r._id.condition === c)?.qty || 0;
        return {
          branch: b.name,
          good: qty("good"),
          damaged: qty("damaged"),
          total: qty("good") + qty("damaged"),
          refunds: mine.reduce((s, r) => s + r.refunds, 0),
        };
      })
    );
  } catch (err) {
    next(err);
  }
};