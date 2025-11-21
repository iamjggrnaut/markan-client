import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../components/Table';
import { Card } from '../components/Card';
import { Button, Input } from '../components/Form';
import { Modal } from '../components/Modal';
import { apiClient } from '../services/api.client';
import styles from './ProductsPage.module.scss';

export const ProductsPage = () => {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products', {
        params: { search },
      });
      return response.data;
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
      return response.data;
    },
  });

  const { data: stockForecast, error: stockForecastError } = useQuery({
    queryKey: ['reorder-recommendations'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products/reorder-recommendations');
      return response.data;
    },
    retry: false, // Не повторять запрос при ошибке
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
            setSelectedProduct(item);
            setIsModalOpen(true);
          }}
        >
          Детали
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.products}>
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
                    {abcAnalysis.categoryA?.count || 0} товаров
                  </span>
                </div>
                <div className={styles.abcItem}>
                  <span className={styles.abcLabel}>Категория B:</span>
                  <span className={styles.abcValue}>
                    {abcAnalysis.categoryB?.count || 0} товаров
                  </span>
                </div>
                <div className={styles.abcItem}>
                  <span className={styles.abcLabel}>Категория C:</span>
                  <span className={styles.abcValue}>
                    {abcAnalysis.categoryC?.count || 0} товаров
                  </span>
                </div>
              </div>
            ) : (
              <div>Загрузка...</div>
            )}
          </Card>

          <Card title="Прогноз остатков">
            {stockForecastError ? (
              <div style={{ color: 'var(--color-error)', padding: '1rem', fontSize: '0.875rem' }}>
                Ошибка загрузки прогноза остатков
              </div>
            ) : stockForecast ? (
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct?.name || 'Детали товара'}
        size="lg"
      >
        {selectedProduct && (
          <div className={styles.productDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>SKU:</span>
              <span>{selectedProduct.sku}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Цена:</span>
              <span>{selectedProduct.price?.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Остаток:</span>
              <span>{selectedProduct.stock?.quantity || 0}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Продажи:</span>
              <span>{selectedProduct.totalSales || 0}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Выручка:</span>
              <span>
                {selectedProduct.totalRevenue?.toLocaleString('ru-RU') || 0} ₽
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

