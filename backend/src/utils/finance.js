import SalesReport from "../models/SalesReport.js";
import Expense from "../models/Expense.js";
import Return from "../models/Return.js";

export const incomeStatement = async (start, end) => {
  const range = { $gte: start, $lt: end };
  const [sales, refunds, exp] = await Promise.all([
    SalesReport.aggregate([{ $match: { date: range } }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
    Return.aggregate([{ $match: { date: range } }, { $group: { _id: null, total: { $sum: "$refundAmount" } } }]),
    Expense.aggregate([
      { $match: { date: range } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
  ]);
  const grossSales = sales[0]?.total || 0;
  const refundTotal = refunds[0]?.total || 0;
  const expenses = exp.map((e) => ({ category: e._id, amount: e.total }));
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netSales = grossSales - refundTotal;
  return { grossSales, refunds: refundTotal, netSales, expenses, totalExpenses, net: netSales - totalExpenses };
};