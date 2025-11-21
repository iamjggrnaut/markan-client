import React from 'react';
import { RegionalStats } from './GeoMap';
import { RussiaMapSVG } from './RussiaMapSVG';

interface GeoMapSVGProps {
  stats: RegionalStats[];
  selectedRegion: string | null;
  hoveredRegion: string | null;
  onRegionClick: (region: string) => void;
  onRegionHover: (region: string | null) => void;
  getRegionValue: (region: string) => number;
  getColorForValue: (value: number) => string;
}

// Используем реалистичную карту России
export const GeoMapSVG: React.FC<GeoMapSVGProps> = ({
  stats,
  selectedRegion,
  hoveredRegion,
  onRegionClick,
  onRegionHover,
  getRegionValue,
  getColorForValue,
}) => {
  return (
    <RussiaMapSVG
      stats={stats}
      selectedRegion={selectedRegion}
      hoveredRegion={hoveredRegion}
      onRegionClick={onRegionClick}
      onRegionHover={onRegionHover}
      getRegionValue={getRegionValue}
      getColorForValue={getColorForValue}
    />
  );
};

