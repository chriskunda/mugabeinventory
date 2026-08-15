import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    category: { type: String, required: true, trim: true }, // e.g. "Rent", "Cost of goods", "Salaries"
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
