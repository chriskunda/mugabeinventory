import { useEffect, useState } from "react";
import { managersApi } from "../api/managers";

const AdminManagers = () => {
  const [managers, setManagers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([managersApi.list(), managersApi.pending()])
      .then(([m, p]) => {
        setManagers(m);
        setPending(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = async (id) => {
    await managersApi.approve(id);
    load();
  };
  const reject = async (id) => {
    if (!window.confirm("Reject this registration request?")) return;
    await managersApi.reject(id);
    load();
  };

  if (loading) return <div className="db-empty">Loading…</div>;
  if (error) return <div className="db-empty">{error}</div>;

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Managers</h1>
          <p>Approve new signups and see each manager's activity.</p>
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div>
            <h2>Pending approval</h2>
            <div className="sub">New sign-ups waiting for your review</div>
          </div>
        </div>
        <div className="db-panel-body">
          {pending.length === 0 ? (
            <div className="db-empty">No pending requests.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Requested</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Name">{p.name}</td>
                    <td data-label="Email">{p.email}</td>
                    <td data-label="Branch">{p.branch}</td>
                    <td data-label="Requested">{new Date(p.requestedAt).toLocaleDateString()}</td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="db-btn db-btn-outline" onClick={() => approve(p.id)}>
                          Approve
                        </button>
                        <button className="db-btn db-btn-ghost" onClick={() => reject(p.id)}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div>
            <h2>Active managers</h2>
          </div>
        </div>
        <div className="db-panel-body">
          {managers.length === 0 ? (
            <div className="db-empty">No approved managers yet.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Branch</th>
                  <th>Reports</th>
                  <th>Total sales</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((m) => (
                  <tr key={m.id}>
                    <td data-label="Manager">{m.name}</td>
                    <td data-label="Branch">{m.branch}</td>
                    <td data-label="Reports">{m.reportsCount}</td>
                    <td data-label="Total sales" className="db-num">{m.totalSales.toLocaleString()}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${m.status}`}>{m.status.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagers;
