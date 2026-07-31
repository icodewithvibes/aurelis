/**
 * Progression — what to put on the bar next, and why.
 *
 * DOUBLE PROGRESSION, which is the ordinary way strength programs
 * advance and the only scheme that can be run honestly from the data
 * this app already has. You are given a rep range. You stay at a weight
 * until you can hit the TOP of that range on every working set; then
 * the weight goes up and the reps reset to the bottom. Nothing here is
 * a research finding — it is standard practice, stated as such.
 *
 * Three rules this module holds to:
 *
 * 1. NEVER INVENT A STARTING WEIGHT. With no history there is no
 *    honest answer, so it says so and asks you to pick one. A number
 *    made up by an app is worse than no number.
 *
 * 2. ONLY COUNT COMPLETED SETS. A set you entered but did not finish is
 *    not evidence, exactly as it is not evidence anywhere else here.
 *
 * 3. SAY WHY, IN THE NUMBERS YOU LOGGED. Every suggestion carries the
 *    session it came from and the arithmetic behind it. It is a
 *    suggestion you can read and disagree with, not a verdict.
 *
 * Deliberately absent: 1RM percentages, RPE autoregulation, fatigue
 * models, anything tuned. Those need either a tested max or a lot more
 * data than a phone log, and guessing at them would be the fabricated
 * progress this app exists to avoid.
 */

/** Smallest practical jump: two 2.5 lb plates, or two 1.25 kg. */
export const STEP_LB = 5;
export const STEP_KG = 2.5;

/** Target increase per successful progression, before rounding. */
const INCREMENT_RATIO = 0.025;
/** Same weight this many sessions with no rep gain counts as stalled. */
const STALL_SESSIONS = 3;
/** How far to back off when stalled. */
const DELOAD_RATIO = 0.9;

export interface CompletedSet {
  weight: number;
  reps: number;
}

export interface LiftDay {
  dateLocal: string;
  /** Completed working sets that day, in the order performed. */
  sets: CompletedSet[];
}

export interface RepTarget {
  sets: number;
  repMin: number;
  repMax: number;
}

export type Verdict =
  /** Nothing logged — the app must not invent a number. */
  | "first-time"
  /** Top of the range on every set: earn the increase. */
  | "add-weight"
  /** Inside the range: same weight, chase reps. */
  | "add-reps"
  /** Short of the bottom: run it back before adding. */
  | "repeat"
  /** Stuck at one weight with no rep gain: back off to build a run-up. */
  | "deload";

export interface Suggestion {
  verdict: Verdict;
  /** Null only for first-time, where no honest number exists. */
  weight: number | null;
  repsLow: number;
  repsHigh: number;
  /** Plain sentence naming the arithmetic. */
  reason: string;
  /** The day this was read from. */
  basedOn: string | null;
}

const step = (units: "lb" | "kg") => (units === "kg" ? STEP_KG : STEP_LB);

/** Round to the nearest real plate jump. */
export function roundToStep(weight: number, units: "lb" | "kg"): number {
  const s = step(units);
  return Math.round(weight / s) * s;
}

/**
 * The weight the day's work was actually done at.
 *
 * The most-used weight, not the heaviest — one heavy single after four
 * working sets is a top set, not the working weight, and progressing
 * off it would ratchet the load up on a day that was mostly lighter.
 * Ties go to the heavier weight.
 */
export function workingWeight(sets: readonly CompletedSet[]): number | null {
  if (sets.length === 0) return null;
  const counts = new Map<number, number>();
  for (const s of sets) counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1);

  let best: number | null = null;
  let bestCount = 0;
  for (const [weight, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== null && weight > best)) {
      best = weight;
      bestCount = count;
    }
  }
  return best;
}

/** Reps achieved on each set at the working weight. */
function repsAtWeight(sets: readonly CompletedSet[], weight: number): number[] {
  return sets.filter((s) => s.weight === weight).map((s) => s.reps);
}

