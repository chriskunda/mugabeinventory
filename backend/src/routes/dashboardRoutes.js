import express from "express";
import { getSalesTrend, getIncomeStatement } from "../controllers/dashboardController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, restrictTo("admin"));
router.get("/sales-trend", getSalesTrend);
router.get("/income-statement", getIncomeStatement);

export default router;
