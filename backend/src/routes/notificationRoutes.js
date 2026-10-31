import express from "express";
import {
  getNotifications, readAllNotifications, deleteNotification, clearNotifications,
} from "../controllers/goalController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();
router.use(protect);
router.get("/", getNotifications);
router.post("/read-all", readAllNotifications);
router.delete("/", clearNotifications);
router.delete("/:id", deleteNotification);
export default router;