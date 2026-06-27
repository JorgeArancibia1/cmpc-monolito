import { BookOpen, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/books" className="flex items-center gap-2 font-bold text-brand-700">
              <BookOpen className="h-5 w-5" /> CMPC Libros
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link to="/books" className="hover:text-brand-700">Catálogo</Link>
              <Link to="/dashboard" className="hover:text-brand-700">Analítica</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/change-password"
              className="text-slate-600 hover:text-brand-700"
              title="Cambiar contraseña"
            >
              {user?.name} · <span className="text-slate-400">{user?.role}</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => logout()} aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
