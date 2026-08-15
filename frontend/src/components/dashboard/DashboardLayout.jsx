import { NavLink, Outlet } from "react-router-dom";
import "./DashboardLayout.css";

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/sales-reports", label: "Sales reports" },
  { to: "/admin/managers", label: "Managers" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/transfers", label: "Transfer notes" },
  { to: "/admin/income-statement", label: "Income statement" },
];

const MANAGER_NAV = [
  { to: "/manager", label: "Overview", end: true },
  { to: "/manager/reports", label: "Daily reports" },
  { to: "/manager/transfers", label: "Transfer notes" },
];

/**
 * role: "admin" | "manager"
 * user: { name, branch }
 */
const DashboardLayout = ({ role, user = { name: "User", branch: "Main" } }) => {
  const nav = role === "admin" ? ADMIN_NAV : MANAGER_NAV;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="dashboard-app db-shell">
      <aside className="db-sidebar">
        <div className="db-brand">
          <span className="db-brand-mark">◆</span>
          <span>Ledger</span>
        </div>

        <nav className="db-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                "db-nav-link" + (isActive ? " active" : "")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="db-sidebar-foot">
          <button type="button" className="db-nav-link logout">
            Log out
          </button>
        </div>
      </aside>

      <div className="db-main">
        <header className="db-topbar">
          <div className="db-branch-pill">{user.branch} branch</div>
          <div className="db-user">
            <span className="db-user-name">{user.name}</span>
            <span className="db-avatar">{initials}</span>
          </div>
        </header>

        <main className="db-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
