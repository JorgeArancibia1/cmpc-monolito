import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  return status === 'unauthenticated' ? <Navigate to="/login" replace /> : <Outlet />;
}
