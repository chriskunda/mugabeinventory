import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    stocks: [
      {
        _id: false,
        branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
        qty: { type: Number, default: 0, min: 0 },
      },
    ],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);