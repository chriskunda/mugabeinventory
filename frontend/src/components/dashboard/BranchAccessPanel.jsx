import { useEffect, useState } from "react";
import { accessApi } from "../../api/access";
import { useAuth } from "../../context/AuthContext";
import useBranches from "../../hooks/useBranches";
import { addDays, todayKigali } from "../../utils/format";
import Modal from "./Modal";
import StatusNote from "./StatusNote";
import { useDialog } from "../ui/dialogContext";
import Select from "../ui/Select";
import DatePicker from "../ui/DatePicker";

const BranchAccessPanel = () => {
  const { user } = useAuth();
  const { toast } = useDialog();
  const { names } = useBranches();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ branch: "", date: todayKigali(), reason: "" });
  const [error, setError] = useState("");

  const load = () => accessApi.mine().then((items) => setRows(items.filter((item) => item.kind === "branch"))).catch(() => {});
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
      toast("Request sent. Waiting for admin approval.", "info");
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
          {rows.some((r) => r.status === "pending") && (
            <StatusNote status="pending">
              Please wait for the admin to approve. They will also set how many days you can work there.
            </StatusNote>
          )}
          {rows
            .filter((r) => r.status === "approved" && String(r.resolvedAt || "").slice(0, 10) >= addDays(todayKigali(), -3))
            .map((r) => (
              <StatusNote key={r._id} status="approved">
                You can work at {r.branch?.name} from {r.date} to {r.endDate || r.date}.
              </StatusNote>
            ))}
          <table className="db-table">
            <thead><tr><th>Branch</th><th>Period</th><th>Status</th></tr></thead>
            <tbody>
              {rows.slice(0, 5).map((r) => (
                <tr key={r._id}>
                  <td data-label="Branch">{r.branch?.name}</td>
                  <td data-label="Period">{r.endDate && r.endDate !== r.date ? `${r.date} → ${r.endDate}` : r.date}</td>
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