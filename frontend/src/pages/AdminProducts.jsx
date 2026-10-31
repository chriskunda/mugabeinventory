import { useEffect, useState } from "react";
import { productsApi } from "../api/products";
import { useDialog } from "../components/ui/dialogContext";
import Modal from "../components/dashboard/Modal";
import StatCard from "../components/dashboard/StatCard";
import Select from "../components/ui/Select";
import useBranches from "../hooks/useBranches";
import "./AdminDashboard.css";

const ACTIONS = [
  { value: "add", label: "Add stock" },
  { value: "remove", label: "Remove stock" },
  { value: "set", label: "Set exact count" },
];
const rwf = (n) => `${Math.round(n || 0).toLocaleString()} RWF`;
const Err = ({ children }) => (children ? <p style={{ color: "#a23b2a", fontSize: 13 }}>{children}</p> : null);

// small helper so each form handles saving/error the same way
const useSubmit = (fn, onDone) => {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setSaving(true);
    try {
      onDone(await fn());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return { error, saving, submit };
};

const AdjustForm = ({ product, branches, onDone, onCancel }) => {
  const [branch, setBranch] = useState(branches[0] ?? "");
  const [action, setAction] = useState("add");
  const [quantity, setQuantity] = useState("");
  const current = product.stocks.find((s) => s.branch === branch)?.qty ?? 0;
  const { error, saving, submit } = useSubmit(() => productsApi.adjust(product.id, { branch, action, quantity: Number(quantity) }), () => onDone("Stock updated"));
  return (
    <form onSubmit={submit}>
      <div className="db-field-row">
        <div className="db-field"><label>Branch</label><Select value={branch} onChange={setBranch} options={branches} /></div>
        <div className="db-field"><label>What to do</label><Select value={action} onChange={setAction} options={ACTIONS} /></div>
      </div>
      <div className="db-field">
        <label>Quantity</label>
        <input type="number" min="0" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <span style={{ fontSize: 12.5, color: "var(--db-muted)" }}>Currently {current} at {branch}</span>
      </div>
      <Err>{error}</Err>
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-primary" disabled={saving}>{saving ? "Saving…" : "Update stock"}</button>
      </div>
    </form>
  );
};

const ValueForm = ({ product, onDone, onCancel }) => {
  const [cost, setCost] = useState(product.unitCost || "");
  const [price, setPrice] = useState(product.unitPrice || "");
  const { error, saving, submit } = useSubmit(() => productsApi.setValue(product.id, { unitCost: Number(cost), unitPrice: Number(price) || 0 }), () => onDone("Value saved"));
  return (
    <form onSubmit={submit}>
      <p style={{ fontSize: 13.5, color: "var(--db-muted)" }}>Stock value = units in stock x cost per unit. Use the average cost of what is on your shelves.</p>
      <div className="db-field-row">
        <div className="db-field"><label>Cost per unit (RWF)</label><input type="number" min="0" required value={cost} onChange={(e) => setCost(e.target.value)} /></div>
        <div className="db-field"><label>Selling price per unit (optional)</label><input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      <Err>{error}</Err>
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-primary" disabled={saving}>{saving ? "Saving…" : "Save value"}</button>
      </div>
    </form>
  );
};

const AddForm = ({ branches, onDone, onCancel }) => {
  const [name, setName] = useState("");
  const [stocks, setStocks] = useState({});
  const [unitCost, setUnitCost] = useState("");
  const { error, saving, submit } = useSubmit(() => productsApi.create({ name, stocks, unitCost: Number(unitCost) || 0 }), () => onDone("Product added"));
  return (
    <form onSubmit={submit}>
      <div className="db-field-row">
        <div className="db-field"><label>Product name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Car mats" required /></div>
        <div className="db-field"><label>Cost per unit (optional)</label><input type="number" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} /></div>
      </div>
      <div className="db-field">
        <label>Opening stock (optional)</label>
        <div className="db-field-row" style={{ gridTemplateColumns: `repeat(${Math.max(branches.length, 1)}, 1fr)` }}>
          {branches.map((b) => (
            <input key={b} type="number" min="0" placeholder={b} value={stocks[b] ?? ""} onChange={(e) => setStocks({ ...stocks, [b]: e.target.value })} />
          ))}
        </div>
      </div>
      <Err>{error}</Err>
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-primary" disabled={saving}>{saving ? "Adding…" : "Add product"}</button>
      </div>
    </form>
  );
};

