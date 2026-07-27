/**
 * Rest timing (Stage 6) — pure.
 *
 * The old behaviour used one fixed number for every set, which is why
 * rest felt too long: a light warm-up single and a brutal top set got
 * the same 90 seconds.
 *
 * What the training literature agrees on, in the only detail that
 * matters here: rest should scale with how demanding the set was.
 * Short rest (30–60s) suits easy, high-rep, or accessory work; moderate
 * rest (60–120s) suits ordinary working sets; long rest (2–4 min) is
 * for genuinely heavy, near-limit efforts, where strength recovers
 * slowly. RPE — how hard the set felt — is the cheapest honest signal
 * we already collect.
 *
 * The split's own `restSec` always wins when the program specifies one,
 * because the program author knew what they were prescribing.
 */

/** Multipliers applied to the user's baseline rest, by reported effort. */
const EASY_RPE = 6; // felt comfortable — plenty left
const HARD_RPE = 9; // at or near the limit

export const REST_BOUNDS = { min: 20, max: 300 } as const;

/**
 * Seconds to rest after a set.
 *
 * @param prescribed the split's rest for this exercise, if any
 * @param rpe        reported effort 1–10, if the user gave one
 * @param baseline   the user's default rest preference
 */
export function restSecondsFor(
  prescribed: number | null | undefined,
  rpe: string | number | undefined,
  baseline: number,
): number {
  // A program that specifies rest is respected as written.
  if (prescribed != null && prescribed > 0) return clamp(prescribed);

  const effort = typeof rpe === "string" ? Number(rpe) : rpe;
  if (effort === undefined || Number.isNaN(effort) || effort <= 0) return clamp(baseline);

  // Easy sets need far less; hard sets need meaningfully more.
  let factor = 1;
  if (effort <= EASY_RPE) factor = 0.6;
  else if (effort < HARD_RPE) factor = 0.6 + ((effort - EASY_RPE) / (HARD_RPE - EASY_RPE)) * 0.4;
  else factor = 1.35;

  return clamp(Math.round((baseline * factor) / 5) * 5);
}

function clamp(seconds: number): number {
  return Math.max(REST_BOUNDS.min, Math.min(REST_BOUNDS.max, Math.round(seconds)));
}

/** One short line explaining why this rest length was chosen. */
export function restReason(
  prescribed: number | null | undefined,
  rpe: string | number | undefined,
): string {
  if (prescribed != null && prescribed > 0) return "From your split";
  const effort = typeof rpe === "string" ? Number(rpe) : rpe;
  if (effort === undefined || Number.isNaN(effort) || effort <= 0) return "Your default";
  if (effort <= EASY_RPE) return "That felt easy — shorter rest";
  if (effort >= HARD_RPE) return "That was hard — longer rest";
  return "Scaled to how that felt";
}
