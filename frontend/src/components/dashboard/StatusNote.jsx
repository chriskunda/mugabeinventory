const StatusNote = ({ status, children }) => (
  <div className={`db-status-note ${status}`}>
    <strong>{status === "approved" ? "Approved" : status === "pending" ? "Waiting for approval" : "Not approved"}</strong>
    <span>{children}</span>
  </div>
);
export default StatusNote;