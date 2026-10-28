import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import { ALLOWED_BRANCHES, findOrCreateBranch } from "./branches.js";

dotenv.config();
await connectDB();

const r = await User.updateMany({ status: { $exists: false } }, { $set: { status: "approved" } });
console.log(`Users given a status: ${r.modifiedCount}`);

for (const b of ALLOWED_BRANCHES) await findOrCreateBranch(b);
console.log("Branches in DB:", (await Branch.find()).map((b) => `"${b.name}"`).join(", "));
console.log("If you see duplicates like \"kinamba\", re-point those users/reports to the proper branch.");
process.exit(0);