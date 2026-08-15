import SalesReport from "../models/SalesReport.js";
import Expense from "../models/Expense.js";

const monthRange = (year, monthIndex) => ({
  start: new Date(year, monthIndex, 1),
  end: new Date(year, monthIndex + 1, 1),
});

// GET /api/dashboard/sales-trend?months=6  (admin)
export const getSalesTrend = async (req, res, next) => {
  try {
    const months = Number(req.query.months) || 6;
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { start, end } = monthRange(d.getFullYear(), d.getMonth());

      const agg = await SalesReport.aggregate([
        { $match: { date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);

      results.push({
        month: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        sales: agg[0]?.total || 0,
      });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/income-statement?month=YYYY-MM  (admin)
export const getIncomeStatement = async (req, res, next) => {
  try {
    const [y, m] = (req.query.month || "").split("-").map(Number);
    const now = new Date();
    const year = y || now.getFullYear();
    const monthIndex = m ? m - 1 : now.getMonth();
    const { start, end } = monthRange(year, monthIndex);

    const revenueAgg = await SalesReport.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const expensesByCategory = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const totalExpenses = expensesByCategory.reduce((s, e) => s + e.total, 0);

    res.json({
      month: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      revenue,
      expenses: expensesByCategory.map((e) => ({ category: e._id, amount: e.total })),
      totalExpenses,
      net: revenue - totalExpenses,
    });
  } catch (err) {
    next(err);
  }
};
