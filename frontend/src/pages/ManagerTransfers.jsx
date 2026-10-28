import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { transfersApi } from "../api/transfers";
import { downloadTransferPdf } from "../api/reports";
import Modal from "../components/dashboard/Modal";
import TransferNoteForm from "../components/dashboard/TransferNoteForm";

const ManagerTransfers = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    transfersApi
      .list()
      .then(setTransfers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (payload) => {
    await transfersApi.create(payload);
    setShowModal(false);
    load();
  };

  const handleReceive = async (id) => {
    await transfersApi.markReceived(id);
    load();
  };

  const handleDownload = async (transfer) => {
    try {
      const date = new Date(transfer.date).toISOString().slice(0, 10);
      await downloadTransferPdf(
        transfer._id,
        `transfer-${transfer.fromBranch?.name}-${transfer.toBranch?.name}-${date}.pdf`
      );
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Transfer / delivery notes</h1>
          <p>Products sent to or received from other branches.</p>
        </div>
        <div className="db-actions">
          <button className="db-btn db-btn-primary" onClick={() => setShowModal(true)}>
            + New transfer note
          </button>
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
                  <th>Items</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t._id}>
                    <td data-label="Date">{new Date(t.date).toLocaleDateString()}</td>
                    <td data-label="From">{t.fromBranch?.name}</td>
                    <td data-label="To">{t.toBranch?.name}</td>
                    <td data-label="Items">{t.lines.length}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${t.status}`}>{t.status}</span>
                    </td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="db-btn db-btn-ghost" onClick={() => handleDownload(t)}>
                          PDF
                        </button>
                      {t.status === "pending" && t.toBranch?.name === user?.branch && (
                        <button className="db-btn db-btn-ghost" onClick={() => handleReceive(t._id)}>
                          Mark received
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

      {showModal && (
        <Modal title="New transfer note" subtitle={`From ${user?.branch}`} onClose={() => setShowModal(false)}>
          <TransferNoteForm fromBranch={user?.branch} onCancel={() => setShowModal(false)} onSubmit={handleCreate} />
        </Modal>
      )}
    </div>
  );
};

export default ManagerTransfers;
