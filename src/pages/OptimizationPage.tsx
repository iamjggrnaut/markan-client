import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Filters } from '../components/Filters';
import { Select } from '../components/Form';
import { apiClient } from '../services/api.client';
import { FaBolt, FaChartLine, FaBox, FaExclamationTriangle } from 'react-icons/fa';
import styles from './OptimizationPage.module.scss';

export const OptimizationPage = () => {
  const [period, setPeriod] = useState('month');
  const [source, setSource] = useState('marketplace');
  const [marketplace, setMarketplace] = useState<string>('');

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['optimization-recommendations', period],
    queryFn: async () => {
      // Получаем рекомендации по оптимизации
      const [products, analytics] = await Promise.all([
        apiClient.instance.get('/products/reorder-recommendations').catch(() => ({ data: [] })),
        apiClient.instance.get('/analytics/dashboard', {
          params: { period: period === 'week' ? '7d' : period === 'month' ? '30d' : '90d' },
        }).catch(() => ({ data: {} })),
      ]);

      return {
        lowStock: Array.isArray(products.data) ? products.data.slice(0, 5) : [],
        topProducts: analytics.data?.topProducts || [],
        salesTrend: analytics.data?.salesByPeriod || [],
      };
    },
  });

  const optimizationItems = [
    {
      icon: <FaBox />,
      title: 'Низкие остатки',
      description: 'Товары, требующие дозаказа',
      count: recommendations?.lowStock?.length || 0,
      color: 'var(--color-warning)',
    },
    {
      icon: <FaChartLine />,
      title: 'Рост продаж',
      description: 'Товары с положительной динамикой',
      count: recommendations?.topProducts?.filter((p: any) => p.growth > 0)?.length || 0,
      color: 'var(--color-success)',
    },
    {
      icon: <FaExclamationTriangle />,
      title: 'Требуют внимания',
      description: 'Товары с падением продаж',
      count: recommendations?.topProducts?.filter((p: any) => p.growth < 0)?.length || 0,
      color: 'var(--color-error)',
    },
  ];

  return (
    <div className={styles.optimization}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <FaBolt className={styles.headerIcon} />
          <h1 className={styles.title}>Оптимизация</h1>
        </div>
        <p className={styles.subtitle}>
          Рекомендации по улучшению эффективности продаж и управления запасами
        </p>
      </div>

      <Filters
        selectedPeriod={period}
        selectedSource={source}
        onPeriodChange={setPeriod}
        onSourceChange={setSource}
      />
      
      <div className={styles.marketplaceFilter}>
        <Select
          options={[
            { value: '', label: 'Все маркетплейсы' },
            { value: 'wildberries', label: 'Wildberries' },
            { value: 'ozon', label: 'Ozon' },
            { value: 'yandex-market', label: 'Яндекс.Маркет' },
          ]}
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
          style={{ width: '200px' }}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.cardsGrid}>
          {optimizationItems.map((item, index) => (
            <Card key={index} className={styles.optimizationCard}>
              <div className={styles.cardIcon} style={{ color: item.color }}>
                {item.icon}
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
              <div className={styles.cardCount}>{item.count}</div>
            </Card>
          ))}
        </div>

        {recommendations?.lowStock && recommendations.lowStock.length > 0 && (
          <Card className={styles.recommendationsCard}>
            <h2 className={styles.sectionTitle}>Рекомендации по дозаказу</h2>
            <div className={styles.recommendationsList}>
              {recommendations.lowStock.map((item: any, index: number) => (
                <div key={index} className={styles.recommendationItem}>
                  <div className={styles.recommendationInfo}>
                    <span className={styles.recommendationName}>
                      {item.product?.name || item.name || 'Неизвестный товар'}
                    </span>
                    <span className={styles.recommendationDetails}>
                      Остаток: {item.currentStock || 0} шт. • 
                      Дней до исчерпания: {item.forecastDepletionDays || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {recommendations?.topProducts && recommendations.topProducts.length > 0 && (
          <Card className={styles.trendsCard}>
            <h2 className={styles.sectionTitle}>Тренды продаж</h2>
            <div className={styles.trendsList}>
              {recommendations.topProducts.slice(0, 10).map((product: any, index: number) => (
                <div key={index} className={styles.trendItem}>
                  <span className={styles.trendName}>{product.name || 'Неизвестный товар'}</span>
                  <div className={styles.trendMetrics}>
                    <span className={styles.trendValue}>
                      {product.revenue?.toLocaleString('ru-RU') || 0} ₽
                    </span>
                    {product.growth !== undefined && (
                      <span
                        className={`${styles.trendGrowth} ${
                          product.growth >= 0 ? styles.positive : styles.negative
                        }`}
                      >
                        {product.growth >= 0 ? '+' : ''}
                        {product.growth.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {isLoading && (
          <div className={styles.loading}>Загрузка рекомендаций...</div>
        )}

        {!isLoading && (!recommendations || (recommendations.lowStock?.length === 0 && recommendations.topProducts?.length === 0)) && (
          <Card className={styles.emptyCard}>
            <p>Нет доступных рекомендаций по оптимизации</p>
          </Card>
        )}
      </div>
    </div>
  );
};

