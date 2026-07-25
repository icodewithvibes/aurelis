/**
 * Split repository (Stage 2) — typed boundary over Dexie for training
 * splits imported from ASF. Local-only. Deletion-safe: replacing the
 * active split soft-deletes (deletedAt) the prior one and its children
 * rather than hard-deleting, preserving history and sync-readiness.
 */
import { db, getDeviceId } from "../db";
import type {
  SplitRow,
  SplitDayRow,
  TemplateExerciseRow,
} from "../db";
import { newId } from "../../lib/id";
import { nowMs } from "../../lib/date";
import type { Program } from "../../features/asf/parse";

export interface DayWithExercises extends SplitDayRow {
  exercises: TemplateExerciseRow[];
}
export interface ActiveSplit {
  split: SplitRow;
  days: DayWithExercises[];
}

/** Persist a parsed ASF program as the new ACTIVE split. Returns its id. */
export async function saveProgramAsActiveSplit(
  program: Program,
  rawASF: string,
): Promise<string> {
  const now = nowMs();
  const deviceId = getDeviceId();
  const splitId = newId();

  await db.transaction(
    "rw",
    db.splits,
    db.splitDays,
    db.templateExercises,
    async () => {
      // Soft-deactivate any prior active split (deletion-safe).
      // NB: `active` is boolean → not an IndexedDB index key, so filter in JS.
      const priorActive = (await db.splits.toArray()).filter((s) => s.active && !s.deletedAt);
      for (const s of priorActive) {
        await db.splits.update(s.id, { active: false, updatedAt: now });
      }

      await db.splits.put({
        id: splitId,
        name: program.name,
        scheduleWeekdays: program.scheduleWeekdays,
        units: program.units ?? "lb",
        rawASF,
        notes: program.notes ?? undefined,
        active: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        deviceId,
      });

      for (let di = 0; di < program.days.length; di++) {
        const d = program.days[di];
        const dayId = newId();
        await db.splitDays.put({
          id: dayId,
          splitId,
          name: d.name,
          order: di,
          note: d.note ?? undefined,
          updatedAt: now,
          deletedAt: null,
        });
        for (let ei = 0; ei < d.exercises.length; ei++) {
          const ex = d.exercises[ei];
          await db.templateExercises.put({
            id: newId(),
            dayId,
            order: ei,
            name: ex.name,
            sets: ex.sets ?? 0,
            repMin: ex.repMin,
            repMax: ex.repMax,
            repScheme: ex.repScheme ?? "fixed",
            perSide: ex.perSide,
            rpeMin: ex.rpeMin,
            rpeMax: ex.rpeMax,
            restSec: ex.restSec,
            note: ex.note ?? undefined,
            updatedAt: now,
            deletedAt: null,
          });
        }
      }
    },
  );

  return splitId;
}

export async function getActiveSplit(): Promise<ActiveSplit | null> {
  const splits = (await db.splits.toArray()).filter((s) => s.active && !s.deletedAt);
  const split = splits[0];
  if (!split) return null;

  const days = (await db.splitDays.where("splitId").equals(split.id).toArray())
    .filter((d) => !d.deletedAt)
    .sort((a, b) => a.order - b.order);

  const withEx: DayWithExercises[] = [];
  for (const d of days) {
    const exercises = (await db.templateExercises.where("dayId").equals(d.id).toArray())
      .filter((e) => !e.deletedAt)
      .sort((a, b) => a.order - b.order);
    withEx.push({ ...d, exercises });
  }
  return { split, days: withEx };
}

/** Soft-delete the active split (deletion-safe). */
export async function clearActiveSplit(): Promise<void> {
  const now = nowMs();
  const active = (await db.splits.toArray()).filter((s) => s.active && !s.deletedAt);
  for (const s of active) {
    await db.splits.update(s.id, { active: false, deletedAt: now, updatedAt: now });
  }
}
