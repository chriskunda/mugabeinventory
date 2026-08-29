import express from "express";
import {
  getManagers,
  createManager,
  getPendingManagers,
  approveManager,
  rejectManager,
} from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, restrictTo("admin"));
router.get("/managers/pending", getPendingManagers);
router.get("/managers", getManagers);
router.post("/managers", createManager);
router.patch("/managers/:id/approve", approveManager);
router.patch("/managers/:id/reject", rejectManager);

export default router;
