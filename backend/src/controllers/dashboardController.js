import ExcelJS from "exceljs";
import SalesReport from "../models/SalesReport.js";
import Branch from "../models/Branch.js";
import { ALLOWED_BRANCHES } from "../utils/branches.js";
import { getRange } from "../utils/period.js";
import { incomeStatement } from "../utils/finance.js";
import { startPdf, line, row, fmt } from "../utils/pdf.js";

const build = async (period, value) => {
  if (!["month", "quarter", "year"].includes(period)) period = "month";
  const { start, end, label } = getRange(period, value);
  const statement = await incomeStatement(start, end);
  const breakdown = [];
  if (period !== "month") {
    for (let d = new Date(start); d < end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      breakdown.push({ month: d.toLocaleString("en", { month: "long" }), ...(await incomeStatement(d, next)) });
    }
  }
  return { period, label, ...statement, breakdown };
};

export const getSalesTrend = async (req, res, next) => {
  try {
    const months = Number(req.query.months) || 6;
    const now = new Date();
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const agg = await SalesReport.aggregate([
        { $match: { date: { $gte: d, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } }, // was "$total" (bug)
      ]);
      results.push({ month: d.toLocaleString("en", { month: "short" }), year: d.getFullYear(), sales: agg[0]?.total || 0 });
    }
    res.json(results);
  } catch (err) {
    next(err);
  }
};

export const getBranchSummary = async (req, res, next) => {
  try {
    const { start, end } = getRange("month", req.query.month);
    const rows = await SalesReport.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: "$branch", sales: { $sum: "$grandTotal" }, tyres: { $sum: "$totalTyres" }, reports: { $sum: 1 } } },
    ]);
    const branches = await Branch.find({ name: { $in: ALLOWED_BRANCHES } });
    res.json(
      ALLOWED_BRANCHES.map((name) => {
        const b = branches.find((x) => x.name === name);
        const r = b && rows.find((x) => String(x._id) === String(b._id));
        return { branch: name, sales: r?.sales || 0, tyres: r?.tyres || 0, reports: r?.reports || 0 };
      })
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/income-statement?period=month|quarter|year&value=2026-10 | 2026-Q4 | 2026
export const getIncomeStatement = async (req, res, next) => {
  try {
    res.json(await build(req.query.period, req.query.value));
  } catch (err) {
    next(err);
  }
};

export const exportIncomeExcel = async (req, res, next) => {
  try {
    const d = await build(req.query.period, req.query.value);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Income statement");
    ws.columns = [{ width: 34 }, { width: 18 }, { width: 18 }, { width: 18 }];

    ws.addRow([`Income statement — ${d.label}`]).font = { bold: true, size: 14 };
    ws.addRow([]);
    ws.addRow(["Gross sales", d.grossSales]);
    ws.addRow(["Less: returns / refunds", -d.refunds]);
    ws.addRow(["Net sales", d.netSales]).font = { bold: true };
    ws.addRow([]);
    ws.addRow(["Expenses"]).font = { bold: true };
    d.expenses.forEach((e) => ws.addRow([e.category, e.amount]));
    ws.addRow(["Total expenses", d.totalExpenses]).font = { bold: true };
    ws.addRow([]);
    ws.addRow([d.net >= 0 ? "Net profit" : "Net loss", Math.abs(d.net)]).font = { bold: true };

    if (d.breakdown.length) {
      ws.addRow([]);
      ws.addRow(["Month", "Net sales", "Expenses", "Net"]).font = { bold: true };
      d.breakdown.forEach((b) => ws.addRow([b.month, b.netSales, b.totalExpenses, b.net]));
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="income-statement-${d.label}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

export const exportIncomePdf = async (req, res, next) => {
  try {
    const d = await build(req.query.period, req.query.value);
    const doc = startPdf(res, `income-statement-${d.label}.pdf`);

    line(doc, `Income statement — ${d.label}`, { bold: true, size: 16 });
    doc.moveDown();
    row(doc, "Gross sales", fmt(d.grossSales));
    row(doc, "Less: returns / refunds", `-${fmt(d.refunds)}`);
    row(doc, "Net sales", fmt(d.netSales), { bold: true });
    doc.moveDown();
    line(doc, "Expenses", { bold: true });
    d.expenses.forEach((e) => row(doc, e.category, fmt(e.amount)));
    row(doc, "Total expenses", fmt(d.totalExpenses), { bold: true });
    doc.moveDown();
    row(doc, d.net >= 0 ? "Net profit" : "Net loss", fmt(Math.abs(d.net)), { bold: true });

    if (d.breakdown.length) {
      doc.moveDown();
      line(doc, "Monthly breakdown", { bold: true });
      d.breakdown.forEach((b) => row(doc, b.month, `${fmt(b.netSales)} / ${fmt(b.totalExpenses)} / ${fmt(b.net)}`));
      line(doc, "(net sales / expenses / net)", { size: 9 });
    }
    doc.end();
  } catch (err) {
    next(err);
  }
};