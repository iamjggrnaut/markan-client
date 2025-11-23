import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/variables.scss';
import './styles/base.scss';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error: any) => {
        // Глобальная обработка ошибок для всех queries
        // Логируем в консоль для отладки
        console.error('Query error:', error);
        // Можно добавить отправку на сервер для мониторинга
      },
    },
    mutations: {
      onError: (error: any) => {
        // Глобальная обработка ошибок для всех mutations
        // Если нет локального onError, логируем здесь
        console.error('Mutation error:', error);
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

