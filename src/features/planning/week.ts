/**
 * Weekly planning (Stage 4) — the next seven days at a glance.
 *
 * Pure: takes the split schedule plus the already-collected day facts
 * and returns one entry per day. It never invents a status it cannot
 * support from the log, and it deliberately does NOT call an unlogged
 * scheduled day a failure — it is simply "not logged", and the future
 * is "planned".
 */
import { addDays, localDay } from "../../lib/date";
import { dayIndexForDate, weekdayName } from "../../lib/schedule";
import type { DayFacts } from "../proof/engine";

export type PlannedStatus =
  /** A qualifying session (or kept commitment) is on the record. */
  | "kept"
  /** Logged, but the user stopped short and said so. */
  | "partial"
  /** Rest was taken deliberately. */
  | "recovery"
  /** Scheduled, in the past, nothing recorded. Not a failure. */
  | "open"
  /** Nothing was scheduled. */
  | "rest"
  /** Scheduled, today or ahead. */
  | "planned";

export interface PlannedDay {
  date: string;
  weekday: number;
  /** "Mon" */
  short: string;
  /** "Monday" */
  long: string;
  isToday: boolean;
  isPast: boolean;
  /** The split day scheduled for this date, if any. */
  dayIndex: number | null;
  dayName: string | null;
  exerciseCount: number;
  status: PlannedStatus;
  /** Set when a session for this date exists. */
  sessionId?: string;
}

export interface WeekInputs {
  scheduleWeekdays: readonly number[];
  /** Split day names in order. */
  dayNames: readonly string[];
  /** Exercise count per split day, same order. */
  dayExerciseCounts: readonly number[];
  /** Rotation phase — the split's createdAt. */
  anchor?: Date;
  facts: readonly DayFacts[];
  /** dateLocal → session id + status, for linking a day to its record. */
  sessionsByDate?: Record<string, { id: string; status: string }>;
}

const DAYS_AHEAD = 7;

/**
 * Seven days starting today. `today` is a device-local YYYY-MM-DD so the
 * whole calculation stays inside one calendar system.
 */
export function buildWeek(input: WeekInputs, today = localDay()): PlannedDay[] {
  const factByDate = new Map(input.facts.map((f) => [f.date, f]));
  const out: PlannedDay[] = [];

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = addDays(today, i);
    const [y, m, d] = date.split("-").map(Number);
    const asDate = new Date(y, m - 1, d);
    const weekday = asDate.getDay();

    const dayIndex =
      input.dayNames.length > 0
        ? dayIndexForDate(input.scheduleWeekdays, input.dayNames.length, asDate, input.anchor)
        : null;

    const fact = factByDate.get(date);
    const session = input.sessionsByDate?.[date];
    const isToday = date === today;

    let status: PlannedStatus;
    if (fact?.keptSession || fact?.commitmentKept) status = "kept";
    else if (session?.status === "partial") status = "partial";
    else if (fact?.recoveryHonored) status = "recovery";
    else if (dayIndex === null) status = "rest";
    else if (isToday) status = "planned";
    else status = "planned"; // future scheduled day

    out.push({
      date,
      weekday,
      short: weekdayName(weekday).slice(0, 3),
      long: weekdayName(weekday),
      isToday,
      isPast: false,
      dayIndex,
      dayName: dayIndex === null ? null : input.dayNames[dayIndex] ?? null,
      exerciseCount: dayIndex === null ? 0 : input.dayExerciseCounts[dayIndex] ?? 0,
      status,
      sessionId: session?.id,
    });
  }

  return out;
}

/**
 * The seven days ENDING today — the look-back that shows how the week
 * actually went, including days that were scheduled and never logged.
 */
export function buildTrailingWeek(input: WeekInputs, today = localDay()): PlannedDay[] {
  const factByDate = new Map(input.facts.map((f) => [f.date, f]));
  const out: PlannedDay[] = [];

  for (let i = DAYS_AHEAD - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const [y, m, d] = date.split("-").map(Number);
    const asDate = new Date(y, m - 1, d);
    const weekday = asDate.getDay();
    const isToday = date === today;

    const dayIndex =
      input.dayNames.length > 0
        ? dayIndexForDate(input.scheduleWeekdays, input.dayNames.length, asDate, input.anchor)
        : null;

    const fact = factByDate.get(date);
    const session = input.sessionsByDate?.[date];

    let status: PlannedStatus;
    if (fact?.keptSession || fact?.commitmentKept) status = "kept";
    else if (session?.status === "partial") status = "partial";
    else if (fact?.recoveryHonored) status = "recovery";
    else if (dayIndex === null) status = "rest";
    else if (isToday) status = "planned";
    else status = "open"; // scheduled, past, nothing recorded — not a failure

    out.push({
      date,
      weekday,
      short: weekdayName(weekday).slice(0, 3),
      long: weekdayName(weekday),
      isToday,
      isPast: !isToday,
      dayIndex,
      dayName: dayIndex === null ? null : input.dayNames[dayIndex] ?? null,
      exerciseCount: dayIndex === null ? 0 : input.dayExerciseCounts[dayIndex] ?? 0,
      status,
      sessionId: session?.id,
    });
  }

  return out;
}

/** Plain-language status wording. Never shaming, never "failed". */
export const STATUS_LABEL: Record<PlannedStatus, string> = {
  kept: "kept",
  partial: "partial",
  recovery: "rest honored",
  open: "not logged",
  rest: "rest",
  planned: "planned",
};

export interface WeekSummary {
  kept: number;
  planned: number;
  open: number;
  restDays: number;
}

/** A trailing-week readout built only from what is on the record. */
export function summarizeWeek(days: readonly PlannedDay[]): WeekSummary {
  return {
    kept: days.filter((d) => d.status === "kept").length,
    planned: days.filter((d) => d.status === "planned").length,
    open: days.filter((d) => d.status === "open").length,
    restDays: days.filter((d) => d.status === "rest" || d.status === "recovery").length,
  };
}
