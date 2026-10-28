import { useEffect, useState } from "react";
import { goalsApi } from "../api/admin";
import "./AdminDashboard.css";

const now = new Date();
const fmt = (n) => `${Math.round(n || 0).toLocaleString()} RWF`;
const defaultPeriod = (type) => (type === "month" ? now.toISOString().slice(0, 7) : String(now.getFullYear()));

const AdminGoals = () => {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ type: "month", period: defaultPeriod("month"), target: "" });
  const [error, setError] = useState("");

  const load = () => goalsApi.list().then(setGoals).catch((e) => setError(e.message));
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await goalsApi.save({ ...form, target: Number(form.target) });
      setForm((f) => ({ ...f, target: "" }));
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Goals</h1><p>Set a sales target. You'll be notified when the month or year ends.</p></div>
      </div>

      <div className="db-panel"><div className="db-panel-body">
        <form onSubmit={save} className="db-toolbar" style={{ marginTop: 14 }}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, period: defaultPeriod(e.target.value) })}>
            <option value="month">Monthly goal</option>
            <option value="year">Yearly goal</option>
          </select>
          {form.type === "month"
            ? <input type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
            : <input type="number" min="2000" max="2100" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required style={{ width: 90 }} />}
          <input type="number" min="1" placeholder="Target (RWF)" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} required />
          <button className="db-btn db-btn-primary">Set goal</button>
        </form>
        {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
      </div></div>

      <div className="db-panel"><div className="db-panel-body">
        {goals.length === 0 ? <div className="db-empty">No goals yet.</div> : (
          <table className="db-table">
            <thead><tr><th>Period</th><th>Target</th><th>Net sales</th><th>Progress</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {goals.map((g) => (
                <tr key={g._id}>
                  <td data-label="Period">{g.period} ({g.type})</td>
                  <td data-label="Target" className="db-num">{fmt(g.target)}</td>
                  <td data-label="Net sales" className="db-num">{fmt(g.actual)}</td>
                  <td data-label="Progress" className="db-num">{g.percent}%</td>
                  <td data-label="Status"><span className={`db-badge ${g.status}`}>{g.status.replace("_", " ")}</span></td>
                  <td>{!g.evaluated && (
                    <button className="db-btn db-btn-ghost" onClick={async () => { await goalsApi.remove(g._id); load(); }}>Delete</button>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div></div>
    </div>
  );
};
export default AdminGoals;