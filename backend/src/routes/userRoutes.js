import express from "express";
import { getManagers, createManager } from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, restrictTo("admin"));
router.get("/managers", getManagers);
router.post("/managers", createManager);

export default router;
