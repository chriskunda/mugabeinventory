import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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