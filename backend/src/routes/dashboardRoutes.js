import express from "express";
import {
  getSalesTrend,
  getIncomeStatement,
  exportIncomeExcel,
  exportIncomePdf,
} from "../controllers/dashboardController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, restrictTo("admin"));
router.get("/sales-trend", getSalesTrend);
router.get("/income-statement", getIncomeStatement);
router.get("/income-statement/excel", exportIncomeExcel);
router.get("/income-statement/pdf", exportIncomePdf);

export default router;
