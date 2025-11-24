import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { ROUTES } from '../constants/routes.constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Нормализуем URL: убираем trailing slash и /api/v1 если он уже есть
const normalizeApiUrl = (url: string): string => {
  let normalized = url.trim();
  // Убираем trailing slash
  normalized = normalized.replace(/\/+$/, '');
  // Если URL уже содержит /api/v1, убираем его
  if (normalized.endsWith('/api/v1')) {
    normalized = normalized.replace(/\/api\/v1$/, '');
  }
  return normalized;
};

const normalizedApiUrl = normalizeApiUrl(API_URL);

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${normalizedApiUrl}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем токен к каждому запросу
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Обрабатываем ошибки
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Если получили 401 и это не запрос на refresh или login
        if (error.response?.status === 401 && !originalRequest._retry) {
          const { refreshToken, logout } = useAuthStore.getState();
          
          // Если нет refresh token, просто выходим
          if (!refreshToken) {
            logout();
            window.location.href = ROUTES.LOGIN;
            return Promise.reject(error);
          }

          // Пытаемся обновить токен
          try {
            originalRequest._retry = true;
            // Создаем отдельный экземпляр axios для refresh, чтобы избежать циклической зависимости
            const refreshClient = axios.create({ baseURL: `${normalizedApiUrl}/api/v1` });
            const response = await refreshClient.post('/auth/refresh', {
              refresh_token: refreshToken,
            });

            // Обновляем токен в store
            useAuthStore.getState().login(
              useAuthStore.getState().user!,
              response.data.access_token,
              response.data.refresh_token
            );

            // Повторяем оригинальный запрос с новым токеном
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Если refresh не удался, выходим
            logout();
            window.location.href = ROUTES.LOGIN;
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      },
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();

