/**
 * Proof engine (Stage 3) — the honest record of kept work.
 *
 * Everything here is a PURE FOLD over day facts. Streaks, records and
 * PRs are never stored as source of truth (02_strategy/04 §4): they are
 * derived, so editing a past session simply replays to a correct answer
 * and no drift can accumulate. No time, storage or randomness is read
 * inside this module.
 *
 * Locked rules (docs/stage-3-product-and-ux-plan.md §1.1):
 * - A kept day = one qualifying completed session per local calendar
 *   day, OR a Forge daily commitment marked done.
 * - Recovery-honored bridges a run: never breaks it, never increments.
 * - Empty days with no obligation bridge too.
 * - A missed obligation *before today* breaks the run.
 * - Today never breaks a run — the day is not over yet.
 * - streakCountMode = 'sessions': the first kept day is 1 immediately.
 */

export type DayStatus = "kept" | "recovery" | "rest" | "missed";

export interface DayFacts {
  /** Device-local YYYY-MM-DD. */
  date: string;
  /** A workout was scheduled for this day by the active split. */
  scheduled: boolean;
  /** A qualifying session was completed on this day. */
  keptSession: boolean;
  /** A Forge daily commitment existed for this day. */
  commitmentSet: boolean;
  /** That commitment was marked done. */
  commitmentKept: boolean;
  /** The day was explicitly marked as honored recovery. */
  recoveryHonored: boolean;
}

export function resolveDayStatus(f: DayFacts): DayStatus {
  if (f.keptSession || f.commitmentKept) return "kept";
  if (f.recoveryHonored) return "recovery";
  if (f.scheduled || f.commitmentSet) return "missed";
  return "rest";
}

/** Days that carried an obligation — the denominator for completion. */
export function isObligation(f: DayFacts): boolean {
  return f.scheduled || f.commitmentSet;
}

/**
 * The current run, counted backwards from today. `days` must be sorted
 * ascending and contiguous; `today` is a device-local YYYY-MM-DD.
 */
export function computeStreak(days: readonly DayFacts[], today: string): number {
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    if (day.date > today) continue; // ignore anything ahead of today
    const status = resolveDayStatus(day);
    if (status === "kept") {
      current++;
      continue;
    }
    // Today is still open: it can neither break the run nor extend it.
    if (day.date === today) continue;
    if (status === "missed") break;
    // recovery / rest bridge without incrementing
  }
  return current;
}

/** The longest run ever achieved, under the same bridging rules. */
export function computeBestStreak(days: readonly DayFacts[], today: string): number {
  let best = 0;
  let run = 0;
  for (const day of days) {
    if (day.date > today) break;
    const status = resolveDayStatus(day);
    if (status === "kept") {
      run++;
      best = Math.max(best, run);
    } else if (status === "missed" && day.date !== today) {
      run = 0;
    }
  }
  return best;
}

export interface WeekCompletion {
  kept: number;
  obligations: number;
  /** 0..1; 1 when nothing was owed. */
  ratio: number;
}

/**
 * How much of this week's owed work was kept. Counts obligations up to
 * and including today only — future scheduled days are not yet owed.
 */
export function weekCompletion(
  days: readonly DayFacts[],
  weekDates: readonly string[],
  today: string,
): WeekCompletion {
  const inWeek = new Set(weekDates);
  let kept = 0;
  let obligations = 0;
  for (const day of days) {
    if (!inWeek.has(day.date) || day.date > today) continue;
    const status = resolveDayStatus(day);
    if (isObligation(day)) obligations++;
    if (status === "kept") kept++;
  }
  return { kept, obligations, ratio: obligations === 0 ? 1 : kept / obligations };
}

export function countKeptDays(days: readonly DayFacts[], today: string): number {
  return days.filter((d) => d.date <= today && resolveDayStatus(d) === "kept").length;
}

/* ---------------------------------------------------------------- PRs */

export type PrMetric = "topWeight" | "est1RM" | "repPR";

export interface SetResult {
  exerciseName: string;
  weight?: number;
  reps?: number;
  done: boolean;
}

export interface PrCandidate {
  exerciseName: string;
  metric: PrMetric;
  value: number;
}

/** Epley. A single rep is simply the weight lifted. */
export function est1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * The best value per exercise and metric within one session's logged
 * sets. Only completed sets with real numbers count.
 */
export function prCandidates(sets: readonly SetResult[]): PrCandidate[] {
  const best = new Map<string, PrCandidate>();
  const offer = (exerciseName: string, metric: PrMetric, value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    const key = `${exerciseName}|${metric}`;
    const prev = best.get(key);
    if (!prev || value > prev.value) best.set(key, { exerciseName, metric, value });
  };

  for (const s of sets) {
    if (!s.done) continue;
    const reps = s.reps ?? 0;
    if (s.weight != null && s.weight > 0) {
      offer(s.exerciseName, "topWeight", s.weight);
      if (reps > 0) offer(s.exerciseName, "est1RM", est1RM(s.weight, reps));
    }
    if (reps > 0) offer(s.exerciseName, "repPR", reps);
  }
  return [...best.values()];
}

/**
 * Candidates that actually beat the standing record. `standing` is keyed
 * `exerciseName|metric`. A first-ever entry counts as a PR — that is the
 * honest reading of "a record you did not have before".
 */
export function newPRs(
  candidates: readonly PrCandidate[],
  standing: ReadonlyMap<string, number>,
): PrCandidate[] {
  return candidates.filter((c) => {
    const prev = standing.get(`${c.exerciseName}|${c.metric}`);
    return prev === undefined || c.value > prev;
  });
}
