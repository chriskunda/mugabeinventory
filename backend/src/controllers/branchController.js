import ExcelJS from "exceljs";
import Branch from "../models/Branch.js";
import User from "../models/User.js";
import SalesReport from "../models/SalesReport.js";
import TransferNote from "../models/TransferNote.js";
import Return from "../models/Return.js";
import Expense from "../models/Expense.js";
import Product from "../models/Product.js";
import AccessRequest from "../models/AccessRequest.js";
import { escapeRegex } from "../utils/branches.js";
import { startPdf, line, fmt } from "../utils/pdf.js";

const ymd = (d) => new Date(d).toISOString().slice(0, 10);
const nameTaken = (name, exceptId) =>
  Branch.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i"), ...(exceptId && { _id: { $ne: exceptId } }) });

// public: the sign-up form needs it before anyone is logged in
export const listBranches = async (req, res, next) => {
  try {
    const list = await Branch.find().sort({ createdAt: 1 });
    res.json(list.map((b) => ({ id: b._id, name: b.name })));
  } catch (err) {
    next(err);
  }
};

export const branchOverview = async (req, res, next) => {
  try {
    const branches = await Branch.find().sort({ createdAt: 1 });
    res.json(
      await Promise.all(
        branches.map(async (b) => ({
          id: b._id,
          name: b.name,
          managers: await User.countDocuments({ role: "manager", branch: b._id }),
          reports: await SalesReport.countDocuments({ branch: b._id }),
          transfers: await TransferNote.countDocuments({ $or: [{ fromBranch: b._id }, { toBranch: b._id }] }),
          returns: await Return.countDocuments({ branch: b._id }),
        }))
      )
    );
  } catch (err) {
    next(err);
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name || name.length > 40) return res.status(400).json({ message: "Enter a branch name (up to 40 characters)" });
    if (await nameTaken(name)) return res.status(409).json({ message: "A branch with that name already exists" });
    res.status(201).json(await Branch.create({ name }));
  } catch (err) {
    next(err);
  }
};

// Everything points at the branch by id, so renaming updates reports, transfers and stock everywhere.
export const renameBranch = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name || name.length > 40) return res.status(400).json({ message: "Enter a branch name (up to 40 characters)" });
    if (await nameTaken(name, req.params.id)) return res.status(409).json({ message: "A branch with that name already exists" });
    const b = await Branch.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!b) return res.status(404).json({ message: "Branch not found" });
    res.json(b);
  } catch (err) {
    next(err);
  }
};

const collect = async (id) => {
  const [reports, transfers, returns] = await Promise.all([
    SalesReport.find({ branch: id }).populate("manager", "name").sort({ date: 1 }),
    TransferNote.find({ $or: [{ fromBranch: id }, { toBranch: id }] })
      .populate("fromBranch", "name").populate("toBranch", "name").populate("createdBy", "name").sort({ createdAt: 1 }),
    Return.find({ branch: id }).populate("createdBy", "name").sort({ date: 1 }),
  ]);
  return { reports, transfers, returns };
};

export const exportBranchExcel = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    const { reports, transfers, returns } = await collect(branch._id);

    const wb = new ExcelJS.Workbook();
    const sheet = (name, headers, rows) => {
      const ws = wb.addWorksheet(name);
      ws.columns = headers.map((h) => ({ header: h, width: Math.max(14, h.length + 4) }));
      ws.getRow(1).font = { bold: true };
      rows.forEach((r) => ws.addRow(r));
    };

    sheet("Sales reports", ["Date", "Manager", "Tyres", "Tyres total", "Other sales", "Grand total", "Status"],
      reports.map((r) => [ymd(r.date), r.manager?.name, r.totalTyres, r.tyresTotal, r.otherSalesTotal, r.grandTotal, r.status]));
    sheet("Tyres sold", ["Date", "Client", "Phone", "Tyre", "Size", "DOT", "Price"],
      reports.flatMap((r) => r.clients.flatMap((c) => c.tires.map((t) => [ymd(r.date), c.clientName, c.clientPhone || "", t.name, t.size, t.dot || "", t.price]))));
    sheet("Transfers", ["Date", "From", "To", "Size", "Qty", "Done by", "Status"],
      transfers.flatMap((n) => n.lines.map((l) => [ymd(n.createdAt), n.fromBranch?.name, n.toBranch?.name, l.size || l.product, l.qty, n.createdBy?.name, n.status])));
    sheet("Returns", ["Date", "Tyre", "Size", "DOT", "Qty", "Condition", "Refund", "Reason"],
      returns.map((r) => [ymd(r.date), r.tireName, r.size, r.dot || "", r.quantity, r.condition, r.refundAmount, r.reason || ""]));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${branch.name}-data.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

export const exportBranchPdf = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    const { reports, transfers, returns } = await collect(branch._id);
    const doc = startPdf(res, `${branch.name}-data.pdf`);

    line(doc, `${branch.name}: full data export`, { bold: true, size: 16 });
    line(doc, `${reports.length} sales reports, ${transfers.length} transfer notes, ${returns.length} returns`, { size: 10 });
    doc.moveDown();

    line(doc, "Sales reports", { bold: true, size: 13 });
    reports.forEach((r) => {
      line(doc, `${ymd(r.date)}  by ${r.manager?.name || "?"}  |  ${r.totalTyres} tyres  |  grand total ${fmt(r.grandTotal)}`, { bold: true, size: 10 });
      r.clients.forEach((c) =>
        c.tires.forEach((t) => line(doc, `    ${c.clientName} ${c.clientPhone || ""}: ${t.name} ${t.size} DOT ${t.dot || "-"} (${fmt(t.price)})`, { size: 9 }))
      );
    });

    doc.moveDown();
    line(doc, "Transfer notes", { bold: true, size: 13 });
    transfers.forEach((n) =>
      line(doc, `${ymd(n.createdAt)}  ${n.fromBranch?.name} to ${n.toBranch?.name}  |  ${n.lines.map((l) => `${l.size || l.product} x${l.qty}`).join(", ")}  |  by ${n.createdBy?.name}`, { size: 10 })
    );

    doc.moveDown();
    line(doc, "Returns", { bold: true, size: 13 });
    returns.forEach((r) =>
      line(doc, `${ymd(r.date)}  ${r.tireName} ${r.size} x${r.quantity}  |  ${r.condition}  |  refund ${fmt(r.refundAmount)}`, { size: 10 })
    );
    doc.end();
  } catch (err) {
    next(err);
  }
};

// POST /api/branches/:id/delete  { password }, so the admin must confirm with their own password
export const deleteBranch = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id).select("+password");
    if (!req.body.password || !(await admin.comparePassword(req.body.password))) {
      return res.status(403).json({ message: "Incorrect password. Nothing was deleted." });
    }

    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    const managers = await User.find({ role: "manager", branch: branch._id }).select("name");
    if (managers.length) {
      return res.status(409).json({
        message: `Move these managers to another branch first: ${managers.map((m) => m.name).join(", ")}`,
      });
    }

    await Promise.all([
      SalesReport.deleteMany({ branch: branch._id }),
      Return.deleteMany({ branch: branch._id }),
      Expense.deleteMany({ branch: branch._id }),
      AccessRequest.deleteMany({ branch: branch._id }),
      TransferNote.deleteMany({ $or: [{ fromBranch: branch._id }, { toBranch: branch._id }] }),
      Product.updateMany({}, { $pull: { stocks: { branch: branch._id } } }),
    ]);
    await branch.deleteOne();
    res.json({ message: `${branch.name} and its data were deleted` });
  } catch (err) {
    next(err);
  }
};