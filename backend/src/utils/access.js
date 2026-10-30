import AccessRequest from "../models/AccessRequest.js";

export const todayKigali = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kigali" }); // 2026-10-30
export const weekdayOf = (ymd) => new Date(`${ymd}T12:00:00Z`).getUTCDay(); // 0 = Sunday

// true when it's the manager's day off and the admin hasn't approved today
export const offDayBlocked = async (user) => {
  if (user.role !== "manager" || !user.daysOff?.length) return false;
  const today = todayKigali();
  if (!user.daysOff.includes(weekdayOf(today))) return false;
  const ok = await AccessRequest.exists({ manager: user._id, kind: "day_off", date: today, status: "approved" });
  return !ok;
};