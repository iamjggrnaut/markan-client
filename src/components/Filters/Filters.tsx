import { useState } from 'react';
import styles from './Filters.module.scss';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FiltersProps {
  period?: FilterOption[];
  source?: FilterOption[];
  onPeriodChange?: (value: string) => void;
  onSourceChange?: (value: string) => void;
  onRegionChange?: (value: string) => void;
  selectedPeriod?: string;
  selectedSource?: string;
  selectedRegion?: string;
  showRegions?: boolean;
  regions?: FilterOption[];
}

export const Filters = ({
  period = [
    { value: 'week', label: 'Последняя неделя' },
    { value: 'month', label: 'Последний месяц' },
    { value: 'quarter', label: 'Квартал' },
    { value: 'year', label: 'Год' },
  ],
  source = [
    { value: 'marketplace', label: 'Маркетплейс' },
    { value: 'store', label: 'Магазин' },
    { value: 'brand', label: 'Бренд' },
  ],
  onPeriodChange,
  onSourceChange,
  onRegionChange,
  selectedPeriod = 'week',
  selectedSource = 'marketplace',
  selectedRegion,
  showRegions = false,
  regions = [],
}: FiltersProps) => {
  const [activeFilters, setActiveFilters] = useState({
    period: selectedPeriod,
    source: selectedSource,
    region: selectedRegion || '',
  });

  const handleFilterClick = (type: 'period' | 'source' | 'region', value: string) => {
    setActiveFilters((prev) => ({ ...prev, [type]: value }));
    
    if (type === 'period' && onPeriodChange) {
      onPeriodChange(value);
    } else if (type === 'source' && onSourceChange) {
      onSourceChange(value);
    } else if (type === 'region' && onRegionChange) {
      onRegionChange(value);
    }
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        {period.map((option) => (
          <button
            key={option.value}
            className={`${styles.filterButton} ${
              activeFilters.period === option.value ? styles.active : ''
            }`}
            onClick={() => handleFilterClick('period', option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.filterGroup}>
        {source.map((option) => (
          <button
            key={option.value}
            className={`${styles.filterButton} ${
              activeFilters.source === option.value ? styles.active : ''
            }`}
            onClick={() => handleFilterClick('source', option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showRegions && (
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterButton} ${
              activeFilters.region === '' ? styles.active : ''
            }`}
            onClick={() => handleFilterClick('region', '')}
          >
            По регионам
          </button>
          {regions.map((region) => (
            <button
              key={region.value}
              className={`${styles.filterButton} ${
                activeFilters.region === region.value ? styles.active : ''
              }`}
              onClick={() => handleFilterClick('region', region.value)}
            >
              {region.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

