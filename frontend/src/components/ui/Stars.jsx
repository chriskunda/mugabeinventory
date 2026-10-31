import "./ui.css";

const Stars = ({ value = 0, onChange }) => (
  <span className="ui-stars">
    {[1, 2, 3, 4, 5].map((n) =>
      onChange ? (
        <button type="button" key={n} className={n <= value ? "on" : ""} onClick={() => onChange(n)} aria-label={`${n} stars`}>★</button>
      ) : (
        <span key={n} className={n <= Math.round(value) ? "on" : ""}>★</span>
      )
    )}
  </span>
);
export default Stars;