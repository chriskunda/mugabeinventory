import { useCallback, useEffect, useState } from "react";
import {
  reportsApi,
  downloadReportExcel,
  downloadReportPdf,
  downloadMonthExcel,
} from "../api/reports";
import useBranches from "../hooks/useBranches";
import Modal from "../components/dashboard/Modal";
import ReportView from "../components/dashboard/ReportView";
import DatePicker from "../components/ui/DatePicker";

const AdminSalesReports = () => {
  const { names } = useBranches();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [branch, setBranch] = useState("");
  const [month, setMonth] = useState("");

  const fetchReports = useCallback(() => {
    return reportsApi.all({ ...(branch && { branch }), ...(month && { month }) });
  }, [branch, month]);

  useEffect(() => {
    fetchReports()
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetchReports]);

  const load = () => {
    setLoading(true);
    setError("");
    fetchReports()
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const resolveEdit = async (id, approve) => {
    try {
      await reportsApi.resolveEdit(id, approve);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const reportFilename = (report, extension) =>
    `report-${report.branch?.name}-${new Date(report.date).toISOString().slice(0, 10)}.${extension}`;

  const handleDownload = async (download, report, extension) => {
    try {
      await download(report._id, reportFilename(report, extension));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleMonthDownload = async () => {
    try {
      await downloadMonthExcel(month, `reports-${month}.xlsx`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Sales reports</h1>
          <p>Every branch's daily reports, in one place.</p>
        </div>
      </div>

      <div className="db-toolbar">
        {["", ...names].map((b) => (
          <button
            key={b || "all"}
            type="button"
            className={`db-btn ${branch === b ? "db-btn-primary" : "db-btn-outline"}`}
            onClick={() => {
              if (branch !== b) {
                setLoading(true);
                setError("");
              }
              setBranch(b);
            }}
          >
            {b || "All branches"}
          </button>
        ))}
        <DatePicker
          mode="month"
          clearable
          placeholder="Any month"
          value={month}
          onChange={(value) => {
            if (month !== value) {
              setLoading(true);
              setError("");
            }
            setMonth(value);
          }}
        />
        {month && (
          <button type="button" className="db-btn db-btn-outline" onClick={handleMonthDownload}>
            Month Excel
          </button>
        )}
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
                  <th>Sent</th>
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
                    <td data-label="Sent">{new Date(r.sentAt).toLocaleString()}</td>
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
                        <button
                          type="button"
                          className="db-btn db-btn-ghost"
                          onClick={() => handleDownload(downloadReportPdf, r, "pdf")}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          className="db-btn db-btn-ghost"
                          onClick={() => handleDownload(downloadReportExcel, r, "xlsx")}
                        >
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
