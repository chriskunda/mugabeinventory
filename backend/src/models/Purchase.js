import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true, trim: true }, // Cost of goods, Transport, ...
    item: { type: String, trim: true },
    supplier: { type: String, trim: true },
    quantity: { type: Number, min: 0 },
    amount: { type: Number, required: true, min: 0 },       // total paid
    notes: { type: String, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);