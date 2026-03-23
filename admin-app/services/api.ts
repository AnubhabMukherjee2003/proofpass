import axios, { AxiosInstance, AxiosError } from 'axios';
import { ADMIN_API_TIMEOUT } from '@/constants/api';
import { secureStorage } from '@/utils/storage';
import { handleApiError } from '@/utils/errors';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const ADMIN_TOKEN_KEY = 'proofpass_admin_token';

class AdminApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: ADMIN_API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getToken(ADMIN_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If 401 and not already retrying, clear token and redirect to login
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await secureStorage.removeToken(ADMIN_TOKEN_KEY);
            // Navigation to login should be handled by AuthContext
            return Promise.reject(handleApiError(error));
          } catch (err) {
            return Promise.reject(handleApiError(error));
          }
        }

        return Promise.reject(handleApiError(error));
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  public setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public clearAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }
}

export const adminApiService = new AdminApiService();
export const ADMIN_TOKEN_KEY_EXPORT = ADMIN_TOKEN_KEY;
