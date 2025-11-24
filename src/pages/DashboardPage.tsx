import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { Card } from '../components/Card';
import { LineChart } from '../components/Chart';
import { Filters } from '../components/Filters';
import { Table } from '../components/Table';
import { FaArrowUp } from 'react-icons/fa';
import { PERIOD_DAYS, DEFAULT_PERIOD } from '../constants/date.constants';
import { API_CONSTANTS } from '../constants/api.constants';
import { CALCULATION_CONSTANTS } from '../constants/calculation.constants';
import styles from './DashboardPage.module.scss';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<string>(DEFAULT_PERIOD);
  const [source, setSource] = useState('marketplace');
  const [metricsUnit, setMetricsUnit] = useState<'rub' | 'pieces'>('pieces');
  const [financeUnit, setFinanceUnit] = useState<'rub' | 'pieces'>('pieces');

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

    const days = PERIOD_DAYS[period as keyof typeof PERIOD_DAYS] || PERIOD_DAYS[DEFAULT_PERIOD];
    start.setDate(end.getDate() - days);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', period, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/dashboard', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      return response.data as any;
    },
  });

  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi-metrics', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/kpi', {
        params: { period: kpiPeriodMap[period] || 'month' },
      });
      return response.data as any;
    },
  });

  const { data: abcAnalysis } = useQuery({
    queryKey: ['abc-analysis'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products/abc-analysis');
      return response.data as any;
    },
  });

  const { data: regionalData } = useQuery({
    queryKey: ['regional-stats', period],
    queryFn: async () => {
      const response = await apiClient.instance.get('/geo/regions/promising', {
        params: { limit: API_CONSTANTS.DASHBOARD_TOP_ITEMS },
      });
      return response.data as any[];
    },
  });

  // Получаем виджеты дашборда
  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ['dashboard-widgets'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/analytics/widgets');
      return response.data as any[];
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
    if (!widgetsLoading && (!widgets || !Array.isArray(widgets) || widgets.length === 0)) {
      initializeWidgetsMutation.mutate();
    }
  }, [widgets, widgetsLoading]);

  // Генерируем данные для графика
  const salesByPeriod = stats && (stats as any).salesByPeriod ? ((stats as any).salesByPeriod || []) : [];
  const salesChartData = {
    labels: salesByPeriod.length > 0 
      ? salesByPeriod.map((s: any) => s.date) 
      : [],
    datasets: [
      {
        label: 'Продажи',
        data: salesByPeriod.length > 0 
          ? salesByPeriod.map((s: any) => s.amount) 
          : [],
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
        {widgets && Array.isArray(widgets) && widgets.length > 0 && (
          <div className={styles.widgetsGrid}>
            {widgets.map((widget: any) => {
              const renderWidget = () => {
                switch (widget.type) {
                  case 'revenue':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Выручка'}</h4>
                        <div className={styles.widgetValue}>
                          {((stats as any)?.totalRevenue || 0).toLocaleString('ru-RU')} ₽
                        </div>
                        {(kpi as any)?.revenue?.changePercent && (
                          <div className={styles.widgetChange}>
                            {((kpi as any).revenue.changePercent > 0 ? '+' : '')}{((kpi as any).revenue.changePercent).toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'profit':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Прибыль'}</h4>
                        <div className={styles.widgetValue}>
                          {((stats as any)?.totalProfit || 0).toLocaleString('ru-RU')} ₽
                        </div>
                        {(kpi as any)?.profit?.changePercent && (
                          <div className={styles.widgetChange}>
                            {((kpi as any).profit.changePercent > 0 ? '+' : '')}{((kpi as any).profit.changePercent).toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'sales':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Продажи'}</h4>
                        <div className={styles.widgetValue}>
                          {((stats as any)?.totalSales || 0).toLocaleString('ru-RU')} шт.
                        </div>
                        {(kpi as any)?.orders?.changePercent && (
                          <div className={styles.widgetChange}>
                            {((kpi as any).orders.changePercent > 0 ? '+' : '')}{((kpi as any).orders.changePercent).toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'orders':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Заказы'}</h4>
                        <div className={styles.widgetValue}>
                          {(stats as any)?.totalSales?.toLocaleString('ru-RU') || 0}
                        </div>
                        {(kpi as any)?.orders?.changePercent && (
                          <div className={styles.widgetChange}>
                            {(kpi as any).orders.changePercent > 0 ? '+' : ''}{(kpi as any).orders.changePercent.toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'average_order_value':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Средний чек'}</h4>
                        <div className={styles.widgetValue}>
                          {((stats as any)?.averageOrderValue || 0).toLocaleString('ru-RU')} ₽
                        </div>
                        {(kpi as any)?.averageOrderValue?.changePercent && (
                          <div className={styles.widgetChange}>
                            {((kpi as any).averageOrderValue.changePercent > 0 ? '+' : '')}{((kpi as any).averageOrderValue.changePercent).toFixed(1)}%
                          </div>
                        )}
                      </Card>
                    );
                  case 'growth_rate':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Рост продаж'}</h4>
                        <div className={styles.widgetValue}>
                          {(stats as any)?.growthRate ? `${((stats as any).growthRate > 0 ? '+' : '')}${((stats as any).growthRate).toFixed(1)}%` : '0%'}
                        </div>
                      </Card>
                    );
                  case 'top_products':
                    return (
                      <Card key={widget.id} className={styles.widgetCard}>
                        <h4>{widget.title || 'Топ товары'}</h4>
                        {(stats as any)?.topProducts && Array.isArray((stats as any).topProducts) && (stats as any).topProducts.length > 0 ? (
                          <Table
                            columns={[
                              { key: 'name', header: 'Товар' },
                              { key: 'quantity', header: 'Продано' },
                              { key: 'revenue', header: 'Выручка', render: (item: any) => `${item.revenue?.toLocaleString('ru-RU') || 0} ₽` },
                            ]}
                            data={((stats as any).topProducts || []).slice(0, 5)}
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
                {((stats as any)?.totalSales || 0).toLocaleString('ru-RU')} шт.
              </div>
              <div className={styles.kpiSecondaryValue}>
                {(stats as any)?.totalRevenue?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} ₽
              </div>
              {(kpi as any)?.orders?.changePercent !== undefined && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs((kpi as any).orders.changePercent).toFixed(0)}%</span>
                </div>
              )}
              <div className={styles.kpiDaily}>
                {Math.floor(((stats as any)?.totalSales || 0) / CALCULATION_CONSTANTS.DAYS_IN_WEEK)} шт. ({(((stats as any)?.totalRevenue || 0) / CALCULATION_CONSTANTS.DAYS_IN_WEEK).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽) в день
              </div>
            </div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Продажи</h3>
              <div className={styles.kpiMainValue}>
                {(stats as any)?.totalRevenue?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} ₽
              </div>
              <div className={styles.kpiSecondaryValue}>
                {(stats as any)?.totalSales?.toLocaleString('ru-RU') || 0} шт.
              </div>
              {(kpi as any)?.revenue?.changePercent && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs((kpi as any).revenue.changePercent).toFixed(0)}%</span>
                </div>
              )}
              <div className={styles.kpiDaily}>
                {(((stats as any)?.totalRevenue || 0) / CALCULATION_CONSTANTS.DAYS_IN_WEEK).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽ ({Math.floor(((stats as any)?.totalSales || 0) / CALCULATION_CONSTANTS.DAYS_IN_WEEK)} шт.) в день
              </div>
            </div>
          </Card>

          <Card className={styles.kpiCard}>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Возвраты</h3>
              <div className={styles.kpiMainValue}>
                {(((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.DEFAULT_GROWTH_FACTOR).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
              </div>
              <div className={styles.kpiSecondaryValue}>
                {Math.floor(((stats as any)?.totalSales || 0) * CALCULATION_CONSTANTS.DEFAULT_GROWTH_FACTOR).toLocaleString('ru-RU')} шт.
              </div>
              {(kpi as any)?.revenue?.changePercent && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs((kpi as any).revenue.changePercent).toFixed(0)}%</span>
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
                    {(stats as any)?.conversionRate 
                      ? `${((stats as any).conversionRate * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(0)}%` 
                      : (stats as any)?.totalSales && (stats as any)?.totalSales > 0
                      ? `${(((stats as any).totalSales / ((stats as any).totalSales + ((stats as any).totalSales * CALCULATION_CONSTANTS.DEFAULT_GROWTH_FACTOR))) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(0)}%`
                      : '-'}
                  </span>
                </div>
                <div className={styles.kpiMetricItem}>
                  <span className={styles.kpiMetricLabel}>ROI</span>
                  <span className={styles.kpiMetricValue}>
                    {(kpi as any)?.roi 
                      ? `${(kpi as any).roi.toFixed(0)}%` 
                      : (stats as any)?.totalRevenue && (stats as any)?.totalProfit 
                      ? `${(((stats as any).totalProfit / ((stats as any).totalRevenue - (stats as any).totalProfit)) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(0)}%`
                      : '-'}
                  </span>
                </div>
                <div className={styles.kpiMetricItem}>
                  <span className={styles.kpiMetricLabel}>Маржинальность</span>
                  <span className={styles.kpiMetricValue}>
                    {(kpi as any)?.margin 
                      ? `${(kpi as any).margin.toFixed(0)}%` 
                      : (stats as any)?.totalRevenue && (stats as any)?.totalProfit 
                      ? `${(((stats as any).totalProfit / (stats as any).totalRevenue) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(0)}%`
                      : '-'}
                  </span>
                </div>
              </div>
              {(kpi as any)?.profit?.changePercent && (
                <div className={styles.kpiChange}>
                  <FaArrowUp className={styles.kpiChangeIcon} />
                  <span>{Math.abs((kpi as any).profit.changePercent).toFixed(0)}%</span>
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
                    За выбранный период получена выручка {(stats as any).totalRevenue?.toLocaleString('ru-RU')} ₽ 
                    при прибыли {(stats as any).totalProfit?.toLocaleString('ru-RU')} ₽.
                  </p>
                  {(stats as any).growthRate !== undefined && (stats as any).growthRate !== 0 && (
                    <p>
                      Рост продаж составил {(stats as any).growthRate > 0 ? '+' : ''}{(stats as any).growthRate.toFixed(1)}% 
                      по сравнению с предыдущим периодом.
                    </p>
                  )}
                  {(stats as any).averageOrderValue > 0 && (
                    <p>
                      Средний чек: {(stats as any).averageOrderValue.toLocaleString('ru-RU')} ₽.
                    </p>
                  )}
                  {(stats as any).conversionRate > 0 && (
                    <p>
                      Конверсия: {((stats as any).conversionRate * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(1)}%.
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
                <button 
                  className={`${styles.toggleButton} ${metricsUnit === 'rub' ? styles.toggleButtonActive : ''}`}
                  onClick={() => setMetricsUnit('rub')}
                >
                  руб.
                </button>
                <button 
                  className={`${styles.toggleButton} ${metricsUnit === 'pieces' ? styles.toggleButtonActive : ''}`}
                  onClick={() => setMetricsUnit('pieces')}
                >
                  шт.
                </button>
              </div>
            </div>
            <div className={styles.metricsList}>
              {[
                { 
                  label: 'Выручка', 
                  valueRub: (stats as any)?.totalRevenue || 0,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.revenue?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Прибыль', 
                  valueRub: (stats as any)?.totalProfit || 0,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.profit?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Заказы', 
                  valueRub: (stats as any)?.totalRevenue || 0,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.orders?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Средний чек', 
                  valueRub: (stats as any)?.averageOrderValue || 0,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.averageOrderValue?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Конверсия', 
                  valueRub: (stats as any)?.conversionRate ? ((stats as any).conversionRate * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0,
                  valuePieces: (stats as any)?.conversionRate ? ((stats as any).conversionRate * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0,
                  change: (kpi as any)?.revenue?.changePercent || 0,
                  unit: '%',
                  canSwitch: false
                },
                { 
                  label: 'ROI', 
                  valueRub: (kpi as any)?.roi || ((stats as any)?.totalRevenue && (stats as any)?.totalProfit ? (((stats as any).totalProfit / ((stats as any).totalRevenue - (stats as any).totalProfit)) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0),
                  valuePieces: (kpi as any)?.roi || ((stats as any)?.totalRevenue && (stats as any)?.totalProfit ? (((stats as any).totalProfit / ((stats as any).totalRevenue - (stats as any).totalProfit)) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0),
                  change: (kpi as any)?.profit?.changePercent || 0,
                  unit: '%',
                  canSwitch: false
                },
                { 
                  label: 'Маржинальность', 
                  valueRub: (kpi as any)?.margin || ((stats as any)?.totalRevenue && (stats as any)?.totalProfit ? (((stats as any).totalProfit / (stats as any).totalRevenue) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0),
                  valuePieces: (kpi as any)?.margin || ((stats as any)?.totalRevenue && (stats as any)?.totalProfit ? (((stats as any).totalProfit / (stats as any).totalRevenue) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0),
                  change: (kpi as any)?.profit?.changePercent || 0,
                  unit: '%',
                  canSwitch: false
                },
                { 
                  label: 'Рост продаж', 
                  valueRub: (stats as any)?.growthRate ? ((stats as any).growthRate * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0,
                  valuePieces: (stats as any)?.growthRate ? ((stats as any).growthRate * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0,
                  change: (stats as any)?.growthRate ? ((stats as any).growthRate * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0,
                  unit: '%',
                  canSwitch: false
                },
              ].map((item, index) => {
                const displayValue = item.canSwitch 
                  ? (metricsUnit === 'rub' ? item.valueRub : item.valuePieces)
                  : item.valueRub;
                const displayUnit = item.unit || (metricsUnit === 'rub' ? '₽' : 'шт.');
                const isPercentage = item.unit === '%';
                
                return (
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
                      {displayValue.toLocaleString('ru-RU', { maximumFractionDigits: isPercentage ? 1 : 0 })} {displayUnit}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className={styles.metricsCard}>
            <div className={styles.metricsHeader}>
              <h3 className={styles.metricsTitle}>Финансы</h3>
              <div className={styles.metricsToggle}>
                <button 
                  className={`${styles.toggleButton} ${financeUnit === 'rub' ? styles.toggleButtonActive : ''}`}
                  onClick={() => setFinanceUnit('rub')}
                >
                  руб.
                </button>
                <button 
                  className={`${styles.toggleButton} ${financeUnit === 'pieces' ? styles.toggleButtonActive : ''}`}
                  onClick={() => setFinanceUnit('pieces')}
                >
                  шт.
                </button>
              </div>
            </div>
            <div className={styles.metricsList}>
              {[
                { 
                  label: 'Выручка', 
                  valueRub: (stats as any)?.totalRevenue || 0,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.revenue?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Себестоимость', 
                  valueRub: (stats as any)?.totalRevenue && (stats as any)?.totalProfit 
                    ? ((stats as any).totalRevenue - (stats as any).totalProfit) 
                    : ((stats as any)?.totalRevenue || 0) * 0.6,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.profit?.changePercent ? -(kpi as any).profit.changePercent : 0,
                  canSwitch: true
                },
                { 
                  label: 'Валовая прибыль', 
                  valueRub: (stats as any)?.totalProfit || 0,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.profit?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Маржинальность', 
                  valueRub: (kpi as any)?.margin || ((stats as any)?.totalRevenue && (stats as any)?.totalProfit ? (((stats as any).totalProfit / (stats as any).totalRevenue) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0),
                  valuePieces: (kpi as any)?.margin || ((stats as any)?.totalRevenue && (stats as any)?.totalProfit ? (((stats as any).totalProfit / (stats as any).totalRevenue) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0),
                  change: (kpi as any)?.profit?.changePercent || 0,
                  unit: '%',
                  canSwitch: false
                },
                { 
                  label: 'ROI', 
                  valueRub: (kpi as any)?.roi || ((stats as any)?.totalRevenue && (stats as any)?.totalProfit ? (((stats as any).totalProfit / ((stats as any).totalRevenue - (stats as any).totalProfit)) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0),
                  valuePieces: (kpi as any)?.roi || ((stats as any)?.totalRevenue && (stats as any)?.totalProfit ? (((stats as any).totalProfit / ((stats as any).totalRevenue - (stats as any).totalProfit)) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0),
                  change: (kpi as any)?.profit?.changePercent || 0,
                  unit: '%',
                  canSwitch: false
                },
                { 
                  label: 'Налоги', 
                  valueRub: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.TAX_RATE,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.revenue?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Комиссии', 
                  valueRub: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.MARKETPLACE_COMMISSION,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.revenue?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Логистика', 
                  valueRub: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.LOGISTICS_RATE,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.revenue?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Реклама', 
                  valueRub: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.ADVERTISING_RATE,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.revenue?.changePercent || 0,
                  canSwitch: true
                },
                { 
                  label: 'Чистая прибыль', 
                  valueRub: (stats as any)?.totalProfit ? ((stats as any).totalProfit * 0.7) : 0,
                  valuePieces: (stats as any)?.totalSales || 0,
                  change: (kpi as any)?.profit?.changePercent || 0,
                  canSwitch: true
                },
              ].map((item, index) => {
                const displayValue = item.canSwitch 
                  ? (financeUnit === 'rub' ? item.valueRub : item.valuePieces)
                  : item.valueRub;
                const displayUnit = item.unit || (financeUnit === 'rub' ? '₽' : 'шт.');
                const isPercentage = item.unit === '%';
                
                return (
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
                      {displayValue.toLocaleString('ru-RU', { maximumFractionDigits: isPercentage ? 1 : 0 })} {displayUnit}
                    </span>
                  </div>
                );
              })}
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
                { label: 'Комиссии маркетплейсов', value: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.MARKETPLACE_COMMISSION, change: 12 },
                { label: 'Логистика', value: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.LOGISTICS_RATE, change: 12 },
                { label: 'Реклама', value: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.ADVERTISING_RATE, change: 12 },
                { label: 'Хранение', value: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.STORAGE_RATE, change: 12 },
                { label: 'Возвраты', value: ((stats as any)?.totalRevenue || 0) * CALCULATION_CONSTANTS.RETURNS_RATE, change: 12 },
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
                  {((abcAnalysis as any).groupA?.revenue || 0).toLocaleString('ru-RU')} ₽
                </div>
                <div className={styles.abcGroupQuantity}>
                  {((abcAnalysis as any).groupA?.quantity || 0).toLocaleString('ru-RU')} шт.
                </div>
                {(abcAnalysis as any).groupA?.count > 0 && (
                  <div className={styles.abcGroupChange}>
                    <FaArrowUp className={styles.abcChangeIcon} />
                    <span>{((abcAnalysis as any).categoryA || 0)} товаров</span>
                  </div>
                )}
              </div>
              <div className={styles.abcDivider}></div>
              <div className={styles.abcGroup}>
                <h4 className={styles.abcGroupTitle}>Группа В</h4>
                <div className={styles.abcGroupValue}>
                  {((abcAnalysis as any).groupB?.revenue || 0).toLocaleString('ru-RU')} ₽
                </div>
                <div className={styles.abcGroupQuantity}>
                  {((abcAnalysis as any).groupB?.quantity || 0).toLocaleString('ru-RU')} шт.
                </div>
                {(abcAnalysis as any).groupB?.count > 0 && (
                  <div className={styles.abcGroupChange}>
                    <FaArrowUp className={styles.abcChangeIcon} />
                    <span>{((abcAnalysis as any).categoryB || 0)} товаров</span>
                  </div>
                )}
              </div>
              <div className={styles.abcDivider}></div>
              <div className={styles.abcGroup}>
                <h4 className={styles.abcGroupTitle}>Группа С</h4>
                <div className={styles.abcGroupValue}>
                  {((abcAnalysis as any).groupC?.revenue || 0).toLocaleString('ru-RU')} ₽
                </div>
                <div className={styles.abcGroupQuantity}>
                  {((abcAnalysis as any).groupC?.quantity || 0).toLocaleString('ru-RU')} шт.
                </div>
                {(abcAnalysis as any).groupC?.count > 0 && (
                  <div className={styles.abcGroupChange}>
                    <FaArrowUp className={styles.abcChangeIcon} />
                    <span>{((abcAnalysis as any).categoryC || 0)} товаров</span>
                  </div>
                )}
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
              data={Array.isArray(regionalData) ? regionalData.slice(0, 5) : []}
              columns={[
                { key: 'region', header: 'Регион' },
                { key: 'ordersCount', header: 'Количество', render: (item: any) => `${item.ordersCount || 0} шт.` },
                { key: 'totalRevenue', header: 'Сумма', render: (item: any) => `${(item.totalRevenue || 0).toLocaleString('ru-RU')} ₽` },
                { key: 'share', header: 'Доля', render: (item: any) => `${((item.totalRevenue || 0) / ((stats as any)?.totalRevenue || 1) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(0)}%` },
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
              data={Array.isArray(regionalData) ? regionalData.slice(0, 5) : []}
              columns={[
                { key: 'region', header: 'Регион' },
                { key: 'total', header: 'Всего', render: (item: any) => `${item.ordersCount || 0} шт. ${((item.totalRevenue || 0) / ((stats as any)?.totalRevenue || 1) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(2)}%` },
                { key: 'totalShare', header: 'Общая доля', render: (item: any) => `${((item.totalRevenue || 0) / ((stats as any)?.totalRevenue || 1) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(0)}%` },
                { key: 'byWarehouse', header: 'По складу', render: (item: any) => `${((item.totalRevenue || 0) / ((stats as any)?.totalRevenue || 1) * CALCULATION_CONSTANTS.PERCENTAGE_MULTIPLIER).toFixed(0)}%` },
              ]}
              emptyMessage="Нет данных"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

