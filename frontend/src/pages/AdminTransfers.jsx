import { useEffect, useState } from "react";
import { transfersApi } from "../api/transfers";
import { downloadTransferPdf } from "../api/transfers";
import Modal from "../components/dashboard/Modal";
import TransferNoteView from "../components/dashboard/TransferNoteView";

const AdminTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);

  const handleDownload = async (transfer) => {
    try {
      await downloadTransferPdf(
        transfer._id,
        `transfer-${transfer.fromBranch?.name}-to-${transfer.toBranch?.name}.pdf`
      );
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    transfersApi
      .list()
      .then(setTransfers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Transfer notes</h1>
          <p>Every branch-to-branch delivery, across the business.</p>
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-body">
          {loading ? (
            <div className="db-empty">Loading…</div>
          ) : error ? (
            <div className="db-empty">{error}</div>
          ) : transfers.length === 0 ? (
            <div className="db-empty">No transfer notes yet.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Created by</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t._id}>
                    <td data-label="Date">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td data-label="From">{t.fromBranch?.name}</td>
                    <td data-label="To">{t.toBranch?.name}</td>
                    <td data-label="Created by">{t.createdBy?.name}</td>
                    <td data-label="Items">{t.lines.length}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${t.status}`}>{t.status === "sent" ? "Sent" : "Received"}</span>
                    </td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="db-btn db-btn-ghost" onClick={() => setViewing(t)}>View</button>
                        <button className="db-btn db-btn-ghost" onClick={() => handleDownload(t)}>PDF</button>
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
        <Modal title="Transfer note" onClose={() => setViewing(null)}>
          <TransferNoteView note={viewing} />
        </Modal>
      )}
    </div>
  );
};

export default AdminTransfers;
