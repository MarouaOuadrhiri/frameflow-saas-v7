'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('ff_token') : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    api
      .get('/api/auth/me')
      .then((data) => setUser(data?.user || data))
      .catch(() => {
        localStorage.removeItem('ff_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (u, t) => {
    localStorage.setItem('ff_token', t);
    setToken(t);
    setUser(u);
  };

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    persist(data.user, data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ff_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
