import ExcelJS from "exceljs";
import SalesReport from "../models/SalesReport.js";

// POST /api/reports  (manager or admin — both run a branch)
export const createReport = async (req, res, next) => {
  try {
    const { date, lines, notes } = req.body;
    if (!date || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: "Date and at least one product line are required" });
    }

    const report = await SalesReport.create({
      manager: req.user._id,
      branch: req.user.branch._id,
      date,
      lines,
      notes,
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/mine  (manager — their own reports)
export const getMyReports = async (req, res, next) => {
  try {
    const reports = await SalesReport.find({ manager: req.user._id }).sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports  (admin — all reports, optional ?managerId= & ?month=YYYY-MM filters)
export const getAllReports = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.managerId) filter.manager = req.query.managerId;
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

// PATCH /api/reports/:id/request-edit  (manager — asks admin for permission to edit)
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

// PATCH /api/reports/:id/resolve-edit  (admin — approve or reject an edit request)
// body: { approve: boolean }
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

// PUT /api/reports/:id  (manager — only allowed once status is "editable")
export const updateReport = async (req, res, next) => {
  try {
    const report = await SalesReport.findOne({ _id: req.params.id, manager: req.user._id });
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (report.status !== "editable") {
      return res.status(403).json({ message: "This report is locked. Request admin approval to edit it." });
    }

    const { date, lines, notes } = req.body;
    if (date) report.date = date;
    if (Array.isArray(lines) && lines.length) report.lines = lines;
    if (notes !== undefined) report.notes = notes;
    report.status = "submitted"; // re-lock once the correction is saved
    await report.save();

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/:id/export  (admin — download a single report as .xlsx)
export const exportReportExcel = async (req, res, next) => {
  try {
    const report = await SalesReport.findById(req.params.id)
      .populate("manager", "name")
      .populate("branch", "name");
    if (!report) return res.status(404).json({ message: "Report not found" });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Product", key: "product", width: 28 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "Unit Price", key: "price", width: 14 },
      { header: "Line Total", key: "lineTotal", width: 14 },
    ];

    sheet.addRow([`Branch: ${report.branch?.name}`]);
    sheet.addRow([`Manager: ${report.manager?.name}`]);
    sheet.addRow([`Date: ${report.date.toISOString().slice(0, 10)}`]);
    sheet.addRow([]);
    sheet.addRow(["Product", "Qty", "Unit Price", "Line Total"]).font = { bold: true };

    report.lines.forEach((l) => {
      sheet.addRow([l.product, l.qty, l.price, l.qty * l.price]);
    });

    sheet.addRow([]);
    sheet.addRow(["", "", "Total", report.total]).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${report.date.toISOString().slice(0, 10)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/export-all  (admin — every report for a given month as one .xlsx)
export const exportMonthExcel = async (req, res, next) => {
  try {
    const { month } = req.query; // "YYYY-MM"
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
      { header: "Status", key: "status", width: 16 },
      { header: "Total", key: "total", width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };

    reports.forEach((r) => {
      sheet.addRow({
        date: r.date.toISOString().slice(0, 10),
        branch: r.branch?.name,
        manager: r.manager?.name,
        status: r.status,
        total: r.total,
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
