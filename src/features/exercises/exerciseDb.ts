/**
 * Exercise reference (Stage 7).
 *
 * Data: free-exercise-db (https://github.com/yuhonas/free-exercise-db),
 * released under the Unlicense — public domain, no attribution required
 * and no share-alike obligation. 873 movements with photos.
 *
 * Split of concerns, deliberately:
 * - METADATA is bundled (352 KB, lazy-imported) so lookups are instant
 *   and work with no network at all.
 * - IMAGES are fetched on demand from the project's raw CDN, only when
 *   the user actually asks to see one. Bundling ~873 photos would be
 *   hundreds of megabytes. No user data is sent — it is a plain GET for
 *   a public static file — and a failure degrades to text.
 */

import { artUrlFor } from "./exerciseArt";

export interface ExerciseInfo {
  /** Normalised lookup key. */
  k: string;
  /** Display name. */
  n: string;
  /** Equipment, when known. */
  e: string | null;
  /** beginner | intermediate | expert */
  l: string | null;
  /** strength | cardio | stretching | … */
  c: string | null;
  /** Primary muscles. */
  p: string[];
  /** Secondary muscles. */
  s: string[];
  /** Image path, relative to the CDN base. */
  i: string;
  /** Two-sentence description. */
  d: string;
}

const CDN = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

/**
 * Prefer the bundled AURELIS art, fall back to the source photo.
 *
 * The art is same-origin and works offline; the CDN is the safety net
 * for movements whose art has not been made yet, and for the ~820
 * entries in the index that no shipped split uses. See exerciseArt.ts.
 */
export function exerciseImageUrl(path: string): string {
  return artUrlFor(path) ?? `${CDN}${path.replace(/^exercises\//, "")}`;
}

/** True when this movement is showing bundled art rather than the CDN. */
export function hasBundledArt(path: string): boolean {
  return artUrlFor(path) !== null;
}

/**
 * Movements that intentionally have NO reference photo.
 *
 * The dataset has machines — an elliptical, a stationary rower — but no
 * entry for "go outside and run easy for 30 minutes". Rather than
 * substitute a machine nobody asked for, or show a lookup failure for a
 * movement everyone already knows, these are declared text-only and the
 * "See the movement" button is simply not offered.
 */
export const TEXT_ONLY_EXERCISES = new Set([
  "easy run",
  "steady run",
  "long run",
  "running intervals",
  "walk run intervals",
  "easy ride",
  "steady ride",
  "long ride",
  "bike intervals",
]);

export function hasReference(name: string): boolean {
  return !TEXT_ONLY_EXERCISES.has(normalizeName(name));
}

/** Lowercase, punctuation stripped, whitespace collapsed. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

let cache: ExerciseInfo[] | null = null;
let inflight: Promise<ExerciseInfo[]> | null = null;

/** Lazy — the index is only downloaded when something actually needs it. */
export async function loadExerciseIndex(): Promise<ExerciseInfo[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = import("./exerciseIndex.json").then((m) => {
      cache = m.default as ExerciseInfo[];
      return cache;
    });
  }
  return inflight;
}

/**
 * Gym names that differ from the database's naming convention. Lowering
 * the match threshold instead would buy these at the cost of confidently
 * wrong matches everywhere else, so the gap is closed explicitly.
 */
const ALIASES: Record<string, string> = {
  "back squat": "barbell squat",
  squat: "barbell squat",
  "front squat": "front barbell squat",
  bench: "barbell bench press medium grip",
  "bench press": "barbell bench press medium grip",
  "incline bench press": "barbell incline bench press medium grip",
  ohp: "barbell shoulder press",
  "overhead press": "barbell shoulder press",
  "military press": "barbell shoulder press",
  rdl: "romanian deadlift",
  deadlift: "barbell deadlift",
  "conventional deadlift": "barbell deadlift",
  "barbell row": "bent over barbell row",
  "bent over row": "bent over barbell row",
  "lat pulldown": "wide grip lat pulldown",
  pulldown: "wide grip lat pulldown",
  "pull up": "pullups",
  "pull ups": "pullups",
  "chin up": "chin up",
  "bicep curl": "barbell curl",
  "biceps curl": "barbell curl",
  "tricep pushdown": "triceps pushdown",
  "leg curl": "lying leg curls",
  "leg extension": "leg extensions",
  "calf raise": "standing calf raises",
  "hip thrust": "barbell hip thrust",
  plank: "plank",
};

/** Words that carry no identifying information when matching. */
const NOISE = new Set([
  "the", "a", "with", "and", "on", "to", "of", "for", "grip", "medium",
  "wide", "close", "standing", "seated", "alternate", "alternating",
  "machine", "version", "bar", "up", "down",
]);

function tokens(value: string): string[] {
  return normalizeName(value).split(" ").filter((t) => t && !NOISE.has(t));
}

/**
 * Find the best match for a user-written exercise name.
 *
 * Splits say "Bench Press"; the database says "Barbell Bench Press -
 * Medium Grip". Exact keys are tried first, then containment, then a
 * token-overlap score. A weak match returns null rather than showing a
 * confidently wrong picture — being unsure is better than being wrong.
 */
export function matchExercise(name: string, index: readonly ExerciseInfo[]): ExerciseInfo | null {
  const raw = normalizeName(name);
  if (!raw) return null;

  const key = ALIASES[raw] ?? raw;
  const exact = index.find((e) => e.k === key);
  if (exact) return exact;

  const wanted = tokens(key);
  if (wanted.length === 0) return null;

  let best: ExerciseInfo | null = null;
  let bestScore = 0;

  for (const e of index) {
    const have = tokens(e.n);
    if (have.length === 0) continue;

    let overlap = 0;
    for (const t of wanted) if (have.includes(t)) overlap++;
    if (overlap === 0) continue;

    // Reward covering the query, and lightly penalise extra words so
    // "Bench Press" prefers a plain bench press over a decline variant.
    const coverage = overlap / wanted.length;
    const precision = overlap / have.length;
    const score = coverage * 0.75 + precision * 0.25;

    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }

  // Every query word must be accounted for, or it isn't the same lift.
  return bestScore >= 0.6 ? best : null;
}

export async function findExercise(name: string): Promise<ExerciseInfo | null> {
  return matchExercise(name, await loadExerciseIndex());
}

/** Title-cased muscle list for display. */
export function musclesLabel(info: ExerciseInfo): string {
  const all = [...info.p, ...info.s.slice(0, 2)];
  return all.map((m) => m.replace(/\b\w/g, (c) => c.toUpperCase())).join(" · ");
}
