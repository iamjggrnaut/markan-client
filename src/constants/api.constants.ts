// API константы
export const API_CONSTANTS = {
  // Лимиты запросов
  DEFAULT_PAGE_SIZE: 50,
  PRODUCTS_PAGE_SIZE: 100,
  DASHBOARD_TOP_ITEMS: 5,
  SYNC_JOBS_LIMIT: 50,
  AI_RECOMMENDATIONS_LIMIT: 100,
  
  // Retry настройки
  DEFAULT_RETRY: 1,
  NO_RETRY: false,
  
  // Refetch интервалы (в миллисекундах)
  ADMIN_REFRESH_INTERVAL: 30000, // 30 секунд
  SYNC_JOBS_REFRESH_INTERVAL: 5000, // 5 секунд для активных задач синхронизации
} as const;

