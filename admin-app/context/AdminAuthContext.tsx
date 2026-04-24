import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AdminAuthContextValue = {
  adminToken: string | null;
  isInitializing: boolean;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const ADMIN_TOKEN_KEY = 'proofpass:admin:token';
const ADMIN_USERNAME_KEY = 'proofpass:admin:username';

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    async function restoreSession() {
      try {
        const [savedToken, savedUsername] = await Promise.all([
          AsyncStorage.getItem(ADMIN_TOKEN_KEY),
          AsyncStorage.getItem(ADMIN_USERNAME_KEY),
        ]);

        if (savedToken) {
          setAdminToken(savedToken);
        }
        if (savedUsername) {
          setUsername(savedUsername);
        }
      } finally {
        setIsInitializing(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (token: string) => {
    setAdminToken(token);
    await Promise.all([
      AsyncStorage.setItem(ADMIN_TOKEN_KEY, token),
      AsyncStorage.setItem(ADMIN_USERNAME_KEY, username),
    ]);
  }, [username]);

  const logout = useCallback(async () => {
    setAdminToken(null);
    setPassword('');
    await Promise.all([
      AsyncStorage.removeItem(ADMIN_TOKEN_KEY),
      AsyncStorage.removeItem(ADMIN_USERNAME_KEY),
    ]);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      adminToken,
      isInitializing,
      username,
      setUsername,
      password,
      setPassword,
      login,
      logout,
    }),
    [adminToken, isInitializing, username, password, login, logout]
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