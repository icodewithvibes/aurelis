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

/**
 * Scheduled weekdays as ordered, de-duplicated slots.
 *
 * ORDERED FROM THE FIRST WEEKDAY THE AUTHOR WROTE, not from Sunday.
 *
 * This used to sort ascending, which silently discarded the written
 * order the data model calls LOCKED — and got a real split wrong.
 * "SCHEDULE: Mon, Wed, Fri, Sun" against days [Easy, Intervals, Easy,
 * Long] plainly means Monday easy and Sunday long. Sorting put Sunday
 * at slot 0, so Sunday became the EASY run and Monday the intervals:
 * the whole week shifted by one, and the long run landed on a Friday.
 *
 * Ordering by distance from the first written weekday keeps the
 * author's pairing, and keeps the slot sequence chronological within
 * the training week — which the rotation arithmetic below depends on.
 * Any schedule already written in ascending order from its first day
 * (every other split here) is completely unaffected.
 */
export function scheduleSlots(scheduleWeekdays: readonly number[]): number[] {
  const unique = [...new Set(scheduleWeekdays.map((d) => ((d % 7) + 7) % 7))];
  if (unique.length === 0) return unique;
  const start = unique[0];
  return unique.sort(
    (a, b) => ((a - start + 7) % 7) - ((b - start + 7) % 7),
  );
}

/**
 * Whole training weeks elapsed, where a week begins on the split's own
 * first scheduled weekday rather than on Sunday.
 *
 * Anchoring the boundary to the schedule is what lets the slot sequence
 * stay monotonic: with a Sunday-start boundary, a split written
 * "Mon … Sun" would see its last slot occur first each week and the
 * rotation counter would run backwards.
 */
function weekIndex(date: Date, startWeekday = 0): number {
  const days = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY,
  );
  const shift = ((EPOCH_SUNDAY_OFFSET - startWeekday) % 7 + 7) % 7;
  return Math.floor((days + shift) / 7);
}

/**
 * Index into the split's day list for `date`, or null when the date is
 * not a scheduled training day.
 *
 * The weekday keeps a stable meaning: with three slots and three days,
 * Wednesday is always the Wednesday session no matter which day you
 * imported on. Rotation only comes into play when the split has more
 * days than the week has slots.
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
  const weeks = anchor ? weekIndex(date, slots[0]) - weekIndex(anchor, slots[0]) : 0;
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
