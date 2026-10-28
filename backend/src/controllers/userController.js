import User from "../models/User.js";
import SalesReport from "../models/SalesReport.js";
import { findOrCreateBranch } from "../utils/branches.js";

export const getManagers = async (req, res, next) => {
  try {
    const managers = await User.find({ role: "manager", status: "approved" }).populate("branch", "name");

    const summaries = await Promise.all(
      managers.map(async (m) => {
        const reports = await SalesReport.find({ manager: m._id });
        const totalSales = reports.reduce((s, r) => s + r.grandTotal, 0);
        const pendingEdit = reports.some((r) => r.status === "edit_requested");
        return {
          id: m._id,
          name: m.name,
          email: m.email,
          branch: m.branch?.name,
          reportsCount: reports.length,
          totalSales,
          status: pendingEdit ? "edit_requested" : "approved",
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
    res.json(
      pending.map((m) => ({
        id: m._id,
        name: m.name,
        email: m.email,
        branch: m.branch?.name,
        requestedAt: m.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const approveManager = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "manager", status: "pending" },
      { status: "approved" },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "Pending manager not found" });
    res.json({ message: `${user.name} approved` });
  } catch (err) {
    next(err);
  }
};

export const rejectManager = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "manager", status: "pending" },
      { status: "rejected" },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "Pending manager not found" });
    res.json({ message: `${user.name} rejected` });
  } catch (err) {
    next(err);
  }
};

export const createManager = async (req, res, next) => {
  try {
    const { name, email, password, branch, role } = req.body;
    if (!name || !email || !password || !branch) {
      return res.status(400).json({ message: "Name, email, password and branch are required" });
    }

    const branchDoc = await findOrCreateBranch(branch);

    const user = await User.create({
      name,
      email,
      password,
      branch: branchDoc._id,
      role: role === "admin" ? "admin" : "manager",
      status: "approved",
    });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};
