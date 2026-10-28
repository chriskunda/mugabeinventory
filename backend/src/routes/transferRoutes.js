import express from "express";
import {
  createTransfer,
  getTransfers,
  markReceived,
  exportTransferPdf,
} from "../controllers/transferController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", getTransfers);
router.post("/", createTransfer);
router.patch("/:id/receive", markReceived);
router.get("/:id/pdf", exportTransferPdf);

export default router;
