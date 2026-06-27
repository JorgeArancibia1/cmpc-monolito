import type { AuthUser, LoginInput } from '@cmpc/contracts';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { refreshSession } from '@/lib/api';
import { fetchMe, loginRequest, logoutRequest } from './api';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: Status;
  isAdmin: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  // Restaura la sesión al cargar usando el refresh cookie.
  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await refreshSession();
      if (!active) return;
      if (!token) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const me = await fetchMe();
        if (!active) return;
        setUser(me);
        setStatus('authenticated');
      } catch {
        if (active) setStatus('unauthenticated');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials: LoginInput) => {
    setUser(await loginRequest(credentials));
    setStatus('authenticated');
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ user, status, isAdmin: user?.role === 'ADMIN', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
