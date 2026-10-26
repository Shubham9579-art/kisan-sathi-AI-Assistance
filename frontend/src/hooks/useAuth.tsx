import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccountUser } from '../types';
import { api, ApiError } from '../services/api';

interface AuthContextValue {
  user: AccountUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const account = await api.getCurrentUser();
      setUser(account);
      setError(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setError(null);
      } else {
        setError(message || 'Could not check the account session.');
        throw cause;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
