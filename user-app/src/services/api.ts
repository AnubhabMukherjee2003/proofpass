import axios, { AxiosInstance } from 'axios';
import { 
  ApiResponse, 
  AuthResponse, 
  Event, 
  Ticket, 
  OtpResponse,
  EntryResponse,
  EntryConfirmResponse 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
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
    const savedToken = localStorage.getItem('proofpass_token');
    if (savedToken) {
      this.setToken(savedToken);
    }

    // Interceptor to add token to requests
    this.client.interceptors.request.use((config) => {
      // Check both the instance token and localStorage to be safe
      const token = this.token || localStorage.getItem('proofpass_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log(`📤 API Request [${config.method?.toUpperCase()}] ${config.url}`, {
          hasAuthorization: !!config.headers['Authorization'],
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...'
        });
      } else {
        console.warn('⚠️ API Request [' + config.method?.toUpperCase() + '] ' + config.url + ' - NO TOKEN FOUND');
      }
      return config;
    }, (error) => Promise.reject(error));
    
    // Interceptor to log responses
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response [${response.status}] ${response.config.url}`, response.data);
        return response;
      },
      (error) => {
        console.error(`❌ API Error [${error.response?.status}] ${error.config?.url}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('proofpass_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('proofpass_token');
    delete this.client.defaults.headers.common['Authorization'];
  }

  // ===== AUTH ENDPOINTS =====
  async sendOtp(phone: string): Promise<ApiResponse<OtpResponse>> {
    return this.client.post('/auth/send-otp', { phone });
  }

  async verifyOtp(phone: string, otp: string): Promise<ApiResponse<AuthResponse>> {
    return this.client.post('/auth/verify-otp', { phone, otp });
  }

  async adminLogin(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.client.post('/auth/admin-login', { username, password });
  }

  // ===== EVENT ENDPOINTS =====
  async getEvents(filter?: { status?: string }): Promise<ApiResponse<Event[]>> {
    return this.client.get('/events', { params: filter });
  }

  async getEvent(eventId: string): Promise<ApiResponse<Event>> {
    return this.client.get(`/events/${eventId}`);
  }

  async createEvent(data: {
    name: string;
    location: string;
    date: number;
    price: number;
    capacity: number;
    image: string;
    description: string;
  }): Promise<ApiResponse<Event>> {
    return this.client.post('/events', data);
  }

  async deactivateEvent(eventId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.post(`/events/${eventId}/deactivate`);
  }

  // ===== TICKET ENDPOINTS =====
  async getTickets(): Promise<ApiResponse<Ticket[]>> {
    return this.client.get('/tickets');
  }

  async getTicket(ticketId: string): Promise<ApiResponse<Ticket>> {
    return this.client.get(`/tickets/${ticketId}`);
  }

  async bookTicket(eventId: string, price: number): Promise<ApiResponse<Ticket>> {
    const payload = { eventId, price };
    console.log('📦 POST /tickets Request Body:', payload);
    return this.client.post('/tickets', payload);
  }

  // ===== ENTRY ENDPOINTS =====
  async scanQrCode(ticketId: string, userToken: string): Promise<ApiResponse<EntryResponse>> {
    return this.client.post(`/entry/${ticketId}/scan/${userToken}`);
  }

  async confirmEntry(ticketId: string, otp: string): Promise<ApiResponse<EntryConfirmResponse>> {
    return this.client.post(`/entry/${ticketId}/confirm`, { otp });
  }

  async resendOtp(ticketId: string): Promise<ApiResponse<OtpResponse>> {
    return this.client.post(`/entry/${ticketId}/resend-otp`);
  }
}

export default new ApiClient();
