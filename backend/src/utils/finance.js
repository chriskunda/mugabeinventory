import mongoose from "mongoose";
import SalesReport from "../models/SalesReport.js";
import Expense from "../models/Expense.js";
import Return from "../models/Return.js";
import Purchase from "../models/Purchase.js";

const sum = (field) => [{ $group: { _id: null, total: { $sum: field } } }];

export const incomeStatement = async (start, end, branchId) => {
  const range = { $gte: start, $lt: end };
  const scoped = branchId ? { branch: new mongoose.Types.ObjectId(String(branchId)) } : {};
  const [sales, refunds, exp, buys] = await Promise.all([
    SalesReport.aggregate([{ $match: { date: range, ...scoped } }, ...sum("$grandTotal")]),
    Return.aggregate([{ $match: { date: range, ...scoped } }, ...sum("$refundAmount")]),
    branchId ? [] : Expense.aggregate([{ $match: { date: range } }, { $group: { _id: "$category", total: { $sum: "$amount" } } }]),
    branchId ? [] : Purchase.aggregate([{ $match: { date: range, status: "approved" } }, { $group: { _id: "$category", total: { $sum: "$amount" } } }]),
  ]);

  const grossSales = sales[0]?.total || 0;
  const refundTotal = refunds[0]?.total || 0;
  const byCategory = new Map();
  [...exp, ...buys].forEach((e) => byCategory.set(e._id, (byCategory.get(e._id) || 0) + e.total));
  const expenses = [...byCategory].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netSales = grossSales - refundTotal;
  return { grossSales, refunds: refundTotal, netSales, expenses, totalExpenses, net: netSales - totalExpenses };
};