/**
 * Has this lift stalled — same working weight for several sessions with
 * no improvement in the worst set?
 *
 * The worst set is the honest measure: adding a rep to your first set
 * while the last one falls apart is not progress.
 */
export function hasStalled(days: readonly LiftDay[]): boolean {
  const recent = days.slice(-STALL_SESSIONS);
  if (recent.length < STALL_SESSIONS) return false;

  const weights = recent.map((d) => workingWeight(d.sets));
  if (weights.some((w) => w === null || w !== weights[0])) return false;

  const worstReps = recent.map((d) => Math.min(...repsAtWeight(d.sets, weights[0]!)));
  return Math.max(...worstReps) <= worstReps[0];
}

/**
 * What to do next for one lift.
 *
 * `days` must be ascending by date and contain only completed sets.
 */
export function suggestNext(
  days: readonly LiftDay[],
  target: RepTarget,
  units: "lb" | "kg" = "lb",
): Suggestion {
  const withWork = days.filter((d) => d.sets.length > 0);
  const last = withWork[withWork.length - 1];

  if (!last) {
    return {
      verdict: "first-time",
      weight: null,
      repsLow: target.repMin,
      repsHigh: target.repMax,
      reason: `No history for this lift yet. Pick a weight you could manage about ${target.repMax + 2} reps with, and leave a rep or two in reserve.`,
      basedOn: null,
    };
  }

  const weight = workingWeight(last.sets)!;
  const reps = repsAtWeight(last.sets, weight);
  const worst = Math.min(...reps);
  const setsAtWeight = reps.length;
  const shown = `${weight} ${units} × ${reps.join(", ")}`;

  if (hasStalled(withWork)) {
    const backedOff = roundToStep(weight * DELOAD_RATIO, units);
    return {
      verdict: "deload",
      weight: backedOff === weight ? weight - step(units) : backedOff,
      repsLow: target.repMin,
      repsHigh: target.repMax,
      reason: `Three sessions at ${weight} ${units} without the worst set improving. Drop about 10% and build back — a run-up beats grinding.`,
      basedOn: last.dateLocal,
    };
  }

  // Top of the range on every set, and enough sets to mean it.
  if (worst >= target.repMax && setsAtWeight >= Math.min(target.sets, 2)) {
    const raised = roundToStep(weight * (1 + INCREMENT_RATIO), units);
    const next = raised <= weight ? weight + step(units) : raised;
    return {
      verdict: "add-weight",
      weight: next,
      repsLow: target.repMin,
      repsHigh: target.repMax,
      reason: `You hit ${target.repMax} on every set at ${weight} ${units} (${shown}). That earns the jump — go to ${next} and start back at ${target.repMin}.`,
      basedOn: last.dateLocal,
    };
  }

  if (worst < target.repMin) {
    return {
      verdict: "repeat",
      weight,
      repsLow: target.repMin,
      repsHigh: target.repMax,
      reason: `Last time was ${shown}, short of ${target.repMin}. Same weight again — the range is the target, not the floor.`,
      basedOn: last.dateLocal,
    };
  }

  return {
    verdict: "add-reps",
    weight,
    repsLow: Math.min(worst + 1, target.repMax),
    repsHigh: target.repMax,
    reason: `Last time was ${shown}. Stay at ${weight} ${units} until every set reaches ${target.repMax}, then the weight goes up.`,
    basedOn: last.dateLocal,
  };
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  "first-time": "First time",
  "add-weight": "Add weight",
  "add-reps": "Chase reps",
  repeat: "Run it back",
  deload: "Back off",
};

/** One-line form for the suggestion chip: "195 lb × 5–8". */
export function suggestionLabel(s: Suggestion, units: "lb" | "kg"): string {
  if (s.weight == null) return `${s.repsLow}–${s.repsHigh} reps`;
  const reps = s.repsLow === s.repsHigh ? `${s.repsLow}` : `${s.repsLow}–${s.repsHigh}`;
  return `${s.weight} ${units} × ${reps}`;
}
