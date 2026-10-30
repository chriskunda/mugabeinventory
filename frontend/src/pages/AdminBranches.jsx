import { useEffect, useState } from "react";
import { branchesApi } from "../api/branches";
import { downloadFile } from "../api/reports";
import Modal from "../components/dashboard/Modal";
import "./AdminDashboard.css";

const NameForm = ({ initial = "", cta, onSubmit, onCancel }) => {
  const [name, setName] = useState(initial);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(name);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit}>
      <div className="db-field"><label>Branch name</label><input value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
      {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-primary">{cta}</button>
      </div>
    </form>
  );
};

const DeleteBranch = ({ branch, onDone, onCancel }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = (kind) =>
    downloadFile(`/branches/${branch.id}/export/${kind}`, `${branch.name}-data.${kind === "pdf" ? "pdf" : "xlsx"}`).catch((e) => setError(e.message));

  const remove = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await branchesApi.remove(branch.id, password);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={remove}>
      <div className="db-warn">
        <strong>Deleting {branch.name} permanently removes its data:</strong> {branch.reports} sales reports,{" "}
        {branch.transfers} transfer notes, {branch.returns} returns and its stock counts. This can't be undone.
      </div>
      <div className="db-field">
        <label>Save a copy first</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="db-btn db-btn-outline" onClick={() => save("excel")}>Download Excel</button>
          <button type="button" className="db-btn db-btn-outline" onClick={() => save("pdf")}>Download PDF</button>
        </div>
      </div>
      <div className="db-field">
        <label>Enter your password to confirm</label>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p style={{ color: "#a23b2a", fontSize: 13 }}>{error}</p>}
      <div className="db-modal-foot">
        <button type="button" className="db-btn db-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="db-btn db-btn-danger" disabled={!password || busy}>{busy ? "Deleting…" : "Delete branch"}</button>
      </div>
    </form>
  );
};

const AdminBranches = () => {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { type: "add" | "rename" | "delete", b? }

  const load = () => branchesApi.overview().then(setRows).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const close = () => { setModal(null); load(); };

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Branches</h1><p>Add a branch, rename one that moved, or remove one you no longer use.</p></div>
        <div className="db-actions"><button className="db-btn db-btn-primary" onClick={() => setModal({ type: "add" })}>+ New branch</button></div>
      </div>
      {error && <div className="db-empty">{error}</div>}

      <div className="db-panel"><div className="db-panel-body">
        <table className="db-table">
          <thead><tr><th>Branch</th><th>Managers</th><th>Reports</th><th>Transfers</th><th>Returns</th><th></th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td data-label="Branch"><strong>{b.name}</strong></td>
                <td data-label="Managers">{b.managers}</td>
                <td data-label="Reports">{b.reports}</td>
                <td data-label="Transfers">{b.transfers}</td>
                <td data-label="Returns">{b.returns}</td>
                <td data-label="">
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="db-btn db-btn-outline" onClick={() => setModal({ type: "rename", b })}>Rename</button>
                    <button className="db-btn db-btn-ghost" onClick={() => setModal({ type: "delete", b })}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>

      {modal?.type === "add" && (
        <Modal title="New branch" onClose={() => setModal(null)}>
          <NameForm cta="Add branch" onCancel={() => setModal(null)} onSubmit={async (n) => { await branchesApi.create(n); close(); }} />
        </Modal>
      )}
      {modal?.type === "rename" && (
        <Modal title="Rename branch" subtitle="Its history and stock move with the new name" onClose={() => setModal(null)}>
          <NameForm initial={modal.b.name} cta="Save name" onCancel={() => setModal(null)} onSubmit={async (n) => { await branchesApi.rename(modal.b.id, n); close(); }} />
        </Modal>
      )}
      {modal?.type === "delete" && (
        <Modal title="Delete branch" subtitle={modal.b.name} onClose={() => setModal(null)}>
          <DeleteBranch branch={modal.b} onCancel={() => setModal(null)} onDone={close} />
        </Modal>
      )}
    </div>
  );
};
export default AdminBranches;