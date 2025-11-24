// Константы для расчетов
export const CALCULATION_CONSTANTS = {
  // Процентные расчеты
  PERCENTAGE_MULTIPLIER: 100,
  
  // Дни в неделе для средних расчетов
  DAYS_IN_WEEK: 7,
  
  // Коэффициенты для расчетов
  DEFAULT_GROWTH_FACTOR: 0.1, // 10% для расчетов роста
  
  // Налоги и комиссии (в долях от выручки)
  TAX_RATE: 0.06, // 6% налог
  MARKETPLACE_COMMISSION: 0.1, // 10% комиссия маркетплейса
  LOGISTICS_RATE: 0.05, // 5% логистика
  ADVERTISING_RATE: 0.08, // 8% реклама
  STORAGE_RATE: 0.02, // 2% хранение
  RETURNS_RATE: 0.03, // 3% возвраты
} as const;

