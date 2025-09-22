'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens, LoginCredentials, RegisterData, ApiResponse } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', credentials);

          if (response.data.success && response.data.data) {
            const { user, tokens } = response.data.data;
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.data.error?.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/register', data);

          if (response.data.success && response.data.data) {
            const { user, tokens } = response.data.data;
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.data.error?.message || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', {
            refreshToken: tokens.refreshToken,
          });

          if (response.data.success && response.data.data) {
            const newTokens = response.data.data;
            set({ tokens: newTokens });
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      checkAuth: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          return;
        }

        try {
          const response = await api.get<ApiResponse<User>>('/users/profile', {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });

          if (response.data.success && response.data.data) {
            set({
              user: response.data.data,
              isAuthenticated: true,
            });
          } else {
            get().logout();
          }
        } catch (error) {
          // If profile check fails, try to refresh token
          try {
            await get().refreshToken();
            // Retry profile check
            await get().checkAuth();
          } catch {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'trustlens-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthStore();

  useEffect(() => {
    // Check authentication on app load
    auth.checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { useAuthStore };