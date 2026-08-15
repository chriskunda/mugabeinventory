import User from "../models/User.js";
import Branch from "../models/Branch.js";
import { sendTokenCookie } from "../utils/generateToken.js";

// POST /api/auth/register
// Public registration always creates a "manager" — admin accounts are
// created via the seed script or by another admin (see userController.createManager),
// so a stray public signup can never grant itself admin rights.
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
    });

    sendTokenCookie(res, user);
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: branchDoc.name,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
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

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

// GET /api/auth/me
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
