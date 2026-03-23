import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT, TOKEN_KEY } from '@/constants/api';
import { secureStorage } from '@/utils/storage';
import { handleApiError } from '@/utils/errors';

class ApiService {
  private axiosInstance: AxiosInstance;
  private tokenRefreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getToken(TOKEN_KEY);
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
            await secureStorage.removeToken(TOKEN_KEY);
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

export const apiService = new ApiService();
