import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DialogContext } from "./dialogContext";
import "./dialogs.css";

let nextId = 0;

const DialogProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dlg, setDlg] = useState(null);
  const [text, setText] = useState("");

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (message, type = "info") => {
      const id = ++nextId;
      setToasts((t) => [...t.slice(-3), { id, message, type }]);
      setTimeout(() => dismiss(id), type === "error" ? 7000 : 5000);
    },
    [dismiss]
  );

  const open = useCallback(
    (kind, opts) =>
      new Promise((resolve) => {
        setText(opts.defaultValue || "");
        setDlg({ kind, opts, resolve });
      }),
    []
  );
  const confirm = useCallback((o) => open("confirm", typeof o === "string" ? { message: o } : o), [open]);
  const prompt = useCallback((o) => open("prompt", o), [open]);
  const value = useMemo(() => ({ toast, confirm, prompt }), [toast, confirm, prompt]);

  const finish = (result) => {
    dlg.resolve(result);
    setDlg(null);
  };
  const cancel = () => finish(dlg.kind === "confirm" ? false : null);
  const submit = (e) => {
    e.preventDefault();
    finish(dlg.kind === "confirm" ? true : text.trim());
  };
  const o = dlg?.opts || {};

  return (
    <DialogContext.Provider value={value}>
      {children}
      {createPortal(
        <>
          <div className="dlg-toasts">
            {toasts.map((t) => (
              <div key={t.id} className={`dlg-toast ${t.type}`} role="status">
                <span className="dlg-toast-icon">{t.type === "success" ? "✓" : t.type === "error" ? "!" : "i"}</span>
                <span>{t.message}</span>
                <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}>×</button>
              </div>
            ))}
          </div>

          {dlg && (
            <div className="dlg-backdrop" onMouseDown={cancel}>
              <form className="dlg-box" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}
                    onKeyDown={(e) => e.key === "Escape" && cancel()}>
                <h3>{o.title || (dlg.kind === "confirm" ? "Are you sure?" : "Enter a value")}</h3>
                {o.message && <p>{o.message}</p>}
                {dlg.kind === "prompt" &&
                  (o.multiline ? (
                    <textarea autoFocus rows={3} value={text} placeholder={o.placeholder} onChange={(e) => setText(e.target.value)} />
                  ) : (
                    <input autoFocus value={text} placeholder={o.placeholder} onChange={(e) => setText(e.target.value)} />
                  ))}
                <div className="dlg-actions">
                  <button type="button" className="db-btn db-btn-outline" onClick={cancel}>{o.cancelLabel || "Cancel"}</button>
                  <button className={`db-btn ${o.danger ? "db-btn-danger" : "db-btn-primary"}`}
                          autoFocus={dlg.kind === "confirm"} disabled={o.required && !text.trim()}>
                    {o.confirmLabel || "OK"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>,
        document.body
      )}
    </DialogContext.Provider>
  );
};

export default DialogProvider;