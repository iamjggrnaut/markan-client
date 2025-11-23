import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button, Select } from '../components/Form';
import { apiClient } from '../services/api.client';
import { FaBrain, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { toast } from '../utils/toast';
import styles from './AIPage.module.scss';

export const AIPage = () => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Получаем все AI рекомендации
  const { data: recommendations, isLoading, isError: recommendationsError } = useQuery({
    queryKey: ['ai-recommendations', selectedType],
    queryFn: async () => {
      const response = await apiClient.instance.get('/ai/recommendations', {
        params: {
          ...(selectedType && { type: selectedType }),
          limit: 100,
        },
      });
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки AI рекомендаций');
    },
  });

  // Получаем список товаров для прогноза спроса
  const { data: products, isError: productsError } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/products', { params: { limit: 100 } });
      return Array.isArray(response.data) ? response.data : (response.data?.products || []);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки списка товаров');
    },
  });

  // Получаем прогноз спроса для выбранного товара
  const { data: demandForecast, isLoading: demandForecastLoading, isError: demandForecastError } = useQuery({
    queryKey: ['ai-demand-forecast', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const response = await apiClient.instance.get(`/ai/forecast/demand/${selectedProductId}`);
      return response.data;
    },
    enabled: !!selectedProductId,
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки прогноза спроса');
    },
  });

  // Получаем аномалии
  const { data: anomalies, isError: anomaliesError } = useQuery({
    queryKey: ['ai-anomalies'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/ai/anomalies');
      return response.data;
    },
    onError: (error: any) => {
      console.error('Ошибка загрузки аномалий:', error);
      // Не показываем toast, так как это не критично
    },
  });

  // Мутация для применения рекомендации
  const applyRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const response = await apiClient.instance.post(`/ai/recommendations/${recommendationId}/apply`);
      return response.data;
    },
    onSuccess: (data: any) => {
      // Используем сообщение от бэкенда, которое содержит информацию о ручном обновлении на маркетплейсах
      toast.success(data?.message || 'Рекомендация применена!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при применении рекомендации');
    },
  });

  const getRecommendationIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PRICE':
        return <FaInfoCircle className={styles.iconPrice} />;
      case 'STOCK':
        return <FaExclamationTriangle className={styles.iconStock} />;
      case 'ASSORTMENT':
        return <FaInfoCircle className={styles.iconAssortment} />;
      default:
        return <FaBrain className={styles.iconDefault} />;
    }
  };

  const getRecommendationTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PRICE':
        return 'Цена';
      case 'STOCK':
        return 'Остатки';
      case 'ASSORTMENT':
        return 'Ассортимент';
      default:
        return type || 'Неизвестно';
    }
  };

  const getRecommendationPriority = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return { label: 'Высокий', className: styles.priorityHigh };
      case 'MEDIUM':
        return { label: 'Средний', className: styles.priorityMedium };
      case 'LOW':
        return { label: 'Низкий', className: styles.priorityLow };
      default:
        return { label: 'Неизвестно', className: styles.priorityLow };
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Тип',
      render: (item: any) => (
        <div className={styles.typeCell}>
          {getRecommendationIcon(item.type)}
          <span>{getRecommendationTypeLabel(item.type)}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Рекомендация',
      render: (item: any) => (
        <div>
          <div className={styles.recommendationTitle}>{item.title || item.description}</div>
          {item.details && (
            <div className={styles.recommendationDetails}>{item.details}</div>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Приоритет',
      render: (item: any) => {
        const priority = getRecommendationPriority(item.priority);
        return (
          <span className={priority.className}>{priority.label}</span>
        );
      },
    },
    {
      key: 'impact',
      header: 'Потенциальный эффект',
      render: (item: any) => (
        <div className={styles.impactCell}>
          {item.impact && (
            <span className={styles.impactValue}>
              {typeof item.impact === 'number' 
                ? `+${item.impact.toFixed(1)}%`
                : item.impact}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Создано',
      render: (item: any) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString('ru-RU')
          : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => applyRecommendationMutation.mutate(item.id)}
          disabled={applyRecommendationMutation.isPending}
        >
          <FaCheckCircle /> Применить
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.ai}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <FaBrain className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>AI Рекомендации</h1>
              <p className={styles.subtitle}>
                Умные рекомендации для оптимизации продаж и управления запасами
              </p>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Все типы</option>
            <option value="PRICE">Цена</option>
            <option value="STOCK">Остатки</option>
            <option value="ASSORTMENT">Ассортимент</option>
          </select>
        </div>

        <Card title="Прогноз спроса" className={styles.forecastCard}>
          <div className={styles.forecastControls}>
            <label>Выберите товар для прогноза:</label>
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              options={[
                { value: '', label: 'Выберите товар' },
                ...(products?.map((p: any) => ({ value: p.id, label: p.name })) || []),
              ]}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
          </div>
          {demandForecastLoading && <p>Загрузка прогноза...</p>}
          {demandForecast && (
            <div className={styles.forecastResult}>
              <h3>Прогноз спроса на {demandForecast.days || 30} дней:</h3>
              <div className={styles.forecastMetrics}>
                <div className={styles.forecastMetric}>
                  <span className={styles.forecastLabel}>Ожидаемое количество продаж:</span>
                  <span className={styles.forecastValue}>{demandForecast.predictedSales || 0} шт.</span>
                </div>
                <div className={styles.forecastMetric}>
                  <span className={styles.forecastLabel}>Рекомендуемый запас:</span>
                  <span className={styles.forecastValue}>{demandForecast.recommendedStock || 0} шт.</span>
                </div>
                {demandForecast.confidence && (
                  <div className={styles.forecastMetric}>
                    <span className={styles.forecastLabel}>Уверенность прогноза:</span>
                    <span className={styles.forecastValue}>{(demandForecast.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {!selectedProductId && !demandForecastLoading && (
            <p className={styles.forecastPlaceholder}>Выберите товар для просмотра прогноза спроса.</p>
          )}
        </Card>

        {anomalies && anomalies.length > 0 && (
          <Card className={styles.anomaliesCard}>
            <h3 className={styles.anomaliesTitle}>
              <FaExclamationTriangle /> Обнаруженные аномалии
            </h3>
            <div className={styles.anomaliesList}>
              {anomalies.slice(0, 5).map((anomaly: any, index: number) => (
                <div key={index} className={styles.anomalyItem}>
                  <div className={styles.anomalyContent}>
                    <div className={styles.anomalyTitle}>{anomaly.description || 'Аномалия обнаружена'}</div>
                    <div className={styles.anomalyDetails}>
                      {anomaly.productName && `Товар: ${anomaly.productName}`}
                      {anomaly.date && ` • Дата: ${new Date(anomaly.date).toLocaleDateString('ru-RU')}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className={styles.recommendationsCard}>
          <h3 className={styles.recommendationsTitle}>Рекомендации</h3>
          <Table
            columns={columns}
            data={recommendations || []}
            loading={isLoading}
            emptyMessage="Рекомендации не найдены"
          />
        </Card>
      </div>
    </div>
  );
};

