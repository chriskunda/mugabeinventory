// Run once with: npm run seed:admin
// Creates the very first admin account, since the public register form
// always creates managers on purpose (see authController.js).
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  const admin = await User.create({
    name: process.env.SEED_ADMIN_NAME || "Admin",
    email,
    password: process.env.SEED_ADMIN_PASSWORD || "changeme123",
    role: "admin",
  });

  console.log(`Admin created: ${admin.email} (password: ${process.env.SEED_ADMIN_PASSWORD || "changeme123"})`);
  console.log("Log in and change this password immediately.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
