import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../components/Table';
import { Card } from '../components/Card';
import { Button, Input } from '../components/Form';
import { Filters } from '../components/Filters';
import { apiClient } from '../services/api.client';
import { API_CONSTANTS } from '../constants/api.constants';
import styles from './ProductsPage.module.scss';

export const ProductsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('month');
  const [source, setSource] = useState('marketplace');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products', {
        params: { search },
      });
      return response.data as any;
    },
  });

  // Извлекаем массив товаров из ответа (может быть объект с полем products или массив)
  const products = Array.isArray(productsData) 
    ? productsData 
    : (productsData?.products || []);

  const { data: abcAnalysis } = useQuery({
    queryKey: ['abc-analysis'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products/abc-analysis');
      return response.data as any;
    },
  });

  const { data: stockForecast } = useQuery({
    queryKey: ['reorder-recommendations'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products/reorder-recommendations');
      return response.data as any;
    },
    retry: API_CONSTANTS.NO_RETRY,
  });

  const columns = [
    {
      key: 'name',
      header: 'Название',
    },
    {
      key: 'sku',
      header: 'SKU',
    },
    {
      key: 'price',
      header: 'Цена',
      render: (item: any) => `${item.price?.toLocaleString('ru-RU')} ₽`,
    },
    {
      key: 'stock',
      header: 'Остаток',
      render: (item: any) => item.stock?.quantity || 0,
    },
    {
      key: 'sales',
      header: 'Продажи',
      render: (item: any) => item.totalSales || 0,
    },
    {
      key: 'revenue',
      header: 'Выручка',
      render: (item: any) =>
        `${item.totalRevenue?.toLocaleString('ru-RU') || 0} ₽`,
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            navigate(`/products/${item.id}`);
          }}
        >
          Детали
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.products}>
      <Filters
        selectedPeriod={period}
        selectedSource={source}
        onPeriodChange={setPeriod}
        onSourceChange={setSource}
      />

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Товары</h1>
          <div className={styles.actions}>
            <Input
              placeholder="Поиск товаров..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '300px' }}
            />
          </div>
        </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          <Card title="Список товаров">
            <Table
              columns={columns}
              data={products || []}
              loading={isLoading}
              emptyMessage="Товары не найдены"
            />
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card title="ABC-анализ">
            {abcAnalysis ? (
              <div className={styles.abcStats}>
                <div className={styles.abcItem}>
                  <span className={styles.abcLabel}>Категория A:</span>
                  <span className={styles.abcValue}>
                    {((abcAnalysis as any).categoryA?.count || 0)} товаров
                  </span>
                </div>
                <div className={styles.abcItem}>
                  <span className={styles.abcLabel}>Категория B:</span>
                  <span className={styles.abcValue}>
                    {((abcAnalysis as any).categoryB?.count || 0)} товаров
                  </span>
                </div>
                <div className={styles.abcItem}>
                  <span className={styles.abcLabel}>Категория C:</span>
                  <span className={styles.abcValue}>
                    {((abcAnalysis as any).categoryC?.count || 0)} товаров
                  </span>
                </div>
              </div>
            ) : (
              <div>Загрузка...</div>
            )}
          </Card>

          <Card title="Прогноз остатков">
            {stockForecast ? (
              <div className={styles.forecastStats}>
                <div className={styles.forecastItem}>
                  <span className={styles.forecastLabel}>
                    Рекомендуется заказ:
                  </span>
                  <span className={styles.forecastValue}>
                    {Array.isArray(stockForecast) ? stockForecast.length : 0} товаров
                  </span>
                </div>
                {Array.isArray(stockForecast) && stockForecast.length > 0 && (
                  <div className={styles.forecastList}>
                    <h4>Товары, требующие дозаказа:</h4>
                    <ul>
                      {stockForecast.slice(0, 5).map((item: any) => (
                        <li key={item.product?.id || item.id}>
                          {item.product?.name || item.name || 'Неизвестный товар'} - 
                          остаток: {item.currentStock || 0}, 
                          дней до исчерпания: {item.forecastDepletionDays || 'N/A'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div>Загрузка...</div>
            )}
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
};

