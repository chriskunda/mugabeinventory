import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../components/ui/dialogContext";
import { reportsApi } from "../api/reports";
import { transfersApi } from "../api/transfers";
import { ratingsApi } from "../api/ratings";
import StatCard from "../components/dashboard/StatCard";
import Modal from "../components/dashboard/Modal";
import Stars from "../components/ui/Stars";
import DailyReportForm from "../components/dashboard/DailyReportForm";
import TransferNoteForm from "../components/dashboard/TransferNoteForm";
import "./ManagerDashboard.css";

const fmt = (n) => `${(n || 0).toLocaleString()} RWF`;

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { prompt, toast } = useDialog();
  const [openModal, setOpenModal] = useState(null);
  const [reports, setReports] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [ratings, setRatings] = useState({ average: null, count: 0, items: [] });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([reportsApi.mine(), transfersApi.list(), ratingsApi.mine()])
      .then(([r, t, rt]) => {
        setReports(r);
        setTransfers(t);
        setRatings(rt);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const incoming = transfers.filter((t) => t.status === "sent" && t.toBranch?.name === user?.branch).length;

  const requestEdit = async (id) => {
    const reason = await prompt({
      title: "Request an edit", message: "What needs to change on this report?",
      placeholder: "e.g. Wrong price on the second tyre", confirmLabel: "Send request", multiline: true,
    });
    if (reason === null) return;
    try {
      await reportsApi.requestEdit(id, reason);
      toast("Request sent. Waiting for admin approval.", "info");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const handleNewReport = async (payload) => {
    await reportsApi.create(payload);
    setOpenModal(null);
    toast("Report submitted", "success");
    load();
  };
  const handleNewTransfer = async (payload) => {
    await transfersApi.create(payload);
    setOpenModal(null);
    toast("Transfer note sent", "success");
    load();
  };

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Overview</h1><p>{user?.branch} branch, today's numbers at a glance.</p></div>
        <div className="db-actions">
          <button className="db-btn db-btn-outline" onClick={() => setOpenModal("transfer")}>+ Transfer note</button>
          <button className="db-btn db-btn-primary" onClick={() => setOpenModal("report")}>+ Daily report</button>
        </div>
      </div>

      <div className="db-stat-grid">
        <StatCard label="Your ratings" value={ratings.count ? `${ratings.average} / 5 ★` : "Not rated yet"} />
        <StatCard label="Reports submitted" value={reports.length} />
        <StatCard label="Transfers to confirm" value={incoming} />
        <StatCard label="Last report status" value={reports[0]?.status.replace("_", " ") ?? "—"} />
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div><h2>Feedback from the admin</h2><div className="sub">Use it to keep improving your performance</div></div>
          {ratings.count > 0 && <Stars value={ratings.average} />}
        </div>
        <div className="db-panel-body">
          {ratings.items.length === 0 ? (
            <div className="db-empty">You haven't been rated yet.</div>
          ) : (
            ratings.items.map((r) => (
              <div key={r._id} className="db-ledger-row" style={{ alignItems: "flex-start", gap: 14 }}>
                <div><Stars value={r.score} />{r.comment && <div style={{ marginTop: 4 }}>{r.comment}</div>}</div>
                <span style={{ color: "var(--db-muted)", whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div><h2>Daily reports</h2><div className="sub">Submitted reports are locked. Request approval from admin to edit one</div></div>
        </div>
        <div className="db-panel-body">
          {loading ? <div className="db-empty">Loading…</div> : reports.length === 0 ? <div className="db-empty">No reports yet.</div> : (
            <table className="db-table">
              <thead><tr><th>Date</th><th>Manager</th><th>Total sales</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {reports.slice(0, 5).map((r) => (
                  <tr key={r._id}>
                    <td data-label="Date">{new Date(r.date).toLocaleDateString()}</td>
                    <td data-label="Manager">{r.manager?.name}</td>
                    <td data-label="Total" className="db-num">{fmt(r.grandTotal)}</td>
                    <td data-label="Status"><span className={`db-badge ${r.status}`}>{r.status.replace("_", " ")}</span></td>
                    <td data-label="">
                      {r.status === "submitted" && r.manager?._id === user?.id ? (
                        <button className="db-btn db-btn-ghost" onClick={() => requestEdit(r._id)}>Request edit</button>
                      ) : r.status === "edit_requested" ? (
                        <span style={{ fontSize: 12.5, color: "var(--db-gold)" }}>Waiting for admin approval</span>
                      ) : null}
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
          <div><h2>Transfer notes</h2><div className="sub">Products sent from or to {user?.branch}</div></div>
        </div>
        <div className="db-panel-body">
          {loading ? <div className="db-empty">Loading…</div> : transfers.length === 0 ? <div className="db-empty">No transfer notes yet.</div> : (
            <table className="db-table">
              <thead><tr><th>Date</th><th>From</th><th>To</th><th>Sizes</th><th>Status</th></tr></thead>
              <tbody>
                {transfers.slice(0, 5).map((t) => (
                  <tr key={t._id}>
                    <td data-label="Date">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td data-label="From">{t.fromBranch?.name}</td>
                    <td data-label="To">{t.toBranch?.name}</td>
                    <td data-label="Sizes">{t.lines.length}</td>
                    <td data-label="Status"><span className={`db-badge ${t.status}`}>{t.status}</span></td>
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
          <TransferNoteForm onCancel={() => setOpenModal(null)} onSubmit={handleNewTransfer} />
        </Modal>
      )}
    </div>
  );
};

export default ManagerDashboard;