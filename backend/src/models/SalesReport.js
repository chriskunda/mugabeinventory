import mongoose from "mongoose";

const lineSchema = new mongoose.Schema(
  {
    product: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const salesReportSchema = new mongoose.Schema(
  {
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    date: { type: Date, required: true },
    lines: { type: [lineSchema], validate: (v) => v.length > 0 },
    total: { type: Number, default: 0 },
    notes: { type: String, trim: true },

    // submitted      -> locked, normal state after creation
    // edit_requested -> manager asked to edit, waiting on admin
    // editable       -> admin approved the edit, manager can update once
    status: {
      type: String,
      enum: ["submitted", "edit_requested", "editable"],
      default: "submitted",
    },
    editRequest: {
      reason: { type: String, trim: true },
      requestedAt: Date,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolvedAt: Date,
      approved: Boolean,
    },
  },
  { timestamps: true }
);

salesReportSchema.pre("save", function (next) {
  this.total = this.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  next();
});

export default mongoose.model("SalesReport", salesReportSchema);
