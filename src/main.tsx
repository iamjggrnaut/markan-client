import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { toast } from './utils/toast';
import { API_CONSTANTS } from './constants/api.constants';
import './styles/variables.scss';
import './styles/base.scss';

// Инициализируем toast service
toast.init();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: API_CONSTANTS.DEFAULT_RETRY,
    },
    mutations: {
      retry: API_CONSTANTS.DEFAULT_RETRY,
    },
  },
});

// Примечание: Глобальная обработка ошибок не требуется, так как:
// 1. Ошибки обрабатываются в axios interceptor (api.client.ts)
// 2. Каждый useQuery/useMutation имеет свой onError обработчик
// 3. Это предотвращает React Error #31, так как объекты ошибок не рендерятся напрямую

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

