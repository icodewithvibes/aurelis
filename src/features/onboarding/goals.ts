/**
 * Goal reading — turning what someone says into what they want.
 *
 * The onboarding asks a few structured questions AND lets you type your
 * own goal, because the person who writes "want to look good at my
 * wedding in June" is telling you more than any radio button captures.
 * This module is the deterministic engine that reads that text.
 *
 * Deterministic on purpose. No model call, no network, no API key —
 * it runs offline, it gives the same answer twice, and it can be
 * unit-tested, which none of those alternatives can. The cost is that
 * it only knows the words it has been taught, so the vocabulary below
 * is deliberately wide, including the slang and misspellings people
 * actually type into a fitness app at 6am.
 *
 * When it recognises nothing it says so rather than guessing. A wrong
 * confident answer here picks the wrong program for months.
 */

export type Goal =
  /** Move more weight. Low reps, long rests, the big lifts. */
  | "strength"
  /** Build visible muscle. Moderate reps, more volume per muscle. */
  | "muscle"
  /** Lose fat / look leaner. Lifting to keep muscle, plus conditioning. */
  | "lean"
  /** Run, ride, last longer. Conditioning is the point. */
  | "endurance"
  /** Feel better, move well, stay consistent. No performance target. */
  | "health";

export const GOALS: Goal[] = ["strength", "muscle", "lean", "endurance", "health"];

export const GOAL_LABEL: Record<Goal, string> = {
  strength: "Get stronger",
  muscle: "Build muscle",
  lean: "Get lean",
  endurance: "Build endurance",
  health: "Feel better and stay consistent",
};

export const GOAL_BLURB: Record<Goal, string> = {
  strength: "Heavier bar, lower reps, longer rests.",
  muscle: "More volume per muscle, moderate reps.",
  lean: "Keep the muscle you have while conditioning comes up.",
  endurance: "Running or riding is the main event.",
  health: "Sustainable, unfussy, easy to keep up.",
};

/**
 * The vocabulary. Each entry is a lowercase phrase; matching is done on
 * word boundaries so "abs" does not fire inside "absolutely".
 *
 * Weights: 3 = unmistakable, 2 = strong, 1 = suggestive. Several weak
 * signals can outvote one strong one, which is usually right — "tone up
 * and lose my belly" is a lean goal even though "tone" alone is vague.
 */
const LEXICON: Record<Goal, [string, number][]> = {
  strength: [
    ["stronger", 3], ["strength", 3], ["get strong", 3], ["strong af", 3],
    ["powerlifting", 3], ["powerlifter", 3], ["power lifting", 3],
    ["1rm", 3], ["one rep max", 3], ["max out", 2], ["pr", 2], ["prs", 2],
    ["personal record", 2], ["personal best", 2],
    ["squat more", 3], ["bench more", 3], ["deadlift more", 3],
    ["heavier", 2], ["heavy", 1], ["lift heavy", 3], ["big lifts", 2],
    ["two plates", 3], ["three plates", 3], ["four plates", 3],
    ["225", 2], ["315", 2], ["405", 2],
    ["compound", 1], ["barbell", 1], ["strength training", 3],
    ["get my numbers up", 3], ["numbers up", 2], ["move weight", 2],
  ],
  muscle: [
    ["build muscle", 3], ["muscle", 2], ["muscles", 2], ["gain muscle", 3],
    ["hypertrophy", 3], ["bodybuilding", 3], ["bodybuilder", 3],
    ["get big", 3], ["get bigger", 3], ["bigger", 2], ["size", 2],
    ["mass", 2], ["bulk", 3], ["bulking", 3], ["gains", 2], ["gainz", 2],
    ["jacked", 3], ["swole", 3], ["yoked", 3], ["buff", 2], ["ripped", 2],
    ["aesthetic", 2], ["aesthetics", 2], ["physique", 2],
    ["arms", 2], ["biceps", 2], ["bicep", 2], ["triceps", 2],
    ["chest", 2], ["pecs", 2], ["shoulders", 2], ["delts", 2],
    ["back", 1], ["lats", 2], ["legs", 1], ["quads", 2], ["glutes", 2],
    ["booty", 2], ["calves", 2], ["fill out", 2], ["put on weight", 2],
    ["skinny", 2], ["scrawny", 2], ["bulk up", 3],
  ],
  lean: [
    ["lean", 3], ["get lean", 3], ["leaner", 3], ["lose fat", 3],
    ["fat loss", 3], ["burn fat", 3], ["body fat", 3], ["bodyfat", 3],
    ["lose weight", 3], ["weight loss", 3], ["losing weight", 3],
    ["slim", 2], ["slim down", 3], ["trim", 2], ["trim down", 3],
    ["cut", 3], ["cutting", 3], ["shred", 3], ["shredded", 3],
    ["tone", 2], ["toned", 2], ["tone up", 3], ["definition", 2],
    ["defined", 2], ["abs", 3], ["six pack", 3], ["sixpack", 3],
    ["belly", 3], ["beer belly", 3], ["gut", 2], ["love handles", 3],
    ["muffin top", 3], ["overweight", 3], ["obese", 3],
    ["drop pounds", 3], ["drop lbs", 3], ["drop kg", 3],
    ["beach", 2], ["wedding", 2], ["summer", 1], ["holiday", 1],
    ["look good", 2], ["fit into", 2],
  ],
  endurance: [
    ["endurance", 3], ["stamina", 3], ["cardio", 3], ["conditioning", 3],
    ["run", 3], ["running", 3], ["runner", 3], ["jog", 3], ["jogging", 3],
    ["5k", 3], ["10k", 3], ["half marathon", 3], ["marathon", 3],
    ["ultra", 2], ["park run", 3], ["parkrun", 3],
    ["cycle", 3], ["cycling", 3], ["bike", 3], ["biking", 3], ["ride", 2],
    ["row", 2], ["rowing", 2], ["swim", 2], ["swimming", 2],
    ["triathlon", 3], ["hyrox", 3], ["spartan", 2],
    ["vo2", 3], ["aerobic", 3], ["mile time", 3], ["pace", 2],
    ["out of breath", 3], ["winded", 3], ["breathless", 3],
    ["last longer", 2], ["go further", 2], ["couch to 5k", 3],
  ],
  health: [
    ["health", 3], ["healthy", 3], ["healthier", 3],
    ["feel better", 3], ["feel good", 2], ["wellbeing", 3],
    ["longevity", 3], ["live longer", 3], ["age well", 3],
    ["mobility", 3], ["flexible", 2], ["flexibility", 2],
    ["posture", 3], ["back pain", 3], ["knee pain", 2], ["pain", 1],
    ["injury", 2], ["injured", 2], ["rehab", 2], ["physio", 2],
    ["consistent", 3], ["consistency", 3], ["habit", 3], ["routine", 3],
    ["discipline", 2], ["mental health", 3], ["stress", 2], ["anxiety", 2],
    ["energy", 2], ["sleep", 2], ["doctor", 2],
    ["get back into", 3], ["getting back", 3], ["back into it", 3],
    ["start again", 3], ["restart", 2], ["beginner", 2], ["new to", 2],
    ["out of shape", 2], ["unfit", 3], ["sedentary", 3], ["desk job", 2],
    ["move more", 3], ["general fitness", 3], ["overall fitness", 3],
    ["fit", 1], ["fitness", 1],
  ],
};

