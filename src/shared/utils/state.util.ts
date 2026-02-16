import type { BookingState } from '@domain/models/booking-store.model';

/**
 * Merges a partial BookingState patch into a current state object.
 *
 * This utility applies only defined values from the patch, avoiding overwriting
 * existing data with undefined values. This is useful for preserving previously
 * stored information when updates are incomplete or null.
 *
 * @template T - The type of the current state (must extend Partial<BookingState>)
 * @param currentState - The base state object to patch
 * @param toPatch - The partial state updates to apply. Only defined values are merged.
 * @returns A new state object with merged values, preserving type T
 *
 * @example
 * const state: Partial<BookingState> = { ownerName: 'Juan', petName: 'Max' };
 * const patch: Partial<BookingState> = { ownerName: 'Carlos', notes: 'Nueva nota' };
 * const result = patchBookingState(state, patch);
 * // Result: { ownerName: 'Carlos', petName: 'Max', notes: 'Nueva nota' }
 *
 * @example
 * // Undefined values in patch do NOT overwrite existing values
 * const state: Partial<BookingState> = { petSize: 'LARGE' };
 * const patch: Partial<BookingState> = { petSize: undefined };
 * const result = patchBookingState(state, patch);
 * // Result: { petSize: 'LARGE' } (petSize is preserved)
 */
export const patchBookingState = <T extends Partial<BookingState>>(
  currentState: T,
  toPatch?: Partial<BookingState>
): T => {
  if (!toPatch) return currentState;

  let patchedState = { ...currentState } as T;

  (Object.keys(toPatch) as (keyof BookingState)[]).forEach((key) => {
    const value = toPatch[key];
    if (value !== undefined) {
      patchedState = { ...patchedState, [key]: value };
    }
  });

  return patchedState;
};
