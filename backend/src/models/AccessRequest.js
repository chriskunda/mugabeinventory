import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema(
  {
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["day_off", "branch"], required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // for kind "branch"
    date: { type: String, required: true }, // YYYY-MM-DD
    reason: { type: String, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true }
);
accessRequestSchema.index({ manager: 1, kind: 1, date: 1 });

export default mongoose.model("AccessRequest", accessRequestSchema);