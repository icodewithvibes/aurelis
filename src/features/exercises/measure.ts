/**
 * How a movement is measured.
 *
 * Almost everything is reps. A plank is not, a farmer's walk is not, and
 * a plate pinch is not — those are held for time. The app had one unit,
 * so a 30–60 second plank was shown as "3 × 30–60 reps" and the
 * progression engine offered "pick a weight you could manage about 62
 * reps with". Both sentences are nonsense, and both were on screen.
 *
 * Deliberately a name lookup rather than a field on the exercise: a
 * timed movement can arrive from a stack, a shipped template, a
 * generated split or a split someone pasted in, and only one of those
 * four is data this app writes. A set of names catches all of them at
 * the point they are displayed.
 *
 * Distance work (a loaded carry measured in metres) is knowingly folded
 * into "seconds" — the app logs one number per set, and time is the one
 * a phone-in-your-pocket lifter can actually report.
 */

import { normalizeName } from "./exerciseDb";

const TIMED = new Set([
  "plank",
  "front plank",
  "side bridge",
  "side plank",
  "farmer s walk",
  "farmers walk",
  "farmers carry",
  "plate pinch",
  "dead hang",
  "hanging",
  "wall sit",
  "isometric wipers",
  "l sit",
]);

/** True when this movement's "reps" are really seconds. */
export function isTimedMovement(name: string): boolean {
  return TIMED.has(normalizeName(name));
}

/** The unit label for one set of this movement. */
export function setUnit(name: string): "reps" | "sec" {
  return isTimedMovement(name) ? "sec" : "reps";
}
