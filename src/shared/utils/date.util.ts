import { DateTime } from 'luxon';

import { APP_TIMEZONE } from '@shared/symbols/business.constants';

/**
 * Normalizes a YYYY-MM-DD string to a DateTime in Lima timezone,
 * at the start of the day (00:00:00), and returns a JS Date in UTC for the DB
 */
export const normalizeDayInLima = (yyyyMmDd: string): Date => {
  const dt = DateTime.fromISO(yyyyMmDd, { zone: APP_TIMEZONE }).startOf('day');
  return dt.toJSDate();
};

/**
 * Normalizes a YYYY-MM-DD string to the same date in Lima timezone
 * and returns it as YYYY-MM-DD (ISO date).
 */
export const normalizeDayInLimaISO = (yyyyMmDd: string): string => {
  const dt = DateTime.fromISO(yyyyMmDd, { zone: APP_TIMEZONE }).startOf('day');
  return dt.toISODate() as string;
};

/**
 * Normalizes a JS Date to Lima timezone and returns YYYY-MM-DD.
 */
export const normalizeDateInLimaISO = (date: Date): string => {
  const dt = DateTime.fromJSDate(date, { zone: APP_TIMEZONE }).startOf('day');
  return dt.toISODate() as string;
};

/**
 * Adds days to a date, maintaining Lima timezone
 */
export const addDays = (day: Date, days: number): Date => {
  const dt = DateTime.fromJSDate(day, { zone: APP_TIMEZONE }).plus({ days });
  return dt.toJSDate();
};

/**
 * Returns the day of the week in Lima (0=Sun, 1=Mon...6=Sat)
 */
export const dayOfWeekMonToSat = (day: Date): number => {
  const dt = DateTime.fromJSDate(day, { zone: APP_TIMEZONE });
  const dayOfWeek = dt.weekday % 7; // Luxon: 1=Mon...7=Sun → convert to 0=Sun...6=Sat
  return dayOfWeek; // 0=Sunday (closed), 1-6=Mon-Sat
};

/**
 * Returns the start of the day (00:00:00) in Lima timezone
 */
export const startOfDay = (d: Date): Date => {
  const dt = DateTime.fromJSDate(d, { zone: APP_TIMEZONE }).startOf('day');
  return dt.toJSDate();
};

/**
 * Gets the current date/time as a Date object, accounting for Lima timezone
 * Use this for business logic that depends on "now" in Lima timezone
 * NOTE: The Date object stores UTC internally, but represents the current moment in Lima time
 */
export const nowInLima = (): Date => {
  return DateTime.now().setZone(APP_TIMEZONE).toJSDate();
};

/**
 * Gets the current date/time as an ISO string, accounting for Lima timezone
 */
export const nowInLimaISO = (): string => {
  return DateTime.now().setZone(APP_TIMEZONE).toISO() as string;
};
