import express from "express";
import { getProducts, createProduct, adjustStock, deleteProduct } from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, restrictTo("admin")); // managers can't touch this at all
router.get("/", getProducts);
router.post("/", createProduct);
router.patch("/:id/stock", adjustStock);
router.delete("/:id", deleteProduct);
export default router;