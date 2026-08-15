import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", getProducts);
router.post("/", restrictTo("admin"), createProduct);
router.patch("/:id", restrictTo("admin"), updateProduct);
router.delete("/:id", restrictTo("admin"), deleteProduct);

export default router;
