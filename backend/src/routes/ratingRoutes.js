import express from "express";
import { myRatings } from "../controllers/ratingController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.get("/mine", protect, restrictTo("manager"), myRatings);
export default router;