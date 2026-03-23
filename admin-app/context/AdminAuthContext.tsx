import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ADMIN_API_ENDPOINTS } from '@/constants/api';
import { adminApiService, ADMIN_TOKEN_KEY_EXPORT as ADMIN_TOKEN_KEY } from '@/services/api';
import { secureStorage } from '@/utils/storage';
import { handleApiError, getErrorMessage } from '@/utils/errors';

export interface AdminUser {
  username: string;
  role: string;
  token: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await secureStorage.getToken(ADMIN_TOKEN_KEY);

        if (token) {
          adminApiService.setAuthToken(token);
          // Try to fetch admin info to verify token
          try {
            const response = await adminApiService.getInstance().get(ADMIN_API_ENDPOINTS.AUTH.ME);
            setUser({
              username: response.data.admin.username,
              role: response.data.admin.role,
              token,
            });
          } catch (err) {
            // Token invalid, clear it
            await secureStorage.removeToken(ADMIN_TOKEN_KEY);
            adminApiService.clearAuthToken();
          }
        }
      } catch (err) {
        console.error('Error initializing admin auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminApiService.getInstance().post(ADMIN_API_ENDPOINTS.AUTH.LOGIN, {
        username,
        password,
      });

      const { token, admin } = response.data;

      // Store token securely
      await secureStorage.setToken(ADMIN_TOKEN_KEY, token);

      setUser({
        username: admin.username,
        role: admin.role,
        token,
      });
      adminApiService.setAuthToken(token);

      // Navigate to home screen
      router.replace('/(tabs)/');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(getErrorMessage(apiError));
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await secureStorage.removeToken(ADMIN_TOKEN_KEY);
      setUser(null);
      adminApiService.clearAuthToken();
      router.replace('/login');
    } catch (err) {
      console.error('Error during logout:', err);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, error, login, logout, clearError }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
