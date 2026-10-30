import { useState } from "react";
import { createPortal } from "react-dom";
import usePopup from "./usePopup";
import "./ui.css";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const pad = (n) => String(n).padStart(2, "0");

const DatePicker = ({ value, onChange, mode = "date", placeholder = "Pick a date", clearable = false }) => {
  const { anchorRef, popRef, pos, toggle, close } = usePopup(288);
  const now = new Date();
  const [y0, m0, d0] = String(value || "").split("-").map(Number);
  const startView = () => ({ y: y0 || now.getFullYear(), m: (m0 || now.getMonth() + 1) - 1 });
  const [view, setView] = useState(startView);

  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const label = !y0 ? "" : mode === "month" ? `${MONTHS[m0 - 1]} ${y0}` : `${d0} ${MONTHS[m0 - 1].slice(0, 3)} ${y0}`;

  const handleToggle = () => {
    if (!pos) setView(startView());
    toggle();
  };
  const pick = (v) => {
    onChange(v);
    close();
  };
  const shiftMonth = (n) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const shiftYear = (n) => setView((v) => ({ ...v, y: v.y + n }));

  const first = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday-first
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];

  return (
    <>
      <button type="button" ref={anchorRef} className={`ui-select ${pos ? "open" : ""}`} onClick={handleToggle}>
        <span className={label ? "" : "ph"}>{label || placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {pos &&
        createPortal(
          <div ref={popRef} className="ui-pop ui-cal" style={{ position: "fixed", ...pos }}>
            <div className="ui-cal-head">
              <button type="button" className="ui-cal-nav" onClick={() => (mode === "month" ? shiftYear(-1) : shiftMonth(-1))}>‹</button>
              <span>{mode === "month" ? view.y : `${MONTHS[view.m]} ${view.y}`}</span>
              <button type="button" className="ui-cal-nav" onClick={() => (mode === "month" ? shiftYear(1) : shiftMonth(1))}>›</button>
            </div>

            {mode === "month" ? (
              <div className="ui-cal-months">
                {MONTHS.map((m, i) => {
                  const str = `${view.y}-${pad(i + 1)}`;
                  return (
                    <button
                      type="button" key={m}
                      className={`ui-cal-day ${str === value ? "sel" : ""} ${str === todayStr.slice(0, 7) ? "today" : ""}`}
                      onClick={() => pick(str)}
                    >
                      {m.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="ui-cal-grid">
                {DOW.map((d) => <div key={d} className="ui-cal-dow">{d}</div>)}
                {cells.map((d, i) => {
                  if (!d) return <span key={`e${i}`} />;
                  const str = `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
                  return (
                    <button
                      type="button" key={str}
                      className={`ui-cal-day ${str === value ? "sel" : ""} ${str === todayStr ? "today" : ""}`}
                      onClick={() => pick(str)}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="ui-cal-foot">
              {clearable && value ? (
                <button type="button" className="ui-cal-link" onClick={() => pick("")}>Clear</button>
              ) : <span />}
              <button type="button" className="ui-cal-link" onClick={() => pick(mode === "month" ? todayStr.slice(0, 7) : todayStr)}>
                {mode === "month" ? "This month" : "Today"}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default DatePicker;