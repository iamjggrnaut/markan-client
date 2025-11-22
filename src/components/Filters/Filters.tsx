import { useState, useEffect } from 'react';
import { Select } from '../Form';
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
  onMarketplaceChange?: (value: string) => void;
  selectedPeriod?: string;
  selectedSource?: string;
  selectedRegion?: string;
  selectedMarketplace?: string;
  showRegions?: boolean;
  showMarketplace?: boolean;
  regions?: FilterOption[];
  marketplaceOptions?: FilterOption[];
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
  onMarketplaceChange,
  selectedPeriod = 'week',
  selectedSource = 'marketplace',
  selectedRegion,
  selectedMarketplace,
  showRegions = false,
  showMarketplace = false,
  regions = [],
  marketplaceOptions = [
    { value: '', label: 'Все маркетплейсы' },
    { value: 'wildberries', label: 'Wildberries' },
    { value: 'ozon', label: 'Ozon' },
    { value: 'yandex-market', label: 'Яндекс.Маркет' },
  ],
}: FiltersProps) => {
  const [activeFilters, setActiveFilters] = useState({
    period: selectedPeriod,
    source: selectedSource,
    region: selectedRegion || '',
    marketplace: selectedMarketplace || '',
  });

  useEffect(() => {
    setActiveFilters({
      period: selectedPeriod,
      source: selectedSource,
      region: selectedRegion || '',
      marketplace: selectedMarketplace || '',
    });
  }, [selectedPeriod, selectedSource, selectedRegion, selectedMarketplace]);

  const handlePeriodChange = (value: string) => {
    setActiveFilters((prev) => ({ ...prev, period: value }));
    if (onPeriodChange) {
      onPeriodChange(value);
    }
  };

  const handleSourceChange = (value: string) => {
    setActiveFilters((prev) => ({ ...prev, source: value }));
    if (onSourceChange) {
      onSourceChange(value);
    }
  };

  const handleRegionChange = (value: string) => {
    setActiveFilters((prev) => ({ ...prev, region: value }));
    if (onRegionChange) {
      onRegionChange(value);
    }
  };

  const handleMarketplaceChange = (value: string) => {
    setActiveFilters((prev) => ({ ...prev, marketplace: value }));
    if (onMarketplaceChange) {
      onMarketplaceChange(value);
    }
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <Select
          options={period}
          value={activeFilters.period}
          onChange={(e) => handlePeriodChange(e.target.value)}
          className={styles.filterSelect}
          style={{ margin: 0 }}
        />
      </div>

      <div className={styles.filterGroup}>
        <Select
          options={source}
          value={activeFilters.source}
          onChange={(e) => handleSourceChange(e.target.value)}
          className={styles.filterSelect}
          style={{ margin: 0 }}
        />
      </div>

      {showRegions && (
        <div className={styles.filterGroup}>
          <Select
            options={[
              { value: '', label: 'По регионам' },
              ...regions,
            ]}
            value={activeFilters.region}
            onChange={(e) => handleRegionChange(e.target.value)}
            className={styles.filterSelect}
            style={{ margin: 0 }}
          />
        </div>
      )}

      {showMarketplace && (
        <div className={styles.filterGroup}>
          <Select
            options={marketplaceOptions}
            value={activeFilters.marketplace}
            onChange={(e) => handleMarketplaceChange(e.target.value)}
            className={styles.filterSelect}
            style={{ margin: 0 }}
          />
        </div>
      )}
    </div>
  );
};

