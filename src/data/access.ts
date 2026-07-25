/**
 * Data-access seam (Stage 2/3). Screens read through these accessors;
 * Stage 2 backs them with real Dexie repositories (replacing the Stage 1
 * mock). `sessionsKept` is a real count of completed sessions — a plain
 * tally for the proof language, NOT the Stage 3 streak engine.
 *
 * Stage 3 adds schedule *positioning*: rather than handing Today the
 * whole split, the seam resolves which day belongs to today, what comes
 * next, and demotes the rest (src/lib/schedule).
 */
import { db } from "./db";
import { getActiveSplit, type DayWithExercises } from "./repositories/splitRepo";
import { localDay, localWeekday } from "../lib/date";
import { planSchedule, relativeDayLabel } from "../lib/schedule";
import { collectDayFacts } from "../features/proof/proofRepo";
import { computeStreak, countKeptDays } from "../features/proof/engine";

export interface NextUp {
  day: DayWithExercises;
  weekday: number;
  daysAway: number;
  /** "tomorrow" · "Wednesday" · "next Monday" */
  label: string;
}

export interface HomeData {
  dateLabel: string;
  weekday: number;
  hasSplit: boolean;
  splitName: string | null;
  isTrainingDay: boolean;
  /** Every day in the split, in order (Train screen). */
  days: DayWithExercises[];
  /** The one day scheduled for today, or null on a rest day. */
  todayDay: DayWithExercises | null;
  /** The remaining days — the secondary "or train something else" list. */
  otherDays: DayWithExercises[];
  /** The next scheduled session after today. */
  nextUp: NextUp | null;
  /** Kept DAYS, derived by the proof engine — not a raw session tally. */
  sessionsKept: number;
  /** Current unbroken run of kept obligations. */
  streak: number;
  todaySessionByDay: Record<string, { id: string; status: string }>;
}

function dateLabel(d = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export async function loadHome(): Promise<HomeData> {
  const active = await getActiveSplit();
  const weekday = localWeekday();
  const today = localDay();

  // Proof language reads from the engine, so Today and Proof can never
  // disagree about what has actually been kept.
  const facts = await collectDayFacts(today);
  const sessionsKept = countKeptDays(facts, today);
  const streak = computeStreak(facts, today);

  const todaySessionByDay: Record<string, { id: string; status: string }> = {};
  for (const s of await db.sessions.where("dateLocal").equals(today).toArray()) {
    if (s.splitDayId && !s.deletedAt && s.status !== "discarded") {
      todaySessionByDay[s.splitDayId] = { id: s.id, status: s.status };
    }
  }

  if (!active) {
    return {
      dateLabel: dateLabel(),
      weekday,
      hasSplit: false,
      splitName: null,
      isTrainingDay: false,
      days: [],
      todayDay: null,
      otherDays: [],
      nextUp: null,
      sessionsKept,
      streak,
      todaySessionByDay,
    };
  }

  // Rotation is phased from the week the split was imported, so a fresh
  // split always opens on its first day.
  const plan = planSchedule(
    active.split.scheduleWeekdays,
    active.days.length,
    new Date(),
    new Date(active.split.createdAt),
  );
  const todayDay = plan.todayDayIndex === null ? null : active.days[plan.todayDayIndex] ?? null;
  const otherDays = active.days.filter((d) => d.id !== todayDay?.id);
  const nextUp =
    plan.next && active.days[plan.next.dayIndex]
      ? {
          day: active.days[plan.next.dayIndex],
          weekday: plan.next.weekday,
          daysAway: plan.next.daysAway,
          label: relativeDayLabel(plan.next.daysAway, plan.next.weekday),
        }
      : null;

  return {
    dateLabel: dateLabel(),
    weekday,
    hasSplit: true,
    splitName: active.split.name,
    isTrainingDay: plan.isTrainingDay,
    days: active.days,
    todayDay,
    otherDays,
    nextUp,
    sessionsKept,
    streak,
    todaySessionByDay,
  };
}
