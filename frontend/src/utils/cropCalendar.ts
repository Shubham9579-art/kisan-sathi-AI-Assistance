import { FieldItem, Language } from '../types';

const DAYS_BETWEEN_CHECKS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const parseLocalDate = (value?: string): Date | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : null;
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDayNumber = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;

export interface CropCheckReminder {
  dueDate: Date;
  daysUntilDue: number;
  focus: 'vegetative' | 'flowering' | 'fruiting' | 'maturity' | 'general';
}

export const formatCropCalendarDate = (date: Date, language: Language): string => {
  const locale = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

const getGrowthFocus = (growthStage: string): CropCheckReminder['focus'] => {
  const stage = growthStage.toLowerCase();
  if (stage.includes('flower')) return 'flowering';
  if (stage.includes('fruit') || stage.includes('pod') || stage.includes('boll')) return 'fruiting';
  if (stage.includes('matur') || stage.includes('harvest')) return 'maturity';
  if (stage.includes('vegetative') || stage.includes('seedling') || stage.includes('tiller')) {
    return 'vegetative';
  }
  return 'general';
};

export const getCropCheckReminder = (
  field: FieldItem,
  today = startOfDay(new Date()),
): CropCheckReminder => {
  const todayStart = startOfDay(today);
  const latestObservationDate = (field.observations ?? [])
    .map((observation) => parseLocalDate(observation.date))
    .filter((date): date is Date => date !== null && date <= todayStart)
    .sort((left, right) => right.getTime() - left.getTime())[0];
  const plantingDate = parseLocalDate(field.planting_date);
  const referenceDate = latestObservationDate ?? plantingDate;
  const dueDate = referenceDate
    ? new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + DAYS_BETWEEN_CHECKS)
    : todayStart;
  const nextDueDate = dueDate < todayStart ? todayStart : dueDate;

  return {
    dueDate: nextDueDate,
    daysUntilDue: toDayNumber(nextDueDate) - toDayNumber(todayStart),
    focus: getGrowthFocus(field.growth_stage),
  };
};
