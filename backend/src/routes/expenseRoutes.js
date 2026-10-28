import express from "express";
import { getExpenses, createExpense, deleteExpense } from "../controllers/expenseController.js";
import { protect, restrictTo } from "../middleware/auth.js";
const router = express.Router();
router.use(protect, restrictTo("admin"));
router.get("/", getExpenses);
router.post("/", createExpense);
router.delete("/:id", deleteExpense);
export default router;