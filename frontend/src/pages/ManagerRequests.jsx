import { useEffect, useState } from "react";
import { accessApi } from "../api/access";
import { useDialog } from "../components/ui/dialogContext";
import { todayKigali, addDays, daysBetween, describeRequest } from "../utils/format";
import Modal from "../components/dashboard/Modal";
import StatusNote from "../components/dashboard/StatusNote";
import BranchAccessPanel from "../components/dashboard/BranchAccessPanel";
import DatePicker from "../components/ui/DatePicker";
import "./AdminDashboard.css";

const ManagerRequests = () => {
  const { toast } = useDialog();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [leave, setLeave] = useState({ startDate: todayKigali(), endDate: todayKigali(), reason: "" });
  const [stock, setStock] = useState({ product: "", quantity: "", reason: "" });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const requests = await accessApi.mine();
      setRows(requests.filter((request) => request.kind !== "branch"));
    } catch (loadError) {
      toast(loadError.message, "error");
    }
  };

  useEffect(() => {
    let active = true;
    accessApi.mine()
      .then((requests) => {
        if (active) setRows(requests.filter((request) => request.kind !== "branch"));
      })
      .catch((loadError) => {
        if (active) toast(loadError.message, "error");
      });
    return () => { active = false; };
  }, [toast]);

  const send = async (fn, successMessage) => {
    setError("");
    try {
      await fn();
      setModal(null);
      toast(successMessage, "info");
      await load();
    } catch (sendError) {
      setError(sendError.message);
    }
  };

  const pending = rows.filter((request) => request.status === "pending");
  const recentCutoff = addDays(todayKigali(), -3);
  const recent = rows.filter(
    (request) => request.status === "approved" && String(request.resolvedAt || "").slice(0, 10) >= recentCutoff
  );
  const days = leave.endDate >= leave.startDate ? daysBetween(leave.startDate, leave.endDate) : 0;

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Requests</h1><p>Ask the admin for time off or new stock. You'll see the answer here and in your notifications.</p></div>
        <div className="db-actions">
          <button className="db-btn db-btn-outline" onClick={() => { setError(""); setModal("restock"); }}>Request restock</button>
          <button className="db-btn db-btn-primary" onClick={() => { setError(""); setModal("leave"); }}>Request time off</button>
        </div>
      </div>

      {pending.length > 0 && (
        <StatusNote status="pending">
          {pending.length} request(s) are waiting for the admin. Please wait for approval.
        </StatusNote>
      )}
      {recent.map((request) => (
        <StatusNote key={request._id} status="approved">{describeRequest(request)} was approved.</StatusNote>
      ))}

      <div className="db-panel">
        <div className="db-panel-body">
          {rows.length === 0 ? <div className="db-empty">No requests yet.</div> : (
            <table className="db-table">
              <thead><tr><th>Request</th><th>Sent</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((request) => (
                  <tr key={request._id}>
                    <td data-label="Request">{describeRequest(request)}</td>
                    <td data-label="Sent">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${request.status === "pending" ? "waiting" : request.status}`}>
                        {request.status === "pending" ? "Waiting" : request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <BranchAccessPanel />

      {modal === "leave" && (
        <Modal title="Request time off" subtitle="One day or several. A whole week is fine" onClose={() => setModal(null)}>
          <form onSubmit={(event) => {
            event.preventDefault();
            send(() => accessApi.requestLeave(leave), "Request sent. Waiting for admin approval.");
          }}>
            <div className="db-field-row">
              <div className="db-field">
                <label>First day off</label>
                <DatePicker
                  value={leave.startDate}
                  onChange={(value) => setLeave({ ...leave, startDate: value, endDate: leave.endDate < value ? value : leave.endDate })}
                />
              </div>
              <div className="db-field">
                <label>Last day off</label>
                <DatePicker value={leave.endDate} onChange={(value) => setLeave({ ...leave, endDate: value })} />
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--db-muted)" }}>
              {days > 0 ? `${days} day(s) requested` : "The last day can't be before the first day"}
            </p>
            <div className="db-field">
              <label>Reason (optional)</label>
              <textarea rows={2} value={leave.reason} onChange={(event) => setLeave({ ...leave, reason: event.target.value })} />
            </div>
            {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
            <div className="db-modal-foot">
              <button type="button" className="db-btn db-btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="db-btn db-btn-primary" disabled={days < 1}>Send request</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "restock" && (
        <Modal title="Request new stock" subtitle="For products that have run out" onClose={() => setModal(null)}>
          <form onSubmit={(event) => {
            event.preventDefault();
            send(
              () => accessApi.requestRestock({ ...stock, quantity: Number(stock.quantity) }),
              "Request sent. Waiting for admin approval."
            );
          }}>
            <div className="db-field-row">
              <div className="db-field">
                <label>Product or size</label>
                <input value={stock.product} onChange={(event) => setStock({ ...stock, product: event.target.value })} placeholder="e.g. 205/55R16 used" required />
              </div>
              <div className="db-field">
                <label>How many</label>
                <input type="number" min="1" step="1" value={stock.quantity} onChange={(event) => setStock({ ...stock, quantity: event.target.value })} required />
              </div>
            </div>
            <div className="db-field">
              <label>Note (optional)</label>
              <textarea rows={2} value={stock.reason} onChange={(event) => setStock({ ...stock, reason: event.target.value })} />
            </div>
            {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
            <div className="db-modal-foot">
              <button type="button" className="db-btn db-btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="db-btn db-btn-primary">Send request</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ManagerRequests;
