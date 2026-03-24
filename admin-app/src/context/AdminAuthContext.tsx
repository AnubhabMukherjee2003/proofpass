import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Admin } from '../types';
import api from '../services/api';

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('proofpass_admin_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.adminLogin(username, password);
      if (response.data?.token && response.data?.admin) {
        setToken(response.data.token);
        setAdmin(response.data.admin);
        api.setToken(response.data.token);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAdmin(null);
    setToken(null);
    api.clearToken();
    localStorage.removeItem('proofpass_admin_token');
  }, []);

  const value: AdminAuthContextType = {
    admin,
    token,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
