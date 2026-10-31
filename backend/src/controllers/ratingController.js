import Rating from "../models/Rating.js";
import User from "../models/User.js";
import { notifyUser } from "../utils/notify.js";

export const rateManager = async (req, res, next) => {
  try {
    const score = Number(req.body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) return res.status(400).json({ message: "Choose a rating from 1 to 5 stars" });
    const m = await User.findOne({ _id: req.params.id, role: "manager" });
    if (!m) return res.status(404).json({ message: "Manager not found" });

    const comment = String(req.body.comment || "").trim().slice(0, 500);
    const doc = await Rating.create({ manager: m._id, ratedBy: req.user._id, score, comment });
    await notifyUser(m._id, "New rating from the admin", `You were rated ${score}/5.${comment ? ` "${comment}"` : ""}`, score >= 4 ? "approved" : "info");
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const managerRatings = async (req, res, next) => {
  try {
    res.json(await Rating.find({ manager: req.params.id }).sort({ createdAt: -1 }).limit(20));
  } catch (err) {
    next(err);
  }
};

export const myRatings = async (req, res, next) => {
  try {
    const [items, agg] = await Promise.all([
      Rating.find({ manager: req.user._id }).sort({ createdAt: -1 }).limit(10),
      Rating.aggregate([{ $match: { manager: req.user._id } }, { $group: { _id: null, avg: { $avg: "$score" }, n: { $sum: 1 } } }]),
    ]);
    res.json({ average: agg[0] ? Math.round(agg[0].avg * 10) / 10 : null, count: agg[0]?.n || 0, items });
  } catch (err) {
    next(err);
  }
};