import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema(
  {
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["day_off", "branch", "leave", "restock"], required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    date: { type: String, required: true },   // start day (YYYY-MM-DD)
    endDate: String,                          // last day: set by admin for "branch", by manager for "leave"
    product: { type: String, trim: true },    // restock
    quantity: { type: Number, min: 1 },       // restock
    reason: { type: String, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true }
);
accessRequestSchema.index({ manager: 1, kind: 1, date: 1 });

export default mongoose.model("AccessRequest", accessRequestSchema);