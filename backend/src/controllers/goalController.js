import Goal from "../models/Goal.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getRange } from "../utils/period.js";
import { incomeStatement } from "../utils/finance.js";

const EXCEEDED_AT = 1.1; // beat the target by 10%+ = "exceeded"; 100-110% = "achieved"
const money = (n) => `${Math.round(n).toLocaleString("en-US")} RWF`;

export const evaluateGoals = async () => {
  const now = new Date();
  const open = await Goal.find({ evaluated: false });
  for (const g of open) {
    const { start, end, label } = getRange(g.type, g.period);
    if (end > now) continue; // period not over yet

    const { netSales } = await incomeStatement(start, end);
    const percent = Math.round((netSales / g.target) * 1000) / 10;
    const status = netSales >= g.target * EXCEEDED_AT ? "exceeded" : netSales >= g.target ? "achieved" : "failed";

    const verb = { exceeded: "exceeded", achieved: "achieved", failed: "did not reach" }[status];
    const admins = await User.find({ role: "admin", active: true }).select("_id");
    await Notification.insertMany(
      admins.map((a) => ({
        user: a._id,
        kind: status,
        title: `${g.type === "month" ? "Monthly" : "Yearly"} goal ${status}`,
        message: `For ${label} you ${verb} your goal: ${money(netSales)} of ${money(g.target)} (${percent}%).`,
      }))
    );
    g.evaluated = true;
    g.result = { status, actual: netSales, percent, evaluatedAt: now };
    await g.save();
  }
};

export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find().sort({ period: -1 });
    res.json(
      await Promise.all(
        goals.map(async (g) => {
          const { start, end } = getRange(g.type, g.period);
          const { netSales } = await incomeStatement(start, end);
          return {
            ...g.toObject(),
            actual: g.evaluated ? g.result.actual : netSales,
            percent: Math.round((netSales / g.target) * 1000) / 10,
            status: g.evaluated ? g.result.status : "in_progress",
          };
        })
      )
    );
  } catch (err) {
    next(err);
  }
};

export const saveGoal = async (req, res, next) => {
  try {
    const { type, period, target } = req.body;
    const okPeriod = type === "month" ? /^\d{4}-\d{2}$/.test(period) : /^\d{4}$/.test(period);
    if (!["month", "year"].includes(type) || !okPeriod || !(Number(target) > 0)) {
      return res.status(400).json({ message: "Valid type, period and target are required" });
    }
    const existing = await Goal.findOne({ type, period });
    if (existing?.evaluated) return res.status(400).json({ message: "That period is already closed" });

    const goal = await Goal.findOneAndUpdate(
      { type, period },
      { target: Number(target), createdBy: req.user._id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    evaluateGoals().catch(console.error); // handles goals set for periods already over
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const g = await Goal.findOneAndDelete({ _id: req.params.id, evaluated: false });
    if (!g) return res.status(404).json({ message: "Goal not found or already closed" });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    next(err);
  }
};

// ---- notifications ----
export const getNotifications = async (req, res, next) => {
  try {
    if (req.user.role === "admin") await evaluateGoals();
    const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json({ items, unread: items.filter((n) => !n.read).length });
  } catch (err) {
    next(err);
  }
};

export const readAllNotifications = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: "ok" });
  } catch (err) {
    next(err);
  }
};