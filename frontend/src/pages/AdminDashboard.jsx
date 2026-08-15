import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import StatCard from "../components/dashboard/StatCard";
import Modal from "../components/dashboard/Modal";
import DailyReportForm from "../components/dashboard/DailyReportForm";
import TransferNoteForm from "../components/dashboard/TransferNoteForm";
import "./AdminDashboard.css";

// ---- placeholder data — replace with API calls once the backend is wired up ----
const SALES_TREND = [
  { month: "Mar", sales: 8_200_000 },
  { month: "Apr", sales: 9_100_000 },
  { month: "May", sales: 8_750_000 },
  { month: "Jun", sales: 10_400_000 },
  { month: "Jul", sales: 9_800_000 },
  { month: "Aug", sales: 11_650_000 },
];

const MANAGERS = [
  { id: 1, name: "Aline Uwase", branch: "Kimironko", reports: 26, sales: 4_120_000, status: "approved" },
  { id: 2, name: "Eric Habimana", branch: "Nyabugogo", reports: 24, sales: 3_640_000, status: "approved" },
  { id: 3, name: "Diane Mukamana", branch: "Remera", reports: 21, sales: 2_980_000, status: "edit_requested" },
  { id: 4, name: "Jean Bosco", branch: "Kicukiro", reports: 25, sales: 3_910_000, status: "approved" },
];

const PENDING_REQUESTS = [
  { id: 1, manager: "Diane Mukamana", branch: "Remera", date: "2026-08-11", reason: "Wrong quantity on 2 items" },
];

const INCOME_STATEMENT = {
  revenue: 11_650_000,
  cogs: 6_430_000,
  expenses: 1_820_000,
};

const BRANCHES = ["Kimironko", "Nyabugogo", "Remera", "Kicukiro", "Main"];

const fmt = (n) => `${n.toLocaleString()} RWF`;

const AdminDashboard = () => {
  const [openModal, setOpenModal] = useState(null); // "report" | "transfer" | null
  const [requests, setRequests] = useState(PENDING_REQUESTS);

  const net = useMemo(
    () => INCOME_STATEMENT.revenue - INCOME_STATEMENT.cogs - INCOME_STATEMENT.expenses,
    []
  );
  const isProfit = net >= 0;

  const lastMonth = SALES_TREND[SALES_TREND.length - 1].sales;
  const prevMonth = SALES_TREND[SALES_TREND.length - 2].sales;
  const delta = (((lastMonth - prevMonth) / prevMonth) * 100).toFixed(1);

  const resolveRequest = (id) =>
    setRequests((prev) => prev.filter((r) => r.id !== id));

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Overview</h1>
          <p>Here's how every branch is performing this month.</p>
        </div>
        <div className="db-actions">
          <button className="db-btn db-btn-outline" onClick={() => setOpenModal("transfer")}>
            + Transfer note
          </button>
          <button className="db-btn db-btn-primary" onClick={() => setOpenModal("report")}>
            + Sales report
          </button>
        </div>
      </div>

      <div className="db-stat-grid">
        <StatCard
          label="Sales this month"
          value={fmt(lastMonth)}
          trend={{ direction: delta >= 0 ? "up" : "down", value: `${Math.abs(delta)}%`, label: "vs last month" }}
        />
        <StatCard
          label={isProfit ? "Net profit" : "Net loss"}
          value={fmt(Math.abs(net))}
          trend={{ direction: isProfit ? "up" : "down", value: isProfit ? "In profit" : "In loss", label: "this month" }}
        />
        <StatCard label="Active managers" value={MANAGERS.length} />
        <StatCard
          label="Pending edit requests"
          value={requests.length}
          trend={requests.length ? { direction: "down", value: "Needs review", label: "" } : undefined}
        />
      </div>

      <div className="db-grid-2">
        <div className="db-panel">
          <div className="db-panel-head">
            <div>
              <h2>Sales trend</h2>
              <div className="sub">Last 6 months, all branches combined</div>
            </div>
          </div>
          <div className="db-panel-body">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SALES_TREND} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#E8E1D8" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#96959E" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#96959E" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, borderColor: "#E8E1D8", fontSize: 13 }} />
                  <Line type="monotone" dataKey="sales" stroke="#8B3A2A" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="db-panel">
          <div className="db-panel-head">
            <div>
              <h2>Income statement</h2>
              <div className="sub">August 2026</div>
            </div>
            <button className="db-btn db-btn-ghost">Download</button>
          </div>
          <div className="db-panel-body">
            <div className="db-ledger-row">
              <span>Revenue</span>
              <span className="db-num">{fmt(INCOME_STATEMENT.revenue)}</span>
            </div>
            <div className="db-ledger-row">
              <span>Cost of goods sold</span>
              <span className="db-num">-{fmt(INCOME_STATEMENT.cogs)}</span>
            </div>
            <div className="db-ledger-row">
              <span>Operating expenses</span>
              <span className="db-num">-{fmt(INCOME_STATEMENT.expenses)}</span>
            </div>
            <div className="db-ledger-row total">
              <span>{isProfit ? "Net profit" : "Net loss"}</span>
              <span className={`db-num ${isProfit ? "pos" : "neg"}`}>{fmt(Math.abs(net))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div>
            <h2>Managers</h2>
            <div className="sub">Sales reports submitted by each branch manager</div>
          </div>
        </div>
        <div className="db-panel-body">
          <table className="db-table">
            <thead>
              <tr>
                <th>Manager</th>
                <th>Branch</th>
                <th>Reports</th>
                <th>Sales this month</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {MANAGERS.map((m) => (
                <tr key={m.id}>
                  <td data-label="Manager">{m.name}</td>
                  <td data-label="Branch">{m.branch}</td>
                  <td data-label="Reports">{m.reports}</td>
                  <td data-label="Sales" className="db-num">{fmt(m.sales)}</td>
                  <td data-label="Status">
                    <span className={`db-badge ${m.status}`}>{m.status.replace("_", " ")}</span>
                  </td>
                  <td data-label="">
                    <button className="db-btn db-btn-ghost">View reports</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <div>
            <h2>Pending edit requests</h2>
            <div className="sub">A manager needs your approval to edit a submitted report</div>
          </div>
        </div>
        <div className="db-panel-body">
          {requests.length === 0 ? (
            <div className="db-empty">No pending requests right now.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Branch</th>
                  <th>Report date</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Manager">{r.manager}</td>
                    <td data-label="Branch">{r.branch}</td>
                    <td data-label="Report date">{r.date}</td>
                    <td data-label="Reason">{r.reason}</td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="db-btn db-btn-outline" onClick={() => resolveRequest(r.id)}>
                          Approve
                        </button>
                        <button className="db-btn db-btn-ghost" onClick={() => resolveRequest(r.id)}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {openModal === "report" && (
        <Modal title="New sales report" subtitle="Recorded under the Main branch" onClose={() => setOpenModal(null)}>
          <DailyReportForm onCancel={() => setOpenModal(null)} onSubmit={() => setOpenModal(null)} />
        </Modal>
      )}
      {openModal === "transfer" && (
        <Modal title="New transfer note" subtitle="Send products to another branch" onClose={() => setOpenModal(null)}>
          <TransferNoteForm
            branches={BRANCHES}
            fromBranch="Main"
            onCancel={() => setOpenModal(null)}
            onSubmit={() => setOpenModal(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
