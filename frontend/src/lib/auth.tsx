import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, setAccessToken } from './api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const refreshUser = async () => {
    try {
      const res = await api<{ success: boolean; data: { user: User; accessToken?: string } }>('/auth/me');
      if (res.success && res.data) {
        if (res.data.accessToken) {
          setAccessToken(res.data.accessToken);
        }
        setState({ user: res.data.user, loading: false, error: null });
      } else {
        setState({ user: null, loading: false, error: null });
      }
    } catch {
      setState({ user: null, loading: false, error: null });
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await api<{
        success: boolean;
        data: { user: User; accessToken: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        setAccessToken(res.data.accessToken);
        setState({ user: res.data.user, loading: false, error: null });
      }
    } catch (err: any) {
      setState({
        user: null,
        loading: false,
        error: err.message || 'Error al iniciar sesión',
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    setAccessToken(null);
    setState({ user: null, loading: false, error: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
