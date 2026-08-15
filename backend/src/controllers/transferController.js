import Branch from "../models/Branch.js";
import TransferNote from "../models/TransferNote.js";

// POST /api/transfers  (manager or admin)
export const createTransfer = async (req, res, next) => {
  try {
    const { date, toBranch, lines } = req.body;
    if (!date || !toBranch || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: "Date, destination branch and at least one product are required" });
    }

    let toBranchDoc = await Branch.findOne({ name: toBranch.trim() });
    if (!toBranchDoc) toBranchDoc = await Branch.create({ name: toBranch.trim() });

    const note = await TransferNote.create({
      createdBy: req.user._id,
      fromBranch: req.user.branch._id,
      toBranch: toBranchDoc._id,
      date,
      lines,
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

// GET /api/transfers  — managers see their branch's notes, admins see everything
export const getTransfers = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ fromBranch: req.user.branch._id }, { toBranch: req.user.branch._id }] };

    const transfers = await TransferNote.find(filter)
      .populate("fromBranch", "name")
      .populate("toBranch", "name")
      .populate("createdBy", "name")
      .sort({ date: -1 });

    res.json(transfers);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transfers/:id/receive  — destination branch confirms receipt
export const markReceived = async (req, res, next) => {
  try {
    const note = await TransferNote.findByIdAndUpdate(
      req.params.id,
      { status: "received" },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Transfer note not found" });
    res.json(note);
  } catch (err) {
    next(err);
  }
};
