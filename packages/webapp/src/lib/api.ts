/**
 * API client for TrustLens backend
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const authData = localStorage.getItem('trustlens-auth');
        if (authData) {
          try {
            const { state } = JSON.parse(authData);
            if (state?.tokens?.accessToken) {
              config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
            }
          } catch (error) {
            console.warn('Failed to parse auth data from localStorage');
          }
        }

        // Add request ID
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
          (originalRequest as any)._retry = true;

          try {
            const authData = localStorage.getItem('trustlens-auth');
            if (authData) {
              const { state } = JSON.parse(authData);
              if (state?.tokens?.refreshToken) {
                const response = await this.client.post('/auth/refresh', {
                  refreshToken: state.tokens.refreshToken,
                });

                if (response.data.success) {
                  // Update tokens in localStorage
                  const newTokens = response.data.data;
                  const updatedState = {
                    ...state,
                    tokens: newTokens,
                  };
                  localStorage.setItem('trustlens-auth', JSON.stringify({ state: updatedState }));

                  // Retry original request with new token
                  originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                  return this.client(originalRequest);
                }
              }
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            if (typeof window !== 'undefined') {
              localStorage.removeItem('trustlens-auth');
              window.location.href = '/login';
            }
          }
        }

        // Transform error response
        const responseData = error.response?.data as any;
        const apiError: ApiError = {
          code: responseData?.error?.code || 'UNKNOWN_ERROR',
          message: responseData?.error?.message || error.message || 'An unexpected error occurred',
          status: error.response?.status || 500,
          details: responseData?.error?.details,
        };

        return Promise.reject(apiError);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async delete<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  // Specialized methods for file uploads
  async uploadFile<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.success && response.data.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient();

// Utility functions for common API patterns
export const handleApiError = (error: ApiError): string => {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return error.details ? `Validation failed: ${error.details.join(', ')}` : error.message;
    case 'RATE_LIMIT_EXCEEDED':
      return 'Rate limit exceeded. Please try again later.';
    case 'INSUFFICIENT_CREDITS':
      return 'Insufficient credits. Please upgrade your plan or purchase more credits.';
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password.';
    case 'USER_EXISTS':
      return 'An account with this email already exists.';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};