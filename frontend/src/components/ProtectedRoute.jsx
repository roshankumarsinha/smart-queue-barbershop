import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectRole } from '../store/authSlice';
import { getRole } from '../config/roles';

// Guards a role-specific route.
//
//   <ProtectedRoute allow="SHOP_OWNER"><OwnerDashboard /></ProtectedRoute>
//
//  - Not logged in            -> redirect to /login
//  - Logged in, wrong role     -> redirect to THAT user's own dashboard
//  - Logged in, correct role   -> render the screen
export default function ProtectedRoute({ allow, children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectRole);
  const location = useLocation();

  if (!isAuthenticated) {
    // Remember where they were headed so we could bounce back after login later.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allow && role !== allow) {
    // Wrong role for this route — send them to their own dashboard instead.
    const home = getRole(role)?.path ?? '/login';
    return <Navigate to={home} replace />;
  }

  return children;
}
