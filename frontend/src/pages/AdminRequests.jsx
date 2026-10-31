import { useEffect, useState } from "react";
import { accessApi } from "../api/access";
import { useDialog } from "../components/ui/dialogContext";
import { addDays, describeRequest } from "../utils/format";
import Modal from "../components/dashboard/Modal";
import "./AdminDashboard.css";

const KIND = { day_off: "Day-off access", branch: "Other branch", leave: "Time off", restock: "Restock" };

const AdminRequests = () => {
  const { toast } = useDialog();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [days, setDays] = useState(1);

  const load = () => accessApi.pending()
    .then(setRows)
    .catch((error) => toast(error.message, "error"))
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = async (request, approve, duration) => {
    try {
      await accessApi.resolve(request._id, approve, duration);
      toast(approve ? "Approved. The manager was notified." : "Request cancelled.", approve ? "success" : "info");
      setApproving(null);
      await load();
    } catch (error) {
      toast(error.message, "error");
    }
  };

  const approve = (request) => {
    if (request.kind === "branch") {
      setDays(1);
      setApproving(request);
    } else {
      resolve(request, true);
    }
  };

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Requests</h1><p>Time off, restock, day-off access and other-branch work from your managers.</p></div>
      </div>
      <div className="db-panel">
        <div className="db-panel-body">
          {loading ? <div className="db-empty">Loading…</div> : rows.length === 0 ? (
            <div className="db-empty">Nothing waiting for you.</div>
          ) : (
            <table className="db-table">
              <thead><tr><th>Manager</th><th>Type</th><th>Request</th><th>Reason</th><th></th></tr></thead>
              <tbody>
                {rows.map((request) => (
                  <tr key={request._id}>
                    <td data-label="Manager">{request.manager?.name}</td>
                    <td data-label="Type">{KIND[request.kind] || request.kind}</td>
                    <td data-label="Request">{describeRequest(request)}</td>
                    <td data-label="Reason">{request.reason || "—"}</td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="db-btn db-btn-outline" onClick={() => approve(request)}>Approve</button>
                        <button className="db-btn db-btn-ghost" onClick={() => resolve(request, false)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {approving && (
        <Modal
          title="How long can they work there?"
          subtitle={`${approving.manager?.name} at ${approving.branch?.name}, starting ${approving.date}`}
          onClose={() => setApproving(null)}
        >
          <div className="db-chips">
            {[[1, "1 day"], [3, "3 days"], [7, "1 week"], [14, "2 weeks"], [30, "1 month"]].map(([duration, label]) => (
              <button
                type="button"
                key={duration}
                className={`db-day ${days === duration ? "on" : ""}`}
                onClick={() => setDays(duration)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="db-field">
            <label>Number of days</label>
            <input type="number" min="1" max="90" value={days} onChange={(event) => setDays(Number(event.target.value))} />
            <span style={{ fontSize: 12.5, color: "var(--db-muted)" }}>
              Access ends on {days >= 1 ? addDays(approving.date, days - 1) : "—"}
            </span>
          </div>
          <div className="db-modal-foot">
            <button type="button" className="db-btn db-btn-outline" onClick={() => setApproving(null)}>Back</button>
            <button
              type="button"
              className="db-btn db-btn-primary"
              disabled={!(days >= 1 && days <= 90)}
              onClick={() => resolve(approving, true, days)}
            >
              Approve for {days || 0} day(s)
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminRequests;
