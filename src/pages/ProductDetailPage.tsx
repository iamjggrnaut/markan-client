import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Button } from '../components/Form';
import { Table } from '../components/Table';
import { LineChart } from '../components/Chart';
import { apiClient } from '../services/api.client';
import { FaArrowLeft, FaChartLine, FaBox, FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from '../utils/toast';
import styles from './ProductDetailPage.module.scss';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Получаем информацию о товаре
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.instance.get(`/products/${id}`);
      return response.data as any;
    },
    enabled: !!id,
  });

  // Получаем прибыльность товара
  const { data: profitability } = useQuery({
    queryKey: ['product-profitability', id],
    queryFn: async () => {
      const response = await apiClient.instance.get(`/products/${id}/profitability`);
      return response.data as any;
    },
    enabled: !!id,
  });

  // Получаем прогноз остатков
  const { data: stockForecast } = useQuery({
    queryKey: ['product-stock-forecast', id],
    queryFn: async () => {
      const response = await apiClient.instance.get(`/products/${id}/stock-forecast`);
      return response.data as any;
    },
    enabled: !!id,
  });

  // Получаем оборачиваемость запасов
  const { data: turnoverRate } = useQuery({
    queryKey: ['product-turnover-rate', id],
    queryFn: async () => {
      const response = await apiClient.instance.get(`/products/${id}/turnover-rate`);
      return response.data as any;
    },
    enabled: !!id,
  });

  // Получаем список интеграций для синхронизации
  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/integrations');
      return response.data as any[];
    },
  });

  // Получаем историю остатков
  const { data: stockHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['product-stock-history', id],
    queryFn: async () => {
      const response = await apiClient.instance.get(`/products/${id}/stock-history`, {
        params: { limit: 100 },
      });
      return response.data as any[];
    },
    enabled: !!id,
  });

  // Мутация для синхронизации остатков
  const syncStockMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiClient.instance.post(`/products/${id}/sync-stock`, {
        accountId,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Синхронизация остатков запущена!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при синхронизации остатков');
    },
  });

  if (productLoading) {
    return (
      <div className={styles.productDetail}>
        <div className={styles.content}>
          <div className={styles.loading}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.productDetail}>
        <div className={styles.content}>
          <div className={styles.error}>Товар не найден</div>
          <Button onClick={() => navigate('/products')}>Вернуться к списку</Button>
        </div>
      </div>
    );
  }

  // Формируем данные для графика истории остатков
  const stockHistoryChartData = stockHistory && Array.isArray(stockHistory)
    ? {
        labels: stockHistory.map((item: any) =>
          new Date(item.date || item.createdAt).toLocaleDateString('ru-RU')
        ),
        datasets: [
          {
            label: 'Остаток',
            data: stockHistory.map((item: any) => item.quantity || 0),
            borderColor: 'var(--color-accent)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          },
        ],
      }
    : null;

  const stockHistoryColumns = [
    {
      key: 'date',
      header: 'Дата',
      render: (item: any) =>
        new Date(item.date || item.createdAt).toLocaleString('ru-RU'),
    },
    {
      key: 'quantity',
      header: 'Количество',
      render: (item: any) => item.quantity || 0,
    },
    {
      key: 'warehouse',
      header: 'Склад',
      render: (item: any) => item.warehouse || '-',
    },
  ];

  return (
    <div className={styles.productDetail}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Button
            variant="secondary"
            onClick={() => navigate('/products')}
            className={styles.backButton}
          >
            <FaArrowLeft /> Назад к списку
          </Button>
          <h1 className={styles.title}>{(product as any)?.name || 'Товар'}</h1>
        </div>

        <div className={styles.grid}>
          <div className={styles.main}>
            {/* Основная информация */}
            <Card className={styles.infoCard}>
              <h2 className={styles.cardTitle}>Основная информация</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>SKU:</span>
                  <span className={styles.infoValue}>{(product as any)?.sku || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Цена:</span>
                  <span className={styles.infoValue}>
                    {(product as any)?.price?.toLocaleString('ru-RU') || 0} ₽
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Остаток:</span>
                  <span className={styles.infoValue}>
                    {(product as any)?.stock?.quantity || 0} шт.
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Продажи:</span>
                  <span className={styles.infoValue}>
                    {(product as any)?.totalSales || 0} шт.
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Выручка:</span>
                  <span className={styles.infoValue}>
                    {((product as any)?.totalRevenue || 0).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            </Card>

            {/* Прибыльность */}
            {profitability && (
              <Card className={styles.profitabilityCard}>
                <h2 className={styles.cardTitle}>
                  <FaDollarSign /> Прибыльность
                </h2>
                <div className={styles.profitabilityGrid}>
                  <div className={styles.profitabilityItem}>
                    <span className={styles.profitabilityLabel}>Валовая прибыль:</span>
                    <span className={styles.profitabilityValue}>
                      {((profitability as any).grossProfit || 0).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className={styles.profitabilityItem}>
                    <span className={styles.profitabilityLabel}>Маржинальность:</span>
                    <span className={styles.profitabilityValue}>
                      {((profitability as any).margin || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className={styles.profitabilityItem}>
                    <span className={styles.profitabilityLabel}>ROI:</span>
                    <span className={styles.profitabilityValue}>
                      {((profitability as any).roi || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className={styles.profitabilityItem}>
                    <span className={styles.profitabilityLabel}>Себестоимость:</span>
                    <span className={styles.profitabilityValue}>
                      {((profitability as any).costPrice || 0).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Прогноз остатков */}
            {stockForecast && (
              <Card className={styles.forecastCard}>
                <h2 className={styles.cardTitle}>
                  <FaExclamationTriangle /> Прогноз остатков
                </h2>
                <div className={styles.forecastContent}>
                  <div className={styles.forecastItem}>
                    <span className={styles.forecastLabel}>Дней до исчерпания:</span>
                    <span className={styles.forecastValue}>
                      {((stockForecast as any).daysUntilOutOfStock || 'Не определено')}
                    </span>
                  </div>
                  <div className={styles.forecastItem}>
                    <span className={styles.forecastLabel}>Рекомендуемый заказ:</span>
                    <span className={styles.forecastValue}>
                      {((stockForecast as any).recommendedOrderQuantity || 0)} шт.
                    </span>
                  </div>
                  {(stockForecast as any)?.forecastDate && (
                    <div className={styles.forecastItem}>
                      <span className={styles.forecastLabel}>Дата исчерпания:</span>
                      <span className={styles.forecastValue}>
                        {new Date((stockForecast as any).forecastDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Оборачиваемость запасов */}
            {turnoverRate && (
              <Card className={styles.turnoverCard}>
                <h2 className={styles.cardTitle}>
                  <FaChartLine /> Оборачиваемость запасов
                </h2>
                <div className={styles.turnoverContent}>
                  <div className={styles.turnoverItem}>
                    <span className={styles.turnoverLabel}>Оборачиваемость:</span>
                    <span className={styles.turnoverValue}>
                      {((turnoverRate as any).turnoverRate || 0).toFixed(2)} раз/год
                    </span>
                  </div>
                  <div className={styles.turnoverItem}>
                    <span className={styles.turnoverLabel}>Дней оборота:</span>
                    <span className={styles.turnoverValue}>
                      {((turnoverRate as any).daysOfInventory || 0)} дней
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* История остатков */}
            {stockHistory && Array.isArray(stockHistory) && stockHistory.length > 0 && (
              <Card className={styles.historyCard}>
                <h2 className={styles.cardTitle}>
                  <FaBox /> История остатков
                </h2>
                {stockHistoryChartData && (
                  <div className={styles.chartContainer}>
                    <LineChart data={stockHistoryChartData} height={200} />
                  </div>
                )}
                <div className={styles.tableContainer}>
                  <Table
                    columns={stockHistoryColumns}
                    data={Array.isArray(stockHistory) ? stockHistory : []}
                    loading={historyLoading}
                    emptyMessage="История остатков отсутствует"
                  />
                </div>
              </Card>
            )}
          </div>

          <div className={styles.sidebar}>
            <Card className={styles.actionsCard}>
              <h3 className={styles.sidebarTitle}>Действия</h3>
              <div className={styles.actionsList}>
                {integrations && Array.isArray(integrations) && integrations.length > 0 ? (
                  <div className={styles.syncActions}>
                    {integrations.map((integration: any) => (
                      <Button
                        key={integration.id}
                        variant="primary"
                        onClick={() => {
                          syncStockMutation.mutate(integration.id);
                        }}
                        disabled={syncStockMutation.isPending}
                        style={{ marginBottom: '0.5rem', width: '100%' }}
                      >
                        {syncStockMutation.isPending ? 'Синхронизация...' : `Синхронизировать ${integration.accountName || integration.marketplaceType}`}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noIntegrations}>Нет настроенных интеграций</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

