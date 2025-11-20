import React from 'react';
import styles from './GeoMapFilters.module.scss';

interface GeoMapFiltersProps {
  filters: {
    startDate: Date;
    endDate: Date;
    metric: 'revenue' | 'orders' | 'profit' | 'growth';
  };
  onFiltersChange: (filters: {
    startDate: Date;
    endDate: Date;
    metric: 'revenue' | 'orders' | 'profit' | 'growth';
  }) => void;
  isLoading: boolean;
}

export const GeoMapFilters: React.FC<GeoMapFiltersProps> = ({
  filters,
  onFiltersChange,
  isLoading,
}) => {
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: new Date(value),
    });
  };

  const handleMetricChange = (
    metric: 'revenue' | 'orders' | 'profit' | 'growth',
  ) => {
    onFiltersChange({
      ...filters,
      metric,
    });
  };

  const setQuickPeriod = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    onFiltersChange({
      ...filters,
      startDate: start,
      endDate: end,
    });
  };

  return (
    <div className={styles.filters}>
      <div className={styles.dateFilters}>
        <label>
          Начало периода:
          <input
            type="date"
            value={filters.startDate.toISOString().split('T')[0]}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            disabled={isLoading}
          />
        </label>

        <label>
          Конец периода:
          <input
            type="date"
            value={filters.endDate.toISOString().split('T')[0]}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            disabled={isLoading}
          />
        </label>

        <div className={styles.quickPeriods}>
          <button
            onClick={() => setQuickPeriod(7)}
            disabled={isLoading}
            className={styles.quickButton}
          >
            7 дней
          </button>
          <button
            onClick={() => setQuickPeriod(30)}
            disabled={isLoading}
            className={styles.quickButton}
          >
            30 дней
          </button>
          <button
            onClick={() => setQuickPeriod(90)}
            disabled={isLoading}
            className={styles.quickButton}
          >
            90 дней
          </button>
        </div>
      </div>

      <div className={styles.metricFilters}>
        <label>Метрика:</label>
        <select
          value={filters.metric}
          onChange={(e) =>
            handleMetricChange(
              e.target.value as 'revenue' | 'orders' | 'profit' | 'growth',
            )
          }
          disabled={isLoading}
        >
          <option value="revenue">Выручка</option>
          <option value="orders">Заказы</option>
          <option value="profit">Прибыль</option>
          <option value="growth">Темп роста</option>
        </select>
      </div>
    </div>
  );
};

