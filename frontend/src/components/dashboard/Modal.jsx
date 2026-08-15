import "./Modal.css";

const Modal = ({ title, subtitle, onClose, children }) => {
  return (
    <div className="db-modal-backdrop" onClick={onClose}>
      <div className="db-modal" onClick={(e) => e.stopPropagation()}>
        <div className="db-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="db-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="db-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
