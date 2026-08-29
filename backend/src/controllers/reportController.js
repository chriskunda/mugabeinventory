import ExcelJS from "exceljs";
import SalesReport from "../models/SalesReport.js";
import Branch from "../models/Branch.js";

const resolveOpeningStock = async (branchId, excludeReportId) => {
  const filter = { branch: branchId };
  if (excludeReportId) filter._id = { $ne: excludeReportId };
  const last = await SalesReport.findOne(filter).sort({ date: -1, createdAt: -1 });
  return last ? last.closingStock : 0;
};

export const createReport = async (req, res, next) => {
  try {
    const { date, branch, clients, transfers, otherSales, openingStock, notes } = req.body;
    if (!date || !branch || !Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ message: "Date, branch and at least one client entry are required" });
    }

    let branchDoc = await Branch.findOne({ name: branch.trim() });
    if (!branchDoc) branchDoc = await Branch.create({ name: branch.trim() });

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
    const reports = await SalesReport.find({ manager: req.user._id })
      .populate("branch", "name")
      .sort({ date: -1 });
    res.json(reports);
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

    if (req.user.role !== "admin" && String(report.manager._id) !== String(req.user._id)) {
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
