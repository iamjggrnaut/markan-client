import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Безопасное хранение: токены в памяти, только user в localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null, // НЕ сохраняется в localStorage
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Токен хранится только в памяти, не в localStorage
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Сохраняем только user, НЕ token
        user: state.user,
        isAuthenticated: false, // Всегда false при загрузке
      }),
    },
  ),
);

