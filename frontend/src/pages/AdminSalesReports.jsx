import { useEffect, useState } from "react";
import { reportsApi, downloadReportExcel } from "../api/reports";
import Modal from "../components/dashboard/Modal";
import ReportView from "../components/dashboard/ReportView";

const AdminSalesReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);

  const load = () => {
    setLoading(true);
    reportsApi
      .all()
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resolveEdit = async (id, approve) => {
    await reportsApi.resolveEdit(id, approve);
    load();
  };

  const handleDownload = (r) =>
    downloadReportExcel(r._id, `report-${r.branch?.name}-${r.date.slice(0, 10)}.xlsx`);

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Sales reports</h1>
          <p>Every branch's daily reports, in one place.</p>
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-body">
          {loading ? (
            <div className="db-empty">Loading…</div>
          ) : error ? (
            <div className="db-empty">{error}</div>
          ) : reports.length === 0 ? (
            <div className="db-empty">No reports submitted yet.</div>
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
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="db-btn db-btn-ghost" onClick={() => setViewing(r)}>
                          View
                        </button>
                        <button className="db-btn db-btn-ghost" onClick={() => handleDownload(r)}>
                          Excel
                        </button>
                        {r.status === "edit_requested" && (
                          <>
                            <button className="db-btn db-btn-outline" onClick={() => resolveEdit(r._id, true)}>
                              Approve edit
                            </button>
                            <button className="db-btn db-btn-ghost" onClick={() => resolveEdit(r._id, false)}>
                              Reject
                            </button>
                          </>
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

      {viewing && (
        <Modal title="Report detail" onClose={() => setViewing(null)}>
          <ReportView report={viewing} />
        </Modal>
      )}
    </div>
  );
};

export default AdminSalesReports;
