import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { Card } from '../components/Card';
import { LineChart } from '../components/Chart';
import { Filters } from '../components/Filters';
import { Table } from '../components/Table';
import { Button } from '../components/Form';
import { FaArrowUp, FaCog, FaPlus } from 'react-icons/fa';
import styles from './DashboardPage.module.scss';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('week');
  const [source, setSource] = useState('marketplace');
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

  // Маппинг периодов для вычисления дат
  const periodDaysMap: Record<string, number> = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
  };

  // Маппинг периодов для KPI API (ожидает 'day' | 'week' | 'month')
  const kpiPeriodMap: Record<string, 'day' | 'week' | 'month'> = {
    week: 'week',
    month: 'month',
    quarter: 'month', // Для квартала используем месяц
    year: 'month', // Для года используем месяц
  };

  // Вычисляем даты на основе периода
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    const days = periodDaysMap[period] || 30;
    start.setDate(end.getDate() - days);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErrorData } = useQuery({
    queryKey: ['dashboard-stats', period, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/dashboard', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки статистики дашборда');
    },
  });

  const { data: kpi, isLoading: kpiLoading, isError: kpiError } = useQuery({
    queryKey: ['kpi-metrics', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/kpi', {
        params: { period: kpiPeriodMap[period] || 'month' },
      });
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки KPI метрик');
    },
  });

  const { data: abcAnalysis, isError: abcError } = useQuery({
    queryKey: ['abc-analysis'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products/abc-analysis');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки ABC-анализа');
    },
  });

  const { data: regionalData, isError: regionalError } = useQuery({
    queryKey: ['regional-stats', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/geo/regions/promising', {
        params: { limit: 5 },
      });
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки региональной статистики');
    },
  });

  // Получаем виджеты дашборда
  const { data: widgets, isLoading: widgetsLoading, isError: widgetsError } = useQuery({
    queryKey: ['dashboard-widgets'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/widgets');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки виджетов');
    },
  });

  // Инициализация виджетов по умолчанию, если их нет
  const initializeWidgetsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.instance.post('/analytics/widgets/initialize');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
    },
    onError: (error: any) => {
      console.error('Ошибка инициализации виджетов:', error);
      // Не показываем alert, так как это автоматическая операция
    },
  });

  useEffect(() => {
    // Если виджетов нет, инициализируем их
    if (!widgetsLoading && (!widgets || widgets.length === 0)) {
      initializeWidgetsMutation.mutate();
    }
  }, [widgets, widgetsLoading]);

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
        {/* Отображение виджетов */}
        {widgets && widgets.length > 0 && (
          <div className={styles.widgetsGrid}>
            {widgets.map((widget: any) => {
              const renderWidget = () => {
                switch (widget.type) {
                  case 'revenue':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Выручка'}</h4>
                        <div className={styles.widgetValue}>
                          {stats?.totalRevenue?.toLocaleString('ru-RU') || 0} ₽
                        </div>
                        {kpi?.revenue?.changePercent && (
                          <div className={styles.widgetChange}>
                            {kpi.revenue.changePercent > 0 ? '+' : ''}{kpi.revenue.changePercent.toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'profit':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Прибыль'}</h4>
                        <div className={styles.widgetValue}>
                          {stats?.totalProfit?.toLocaleString('ru-RU') || 0} ₽
                        </div>
                        {kpi?.profit?.changePercent && (
                          <div className={styles.widgetChange}>
                            {kpi.profit.changePercent > 0 ? '+' : ''}{kpi.profit.changePercent.toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'sales':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Продажи'}</h4>
                        <div className={styles.widgetValue}>
                          {stats?.totalSales?.toLocaleString('ru-RU') || 0} шт.
                        </div>
                        {kpi?.orders?.changePercent && (
                          <div className={styles.widgetChange}>
                            {kpi.orders.changePercent > 0 ? '+' : ''}{kpi.orders.changePercent.toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'orders':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Заказы'}</h4>
                        <div className={styles.widgetValue}>
                          {stats?.totalSales?.toLocaleString('ru-RU') || 0}
                        </div>
                        {kpi?.orders?.changePercent && (
                          <div className={styles.widgetChange}>
                            {kpi.orders.changePercent > 0 ? '+' : ''}{kpi.orders.changePercent.toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'average_order_value':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Средний чек'}</h4>
                        <div className={styles.widgetValue}>
                          {stats?.averageOrderValue?.toLocaleString('ru-RU') || 0} ₽
                        </div>
                        {kpi?.averageOrderValue?.changePercent && (
                          <div className={styles.widgetChange}>
                            {kpi.averageOrderValue.changePercent > 0 ? '+' : ''}{kpi.averageOrderValue.changePercent.toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'growth_rate':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Рост продаж'}</h4>
                        <div className={styles.widgetValue}>
                          {stats?.growthRate ? `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%` : '0%'}
                        </div>
                      </Card>
                    );
                  case 'top_products':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Топ товары'}</h4>
                        {stats?.topProducts && stats.topProducts.length > 0 ? (
                          <Table
                            columns={[
                              { key: 'name', header: 'Товар' },
                              { key: 'quantity', header: 'Продано' },
                              { key: 'revenue', header: 'Выручка', render: (item: any) => `${item.revenue?.toLocaleString('ru-RU') || 0} ₽` },
                            ]}
                            data={stats.topProducts.slice(0, 5)}
                            emptyMessage="Нет данных"
                          />
                        ) : (
                          <p>Нет данных</p>
                        )}
                      </Card>
                    );
                  case 'sales_chart':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'График продаж'}</h4>
                        <LineChart data={salesChartData} height={200} />
                      </Card>
                    );
                  default:
                    return null;
                }
              };

              return (
                <div
                  key={widget.id}
                  className={styles.widgetContainer}
                  style={{
                    gridColumn: `span ${widget.width || 1}`,
                    gridRow: `span ${widget.height || 1}`,
                  }}
                >
                  {renderWidget()}
                </div>
              );
            })}
          </div>
        )}

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
                  <span className={styles.kpiMetricValue}>
                    {stats?.conversionRate 
                      ? `${(stats.conversionRate * 100).toFixed(0)}%` 
                      : stats?.totalSales && stats?.totalSales > 0
                      ? `${((stats.totalSales / (stats.totalSales + (stats.totalSales * 0.1))) * 100).toFixed(0)}%`
                      : '-'}
                  </span>
                </div>
                <div className={styles.kpiMetricItem}>
                  <span className={styles.kpiMetricLabel}>ROI</span>
                  <span className={styles.kpiMetricValue}>
                    {kpi?.roi 
                      ? `${kpi.roi.toFixed(0)}%` 
                      : stats?.totalRevenue && stats?.totalProfit 
                      ? `${((stats.totalProfit / (stats.totalRevenue - stats.totalProfit)) * 100).toFixed(0)}%`
                      : '-'}
                  </span>
                </div>
                <div className={styles.kpiMetricItem}>
                  <span className={styles.kpiMetricLabel}>Маржинальность</span>
                  <span className={styles.kpiMetricValue}>
                    {kpi?.margin 
                      ? `${kpi.margin.toFixed(0)}%` 
                      : stats?.totalRevenue && stats?.totalProfit 
                      ? `${((stats.totalProfit / stats.totalRevenue) * 100).toFixed(0)}%`
                      : '-'}
                  </span>
                </div>
              </div>
              {kpi?.profit?.changePercent && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs(kpi.profit.changePercent).toFixed(0)}%</span>
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
              {stats && (
                <>
                  <p>
                    За выбранный период получена выручка {stats.totalRevenue?.toLocaleString('ru-RU')} ₽ 
                    при прибыли {stats.totalProfit?.toLocaleString('ru-RU')} ₽.
                  </p>
                  {stats.growthRate !== undefined && stats.growthRate !== 0 && (
                    <p>
                      Рост продаж составил {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}% 
                      по сравнению с предыдущим периодом.
                    </p>
                  )}
                  {stats.averageOrderValue > 0 && (
                    <p>
                      Средний чек: {stats.averageOrderValue.toLocaleString('ru-RU')} ₽.
                    </p>
                  )}
                  {stats.conversionRate > 0 && (
                    <p>
                      Конверсия: {(stats.conversionRate * 100).toFixed(1)}%.
                    </p>
                  )}
                </>
              )}
              {!stats && <p>Загрузка данных...</p>}
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
                { 
                  label: 'Выручка', 
                  value: stats?.totalRevenue || 0, 
                  change: kpi?.revenue?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Прибыль', 
                  value: stats?.totalProfit || 0, 
                  change: kpi?.profit?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Заказы', 
                  value: stats?.totalSales || 0, 
                  change: kpi?.orders?.changePercent || 0,
                  unit: 'шт.'
                },
                { 
                  label: 'Средний чек', 
                  value: stats?.averageOrderValue || 0, 
                  change: kpi?.averageOrderValue?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Конверсия', 
                  value: stats?.conversionRate ? (stats.conversionRate * 100) : 0, 
                  change: kpi?.revenue?.changePercent || 0,
                  unit: '%'
                },
                { 
                  label: 'ROI', 
                  value: kpi?.roi || (stats?.totalRevenue && stats?.totalProfit ? ((stats.totalProfit / (stats.totalRevenue - stats.totalProfit)) * 100) : 0), 
                  change: kpi?.profit?.changePercent || 0,
                  unit: '%'
                },
                { 
                  label: 'Маржинальность', 
                  value: kpi?.margin || (stats?.totalRevenue && stats?.totalProfit ? ((stats.totalProfit / stats.totalRevenue) * 100) : 0), 
                  change: kpi?.profit?.changePercent || 0,
                  unit: '%'
                },
                { 
                  label: 'Рост продаж', 
                  value: stats?.growthRate ? (stats.growthRate * 100) : 0, 
                  change: stats?.growthRate ? (stats.growthRate * 100) : 0,
                  unit: '%'
                },
              ].map((item, index) => (
                <div key={index} className={styles.metricItem}>
                  {item.change !== 0 && (
                    <>
                      {item.change > 0 ? (
                        <FaArrowUp className={styles.metricChangeIcon} />
                      ) : (
                        <FaArrowUp className={styles.metricChangeIcon} style={{ transform: 'rotate(180deg)' }} />
                      )}
                      <span className={styles.metricChange}>
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(0)}%
                      </span>
                    </>
                  )}
                  <span className={styles.metricLabel}>{item.label}</span>
                  <span className={styles.metricValue}>
                    {item.value.toLocaleString('ru-RU', { maximumFractionDigits: item.unit === '%' ? 1 : 0 })} {item.unit}
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
                { 
                  label: 'Выручка', 
                  value: stats?.totalRevenue || 0, 
                  change: kpi?.revenue?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Себестоимость', 
                  value: stats?.totalRevenue && stats?.totalProfit 
                    ? (stats.totalRevenue - stats.totalProfit) 
                    : (stats?.totalRevenue || 0) * 0.6, 
                  change: kpi?.profit?.changePercent ? -kpi.profit.changePercent : 0,
                  unit: '₽'
                },
                { 
                  label: 'Валовая прибыль', 
                  value: stats?.totalProfit || 0, 
                  change: kpi?.profit?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Маржинальность', 
                  value: kpi?.margin || (stats?.totalRevenue && stats?.totalProfit ? ((stats.totalProfit / stats.totalRevenue) * 100) : 0), 
                  change: kpi?.profit?.changePercent || 0,
                  unit: '%'
                },
                { 
                  label: 'ROI', 
                  value: kpi?.roi || (stats?.totalRevenue && stats?.totalProfit ? ((stats.totalProfit / (stats.totalRevenue - stats.totalProfit)) * 100) : 0), 
                  change: kpi?.profit?.changePercent || 0,
                  unit: '%'
                },
                { 
                  label: 'Налоги', 
                  value: (stats?.totalRevenue || 0) * 0.06, 
                  change: kpi?.revenue?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Комиссии', 
                  value: (stats?.totalRevenue || 0) * 0.1, 
                  change: kpi?.revenue?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Логистика', 
                  value: (stats?.totalRevenue || 0) * 0.05, 
                  change: kpi?.revenue?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Реклама', 
                  value: (stats?.totalRevenue || 0) * 0.08, 
                  change: kpi?.revenue?.changePercent || 0,
                  unit: '₽'
                },
                { 
                  label: 'Чистая прибыль', 
                  value: stats?.totalProfit ? (stats.totalProfit * 0.7) : 0, 
                  change: kpi?.profit?.changePercent || 0,
                  unit: '₽'
                },
              ].map((item, index) => (
                <div key={index} className={styles.metricItem}>
                  {item.change !== 0 && (
                    <>
                      {item.change > 0 ? (
                        <FaArrowUp className={styles.metricChangeIcon} />
                      ) : (
                        <FaArrowUp className={styles.metricChangeIcon} style={{ transform: 'rotate(180deg)' }} />
                      )}
                      <span className={styles.metricChange}>
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(0)}%
                      </span>
                    </>
                  )}
                  <span className={styles.metricLabel}>{item.label}</span>
                  <span className={styles.metricValue}>
                    {item.value.toLocaleString('ru-RU')} {item.unit || '₽'}
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

