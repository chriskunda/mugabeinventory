import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import SalesReport from "../models/SalesReport.js";
import TransferNote from "../models/TransferNote.js";

dotenv.config();
await connectDB();

const r = await User.updateMany({ role: "admin" }, { $unset: { branch: 1 } });
console.log(`Admins detached from a branch: ${r.modifiedCount}`);

const main = await Branch.findOne({ name: "Main" });
if (main) {
  const used =
    (await User.countDocuments({ branch: main._id })) +
    (await SalesReport.countDocuments({ branch: main._id })) +
    (await TransferNote.countDocuments({ $or: [{ fromBranch: main._id }, { toBranch: main._id }] }));
  if (used === 0) {
    await main.deleteOne();
    console.log('Deleted the "Main" branch.');
  } else {
    console.log(`"Main" is still used by ${used} record(s); re-point them, then run this again.`);
  }
}
process.exit(0);