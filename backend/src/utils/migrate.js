import dotenv from "dotenv";
import connectDB from "../config/db.js";
import TransferNote from "../models/TransferNote.js";

dotenv.config();
await connectDB();
const r = await TransferNote.collection.updateMany({ status: "pending" }, { $set: { status: "sent" } });
console.log(`Transfer notes moved to "sent": ${r.modifiedCount}`);
process.exit(0);