const ReconcileForm = ({ products, branches, onDone, onCancel }) => {
  const { confirm } = useDialog();
  const [branch, setBranch] = useState(branches[0] ?? "");
  const [counts, setCounts] = useState({});
  const system = (p) => p.stocks.find((s) => s.branch === branch)?.qty ?? 0;
  const entered = products.filter((p) => counts[p.id] !== undefined && counts[p.id] !== "");
  const { error, saving, submit } = useSubmit(
    () => productsApi.reconcile({ branch, counts: entered.map((p) => ({ id: p.id, counted: Number(counts[p.id]) })) }),
    (r) => {
      const off = r.changes.filter((c) => c.diff !== 0).length;
      onDone(off ? `${r.branch}: ${off} product(s) were corrected` : `${r.branch}: everything matched`);
    }
  );
  const apply = async (e) => {
    e.preventDefault();
    const off = entered.filter((p) => Number(counts[p.id]) !== system(p)).length;
    if (off && !(await confirm({ title: "Overwrite system stock?", message: `${off} product(s) differ from the system. The system will be set to your counted numbers.`, confirmLabel: "Apply counts" }))) return;
    submit();
  };

  return (
    <form onSubmit={apply}>
      <p style={{ fontSize: 13.5, color: "var(--db-muted)" }}>Count what is physically on the shelves, enter it below, and compare it with the system.</p>
      <div className="db-field"><label>Branch</label><Select value={branch} onChange={(b) => { setBranch(b); setCounts({}); }} options={branches} /></div>
      <table className="db-table">
        <thead><tr><th>Product</th><th>System</th><th>Counted</th><th>Difference</th></tr></thead>
        <tbody>
          {products.map((p) => {
            const c = counts[p.id];
            const diff = c === undefined || c === "" ? null : Number(c) - system(p);
            return (
              <tr key={p.id}>
                <td data-label="Product">{p.name}</td>
                <td data-label="System" className="db-num">{system(p)}</td>
                <td data-label="Counted">
                  <input type="number" min="0" style={{ width: 90 }} value={c ?? ""} onChange={(e) => setCounts({ ...counts, [p.id]: e.target.value })} />
                </td>
                <td data-label="Difference" className="db-num" style={{ color: diff ? "var(--db-clay)" : "#4f7a3f" }}>
                  {diff === null ? "—" : diff === 0 ? "Matches" : diff > 0 ? `+${diff} more` : `${diff} missing`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Err>{error}</Err>
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Close</button>
        <button className="db-btn db-btn-primary" disabled={!entered.length || saving}>{saving ? "Saving…" : "Apply counts"}</button>
      </div>
    </form>
  );
};

const AdminProducts = () => {
  const { toast, confirm } = useDialog();
  const { names } = useBranches();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { type: "adjust"|"value"|"add"|"reconcile", p? }

  const load = () => {
    productsApi.list().then(setProducts).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const done = (msg) => {
    setModal(null);
    if (msg) toast(msg, "success");
    load();
  };
  const remove = async (p) => {
    if (!(await confirm({ title: `Remove "${p.name}"?`, message: "It disappears from the list and its stock counts are deleted.", confirmLabel: "Remove", danger: true }))) return;
    try {
      await productsApi.remove(p.id);
      done("Product removed");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const qtyAt = (p, b) => p.stocks.find((s) => s.branch === b)?.qty ?? 0;
  const costValue = products.reduce((s, p) => s + p.total * p.unitCost, 0);
  const retailValue = products.reduce((s, p) => s + p.total * p.unitPrice, 0);
  const unpriced = products.filter((p) => p.total > 0 && !p.unitCost).length;

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Products</h1><p>Everything you sell, with the stock and its value at each branch.</p></div>
        <div className="db-actions">
          <button className="db-btn db-btn-outline" onClick={() => setModal({ type: "reconcile" })}>Reconcile stock</button>
          <button className="db-btn db-btn-primary" onClick={() => setModal({ type: "add" })}>+ New product</button>
        </div>
      </div>

      <div className="db-stat-grid">
        <StatCard label="Stock value (at cost)" value={rwf(costValue)} />
        <StatCard label="Stock value (at selling price)" value={rwf(retailValue)} />
        <StatCard label="Potential margin" value={rwf(retailValue - costValue)} />
        {names.map((b) => (
          <StatCard key={b} label={`${b} stock value`} value={rwf(products.reduce((s, p) => s + qtyAt(p, b) * p.unitCost, 0))} />
        ))}
      </div>
      {unpriced > 0 && <div className="db-status-note pending"><strong>Heads up</strong><span>{unpriced} product(s) have stock but no cost per unit, so they count as 0 in the value.</span></div>}

      <div className="db-panel"><div className="db-panel-body">
        {loading ? <div className="db-empty">Loading…</div> : error ? <div className="db-empty">{error}</div> : (
          <table className="db-table">
            <thead>
              <tr><th>Product</th>{names.map((b) => <th key={b}>{b}</th>)}<th>Total</th><th>Cost / unit</th><th>Stock value</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td data-label="Product"><strong>{p.name}</strong></td>
                  {names.map((b) => (
                    <td key={b} data-label={b} className="db-num" style={qtyAt(p, b) === 0 ? { color: "var(--db-muted)" } : undefined}>{qtyAt(p, b)}</td>
                  ))}
                  <td data-label="Total" className="db-num"><strong>{p.total}</strong></td>
                  <td data-label="Cost / unit" className="db-num">{p.unitCost ? p.unitCost.toLocaleString() : "—"}</td>
                  <td data-label="Stock value" className="db-num">{rwf(p.total * p.unitCost)}</td>
                  <td data-label="">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="db-btn db-btn-outline" onClick={() => setModal({ type: "adjust", p })}>Adjust stock</button>
                      <button className="db-btn db-btn-ghost" onClick={() => setModal({ type: "value", p })}>Set value</button>
                      <button className="db-btn db-btn-ghost" onClick={() => remove(p)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div></div>

      {modal?.type === "adjust" && (
        <Modal title="Adjust stock" subtitle={modal.p.name} onClose={() => setModal(null)}>
          <AdjustForm product={modal.p} branches={names} onDone={done} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "value" && (
        <Modal title="Set value" subtitle={modal.p.name} onClose={() => setModal(null)}>
          <ValueForm product={modal.p} onDone={done} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "add" && (
        <Modal title="New product" subtitle="Add something else you sell" onClose={() => setModal(null)}>
          <AddForm branches={names} onDone={done} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "reconcile" && (
        <Modal title="Reconcile stock" subtitle="Physical count vs. the system" onClose={() => setModal(null)}>
          <ReconcileForm products={products} branches={names} onDone={done} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
};
export default AdminProducts;