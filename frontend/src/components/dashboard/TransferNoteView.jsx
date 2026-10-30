import { formatStamp } from "../../utils/format";

const TransferNoteView = ({ note }) => {
  const total = note.lines.reduce((sum, line) => sum + Number(line.qty || 0), 0);

  return (
    <div className="db-tn">
      <div className="db-tn-head">
        <div>
          <div className="db-tn-title">Transfer note</div>
          <div className="db-tn-route">
            {note.fromBranch?.name} <span>→</span> {note.toBranch?.name}
          </div>
        </div>
        <span className={`db-badge ${note.status}`}>{note.status}</span>
      </div>

      <table className="db-tn-table">
        <thead>
          <tr><th style={{ width: 36 }}>#</th><th>Size</th><th className="r">Quantity</th></tr>
        </thead>
        <tbody>
          {note.lines.map((line, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{line.size || line.product}</td>
              <td className="r">{line.qty}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={2}>Total</td><td className="r">{total}</td></tr>
        </tfoot>
      </table>

      <div className="db-tn-foot">
        <div>Done by <strong>{note.createdBy?.name}</strong></div>
        <div className="db-tn-stamp">{formatStamp(note.createdAt)}</div>
      </div>
    </div>
  );
};

export default TransferNoteView;
