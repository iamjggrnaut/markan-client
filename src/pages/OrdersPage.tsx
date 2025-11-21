import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../components/Table';
import { Card } from '../components/Card';
import { Filters } from '../components/Filters';
import { Select } from '../components/Form';
import { apiClient } from '../services/api.client';
import styles from './OrdersPage.module.scss';

export const OrdersPage = () => {
  const [period, setPeriod] = useState('month');
  const [source, setSource] = useState('marketplace');
  const [marketplace, setMarketplace] = useState<string>('');

  // Получаем список интеграций
  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/integrations');
      return response.data;
    },
  });

  // Вычисляем даты на основе периода
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
    start.setDate(end.getDate() - days);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();

  // Получаем заказы из всех активных интеграций
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', dateRange.startDate, dateRange.endDate, marketplace],
    queryFn: async () => {
      if (!integrations || integrations.length === 0) {
        return [];
      }

      const activeIntegrations = integrations.filter(
        (integration: any) => integration.status === 'ACTIVE' && (!marketplace || integration.marketplaceType === marketplace)
      );

      if (activeIntegrations.length === 0) {
        return [];
      }

      const allOrders: any[] = [];
      
      for (const integration of activeIntegrations) {
        try {
          const response = await apiClient.instance.get(`/integrations/${integration.id}/orders`, {
            params: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
            },
          });
          
          if (Array.isArray(response.data)) {
            allOrders.push(...response.data);
          }
        } catch (error) {
          console.error(`Ошибка загрузки заказов для ${integration.name}:`, error);
        }
      }

      // Сортируем по дате (новые сначала)
      return allOrders.sort((a, b) => {
        const dateA = new Date(a.orderDate || a.createdAt || 0);
        const dateB = new Date(b.orderDate || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    },
    enabled: !!integrations,
  });

  const orders = Array.isArray(ordersData) ? ordersData : [];

  const columns = [
    {
      key: 'orderNumber',
      header: 'Номер заказа',
    },
    {
      key: 'orderDate',
      header: 'Дата',
      render: (item: any) => {
        const date = item.orderDate || item.createdAt;
        if (!date) return '-';
        return new Date(date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      key: 'status',
      header: 'Статус',
      render: (item: any) => {
        const status = item.status || 'unknown';
        const statusMap: Record<string, string> = {
          'new': 'Новый',
          'processing': 'В обработке',
          'shipped': 'Отправлен',
          'delivered': 'Доставлен',
          'cancelled': 'Отменен',
          'unknown': 'Неизвестен',
        };
        return statusMap[status.toLowerCase()] || status;
      },
    },
    {
      key: 'totalAmount',
      header: 'Сумма',
      render: (item: any) => `${(item.totalAmount || 0).toLocaleString('ru-RU')} ₽`,
    },
    {
      key: 'items',
      header: 'Товаров',
      render: (item: any) => item.items?.length || item.quantity || 0,
    },
    {
      key: 'marketplace',
      header: 'Маркетплейс',
      render: (item: any) => {
        const marketplaceMap: Record<string, string> = {
          'wildberries': 'Wildberries',
          'ozon': 'Ozon',
          'yandex-market': 'Яндекс.Маркет',
        };
        return marketplaceMap[item.marketplaceType || item.marketplace] || item.marketplace || '-';
      },
    },
  ];

  return (
    <div className={styles.orders}>
      <h1 className={styles.title}>Лента заказов</h1>
      
      <Filters
        selectedPeriod={period}
        selectedSource={source}
        onPeriodChange={setPeriod}
        onSourceChange={setSource}
      />
      
      <div className={styles.marketplaceFilter}>
        <Select
          options={[
            { value: '', label: 'Все маркетплейсы' },
            { value: 'wildberries', label: 'Wildberries' },
            { value: 'ozon', label: 'Ozon' },
            { value: 'yandex-market', label: 'Яндекс.Маркет' },
          ]}
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
          style={{ width: '200px' }}
        />
      </div>

      <Card className={styles.ordersCard}>
        <Table
          columns={columns}
          data={orders}
          loading={isLoading}
          emptyMessage={integrations?.length === 0 ? "Нет подключенных интеграций" : "Заказы не найдены"}
        />
      </Card>
    </div>
  );
};

