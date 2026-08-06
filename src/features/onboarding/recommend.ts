/**
 * Picking the split for you.
 *
 * The split library is fourteen programs deep, which is a good problem
 * to have and a bad first screen: someone new has no way to tell "Twin
 * Anvils 4×" from "The Armory 5×", so they either pick at random or
 * bounce. This scores every template against a short questionnaire and
 * names a winner WITH ITS REASONING, so the choice can be argued with
 * rather than obeyed.
 *
 * Deterministic and offline, same as the goal reader. Every rule below
 * is ordinary training practice, not a claim about research.
 */

import { SPLIT_LIBRARY, type SplitTemplate } from "../splits/library";
import { GOAL_LABEL, type Goal } from "./goals";

export type Experience = "new" | "returning" | "experienced";
export type Equipment = "gym" | "home" | "bodyweight";

export const EXPERIENCE_LABEL: Record<Experience, string> = {
  new: "New to training",
  returning: "Getting back into it",
  experienced: "Been training a while",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  gym: "Full gym",
  home: "Home setup — some weights",
  bodyweight: "No equipment",
};

export interface Answers {
  goal: Goal;
  experience: Experience;
  /** Realistic sessions per week. */
  daysPerWeek: number;
  equipment: Equipment;
  /** Whatever they typed, kept so the reason can quote it back. */
  customGoalText?: string;
}

export interface Recommendation {
  template: SplitTemplate;
  score: number;
  /** Plain sentences explaining the pick. */
  reasons: string[];
}

/* ---------------------------------------------------------------- */

/** Which split categories serve which goal, and how well. */
const CATEGORY_FIT: Record<Goal, Record<SplitTemplate["category"], number>> = {
  strength: { lift: 40, hybrid: 12, cardio: 0 },
  muscle: { lift: 40, hybrid: 14, cardio: 0 },
  // Lifting keeps the muscle while conditioning does the rest, so a
  // hybrid week is the honest first answer for fat loss — but a pure
  // lifting split is still a perfectly good one.
  lean: { lift: 26, hybrid: 40, cardio: 20 },
  endurance: { lift: 6, hybrid: 30, cardio: 40 },
  health: { lift: 26, hybrid: 34, cardio: 24 },
};

/** Template ids that lean strength-first vs volume-first. */
const STRENGTH_FIRST = new Set(["strength-3", "minimalist-2", "full-body-3"]);
const VOLUME_FIRST = new Set([
  "ppl-6",
  "upper-lower-arms-5",
  "lengthened-3",
  "upper-lower-4",
]);

/** Nothing here needs a loaded barbell. */
const BODYWEIGHT_OK = new Set(["home-bodyweight-3", "couch-to-run-3", "run-base-4"]);
/** Runs on a bench, a bar and some dumbbells. */
const HOME_OK = new Set([
  "home-bodyweight-3",
  "couch-to-run-3",
  "run-base-4",
  "cycling-base-4",
  "minimalist-2",
  "full-body-3",
  "strength-3",
  "old-guard-4",
]);

function equipmentPenalty(t: SplitTemplate, equipment: Equipment): number | null {
  if (equipment === "gym") return 0;
  if (equipment === "bodyweight") {
    // Hard filter: recommending a barbell program to someone with no
    // barbell is not a ranking problem, it is a wrong answer.
    return BODYWEIGHT_OK.has(t.id) ? 0 : null;
  }
  return HOME_OK.has(t.id) ? 0 : -35;
}

function levelFit(t: SplitTemplate, experience: Experience): number {
  const wanted: Record<Experience, SplitTemplate["level"]> = {
    new: "beginner",
    returning: "beginner",
    experienced: "intermediate",
  };
  const order: SplitTemplate["level"][] = ["beginner", "intermediate", "advanced"];
  const gap = Math.abs(order.indexOf(t.level) - order.indexOf(wanted[experience]));
  if (gap === 0) return 18;
  if (gap === 1) return 4;
  // Handing a beginner an advanced split is how people get hurt and quit.
  return experience === "new" ? -30 : -10;
}

function daysFit(t: SplitTemplate, want: number): number {
  const gap = Math.abs(t.daysPerWeek - want);
  if (gap === 0) return 30;
  if (gap === 1) return 14;
  if (gap === 2) return -6;
  return -28;
}

function goalDetailBonus(t: SplitTemplate, goal: Goal): number {
  if (goal === "strength" && STRENGTH_FIRST.has(t.id)) return 14;
  if (goal === "muscle" && VOLUME_FIRST.has(t.id)) return 14;
  if (goal === "endurance" && t.category === "cardio") return 8;
  if (goal === "health" && t.daysPerWeek <= 3) return 8;
  return 0;
}

/* ---------------------------------------------------------------- */

export function scoreTemplate(t: SplitTemplate, a: Answers): Recommendation | null {
  const equip = equipmentPenalty(t, a.equipment);
  if (equip === null) return null;

  const cat = CATEGORY_FIT[a.goal][t.category];
  const lvl = levelFit(t, a.experience);
  const days = daysFit(t, a.daysPerWeek);
  const detail = goalDetailBonus(t, a.goal);
  const score = cat + lvl + days + detail + equip;

  const reasons: string[] = [];
  reasons.push(
    t.daysPerWeek === a.daysPerWeek
      ? `It runs ${t.daysPerWeek} days a week, which is exactly what you said you can hold.`
      : `It runs ${t.daysPerWeek} days a week against the ${a.daysPerWeek} you picked — close enough to work, and a week you actually finish beats one you abandon.`,
  );
  if (cat >= 30) {
    reasons.push(`Its shape suits "${GOAL_LABEL[a.goal].toLowerCase()}": ${t.summary}`);
  }
  if (lvl >= 18) {
    reasons.push(
      a.experience === "experienced"
        ? "It is pitched at someone who has trained before, so the volume will not bore you."
        : "It is a beginner program, which is the fastest place to make progress and the easiest to keep up.",
    );
  }
  if (a.equipment === "bodyweight") {
    reasons.push("Nothing in it needs a loaded barbell.");
  } else if (a.equipment === "home" && HOME_OK.has(t.id)) {
    reasons.push("It runs on a bench, a bar and some dumbbells.");
  }

  return { template: t, score, reasons };
}

/**
 * Rank the library. Returns the best first; an empty array only when
 * the equipment filter excluded everything, which the UI must handle
 * rather than pretending there was a match.
 */
export function recommendSplits(a: Answers, limit = 3): Recommendation[] {
  return SPLIT_LIBRARY.map((t) => scoreTemplate(t, a))
    .filter((r): r is Recommendation => r !== null)
    .sort((x, y) => y.score - x.score || x.template.name.localeCompare(y.template.name))
    .slice(0, limit);
}

/** The single headline sentence for the winner. */
export function recommendationHeadline(r: Recommendation, a: Answers): string {
  return `${r.template.name} — ${t(a)} ${r.template.daysPerWeek} days a week.`;
  function t(ans: Answers): string {
    switch (ans.goal) {
      case "strength":
        return "built around getting stronger,";
      case "muscle":
        return "built around adding muscle,";
      case "lean":
        return "built to keep muscle while you lean out,";
      case "endurance":
        return "built around conditioning,";
      case "health":
        return "built to be sustainable,";
    }
  }
}
