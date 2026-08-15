import express from "express";
import { createTransfer, getTransfers, markReceived } from "../controllers/transferController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", getTransfers);
router.post("/", createTransfer);
router.patch("/:id/receive", markReceived);

export default router;
