import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  AdminAuthResponse,
  Event,
  DashboardStats,
  QrScanResponse,
  OtpVerificationResponse,
  CreateEventRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class AdminApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on init
    const savedToken = localStorage.getItem('proofpass_admin_token');
    if (savedToken) {
      this.setToken(savedToken);
    }

    // Interceptor to add token to requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('proofpass_admin_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('proofpass_admin_token');
    delete this.client.defaults.headers.common['Authorization'];
  }

  // ===== AUTH ENDPOINTS =====
  async adminLogin(username: string, password: string): Promise<ApiResponse<AdminAuthResponse>> {
    return this.client.post('/auth/admin-login', { username, password });
  }

  // ===== DASHBOARD ENDPOINTS =====
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.client.get('/admin/dashboard');
  }

  // ===== EVENT ENDPOINTS =====
  async getEvents(): Promise<ApiResponse<Event[]>> {
    return this.client.get('/events');
  }

  async getEvent(eventId: string): Promise<ApiResponse<Event>> {
    return this.client.get(`/events/${eventId}`);
  }

  async createEvent(data: CreateEventRequest): Promise<ApiResponse<Event>> {
    return this.client.post('/events', data);
  }

  async deactivateEvent(eventId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.post(`/events/${eventId}/deactivate`);
  }

  // ===== GATE ENTRY ENDPOINTS =====
  async scanQrCode(qrData: string): Promise<ApiResponse<QrScanResponse>> {
    return this.client.post('/entry/scan', { qrData });
  }

  async verifyOtp(ticketId: string, otp: string): Promise<ApiResponse<OtpVerificationResponse>> {
    return this.client.post(`/entry/${ticketId}/verify-otp`, { otp });
  }

  async resendOtp(ticketId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.post(`/entry/${ticketId}/resend-otp`);
  }

  async getScanHistory(limit: number = 50): Promise<ApiResponse<any[]>> {
    return this.client.get('/admin/scan-history', { params: { limit } });
  }
}

export default new AdminApiClient();
