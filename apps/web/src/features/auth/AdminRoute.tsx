import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Restringe rutas exclusivas para administradores. */
export function AdminRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/books" replace />;
}
