import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/login.jsx";
import DashboardLayout from "./components/dashboard/DashboardLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";

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
            <Route path="sales-reports" element={<Placeholder title="Sales reports" />} />
            <Route path="managers" element={<Placeholder title="Managers" />} />
            <Route path="products" element={<Placeholder title="Products" />} />
            <Route path="transfers" element={<Placeholder title="Transfer notes" />} />
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
            <Route path="reports" element={<Placeholder title="Daily reports" />} />
            <Route path="transfers" element={<Placeholder title="Transfer notes" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
