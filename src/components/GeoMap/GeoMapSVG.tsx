import React from 'react';
import { RegionalStats } from './GeoMap';

interface GeoMapSVGProps {
  stats: RegionalStats[];
  selectedRegion: string | null;
  hoveredRegion: string | null;
  onRegionClick: (region: string) => void;
  onRegionHover: (region: string | null) => void;
  getRegionValue: (region: string) => number;
  getColorForValue: (value: number) => string;
}

// Упрощенная SVG карта России с основными регионами
// В реальном проекте лучше использовать готовую библиотеку или более детальную карту
export const GeoMapSVG: React.FC<GeoMapSVGProps> = ({
  stats,
  selectedRegion,
  hoveredRegion,
  onRegionClick,
  onRegionHover,
  getRegionValue,
  getColorForValue,
}) => {
  // Маппинг регионов на координаты (упрощенный)
  const regionPaths: Record<string, string> = {
    'Москва': 'M 200 150 L 220 150 L 220 170 L 200 170 Z',
    'Московская область': 'M 180 140 L 240 140 L 240 180 L 180 180 Z',
    'Санкт-Петербург': 'M 150 80 L 170 80 L 170 100 L 150 100 Z',
    'Ленинградская область': 'M 130 70 L 190 70 L 190 110 L 130 110 Z',
    'Краснодарский край': 'M 180 280 L 220 280 L 220 300 L 180 300 Z',
    'Ростовская область': 'M 200 260 L 230 260 L 230 280 L 200 280 Z',
    'Нижегородская область': 'M 220 160 L 250 160 L 250 180 L 220 180 Z',
    'Самарская область': 'M 240 200 L 270 200 L 270 220 L 240 220 Z',
    'Республика Татарстан': 'M 230 170 L 260 170 L 260 190 L 230 190 Z',
    'Свердловская область': 'M 280 140 L 310 140 L 310 160 L 280 160 Z',
    'Челябинская область': 'M 290 180 L 320 180 L 320 200 L 290 200 Z',
    'Новосибирская область': 'M 350 160 L 380 160 L 380 180 L 350 180 Z',
    'Красноярский край': 'M 400 140 L 430 140 L 430 160 L 400 160 Z',
    'Приморский край': 'M 500 200 L 530 200 L 530 220 L 500 220 Z',
    'Хабаровский край': 'M 480 180 L 510 180 L 510 200 L 480 200 Z',
  };

  const handleRegionClick = (region: string) => {
    const regionStats = stats.find((s) => s.region === region);
    if (regionStats || getRegionValue(region) > 0) {
      onRegionClick(region);
    }
  };

  const handleRegionHover = (region: string | null) => {
    onRegionHover(region);
  };

  return (
    <svg
      viewBox="0 0 600 400"
      className="geo-map-svg"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Фон карты */}
      <rect width="600" height="400" fill="#f8f9fa" />

      {/* Регионы */}
      {Object.entries(regionPaths).map(([region, path]) => {
        const value = getRegionValue(region);
        const color = getColorForValue(value);
        const isSelected = selectedRegion === region;
        const isHovered = hoveredRegion === region;
        const hasData = stats.some((s) => s.region === region);

        return (
          <g key={region}>
            <path
              d={path}
              fill={color}
              stroke={
                isSelected
                  ? '#3b82f6'
                  : isHovered
                  ? '#60a5fa'
                  : '#e5e7eb'
              }
              strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
              opacity={hasData ? 1 : 0.3}
              cursor={hasData ? 'pointer' : 'default'}
              onClick={() => handleRegionClick(region)}
              onMouseEnter={() => handleRegionHover(region)}
              onMouseLeave={() => handleRegionHover(null)}
              style={{
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'center',
              }}
            />
            {/* Название региона (для крупных регионов) */}
            {hasData && value > 0 && (
              <text
                x={path.match(/M (\d+) (\d+)/)?.[1] || 0}
                y={(parseInt(path.match(/M \d+ (\d+)/)?.[1] || '0') || 0) + 10}
                fontSize="10"
                fill="#1a1a1a"
                pointerEvents="none"
                textAnchor="middle"
              >
                {region.length > 15 ? region.substring(0, 12) + '...' : region}
              </text>
            )}
          </g>
        );
      })}

      {/* Легенда */}
      <g transform="translate(20, 20)">
        <rect
          x="0"
          y="0"
          width="150"
          height="100"
          fill="white"
          stroke="#e5e7eb"
          rx="4"
          opacity="0.9"
        />
        <text x="75" y="15" fontSize="12" fontWeight="bold" textAnchor="middle">
          Легенда
        </text>
        <text x="10" y="35" fontSize="10">
          Высокое значение
        </text>
        <rect x="10" y="40" width="20" height="10" fill="rgba(59, 130, 246, 1)" />
        <text x="10" y="65" fontSize="10">
          Среднее значение
        </text>
        <rect x="10" y="70" width="20" height="10" fill="rgba(59, 130, 246, 0.5)" />
        <text x="10" y="95" fontSize="10">
          Нет данных
        </text>
        <rect x="10" y="100" width="20" height="10" fill="#e5e7eb" />
      </g>
    </svg>
  );
};

