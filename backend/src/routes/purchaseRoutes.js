import express from "express";
import { createPurchase, getPurchases, resolvePurchase, deletePurchase } from "../controllers/purchaseController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/", getPurchases);
router.post("/", createPurchase);
router.patch("/:id/resolve", restrictTo("admin"), resolvePurchase);
router.delete("/:id", restrictTo("admin"), deletePurchase);
export default router;