import mongoose from "mongoose";

const tireLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    dot: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const clientEntrySchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, trim: true },
    tires: { type: [tireLineSchema], validate: (v) => v.length > 0 },
  },
  { _id: false }
);

const otherSaleSchema = new mongoose.Schema(
  {
    item: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const salesReportSchema = new mongoose.Schema(
  {
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    date: { type: Date, required: true },
    sentAt: { type: Date, default: Date.now },

    clients: { type: [clientEntrySchema], validate: (v) => v.length > 0 },
    transfers: { type: [String], default: [] },
    otherSales: { type: [otherSaleSchema], default: [] },

    openingStock: { type: Number, default: 0 },
    notes: { type: String, trim: true },

    totalTyres: { type: Number, default: 0 },
    tyresTotal: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    otherSalesTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    closingStock: { type: Number, default: 0 },

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
  let totalTyres = 0;
  let tyresTotal = 0;

  this.clients.forEach((c) => {
    c.tires.forEach((t) => {
      totalTyres += 1;
      tyresTotal += t.price;
    });
  });

  const otherSalesTotal = this.otherSales.reduce((s, o) => s + o.price, 0);

  this.totalTyres = totalTyres;
  this.tyresTotal = tyresTotal;
  this.average = totalTyres > 0 ? Math.round((tyresTotal / totalTyres) * 100) / 100 : 0;
  this.otherSalesTotal = otherSalesTotal;
  this.grandTotal = tyresTotal + otherSalesTotal;
  this.closingStock = (this.openingStock || 0) - totalTyres;

  next();
});

export default mongoose.model("SalesReport", salesReportSchema);
