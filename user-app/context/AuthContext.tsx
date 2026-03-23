import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { API_ENDPOINTS, TOKEN_KEY, PHONE_KEY } from '@/constants/api';
import { apiService } from '@/services/api';
import { secureStorage } from '@/utils/storage';
import { handleApiError, getErrorMessage } from '@/utils/errors';

export interface AuthUser {
  phone: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await secureStorage.getToken(TOKEN_KEY);
        const phone = await secureStorage.getToken(PHONE_KEY);

        if (token && phone) {
          apiService.setAuthToken(token);
          
          try {
            // Validate token by calling an authenticated endpoint
            await apiService.getInstance().get(API_ENDPOINTS.EVENTS.LIST);
            setUser({ token, phone });
          } catch (validateErr) {
            // Token invalid or expired, clear it
            console.log('Token validation failed, clearing auth');
            await secureStorage.clearAll([TOKEN_KEY, PHONE_KEY]);
            setUser(null);
            apiService.setAuthToken(null);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const sendOtp = async (phone: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getInstance().post(API_ENDPOINTS.AUTH.SEND_OTP, { phone });
      // OTP sent successfully, response contains message
      console.log('OTP sent:', response.data.message);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(getErrorMessage(apiError));
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getInstance().post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        phone,
        otp,
      });

      const { token } = response.data;

      // Store token and phone securely
      await secureStorage.setToken(TOKEN_KEY, token);
      await secureStorage.setToken(PHONE_KEY, phone);

      setUser({ token, phone });
      apiService.setAuthToken(token);

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
      await secureStorage.clearAll([TOKEN_KEY, PHONE_KEY]);
      setUser(null);
      apiService.clearAuthToken();
      router.replace('/auth/login');
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
    <AuthContext.Provider value={{ user, isLoading, error, sendOtp, verifyOtp, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
