/**
 * Coverage against real data — the active split and what was logged.
 *
 * Kept separate from `coverage.ts` so the analysis stays pure and
 * testable; this file is only the seam where it meets the exercise
 * index and Dexie.
 */

import { db } from "../../data/db";
import { getActiveSplit } from "../../data/repositories/splitRepo";
import { findExercise } from "../exercises/exerciseDb";
import { parseASF } from "../asf/parse";
import {
  coverageOf,
  findGaps,
  gapSentence,
  type Coverage,
  type Gap,
  type MovementMuscles,
} from "./coverage";

/** Resolve names to muscles via the bundled index, dropping unknowns. */
export async function musclesFor(names: readonly string[]): Promise<MovementMuscles[]> {
  const unique = [...new Set(names)];
  const resolved = await Promise.all(
    unique.map(async (name) => {
      const info = await findExercise(name);
      if (!info) return null;
      return { name, primary: info.p ?? [], secondary: info.s ?? [] };
    }),
  );
  return resolved.filter((m): m is MovementMuscles => m !== null);
}

export interface CoverageReport {
  coverage: Coverage;
  gaps: Gap[];
  /** One plain sentence, or null when nothing is missing. */
  sentence: string | null;
  /** Movements the report was built from. */
  movements: string[];
}

async function report(names: readonly string[]): Promise<CoverageReport> {
  const movements = await musclesFor(names);
  const coverage = coverageOf(movements);
  const gaps = findGaps(coverage);
  return {
    coverage,
    gaps,
    sentence: gapSentence(gaps),
    movements: movements.map((m) => m.name),
  };
}

/** What the CURRENT PROGRAM is designed to train. A gap here is by design. */
export async function coverageOfActiveSplit(): Promise<CoverageReport | null> {
  const active = await getActiveSplit();
  if (!active) return null;
  const names = active.days.flatMap((d) => d.exercises.map((e) => e.name));
  return report(names);
}

/** What a template would train, before adopting it. */
export async function coverageOfAsf(asf: string): Promise<CoverageReport> {
  const names = parseASF(asf).program.days.flatMap((d) => d.exercises.map((e) => e.name));
  return report(names);
}

/**
 * What was ACTUALLY trained, from completed sets.
 *
 * Reported separately from the split's own coverage because the two
 * mean different things: a hole in the program will never close by
 * itself, while a hole in the log might just be a missed day.
 */
export async function coverageOfLoggedWork(sinceDays = 28): Promise<CoverageReport> {
  const [logs, sessions] = await Promise.all([
    db.setLogs.toArray(),
    db.sessions.toArray(),
  ]);
  const live = new Map(
    sessions.filter((s) => !s.deletedAt && s.status !== "discarded").map((s) => [s.id, s]),
  );
  const cutoff = new Date(Date.now() - sinceDays * 86_400_000).toISOString().slice(0, 10);

  const names = logs
    .filter((l) => l.done && !l.deletedAt)
    .filter((l) => {
      const s = live.get(l.sessionId);
      return s !== undefined && s.dateLocal >= cutoff;
    })
    .map((l) => l.exerciseName);

  return report(names);
}
