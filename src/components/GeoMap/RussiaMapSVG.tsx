import React, { useEffect, useRef } from 'react';
import { RegionalStats } from './GeoMap';
import mapSvgUrl from '../../assets/map.svg?url';

interface RussiaMapSVGProps {
  stats: RegionalStats[];
  selectedRegion: string | null;
  hoveredRegion: string | null;
  onRegionClick: (region: string) => void;
  onRegionHover: (region: string | null) => void;
  getRegionValue: (region: string) => number;
  getColorForValue: (value: number) => string;
}

// Используем готовую SVG карту России из assets
export const RussiaMapSVG: React.FC<RussiaMapSVGProps> = ({
  stats,
  selectedRegion,
  hoveredRegion,
  onRegionClick,
  onRegionHover,
  getRegionValue,
  getColorForValue,
}) => {
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Загружаем SVG и добавляем интерактивность
    fetch(mapSvgUrl)
      .then((res) => res.text())
      .then((svgText) => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        // Устанавливаем стили для SVG
        svgElement.setAttribute('style', 'width: 100%; height: 100%; background: #000;');
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Обрабатываем все path элементы (регионы)
        const paths = svgElement.querySelectorAll('path');
        paths.forEach((path, index) => {
          // Добавляем обработчики событий
          path.addEventListener('click', () => {
            // Пытаемся определить регион по данным или индексу
            const regionName = `Регион ${index + 1}`;
            const regionStats = stats.find((s) => s.region === regionName);
            if (regionStats || getRegionValue(regionName) > 0) {
              onRegionClick(regionName);
            }
          });

          path.addEventListener('mouseenter', () => {
            const regionName = `Регион ${index + 1}`;
            onRegionHover(regionName);
          });

          path.addEventListener('mouseleave', () => {
            onRegionHover(null);
          });

          // Применяем цвета на основе данных
          const regionName = `Регион ${index + 1}`;
          const value = getRegionValue(regionName);
          const color = getColorForValue(value);
          const hasData = stats.some((s) => s.region === regionName);
          const isSelected = selectedRegion === regionName;
          const isHovered = hoveredRegion === regionName;

          if (hasData && value > 0) {
            path.setAttribute('fill', color);
            path.setAttribute('stroke', isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#3b82f6');
            path.setAttribute('stroke-width', isSelected ? '3' : isHovered ? '2' : '1.5');
            path.setAttribute('opacity', '1');
            path.setAttribute('style', 'cursor: pointer; transition: all 0.2s ease;');
          } else {
            path.setAttribute('fill', 'rgba(229, 231, 235, 0.3)');
            path.setAttribute('stroke', '#4ade80');
            path.setAttribute('stroke-width', '0.5');
            path.setAttribute('opacity', '0.5');
            path.setAttribute('style', 'cursor: default; transition: all 0.2s ease;');
          }
        });

        // Очищаем контейнер и добавляем SVG
        if (svgRef.current) {
          svgRef.current.innerHTML = '';
          svgRef.current.appendChild(svgElement);
        }
      })
      .catch((error) => {
        console.error('Failed to load map SVG:', error);
      });
  }, [stats, selectedRegion, hoveredRegion, getRegionValue, getColorForValue, onRegionClick, onRegionHover]);

  return (
    <div
      ref={svgRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        position: 'relative',
      }}
    >
      {/* Легенда */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Легенда</div>
        <div style={{ fontSize: '11px', marginBottom: '0.5rem' }}>
          Высокое значение
          <div
            style={{
              width: '25px',
              height: '12px',
              background: 'rgba(59, 130, 246, 1)',
              borderRadius: '2px',
              marginTop: '4px',
            }}
          />
        </div>
        <div style={{ fontSize: '11px', marginBottom: '0.5rem' }}>
          Среднее значение
          <div
            style={{
              width: '25px',
              height: '12px',
              background: 'rgba(59, 130, 246, 0.5)',
              borderRadius: '2px',
              marginTop: '4px',
            }}
          />
        </div>
        <div style={{ fontSize: '11px' }}>
          Нет данных
          <div
            style={{
              width: '25px',
              height: '12px',
              background: 'rgba(229, 231, 235, 0.3)',
              borderRadius: '2px',
              marginTop: '4px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

