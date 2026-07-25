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

/* ------------------------------------------------ Editing (Stage 5) */
/**
 * A split is editable after import. Sessions snapshot their day at start
 * time, so editing a template NEVER rewrites history — past sessions keep
 * the exercises they were actually performed with.
 */

export async function renameSplit(splitId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return; // never let a split become nameless
  await db.splits.update(splitId, { name: trimmed, updatedAt: nowMs() });
}

export async function renameSplitDay(dayId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  await db.splitDays.update(dayId, { name: trimmed, updatedAt: nowMs() });
}

/**
 * Move a day one place up (-1) or down (+1) by swapping `order` with its
 * neighbour. Swapping rather than renumbering keeps every other day's
 * order stable, so nothing else in the split shifts underneath the user.
 */
export async function moveSplitDay(dayId: string, direction: -1 | 1): Promise<void> {
  const day = await db.splitDays.get(dayId);
  if (!day || day.deletedAt) return;

  const siblings = (await db.splitDays.where("splitId").equals(day.splitId).toArray())
    .filter((d) => !d.deletedAt)
    .sort((a, b) => a.order - b.order);

  const index = siblings.findIndex((d) => d.id === dayId);
  const target = siblings[index + direction];
  if (!target) return; // already at the end — a no-op, not an error

  const now = nowMs();
  await db.transaction("rw", db.splitDays, async () => {
    await db.splitDays.update(day.id, { order: target.order, updatedAt: now });
    await db.splitDays.update(target.id, { order: day.order, updatedAt: now });
  });
}

export interface ExercisePatch {
  name?: string;
  sets?: number;
  repMin?: number | null;
  repMax?: number | null;
  restSec?: number | null;
}

export async function updateTemplateExercise(id: string, patch: ExercisePatch): Promise<void> {
  const clean: ExercisePatch = {};
  if (patch.name !== undefined && patch.name.trim()) clean.name = patch.name.trim();
  if (patch.sets !== undefined) clean.sets = Math.max(1, Math.min(20, Math.round(patch.sets)));
  if (patch.repMin !== undefined) clean.repMin = patch.repMin;
  if (patch.repMax !== undefined) clean.repMax = patch.repMax;
  if (patch.restSec !== undefined) clean.restSec = patch.restSec;
  await db.templateExercises.update(id, { ...clean, updatedAt: nowMs() });
}

/** Soft-delete, matching the rest of the schema's deletion-safe policy. */
export async function removeTemplateExercise(id: string): Promise<void> {
  const now = nowMs();
  await db.templateExercises.update(id, { deletedAt: now, updatedAt: now });
}

export async function addTemplateExercise(
  dayId: string,
  input: { name: string; sets?: number; repMin?: number | null; repMax?: number | null },
): Promise<string | null> {
  const name = input.name.trim();
  if (!name) return null;

  const existing = (await db.templateExercises.where("dayId").equals(dayId).toArray()).filter(
    (e) => !e.deletedAt,
  );
  const now = nowMs();
  const id = newId();

  await db.templateExercises.put({
    id,
    dayId,
    order: existing.length,
    name,
    sets: Math.max(1, Math.min(20, Math.round(input.sets ?? 3))),
    repMin: input.repMin ?? 8,
    repMax: input.repMax ?? 12,
    repScheme: "range",
    perSide: false,
    updatedAt: now,
    deletedAt: null,
  });
  return id;
}

/** Soft-delete a whole day and its exercises. */
export async function removeSplitDay(dayId: string): Promise<void> {
  const now = nowMs();
  await db.transaction("rw", db.splitDays, db.templateExercises, async () => {
    await db.splitDays.update(dayId, { deletedAt: now, updatedAt: now });
    const exercises = await db.templateExercises.where("dayId").equals(dayId).toArray();
    for (const e of exercises) {
      await db.templateExercises.update(e.id, { deletedAt: now, updatedAt: now });
    }
  });
}

/** Soft-delete the active split (deletion-safe). */
export async function clearActiveSplit(): Promise<void> {
  const now = nowMs();
  const active = (await db.splits.toArray()).filter((s) => s.active && !s.deletedAt);
  for (const s of active) {
    await db.splits.update(s.id, { active: false, deletedAt: now, updatedAt: now });
  }
}
