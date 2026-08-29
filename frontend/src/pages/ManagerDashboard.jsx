import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { reportsApi } from "../api/reports";
import { transfersApi } from "../api/transfers";
import StatCard from "../components/dashboard/StatCard";
import Modal from "../components/dashboard/Modal";
import DailyReportForm from "../components/dashboard/DailyReportForm";
import TransferNoteForm from "../components/dashboard/TransferNoteForm";
import "./ManagerDashboard.css";

const fmt = (n) => `${(n || 0).toLocaleString()} RWF`;

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(null);
  const [reports, setReports] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([reportsApi.mine(), transfersApi.list()])
      .then(([r, t]) => {
        setReports(r);
        setTransfers(t);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const monthTotal = reports.reduce((s, r) => s + r.grandTotal, 0);

  const requestEdit = async (id) => {
    const reason = window.prompt("What needs to change on this report?") || "";
    await reportsApi.requestEdit(id, reason);
    load();
  };

  const handleNewReport = async (payload) => {
    await reportsApi.create(payload);
    setOpenModal(null);
    load();
  };

  const handleNewTransfer = async (payload) => {
    await transfersApi.create(payload);
    setOpenModal(null);
    load();
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Overview</h1>
          <p>{user?.branch} branch — today's numbers at a glance.</p>
        </div>
        <div className="db-actions">
          <button className="db-btn db-btn-outline" onClick={() => setOpenModal("transfer")}>
            + Transfer note
          </button>
          <button className="db-btn db-btn-primary" onClick={() => setOpenModal("report")}>
            + Daily report
          </button>
        </div>
      </div>

      <div className="db-stat-grid">
        <StatCard label="Sales this period" value={fmt(monthTotal)} />
        <StatCard label="Reports submitted" value={reports.length} />
        <StatCard label="Pending transfer notes" value={transfers.filter((t) => t.status === "pending").length} />
        <StatCard label="Last report status" value={reports[0]?.status.replace("_", " ") ?? "—"} />
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div>
            <h2>My daily reports</h2>
            <div className="sub">Submitted reports are locked — request approval from admin to edit one</div>
          </div>
        </div>
        <div className="db-panel-body">
          {loading ? (
            <div className="db-empty">Loading…</div>
          ) : reports.length === 0 ? (
            <div className="db-empty">No reports yet.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total sales</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map((r) => (
                  <tr key={r._id}>
                    <td data-label="Date">{new Date(r.date).toLocaleDateString()}</td>
                    <td data-label="Total" className="db-num">{fmt(r.grandTotal)}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${r.status}`}>{r.status.replace("_", " ")}</span>
                    </td>
                    <td data-label="">
                      {r.status === "submitted" ? (
                        <button className="db-btn db-btn-ghost" onClick={() => requestEdit(r._id)}>
                          Request edit
                        </button>
                      ) : (
                        <span style={{ fontSize: 12.5, color: "var(--db-muted)" }}>Awaiting admin</span>
                      )}
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
            <h2>Transfer / delivery notes</h2>
            <div className="sub">Products sent from {user?.branch} to other branches</div>
          </div>
        </div>
        <div className="db-panel-body">
          {loading ? (
            <div className="db-empty">Loading…</div>
          ) : transfers.length === 0 ? (
            <div className="db-empty">No transfer notes yet.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>To branch</th>
                  <th>Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transfers.slice(0, 5).map((t) => (
                  <tr key={t._id}>
                    <td data-label="Date">{new Date(t.date).toLocaleDateString()}</td>
                    <td data-label="To">{t.toBranch?.name}</td>
                    <td data-label="Items">{t.lines.length}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${t.status}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {openModal === "report" && (
        <Modal title="New daily report" subtitle={user?.branch} onClose={() => setOpenModal(null)}>
          <DailyReportForm defaultBranch={user?.branch} onCancel={() => setOpenModal(null)} onSubmit={handleNewReport} />
        </Modal>
      )}
      {openModal === "transfer" && (
        <Modal title="New transfer note" subtitle="Send products to another branch" onClose={() => setOpenModal(null)}>
          <TransferNoteForm fromBranch={user?.branch} onCancel={() => setOpenModal(null)} onSubmit={handleNewTransfer} />
        </Modal>
      )}
    </div>
  );
};

export default ManagerDashboard;
