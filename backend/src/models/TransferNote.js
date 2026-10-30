import mongoose from "mongoose";

const lineSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      trim: true,
      required: function () { return !this.product; },
    },
    product: { type: String, trim: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const transferNoteSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    toBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    date: { type: Date, default: Date.now },
    lines: { type: [lineSchema], validate: (v) => v.length > 0 },
    status: { type: String, enum: ["pending", "received"], default: "pending" },
    size: { type: String, trim: true },
    product: { type: String, trim: true },
    qty: { type: Number, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("TransferNote", transferNoteSchema);
