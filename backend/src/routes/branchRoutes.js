import express from "express";
import { listBranches, branchOverview, createBranch, renameBranch, exportBranchExcel, exportBranchPdf, deleteBranch } from "../controllers/branchController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.get("/", listBranches); // public
router.use(protect, restrictTo("admin"));
router.get("/overview", branchOverview);
router.post("/", createBranch);
router.patch("/:id", renameBranch);
router.get("/:id/export/excel", exportBranchExcel);
router.get("/:id/export/pdf", exportBranchPdf);
router.post("/:id/delete", deleteBranch);
export default router;