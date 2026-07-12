'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '@/types';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: Usuario, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<Usuario>) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user: Usuario, token: string) => {
        if (typeof document !== 'undefined') {
          document.cookie = `sgca_token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
        }
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'sgca_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (partial: Partial<Usuario>) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...partial } });
        }
      },

      setHasHydrated: (value: boolean) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: 'sgca-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
