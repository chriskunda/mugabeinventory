import { useEffect, useState } from "react";
import { accessApi } from "../../api/access";
import { useAuth } from "../../context/AuthContext";
import useBranches from "../../hooks/useBranches";
import { todayKigali } from "../../utils/format";
import Modal from "./Modal";
import Select from "../ui/Select";
import DatePicker from "../ui/DatePicker";

const BranchAccessPanel = () => {
  const { user } = useAuth();
  const { names } = useBranches();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ branch: "", date: todayKigali(), reason: "" });
  const [error, setError] = useState("");

  const load = () => accessApi.mine().then(setRows).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await accessApi.requestWork(form);
      setOpen(false);
      setForm({ branch: "", date: todayKigali(), reason: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="db-panel">
      <div className="db-panel-head">
        <div>
          <h2>Working at another branch?</h2>
          <div className="sub">Ask the admin first. Once approved you can write reports and transfer notes for that branch on that day.</div>
        </div>
        <button className="db-btn db-btn-outline" onClick={() => setOpen(true)}>Request access</button>
      </div>
      {rows.length > 0 && (
        <div className="db-panel-body">
          <table className="db-table">
            <thead><tr><th>Branch</th><th>Day</th><th>Status</th></tr></thead>
            <tbody>
              {rows.slice(0, 5).map((r) => (
                <tr key={r._id}>
                  <td data-label="Branch">{r.branch?.name}</td>
                  <td data-label="Day">{r.date}</td>
                  <td data-label="Status"><span className={`db-badge ${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <Modal title="Request branch access" subtitle="The admin will approve or cancel it" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="db-field">
              <label>Branch</label>
              <Select value={form.branch} onChange={(v) => setForm({ ...form, branch: v })}
                      options={names.filter((n) => n !== user?.branch)} placeholder="Select branch" />
            </div>
            <div className="db-field">
              <label>Day you'll be working there</label>
              <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </div>
            <div className="db-field">
              <label>Reason (optional)</label>
              <textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
            <div className="db-modal-foot">
              <button type="button" className="db-btn db-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
              <button className="db-btn db-btn-primary" disabled={!form.branch}>Send request</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default BranchAccessPanel;