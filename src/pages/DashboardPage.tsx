import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { Card } from '../components/Card';
import { LineChart, BarChart } from '../components/Chart';
import { Filters } from '../components/Filters';
import { Table } from '../components/Table';
import { FaArrowUp } from 'react-icons/fa';
import styles from './DashboardPage.module.scss';

export const DashboardPage = () => {
  const [period, setPeriod] = useState('week');
  const [source, setSource] = useState('marketplace');

  // Маппинг периодов
  const periodMap: Record<string, string> = {
    week: '7d',
    month: '30d',
    quarter: '90d',
    year: '365d',
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/dashboard', {
        params: { period: periodMap[period] || '30d' },
      });
      return response.data;
    },
  });

  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi-metrics', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/kpi', {
        params: { period: periodMap[period] || '30d' },
      });
      return response.data;
    },
  });

  const { data: abcAnalysis } = useQuery({
    queryKey: ['abc-analysis'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products/abc-analysis');
      return response.data;
    },
  });

  const { data: regionalData } = useQuery({
    queryKey: ['regional-stats', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/geo/regions/promising', {
        params: { limit: 5 },
      });
      return response.data;
    },
  });

  // Генерируем данные для графика
  const salesChartData = {
    labels: stats?.salesByPeriod?.map((s: any) => s.date) || ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    datasets: [
      {
        label: 'Продажи',
        data: stats?.salesByPeriod?.map((s: any) => s.amount) || [12000, 19000, 15000, 25000, 22000, 30000, 28000],
        borderColor: 'var(--color-accent)',
        backgroundColor: 'rgba(54, 198, 120, 0.1)',
        fill: true,
      },
    ],
  };

  const topProductsData = {
    labels: stats?.topProducts?.slice(0, 5).map((p: any) => p.name) || ['Товар 1', 'Товар 2', 'Товар 3', 'Товар 4', 'Товар 5'],
    datasets: [
      {
        label: 'Продажи',
        data: stats?.topProducts?.slice(0, 5).map((p: any) => p.amount) || [45000, 38000, 32000, 28000, 25000],
        backgroundColor: [
          'rgba(54, 198, 120, 0.8)',
          'rgba(54, 198, 120, 0.6)',
          'rgba(54, 198, 120, 0.4)',
          'rgba(54, 198, 120, 0.3)',
          'rgba(54, 198, 120, 0.2)',
        ],
      },
    ],
  };

  if (statsLoading || kpiLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <Filters
        selectedPeriod={period}
        selectedSource={source}
        onPeriodChange={setPeriod}
        onSourceChange={setSource}
      />

      <div className={styles.content}>
        <div className={styles.kpiGrid}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Заказы</h3>
              <div className={styles.kpiMainValue}>
                {stats?.totalRevenue?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} ₽
              </div>
              <div className={styles.kpiSecondaryValue}>
                {stats?.totalSales?.toLocaleString('ru-RU') || 0} шт.
              </div>
              {kpi?.revenue?.changePercent && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs(kpi.revenue.changePercent).toFixed(0)}%</span>
                </div>
              )}
              <div className={styles.kpiDaily}>
                {((stats?.totalRevenue || 0) / 7).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽ ({Math.floor((stats?.totalSales || 0) / 7)} шт.) в день
              </div>
            </div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Продажи</h3>
              <div className={styles.kpiMainValue}>
                {stats?.totalRevenue?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} ₽
              </div>
              <div className={styles.kpiSecondaryValue}>
                {stats?.totalSales?.toLocaleString('ru-RU') || 0} шт.
              </div>
              {kpi?.revenue?.changePercent && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs(kpi.revenue.changePercent).toFixed(0)}%</span>
                </div>
              )}
              <div className={styles.kpiDaily}>
                {((stats?.totalRevenue || 0) / 7).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽ ({Math.floor((stats?.totalSales || 0) / 7)} шт.) в день
              </div>
            </div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Возвраты</h3>
              <div className={styles.kpiMainValue}>
                {((stats?.totalRevenue || 0) * 0.1).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
              </div>
              <div className={styles.kpiSecondaryValue}>
                {Math.floor((stats?.totalSales || 0) * 0.1).toLocaleString('ru-RU')} шт.
              </div>
              {kpi?.revenue?.changePercent && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs(kpi.revenue.changePercent).toFixed(0)}%</span>
                </div>
              )}
            </div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Прибыльность</h3>
              <div className={styles.kpiMetrics}>
                <div className={styles.kpiMetricItem}>
                  <span className={styles.kpiMetricLabel}>Процент выкупа</span>
                  <span className={styles.kpiMetricValue}>48%</span>
                </div>
                <div className={styles.kpiMetricItem}>
                  <span className={styles.kpiMetricLabel}>ROI</span>
                  <span className={styles.kpiMetricValue}>120%</span>
                </div>
                <div className={styles.kpiMetricItem}>
                  <span className={styles.kpiMetricLabel}>Годовая рентабельность запаса</span>
                  <span className={styles.kpiMetricValue}>49%</span>
                </div>
              </div>
              {kpi?.revenue?.changePercent && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs(kpi.revenue.changePercent).toFixed(0)}%</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className={styles.chartsGrid}>
          <Card className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>ГРАФИК</h3>
            </div>
            <div className={styles.chartContent}>
              <LineChart data={salesChartData} height={300} />
            </div>
          </Card>

          <Card className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Краткая сводка</h3>
            <div className={styles.summaryContent}>
              <p>Текст анализа здесь</p>
            </div>
          </Card>
        </div>

        {/* Общие показатели и Финансы */}
        <div className={styles.metricsGrid}>
          <Card className={styles.metricsCard}>
            <div className={styles.metricsHeader}>
              <h3 className={styles.metricsTitle}>Общие показатели</h3>
              <div className={styles.metricsToggle}>
                <button className={styles.toggleButton}>руб.</button>
                <button className={`${styles.toggleButton} ${styles.toggleButtonActive}`}>шт.</button>
              </div>
            </div>
            <div className={styles.metricsList}>
              {[
                { label: 'Выручка', value: stats?.totalRevenue || 0, change: 12 },
                { label: 'Прибыль', value: stats?.totalProfit || 0, change: 12 },
                { label: 'Заказы', value: stats?.totalSales || 0, change: 12 },
                { label: 'Средний чек', value: stats?.averageOrderValue || 0, change: 12 },
                { label: 'Конверсия', value: stats?.conversionRate || 0, change: 12 },
                { label: 'ROI', value: kpi?.roi || 0, change: 12 },
                { label: 'Маржинальность', value: kpi?.margin || 0, change: 12 },
                { label: 'Оборачиваемость', value: 0, change: 12 },
                { label: 'Товарооборот', value: 0, change: 12 },
                { label: 'Возвраты', value: 0, change: 12 },
              ].map((item, index) => (
                <div key={index} className={styles.metricItem}>
                  <FaArrowUp className={styles.metricChangeIcon} />
                  <span className={styles.metricChange}>12%</span>
                  <span className={styles.metricLabel}>{item.label}</span>
                  <span className={styles.metricValue}>
                    {item.value.toLocaleString('ru-RU')} {item.label === 'Конверсия' || item.label === 'ROI' || item.label === 'Маржинальность' || item.label === 'Оборачиваемость' ? '%' : item.label === 'Средний чек' ? '₽' : ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className={styles.metricsCard}>
            <div className={styles.metricsHeader}>
              <h3 className={styles.metricsTitle}>Финансы</h3>
              <div className={styles.metricsToggle}>
                <button className={styles.toggleButton}>руб.</button>
                <button className={`${styles.toggleButton} ${styles.toggleButtonActive}`}>шт.</button>
              </div>
            </div>
            <div className={styles.metricsList}>
              {[
                { label: 'Выручка', value: stats?.totalRevenue || 0, change: 12 },
                { label: 'Себестоимость', value: (stats?.totalRevenue || 0) * 0.6, change: 12 },
                { label: 'Валовая прибыль', value: stats?.totalProfit || 0, change: 12 },
                { label: 'Маржинальность', value: kpi?.margin || 0, change: 12 },
                { label: 'ROI', value: kpi?.roi || 0, change: 12 },
                { label: 'Налоги', value: (stats?.totalRevenue || 0) * 0.06, change: 12 },
                { label: 'Комиссии', value: (stats?.totalRevenue || 0) * 0.1, change: 12 },
                { label: 'Логистика', value: (stats?.totalRevenue || 0) * 0.05, change: 12 },
                { label: 'Реклама', value: (stats?.totalRevenue || 0) * 0.08, change: 12 },
                { label: 'Чистая прибыль', value: (stats?.totalProfit || 0) * 0.7, change: 12 },
              ].map((item, index) => (
                <div key={index} className={styles.metricItem}>
                  <FaArrowUp className={styles.metricChangeIcon} />
                  <span className={styles.metricChange}>12%</span>
                  <span className={styles.metricLabel}>{item.label}</span>
                  <span className={styles.metricValue}>
                    {item.value.toLocaleString('ru-RU')} {item.label === 'Маржинальность' || item.label === 'ROI' ? '%' : '₽'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Склад и Расходы */}
        <div className={styles.metricsGrid}>
          <Card className={styles.metricsCard}>
            <div className={styles.metricsHeader}>
              <h3 className={styles.metricsTitle}>Склад</h3>
            </div>
            <div className={styles.metricsList}>
              {[
                { label: 'Остатки на складе', value: 0, change: 12 },
                { label: 'В пути к клиенту', value: 0, change: 12 },
                { label: 'Резерв', value: 0, change: 12 },
                { label: 'Оборачиваемость', value: 0, change: 12 },
                { label: 'Дней до исчерпания', value: 0, change: 12 },
              ].map((item, index) => (
                <div key={index} className={styles.metricItem}>
                  <FaArrowUp className={styles.metricChangeIcon} />
                  <span className={styles.metricChange}>12%</span>
                  <span className={styles.metricLabel}>{item.label}</span>
                  <span className={styles.metricValue}>
                    {item.value.toLocaleString('ru-RU')} {item.label === 'Оборачиваемость' ? '%' : item.label === 'Дней до исчерпания' ? 'дн.' : 'шт.'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className={styles.metricsCard}>
            <div className={styles.metricsHeader}>
              <h3 className={styles.metricsTitle}>Расходы</h3>
            </div>
            <div className={styles.metricsList}>
              {[
                { label: 'Комиссии маркетплейсов', value: (stats?.totalRevenue || 0) * 0.1, change: 12 },
                { label: 'Логистика', value: (stats?.totalRevenue || 0) * 0.05, change: 12 },
                { label: 'Реклама', value: (stats?.totalRevenue || 0) * 0.08, change: 12 },
                { label: 'Хранение', value: (stats?.totalRevenue || 0) * 0.02, change: 12 },
                { label: 'Возвраты', value: (stats?.totalRevenue || 0) * 0.03, change: 12 },
              ].map((item, index) => (
                <div key={index} className={styles.metricItem}>
                  <FaArrowUp className={styles.metricChangeIcon} />
                  <span className={styles.metricChange}>12%</span>
                  <span className={styles.metricLabel}>{item.label}</span>
                  <span className={styles.metricValue}>
                    {item.value.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ABC-анализ */}
        {abcAnalysis && (
          <Card className={styles.abcCard}>
            <h3 className={styles.abcTitle}>АВС-анализ</h3>
            <div className={styles.abcGroups}>
              <div className={styles.abcGroup}>
                <h4 className={styles.abcGroupTitle}>Группа А</h4>
                <div className={styles.abcGroupValue}>
                  {abcAnalysis.groupA?.revenue?.toLocaleString('ru-RU') || '259 000'} ₽
                </div>
                <div className={styles.abcGroupQuantity}>
                  {abcAnalysis.groupA?.quantity || 245} шт.
                </div>
                <div className={styles.abcGroupChange}>
                  <FaArrowUp className={styles.abcChangeIcon} />
                  <span>12%</span>
                </div>
              </div>
              <div className={styles.abcDivider}></div>
              <div className={styles.abcGroup}>
                <h4 className={styles.abcGroupTitle}>Группа В</h4>
                <div className={styles.abcGroupValue}>
                  {abcAnalysis.groupB?.revenue?.toLocaleString('ru-RU') || '259 000'} ₽
                </div>
                <div className={styles.abcGroupQuantity}>
                  {abcAnalysis.groupB?.quantity || 245} шт.
                </div>
                <div className={styles.abcGroupChange}>
                  <FaArrowUp className={styles.abcChangeIcon} />
                  <span>12%</span>
                </div>
              </div>
              <div className={styles.abcDivider}></div>
              <div className={styles.abcGroup}>
                <h4 className={styles.abcGroupTitle}>Группа С</h4>
                <div className={styles.abcGroupValue}>
                  {abcAnalysis.groupC?.revenue?.toLocaleString('ru-RU') || '259 000'} ₽
                </div>
                <div className={styles.abcGroupQuantity}>
                  {abcAnalysis.groupC?.quantity || 245} шт.
                </div>
                <div className={styles.abcGroupChange}>
                  <FaArrowUp className={styles.abcChangeIcon} />
                  <span>12%</span>
                </div>
              </div>
            </div>
            <button className={styles.abcDetailsButton}>Подробнее</button>
          </Card>
        )}

        {/* Региональные таблицы */}
        <div className={styles.regionalTablesGrid}>
          <Card className={styles.regionalTableCard}>
            <div className={styles.regionalTableHeader}>
              <h3 className={styles.regionalTableTitle}>Прибыльные регионы - ТОП продажи</h3>
              <button className={styles.regionalTableDetailsButton}>Подробнее</button>
            </div>
            <Table
              data={regionalData?.slice(0, 5) || []}
              columns={[
                { key: 'region', header: 'Регион' },
                { key: 'ordersCount', header: 'Количество', render: (item: any) => `${item.ordersCount || 0} шт.` },
                { key: 'totalRevenue', header: 'Сумма', render: (item: any) => `${(item.totalRevenue || 0).toLocaleString('ru-RU')} ₽` },
                { key: 'share', header: 'Доля', render: (item: any) => `${((item.totalRevenue || 0) / (stats?.totalRevenue || 1) * 100).toFixed(0)}%` },
              ]}
              emptyMessage="Нет данных"
            />
          </Card>

          <Card className={styles.regionalTableCard}>
            <div className={styles.regionalTableHeader}>
              <h3 className={styles.regionalTableTitle}>Информация по складам - ТОП регионы</h3>
              <button className={styles.regionalTableDetailsButton}>Подробнее</button>
            </div>
            <Table
              data={regionalData?.slice(0, 5) || []}
              columns={[
                { key: 'region', header: 'Регион' },
                { key: 'total', header: 'Всего', render: (item: any) => `${item.ordersCount || 0} шт. ${((item.totalRevenue || 0) / (stats?.totalRevenue || 1) * 100).toFixed(2)}%` },
                { key: 'totalShare', header: 'Общая доля', render: (item: any) => `${((item.totalRevenue || 0) / (stats?.totalRevenue || 1) * 100).toFixed(0)}%` },
                { key: 'byWarehouse', header: 'По складу', render: (item: any) => `${((item.totalRevenue || 0) / (stats?.totalRevenue || 1) * 100).toFixed(0)}%` },
              ]}
              emptyMessage="Нет данных"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

