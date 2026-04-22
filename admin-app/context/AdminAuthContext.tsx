import React, { createContext, useContext, useMemo, useState } from 'react';

type AdminAuthContextValue = {
  adminToken: string | null;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  login: (token: string) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      adminToken,
      username,
      setUsername,
      password,
      setPassword,
      login: (token: string) => setAdminToken(token),
      logout: () => {
        setAdminToken(null);
        setPassword('');
      },
    }),
    [adminToken, username, password]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return ctx;
}