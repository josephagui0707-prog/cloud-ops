import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { getVerifiedSession, signOutPassword } from '../lib/supabasePasswordAuth';
import { mockUsers } from '../data/mockUsers';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  loading: boolean;
  authError: string;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'cloudops.session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let alive = true;
    // Nunca confiar en un perfil cacheado sin un token válido verificado por Supabase.
    getVerifiedSession().then(session => {
      if (!alive) return;
      if (!session) {
        sessionStorage.removeItem(STORAGE_KEY);
        setUser(null);
        return;
      }
      const profile = mockUsers.find(u => u.email === session.user.email.toLowerCase());
      const name = session.user.user_metadata?.name || profile?.name || session.user.email;
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name,
        role: profile?.role || 'Analista Cloud',
        initials: profile?.initials || name.slice(0, 2).toUpperCase(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
    }).catch(() => {
      if (alive) {
        setAuthError('No se pudo verificar la sesión con Supabase. Revisa la conexión.');
        setUser(null);
      }
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, authError,
    login: (authenticatedUser) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      setAuthError('');
    },
    logout: () => {
      sessionStorage.removeItem(STORAGE_KEY);
      signOutPassword();
      setUser(null);
    },
  }), [user, loading, authError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
