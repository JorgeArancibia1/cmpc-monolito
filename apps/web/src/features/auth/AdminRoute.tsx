import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Restringe las rutas de escritura (alta/edición) a administradores. */
export function AdminRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/books" replace />;
}
