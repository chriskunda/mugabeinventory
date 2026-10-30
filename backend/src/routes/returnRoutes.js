import express from "express";
import { createReturn, getReturns, getReturnsSummary } from "../controllers/returnController.js";
import { protect, restrictTo } from "../middleware/auth.js";
const router = express.Router();
router.use(protect, restrictTo("admin"));
router.get("/summary", getReturnsSummary);
router.get("/", getReturns);
router.post("/", createReturn);
export default router;