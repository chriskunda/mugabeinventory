import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

export default mongoose.model("Rating", ratingSchema);