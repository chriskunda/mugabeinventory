import express from "express";
import { getNotifications, readAllNotifications } from "../controllers/goalController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();
router.use(protect);
router.get("/", getNotifications);
router.post("/read-all", readAllNotifications);
export default router;