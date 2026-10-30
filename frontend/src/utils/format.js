const TZ = "Africa/Kigali";

export const todayKigali = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

export const formatStamp = (d) => {
  const x = new Date(d);
  const date = x.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  const time = x.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
  return `On ${date}, ${time}`;
};
