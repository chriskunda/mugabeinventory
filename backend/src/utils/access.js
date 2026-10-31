import AccessRequest from "../models/AccessRequest.js";

export const todayKigali = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kigali" });
export const weekdayOf = (ymd) => new Date(`${ymd}T12:00:00Z`).getUTCDay();
export const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1;

// weekly day off OR approved time off covering today
export const isOffToday = async (user) => {
  if (user.role !== "manager") return false;
  const today = todayKigali();
  if (user.daysOff?.includes(weekdayOf(today))) return true;
  return !!(await AccessRequest.exists({
    manager: user._id, kind: "leave", status: "approved", date: { $lte: today }, endDate: { $gte: today },
  }));
};

export const offDayBlocked = async (user) => {
  if (!(await isOffToday(user))) return false;
  const ok = await AccessRequest.exists({ manager: user._id, kind: "day_off", date: todayKigali(), status: "approved" });
  return !ok;
};

// approved access to another branch on a given day (admin sets the duration)
export const branchApprovedOn = (manager, branch, ymd) =>
  AccessRequest.exists({
    manager, kind: "branch", branch, status: "approved", date: { $lte: ymd },
    $or: [{ endDate: { $gte: ymd } }, { endDate: { $exists: false }, date: ymd }],
  });