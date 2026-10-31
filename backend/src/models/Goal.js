import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["month", "year"], required: true },
    period: { type: String, required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // empty = all branches combined
    target: { type: Number, required: true, min: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    evaluated: { type: Boolean, default: false },
    result: { status: String, actual: Number, percent: Number, evaluatedAt: Date },
  },
  { timestamps: true }
);
goalSchema.index({ type: 1, period: 1, branch: 1 }, { unique: true });

export default mongoose.model("Goal", goalSchema);