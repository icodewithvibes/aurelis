/**
 * Exercise history (Stage 5) — what each lift has actually done over
 * time. Pure: a fold over completed sessions and their set logs, with no
 * clock, storage or randomness.
 *
 * Only COMPLETED sets from COMPLETED sessions count. A set the user
 * typed but never ticked is not evidence, and an abandoned session is
 * not a data point.
 */
import { est1RM } from "../proof/engine";

export interface HistorySet {
  exerciseName: string;
  weight?: number;
  reps?: number;
  done: boolean;
}

export interface HistoryEntry {
  /** Device-local YYYY-MM-DD. */
  date: string;
  sets: HistorySet[];
}

export interface HistoryPoint {
  date: string;
  /** Heaviest completed set that day. */
  topWeight: number;
  /** Best Epley estimate that day. */
  est1RM: number;
  /** Most reps in a single completed set that day. */
  bestReps: number;
}

export interface ExerciseHistory {
  name: string;
  /** Ascending by date; one point per day trained. */
  points: HistoryPoint[];
  sessions: number;
  latest: HistoryPoint;
  best: HistoryPoint;
  /**
   * Change in estimated 1RM from the first point to the latest. Null
   * when there is only one point — one session is not a trend, and
   * saying otherwise would be inventing progress.
   */
  changeEst1RM: number | null;
}

/**
 * Group completed sets by exercise, then by day. Exercises are returned
 * most-recently-trained first, which is the order they are useful in.
 */
export function buildHistory(entries: readonly HistoryEntry[]): ExerciseHistory[] {
  // exercise -> date -> running best
  const byExercise = new Map<string, Map<string, HistoryPoint>>();

  for (const entry of entries) {
    for (const set of entry.sets) {
      if (!set.done) continue;
      const reps = set.reps ?? 0;
      const weight = set.weight ?? 0;
      if (weight <= 0 && reps <= 0) continue;

      const days = byExercise.get(set.exerciseName) ?? new Map<string, HistoryPoint>();
      const point = days.get(entry.date) ?? {
        date: entry.date,
        topWeight: 0,
        est1RM: 0,
        bestReps: 0,
      };

      if (weight > point.topWeight) point.topWeight = weight;
      if (reps > point.bestReps) point.bestReps = reps;
      if (weight > 0 && reps > 0) {
        const e = est1RM(weight, reps);
        if (e > point.est1RM) point.est1RM = e;
      }

      days.set(entry.date, point);
      byExercise.set(set.exerciseName, days);
    }
  }

  const out: ExerciseHistory[] = [];
  for (const [name, days] of byExercise) {
    const points = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (points.length === 0) continue;

    const latest = points[points.length - 1];
    const best = points.reduce((a, b) => (b.est1RM > a.est1RM ? b : a), points[0]);
    const changeEst1RM =
      points.length > 1 ? Math.round((latest.est1RM - points[0].est1RM) * 10) / 10 : null;

    out.push({ name, points, sessions: points.length, latest, best, changeEst1RM });
  }

  return out.sort((a, b) => b.latest.date.localeCompare(a.latest.date) || a.name.localeCompare(b.name));
}

/**
 * Normalise a series into 0..1 for drawing. A flat series maps to the
 * middle rather than to zero, so a steady lift reads as a level line
 * instead of a collapse.
 */
export function normalizeSeries(values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}
