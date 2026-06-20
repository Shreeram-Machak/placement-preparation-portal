import { Navigate, useLocation } from 'react-router-dom';
import { getAuthUser, isAuthenticated } from '../utils/auth';

function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  const user = getAuthUser();
  if (location.pathname.startsWith('/admin') && user?.role !== 'admin') {
    return <Navigate replace to="/dashboard" />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate replace state={{ accessDenied: true }} to="/dashboard" />;
  }

  return children;
}

export default ProtectedRoute;
