import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["month", "year"], required: true },
    period: { type: String, required: true }, // "2026-10" or "2026"
    target: { type: Number, required: true, min: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    evaluated: { type: Boolean, default: false },
    result: { status: String, actual: Number, percent: Number, evaluatedAt: Date },
  },
  { timestamps: true }
);
goalSchema.index({ type: 1, period: 1 }, { unique: true });

export default mongoose.model("Goal", goalSchema);