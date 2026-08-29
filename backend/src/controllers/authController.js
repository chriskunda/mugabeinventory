import User from "../models/User.js";
import Branch from "../models/Branch.js";
import { sendTokenCookie } from "../utils/generateToken.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, branch } = req.body;
    if (!name || !email || !password || !branch) {
      return res.status(400).json({ message: "Name, email, password and branch are required" });
    }

    let branchDoc = await Branch.findOne({ name: branch.trim() });
    if (!branchDoc) branchDoc = await Branch.create({ name: branch.trim() });

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
  res.clearCookie("token");
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
