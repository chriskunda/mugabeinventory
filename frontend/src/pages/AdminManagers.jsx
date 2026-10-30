import { useEffect, useState } from "react";
import { managersApi } from "../api/managers";
import { accessApi } from "../api/access";
import Modal from "../components/dashboard/Modal";
import Select from "../components/ui/Select";
import useBranches from "../hooks/useBranches";

const DAYS = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];
const dayNames = (arr) => DAYS.filter(([d]) => arr.includes(d)).map(([, l]) => l).join(", ") || "—";

const DaysOffForm = ({ manager, onSave, onCancel }) => {
  const [days, setDays] = useState(manager.daysOff);
  const toggle = (d) => setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));
  return (
    <div>
      <p style={{ fontSize: 13.5, color: "var(--db-muted)" }}>
        On these days {manager.name} can't use the system unless you approve access for that day.
      </p>
      <div className="db-days">
        {DAYS.map(([d, l]) => (
          <button type="button" key={d} className={`db-day ${days.includes(d) ? "on" : ""}`} onClick={() => toggle(d)}>{l}</button>
        ))}
      </div>
      <div className="db-modal-foot">
        <button className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-primary" onClick={() => onSave(days)}>Save days off</button>
      </div>
    </div>
  );
};

const BranchForm = ({ manager, names, onSave, onCancel }) => {
  const [branch, setBranch] = useState(manager.branch || "");
  return (
    <div>
      <p style={{ fontSize: 13.5, color: "var(--db-muted)" }}>
        Whoever works at a branch can see everything that was done there before, so a new manager never starts from scratch.
      </p>
      <div className="db-field"><label>Branch</label><Select value={branch} onChange={setBranch} options={names} /></div>
      <div className="db-modal-foot">
        <button className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-primary" disabled={!branch} onClick={() => onSave(branch)}>Assign</button>
      </div>
    </div>
  );
};

