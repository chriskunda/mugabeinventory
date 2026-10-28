import TransferNote from "../models/TransferNote.js";
import { findOrCreateBranch } from "../utils/branches.js";
import { startPdf, line, row } from "../utils/pdf.js";

const canSee = (user, note) =>
  user.role === "admin" ||
  [note.fromBranch._id ?? note.fromBranch, note.toBranch._id ?? note.toBranch].some(
    (id) => String(id) === String(user.branch._id)
  );

export const createTransfer = async (req, res, next) => {
  try {
    const { date, toBranch, fromBranch, lines } = req.body;
    if (!date || !toBranch || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: "Date, destination branch and at least one product are required" });
    }
    const toDoc = await findOrCreateBranch(toBranch);
    const fromId =
      req.user.role === "admin" && fromBranch ? (await findOrCreateBranch(fromBranch))._id : req.user.branch._id;
    if (String(fromId) === String(toDoc._id)) {
      return res.status(400).json({ message: "Source and destination branch must be different" });
    }

    const note = await TransferNote.create({
      createdBy: req.user._id,
      fromBranch: fromId,
      toBranch: toDoc._id,
      date,
      lines: lines.map((l) => ({ product: l.product, qty: Number(l.qty) })),
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

export const getTransfers = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ fromBranch: req.user.branch._id }, { toBranch: req.user.branch._id }] };
    const transfers = await TransferNote.find(filter)
      .populate("fromBranch", "name").populate("toBranch", "name").populate("createdBy", "name")
      .sort({ date: -1 });
    res.json(transfers);
  } catch (err) {
    next(err);
  }
};

export const markReceived = async (req, res, next) => {
  try {
    const note = await TransferNote.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Transfer note not found" });
    const isDestination = String(note.toBranch) === String(req.user.branch._id);
    if (req.user.role !== "admin" && !isDestination) {
      return res.status(403).json({ message: "Only the receiving branch can confirm receipt" });
    }
    note.status = "received";
    await note.save();
    res.json(note);
  } catch (err) {
    next(err);
  }
};

export const exportTransferPdf = async (req, res, next) => {
  try {
    const note = await TransferNote.findById(req.params.id)
      .populate("fromBranch", "name").populate("toBranch", "name").populate("createdBy", "name");
    if (!note) return res.status(404).json({ message: "Transfer note not found" });
    if (!canSee(req.user, note)) return res.status(403).json({ message: "Not allowed" });

    const date = note.date.toISOString().slice(0, 10);
    const doc = startPdf(res, `transfer-${note.fromBranch.name}-to-${note.toBranch.name}-${date}.pdf`);

    line(doc, "TRANSFER / DELIVERY NOTE", { bold: true, size: 16 });
    doc.moveDown();
    line(doc, `Date: ${date}`);
    line(doc, `From: ${note.fromBranch.name}`);
    line(doc, `To: ${note.toBranch.name}`);
    line(doc, `Created by: ${note.createdBy?.name}`);
    line(doc, `Status: ${note.status}`);
    doc.moveDown();
    row(doc, "Product", "Qty", { bold: true });
    note.lines.forEach((l, i) => row(doc, `${i + 1}. ${l.product}`, String(l.qty)));
    doc.moveDown(3);
    line(doc, "Sent by: ____________________        Received by: ____________________");
    doc.end();
  } catch (err) {
    next(err);
  }
};