import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('proofpass_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.sendOtp(phone);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.verifyOtp(phone, otp);
      console.log('🔐 OTP Verification Response:', response);
      if (response.data?.token) {
        console.log('✅ Token received from backend:', response.data.token);
        setToken(response.data.token);
        // Backend only returns token, extract phone from JWT or store the phone from the request
        setUser({ phone } as User);
        api.setToken(response.data.token);
        console.log('💾 Token saved to API client and localStorage');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    api.clearToken();
    localStorage.removeItem('proofpass_token');
  }, []);

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    sendOtp,
    verifyOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
