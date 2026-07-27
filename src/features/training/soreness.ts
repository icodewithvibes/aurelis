/**
 * Soreness routing (Stage 6) — pure.
 *
 * You tell it what is sore and how sore; it tells you what in YOUR split
 * is a good fit today. It does not diagnose, and it does not tell you to
 * push through anything.
 *
 * What the evidence supports, and what this encodes:
 * - DOMS peaks roughly 24–72 h after the session and settles within
 *   about a week.
 * - Around 48 h before loading the SAME muscle group hard again is the
 *   common guidance; training a DIFFERENT group in the meantime is fine.
 * - Mild soreness is not a reason to skip. Gentle movement of a mildly
 *   sore muscle is generally fine and often feels better afterwards, so
 *   the app says so rather than inventing a rest day.
 * - Sharp or joint pain is NOT soreness. That is a stop signal and is
 *   routed to rest and medical guidance, never to a workout.
 */

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core";

export const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "shoulders", label: "Shoulders" },
  { key: "biceps", label: "Biceps" },
  { key: "triceps", label: "Triceps" },
  { key: "quads", label: "Quads" },
  { key: "hamstrings", label: "Hamstrings" },
  { key: "glutes", label: "Glutes" },
  { key: "calves", label: "Calves" },
  { key: "core", label: "Core" },
];

export type Severity = "mild" | "moderate" | "severe";

/**
 * Keyword → groups. ORDER MATTERS: the first pattern that matches an
 * exercise classifies it, so more specific names must come before the
 * generic ones they contain. "Romanian Deadlift" is a hamstring lift and
 * has to be caught before the bare "deadlift" rule.
 */
const EXERCISE_MAP: [RegExp, MuscleGroup[]][] = [
  [/\b(bench|chest press|incline press|fly|flye|pec|dip|push[- ]?up)\b/i, ["chest", "triceps", "shoulders"]],
  [/\b(romanian|rdl|stiff[- ]?leg|leg curl|good morning|hamstring)\b/i, ["hamstrings"]],
  [/\b(deadlift)\b/i, ["back", "hamstrings", "glutes"]],
  [/\b(row|pulldown|pull[- ]?up|chin[- ]?up|lat|shrug|pullover)\b/i, ["back", "biceps"]],
  [/\b(overhead press|ohp|shoulder press|military|lateral raise|rear delt|face pull|upright row)\b/i, ["shoulders"]],
  [/\b(curl)\b/i, ["biceps"]],
  [/\b(tricep|pushdown|skull ?crusher|kickback|close[- ]?grip)\b/i, ["triceps"]],
  [/\b(squat|leg press|lunge|split squat|step[- ]?up|hack)\b/i, ["quads", "glutes"]],
  [/\b(hip thrust|glute)\b/i, ["glutes"]],
  [/\b(calf|calve)\b/i, ["calves"]],
  [/\b(plank|crunch|sit[- ]?up|ab |abs|oblique|hollow|leg raise)\b/i, ["core"]],
];

/** Best-effort muscle groups for a day, from its exercise names. */
export function inferMuscleGroups(exerciseNames: readonly string[]): MuscleGroup[] {
  const found = new Set<MuscleGroup>();
  for (const name of exerciseNames) {
    for (const [pattern, groups] of EXERCISE_MAP) {
      if (pattern.test(name)) {
        for (const g of groups) found.add(g);
        break; // one classification per exercise, most specific first
      }
    }
  }
  return [...found];
}

export interface SorenessDay {
  /** Index into the split's day list. */
  dayIndex: number;
  name: string;
  groups: MuscleGroup[];
}

export interface SorenessInput {
  sore: MuscleGroup[];
  severity: Severity;
  days: SorenessDay[];
  /** Sharp or joint pain rather than muscle soreness. */
  isPain?: boolean;
}

export interface SorenessAdvice {
  /** Days that avoid the sore groups entirely — train these freely. */
  clear: SorenessDay[];
  /** Days that touch a sore group. */
  overlapping: SorenessDay[];
  /** The single recommendation, if there is one. */
  recommended: SorenessDay | null;
  /** Plain-language explanation. Never shaming, never diagnostic. */
  headline: string;
  detail: string;
  /** True when we are explicitly saying "train it anyway, and here's why". */
  trainAnyway: boolean;
}

export function adviseForSoreness(input: SorenessInput): SorenessAdvice {
  const sore = new Set(input.sore);
  const overlaps = (d: SorenessDay) => d.groups.some((g) => sore.has(g));

  const clear = input.days.filter((d) => !overlaps(d));
  const overlapping = input.days.filter(overlaps);

  // Pain is not soreness, and never gets a training recommendation.
  if (input.isPain) {
    return {
      clear,
      overlapping,
      recommended: null,
      headline: "That sounds like pain, not soreness.",
      detail:
        "Sharp or joint pain is a stop signal, not something to train through. Rest it, and if it persists or worsens, get medical guidance. Nothing here is medical advice.",
      trainAnyway: false,
    };
  }

  if (sore.size === 0) {
    return {
      clear: input.days,
      overlapping: [],
      recommended: input.days[0] ?? null,
      headline: "Nothing marked sore.",
      detail: "Train whatever the plan says today.",
      trainAnyway: false,
    };
  }

  // Mild soreness: the honest answer is that it is not a reason to skip.
  if (input.severity === "mild") {
    return {
      clear,
      overlapping,
      recommended: overlapping[0] ?? clear[0] ?? null,
      headline: "Mild soreness — you can still train this.",
      detail:
        "Light soreness usually eases once you warm up, and moving a mildly sore muscle is generally fine. Start lighter than usual and stop if it sharpens.",
      trainAnyway: true,
    };
  }

  if (input.severity === "moderate") {
    if (clear.length > 0) {
      return {
        clear,
        overlapping,
        recommended: clear[0],
        headline: `Train something else today — ${clear[0].name}.`,
        detail:
          "Soreness peaks around 24–72 hours. Loading a different muscle group in the meantime is fine, and it keeps the week intact without hammering what is still recovering.",
        trainAnyway: false,
      };
    }
    return {
      clear,
      overlapping,
      recommended: null,
      headline: "Every day in your split touches what is sore.",
      detail:
        "Take this as a recovery day, or train the sore group lighter than usual. Around 48 hours before loading the same group hard again is the usual guidance.",
      trainAnyway: false,
    };
  }

  // Severe.
  if (clear.length > 0) {
    return {
      clear,
      overlapping,
      recommended: clear[0],
      headline: `Leave that alone today — ${clear[0].name} instead.`,
      detail:
        "Badly sore muscles need roughly 48 hours before they are loaded hard again. Training a different group now is fine and keeps your week going.",
      trainAnyway: false,
    };
  }
  return {
    clear,
    overlapping,
    recommended: null,
    headline: "Today is a recovery day.",
    detail:
      "Everything in your split loads something that is badly sore. Rest, food, water and sleep are the work today — and recovery marked on purpose keeps your record intact.",
    trainAnyway: false,
  };
}
