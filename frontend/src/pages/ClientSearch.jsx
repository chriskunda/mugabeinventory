import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { reportsApi } from "../api/reports";
import useBranches from "../hooks/useBranches";
import Select from "../components/ui/Select";
import "./AdminDashboard.css";

const ClientSearch = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { names } = useBranches();
  const [product, setProduct] = useState("");
  const [client, setClient] = useState("");
  const [branch, setBranch] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSearch = product.trim().length >= 2 || client.trim().length >= 2;

  const search = async (e) => {
    e.preventDefault();
    if (!canSearch) return;
    setError("");
    setLoading(true);
    try {
      setRows(await reportsApi.search({ product: product.trim(), ...(client.trim() && { client: client.trim() }), ...(branch && { branch }) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Client search</h1><p>Search by the client's name, phone number, the product, or any mix of them.</p></div>
      </div>

      <div className="db-panel"><div className="db-panel-body">
        <form onSubmit={search} style={{ paddingTop: 14 }}>
          <div className="db-field">
            <label>Product (optional)</label>
            <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Tyre name or size, e.g. Michelin or 205/55R16" />
          </div>
          <div className="db-field-row">
            <div className="db-field">
              <label>Client name or phone number</label>
              <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Jean, or 0788 123 456" />
            </div>
            {isAdmin && (
              <div className="db-field">
                <label>Branch</label>
                <Select value={branch} onChange={setBranch} options={[{ value: "", label: "All branches" }, ...names]} />
              </div>
            )}
          </div>
          <button className="db-btn db-btn-primary" disabled={!canSearch || loading}>{loading ? "Searching…" : "Search"}</button>
          {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
        </form>
      </div></div>

      {rows && (
        <div className="db-panel"><div className="db-panel-body">
          {rows.length === 0 ? <div className="db-empty">No sales match that search.</div> : (
            <table className="db-table">
              <thead>
                <tr><th>Product</th><th>Size</th><th>DOT</th><th>Bought on</th><th>Client</th><th>Phone</th>{isAdmin && <th>Branch</th>}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.reportId}-${i}`}>
                    <td data-label="Product">{r.product}</td>
                    <td data-label="Size">{r.size}</td>
                    <td data-label="DOT">{r.dot || "—"}</td>
                    <td data-label="Bought on">{new Date(r.date).toLocaleDateString()}</td>
                    <td data-label="Client">{r.clientName}</td>
                    <td data-label="Phone">{r.clientPhone || "—"}</td>
                    {isAdmin && <td data-label="Branch">{r.branch}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div></div>
      )}
    </div>
  );
};
export default ClientSearch;