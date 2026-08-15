/**
 * value: string already formatted for display, e.g. "12,400,000 RWF"
 * trend: { direction: "up" | "down", label: "vs last month" } — optional
 */
const StatCard = ({ label, value, trend }) => (
  <div className="db-stat-card">
    <div className="db-stat-label">
      <span>{label}</span>
    </div>
    <div className="db-stat-value">{value}</div>
    {trend && (
      <div className={`db-stat-trend ${trend.direction}`}>
        <span>{trend.direction === "up" ? "▲" : "▼"} {trend.value}</span>
        <span className="ctx">{trend.label}</span>
      </div>
    )}
  </div>
);

export default StatCard;
