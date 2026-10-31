const TZ = "Africa/Kigali";

export const todayKigali = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
export const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1;

export const formatStamp = (d) => {
  const x = new Date(d);
  const date = x.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  const time = x.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
  return `On ${date}, ${time}`;
};

export const describeRequest = (r) =>
  r.kind === "leave" ? `Time off ${r.date} to ${r.endDate} (${daysBetween(r.date, r.endDate)} days)`
  : r.kind === "restock" ? `Restock: ${r.quantity} x ${r.product}`
  : r.kind === "branch" ? `Work at ${r.branch?.name} from ${r.date}${r.endDate && r.endDate !== r.date ? ` to ${r.endDate}` : ""}`
  : `Work today (${r.date}) on a day off`;