/** Phrases that flip the meaning of whatever follows them. */
const NEGATORS = [
  "don't want", "dont want", "do not want", "not looking to",
  "not trying to", "no interest in", "rather not", "without",
  "not into", "hate",
];

export interface GoalReading {
  /** Best guess, or null when nothing was recognised. */
  goal: Goal | null;
  /** Every goal that scored, strongest first. */
  ranked: { goal: Goal; score: number }[];
  /** The phrases that fired, for showing your work. */
  matched: string[];
  /** True when the text had content but none of it was recognised. */
  unrecognised: boolean;
}

const boundaryHit = (haystack: string, phrase: string): boolean => {
  let from = 0;
  for (;;) {
    const i = haystack.indexOf(phrase, from);
    if (i === -1) return false;
    const before = i === 0 ? " " : haystack[i - 1];
    const after =
      i + phrase.length >= haystack.length ? " " : haystack[i + phrase.length];
    // Letters/digits either side mean this is part of a longer word.
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
    from = i + 1;
  }
};

/** Is this phrase inside a negated clause? */
const negated = (text: string, phrase: string): boolean => {
  const at = text.indexOf(phrase);
  if (at === -1) return false;
  // Only look back to the start of the current clause — a negation in an
  // earlier sentence should not poison a later one.
  const clauseStart = Math.max(
    text.lastIndexOf(".", at),
    text.lastIndexOf(",", at),
    text.lastIndexOf(" but ", at),
    text.lastIndexOf(" and ", at),
    -1,
  );
  const window = text.slice(clauseStart + 1, at);
  return NEGATORS.some((n) => window.includes(n));
};

/**
 * Read free text into a goal.
 *
 * Returns every goal that scored, not just the winner, so the UI can
 * offer a runner-up instead of silently committing to a close call.
 */
export function readGoalText(input: string): GoalReading {
  const text = ` ${(input || "").toLowerCase().replace(/[^a-z0-9\s.,']/g, " ").replace(/\s+/g, " ")} `;
  const scores = new Map<Goal, number>();
  const matched: string[] = [];

  for (const goal of GOALS) {
    for (const [phrase, weight] of LEXICON[goal]) {
      if (!boundaryHit(text, phrase)) continue;
      if (negated(text, phrase)) continue;
      scores.set(goal, (scores.get(goal) ?? 0) + weight);
      matched.push(phrase);
    }
  }

  const ranked = [...scores.entries()]
    .map(([goal, score]) => ({ goal, score }))
    .sort((a, b) => b.score - a.score || GOALS.indexOf(a.goal) - GOALS.indexOf(b.goal));

  const hadContent = input.trim().length > 0;
  return {
    goal: ranked[0]?.goal ?? null,
    ranked,
    matched,
    unrecognised: hadContent && ranked.length === 0,
  };
}
