import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/login.jsx";
import DashboardLayout from "./components/dashboard/DashboardLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";

// Placeholder page components for the routes we listed in the sidebar nav
// but haven't built the detail views for yet. Swap these out as you build
// each one — they exist so links don't 404 while wiring things up.
const Placeholder = ({ title }) => (
  <div style={{ padding: 20 }}>
    <h1 style={{ fontFamily: "serif" }}>{title}</h1>
    <p style={{ color: "#96959E" }}>This page is coming soon.</p>
  </div>
);

function App() {
  // TODO: replace with real auth state (e.g. from context, after login API call)
  const currentUser = { name: "Aline Uwase", branch: "Remera", role: "manager" };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/admin" element={<DashboardLayout role="admin" user={currentUser} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="sales-reports" element={<Placeholder title="Sales reports" />} />
          <Route path="managers" element={<Placeholder title="Managers" />} />
          <Route path="products" element={<Placeholder title="Products" />} />
          <Route path="transfers" element={<Placeholder title="Transfer notes" />} />
          <Route path="income-statement" element={<Placeholder title="Income statement" />} />
        </Route>

        <Route path="/manager" element={<DashboardLayout role="manager" user={currentUser} />}>
          <Route index element={<ManagerDashboard />} />
          <Route path="reports" element={<Placeholder title="Daily reports" />} />
          <Route path="transfers" element={<Placeholder title="Transfer notes" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
