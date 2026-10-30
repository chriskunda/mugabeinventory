import ExcelJS from "exceljs";
import SalesReport from "../models/SalesReport.js";
import Return from "../models/Return.js";
import { findOrCreateBranch, escapeRegex } from "../utils/branches.js";
import AccessRequest from "../models/AccessRequest.js";
import Branch from "../models/Branch.js";
import { startPdf, line, row, fmt } from "../utils/pdf.js";

const canView = (user, report) =>
  user.role === "admin" ||
  String(report.manager?._id ?? report.manager) === String(user._id) ||
  String(report.branch?._id ?? report.branch) === String(user.branch?._id);

const resolveOpeningStock = async (branchId, excludeReportId) => {
  const filter = { branch: branchId };
  if (excludeReportId) filter._id = { $ne: excludeReportId };
  const last = await SalesReport.findOne(filter).sort({ date: -1, createdAt: -1 });
  const restocked = await Return.aggregate([
    {
      $match: {
        branch: branchId,
        condition: "good",
        createdAt: { $gt: last ? last.createdAt : new Date(0) },
      },
    },
    { $group: { _id: null, qty: { $sum: "$quantity" } } },
  ]);
  return (last ? last.closingStock : 0) + (restocked[0]?.qty || 0);
};

export const createReport = async (req, res, next) => {
  try {
    const { date, branch, clients, transfers, otherSales, openingStock, notes } = req.body;
    if (!date || !branch || !Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ message: "Date, branch and at least one client entry are required" });
    }

    const branchDoc = await findOrCreateBranch(branch);

    if (req.user.role === "manager" && String(branchDoc._id) !== String(req.user.branch._id)) {
      const approved = await AccessRequest.exists({
        manager: req.user._id, kind: "branch", branch: branchDoc._id,
        date: String(date).slice(0, 10), status: "approved",
      });
      if (!approved) {
        return res.status(403).json({ message: `The admin hasn't approved you to report for ${branchDoc.name} on that day` });
      }
    }

    const opening =
      openingStock !== undefined && openingStock !== null && openingStock !== ""
        ? Number(openingStock)
        : await resolveOpeningStock(branchDoc._id);

    const report = await SalesReport.create({
      manager: req.user._id,
      branch: branchDoc._id,
      date,
      clients,
      transfers: transfers || [],
      otherSales: otherSales || [],
      openingStock: opening,
      notes,
    });

    const populated = await report.populate([
      { path: "manager", select: "name" },
      { path: "branch", select: "name" },
    ]);
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const reports = await SalesReport.find({
      $or: [{ branch: req.user.branch._id }, { manager: req.user._id }],
    })
      .populate("branch", "name")
      .populate("manager", "name")
      .sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/search?product=&client=&branch= (product is required)
