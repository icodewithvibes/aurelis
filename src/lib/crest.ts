/**
 * Crest tier mapping.
 *
 * THERE IS ONLY ONE LADDER. The crest you see and the rank you earn are
 * the same thing measured once, in XP, by `features/rank/rank.ts`.
 *
 * This file used to hold a SECOND ladder keyed off kept-day counts
 * (1, 3, 7, 14…) while the rank card used XP thresholds. Both used the
 * same tier names, so the app could — and did — tell the user they were
 * "First Mark" in one place and "Polished Mark" in another on the same
 * screen. Two ladders wearing the same names is not a tuning problem,
 * it is a correctness problem, so the kept-day ladder is gone.
 *
 * What remains here is the display shape the Proof surfaces already
 * speak, backed entirely by RANK_TIERS.
 */
import type { CrestLevel } from "../components/ThresholdArch";
import { RANK_TIERS, rankFor } from "../features/rank/rank";

export interface CrestTier {
  level: CrestLevel;
  name: string;
  /** XP at which this tier begins. */
  min: number;
}

/** Derived from the rank ladder so the two can never drift apart. */
export const CREST_TIERS: CrestTier[] = RANK_TIERS.map((t) => ({
  level: t.level,
  name: t.name,
  min: t.minXp,
}));

export interface CrestState {
  level: CrestLevel;
  name: string;
  nextName: string | null;
  /** XP until the next tier (0 at max). */
  toNext: number;
  /** 0..1 within the current tier toward the next. */
  progress: number;
}

/**
 * The crest for an XP total. This is `rankFor` in the shape the Proof
 * components already consume — deliberately a thin adapter rather than
 * a second implementation.
 */
export function crestStateForXp(xp: number): CrestState {
  const r = rankFor(xp);
  return {
    level: r.level,
    name: r.name,
    nextName: r.nextName,
    toNext: r.toNext,
    progress: r.progress,
  };
}
