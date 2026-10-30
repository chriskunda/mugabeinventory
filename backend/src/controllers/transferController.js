import TransferNote from "../models/TransferNote.js";
import { findOrCreateBranch } from "../utils/branches.js";
import AccessRequest from "../models/AccessRequest.js";
import { todayKigali } from "../utils/access.js";
import { startPdf } from "../utils/pdf.js";

const TZ = "Africa/Kigali";
const stamp = (d) => {
  const x = new Date(d);
  const date = x.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  const time = x.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
  return `On ${date}, ${time}`;
};

const canSee = (user, note) =>
  user.role === "admin" ||
  [note.fromBranch._id ?? note.fromBranch, note.toBranch._id ?? note.toBranch].some(
    (id) => String(id) === String(user.branch?._id)
  ) ||
  String(note.createdBy?._id ?? note.createdBy) === String(user._id);

export const createTransfer = async (req, res, next) => {
  try {
    const { toBranch, fromBranch, lines } = req.body;
    if (
      !toBranch || !Array.isArray(lines) || lines.length === 0 ||
      lines.some((l) => !String(l.size || "").trim() || !(Number(l.qty) > 0))
    ) {
      return res.status(400).json({ message: "Pick the destination and give every line a size and quantity" });
    }

    const toDoc = await findOrCreateBranch(toBranch);
    let fromId = req.user.branch?._id;
    if (req.user.role === "admin") {
      if (!fromBranch) return res.status(400).json({ message: "Choose the sending branch" });
      fromId = (await findOrCreateBranch(fromBranch))._id;
    } else if (fromBranch) {
      const f = await findOrCreateBranch(fromBranch);
      if (String(f._id) !== String(fromId)) {
        const ok = await AccessRequest.exists({
          manager: req.user._id, kind: "branch", branch: f._id, date: todayKigali(), status: "approved",
        });
        if (!ok) return res.status(403).json({ message: `The admin hasn't approved you to work at ${f.name} today` });
        fromId = f._id;
      }
    }
    if (String(fromId) === String(toDoc._id)) {
      return res.status(400).json({ message: "Source and destination branch must be different" });
    }

    const note = await TransferNote.create({
      createdBy: req.user._id,
      fromBranch: fromId,
      toBranch: toDoc._id,
      lines: lines.map((l) => ({ size: String(l.size).trim(), qty: Number(l.qty) })),
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
        : { $or: [{ fromBranch: req.user.branch._id }, { toBranch: req.user.branch._id }, { createdBy: req.user._id }] };
    const transfers = await TransferNote.find(filter)
      .populate("fromBranch", "name").populate("toBranch", "name").populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (err) {
    next(err);
  }
};

export const markReceived = async (req, res, next) => {
  try {
    const note = await TransferNote.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Transfer note not found" });
    const isDestination = String(note.toBranch) === String(req.user.branch?._id);
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

    const doc = startPdf(
      res,
      `transfer-${note.fromBranch.name}-to-${note.toBranch.name}-${note.createdAt.toISOString().slice(0, 10)}.pdf`
    );
    const L = 50, R = 545, ROW = 26;

    doc.fillColor("#212625").font("Helvetica-Bold").fontSize(20).text("Transfer note", L, 50);
    doc.font("Helvetica").fontSize(12).fillColor("#6b6a73")
      .text(`From ${note.fromBranch.name}  to  ${note.toBranch.name}`, L, 78);

    let y = 120;
    doc.rect(L, y, R - L, ROW).fill("#f4e3dd");
    doc.fillColor("#8b3a2a").font("Helvetica-Bold").fontSize(10);
    doc.text("#", L + 10, y + 8);
    doc.text("SIZE", L + 50, y + 8);
    doc.text("QUANTITY", L, y + 8, { width: R - L - 10, align: "right" });
    y += ROW;

    doc.fillColor("#212625").font("Helvetica").fontSize(11);
    note.lines.forEach((l, i) => {
      if (y > 740) { doc.addPage(); y = 50; }
      doc.fillColor("#212625").font("Helvetica");
      doc.text(String(i + 1), L + 10, y + 8);
      doc.text(l.size || l.product || "", L + 50, y + 8, { width: 300 });
      doc.text(String(l.qty), L, y + 8, { width: R - L - 10, align: "right" });
      y += ROW;
      doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).strokeColor("#e8e1d8").stroke();
    });

    const total = note.lines.reduce((s, l) => s + l.qty, 0);
    doc.font("Helvetica-Bold").fillColor("#212625");
    doc.text("Total", L + 50, y + 8);
    doc.text(String(total), L, y + 8, { width: R - L - 10, align: "right" });
    y += ROW + 40;

    doc.font("Helvetica-Bold").fontSize(11).text(`Done by ${note.createdBy?.name || ""}`, L, y);
    doc.font("Helvetica").fillColor("#6b6a73").text(stamp(note.createdAt), L, y, { width: R - L, align: "right" });
    doc.end();
  } catch (err) {
    next(err);
  }
};