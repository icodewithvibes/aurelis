/**
 * Planning data seam (Stage 4) — assembles the week from Dexie and the
 * pure builders. Local only; nothing here leaves the device.
 */
import { db } from "../../data/db";
import { getActiveSplit } from "../../data/repositories/splitRepo";
import { localDay } from "../../lib/date";
import { collectDayFacts } from "../proof/proofRepo";
import {
  buildTrailingWeek,
  buildWeek,
  summarizeWeek,
  type PlannedDay,
  type WeekInputs,
  type WeekSummary,
} from "./week";

export interface WeekView {
  /** Today and the next six days. */
  ahead: PlannedDay[];
  /** The seven days ending today. */
  trailing: PlannedDay[];
  summary: WeekSummary;
  hasSplit: boolean;
  splitName: string | null;
}

export async function loadWeek(today = localDay()): Promise<WeekView> {
  const [active, facts, sessions] = await Promise.all([
    getActiveSplit(),
    collectDayFacts(today),
    db.sessions.toArray(),
  ]);

  // One session per date for linking; a completed one always wins.
  const sessionsByDate: Record<string, { id: string; status: string }> = {};
  for (const s of sessions) {
    if (s.deletedAt || s.status === "discarded") continue;
    const existing = sessionsByDate[s.dateLocal];
    if (!existing || existing.status !== "completed") {
      sessionsByDate[s.dateLocal] = { id: s.id, status: s.status };
    }
  }

  const inputs: WeekInputs = {
    scheduleWeekdays: active?.split.scheduleWeekdays ?? [],
    dayNames: active?.days.map((d) => d.name) ?? [],
    dayExerciseCounts: active?.days.map((d) => d.exercises.length) ?? [],
    anchor: active ? new Date(active.split.createdAt) : undefined,
    facts,
    sessionsByDate,
  };

  const trailing = buildTrailingWeek(inputs, today);
  return {
    ahead: buildWeek(inputs, today),
    trailing,
    summary: summarizeWeek(trailing),
    hasSplit: !!active,
    splitName: active?.split.name ?? null,
  };
}
