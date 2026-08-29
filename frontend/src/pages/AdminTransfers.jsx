import { useEffect, useState } from "react";
import { transfersApi } from "../api/transfers";

const AdminTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t._id}>
                    <td data-label="Date">{new Date(t.date).toLocaleDateString()}</td>
                    <td data-label="From">{t.fromBranch?.name}</td>
                    <td data-label="To">{t.toBranch?.name}</td>
                    <td data-label="Created by">{t.createdBy?.name}</td>
                    <td data-label="Items">{t.lines.length}</td>
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
    </div>
  );
};

export default AdminTransfers;
