/**
 * The rank ladder.
 *
 * Rank is the one number the app shows off, so it has to be worth
 * something. The design constraint that shapes everything here:
 *
 *   Rank is NEVER earned from how much weight you claim to lift.
 *
 * The obvious way to build this is to score absolute load — and it is
 * exactly why the incumbents are gameable. In a gym app every number is
 * self-reported, so anyone can type 1000 kg into the bench press and
 * outrank a person who actually trains. A ladder built on that is a
 * ladder built on nothing.
 *
 * So the dominant term is KEPT DAYS, which is the only quantity in a
 * gym app that cannot be forged: `dayMarks` is uniquely indexed by
 * local date, so a day is either kept or it is not, and no amount of
 * typing produces a sixtieth kept day before sixty days have passed.
 * Time is the anti-cheat.
 *
 * Everything else is a secondary contribution and is capped:
 *  - logged sets credit the work, but cap per session so a spam-logger
 *    gains nothing from tapping "complete set" two hundred times;
 *  - rep PRs and progression steps compare you only against YOURSELF,
 *    never against another user's numbers.
 *
 * That keeps the promise the app already makes in the tour: no streaks
 * you can buy back, no points, nothing invented.
 */

import type { CrestLevel } from "../../components/ThresholdArch";

/**
 * XP awarded for one kept day. Dominant, and impossible to backdate.
 * Must stay strictly greater than a full capped session of sets
 * (SET_XP * SET_CAP_PER_SESSION), or volume starts outranking turning
 * up and the ladder measures the wrong thing. There is a test for this.
 */
export const KEPT_DAY_XP = 250;
/** XP per completed set. Small: work counts, but volume is not rank. */
export const SET_XP = 5;
/** Sets above this in a single session earn nothing. */
export const SET_CAP_PER_SESSION = 30;
/** Beating your own rep count on a lift you have done before. */
export const REP_PR_XP = 40;
/** The progression engine advancing you on a lift. */
export const PROGRESSION_XP = 60;

export interface RankInput {
  /** Distinct days marked kept. Time-gated — the backbone of the ladder. */
  keptDays: number;
  /** Completed sets, ALREADY capped per session by `cappedSets`. */
  creditedSets: number;
  /** Rep PRs against your own history. */
  repPRs: number;
  /** Times the progression engine advanced a lift. */
  progressionSteps: number;
}

/**
 * Cap a session's set count before it contributes. Callers pass raw
 * per-session counts; this is where a 200-set "session" stops mattering.
 */
export function cappedSets(setsPerSession: readonly number[]): number {
  return setsPerSession.reduce(
    (total, n) => total + Math.min(Math.max(0, Math.floor(n)), SET_CAP_PER_SESSION),
    0,
  );
}

export function xpFor(input: RankInput): number {
  const nonNeg = (n: number) => Math.max(0, Math.floor(n || 0));
  return (
    nonNeg(input.keptDays) * KEPT_DAY_XP +
    nonNeg(input.creditedSets) * SET_XP +
    nonNeg(input.repPRs) * REP_PR_XP +
    nonNeg(input.progressionSteps) * PROGRESSION_XP
  );
}

/* Minimal row shapes, so this stays pure and importable from anywhere
   without dragging in Dexie or creating an import cycle. */
export interface SetLogLike {
  sessionId: string;
  done: boolean;
  deletedAt: number | null;
}
export interface PrLike {
  metric: string;
  deletedAt: number | null;
}

/**
 * Build the rank input from already-loaded rows.
 *
 * Pure on purpose: both the proof repo and the rank repo need this, and
 * the proof repo must not import the rank repo (the rank repo reads day
 * facts FROM the proof repo, so the dependency only runs one way).
 */
export function rankInputFrom(args: {
  keptDays: number;
  setLogs: readonly SetLogLike[];
  prs: readonly PrLike[];
}): RankInput {
  const perSession = new Map<string, number>();
  for (const row of args.setLogs) {
    if (!row.done || row.deletedAt) continue;
    perSession.set(row.sessionId, (perSession.get(row.sessionId) ?? 0) + 1);
  }
  const live = args.prs.filter((p) => !p.deletedAt);
  return {
    keptDays: args.keptDays,
    creditedSets: cappedSets([...perSession.values()]),
    repPRs: live.filter((p) => p.metric === "repPR").length,
    progressionSteps: live.filter((p) => p.metric === "topWeight").length,
  };
}

export interface RankTier {
  level: CrestLevel;
  name: string;
  minXp: number;
}

