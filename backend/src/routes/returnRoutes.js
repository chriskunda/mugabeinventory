import express from "express";
import { createReturn, getReturns, getReturnsSummary } from "../controllers/returnController.js";
import { protect, restrictTo } from "../middleware/auth.js";
const router = express.Router();
router.use(protect);
router.get("/summary", restrictTo("admin"), getReturnsSummary);
router.get("/", getReturns);
router.post("/", createReturn);
export default router;