import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GeoMap } from '../components/GeoMap';
import { Card } from '../components/Card';
import { Filters } from '../components/Filters';
import { Table } from '../components/Table';
import { apiClient } from '../services/api.client';
import { toast } from '../utils/toast';
import styles from './GeoPage.module.scss';

export const GeoPage = () => {
  const [period, setPeriod] = useState('week');
  const [source, setSource] = useState('marketplace');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Маппинг периодов для вычисления дат
  const periodDaysMap: Record<string, number> = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
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

  // Получаем региональную статистику
  const { data: regionalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['geo-regions', period, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await apiClient.instance.get('/geo/regions', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      return response.data as any;
    },
  });

  // Получаем сравнение регионов (для таблиц)
  const { data: regionalComparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['geo-regions-comparison', period, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await apiClient.instance.get('/geo/regions/comparison', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          sortBy: 'revenue',
        },
      });
      return response.data as any[];
    },
  });

  // Формируем данные для таблиц из API
  const ordersData = regionalComparison && Array.isArray(regionalComparison)
    ? regionalComparison.slice(0, 5).map((item: any) => ({
        region: item.region || 'Неизвестный регион',
        quantity: `${item.ordersCount || 0} шт.`,
        amount: `${(item.totalRevenue || 0).toLocaleString('ru-RU')} ₽`,
        share: `${((item.totalRevenue || 0) / ((regionalStats as any)?.totalRevenue || 1) * 100).toFixed(0)}%`,
      }))
    : [];

  const salesData = regionalComparison && Array.isArray(regionalComparison)
    ? regionalComparison.slice(0, 5).map((item: any) => ({
        region: item.region || 'Неизвестный регион',
        total: `${item.ordersCount || 0} шт. ${((item.totalRevenue || 0) / ((regionalStats as any)?.totalRevenue || 1) * 100).toFixed(2)}%`,
        totalShare: `${((item.totalRevenue || 0) / ((regionalStats as any)?.totalRevenue || 1) * 100).toFixed(0)}%`,
        byWarehouse: `${((item.totalRevenue || 0) / ((regionalStats as any)?.totalRevenue || 1) * 100).toFixed(0)}%`,
      }))
    : [];

  const ordersColumns = [
    { key: 'region', header: 'Регион' },
    { key: 'quantity', header: 'Количество' },
    { key: 'amount', header: 'Сумма' },
    { key: 'share', header: 'Доля' },
  ];

  const salesColumns = [
    { key: 'region', header: 'Регион' },
    { key: 'total', header: 'Всего' },
    { key: 'totalShare', header: 'Общая доля' },
    { key: 'byWarehouse', header: 'По складу' },
  ];

  return (
    <div className={styles.geo}>
      <Filters
        selectedPeriod={period}
        selectedSource={source}
        selectedRegion={selectedRegion}
        onPeriodChange={setPeriod}
        onSourceChange={setSource}
        onRegionChange={setSelectedRegion}
        showRegions={true}
        regions={[
          { value: 'russia', label: 'Российская Федерация' },
          { value: 'kaliningrad', label: 'Калининградская область' },
        ]}
      />

      <div className={styles.content}>
        <div className={styles.mapSection}>
          <Card className={styles.mapCard}>
            <GeoMap />
          </Card>
        </div>

        <div className={styles.tablesGrid}>
          <Card className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Заказы - ТОП-5 регионов</h3>
              <div className={styles.tableIcons}>
                <button className={styles.tableIcon} title="Гистограмма">
                  <span>📊</span>
                </button>
                <button className={styles.tableIcon} title="График">
                  <span>📈</span>
                </button>
                <button className={styles.tableIcon} title="Таблица">
                  <span>📋</span>
                </button>
              </div>
            </div>
            <Table 
              data={ordersData} 
              columns={ordersColumns} 
              loading={statsLoading || comparisonLoading}
              emptyMessage="Нет данных"
            />
          </Card>

          <Card className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Продажи - ТОП-5 регионов</h3>
              <div className={styles.tableIcons}>
                <button className={styles.tableIcon} title="Гистограмма">
                  <span>📊</span>
                </button>
                <button className={styles.tableIcon} title="График">
                  <span>📈</span>
                </button>
                <button className={styles.tableIcon} title="Таблица">
                  <span>📋</span>
                </button>
              </div>
            </div>
            <Table 
              data={salesData} 
              columns={salesColumns} 
              loading={statsLoading || comparisonLoading}
              emptyMessage="Нет данных"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

