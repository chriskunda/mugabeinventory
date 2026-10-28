import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { financeApi } from "../api/admin";
import { reportsApi } from "../api/reports";
import { managersApi } from "../api/managers";
import { transfersApi } from "../api/transfers";
import StatCard from "../components/dashboard/StatCard";
import Modal from "../components/dashboard/Modal";
import DailyReportForm from "../components/dashboard/DailyReportForm";
import TransferNoteForm from "../components/dashboard/TransferNoteForm";
import "./AdminDashboard.css";

const fmt = (n) => `${(n || 0).toLocaleString()} RWF`;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(null);
  const [reports, setReports] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState([]);
  const [stmt, setStmt] = useState(null);
  const [overviewError, setOverviewError] = useState("");

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    api
      .get("/dashboard/sales-trend?months=6")
      .then(setTrend)
      .catch((err) => setOverviewError(err.message));
    financeApi
      .incomeStatement("month", month)
      .then(setStmt)
      .catch((err) => setOverviewError(err.message));
  }, []);

  const load = () => {
    setLoading(true);
    Promise.all([reportsApi.all(), managersApi.list()])
      .then(([reports, managers]) => {
        setReports(reports);
        setManagers(managers);
      })
      .catch((err) => setOverviewError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([reportsApi.all(), managersApi.list()])
      .then(([reports, managers]) => {
        setReports(reports);
        setManagers(managers);
      })
      .catch((err) => setOverviewError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const pendingEditRequests = reports.filter((r) => r.status === "edit_requested");

  const net = stmt?.net ?? 0;
  const isProfit = net >= 0;

  const lastMonth = trend.at(-1)?.sales ?? 0;
  const prevMonth = trend.at(-2)?.sales ?? 0;
  const delta = prevMonth ? (((lastMonth - prevMonth) / prevMonth) * 100).toFixed(1) : "0.0";

  const resolveRequest = async (id, approve) => {
    await reportsApi.resolveEdit(id, approve);
    load();
  };

  const handleNewReport = async (payload) => {
    await reportsApi.create(payload);
    setOpenModal(null);
    load();
  };

  const handleNewTransfer = async (payload) => {
    await transfersApi.create(payload);
    setOpenModal(null);
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Overview</h1>
          <p>Here's how every branch is performing.</p>
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

      {overviewError && <div className="db-empty">{overviewError}</div>}

      <div className="db-stat-grid">
        <StatCard
          label="Sales this month"
          value={fmt(stmt?.netSales)}
          trend={{ direction: delta >= 0 ? "up" : "down", value: `${Math.abs(delta)}%`, label: "vs last month" }}
        />
        <StatCard
          label={isProfit ? "Net profit" : "Net loss"}
          value={fmt(Math.abs(net))}
          trend={{ direction: isProfit ? "up" : "down", value: isProfit ? "In profit" : "In loss", label: "this month" }}
        />
        <StatCard label="Active managers" value={managers.length} />
        <StatCard
          label="Pending edit requests"
          value={pendingEditRequests.length}
          trend={pendingEditRequests.length ? { direction: "down", value: "Needs review", label: "" } : undefined}
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
                <LineChart data={trend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
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
              <div className="sub">{new Date().toLocaleString("en", { month: "long", year: "numeric" })}</div>
            </div>
          </div>
          <div className="db-panel-body">
            <div className="db-ledger-row">
              <span>Net sales</span>
              <span className="db-num">{fmt(stmt?.netSales)}</span>
            </div>
            <div className="db-ledger-row">
              <span>Operating expenses</span>
              <span className="db-num">-{fmt(stmt?.totalExpenses)}</span>
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
          {loading ? (
            <div className="db-empty">Loading…</div>
          ) : managers.length === 0 ? (
            <div className="db-empty">No approved managers yet.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Branch</th>
                  <th>Reports</th>
                  <th>Sales</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((m) => (
                  <tr key={m.id}>
                    <td data-label="Manager">{m.name}</td>
                    <td data-label="Branch">{m.branch}</td>
                    <td data-label="Reports">{m.reportsCount}</td>
                    <td data-label="Sales" className="db-num">{fmt(m.totalSales)}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${m.status}`}>{m.status.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
          {pendingEditRequests.length === 0 ? (
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
                {pendingEditRequests.map((r) => (
                  <tr key={r._id}>
                    <td data-label="Manager">{r.manager?.name}</td>
                    <td data-label="Branch">{r.branch?.name}</td>
                    <td data-label="Report date">{new Date(r.date).toLocaleDateString()}</td>
                    <td data-label="Reason">{r.editRequest?.reason || "—"}</td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="db-btn db-btn-outline" onClick={() => resolveRequest(r._id, true)}>
                          Approve
                        </button>
                        <button className="db-btn db-btn-ghost" onClick={() => resolveRequest(r._id, false)}>
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
        <Modal title="New sales report" subtitle={user?.branch} onClose={() => setOpenModal(null)}>
          <DailyReportForm defaultBranch={user?.branch} onCancel={() => setOpenModal(null)} onSubmit={handleNewReport} />
        </Modal>
      )}
      {openModal === "transfer" && (
        <Modal title="New transfer note" subtitle="Send products to another branch" onClose={() => setOpenModal(null)}>
          <TransferNoteForm fromBranch={user?.branch} onCancel={() => setOpenModal(null)} onSubmit={handleNewTransfer} />
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
