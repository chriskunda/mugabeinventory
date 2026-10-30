import { createPortal } from "react-dom";
import usePopup from "./usePopup";
import "./ui.css";

/** options: strings, or { value, label } objects (you can mix them) */
const Select = ({ value, onChange, options, placeholder = "Select…" }) => {
  const { anchorRef, popRef, pos, toggle, close } = usePopup();
  const opts = options.map((o) => (typeof o === "object" ? o : { value: o, label: o }));
  const current = opts.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        ref={anchorRef}
        className={`ui-select ${pos ? "open" : ""}`}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={!!pos}
      >
        <span className={current ? "" : "ph"}>{current ? current.label : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {pos &&
        createPortal(
          <ul ref={popRef} role="listbox" className="ui-pop ui-list" style={{ position: "fixed", ...pos }}>
            {opts.map((o) => (
              <li
                key={String(o.value)}
                role="option"
                aria-selected={o.value === value}
                className={o.value === value ? "sel" : ""}
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
              >
                <span>{o.label}</span>
                {o.value === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                )}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
};

export default Select;