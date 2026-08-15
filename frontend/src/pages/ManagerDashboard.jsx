import { useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import Modal from "../components/dashboard/Modal";
import DailyReportForm from "../components/dashboard/DailyReportForm";
import TransferNoteForm from "../components/dashboard/TransferNoteForm";
import "./ManagerDashboard.css";

// ---- placeholder data — replace with API calls once the backend is wired up ----
const BRANCH = "Remera";
const BRANCHES = ["Kimironko", "Nyabugogo", "Remera", "Kicukiro", "Main"];

const INITIAL_REPORTS = [
  { id: 1, date: "2026-08-12", total: 186_000, status: "submitted" },
  { id: 2, date: "2026-08-11", total: 214_500, status: "edit_requested" },
  { id: 3, date: "2026-08-10", total: 172_800, status: "submitted" },
];

const INITIAL_TRANSFERS = [
  { id: 1, date: "2026-08-11", to: "Kicukiro", items: 3, status: "pending" },
  { id: 2, date: "2026-08-08", to: "Main", items: 6, status: "approved" },
];

const fmt = (n) => `${n.toLocaleString()} RWF`;

const ManagerDashboard = () => {
  const [openModal, setOpenModal] = useState(null); // "report" | "transfer" | null
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);

  const monthTotal = reports.reduce((s, r) => s + r.total, 0);

  const requestEdit = (id) =>
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "edit_requested" } : r))
    );

  const handleNewReport = (payload) => {
    setReports((prev) => [
      { id: prev.length + 1, date: payload.date, total: payload.total, status: "submitted" },
      ...prev,
    ]);
    setOpenModal(null);
  };

  const handleNewTransfer = (payload) => {
    setTransfers((prev) => [
      { id: prev.length + 1, date: payload.date, to: payload.toBranch, items: payload.lines.length, status: "pending" },
      ...prev,
    ]);
    setOpenModal(null);
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Overview</h1>
          <p>{BRANCH} branch — today's numbers at a glance.</p>
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
        <StatCard label="Sales this month" value={fmt(monthTotal)} />
        <StatCard label="Reports submitted" value={reports.length} />
        <StatCard label="Pending transfer notes" value={transfers.filter((t) => t.status === "pending").length} />
        <StatCard
          label="Last report status"
          value={reports[0]?.status.replace("_", " ") ?? "—"}
        />
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div>
            <h2>My daily reports</h2>
            <div className="sub">Submitted reports are locked — request approval from admin to edit one</div>
          </div>
        </div>
        <div className="db-panel-body">
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
              {reports.map((r) => (
                <tr key={r.id}>
                  <td data-label="Date">{r.date}</td>
                  <td data-label="Total" className="db-num">{fmt(r.total)}</td>
                  <td data-label="Status">
                    <span className={`db-badge ${r.status}`}>{r.status.replace("_", " ")}</span>
                  </td>
                  <td data-label="">
                    {r.status === "submitted" ? (
                      <button className="db-btn db-btn-ghost" onClick={() => requestEdit(r.id)}>
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
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div>
            <h2>Transfer / delivery notes</h2>
            <div className="sub">Products sent from {BRANCH} to other branches</div>
          </div>
        </div>
        <div className="db-panel-body">
          {transfers.length === 0 ? (
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
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td data-label="Date">{t.date}</td>
                    <td data-label="To">{t.to}</td>
                    <td data-label="Items">{t.items}</td>
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
        <Modal title="New daily report" subtitle={`${BRANCH} branch`} onClose={() => setOpenModal(null)}>
          <DailyReportForm onCancel={() => setOpenModal(null)} onSubmit={handleNewReport} />
        </Modal>
      )}
      {openModal === "transfer" && (
        <Modal title="New transfer note" subtitle="Send products to another branch" onClose={() => setOpenModal(null)}>
          <TransferNoteForm
            branches={BRANCHES}
            fromBranch={BRANCH}
            onCancel={() => setOpenModal(null)}
            onSubmit={handleNewTransfer}
          />
        </Modal>
      )}
    </div>
  );
};

export default ManagerDashboard;
