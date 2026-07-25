/**
 * Schedule mapping (Stage 3) — which split day belongs to *today*.
 *
 * Before this, Today listed every day in the split and `isTrainingDay`
 * was a bare `scheduleWeekdays.includes(weekday)` boolean. Here each
 * scheduled weekday becomes a numbered slot, and slots map onto split
 * days in order:
 *
 *   SCHEDULE Mon, Wed, Fri + days [Push A, Pull A, Legs A]
 *     → Mon = Push A, Wed = Pull A, Fri = Legs A
 *
 * When a split has more days than weekly slots (A/B alternation, a
 * 4-day split trained 3×/week) the mapping rotates forward each week:
 *
 *   4 days over 3 slots → week 0: A B C · week 1: D A B · week 2: C D A
 *
 * Rotation is derived from the calendar week rather than a stored
 * pointer, so it is a pure function of the date: no drift, no
 * migration, and every screen agrees without reading state. The
 * rotation is phased from the week the split was imported (`anchor`),
 * so a fresh split always begins on its first day. When the split fits
 * the week exactly the offset is always zero and the mapping is purely
 * positional.
 *
 * All arithmetic is device-local (02_strategy/04).
 */

const MS_PER_DAY = 86_400_000;
/** 1970-01-01 was a Thursday; +4 moves week boundaries onto Sunday. */
const EPOCH_SUNDAY_OFFSET = 4;

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[((weekday % 7) + 7) % 7];
}

/** Scheduled weekdays as ordered, de-duplicated slots (Sunday first). */
export function scheduleSlots(scheduleWeekdays: readonly number[]): number[] {
  return [...new Set(scheduleWeekdays.map((d) => ((d % 7) + 7) % 7))].sort((a, b) => a - b);
}

/** Whole weeks since the epoch for a device-local date, weeks starting Sunday. */
function weekIndex(date: Date): number {
  const days = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY,
  );
  return Math.floor((days + EPOCH_SUNDAY_OFFSET) / 7);
}

/**
 * Index into the split's day list for `date`, or null when the date is
 * not a scheduled training day.
 */
export function dayIndexForDate(
  scheduleWeekdays: readonly number[],
  dayCount: number,
  date: Date = new Date(),
  anchor?: Date,
): number | null {
  if (dayCount <= 0) return null;
  const slots = scheduleSlots(scheduleWeekdays);
  if (slots.length === 0) return null;

  const slotIndex = slots.indexOf(date.getDay());
  if (slotIndex < 0) return null;

  // Whole weeks elapsed since the split started; zero in its first week.
  const weeks = anchor ? weekIndex(date) - weekIndex(anchor) : 0;
  const offset = weeks * slots.length;
  return (((slotIndex + offset) % dayCount) + dayCount) % dayCount;
}

export interface UpcomingDay {
  /** Index into the split's day list. */
  dayIndex: number;
  /** 0=Sun..6=Sat. */
  weekday: number;
  /** 1 = tomorrow, 7 = a week out. */
  daysAway: number;
}

export interface SchedulePlan {
  /** True when today maps to a split day. */
  isTrainingDay: boolean;
  /** Today's split day, or null on a rest day. */
  todayDayIndex: number | null;
  /** The next scheduled day strictly after today. */
  next: UpcomingDay | null;
}

/** Resolve today's day plus what comes next. Looks up to 7 days ahead. */
export function planSchedule(
  scheduleWeekdays: readonly number[],
  dayCount: number,
  date: Date = new Date(),
  anchor?: Date,
): SchedulePlan {
  const todayDayIndex = dayIndexForDate(scheduleWeekdays, dayCount, date, anchor);

  let next: UpcomingDay | null = null;
  for (let daysAway = 1; daysAway <= 7; daysAway++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysAway);
    const dayIndex = dayIndexForDate(scheduleWeekdays, dayCount, d, anchor);
    if (dayIndex !== null) {
      next = { dayIndex, weekday: d.getDay(), daysAway };
      break;
    }
  }

  return { isTrainingDay: todayDayIndex !== null, todayDayIndex, next };
}

/** "tomorrow" · "Wednesday" · "next Monday" — for the "Next: …" line. */
export function relativeDayLabel(daysAway: number, weekday: number): string {
  if (daysAway === 1) return "tomorrow";
  if (daysAway === 7) return `next ${weekdayName(weekday)}`;
  return weekdayName(weekday);
}
