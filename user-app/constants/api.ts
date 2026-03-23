// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SEND_OTP: `${API_BASE_URL}/auth/send-otp`,
    VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
    ME: `${API_BASE_URL}/auth/me`,
  },
  // Event endpoints
  EVENTS: {
    LIST: `${API_BASE_URL}/events`,
    GET: (id: number) => `${API_BASE_URL}/events/${id}`,
  },
  // Ticket endpoints
  TICKETS: {
    LIST: `${API_BASE_URL}/tickets`,
    GET: (id: number) => `${API_BASE_URL}/tickets/${id}`,
    CREATE: `${API_BASE_URL}/tickets`,
  },
  // Entry endpoints
  ENTRY: {
    SCAN: (ticketId: number, userToken: string) => `${API_BASE_URL}/entry/${ticketId}/scan/${userToken}`,
    CONFIRM: `${API_BASE_URL}/entry/confirm`,
    STATUS: (ticketId: number) => `${API_BASE_URL}/entry/${ticketId}/status`,
  },
};

export const API_TIMEOUT = 10000; // 10 seconds
export const TOKEN_KEY = 'proofpass_user_token';
export const PHONE_KEY = 'proofpass_user_phone';
