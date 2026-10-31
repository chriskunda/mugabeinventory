import User from "../models/User.js";
import Notification from "../models/Notification.js";
import ReminderLog from "../models/ReminderLog.js";
import { todayKigali } from "./access.js";

export const reconciliationReminder = async () => {
  const [y, m, d] = todayKigali().split("-").map(Number);
  if (d < new Date(y, m, 0).getDate() - 2) return;

  try {
    await ReminderLog.create({ key: `reconcile-${y}-${String(m).padStart(2, "0")}` });
  } catch (e) {
    if (e.code === 11000) return; // already sent this month
    throw e;
  }
  const admins = await User.find({ role: "admin", active: true }).select("_id");
  await Notification.insertMany(
    admins.map((a) => ({
      user: a._id,
      kind: "info",
      title: "Time to reconcile your stock",
      message: "Count the physical stock at each branch and compare it with the system. Open Products, then Reconcile.",
    }))
  );
};