import express from "express";
import { getGoals, saveGoal, deleteGoal } from "../controllers/goalController.js";
import { protect, restrictTo } from "../middleware/auth.js";
const router = express.Router();
router.use(protect, restrictTo("admin"));
router.get("/", getGoals);
router.post("/", saveGoal);
router.delete("/:id", deleteGoal);
export default router;