export const searchSales = async (req, res, next) => {
  try {
    const product = String(req.query.product || "").trim();
    const client = String(req.query.client || "").trim();
    if (product.length < 2) return res.status(400).json({ message: "Enter the product to search for first" });

    const match = {};
    if (req.user.role !== "admin") match.branch = req.user.branch._id;
    else if (req.query.branch) match.branch = (await findOrCreateBranch(req.query.branch))._id;

    const p = new RegExp(escapeRegex(product), "i");
    const and = [{ $or: [{ "clients.tires.name": p }, { "clients.tires.size": p }] }];
    if (client) {
      const c = new RegExp(escapeRegex(client), "i");
      and.push({ $or: [{ "clients.clientName": c }, { "clients.clientPhone": c }] });
    }

    const rows = await SalesReport.aggregate([
      { $match: match },
      { $unwind: "$clients" },
      { $unwind: "$clients.tires" },
      { $match: { $and: and } },
      { $sort: { date: -1 } },
      { $limit: 200 },
      { $lookup: { from: "branches", localField: "branch", foreignField: "_id", as: "b" } },
      {
        $project: {
          _id: 0, reportId: "$_id", date: 1,
          branch: { $arrayElemAt: ["$b.name", 0] },
          clientName: "$clients.clientName", clientPhone: "$clients.clientPhone",
          product: "$clients.tires.name", size: "$clients.tires.size",
          dot: "$clients.tires.dot", price: "$clients.tires.price",
        },
      },
    ]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getAllReports = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.branch) {
      const branchDoc = await Branch.findOne({ name: req.query.branch });
      if (branchDoc) filter.branch = branchDoc._id;
    }
    if (req.query.month) {
      const [y, m] = req.query.month.split("-").map(Number);
      filter.date = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
    }

    const reports = await SalesReport.find(filter)
      .populate("manager", "name email")
      .populate("branch", "name")
      .sort({ date: -1 });

    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const report = await SalesReport.findById(req.params.id)
      .populate("manager", "name")
      .populate("branch", "name");
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!canView(req.user, report)) {
      return res.status(403).json({ message: "Not your report" });
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const requestEdit = async (req, res, next) => {
  try {
    const report = await SalesReport.findOne({ _id: req.params.id, manager: req.user._id });
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (report.status !== "submitted") {
      return res.status(400).json({ message: "This report already has a pending or approved edit" });
    }

    report.status = "edit_requested";
    report.editRequest = { reason: req.body.reason || "", requestedAt: new Date() };
    await report.save();

    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const resolveEditRequest = async (req, res, next) => {
  try {
    const report = await SalesReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (report.status !== "edit_requested") {
      return res.status(400).json({ message: "This report has no pending edit request" });
    }

    report.status = req.body.approve ? "editable" : "submitted";
    report.editRequest.resolvedBy = req.user._id;
    report.editRequest.resolvedAt = new Date();
    report.editRequest.approved = !!req.body.approve;
    await report.save();

    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const report = await SalesReport.findOne({ _id: req.params.id, manager: req.user._id });
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (report.status !== "editable") {
      return res.status(403).json({ message: "This report is locked. Request admin approval to edit it." });
    }

    const { date, clients, transfers, otherSales, openingStock, notes } = req.body;
    if (date) report.date = date;
    if (Array.isArray(clients) && clients.length) report.clients = clients;
    if (transfers) report.transfers = transfers;
    if (otherSales) report.otherSales = otherSales;
    if (openingStock !== undefined) report.openingStock = openingStock;
    if (notes !== undefined) report.notes = notes;
    report.status = "submitted";
    await report.save();

    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const exportReportExcel = async (req, res, next) => {
  try {
    const report = await SalesReport.findById(req.params.id)
      .populate("manager", "name")
      .populate("branch", "name");
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (!canView(req.user, report)) {
      return res.status(403).json({ message: "Not your report" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.addRow([`Branch: ${report.branch?.name}`]);
    sheet.addRow([`Date: ${report.date.toISOString().slice(0, 10)}`]);
    sheet.addRow([`Manager: ${report.manager?.name}`]);
    sheet.addRow([]);
    sheet.addRow(["#", "Tire", "Size", "DOT", "Price", "Client", "Phone"]).font = { bold: true };

    let rowNum = 1;
    report.clients.forEach((c) => {
      c.tires.forEach((t, i) => {
        sheet.addRow([
          i === 0 ? rowNum : "",
          t.name,
          t.size,
          t.dot || "",
          t.price,
          i === 0 ? c.clientName : "",
          i === 0 ? c.clientPhone || "" : "",
        ]);
      });
      rowNum += 1;
    });

    sheet.addRow([]);
    sheet.addRow([`Total (${report.totalTyres} tyres)`, "", "", "", report.tyresTotal]).font = { bold: true };
    sheet.addRow(["Average", "", "", "", report.average]);

    if (report.transfers.length) {
      sheet.addRow([]);
      sheet.addRow(["Transfers"]).font = { bold: true };
      report.transfers.forEach((t) => sheet.addRow([t]));
    }

    if (report.otherSales.length) {
      sheet.addRow([]);
      sheet.addRow(["Other sales"]).font = { bold: true };
      report.otherSales.forEach((o) => sheet.addRow([o.item, "", "", "", o.price]));
      sheet.addRow(["Other sales total", "", "", "", report.otherSalesTotal]).font = { bold: true };
    }

    sheet.addRow([]);
    sheet.addRow(["Grand total", "", "", "", report.grandTotal]).font = { bold: true };
    sheet.addRow([`Current stock (was ${report.openingStock})`, "", "", "", report.closingStock]);
    sheet.addRow([]);
    sheet.addRow([`Done by ${report.manager?.name}`]);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${report.branch?.name}-${report.date.toISOString().slice(0, 10)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

export const exportReportPdf = async (req, res, next) => {
  try {
    const report = await SalesReport.findById(req.params.id)
      .populate("manager", "name")
      .populate("branch", "name");
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (!canView(req.user, report)) {
      return res.status(403).json({ message: "Not your report" });
    }

    const date = report.date.toISOString().slice(0, 10);
    const doc = startPdf(res, `report-${report.branch?.name}-${date}.pdf`);

    line(doc, `${report.branch?.name} — ${date}`, { bold: true, size: 15 });
    line(doc, `Sent: ${report.sentAt.toLocaleString()}`, { size: 9 });
    doc.moveDown();

    report.clients.forEach((c, i) => {
      c.tires.forEach((t, ti) =>
        line(
          doc,
          `${ti === 0 ? `${i + 1}. ` : "    "}${t.name}  ${t.size}  DOT ${t.dot || "-"}  —  ${fmt(t.price)}`
        )
      );
      line(doc, `    ${c.clientName}${c.clientPhone ? `  ${c.clientPhone}` : ""}`, { bold: true });
      doc.moveDown(0.5);
    });

    row(doc, `Total (${report.totalTyres} tyres)`, fmt(report.tyresTotal), { bold: true });
    row(doc, "Average", fmt(report.average));

    if (report.transfers.length) {
      doc.moveDown(0.5);
      line(doc, "Transfer", { bold: true });
      report.transfers.forEach((t) => line(doc, `  ${t}`));
    }
    if (report.otherSales.length) {
      doc.moveDown(0.5);
      line(doc, "Other sales", { bold: true });
      report.otherSales.forEach((o) => row(doc, `  ${o.item}`, fmt(o.price)));
      row(doc, "Other sales total", fmt(report.otherSalesTotal), { bold: true });
    }

    doc.moveDown(0.5);
    row(doc, "Grand total", fmt(report.grandTotal), { bold: true });
    row(doc, `Current stock (was ${report.openingStock})`, fmt(report.closingStock));
    doc.moveDown();
    line(doc, `Done by ${report.manager?.name}`, { bold: true });
    doc.end();
  } catch (err) {
    next(err);
  }
};

export const exportMonthExcel = async (req, res, next) => {
  try {
    const { month } = req.query;
    const filter = {};
    if (month) {
      const [y, m] = month.split("-").map(Number);
      filter.date = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
    }

    const reports = await SalesReport.find(filter)
      .populate("manager", "name")
      .populate("branch", "name")
      .sort({ date: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Reports");

    sheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Branch", key: "branch", width: 16 },
      { header: "Manager", key: "manager", width: 20 },
      { header: "Tyres sold", key: "tyres", width: 12 },
      { header: "Tyres total", key: "tyresTotal", width: 14 },
      { header: "Other sales", key: "other", width: 14 },
      { header: "Grand total", key: "grand", width: 14 },
      { header: "Status", key: "status", width: 16 },
    ];
    sheet.getRow(1).font = { bold: true };

    reports.forEach((r) => {
      sheet.addRow({
        date: r.date.toISOString().slice(0, 10),
        branch: r.branch?.name,
        manager: r.manager?.name,
        tyres: r.totalTyres,
        tyresTotal: r.tyresTotal,
        other: r.otherSalesTotal,
        grand: r.grandTotal,
        status: r.status,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="reports-${month || "all"}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
