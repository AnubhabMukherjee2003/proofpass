// API Configuration for Admin App
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const ADMIN_API_ENDPOINTS = {
  // Admin Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/admin-login`,
    ME: `${API_BASE_URL}/auth/admin-me`,
  },
  // Event endpoints
  EVENTS: {
    LIST: `${API_BASE_URL}/events`,
    GET: (id: number) => `${API_BASE_URL}/events/${id}`,
    CREATE: `${API_BASE_URL}/events`,
    DEACTIVATE: (id: number) => `${API_BASE_URL}/events/${id}/deactivate`,
  },
  // Entry endpoints
  ENTRY: {
    SCAN: (ticketId: number, userToken: string) => `${API_BASE_URL}/entry/${ticketId}/scan/${userToken}`,
    CONFIRM: `${API_BASE_URL}/entry/confirm`,
    STATUS: (ticketId: number) => `${API_BASE_URL}/entry/${ticketId}/status`,
    STATS: (eventId: number) => `${API_BASE_URL}/entry/stats/${eventId}`,
  },
};

export const ADMIN_API_TIMEOUT = 10000; // 10 seconds
export const ADMIN_TOKEN_KEY = 'proofpass_admin_token';
