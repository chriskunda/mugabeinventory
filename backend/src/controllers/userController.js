import User from "../models/User.js";
import SalesReport from "../models/SalesReport.js";
import { findBranch } from "../utils/branches.js";
import { COMPANY_EMAIL, EMAIL_MESSAGE } from "../utils/validators.js";

export const getManagers = async (req, res, next) => {
  try {
    const managers = await User.find({ role: "manager", status: "approved" }).populate("branch", "name").sort({ name: 1 });
    const summaries = await Promise.all(
      managers.map(async (m) => {
        const reports = await SalesReport.find({ manager: m._id }).select("grandTotal status");
        return {
          id: m._id, name: m.name, email: m.email, branch: m.branch?.name,
          active: m.active, daysOff: m.daysOff || [],
          reportsCount: reports.length,
          totalSales: reports.reduce((s, r) => s + r.grandTotal, 0),
          status: reports.some((r) => r.status === "edit_requested") ? "edit_requested" : "approved",
        };
      })
    );
    res.json(summaries);
  } catch (err) {
    next(err);
  }
};

export const getPendingManagers = async (req, res, next) => {
  try {
    const pending = await User.find({ role: "manager", status: "pending" }).populate("branch", "name");
    res.json(pending.map((m) => ({ id: m._id, name: m.name, email: m.email, branch: m.branch?.name, requestedAt: m.createdAt })));
  } catch (err) {
    next(err);
  }
};

const decide = (status) => async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: "manager", status: "pending" }, { status }, { new: true });
    if (!user) return res.status(404).json({ message: "Pending manager not found" });
    res.json({ message: `${user.name} ${status}` });
  } catch (err) {
    next(err);
  }
};
export const approveManager = decide("approved");
export const rejectManager = decide("rejected");

export const createManager = async (req, res, next) => {
  try {
    const { name, email, password, branch, role } = req.body;
    const isAdmin = role === "admin";
    if (!name || !email || !password || (!isAdmin && !branch)) {
      return res.status(400).json({ message: "Name, email, password and branch are required" });
    }
    if (!isAdmin && !COMPANY_EMAIL.test(String(email).trim())) return res.status(400).json({ message: EMAIL_MESSAGE });

    const branchDoc = isAdmin ? null : await findBranch(branch);
    const user = await User.create({
      name, email, password, role: isAdmin ? "admin" : "manager", status: "approved",
      ...(branchDoc && { branch: branchDoc._id }),
    });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

// Remove / restore access. Nothing the manager did is deleted either way.
export const setAccess = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: "manager" }, { active: !!req.body.active }, { new: true });
    if (!user) return res.status(404).json({ message: "Manager not found" });
    res.json({ message: user.active ? `${user.name} can use the system again` : `${user.name} no longer has access` });
  } catch (err) {
    next(err);
  }
};

export const setDaysOff = async (req, res, next) => {
  try {
    const days = req.body.daysOff;
    if (!Array.isArray(days) || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      return res.status(400).json({ message: "Days off must be numbers from 0 to 6" });
    }
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: "manager" }, { daysOff: [...new Set(days)] }, { new: true });
    if (!user) return res.status(404).json({ message: "Manager not found" });
    res.json({ message: "Days off saved" });
  } catch (err) {
    next(err);
  }
};

// Assign a manager to a branch. The branch's history stays with the branch,
// so a new manager sees everything previous managers did there.
export const assignBranch = async (req, res, next) => {
  try {
    const branch = await findBranch(req.body.branch);
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: "manager" }, { branch: branch._id }, { new: true });
    if (!user) return res.status(404).json({ message: "Manager not found" });
    res.json({ message: `${user.name} is now at ${branch.name}` });
  } catch (err) {
    next(err);
  }
};

export const getPasswordRequests = async (req, res, next) => {
  try {
    const list = await User.find({ role: "manager", passwordRequestedAt: { $exists: true } })
      .populate("branch", "name").sort({ passwordRequestedAt: 1 });
    res.json(list.map((m) => ({ id: m._id, name: m.name, email: m.email, branch: m.branch?.name, requestedAt: m.passwordRequestedAt })));
  } catch (err) {
    next(err);
  }
};

export const resolvePasswordRequest = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "manager" }).select("+pendingPassword");
    if (!user?.pendingPassword) return res.status(404).json({ message: "No password request for this manager" });
    // updateOne skips the pre-save hook, so the already-hashed password isn't hashed twice
    const update = { $unset: { pendingPassword: 1, passwordRequestedAt: 1 } };
    if (req.body.approve) update.$set = { password: user.pendingPassword };
    await User.updateOne({ _id: user._id }, update);
    res.json({ message: req.body.approve ? `${user.name} can log in with the new password` : "Request rejected" });
  } catch (err) {
    next(err);
  }
};