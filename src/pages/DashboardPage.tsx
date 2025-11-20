import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { Card } from '../components/Card';
import { LineChart, BarChart } from '../components/Chart';
import { Select } from '../components/Form';
import styles from './DashboardPage.module.scss';

export const DashboardPage = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [comparePeriod, setComparePeriod] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/dashboard', {
        params: { period },
      });
      return response.data;
    },
  });

  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi-metrics', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/kpi', {
        params: { period },
      });
      return response.data;
    },
  });

  const { data: comparison } = useQuery({
    queryKey: ['dashboard-comparison', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/dashboard', {
        params: { period, compare: true },
      });
      return response.data;
    },
    enabled: comparePeriod,
  });

  // Генерируем данные для графика (последние 7 дней)
  const salesChartData = {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    datasets: [
      {
        label: 'Продажи',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
        borderColor: 'var(--color-accent)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
    ],
  };

  const topProductsData = {
    labels: ['Товар 1', 'Товар 2', 'Товар 3', 'Товар 4', 'Товар 5'],
    datasets: [
      {
        label: 'Продажи',
        data: [45000, 38000, 32000, 28000, 25000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  if (statsLoading || kpiLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Дашборд</h1>
        <div className={styles.controls}>
          <Select
            options={[
              { value: '7d', label: '7 дней' },
              { value: '30d', label: '30 дней' },
              { value: '90d', label: '90 дней' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            style={{ width: '150px' }}
          />
          <label className={styles.compareLabel}>
            <input
              type="checkbox"
              checked={comparePeriod}
              onChange={(e) => setComparePeriod(e.target.checked)}
            />
            Сравнить с предыдущим периодом
          </label>
        </div>
      </div>

      {comparePeriod && comparison && (
        <div className={styles.comparison}>
          <Card title="Сравнение периодов">
            <div className={styles.comparisonGrid}>
              <div className={styles.comparisonItem}>
                <span className={styles.comparisonLabel}>Выручка:</span>
                <span className={styles.comparisonValue}>
                  {comparison.revenueChange > 0 ? '+' : ''}
                  {comparison.revenueChange?.toFixed(2)}%
                </span>
              </div>
              <div className={styles.comparisonItem}>
                <span className={styles.comparisonLabel}>Заказы:</span>
                <span className={styles.comparisonValue}>
                  {comparison.ordersChange > 0 ? '+' : ''}
                  {comparison.ordersChange?.toFixed(2)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Выручка</h3>
            <p className={styles.statValue}>
              {stats?.totalRevenue?.toLocaleString('ru-RU') || 0} ₽
            </p>
            {kpi?.revenueGrowth && (
              <span
                className={`${styles.statChange} ${
                  kpi.revenueGrowth > 0 ? styles.positive : styles.negative
                }`}
              >
                {kpi.revenueGrowth > 0 ? '↑' : '↓'}{' '}
                {Math.abs(kpi.revenueGrowth)}%
              </span>
            )}
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Заказы</h3>
            <p className={styles.statValue}>
              {stats?.totalOrders?.toLocaleString('ru-RU') || 0}
            </p>
            {kpi?.ordersGrowth && (
              <span
                className={`${styles.statChange} ${
                  kpi.ordersGrowth > 0 ? styles.positive : styles.negative
                }`}
              >
                {kpi.ordersGrowth > 0 ? '↑' : '↓'}{' '}
                {Math.abs(kpi.ordersGrowth)}%
              </span>
            )}
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Товары</h3>
            <p className={styles.statValue}>
              {stats?.totalProducts?.toLocaleString('ru-RU') || 0}
            </p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Средний чек</h3>
            <p className={styles.statValue}>
              {stats?.averageOrderValue?.toLocaleString('ru-RU') || 0} ₽
            </p>
          </div>
        </Card>
      </div>

      <div className={styles.chartsGrid}>
        <Card title="Динамика продаж">
          <LineChart data={salesChartData} height={300} />
        </Card>

        <Card title="Топ товаров">
          <BarChart data={topProductsData} height={300} />
        </Card>
      </div>

      {kpi && (
        <div className={styles.kpiGrid}>
          <Card title="Конверсия">
            <div className={styles.kpiValue}>
              {kpi.conversionRate?.toFixed(2) || 0}%
            </div>
          </Card>
          <Card title="ROI">
            <div className={styles.kpiValue}>
              {kpi.roi?.toFixed(2) || 0}%
            </div>
          </Card>
          <Card title="Прибыль">
            <div className={styles.kpiValue}>
              {kpi.profit?.toLocaleString('ru-RU') || 0} ₽
            </div>
          </Card>
          <Card title="Маржинальность">
            <div className={styles.kpiValue}>
              {kpi.margin?.toFixed(2) || 0}%
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

