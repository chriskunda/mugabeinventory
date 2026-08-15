import User from "../models/User.js";
import Branch from "../models/Branch.js";
import SalesReport from "../models/SalesReport.js";

// GET /api/users/managers  (admin only)
export const getManagers = async (req, res, next) => {
  try {
    const managers = await User.find({ role: "manager" }).populate("branch", "name");

    // attach a light-weight summary per manager so the table doesn't need N extra requests
    const summaries = await Promise.all(
      managers.map(async (m) => {
        const reports = await SalesReport.find({ manager: m._id });
        const totalSales = reports.reduce((s, r) => s + r.total, 0);
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

// POST /api/users/managers (admin only) — admin-created manager or admin account
export const createManager = async (req, res, next) => {
  try {
    const { name, email, password, branch, role } = req.body;
    if (!name || !email || !password || !branch) {
      return res.status(400).json({ message: "Name, email, password and branch are required" });
    }

    let branchDoc = await Branch.findOne({ name: branch.trim() });
    if (!branchDoc) branchDoc = await Branch.create({ name: branch.trim() });

    const user = await User.create({
      name,
      email,
      password,
      branch: branchDoc._id,
      role: role === "admin" ? "admin" : "manager",
    });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};
