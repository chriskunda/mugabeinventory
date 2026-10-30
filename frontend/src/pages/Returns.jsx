import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { returnsApi } from "../api/admin";
import Modal from "../components/dashboard/Modal";
import Select from "../components/ui/Select";
import DatePicker from "../components/ui/DatePicker";
import { BRANCHES } from "../components/dashboard/DailyReportForm";
import "./AdminDashboard.css";

const today = () => new Date().toISOString().slice(0, 10);
const blank = { date: today(), tireName: "", size: "", dot: "", quantity: 1, condition: "good", refundAmount: "", reason: "" };

const Returns = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [month, setMonth] = useState(today().slice(0, 7));
  const [branch, setBranch] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");

  const load = () => {
    returnsApi.list({ month, ...(branch && { branch }) }).then(setRows).catch((e) => setError(e.message));
    if (isAdmin) returnsApi.summary(month).then(setSummary).catch((e) => setError(e.message));
  };
  useEffect(load, [month, branch, isAdmin]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await returnsApi.create({ ...form, quantity: Number(form.quantity), refundAmount: Number(form.refundAmount) || 0 });
      setOpen(false);
      setForm(blank);
      load();
    } catch (err) {
      setFormError(err.message);
    }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Sales returns</h1>
          <p>{isAdmin ? "Returns from every branch: damaged vs. back in stock." : `Returns for ${user?.branch}.`}</p>
        </div>
        {!isAdmin && (
          <div className="db-actions">
            <button className="db-btn db-btn-primary" onClick={() => setOpen(true)}>+ Record return</button>
          </div>
        )}
      </div>

      <div className="db-toolbar">
        <DatePicker mode="month" value={month} onChange={setMonth} />
        {isAdmin && (
          <Select
            value={branch}
            onChange={setBranch}
            options={[{ value: "", label: "All branches" }, ...BRANCHES]}
          />
        )}
      </div>
      {error && <div className="db-empty">{error}</div>}

      {isAdmin && (
        <div className="db-panel">
          <div className="db-panel-head"><div><h2>Month totals per branch</h2></div></div>
          <div className="db-panel-body">
            <table className="db-table">
              <thead><tr><th>Branch</th><th>Total returned</th><th>Back in stock</th><th>Damaged</th><th>Refunds</th></tr></thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.branch}>
                    <td data-label="Branch">{s.branch}</td>
                    <td data-label="Total" className="db-num">{s.total}</td>
                    <td data-label="In stock" className="db-num">{s.good}</td>
                    <td data-label="Damaged" className="db-num">{s.damaged}</td>
                    <td data-label="Refunds" className="db-num">{s.refunds.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="db-panel"><div className="db-panel-body">
        {rows.length === 0 ? <div className="db-empty">No returns in this period.</div> : (
          <table className="db-table">
            <thead><tr><th>Date</th>{isAdmin && <th>Branch</th>}<th>Tire</th><th>Size</th><th>DOT</th><th>Qty</th><th>Condition</th><th>Refund</th><th>Reason</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td data-label="Date">{new Date(r.date).toLocaleDateString()}</td>
                  {isAdmin && <td data-label="Branch">{r.branch?.name}</td>}
                  <td data-label="Tire">{r.tireName}</td>
                  <td data-label="Size">{r.size}</td>
                  <td data-label="DOT">{r.dot || "—"}</td>
                  <td data-label="Qty">{r.quantity}</td>
                  <td data-label="Condition"><span className={`db-badge ${r.condition}`}>{r.condition === "good" ? "back in stock" : "damaged"}</span></td>
                  <td data-label="Refund" className="db-num">{r.refundAmount.toLocaleString()}</td>
                  <td data-label="Reason">{r.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div></div>

      {open && (
        <Modal title="Record a return" subtitle={user?.branch} onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="db-field-row">
              <div className="db-field"><label>Date</label><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
              <div className="db-field"><label>Quantity</label><input type="number" min="1" value={form.quantity} onChange={set("quantity")} required /></div>
            </div>
            <div className="db-field-row">
              <div className="db-field"><label>Tire name</label><input value={form.tireName} onChange={set("tireName")} required /></div>
              <div className="db-field"><label>Size</label><input value={form.size} onChange={set("size")} required /></div>
            </div>
            <div className="db-field-row">
              <div className="db-field"><label>DOT</label><input value={form.dot} onChange={set("dot")} /></div>
              <div className="db-field"><label>Condition</label>
                <Select
                  value={form.condition}
                  onChange={(v) => setForm({ ...form, condition: v })}
                  options={[
                    { value: "good", label: "Still OK, add back to stock" },
                    { value: "damaged", label: "Damaged" },
                  ]}
                />
              </div>
            </div>
            <div className="db-field"><label>Refund amount (RWF)</label><input type="number" min="0" value={form.refundAmount} onChange={set("refundAmount")} /></div>
            <div className="db-field"><label>Reason</label><textarea rows={2} value={form.reason} onChange={set("reason")} /></div>
            {formError && <p style={{ color: "#a23b2a", fontSize: 13 }}>{formError}</p>}
            <div className="db-modal-foot">
              <button type="button" className="db-btn db-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
              <button className="db-btn db-btn-primary">Save return</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default Returns;