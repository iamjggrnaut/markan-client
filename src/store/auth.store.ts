import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../services/api.client';

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
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

// Сохраняем refresh token в localStorage для восстановления сессии
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user, token, refreshToken) => {
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        // Отзываем refresh token на сервере (не блокируем, если ошибка)
        const { refreshToken } = get();
        if (refreshToken) {
          apiClient.instance.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {
            // Игнорируем ошибки при выходе
          });
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
      },
      restoreSession: async () => {
        const { refreshToken, user } = get();
        
        // Если нет refresh token, сессия не может быть восстановлена
        if (!refreshToken || !user) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          // Пытаемся обновить токен используя refresh token
          const response = await apiClient.instance.post('/auth/refresh', {
            refresh_token: refreshToken,
          });

          // Восстанавливаем сессию с новыми токенами
          set({
            token: response.data.access_token,
            refreshToken: response.data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Если refresh token недействителен, очищаем состояние
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Сохраняем user и refreshToken для восстановления сессии
        user: state.user,
        refreshToken: state.refreshToken,
        // НЕ сохраняем access token (он короткоживущий)
        // isAuthenticated всегда false при загрузке - будет восстановлено через restoreSession
      }),
    },
  ),
);

