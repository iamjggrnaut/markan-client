// Константы для периодов времени
export const PERIOD_DAYS = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
} as const;

export type PeriodType = keyof typeof PERIOD_DAYS;

export const DEFAULT_PERIOD: PeriodType = 'month';

