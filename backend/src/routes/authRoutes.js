import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  requestDayAccess,
  setPhoto,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/request-day-access", requestDayAccess);
router.patch("/me/photo", protect, setPhoto);

export default router;
