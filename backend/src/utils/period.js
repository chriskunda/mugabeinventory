export const getRange = (period, value) => {
  const now = new Date();
  if (period === "year") {
    const y = Number(value) || now.getFullYear();
    return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1), label: `${y}` };
  }
  if (period === "quarter") {
    const [ys, q] = String(value || "").split("-Q");
    const y = Number(ys) || now.getFullYear();
    const qi = Number(q) || Math.floor(now.getMonth() / 3) + 1;
    return { start: new Date(y, (qi - 1) * 3, 1), end: new Date(y, qi * 3, 1), label: `Q${qi} ${y}` };
  }
  const [ys, ms] = String(value || "").split("-").map(Number);
  const y = ys || now.getFullYear();
  const m = ms ? ms - 1 : now.getMonth();
  return {
    start: new Date(y, m, 1),
    end: new Date(y, m + 1, 1),
    label: `${y}-${String(m + 1).padStart(2, "0")}`,
  };
};