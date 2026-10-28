import Expense from "../models/Expense.js";
import { getRange } from "../utils/period.js";

export const getExpenses = async (req, res, next) => {
  try {
    const { start, end } = getRange(req.query.period || "month", req.query.value);
    const list = await Expense.find({ date: { $gte: start, $lt: end } }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { category, amount, date, notes } = req.body;
    if (!category || !(Number(amount) > 0) || !date) {
      return res.status(400).json({ message: "Category, amount and date are required" });
    }
    const expense = await Expense.create({ category, amount: Number(amount), date, notes, createdBy: req.user._id });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const e = await Expense.findByIdAndDelete(req.params.id);
    if (!e) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    next(err);
  }
};