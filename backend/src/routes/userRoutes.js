import express from "express";
import {
  getManagers, createManager, getPendingManagers, approveManager, rejectManager,
  setAccess, setDaysOff, assignBranch, getPasswordRequests, resolvePasswordRequest,
} from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, restrictTo("admin"));
router.get("/password-requests", getPasswordRequests);
router.get("/managers/pending", getPendingManagers);
router.get("/managers", getManagers);
router.post("/managers", createManager);
router.patch("/managers/:id/approve", approveManager);
router.patch("/managers/:id/reject", rejectManager);
router.patch("/managers/:id/access", setAccess);
router.patch("/managers/:id/days-off", setDaysOff);
router.patch("/managers/:id/branch", assignBranch);
router.patch("/managers/:id/password-request", resolvePasswordRequest);
export default router;