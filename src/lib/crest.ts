/**
 * Crest tier DISPLAY mapping (Stage 1).
 *
 * Maps a session-kept count to a Threshold Arch tier for the visual
 * proof language. This is presentation only — it does NOT compute
 * streaks from events (the real streak engine is Stage 3, per
 * 02_strategy/04). It exists so the mock Proof surface can communicate
 * what the future experience will feel like.
 *
 * Thresholds mirror the locked crest progression (02_strategy/00_INDEX).
 */
import type { CrestLevel } from "../components/ThresholdArch";

export interface CrestTier {
  level: CrestLevel;
  name: string;
  min: number;
}

export const CREST_TIERS: CrestTier[] = [
  { level: 0, name: "Unmarked", min: 0 },
  { level: 1, name: "First Mark", min: 1 },
  { level: 2, name: "Polished Mark", min: 3 },
  { level: 3, name: "Silver Crest", min: 7 },
  { level: 4, name: "Cobalt Crest", min: 14 },
  { level: 5, name: "Prismatic Crest", min: 30 },
  { level: 6, name: "Ascendant Crest", min: 60 },
];

export interface CrestState {
  level: CrestLevel;
  name: string;
  nextName: string | null;
  toNext: number; // sessions until the next tier (0 at max)
  progress: number; // 0..1 within the current tier toward the next
}

export function crestStateForSessions(n: number): CrestState {
  const tier =
    [...CREST_TIERS].reverse().find((t) => n >= t.min) ?? CREST_TIERS[0];
  const next = CREST_TIERS[tier.level + 1];
  if (!next) {
    return { level: tier.level, name: tier.name, nextName: null, toNext: 0, progress: 1 };
  }
  const span = next.min - tier.min;
  const progress = Math.min(1, Math.max(0, (n - tier.min) / span));
  return {
    level: tier.level,
    name: tier.name,
    nextName: next.name,
    toNext: Math.max(0, next.min - n),
    progress,
  };
}
