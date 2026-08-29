import express from "express";
import {
  createReport,
  getMyReports,
  getAllReports,
  getReportById,
  requestEdit,
  resolveEditRequest,
  updateReport,
  exportReportExcel,
  exportMonthExcel,
} from "../controllers/reportController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/mine", getMyReports);
router.get("/export-all", restrictTo("admin"), exportMonthExcel);
router.get("/", restrictTo("admin"), getAllReports);

router.post("/", createReport);
router.get("/:id", getReportById);
router.patch("/:id/request-edit", requestEdit);
router.patch("/:id/resolve-edit", restrictTo("admin"), resolveEditRequest);
router.put("/:id", updateReport);
router.get("/:id/export", restrictTo("admin"), exportReportExcel);

export default router;
