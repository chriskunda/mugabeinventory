import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import useBranches from "../../hooks/useBranches";
import { accessApi } from "../../api/access";
import { todayKigali } from "../../utils/format";
import Select from "../ui/Select";

let uid = 0;
const newLine = () => ({ id: `t${uid++}`, size: "", qty: 1 });

const TransferNoteForm = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const { names } = useBranches();
  const isAdmin = user?.role === "admin";
  const [approved, setApproved] = useState([]);
  useEffect(() => {
    if (!isAdmin) accessApi.mine().then(setApproved).catch(() => {});
  }, [isAdmin]);

  const today = todayKigali();
  const fromOptions = isAdmin
    ? names
    : [...new Set([
        user?.branch,
        ...approved
          .filter((a) => a.kind === "branch" && a.status === "approved" && a.date <= today && today <= (a.endDate || a.date))
          .map((a) => a.branch?.name),
      ].filter(Boolean))];

  const [from, setFrom] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [lines, setLines] = useState([newLine()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sender = fromOptions.includes(from) ? from : fromOptions[0] || "";
  const toOptions = names.filter((b) => b !== sender);
  const to = toOptions.includes(toBranch) ? toBranch : "";

  const updateLine = (id, field, value) => setLines((p) => p.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  const removeLine = (id) => setLines((p) => (p.length > 1 ? p.filter((l) => l.id !== id) : p));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!to) return setError("Choose the receiving branch");
    setSaving(true);
    try {
      await onSubmit?.({ fromBranch: sender, toBranch: to, lines: lines.map(({ size, qty }) => ({ size, qty: Number(qty) })) });
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
          {fromOptions.length > 1 ? <Select value={sender} onChange={setFrom} options={fromOptions} /> : <input value={sender} disabled />}
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
              <input placeholder="Size, e.g. 205/55R16" value={line.size} onChange={(e) => updateLine(line.id, "size", e.target.value)} required />
              <input type="number" min="1" placeholder="Qty" value={line.qty} onChange={(e) => updateLine(line.id, "qty", e.target.value)} required />
              <button type="button" className="db-remove-line" onClick={() => removeLine(line.id)} aria-label="Remove line">×</button>
            </div>
          ))}
          <button type="button" className="db-add-line" onClick={() => setLines((p) => [...p, newLine()])}>+ Add size</button>
        </div>
      </div>

      {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="db-btn db-btn-primary" disabled={saving}>{saving ? "Creating…" : "Create transfer note"}</button>
      </div>
    </form>
  );
};
export default TransferNoteForm;