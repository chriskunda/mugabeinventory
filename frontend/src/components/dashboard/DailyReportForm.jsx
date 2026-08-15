import { useState } from "react";

let uid = 0;
const newLine = () => ({ id: `l${uid++}`, product: "", qty: 1, price: "" });

/**
 * onSubmit receives the assembled report payload — wire this to your API call.
 */
const DailyReportForm = ({ onSubmit, onCancel }) => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([newLine()]);
  const [notes, setNotes] = useState("");

  const updateLine = (id, field, value) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const removeLine = (id) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.qty) || 0) * (Number(l.price) || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ date, lines, notes, total, status: "submitted" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="db-field">
        <label>Report date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="db-field">
        <label>Products sold</label>
        <div className="db-line-items">
          {lines.map((line) => (
            <div className="db-line-item" key={line.id}>
              <input
                placeholder="Product name"
                value={line.product}
                onChange={(e) => updateLine(line.id, "product", e.target.value)}
                required
              />
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={line.qty}
                onChange={(e) => updateLine(line.id, "qty", e.target.value)}
                required
              />
              <input
                type="number"
                min="0"
                placeholder="Unit price"
                value={line.price}
                onChange={(e) => updateLine(line.id, "price", e.target.value)}
                required
              />
              <button
                type="button"
                className="db-remove-line"
                onClick={() => removeLine(line.id)}
                aria-label="Remove line"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="db-add-line" onClick={() => setLines((p) => [...p, newLine()])}>
            + Add product
          </button>
        </div>
      </div>

      <div className="db-field">
        <label>Notes (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="db-field" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: 13 }}>Total for the day</label>
        <span className="db-num" style={{ fontWeight: 700 }}>
          {total.toLocaleString()}
        </span>
      </div>

      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="db-btn db-btn-primary">
          Submit report
        </button>
      </div>
    </form>
  );
};

export default DailyReportForm;
