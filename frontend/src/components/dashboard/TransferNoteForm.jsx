import { useState } from "react";
import Select from "../ui/Select";

const BRANCHES = ["Kimironko", "Sonatube", "Kinamba"];

let uid = 0;
const newLine = () => ({ id: `t${uid++}`, size: "", qty: 1 });

const TransferNoteForm = ({ fromBranch, onSubmit, onCancel }) => {
  const [from, setFrom] = useState(BRANCHES[0]);
  const sender = fromBranch || from;
  const [toBranch, setToBranch] = useState("");
  const [lines, setLines] = useState([newLine()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toOptions = BRANCHES.filter((branch) => branch !== sender);
  const to = toOptions.includes(toBranch) ? toBranch : "";

  const updateLine = (id, field, value) =>
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)));
  const removeLine = (id) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== id) : prev));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!to) {
      setError("Choose the receiving branch");
      return;
    }
    setSaving(true);
    try {
      await onSubmit?.({
        fromBranch: sender,
        toBranch: to,
        lines: lines.map(({ size, qty }) => ({ size, qty: Number(qty) })),
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
          <label>From branch</label>
          {fromBranch ? (
            <input value={fromBranch} disabled />
          ) : (
            <Select value={from} onChange={setFrom} options={BRANCHES} />
          )}
        </div>
        <div className="db-field">
          <label>To branch</label>
          <Select value={to} onChange={setToBranch} options={toOptions} placeholder="Select branch" />
        </div>
      </div>

      <div className="db-field">
        <label>Sizes being transferred</label>
        <div className="db-line-items">
          {lines.map((line) => (
            <div className="db-line-item" style={{ gridTemplateColumns: "1fr 80px 28px" }} key={line.id}>
              <input
                placeholder="Size, e.g. 205/55R16"
                value={line.size}
                onChange={(e) => updateLine(line.id, "size", e.target.value)}
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
          <button type="button" className="db-add-line" onClick={() => setLines((prev) => [...prev, newLine()])}>
            + Add size
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="db-btn db-btn-primary" disabled={saving}>
          {saving ? "Creating…" : "Create transfer note"}
        </button>
      </div>
    </form>
  );
};

export default TransferNoteForm;
