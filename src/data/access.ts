/**
 * Data-access seam (Stage 2). Screens read through these accessors;
 * Stage 2 backs them with real Dexie repositories (replacing the Stage 1
 * mock). `sessionsKept` is a real count of completed sessions — a plain
 * tally for the proof language, NOT the Stage 3 streak engine.
 */
import { db } from "./db";
import { getActiveSplit, type DayWithExercises } from "./repositories/splitRepo";
import { localDay, localWeekday } from "../lib/date";

export interface HomeData {
  dateLabel: string;
  weekday: number;
  hasSplit: boolean;
  splitName: string | null;
  isTrainingDay: boolean;
  days: DayWithExercises[];
  sessionsKept: number;
  todaySessionByDay: Record<string, { id: string; status: string }>;
}

function dateLabel(d = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export async function loadHome(): Promise<HomeData> {
  const active = await getActiveSplit();
  const weekday = localWeekday();
  const sessionsKept = (await db.sessions.toArray()).filter(
    (s) => s.status === "completed" && !s.deletedAt,
  ).length;

  const today = localDay();
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
      sessionsKept,
      todaySessionByDay,
    };
  }

  return {
    dateLabel: dateLabel(),
    weekday,
    hasSplit: true,
    splitName: active.split.name,
    isTrainingDay: active.split.scheduleWeekdays.includes(weekday),
    days: active.days,
    sessionsKept,
    todaySessionByDay,
  };
}
