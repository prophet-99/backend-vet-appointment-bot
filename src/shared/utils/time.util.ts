import { DateTime } from 'luxon';

import {
  APP_TIMEZONE,
  MIN_BLOCK_SIZE,
} from '@shared/symbols/business.constants';

export const hhmmToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToHhmm = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const ceilToBlock = (mins: number, block = MIN_BLOCK_SIZE): number => {
  return Math.ceil(mins / block) * block;
};

export const isValidBlock = (hhmm: string, block = MIN_BLOCK_SIZE): boolean => {
  const mins = hhmmToMinutes(hhmm);
  return mins % block === 0;
};

/**
 * Sets the time HH:MM to a specific day in Lima timezone
 * and returns a JS Date (stored internally as UTC)
 */
export const setTimeInLima = (day: Date, hhmm: string): Date => {
  const [h, m] = hhmm.split(':').map(Number);
  const dt = DateTime.fromJSDate(day, { zone: APP_TIMEZONE }).set({
    hour: h,
    minute: m,
    second: 0,
    millisecond: 0,
  });
  return dt.toJSDate();
};
