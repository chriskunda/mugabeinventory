import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { findOrCreateBranch } from "../utils/branches.js";
import { sendTokenCookie } from "../utils/generateToken.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, branch } = req.body;
    if (!name || !email || !password || !branch) {
      return res.status(400).json({ message: "Name, email, password and branch are required" });
    }

    const branchDoc = await findOrCreateBranch(branch);

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with that email already exists" });

    const user = await User.create({
      name,
      email,
      password,
      branch: branchDoc._id,
      role: "manager",
      status: "pending",
    });

    const admins = await User.find({ role: "admin" }).select("_id");
    await Notification.insertMany(
      admins.map((admin) => ({
        user: admin._id,
        title: "New manager request",
        message: `${name} (${branchDoc.name}) is waiting for approval.`,
      }))
    );

    res.status(201).json({
      pending: true,
      message: "Your account was created and is waiting for admin approval. You'll be able to log in once approved.",
      id: user._id,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate("branch", "name");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.active) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }
    if (user.role === "manager" && user.status === "pending") {
      return res.status(403).json({ message: "Your account is still waiting for admin approval" });
    }
    if (user.role === "manager" && user.status === "rejected") {
      return res.status(403).json({ message: "Your registration request was not approved" });
    }

    sendTokenCookie(res, user);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch?.name,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  const prod = process.env.NODE_ENV === "production";
  res.clearCookie("token", { httpOnly: true, secure: prod, sameSite: prod ? "none" : "lax" });
  res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    branch: u.branch?.name,
  });
};
