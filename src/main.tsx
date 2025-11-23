import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { toast } from './utils/toast';
import './styles/variables.scss';
import './styles/base.scss';

// Инициализируем toast service
toast.init();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error: any) => {
        // Преобразуем объект ошибки в строку для предотвращения React Error #31
        const errorMessage = error?.response?.data?.message 
          || error?.message 
          || 'Произошла ошибка при загрузке данных';
        toast.error(errorMessage);
      },
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        // Преобразуем объект ошибки в строку для предотвращения React Error #31
        const errorMessage = error?.response?.data?.message 
          || error?.message 
          || 'Произошла ошибка при выполнении операции';
        toast.error(errorMessage);
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

