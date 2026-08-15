import { useState } from "react";

let uid = 0;
const newLine = () => ({ id: `t${uid++}`, product: "", qty: 1 });

/**
 * branches: string[] of branch names to populate the "to" dropdown.
 * onSubmit receives the assembled transfer note payload.
 */
const TransferNoteForm = ({ branches = [], fromBranch, onSubmit, onCancel }) => {
  const [toBranch, setToBranch] = useState(branches.find((b) => b !== fromBranch) || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([newLine()]);

  const updateLine = (id, field, value) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const removeLine = (id) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ date, fromBranch, toBranch, lines, status: "pending" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="db-field-row">
        <div className="db-field">
          <label>From branch</label>
          <input value={fromBranch} disabled />
        </div>
        <div className="db-field">
          <label>To branch</label>
          <select value={toBranch} onChange={(e) => setToBranch(e.target.value)} required>
            <option value="" disabled>
              Select branch
            </option>
            {branches
              .filter((b) => b !== fromBranch)
              .map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="db-field">
        <label>Transfer date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="db-field">
        <label>Products to transfer</label>
        <div className="db-line-items">
          {lines.map((line) => (
            <div className="db-line-item" style={{ gridTemplateColumns: "1fr 80px 28px" }} key={line.id}>
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

      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="db-btn db-btn-primary">
          Create delivery note
        </button>
      </div>
    </form>
  );
};

export default TransferNoteForm;
