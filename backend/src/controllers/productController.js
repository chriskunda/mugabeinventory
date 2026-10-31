import Product from "../models/Product.js";
import Branch from "../models/Branch.js";
import { findOrCreateBranch } from "../utils/branches.js";

const DEFAULT_PRODUCTS = ["Used tyres", "New tyres", "Perfumes", "Other accessories"];

const loadBranches = () => Branch.find().sort({ createdAt: 1 });

const shape = (p, branches) => {
  const stocks = branches.map((b) => ({
    branch: b.name,
    qty: p.stocks.find((s) => String(s.branch) === String(b._id))?.qty || 0,
  }));
  return {
    id: p._id,
    name: p.name,
    stocks,
    total: stocks.reduce((s, x) => s + x.qty, 0),
    unitCost: p.unitCost || 0,
    unitPrice: p.unitPrice || 0,
  };
};

// GET /api/products (admin)  — seeds the four default products the first time
export const getProducts = async (req, res, next) => {
  try {
    const branches = await loadBranches();
    if ((await Product.countDocuments()) === 0) {
      await Product.insertMany(
        DEFAULT_PRODUCTS.map((name) => ({ name, stocks: branches.map((b) => ({ branch: b._id, qty: 0 })) }))
      );
    }
    const products = await Product.find({ active: true }).sort({ createdAt: 1 });
    res.json(products.map((p) => shape(p, branches)));
  } catch (err) {
    next(err);
  }
};

// POST /api/products  { name, stocks?: { Kimironko: 5, ... } }
export const createProduct = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Product name is required" });
    const dupe = await Product.findOne({ name }).collation({ locale: "en", strength: 2 });
    if (dupe) return res.status(409).json({ message: "That product already exists" });

    const branches = await loadBranches();
    const product = await Product.create({
      name,
      unitCost: Math.max(0, Number(req.body.unitCost) || 0),
      unitPrice: Math.max(0, Number(req.body.unitPrice) || 0),
      stocks: branches.map((b) => ({
        branch: b._id,
        qty: Math.max(0, Math.floor(Number(req.body.stocks?.[b.name]) || 0)),
      })),
    });
    res.status(201).json(shape(product, branches));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/products/:id/stock  { branch, action: "add"|"remove"|"set", quantity }
export const adjustStock = async (req, res, next) => {
  try {
    const { branch, action, quantity } = req.body;
    const qty = Number(quantity);
    if (!["add", "remove", "set"].includes(action) || !Number.isInteger(qty) || qty < 0) {
      return res.status(400).json({ message: "Choose an action and enter a whole number of 0 or more" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const branchDoc = await findOrCreateBranch(branch);
    let entry = product.stocks.find((s) => String(s.branch) === String(branchDoc._id));
    if (!entry) {
      product.stocks.push({ branch: branchDoc._id, qty: 0 });
      entry = product.stocks[product.stocks.length - 1];
    }

    const next_ = action === "add" ? entry.qty + qty : action === "remove" ? entry.qty - qty : qty;
    if (next_ < 0) {
      return res.status(400).json({ message: `${branchDoc.name} only has ${entry.qty} in stock` });
    }
    entry.qty = next_;
    await product.save();

    res.json(shape(product, await loadBranches()));
  } catch (err) {
    next(err);
  }
};

export const setValue = async (req, res, next) => {
  try {
    const unitCost = Number(req.body.unitCost);
    const unitPrice = Number(req.body.unitPrice || 0);
    if (!(unitCost >= 0) || !(unitPrice >= 0)) {
      return res.status(400).json({ message: "Enter the cost per unit (0 or more)" });
    }
    const p = await Product.findByIdAndUpdate(req.params.id, { unitCost, unitPrice }, { new: true });
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json(shape(p, await loadBranches()));
  } catch (err) {
    next(err);
  }
};

// POST /api/products/reconcile  { branch, counts: [{ id, counted }] }: sets the system stock to the counted numbers
export const reconcile = async (req, res, next) => {
  try {
    const branch = await findOrCreateBranch(req.body.branch);
    const counts = Array.isArray(req.body.counts) ? req.body.counts : [];
    if (counts.some((c) => !c || !Number.isInteger(Number(c.counted)) || Number(c.counted) < 0)) {
      return res.status(400).json({ message: "Every count must be a whole number of 0 or more" });
    }
    const changes = [];
    for (const c of counts) {
      const p = await Product.findById(c.id);
      if (!p) continue;
      let entry = p.stocks.find((s) => String(s.branch) === String(branch._id));
      if (!entry) {
        p.stocks.push({ branch: branch._id, qty: 0 });
        entry = p.stocks[p.stocks.length - 1];
      }
      const counted = Number(c.counted);
      changes.push({ product: p.name, system: entry.qty, counted, diff: counted - entry.qty });
      entry.qty = counted;
      await p.save();
    }
    res.json({ branch: branch.name, changes });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product removed" });
  } catch (err) {
    next(err);
  }
};