import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { reportsApi, downloadReportPdf } from "../api/reports";
import Modal from "../components/dashboard/Modal";
import DailyReportForm from "../components/dashboard/DailyReportForm";
import ReportView from "../components/dashboard/ReportView";
import BranchAccessPanel from "../components/dashboard/BranchAccessPanel";

const ManagerReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    reportsApi
      .mine()
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (payload) => {
    await reportsApi.create(payload);
    setModal(null);
    load();
  };

  const requestEdit = async (id) => {
    const reason = window.prompt("What needs to change on this report?") || "";
    await reportsApi.requestEdit(id, reason);
    load();
  };

  const handleDownload = async (report) => {
    try {
      const date = new Date(report.date).toISOString().slice(0, 10);
      await downloadReportPdf(report._id, `report-${report.branch?.name}-${date}.pdf`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Daily reports</h1>
          <p>Submitted reports are locked — request approval from admin to edit one.</p>
        </div>
        <div className="db-actions">
          <button className="db-btn db-btn-primary" onClick={() => setModal("create")}>
            + New report
          </button>
        </div>
      </div>

      <BranchAccessPanel />

      <div className="db-panel">
        <div className="db-panel-body">
          {loading ? (
            <div className="db-empty">Loading…</div>
          ) : error ? (
            <div className="db-empty">{error}</div>
          ) : reports.length === 0 ? (
            <div className="db-empty">No reports yet — create your first one.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Branch</th>
                  <th>Manager</th>
                  <th>Tyres</th>
                  <th>Grand total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td data-label="Date">{new Date(r.date).toLocaleDateString()}</td>
                    <td data-label="Branch">{r.branch?.name}</td>
                    <td data-label="Manager">{r.manager?.name}</td>
                    <td data-label="Tyres">{r.totalTyres}</td>
                    <td data-label="Total" className="db-num">{r.grandTotal.toLocaleString()}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${r.status}`}>{r.status.replace("_", " ")}</span>
                    </td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="db-btn db-btn-ghost" onClick={() => setModal({ view: r })}>
                          View
                        </button>
                        <button className="db-btn db-btn-ghost" onClick={() => handleDownload(r)}>
                          PDF
                        </button>
                        {r.status === "submitted" && r.manager?._id === user?.id && (
                          <button className="db-btn db-btn-ghost" onClick={() => requestEdit(r._id)}>
                            Request edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal === "create" && (
        <Modal title="New daily report" subtitle={user?.branch} onClose={() => setModal(null)}>
          <DailyReportForm defaultBranch={user?.branch} onCancel={() => setModal(null)} onSubmit={handleCreate} />
        </Modal>
      )}
      {modal?.view && (
        <Modal title="Report detail" onClose={() => setModal(null)}>
          <ReportView report={modal.view} />
        </Modal>
      )}
    </div>
  );
};

export default ManagerReports;
