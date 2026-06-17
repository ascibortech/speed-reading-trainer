/**
 * Spaced-repetition scheduler (system-design §5.1). Retention only shows over
 * time, so a memorized passage is re-tested at expanding intervals and we record
 * recall decay. The schedule adapts to performance: strong recall advances to the
 * next (longer) interval; weak recall repeats the current one.
 *
 * Pure and deterministic — all "now"/anchor times are passed in, so it is fully
 * unit-testable and stores nothing itself.
 */

/** Expanding review intervals, in days (kickoff §5.1: 1 day → 3 → 1 week → …). */
export const INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

/** Recall at or above this advances to the next interval; below repeats. */
export const ADVANCE_THRESHOLD_PCT = 70;

export interface Schedule {
  /** Index into INTERVALS_DAYS for the *current* spacing. */
  intervalIndex: number;
  /** ISO timestamp the next review becomes due. */
  dueAt: string;
}

function addDays(fromIso: string, days: number): string {
  const d = new Date(fromIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/**
 * Compute the next schedule after a review scored `recallPct`, anchored at
 * `fromIso`. Strong recall advances the interval (capped at the longest); weak
 * recall repeats the current interval.
 */
export function nextSchedule(
  currentIntervalIndex: number,
  recallPct: number,
  fromIso: string,
): Schedule {
  const advance = recallPct >= ADVANCE_THRESHOLD_PCT;
  const nextIndex = advance
    ? Math.min(currentIntervalIndex + 1, INTERVALS_DAYS.length - 1)
    : currentIntervalIndex;
  return { intervalIndex: nextIndex, dueAt: addDays(fromIso, INTERVALS_DAYS[nextIndex]) };
}

/** The schedule for a brand-new review item created at `fromIso`. */
export function firstSchedule(fromIso: string): Schedule {
  return { intervalIndex: 0, dueAt: addDays(fromIso, INTERVALS_DAYS[0]) };
}

export function isDue(dueAtIso: string, now: Date): boolean {
  return now.getTime() >= new Date(dueAtIso).getTime();
}

/** Whole days from `fromIso` to `now` (>= 0). */
export function daysSince(fromIso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 86_400_000));
}
