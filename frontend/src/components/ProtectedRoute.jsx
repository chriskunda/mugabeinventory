import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap a route element with this to require auth (and optionally a specific role).
 * Usage: <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout .../></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // or a small spinner, once you have one

  if (!user) return <Navigate to="/" replace />;

  if (role && user.role !== role) {
    // logged in, but on the wrong dashboard for their role
    return <Navigate to={user.role === "admin" ? "/admin" : "/manager"} replace />;
  }

  return children;
};

export default ProtectedRoute;
