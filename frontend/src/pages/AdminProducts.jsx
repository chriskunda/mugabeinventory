import { useEffect, useState } from "react";
import { productsApi } from "../api/products";
import Modal from "../components/dashboard/Modal";
import Select from "../components/ui/Select";
import { BRANCHES } from "../components/dashboard/DailyReportForm";
import "./AdminDashboard.css";

const ACTIONS = [
  { value: "add", label: "Add stock" },
  { value: "remove", label: "Remove stock" },
  { value: "set", label: "Set exact count" },
];

const AdjustForm = ({ product, onDone, onCancel }) => {
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [action, setAction] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const current = product.stocks.find((s) => s.branch === branch)?.qty ?? 0;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await productsApi.adjust(product.id, { branch, action, quantity: Number(quantity) });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="db-field-row">
        <div className="db-field"><label>Branch</label><Select value={branch} onChange={setBranch} options={BRANCHES} /></div>
        <div className="db-field"><label>What to do</label><Select value={action} onChange={setAction} options={ACTIONS} /></div>
      </div>
      <div className="db-field">
        <label>Quantity</label>
        <input type="number" min="0" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <span style={{ fontSize: 12.5, color: "var(--db-muted)" }}>Currently {current} at {branch}</span>
      </div>
      {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-primary" disabled={saving}>{saving ? "Saving…" : "Update stock"}</button>
      </div>
    </form>
  );
};

const AddForm = ({ onDone, onCancel }) => {
  const [name, setName] = useState("");
  const [stocks, setStocks] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await productsApi.create({ name, stocks });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="db-field">
        <label>Product name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Car mats" required />
      </div>
      <div className="db-field">
        <label>Opening stock (optional)</label>
        <div className="db-field-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {BRANCHES.map((b) => (
            <input
              key={b} type="number" min="0" placeholder={b}
              value={stocks[b] ?? ""} onChange={(e) => setStocks({ ...stocks, [b]: e.target.value })}
            />
          ))}
        </div>
      </div>
      {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-primary" disabled={saving}>{saving ? "Adding…" : "Add product"}</button>
      </div>
    </form>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjusting, setAdjusting] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = () => {
    productsApi
      .list()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const done = () => {
    setAdjusting(null);
    setAdding(false);
    load();
  };
  const remove = async (p) => {
    if (!window.confirm(`Remove "${p.name}" from the list?`)) return;
    await productsApi.remove(p.id);
    load();
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Products</h1>
          <p>Everything you sell, with the stock at each branch.</p>
        </div>
        <div className="db-actions">
          <button className="db-btn db-btn-primary" onClick={() => setAdding(true)}>+ New product</button>
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-body">
          {loading ? (
            <div className="db-empty">Loading…</div>
          ) : error ? (
            <div className="db-empty">{error}</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Product</th>
                  {BRANCHES.map((b) => <th key={b}>{b}</th>)}
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Product"><strong>{p.name}</strong></td>
                    {BRANCHES.map((b) => {
                      const qty = p.stocks.find((s) => s.branch === b)?.qty ?? 0;
                      return (
                        <td key={b} data-label={b} className="db-num" style={qty === 0 ? { color: "var(--db-muted)" } : undefined}>
                          {qty}
                        </td>
                      );
                    })}
                    <td data-label="Total" className="db-num"><strong>{p.total}</strong></td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="db-btn db-btn-outline" onClick={() => setAdjusting(p)}>Adjust stock</button>
                        <button className="db-btn db-btn-ghost" onClick={() => remove(p)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {adjusting && (
        <Modal title="Adjust stock" subtitle={adjusting.name} onClose={() => setAdjusting(null)}>
          <AdjustForm product={adjusting} onDone={done} onCancel={() => setAdjusting(null)} />
        </Modal>
      )}
      {adding && (
        <Modal title="New product" subtitle="Add something else you sell" onClose={() => setAdding(false)}>
          <AddForm onDone={done} onCancel={() => setAdding(false)} />
        </Modal>
      )}
    </div>
  );
};
export default AdminProducts;