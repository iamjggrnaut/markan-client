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
      return response.data;
    },
  });

  const { data: priceComparison } = useQuery({
    queryKey: ['price-comparison', selectedCompetitor?.id],
    queryFn: async () => {
      if (!selectedCompetitor) return null;
      const response = await apiClient.instance.get(
        `/competitors/${selectedCompetitor.id}/price-comparison`,
      );
      return response.data;
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

  const priceChartData = priceComparison
    ? {
        labels: priceComparison.comparison?.map((c: any) => c.productName) || [],
        datasets: [
          {
            label: 'Ваша цена',
            data:
              priceComparison.comparison?.map((c: any) => c.yourPrice) || [],
            borderColor: 'var(--color-accent)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
          {
            label: 'Цена конкурента',
            data:
              priceComparison.comparison?.map((c: any) => c.competitorPrice) ||
              [],
            borderColor: 'var(--color-error)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
          },
        ],
      }
    : null;

  return (
    <div className={styles.competitors}>
      <h1 className={styles.title}>Анализ конкурентов</h1>

      <Card title="Список конкурентов">
        <Table
          columns={columns}
          data={competitors || []}
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

            {priceChartData && (
              <div className={styles.chart}>
                <h3>Сравнение цен</h3>
                <LineChart data={priceChartData} height={300} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

