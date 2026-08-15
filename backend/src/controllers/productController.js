import Product from "../models/Product.js";

// GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ active: true }).populate("branch", "name");
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// POST /api/products (admin only)
export const createProduct = async (req, res, next) => {
  try {
    const { name, sku, category, price, stock, branch } = req.body;
    if (!name || price == null || !branch) {
      return res.status(400).json({ message: "Name, price and branch are required" });
    }
    const product = await Product.create({ name, sku, category, price, stock, branch });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/products/:id (admin only)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id (admin only) — soft delete so historical reports keep meaning
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product removed" });
  } catch (err) {
    next(err);
  }
};
