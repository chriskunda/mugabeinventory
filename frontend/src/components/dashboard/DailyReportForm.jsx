import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import useBranches from "../../hooks/useBranches";
import { accessApi } from "../../api/access";
import Select from "../ui/Select";
import DatePicker from "../ui/DatePicker";

let uid = 0;
const newTire = () => ({ id: `t${uid++}`, name: "", size: "", dot: "", price: "" });
const newClient = () => ({ id: `c${uid++}`, clientName: "", clientPhone: "", tires: [newTire()] });
const newOtherSale = () => ({ id: `o${uid++}`, item: "", price: "" });

const DailyReportForm = ({ defaultBranch, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const { names } = useBranches();
  const [branch, setBranch] = useState(defaultBranch?.name ?? defaultBranch ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [approved, setApproved] = useState([]);
  useEffect(() => {
    if (user?.role === "manager") accessApi.mine().then(setApproved).catch(() => {});
  }, [user]);

  const options =
    user?.role === "admin"
      ? names
      : [...new Set([
          user?.branch?.name ?? user?.branch,
          ...approved
            .filter((a) => a.kind === "branch" && a.status === "approved" && a.date <= date && date <= (a.endDate || a.date))
            .map((a) => a.branch?.name),
        ].filter(Boolean))];
  const chosenBranch = options.includes(branch) ? branch : options[0] || "";
  const [openingStock, setOpeningStock] = useState("");
  const [clients, setClients] = useState([newClient()]);
  const [transfers, setTransfers] = useState([""]);
  const [otherSales, setOtherSales] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateClient = (id, field, value) =>
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const updateTire = (clientId, tireId, field, value) =>
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, tires: c.tires.map((t) => (t.id === tireId ? { ...t, [field]: value } : t)) }
          : c
      )
    );

  const addTireToClient = (clientId) =>
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, tires: [...c.tires, newTire()] } : c))
    );

  const removeTire = (clientId, tireId) =>
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId && c.tires.length > 1
          ? { ...c, tires: c.tires.filter((t) => t.id !== tireId) }
          : c
      )
    );

  const removeClient = (id) =>
    setClients((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));

  const updateOtherSale = (id, field, value) =>
    setOtherSales((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  const removeOtherSale = (id) => setOtherSales((prev) => prev.filter((o) => o.id !== id));

  const updateTransfer = (i, value) =>
    setTransfers((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  const removeTransfer = (i) => setTransfers((prev) => prev.filter((_, idx) => idx !== i));

  const totalTyres = clients.reduce((sum, c) => sum + c.tires.length, 0);
  const tyresTotal = clients.reduce(
    (sum, c) => sum + c.tires.reduce((s, t) => s + (Number(t.price) || 0), 0),
    0
  );
  const otherSalesTotal = otherSales.reduce((s, o) => s + (Number(o.price) || 0), 0);
  const grandTotal = tyresTotal + otherSalesTotal;
  const average = totalTyres > 0 ? Math.round((tyresTotal / totalTyres) * 100) / 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit?.({
        branch: chosenBranch,
        date,
        openingStock: openingStock === "" ? undefined : Number(openingStock),
        clients: clients.map((c) => ({
          clientName: c.clientName,
          clientPhone: c.clientPhone,
          tires: c.tires.map((t) => ({ name: t.name, size: t.size, dot: t.dot, price: Number(t.price) })),
        })),
        transfers: transfers.filter((t) => t.trim()),
        otherSales: otherSales.map((o) => ({ item: o.item, price: Number(o.price) })),
        notes,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="db-field-row">
        <div className="db-field">
          <label>Branch this report is for</label>
          <Select value={chosenBranch} onChange={setBranch} options={options} />
        </div>
        <div className="db-field">
          <label>Date</label>
          <DatePicker value={date} onChange={setDate} />
        </div>
      </div>

      <div className="db-field">
        <label>Opening stock (leave blank to auto-use yesterday's closing stock)</label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 40"
          value={openingStock}
          onChange={(e) => setOpeningStock(e.target.value)}
        />
      </div>

      <div className="db-field">
        <label>Clients</label>
        {clients.map((c, ci) => (
          <div className="db-line-items" key={c.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Client {ci + 1}</strong>
              {clients.length > 1 && (
                <button type="button" className="db-remove-line" onClick={() => removeClient(c.id)}>
                  ×
                </button>
              )}
            </div>

            <div className="db-field-row" style={{ marginBottom: 8 }}>
              <input
                placeholder="Client name"
                value={c.clientName}
                onChange={(e) => updateClient(c.id, "clientName", e.target.value)}
                required
              />
              <input
                placeholder="Phone number"
                value={c.clientPhone}
                onChange={(e) => updateClient(c.id, "clientPhone", e.target.value)}
              />
            </div>

            {c.tires.map((t) => (
              <div
                className="db-line-item"
                style={{ gridTemplateColumns: "1.3fr 0.8fr 0.8fr 0.8fr 28px" }}
                key={t.id}
              >
                <input
                  placeholder="Tire name"
                  value={t.name}
                  onChange={(e) => updateTire(c.id, t.id, "name", e.target.value)}
                  required
                />
                <input
                  placeholder="Size"
                  value={t.size}
                  onChange={(e) => updateTire(c.id, t.id, "size", e.target.value)}
                  required
                />
                <input
                  placeholder="DOT"
                  value={t.dot}
                  onChange={(e) => updateTire(c.id, t.id, "dot", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Price"
                  value={t.price}
                  onChange={(e) => updateTire(c.id, t.id, "price", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="db-remove-line"
                  onClick={() => removeTire(c.id, t.id)}
                  aria-label="Remove tire"
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="db-add-line" onClick={() => addTireToClient(c.id)}>
              + Add tire to this client
            </button>
          </div>
        ))}
        <button type="button" className="db-add-line" onClick={() => setClients((p) => [...p, newClient()])}>
          + Add another client
        </button>
      </div>

      <div className="db-field">
        <label>Transfers made today (optional)</label>
        <div className="db-line-items">
          {transfers.map((t, i) => (
            <div className="db-line-item" style={{ gridTemplateColumns: "1fr 28px" }} key={i}>
              <input
                placeholder="e.g. 5 tyres to Kinamba"
                value={t}
                onChange={(e) => updateTransfer(i, e.target.value)}
              />
              <button type="button" className="db-remove-line" onClick={() => removeTransfer(i)}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="db-add-line" onClick={() => setTransfers((p) => [...p, ""])}>
            + Add transfer line
          </button>
        </div>
      </div>

      <div className="db-field">
        <label>Other sales (accessories, perfumes, etc. — optional)</label>
        <div className="db-line-items">
          {otherSales.map((o) => (
            <div className="db-line-item" key={o.id}>
              <input
                placeholder="Item"
                value={o.item}
                onChange={(e) => updateOtherSale(o.id, "item", e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Price"
                value={o.price}
                onChange={(e) => updateOtherSale(o.id, "price", e.target.value)}
              />
              <span />
              <button type="button" className="db-remove-line" onClick={() => removeOtherSale(o.id)}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="db-add-line" onClick={() => setOtherSales((p) => [...p, newOtherSale()])}>
            + Add other sale
          </button>
        </div>
      </div>

      <div className="db-field">
        <label>Notes (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="db-line-items" style={{ background: "var(--db-cream)" }}>
        <div className="db-ledger-row">
          <span>Total ({totalTyres} tyres)</span>
          <span className="db-num">{tyresTotal.toLocaleString()}</span>
        </div>
        <div className="db-ledger-row">
          <span>Average</span>
          <span className="db-num">{average.toLocaleString()}</span>
        </div>
        <div className="db-ledger-row">
          <span>Other sales total</span>
          <span className="db-num">{otherSalesTotal.toLocaleString()}</span>
        </div>
        <div className="db-ledger-row total">
          <span>Grand total</span>
          <span className="db-num">{grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="db-btn db-btn-primary" disabled={saving}>
          {saving ? "Submitting…" : "Submit report"}
        </button>
      </div>
    </form>
  );
};

export default DailyReportForm;
