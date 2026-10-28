import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import connectDB from "./src/config/db.js";
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import transferRoutes from "./src/routes/transferRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import expenseRoutes from "./src/routes/expenseRoutes.js";
import returnRoutes from "./src/routes/returnRoutes.js";
import goalRoutes from "./src/routes/goalRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import { evaluateGoals } from "./src/controllers/goalController.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // required so the browser sends/receives the httpOnly cookie
  })
);
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  evaluateGoals().catch(console.error);
  setInterval(() => evaluateGoals().catch(console.error), 60 * 60 * 1000);
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
};

start();
