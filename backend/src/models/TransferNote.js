import mongoose from "mongoose";

const lineSchema = new mongoose.Schema(
  {
    product: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const transferNoteSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    toBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    date: { type: Date, required: true },
    lines: { type: [lineSchema], validate: (v) => v.length > 0 },
    status: { type: String, enum: ["pending", "received"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("TransferNote", transferNoteSchema);
