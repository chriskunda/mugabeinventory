import mongoose from "mongoose";

export default mongoose.model(
  "ReminderLog",
  new mongoose.Schema({ key: { type: String, required: true, unique: true } }, { timestamps: true })
);