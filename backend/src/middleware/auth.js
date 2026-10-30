import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { offDayBlocked } from "../utils/access.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("branch", "name");

    if (!user || !user.active) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (await offDayBlocked(user)) {
      return res.status(403).json({ message: "Today is your day off. Ask the admin to approve your access.", code: "DAY_OFF" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
};

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You don't have permission to do that" });
    }
    next();
  };
