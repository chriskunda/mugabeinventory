import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/login.jsx";
import DashboardLayout from "./components/dashboard/DashboardLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import AdminSalesReports from "./pages/AdminSalesReports.jsx";
import AdminManagers from "./pages/AdminManagers.jsx";
import AdminTransfers from "./pages/AdminTransfers.jsx";
import ManagerReports from "./pages/ManagerReports.jsx";
import ManagerTransfers from "./pages/ManagerTransfers.jsx";

const Placeholder = ({ title }) => (
  <div style={{ padding: 20 }}>
    <h1 style={{ fontFamily: "serif" }}>{title}</h1>
    <p style={{ color: "#96959E" }}>This page is coming soon.</p>
  </div>
);

// DashboardLayout takes a `user` prop for the topbar. The real user now
// lives in AuthContext, so this small wrapper reads it from there and
// passes it down — keeps DashboardLayout itself unchanged.
const DashboardShell = ({ role }) => {
  const { user } = useAuth();
  return <DashboardLayout role={role} user={user} />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <DashboardShell role="admin" />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="sales-reports" element={<AdminSalesReports />} />
            <Route path="managers" element={<AdminManagers />} />
            <Route path="products" element={<Placeholder title="Products" />} />
            <Route path="transfers" element={<AdminTransfers />} />
            <Route path="income-statement" element={<Placeholder title="Income statement" />} />
          </Route>

          <Route
            path="/manager"
            element={
              <ProtectedRoute role="manager">
                <DashboardShell role="manager" />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagerDashboard />} />
            <Route path="reports" element={<ManagerReports />} />
            <Route path="transfers" element={<ManagerTransfers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
