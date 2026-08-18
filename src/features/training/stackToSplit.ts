/**
 * Putting a stack INTO your split.
 *
 * Why this exists, precisely: a stack trained on its own logs its sets
 * and those sets earn rank XP, but it does not make the day a KEPT DAY.
 * Kept days are the dominant term in the ladder (250 XP each against 5
 * per set) and they are deliberately time-gated — a day counts when the
 * work your program asked for got done. Fifteen minutes of calves on a
 * Sunday is real training, but if a six-minute block could mint a kept
 * day the ladder would measure turning up for six minutes.
 *
 * So the honest way to make a stack "count fully" is to make it part of
 * the program, which is what this does. Two shapes, because they are
 * genuinely different decisions:
 *
 *   - APPEND to a day you already train. Costs you nothing structural;
 *     the day just gets longer. This is the safe default.
 *   - ADD AS ITS OWN DAY. The schedule rotates through days by COUNT,
 *     so a new day changes which session lands on which weekday from
 *     here on. That is what adding a day to a program means, and the UI
 *     says so out loud before you do it.
 *
 * Movements already on the target day are skipped rather than
 * duplicated — adding the core stack to a day that already has planks
 * should not give you planks twice.
 */

import {
  addSplitDay,
  addTemplateExercise,
  getActiveSplit,
} from "../../data/repositories/splitRepo";
import { normalizeName } from "../exercises/exerciseDb";
import { stackLevel, type Stack, type StackLevelId } from "./stacks";

export type StackTarget = { kind: "newDay" } | { kind: "existingDay"; dayId: string };

export interface StackAddResult {
  dayId: string;
  dayName: string;
  /** Movements actually written. */
  added: number;
  /** Movements the day already had, left alone. */
  skipped: number;
  /** True when a day was created, which changes the weekly rotation. */
  createdDay: boolean;
  /** Days in the split afterwards — the number the rotation runs on. */
  dayCount: number;
}

export async function addStackToSplit(
  stack: Stack,
  levelId: StackLevelId,
  target: StackTarget,
): Promise<StackAddResult | null> {
  const active = await getActiveSplit();
  if (!active) return null;

  const level = stackLevel(stack, levelId);

  let dayId: string;
  let dayName: string;
  let createdDay = false;

  if (target.kind === "newDay") {
    const name = `${stack.name} stack`;
    const created = await addSplitDay(active.split.id, name);
    if (!created) return null;
    dayId = created;
    dayName = name;
    createdDay = true;
  } else {
    const day = active.days.find((d) => d.id === target.dayId);
    if (!day) return null;
    dayId = day.id;
    dayName = day.name;
  }

  const existing = new Set(
    (active.days.find((d) => d.id === dayId)?.exercises ?? []).map((e) => normalizeName(e.name)),
  );

  let added = 0;
  let skipped = 0;
  for (const e of level.exercises) {
    if (existing.has(normalizeName(e.name))) {
      skipped++;
      continue;
    }
    await addTemplateExercise(dayId, {
      name: e.name,
      sets: e.sets,
      repMin: e.repMin,
      repMax: e.repMax,
      restSec: e.restSec,
    });
    existing.add(normalizeName(e.name));
    added++;
  }

  const after = await getActiveSplit();
  return {
    dayId,
    dayName,
    added,
    skipped,
    createdDay,
    dayCount: after?.days.length ?? active.days.length,
  };
}

/** What actually happened, in one sentence the user can act on. */
export function addOutcomeSentence(result: StackAddResult): string {
  const movements = `${result.added} ${result.added === 1 ? "movement" : "movements"}`;
  const skipped = result.skipped > 0 ? ` ${result.skipped} you already had were left alone.` : "";

  if (result.createdDay) {
    return `Added as its own day — ${movements}. Your week now rotates through ${result.dayCount} days, so which session lands on which weekday has shifted.${skipped}`;
  }
  if (result.added === 0) {
    return `${result.dayName} already had everything in this block, so nothing changed.`;
  }
  return `${movements} added to ${result.dayName}. It counts as a kept day when you finish that session.${skipped}`;
}
