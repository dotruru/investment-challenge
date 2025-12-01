import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, authApi } from '../api/client';
import type { AdminUser, JuryUser } from '../types';

interface AuthState {
  user: AdminUser | JuryUser | null;
  userType: 'admin' | 'jury' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginJury: (accessCode: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userType: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginAdmin: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.loginAdmin(email, password);
          api.setToken(response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          set({
            user: response.user,
            userType: 'admin',
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loginJury: async (accessCode: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.loginJury(accessCode);
          api.setToken(response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('juryEventId', response.event.id);
          
          set({
            user: response.jury,
            userType: 'jury',
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        api.setToken(null);
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('juryEventId');
        set({
          user: null,
          userType: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = api.getToken();
        const refreshToken = localStorage.getItem('refreshToken');

        if (!token && !refreshToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        if (!token && refreshToken) {
          try {
            const response = await authApi.refreshToken(refreshToken);
            api.setToken(response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            set({ isAuthenticated: true });
          } catch {
            get().logout();
          }
        } else {
          set({ isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        userType: state.userType,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

