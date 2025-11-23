import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../components/Table';
import { Card } from '../components/Card';
import { Button } from '../components/Form';
import { LineChart } from '../components/Chart';
import { Modal } from '../components/Modal';
import { apiClient } from '../services/api.client';
import styles from './CompetitorsPage.module.scss';

export const CompetitorsPage = () => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: competitors, isLoading } = useQuery({
    queryKey: ['competitors'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/competitors');
      return response.data as any[];
    },
  });

  // Получаем аналитику по конкурентам вместо сравнения цен (которое требует productId)
  const { data: competitorAnalytics } = useQuery({
    queryKey: ['competitor-analytics', selectedCompetitor?.id],
    queryFn: async () => {
      if (!selectedCompetitor) return null;
      const response = await apiClient.instance.get('/competitors/analytics', {
        params: { competitorId: selectedCompetitor.id },
      });
      return response.data as any;
    },
    enabled: !!selectedCompetitor,
  });

  // Получаем отслеживаемые товары конкурента
  const { data: competitorProducts } = useQuery({
    queryKey: ['competitor-products', selectedCompetitor?.id],
    queryFn: async () => {
      if (!selectedCompetitor) return null;
      const response = await apiClient.instance.get(
        `/competitors/${selectedCompetitor.id}/products`,
      );
      return response.data as any[];
    },
    enabled: !!selectedCompetitor,
  });

  const columns = [
    {
      key: 'name',
      header: 'Название',
    },
    {
      key: 'marketplace',
      header: 'Маркетплейс',
    },
    {
      key: 'productsTracked',
      header: 'Товаров отслеживается',
      render: (item: any) => item.productsTracked || 0,
    },
    {
      key: 'avgRating',
      header: 'Средний рейтинг',
      render: (item: any) => item.avgRating?.toFixed(2) || '-',
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSelectedCompetitor(item);
            setIsModalOpen(true);
          }}
        >
          Анализ
        </Button>
      ),
    },
  ];

  // Формируем данные для графика на основе аналитики
  const priceChartData = competitorAnalytics && (competitorAnalytics as any).priceTrend
    ? {
        labels: ((competitorAnalytics as any).priceTrend || []).map((item: any) => item.date),
        datasets: [
          {
            label: 'Средняя цена конкурента',
            data: ((competitorAnalytics as any).priceTrend || []).map((item: any) => item.avgPrice),
            borderColor: 'var(--color-error)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
          },
        ],
      }
    : null;

  return (
    <div className={styles.competitors}>
      <div className={styles.content}>
        <h1 className={styles.title}>Анализ конкурентов</h1>

        <Card title="Список конкурентов">
        <Table
          columns={columns}
          data={Array.isArray(competitors) ? competitors : []}
          loading={isLoading}
          emptyMessage="Конкуренты не найдены"
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCompetitor(null);
        }}
        title={`Анализ: ${selectedCompetitor?.name || ''}`}
        size="xl"
      >
        {selectedCompetitor && (
          <div className={styles.competitorDetails}>
            <div className={styles.info}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Маркетплейс:</span>
                <span>{selectedCompetitor.marketplace}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Товаров отслеживается:</span>
                <span>{selectedCompetitor.productsTracked || 0}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Средний рейтинг:</span>
                <span>{selectedCompetitor.avgRating?.toFixed(2) || '-'}</span>
              </div>
            </div>

            {competitorProducts && Array.isArray(competitorProducts) && competitorProducts.length > 0 && (
              <div className={styles.products}>
                <h3>Отслеживаемые товары ({competitorProducts.length})</h3>
                <Table
                  columns={[
                    { key: 'name', header: 'Название' },
                    { key: 'price', header: 'Цена', render: (item: any) => `${(item.price || 0).toLocaleString('ru-RU')} ₽` },
                    { key: 'rating', header: 'Рейтинг', render: (item: any) => item.rating?.toFixed(2) || '-' },
                  ]}
                  data={competitorProducts.slice(0, 10)}
                  emptyMessage="Товары не найдены"
                />
              </div>
            )}

            {priceChartData && (
              <div className={styles.chart}>
                <h3>Динамика цен</h3>
                <LineChart data={priceChartData} height={300} />
              </div>
            )}

            {competitorAnalytics && (
              <div className={styles.analytics}>
                <h3>Аналитика</h3>
                <div className={styles.analyticsGrid}>
                  <div className={styles.analyticsItem}>
                    <span className={styles.analyticsLabel}>Средняя цена:</span>
                    <span className={styles.analyticsValue}>
                      {(competitorAnalytics as any)?.avgPrice?.toLocaleString('ru-RU') || '-'} ₽
                    </span>
                  </div>
                  <div className={styles.analyticsItem}>
                    <span className={styles.analyticsLabel}>Товаров отслеживается:</span>
                    <span className={styles.analyticsValue}>
                      {(competitorAnalytics as any)?.productsCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
};

