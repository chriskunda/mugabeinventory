const fmt = (n) => (n ?? 0).toLocaleString();

const ReportView = ({ report }) => {
  if (!report) return null;

  return (
    <div className="db-report-view">
      <div className="db-report-title">
        {report.branch?.name} — {new Date(report.date).toLocaleDateString()}
      </div>

      <ol className="db-report-clients">
        {report.clients.map((c, i) => (
          <li key={i}>
            {c.tires.map((t, ti) => (
              <div key={ti} className="db-report-tire">
                {t.name} — {t.size} — DOT {t.dot || "—"}{" "}
                <span className="db-num">{fmt(t.price)}</span>
              </div>
            ))}
            <div className="db-report-client-name">
              {c.clientName}
              {c.clientPhone ? ` — ${c.clientPhone}` : ""}
            </div>
          </li>
        ))}
      </ol>

      <div className="db-ledger-row">
        <span>Total ({report.totalTyres} tyres)</span>
        <span className="db-num">{fmt(report.tyresTotal)}</span>
      </div>
      <div className="db-ledger-row">
        <span>Average</span>
        <span className="db-num">{fmt(report.average)}</span>
      </div>

      {report.transfers?.length > 0 && (
        <>
          <div className="db-report-section-title">Transfer</div>
          <ul className="db-report-plain-list">
            {report.transfers.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </>
      )}

      {report.otherSales?.length > 0 && (
        <>
          <div className="db-report-section-title">Other sales</div>
          <ul className="db-report-plain-list">
            {report.otherSales.map((o, i) => (
              <li key={i}>
                {o.item} <span className="db-num">{fmt(o.price)}</span>
              </li>
            ))}
          </ul>
          <div className="db-ledger-row">
            <span>Other sales total</span>
            <span className="db-num">{fmt(report.otherSalesTotal)}</span>
          </div>
        </>
      )}

      <div className="db-ledger-row total">
        <span>Grand total</span>
        <span className="db-num">{fmt(report.grandTotal)}</span>
      </div>
      <div className="db-ledger-row">
        <span>Current stock (was {report.openingStock})</span>
        <span className="db-num">{fmt(report.closingStock)}</span>
      </div>

      <div className="db-report-footer">Done by {report.manager?.name}</div>
    </div>
  );
};

export default ReportView;
