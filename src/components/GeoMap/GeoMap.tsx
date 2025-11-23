import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../services/api.client';
import { GeoMapSVG } from './GeoMapSVG';
import { RegionModal } from './RegionModal';
import { GeoMapFilters } from './GeoMapFilters';
import styles from './GeoMap.module.scss';

export interface RegionalStats {
  region: string;
  regionCode?: string;
  ordersCount: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  productsSold: number;
  growthRate?: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface GeoMapProps {
  organizationId?: string | null;
  onRegionClick?: (region: string) => void;
}

export const GeoMap: React.FC<GeoMapProps> = ({
  organizationId,
  onRegionClick,
}) => {
  const [stats, setStats] = useState<RegionalStats[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    metric: 'revenue' as 'revenue' | 'orders' | 'profit' | 'growth',
  });

  useEffect(() => {
    loadRegionalStats();
  }, [organizationId, filters]);

  const loadRegionalStats = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(organizationId ? { organizationId } : {}),
      };

      const response = await apiClient.instance.get('/geo/regions', { params });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load regional stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    setIsModalOpen(true);
    if (onRegionClick) {
      onRegionClick(region);
    }
  };

  const handleRegionHover = (region: string | null) => {
    setHoveredRegion(region);
  };

  const getRegionValue = (region: string): number => {
    const regionStats = stats.find((s) => s.region === region);
    if (!regionStats) return 0;

    switch (filters.metric) {
      case 'revenue':
        return regionStats.totalRevenue;
      case 'orders':
        return regionStats.ordersCount;
      case 'profit':
        return regionStats.totalProfit;
      case 'growth':
        return regionStats.growthRate || 0;
      default:
        return regionStats.totalRevenue;
    }
  };

  const getColorForValue = (value: number): string => {
    if (value === 0) return '#e5e7eb'; // Серый для нулевых значений

    const maxValue = Math.max(...stats.map((s) => getRegionValue(s.region)));
    if (maxValue === 0) return '#e5e7eb';

    const ratio = value / maxValue;

    // Цветовая градация от светлого к темному
    if (filters.metric === 'growth') {
      // Для роста: зеленый (положительный) / красный (отрицательный)
      if (value > 0) {
        const intensity = Math.min(ratio, 1);
        return `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`; // Зеленый
      } else {
        const intensity = Math.min(Math.abs(value) / Math.abs(maxValue), 1);
        return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`; // Красный
      }
    }

    // Для остальных метрик: синяя градация
    const intensity = Math.min(ratio, 1);
    return `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`;
  };

  const getTooltipContent = (region: string): string => {
    const regionStats = stats.find((s) => s.region === region);
    if (!regionStats) return region;

    const value = getRegionValue(region);
    const metricLabels = {
      revenue: 'Выручка',
      orders: 'Заказов',
      profit: 'Прибыль',
      growth: 'Рост',
    };

    const formattedValue =
      filters.metric === 'growth'
        ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
        : filters.metric === 'revenue' || filters.metric === 'profit'
        ? `${(value / 1000).toFixed(1)}k ₽`
        : value.toString();

    return `${region}\n${metricLabels[filters.metric]}: ${formattedValue}`;
  };

  return (
    <div className={styles.geoMap}>
      <GeoMapFilters
        filters={filters}
        onFiltersChange={setFilters}
        isLoading={isLoading}
      />

      <div className={styles.mapContainer}>
        {isLoading ? (
          <div className={styles.loading}>Загрузка данных...</div>
        ) : (
          <>
            <GeoMapSVG
              stats={stats}
              selectedRegion={selectedRegion}
              hoveredRegion={hoveredRegion}
              onRegionClick={handleRegionClick}
              onRegionHover={handleRegionHover}
              getRegionValue={getRegionValue}
              getColorForValue={getColorForValue}
            />

            {hoveredRegion && (
              <div
                className={styles.tooltip}
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                }}
              >
                {getTooltipContent(hoveredRegion)
                  .split('\n')
                  .map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && selectedRegion && (
        <RegionModal
          region={selectedRegion}
          stats={stats.find((s) => s.region === selectedRegion)}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRegion(null);
          }}
          organizationId={organizationId}
        />
      )}
    </div>
  );
};

