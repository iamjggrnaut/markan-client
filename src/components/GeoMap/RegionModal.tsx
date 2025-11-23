import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../services/api.client';
import { RegionalStats } from './GeoMap';
import styles from './RegionModal.module.scss';

interface RegionModalProps {
  region: string;
  stats: RegionalStats | undefined;
  onClose: () => void;
  organizationId?: string | null;
}

export const RegionModal: React.FC<RegionModalProps> = ({
  region,
  stats: initialStats,
  onClose,
  organizationId,
}) => {
  const [stats, setStats] = useState<RegionalStats | null>(initialStats || null);
  const [isLoading, setIsLoading] = useState(!initialStats);

  useEffect(() => {
    if (!initialStats) {
      loadRegionDetails();
    }
  }, [region]);

  const loadRegionDetails = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ...(organizationId ? { organizationId } : {}),
      };

      const response = await apiClient.instance.get(
        `/geo/regions/${encodeURIComponent(region)}`,
        { params }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load region details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Загрузка данных...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.error}>Данные по региону не найдены</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{region}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Заказов</div>
              <div className={styles.statValue}>{stats.ordersCount}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Выручка</div>
              <div className={styles.statValue}>
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(stats.totalRevenue)}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Прибыль</div>
              <div className={styles.statValue}>
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(stats.totalProfit)}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Средний чек</div>
              <div className={styles.statValue}>
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(stats.averageOrderValue)}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Товаров продано</div>
              <div className={styles.statValue}>{stats.productsSold}</div>
            </div>

            {stats.growthRate !== undefined && (
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Темп роста</div>
                <div
                  className={`${styles.statValue} ${
                    stats.growthRate > 0 ? styles.positive : styles.negative
                  }`}
                >
                  {stats.growthRate > 0 ? '+' : ''}
                  {stats.growthRate.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {stats.topProducts && stats.topProducts.length > 0 && (
            <div className={styles.topProducts}>
              <h3>Топ товаров в регионе</h3>
              <table className={styles.productsTable}>
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Количество</th>
                    <th>Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((product, index) => (
                    <tr key={product.productId || index}>
                      <td>{product.productName}</td>
                      <td>{product.quantity}</td>
                      <td>
                        {new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: 'RUB',
                          maximumFractionDigits: 0,
                        }).format(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

