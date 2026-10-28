import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    tireName: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    dot: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    // "good" = can go back into stock, "damaged" = cannot
    condition: { type: String, enum: ["good", "damaged"], required: true },
    refundAmount: { type: Number, default: 0, min: 0 },
    reason: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Return", returnSchema);