/**
 * Names are the locked crest language (02_strategy/00_INDEX) and map
 * 1:1 onto crest_L1..L7. Thresholds are tuned so that training four
 * times a week reaches the top of the ladder in roughly three months —
 * long enough that the final crest means something, short enough that
 * the next one is always visible.
 */
export const RANK_TIERS: RankTier[] = [
  { level: 0, name: "Unmarked", minXp: 0 },
  { level: 1, name: "First Mark", minXp: KEPT_DAY_XP },
  { level: 2, name: "Polished Mark", minXp: 1000 },
  { level: 3, name: "Silver Crest", minXp: 2500 },
  { level: 4, name: "Cobalt Crest", minXp: 5500 },
  { level: 5, name: "Prismatic Crest", minXp: 10_000 },
  { level: 6, name: "Ascendant Crest", minXp: 17_000 },
];

export interface RankState {
  level: CrestLevel;
  name: string;
  xp: number;
  nextName: string | null;
  /** XP still needed for the next tier; 0 at the top. */
  toNext: number;
  /** 0..1 through the current tier. 1 at the top. */
  progress: number;
}

export function rankFor(xp: number): RankState {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  const tier = [...RANK_TIERS].reverse().find((t) => safeXp >= t.minXp) ?? RANK_TIERS[0];
  const next = RANK_TIERS[tier.level + 1];
  if (!next) {
    return {
      level: tier.level,
      name: tier.name,
      xp: safeXp,
      nextName: null,
      toNext: 0,
      progress: 1,
    };
  }
  const span = next.minXp - tier.minXp;
  return {
    level: tier.level,
    name: tier.name,
    xp: safeXp,
    nextName: next.name,
    toNext: Math.max(0, next.minXp - safeXp),
    progress: Math.min(1, Math.max(0, (safeXp - tier.minXp) / span)),
  };
}

export function rankForInput(input: RankInput): RankState {
  return rankFor(xpFor(input));
}

/* ------------------------------------------------------------------ */
/* Per-lift mastery                                                     */
/* ------------------------------------------------------------------ */

/**
 * Mastery is per-movement and earned by turning up to that movement
 * repeatedly. Deliberately counted in SESSIONS, not sets and not load:
 * "I have squatted on forty separate days" is a claim about showing up.
 */
export interface MasteryTier {
  name: string;
  minSessions: number;
}

export const MASTERY_TIERS: MasteryTier[] = [
  { name: "Untested", minSessions: 0 },
  { name: "Handled", minSessions: 3 },
  { name: "Drilled", minSessions: 8 },
  { name: "Tempered", minSessions: 20 },
  { name: "Forged", minSessions: 40 },
  { name: "Mastered", minSessions: 80 },
];

export interface MasteryState {
  name: string;
  index: number;
  sessions: number;
  nextName: string | null;
  toNext: number;
  progress: number;
}

export function masteryFor(sessions: number): MasteryState {
  const n = Math.max(0, Math.floor(sessions || 0));
  const idx = MASTERY_TIERS.reduce(
    (best, tier, i) => (n >= tier.minSessions ? i : best),
    0,
  );
  const tier = MASTERY_TIERS[idx];
  const next = MASTERY_TIERS[idx + 1];
  if (!next) {
    return {
      name: tier.name,
      index: idx,
      sessions: n,
      nextName: null,
      toNext: 0,
      progress: 1,
    };
  }
  const span = next.minSessions - tier.minSessions;
  return {
    name: tier.name,
    index: idx,
    sessions: n,
    nextName: next.name,
    toNext: Math.max(0, next.minSessions - n),
    progress: Math.min(1, Math.max(0, (n - tier.minSessions) / span)),
  };
}

/**
 * How the rank was earned, for showing the user the arithmetic. The
 * whole point of an honest ladder is that it can be audited, so the UI
 * should always be able to answer "where did this number come from?".
 */
export interface RankBreakdown {
  label: string;
  count: number;
  xp: number;
}

export function breakdownFor(input: RankInput): RankBreakdown[] {
  const nonNeg = (n: number) => Math.max(0, Math.floor(n || 0));
  return [
    {
      label: "Days kept",
      count: nonNeg(input.keptDays),
      xp: nonNeg(input.keptDays) * KEPT_DAY_XP,
    },
    {
      label: "Sets logged",
      count: nonNeg(input.creditedSets),
      xp: nonNeg(input.creditedSets) * SET_XP,
    },
    {
      label: "Rep records",
      count: nonNeg(input.repPRs),
      xp: nonNeg(input.repPRs) * REP_PR_XP,
    },
    {
      label: "Progressions",
      count: nonNeg(input.progressionSteps),
      xp: nonNeg(input.progressionSteps) * PROGRESSION_XP,
    },
  ];
}