const AdminManagers = () => {
  const { names } = useBranches();
  const [managers, setManagers] = useState([]);
  const [pending, setPending] = useState([]);
  const [pwRequests, setPwRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState(null); // { type: "days" | "branch", m }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [m, p, pw, ar] = await Promise.all([managersApi.list(), managersApi.pending(), managersApi.passwordRequests(), accessApi.pending()]);
      setManagers(m); setPending(p); setPwRequests(pw); setRequests(ar); setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (fn) => {
    try {
      await fn();
      setModal(null);
      await load();
    } catch (e) {
      window.alert(e.message);
    }
  };

  if (loading) return <div className="db-empty">Loading…</div>;
  if (error) return <div className="db-empty">{error}</div>;

  const Panel = ({ title, sub, children }) => (
    <div className="db-panel">
      <div className="db-panel-head"><div><h2>{title}</h2>{sub && <div className="sub">{sub}</div>}</div></div>
      <div className="db-panel-body">{children}</div>
    </div>
  );

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Managers</h1><p>Approve sign-ups, set days off, and control who has access.</p></div>
      </div>

      {requests.length > 0 && (
        <Panel title="Access requests" sub="Managers asking to work on a day off, or at another branch">
          <table className="db-table">
            <thead><tr><th>Manager</th><th>Request</th><th>Reason</th><th></th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td data-label="Manager">{r.manager?.name}</td>
                  <td data-label="Request">{r.kind === "day_off" ? `Work on a day off (${r.date})` : `Work at ${r.branch?.name} on ${r.date}`}</td>
                  <td data-label="Reason">{r.reason || "—"}</td>
                  <td data-label="">
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="db-btn db-btn-outline" onClick={() => act(() => accessApi.resolve(r._id, true))}>Approve</button>
                      <button className="db-btn db-btn-ghost" onClick={() => act(() => accessApi.resolve(r._id, false))}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {pwRequests.length > 0 && (
        <Panel title="Password change requests" sub="Only approve after you've confirmed with the manager that it was really them">
          <table className="db-table">
            <thead><tr><th>Manager</th><th>Email</th><th>Asked</th><th></th></tr></thead>
            <tbody>
              {pwRequests.map((p) => (
                <tr key={p.id}>
                  <td data-label="Manager">{p.name}</td>
                  <td data-label="Email">{p.email}</td>
                  <td data-label="Asked">{new Date(p.requestedAt).toLocaleString()}</td>
                  <td data-label="">
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="db-btn db-btn-outline" onClick={() => act(() => managersApi.resolvePassword(p.id, true))}>Approve</button>
                      <button className="db-btn db-btn-ghost" onClick={() => act(() => managersApi.resolvePassword(p.id, false))}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <Panel title="Pending approval" sub="New sign-ups waiting for your review">
        {pending.length === 0 ? <div className="db-empty">No pending requests.</div> : (
          <table className="db-table">
            <thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>Requested</th><th></th></tr></thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id}>
                  <td data-label="Name">{p.name}</td>
                  <td data-label="Email">{p.email}</td>
                  <td data-label="Branch">{p.branch}</td>
                  <td data-label="Requested">{new Date(p.requestedAt).toLocaleDateString()}</td>
                  <td data-label="">
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="db-btn db-btn-outline" onClick={() => act(() => managersApi.approve(p.id))}>Approve</button>
                      <button className="db-btn db-btn-ghost"
                        onClick={() => window.confirm("Reject this registration request?") && act(() => managersApi.reject(p.id))}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Managers" sub="Removing access keeps everything they did. Restore it any time and they'll see it all again.">
        {managers.length === 0 ? <div className="db-empty">No approved managers yet.</div> : (
          <table className="db-table">
            <thead><tr><th>Manager</th><th>Email</th><th>Branch</th><th>Days off</th><th>Reports</th><th>Total sales</th><th>Access</th><th></th></tr></thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id}>
                  <td data-label="Manager">{m.name}</td>
                  <td data-label="Email">{m.email}</td>
                  <td data-label="Branch">{m.branch || "—"}</td>
                  <td data-label="Days off">{dayNames(m.daysOff)}</td>
                  <td data-label="Reports">{m.reportsCount}</td>
                  <td data-label="Total sales" className="db-num">{m.totalSales.toLocaleString()}</td>
                  <td data-label="Access">
                    <span className={`db-badge ${m.active ? "approved" : "failed"}`}>{m.active ? "Active" : "Removed"}</span>
                  </td>
                  <td data-label="">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="db-btn db-btn-ghost" onClick={() => setModal({ type: "branch", m })}>Branch</button>
                      <button className="db-btn db-btn-ghost" onClick={() => setModal({ type: "days", m })}>Days off</button>
                      {m.active ? (
                        <button className="db-btn db-btn-ghost"
                          onClick={() => window.confirm(`Remove ${m.name}'s access? Their reports and notes stay on the system, and you can restore access any time.`) && act(() => managersApi.setAccess(m.id, false))}>
                          Remove access
                        </button>
                      ) : (
                        <button className="db-btn db-btn-outline" onClick={() => act(() => managersApi.setAccess(m.id, true))}>Restore access</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {modal?.type === "days" && (
        <Modal title="Days off" subtitle={modal.m.name} onClose={() => setModal(null)}>
          <DaysOffForm manager={modal.m} onCancel={() => setModal(null)} onSave={(days) => act(() => managersApi.setDaysOff(modal.m.id, days))} />
        </Modal>
      )}
      {modal?.type === "branch" && (
        <Modal title="Assign branch" subtitle={modal.m.name} onClose={() => setModal(null)}>
          <BranchForm manager={modal.m} names={names} onCancel={() => setModal(null)} onSave={(b) => act(() => managersApi.assignBranch(modal.m.id, b))} />
        </Modal>
      )}
    </div>
  );
};
export default AdminManagers;