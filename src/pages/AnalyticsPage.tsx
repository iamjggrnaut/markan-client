import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { Card } from '../components/Card';
import { LineChart, BarChart } from '../components/Chart';
import { Select } from '../components/Form';
import styles from './AnalyticsPage.module.scss';

export const AnalyticsPage = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Вычисляем даты на основе периода
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'custom':
        start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-dashboard', period, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/dashboard', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      return response.data;
    },
  });

  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics-kpi', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/kpi', {
        params: { period: period === '7d' ? 'week' : period === '30d' ? 'month' : 'month' },
      });
      return response.data;
    },
  });

  const { data: adAnalytics, isLoading: adLoading } = useQuery({
    queryKey: ['analytics-ads', period, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/ads', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      return response.data;
    },
  });

  // Подготовка данных для графиков
  const salesChartData = dashboardStats?.salesByPeriod
    ? {
        labels: dashboardStats.salesByPeriod.map((item: any) => {
          const date = new Date(item.date);
          return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [
          {
            label: 'Выручка',
            data: dashboardStats.salesByPeriod.map((item: any) => item.revenue || 0),
            borderColor: 'var(--color-accent)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          },
          {
            label: 'Прибыль',
            data: dashboardStats.salesByPeriod.map((item: any) => item.profit || 0),
            borderColor: 'var(--color-success)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
          },
        ],
      }
    : null;

  const marketplaceData = dashboardStats?.salesByMarketplace
    ? {
        labels: dashboardStats.salesByMarketplace.map((item: any) => item.marketplace || 'Неизвестно'),
        datasets: [
          {
            label: 'Продажи',
            data: dashboardStats.salesByMarketplace.map((item: any) => item.revenue || 0),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)',
            ],
          },
        ],
      }
    : null;

  const topProductsData = dashboardStats?.topProducts
    ? {
        labels: dashboardStats.topProducts.slice(0, 10).map((item: any) => item.name || 'Неизвестный товар'),
        datasets: [
          {
            label: 'Продажи',
            data: dashboardStats.topProducts.slice(0, 10).map((item: any) => item.revenue || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
          },
        ],
      }
    : null;

  if (statsLoading || kpiLoading) {
    return <div className={styles.loading}>Загрузка аналитики...</div>;
  }

  return (
    <div className={styles.analytics}>
      <div className={styles.header}>
        <h1 className={styles.title}>Аналитика</h1>
        <div className={styles.controls}>
          <Select
            options={[
              { value: '7d', label: '7 дней' },
              { value: '30d', label: '30 дней' },
              { value: '90d', label: '90 дней' },
              { value: 'custom', label: 'Произвольный период' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            style={{ width: '200px' }}
          />
          {period === 'custom' && (
            <div className={styles.dateInputs}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
              />
              <span>—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI метрики */}
      {kpi && (
        <div className={styles.kpiGrid}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiLabel}>Выручка</h3>
              <p className={styles.kpiValue}>
                {kpi.revenue?.current?.toLocaleString('ru-RU') || 0} ₽
              </p>
              {kpi.revenue?.changePercent !== undefined && (
                <span
                  className={`${styles.kpiChange} ${
                    kpi.revenue.changePercent >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {kpi.revenue.changePercent >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(kpi.revenue.changePercent || 0).toFixed(1)}%
                </span>
              )}
            </div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiLabel}>Прибыль</h3>
              <p className={styles.kpiValue}>
                {kpi.profit?.current?.toLocaleString('ru-RU') || 0} ₽
              </p>
              {kpi.profit?.changePercent !== undefined && (
                <span
                  className={`${styles.kpiChange} ${
                    kpi.profit.changePercent >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {kpi.profit.changePercent >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(kpi.profit.changePercent || 0).toFixed(1)}%
                </span>
              )}
            </div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiLabel}>Заказы</h3>
              <p className={styles.kpiValue}>
                {kpi.orders?.current?.toLocaleString('ru-RU') || 0}
              </p>
              {kpi.orders?.changePercent !== undefined && (
                <span
                  className={`${styles.kpiChange} ${
                    kpi.orders.changePercent >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {kpi.orders.changePercent >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(kpi.orders.changePercent || 0).toFixed(1)}%
                </span>
              )}
            </div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiLabel}>Средний чек</h3>
              <p className={styles.kpiValue}>
                {kpi.averageOrderValue?.current?.toLocaleString('ru-RU') || 0} ₽
              </p>
              {kpi.averageOrderValue?.changePercent !== undefined && (
                <span
                  className={`${styles.kpiChange} ${
                    kpi.averageOrderValue.changePercent >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {kpi.averageOrderValue.changePercent >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(kpi.averageOrderValue.changePercent || 0).toFixed(1)}%
                </span>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Графики */}
      <div className={styles.chartsGrid}>
        {salesChartData && (
          <Card title="Динамика продаж">
            <LineChart data={salesChartData} height={300} />
          </Card>
        )}

        {marketplaceData && (
          <Card title="Продажи по маркетплейсам">
            <BarChart data={marketplaceData} height={300} />
          </Card>
        )}

        {topProductsData && (
          <Card title="Топ товаров">
            <BarChart data={topProductsData} height={300} />
          </Card>
        )}
      </div>

      {/* Детальная статистика */}
      {dashboardStats && (
        <div className={styles.detailedStats}>
          <Card title="Детальная статистика">
            <div className={styles.statsTable}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Общая выручка:</span>
                <span className={styles.statValue}>
                  {dashboardStats.totalRevenue?.toLocaleString('ru-RU') || 0} ₽
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Общая прибыль:</span>
                <span className={styles.statValue}>
                  {dashboardStats.totalProfit?.toLocaleString('ru-RU') || 0} ₽
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Всего продаж:</span>
                <span className={styles.statValue}>
                  {dashboardStats.totalSales?.toLocaleString('ru-RU') || 0}
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Средний чек:</span>
                <span className={styles.statValue}>
                  {dashboardStats.averageOrderValue?.toLocaleString('ru-RU') || 0} ₽
                </span>
              </div>
              {dashboardStats.conversionRate !== undefined && (
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Конверсия:</span>
                  <span className={styles.statValue}>
                    {dashboardStats.conversionRate.toFixed(2)}%
                  </span>
                </div>
              )}
              {dashboardStats.growthRate !== undefined && (
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Рост:</span>
                  <span className={styles.statValue}>
                    {dashboardStats.growthRate >= 0 ? '+' : ''}
                    {dashboardStats.growthRate.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Аналитика по рекламе */}
      {adAnalytics && !adLoading && (
        <div className={styles.adAnalytics}>
          <Card title="Аналитика по рекламе">
            <div className={styles.adStats}>
              {adAnalytics.totalSpent !== undefined && (
                <div className={styles.adStatItem}>
                  <span className={styles.adStatLabel}>Потрачено на рекламу:</span>
                  <span className={styles.adStatValue}>
                    {adAnalytics.totalSpent.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              )}
              {adAnalytics.totalRevenue !== undefined && (
                <div className={styles.adStatItem}>
                  <span className={styles.adStatLabel}>Выручка от рекламы:</span>
                  <span className={styles.adStatValue}>
                    {adAnalytics.totalRevenue.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              )}
              {adAnalytics.roi !== undefined && (
                <div className={styles.adStatItem}>
                  <span className={styles.adStatLabel}>ROI:</span>
                  <span className={styles.adStatValue}>
                    {adAnalytics.roi.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

