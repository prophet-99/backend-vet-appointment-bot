import { ceilToBlock } from './time.util';

export const mergeIntervals = (
  intervals: Array<{ start: number; end: number }>
) => {
  if (intervals.length === 0) return [];
  intervals.sort((a, b) => a.start - b.start);

  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const cur = intervals[i];
    if (cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else merged.push(cur);
  }
  return merged;
};

export const findFirstSlot = (params: {
  workShiftStart: number;
  workShiftEnd: number;
  busyIntervals: Array<{ start: number; end: number }>;
  blockMinutes: number;
  requiredMinutes: number;
}) => {
  const {
    workShiftStart,
    workShiftEnd,
    busyIntervals,
    blockMinutes,
    requiredMinutes,
  } = params;

  // We start at the beginning of the shift, aligned with the block
  let cursor = ceilToBlock(workShiftStart, blockMinutes);

  for (const busyInterval of busyIntervals) {
    // if the cursor fits before the busy block
    if (cursor + requiredMinutes <= busyInterval.start) {
      return { start: cursor, end: cursor + requiredMinutes };
    }
    // if cursor falls within or before, jump to the end of the busy block
    if (cursor < busyInterval.end)
      cursor = ceilToBlock(busyInterval.end, blockMinutes);
    if (cursor + requiredMinutes > workShiftEnd) return null;
  }

  // after the last busy block
  if (cursor + requiredMinutes <= workShiftEnd)
    return { start: cursor, end: cursor + requiredMinutes };
  return null;
};
