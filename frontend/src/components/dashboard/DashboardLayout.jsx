import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDialog } from "../ui/dialogContext";
import { notificationsApi } from "../../api/admin";
import { authApi } from "../../api/auth";
import "./DashboardLayout.css";

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/sales-reports", label: "Sales reports" },
  { to: "/admin/managers", label: "Managers" },
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/branches", label: "Branches" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/purchases", label: "Purchases" },
  { to: "/admin/transfers", label: "Transfer notes" },
  { to: "/admin/returns", label: "Returns" },
  { to: "/admin/search", label: "Client search" },
  { to: "/admin/income-statement", label: "Income statement" },
  { to: "/admin/goals", label: "Goals" },
];
const MANAGER_NAV = [
  { to: "/manager", label: "Overview", end: true },
  { to: "/manager/reports", label: "Daily reports" },
  { to: "/manager/transfers", label: "Transfer notes" },
  { to: "/manager/purchases", label: "Purchases" },
  { to: "/manager/requests", label: "Requests" },
  { to: "/manager/search", label: "Client search" },
];

const toastType = (kind) =>
  ["approved", "achieved", "exceeded"].includes(kind) ? "success" : ["rejected", "failed"].includes(kind) ? "error" : "info";

const resizeToDataUrl = (file, size = 160) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file isn't a valid image"));
    };
    img.src = url;
  });

const DashboardLayout = ({ role, user = { name: "User", branch: "" } }) => {
  const { logout, setUser } = useAuth();
  const { toast } = useDialog();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const seen = useRef(null);
  const nav = role === "admin" ? ADMIN_NAV : MANAGER_NAV;
  const firstName = (user.name || "User").trim().split(" ")[0];

  const [notes, setNotes] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = () =>
      notificationsApi
        .list()
        .then((d) => {
          if (seen.current) {
            d.items.filter((n) => !n.read && !seen.current.has(n._id)).forEach((n) => toast(`${n.title}: ${n.message}`, toastType(n.kind)));
          }
          seen.current = new Set(d.items.map((n) => n._id));
          setNotes(d);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [toast]);

  const toggleBell = async () => {
    setOpen((o) => !o);
    if (!open && notes.unread) {
      await notificationsApi.readAll().catch(() => {});
      setNotes((n) => ({ ...n, unread: 0 }));
    }
  };
  const removeNote = async (id) => {
    await notificationsApi.remove(id).catch(() => {});
    setNotes((n) => ({ ...n, items: n.items.filter((x) => x._id !== id) }));
  };
  const clearNotes = async () => {
    await notificationsApi.clear().catch(() => {});
    setNotes({ items: [], unread: 0 });
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUser(await authApi.setPhoto(await resizeToDataUrl(file)));
      toast("Photo updated", "success");
    } catch (err) {
      toast(err.message, "error");
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
        <div className="db-brand"><span className="db-brand-mark">◆</span><span>Ledger</span></div>
        <nav className="db-nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => "db-nav-link" + (isActive ? " active" : "")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="db-sidebar-foot">
          <button type="button" className="db-nav-link logout" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <div className="db-main">
        <header className="db-topbar">
          <div className="db-branch-pill">{role === "admin" ? "All branches" : `${user.branch} branch`}</div>

          <div className="db-bell-wrap">
            <button type="button" className="db-bell" onClick={toggleBell} aria-label="Notifications">
              🔔{notes.unread > 0 && <span className="db-bell-count">{notes.unread}</span>}
            </button>
            {open && (
              <div className="db-bell-menu">
                {notes.items.length > 0 && (
                  <div className="db-bell-head">
                    <span>Notifications</span>
                    <button type="button" onClick={clearNotes}>Clear all</button>
                  </div>
                )}
                {notes.items.length === 0 ? (
                  <div className="db-empty">No notifications</div>
                ) : (
                  notes.items.map((n) => (
                    <div key={n._id} className={`db-note ${n.kind}`}>
                      <div>
                        <strong>{n.title}</strong>
                        <p>{n.message}</p>
                      </div>
                      <button type="button" className="db-note-x" aria-label="Delete notification" onClick={() => removeNote(n._id)}>×</button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="db-user">
            <span className="db-user-name">{firstName}</span>
            <button type="button" className="db-avatar db-avatar-btn" onClick={() => fileRef.current.click()} title="Change photo">
              {user.photo ? <img src={user.photo} alt="" /> : firstName[0]?.toUpperCase()}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          </div>
        </header>

        <main className="db-content"><Outlet /></main>
      </div>
    </div>
  );
};

export default DashboardLayout;