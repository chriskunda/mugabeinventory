import { useCallback, useEffect, useState } from "react";
import { financeApi } from "../api/admin";
import { downloadFile } from "../api/reports";
import Select from "../components/ui/Select";
import DatePicker from "../components/ui/DatePicker";
import { useDialog } from "../components/ui/dialogContext";
import "./AdminDashboard.css";

const now = new Date();
const today = now.toISOString().slice(0, 10);
const fmt = (n) => `${(n || 0).toLocaleString()} RWF`;

const AdminIncomeStatement = () => {
  const { confirm, toast } = useDialog();
  const [period, setPeriod] = useState("month");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ category: "", amount: "", date: today, notes: "" });
  const [error, setError] = useState("");

  const value = period === "month" ? month : period === "quarter" ? `${year}-Q${quarter}` : String(year);

  const load = useCallback(async () => {
    try {
      setError("");
      const [s, e] = await Promise.all([financeApi.incomeStatement(period, value), financeApi.expenses(period, value)]);
      setData(s);
      setExpenses(e);
    } catch (err) {
      setError(err.message);
    }
  }, [period, value]);

  useEffect(() => { load(); }, [load]);

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      await financeApi.addExpense({ ...form, amount: Number(form.amount) });
      setForm((f) => ({ ...f, category: "", amount: "", notes: "" }));
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const removeExpense = async (id) => {
    const accepted = await confirm({
      title: "Delete expense?",
      message: "This expense will be removed from the income statement.",
      danger: true,
      confirmLabel: "Delete",
    });
    if (!accepted) return;
    try {
      await financeApi.deleteExpense(id);
      toast("Expense deleted.", "success");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const download = (kind) =>
    downloadFile(`/dashboard/income-statement/${kind}?period=${period}&value=${value}`,
                 `income-statement-${value}.${kind === "pdf" ? "pdf" : "xlsx"}`);

  return (
    <div>
      <div className="db-page-head">
        <div><h1>Income statement</h1><p>Sales, returns and expenses for a month, quarter or year.</p></div>
        <div className="db-actions">
          <button className="db-btn db-btn-outline" onClick={() => download("pdf")}>Download PDF</button>
          <button className="db-btn db-btn-outline" onClick={() => download("excel")}>Download Excel</button>
        </div>
      </div>

      <div className="db-toolbar">
        <Select
          value={period}
          onChange={setPeriod}
          options={[
            { value: "month", label: "Month" },
            { value: "quarter", label: "Quarter" },
            { value: "year", label: "Year" },
          ]}
        />
        {period === "month" && <DatePicker mode="month" value={month} onChange={setMonth} />}
        {period !== "month" && (
          <input type="number" value={year} min="2000" max="2100" onChange={(e) => setYear(e.target.value)} style={{ width: 90 }} />
        )}
        {period === "quarter" && (
          <Select
            value={quarter}
            onChange={setQuarter}
            options={[1, 2, 3, 4].map((q) => ({ value: q, label: `Q${q}` }))}
          />
        )}
      </div>

      {error && <div className="db-empty">{error}</div>}

      {data && (
        <div className="db-grid-2">
          <div className="db-panel">
            <div className="db-panel-head"><div><h2>{data.label}</h2></div></div>
            <div className="db-panel-body">
              <div className="db-ledger-row"><span>Gross sales</span><span className="db-num">{fmt(data.grossSales)}</span></div>
              <div className="db-ledger-row"><span>Returns / refunds</span><span className="db-num">-{fmt(data.refunds)}</span></div>
              <div className="db-ledger-row"><span>Net sales</span><span className="db-num">{fmt(data.netSales)}</span></div>
              {data.expenses.map((e) => (
                <div className="db-ledger-row" key={e.category}><span>{e.category}</span><span className="db-num">-{fmt(e.amount)}</span></div>
              ))}
              <div className="db-ledger-row"><span>Total expenses</span><span className="db-num">-{fmt(data.totalExpenses)}</span></div>
              <div className="db-ledger-row total">
                <span>{data.net >= 0 ? "Net profit" : "Net loss"}</span>
                <span className={`db-num ${data.net >= 0 ? "pos" : "neg"}`}>{fmt(Math.abs(data.net))}</span>
              </div>
            </div>
          </div>

          <div className="db-panel">
            <div className="db-panel-head"><div><h2>Add an expense</h2><div className="sub">Counts toward the statement for its date</div></div></div>
            <div className="db-panel-body">
              <form onSubmit={addExpense}>
                <div className="db-field"><label>Category</label>
                  <input list="cats" value={form.category} required onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  <datalist id="cats">{["Rent", "Cost of goods", "Salaries", "Transport", "Utilities", "Other"].map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="db-field-row">
                  <div className="db-field"><label>Amount (RWF)</label>
                    <input type="number" min="1" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div className="db-field"><label>Date</label>
                    <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
                </div>
                <div className="db-field"><label>Notes</label>
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <button className="db-btn db-btn-primary">Add expense</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {data?.breakdown?.length > 0 && (
        <div className="db-panel">
          <div className="db-panel-head"><div><h2>Month by month</h2></div></div>
          <div className="db-panel-body">
            <table className="db-table">
              <thead><tr><th>Month</th><th>Net sales</th><th>Expenses</th><th>Net</th></tr></thead>
              <tbody>
                {data.breakdown.map((b) => (
                  <tr key={b.month}>
                    <td data-label="Month">{b.month}</td>
                    <td data-label="Net sales" className="db-num">{fmt(b.netSales)}</td>
                    <td data-label="Expenses" className="db-num">{fmt(b.totalExpenses)}</td>
                    <td data-label="Net" className="db-num">{fmt(b.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="db-panel">
        <div className="db-panel-head"><div><h2>Expenses in this period</h2></div></div>
        <div className="db-panel-body">
          {expenses.length === 0 ? <div className="db-empty">No expenses recorded.</div> : (
            <table className="db-table">
              <thead><tr><th>Date</th><th>Category</th><th>Notes</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {expenses.map((x) => (
                  <tr key={x._id}>
                    <td data-label="Date">{new Date(x.date).toLocaleDateString()}</td>
                    <td data-label="Category">{x.category}</td>
                    <td data-label="Notes">{x.notes || "—"}</td>
                    <td data-label="Amount" className="db-num">{fmt(x.amount)}</td>
                    <td><button className="db-btn db-btn-ghost" onClick={() => removeExpense(x._id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminIncomeStatement;