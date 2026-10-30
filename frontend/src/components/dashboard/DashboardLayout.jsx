import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { notificationsApi } from "../../api/admin";
import { useAuth } from "../../context/AuthContext";
import "./DashboardLayout.css";

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/sales-reports", label: "Sales reports" },
  { to: "/admin/managers", label: "Managers" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/transfers", label: "Transfer notes" },
  { to: "/admin/returns", label: "Returns" },
  { to: "/admin/income-statement", label: "Income statement" },
  { to: "/admin/goals", label: "Goals" },
];

const MANAGER_NAV = [
  { to: "/manager", label: "Overview", end: true },
  { to: "/manager/reports", label: "Daily reports" },
  { to: "/manager/transfers", label: "Transfer notes" },
  { to: "/manager/returns", label: "Returns" },
];

/**
 * role: "admin" | "manager"
 * user: { name, branch }
 */
const DashboardLayout = ({ role, user = { name: "User", branch: "" } }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const nav = role === "admin" ? ADMIN_NAV : MANAGER_NAV;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    let active = true;
    const load = () => {
      notificationsApi
        .list()
        .then((result) => {
          if (!active) return;
          setNotes(result);
          setNotificationError("");
        })
        .catch((err) => {
          if (active) setNotificationError(err.message || "Could not load notifications");
        });
    };

    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const toggleBell = async () => {
    const shouldMarkRead = !open && notes.unread > 0;
    setOpen((currentlyOpen) => !currentlyOpen);
    if (shouldMarkRead) {
      try {
        await notificationsApi.readAll();
        setNotes((current) => ({ ...current, unread: 0 }));
        setNotificationError("");
      } catch (err) {
        setNotificationError(err.message || "Could not mark notifications as read");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  };

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
          <button type="button" className="db-nav-link logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="db-main">
        <header className="db-topbar">
          <div className="db-branch-pill">{role === "admin" ? "All branches" : `${user.branch} branch`}</div>
          <div className="db-topbar-actions">
            <div className="db-bell-wrap">
              <button
                type="button"
                className="db-bell"
                onClick={toggleBell}
                aria-label="Notifications"
                aria-expanded={open}
              >
                🔔
                {notes.unread > 0 && <span className="db-bell-count">{notes.unread}</span>}
              </button>
              {open && (
                <div className="db-bell-menu">
                  {notificationError && <div className="db-note-error">{notificationError}</div>}
                  {notes.items.length === 0 ? (
                    <div className="db-empty">No notifications</div>
                  ) : (
                    notes.items.map((note) => (
                      <div key={note._id} className={`db-note ${note.kind}`}>
                        <strong>{note.title}</strong>
                        <p>{note.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="db-user">
              <span className="db-user-name">{user.name}</span>
              <span className="db-avatar">{initials}</span>
            </div>
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
