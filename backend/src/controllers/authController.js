import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AccessRequest from "../models/AccessRequest.js";
import { findBranch } from "../utils/branches.js";
import { COMPANY_EMAIL, EMAIL_MESSAGE } from "../utils/validators.js";
import { offDayBlocked, isOffToday, todayKigali } from "../utils/access.js";
import { notifyAdmins } from "../utils/notify.js";
import { sendTokenCookie } from "../utils/generateToken.js";

const profile = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role, branch: u.branch?.name, photo: u.photo || "",
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, branch } = req.body;
    if (!name || !email || !password || !branch) {
      return res.status(400).json({ message: "Name, email, password and branch are required" });
    }
    if (!COMPANY_EMAIL.test(String(email).trim())) return res.status(400).json({ message: EMAIL_MESSAGE });

    const branchDoc = await findBranch(branch);
    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with that email already exists" });

    const user = await User.create({ name, email, password, branch: branchDoc._id, role: "manager", status: "pending" });
    await notifyAdmins("New manager request", `${name} (${branchDoc.name}) is waiting for approval.`);

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
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: String(email).trim().toLowerCase() })
      .select("+password")
      .populate("branch", "name");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.active) return res.status(403).json({ message: "Your access has been removed. Please contact the admin." });
    if (user.role === "manager" && user.status === "pending") {
      return res.status(403).json({ message: "Your account is still waiting for admin approval" });
    }
    if (user.role === "manager" && user.status === "rejected") {
      return res.status(403).json({ message: "Your registration request was not approved" });
    }
    if (await offDayBlocked(user)) {
      return res.status(403).json({ message: "Today is your day off. You can ask the admin for access.", code: "DAY_OFF" });
    }

    sendTokenCookie(res, user);
    res.json(profile(user));
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  const prod = process.env.NODE_ENV === "production";
  res.clearCookie("token", { httpOnly: true, secure: prod, sameSite: prod ? "none" : "lax" });
  res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => res.json(profile(req.user));

export const setPhoto = async (req, res, next) => {
  try {
    const photo = req.body.photo ?? "";
    if (photo !== "" && !/^data:image\/(jpeg|png|webp);base64,/.test(photo)) {
      return res.status(400).json({ message: "Please upload an image" });
    }
    if (photo.length > 90_000) return res.status(400).json({ message: "That image is too large" });
    const u = await User.findByIdAndUpdate(req.user._id, { photo }, { new: true }).populate("branch", "name");
    res.json(profile(u));
  } catch (err) {
    next(err);
  }
};

// Manager forgot their password: they pick a new one, the admin must approve it.
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || String(newPassword || "").length < 6) {
      return res.status(400).json({ message: "Enter your email and a new password of at least 6 characters" });
    }
    const user = await User.findOne({ email: String(email).trim().toLowerCase(), role: "manager", status: "approved" });
    if (user) {
      user.pendingPassword = await bcrypt.hash(newPassword, 10);
      user.passwordRequestedAt = new Date();
      await user.save();
      await notifyAdmins("Password change request", `${user.name} (${user.email}) asked to change their password.`);
    }
    // same answer whether or not the email exists
    res.json({ message: "Request sent. Once the admin approves it, log in with your new password." });
  } catch (err) {
    next(err);
  }
};

// Manager is blocked on a day off: they ask the admin to let them in today.
export const requestDayAccess = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+password");
    if (!user || user.role !== "manager" || !(await user.comparePassword(password || ""))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.active || user.status !== "approved") return res.status(403).json({ message: "Your account can't request access" });

    const today = todayKigali();
    if (!(await isOffToday(user))) return res.status(400).json({ message: "You're not on a day off today. Try logging in again." });

    const existing = await AccessRequest.findOne({ manager: user._id, kind: "day_off", date: today, status: "pending" });
    if (!existing) {
      await AccessRequest.create({ manager: user._id, kind: "day_off", date: today, reason: req.body.reason });
      await notifyAdmins("Day-off access request", `${user.name} asks to work today (${today}), which is their day off.`);
    }
    res.json({ message: "Request sent. Log in again once the admin approves it." });
  } catch (err) {
    next(err);
  }
};