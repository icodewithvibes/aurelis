/**
 * Substitutions — what to do instead, when you can't do what's written.
 *
 * The gap this fills is the most ordinary thing in a gym: the machine is
 * taken, the rack is busy, or the exercise assumes a piece of kit this
 * gym doesn't have. Every app in the world writes the program and then
 * says nothing about the twenty minutes you spend standing next to an
 * occupied leg press. A written program that can't survive a busy Monday
 * is a program you stop following.
 *
 * Three constraints, because they need different answers:
 *
 *   - TAKEN. The station is occupied, not missing. The answer must not
 *     use the same station — another barbell bench variant is no use
 *     when someone is on the bench — so same-kit options are dropped.
 *   - DON'T HAVE IT. The kit isn't in this gym at all, and probably
 *     won't be next week either. Same as above, but bodyweight and
 *     dumbbell answers are ranked up because they're the ones that
 *     exist everywhere.
 *   - CAN'T DO IT TODAY. Not equipment — the movement itself. Pull-ups
 *     when you can't do a pull-up yet, or a lift that hurts today.
 *     Demanding movements are dropped and machines are ranked up,
 *     because a machine is the one that lets you train the muscle
 *     without the skill.
 *
 * Everything here is offline and deterministic — a table and a sort, no
 * network and no model. Every movement it can suggest has bundled art,
 * so an alternative can always show you what it is, which is the whole
 * reason the alternative is usable by someone who has never done it.
 *
 * The wrist roller is deliberately absent. It's the one piece of kit in
 * the old pool you have to buy yourself — most gyms don't have one — so
 * suggesting it as the answer to "I don't have the equipment" would be
 * the worst possible advice.
 */

import { GROUP_LABEL, type CoverageGroup } from "./coverage";
import { findExercise, normalizeName } from "../exercises/exerciseDb";
import { muscleToGroup } from "./coverage";

/** What a movement needs. The unit of "I can't use that right now". */
export type Kit = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "plate";

/**
 * The movement pattern, which is what makes two exercises actually
 * interchangeable. Same group and same pattern is a like-for-like swap;
 * same group and a different pattern still trains the muscle, and the
 * suggestion says which of the two it is rather than pretending.
 */
export type Pattern =
  | "horizontalPress"
  | "inclinePress"
  | "verticalPress"
  | "fly"
  | "horizontalPull"
  | "verticalPull"
  | "pullover"
  | "shrug"
  | "lateralRaise"
  | "rearDelt"
  | "curl"
  | "reverseCurl"
  | "tricepsExtension"
  | "dip"
  | "squat"
  | "lunge"
  | "kneeExtension"
  | "hinge"
  | "kneeFlexion"
  | "hipThrust"
  | "hipExtension"
  | "backExtension"
  | "calfRaise"
  | "wristFlexion"
  | "wristExtension"
  | "gripHold"
  | "carry"
  | "hipFlexion"
  | "antiRotation"
  | "brace";

export interface Movement {
  name: string;
  group: CoverageGroup;
  pattern: Pattern;
  kit: Kit;
  /** Multi-joint. A compound is a poor replacement for an isolation and vice versa. */
  compound: boolean;
  /**
   * Needs a strength floor or a skill most people don't have yet.
   * Never offered as the answer to "I can't do this one".
   */
  demanding?: boolean;
}

/**
 * The substitutable pool. Every entry has bundled FORGE art — pinned by
 * test, because an alternative you can't see a picture of is not an
 * alternative for the person who needed one.
 */
export const MOVEMENTS: Movement[] = [
  // Chest
  { name: "Barbell Bench Press - Medium Grip", group: "chest", pattern: "horizontalPress", kit: "barbell", compound: true },
  { name: "Pushups", group: "chest", pattern: "horizontalPress", kit: "bodyweight", compound: true },
  { name: "Barbell Incline Bench Press - Medium Grip", group: "chest", pattern: "inclinePress", kit: "barbell", compound: true },
  { name: "Incline Dumbbell Press", group: "chest", pattern: "inclinePress", kit: "dumbbell", compound: true },
  { name: "Dumbbell Flyes", group: "chest", pattern: "fly", kit: "dumbbell", compound: false },
  { name: "Cable Crossover", group: "chest", pattern: "fly", kit: "cable", compound: false },

  // Back
  { name: "Bent Over Barbell Row", group: "back", pattern: "horizontalPull", kit: "barbell", compound: true },
  { name: "One-Arm Dumbbell Row", group: "back", pattern: "horizontalPull", kit: "dumbbell", compound: true },
  { name: "Seated Cable Rows", group: "back", pattern: "horizontalPull", kit: "cable", compound: true },
  { name: "Inverted Row", group: "back", pattern: "horizontalPull", kit: "bodyweight", compound: true },
  { name: "Wide-Grip Lat Pulldown", group: "back", pattern: "verticalPull", kit: "cable", compound: true },
  { name: "Pullups", group: "back", pattern: "verticalPull", kit: "bodyweight", compound: true, demanding: true },
  { name: "Chin-Up", group: "back", pattern: "verticalPull", kit: "bodyweight", compound: true, demanding: true },
  { name: "Straight-Arm Dumbbell Pullover", group: "back", pattern: "pullover", kit: "dumbbell", compound: false },
  { name: "Barbell Shrug Behind The Back", group: "back", pattern: "shrug", kit: "barbell", compound: false },

  // Shoulders
  { name: "Barbell Shoulder Press", group: "shoulders", pattern: "verticalPress", kit: "barbell", compound: true },
  { name: "Dumbbell Shoulder Press", group: "shoulders", pattern: "verticalPress", kit: "dumbbell", compound: true },
  { name: "Side Lateral Raise", group: "shoulders", pattern: "lateralRaise", kit: "dumbbell", compound: false },
  { name: "Face Pull", group: "shoulders", pattern: "rearDelt", kit: "cable", compound: false },
  { name: "Reverse Machine Flyes", group: "shoulders", pattern: "rearDelt", kit: "machine", compound: false },

  // Biceps
  { name: "Barbell Curl", group: "biceps", pattern: "curl", kit: "barbell", compound: false },
  { name: "Incline Dumbbell Curl", group: "biceps", pattern: "curl", kit: "dumbbell", compound: false },
  { name: "Hammer Curls", group: "biceps", pattern: "curl", kit: "dumbbell", compound: false },
  { name: "Zottman Curl", group: "biceps", pattern: "curl", kit: "dumbbell", compound: false },

  // Triceps
  { name: "Triceps Pushdown", group: "triceps", pattern: "tricepsExtension", kit: "cable", compound: false },
  { name: "Cable Rope Overhead Triceps Extension", group: "triceps", pattern: "tricepsExtension", kit: "cable", compound: false },
  { name: "JM Press", group: "triceps", pattern: "tricepsExtension", kit: "barbell", compound: true },
  { name: "Dips - Triceps Version", group: "triceps", pattern: "dip", kit: "bodyweight", compound: true, demanding: true },

  // Forearms — no wrist roller, on purpose. See the header.
  { name: "Palms-Up Barbell Wrist Curl Over A Bench", group: "forearms", pattern: "wristFlexion", kit: "barbell", compound: false },
  { name: "Finger Curls", group: "forearms", pattern: "wristFlexion", kit: "barbell", compound: false },
  { name: "Palms-Down Wrist Curl Over A Bench", group: "forearms", pattern: "wristExtension", kit: "barbell", compound: false },
  { name: "Palms-Up Dumbbell Wrist Curl Over A Bench", group: "forearms", pattern: "wristFlexion", kit: "dumbbell", compound: false },
  { name: "Palms-Down Dumbbell Wrist Curl Over A Bench", group: "forearms", pattern: "wristExtension", kit: "dumbbell", compound: false },
  { name: "Seated Dumbbell Palms-Up Wrist Curl", group: "forearms", pattern: "wristFlexion", kit: "dumbbell", compound: false },
  { name: "Cable Wrist Curl", group: "forearms", pattern: "wristFlexion", kit: "cable", compound: false },
  { name: "Standing Dumbbell Reverse Curl", group: "forearms", pattern: "reverseCurl", kit: "dumbbell", compound: false },
  { name: "Plate Pinch", group: "forearms", pattern: "gripHold", kit: "plate", compound: false },
  { name: "Farmer's Walk", group: "forearms", pattern: "carry", kit: "dumbbell", compound: true },

  // Abs
  { name: "Hanging Leg Raise", group: "abs", pattern: "hipFlexion", kit: "bodyweight", compound: false, demanding: true },
  { name: "Plank", group: "abs", pattern: "brace", kit: "bodyweight", compound: false },
  { name: "Mountain Climbers", group: "abs", pattern: "brace", kit: "bodyweight", compound: false },
  { name: "Dead Bug", group: "abs", pattern: "brace", kit: "bodyweight", compound: false },
  { name: "Side Bridge", group: "abs", pattern: "brace", kit: "bodyweight", compound: false },
  { name: "Cable Crunch", group: "abs", pattern: "hipFlexion", kit: "cable", compound: false },
  { name: "Pallof Press", group: "abs", pattern: "antiRotation", kit: "cable", compound: false },
  { name: "Ab Roller", group: "abs", pattern: "brace", kit: "plate", compound: false, demanding: true },

  // Lower back
  { name: "Barbell Deadlift", group: "lowerBack", pattern: "hinge", kit: "barbell", compound: true },
  { name: "Good Morning", group: "lowerBack", pattern: "hinge", kit: "barbell", compound: true },
  { name: "Reverse Hyperextension", group: "lowerBack", pattern: "backExtension", kit: "machine", compound: false },
  { name: "Hyperextensions (Back Extensions)", group: "lowerBack", pattern: "backExtension", kit: "bodyweight", compound: false },

  // Quads
  { name: "Barbell Squat", group: "quads", pattern: "squat", kit: "barbell", compound: true },
  { name: "Front Barbell Squat", group: "quads", pattern: "squat", kit: "barbell", compound: true },
  { name: "Barbell Hack Squat", group: "quads", pattern: "squat", kit: "barbell", compound: true },
  { name: "Zercher Squats", group: "quads", pattern: "squat", kit: "barbell", compound: true, demanding: true },
  { name: "Leg Press", group: "quads", pattern: "squat", kit: "machine", compound: true },
  { name: "Bodyweight Squat", group: "quads", pattern: "squat", kit: "bodyweight", compound: true },
  { name: "Bodyweight Walking Lunge", group: "quads", pattern: "lunge", kit: "bodyweight", compound: true },
  { name: "Leg Extensions", group: "quads", pattern: "kneeExtension", kit: "machine", compound: false },
  { name: "Weighted Sissy Squat", group: "quads", pattern: "kneeExtension", kit: "bodyweight", compound: false, demanding: true },

  // Hamstrings
  { name: "Romanian Deadlift", group: "hamstrings", pattern: "hinge", kit: "barbell", compound: true },
  { name: "Lying Leg Curls", group: "hamstrings", pattern: "kneeFlexion", kit: "machine", compound: false },
  { name: "Seated Leg Curl", group: "hamstrings", pattern: "kneeFlexion", kit: "machine", compound: false },
  { name: "Natural Glute Ham Raise", group: "hamstrings", pattern: "kneeFlexion", kit: "bodyweight", compound: true, demanding: true },

  // Glutes
  { name: "Barbell Hip Thrust", group: "glutes", pattern: "hipThrust", kit: "barbell", compound: true },
  { name: "Butt Lift (Bridge)", group: "glutes", pattern: "hipThrust", kit: "bodyweight", compound: true },
  { name: "Pull Through", group: "glutes", pattern: "hipExtension", kit: "cable", compound: true },
  { name: "One-Legged Cable Kickback", group: "glutes", pattern: "hipExtension", kit: "cable", compound: false },

  // Calves
  { name: "Standing Calf Raises", group: "calves", pattern: "calfRaise", kit: "machine", compound: false },
  { name: "Seated Calf Raise", group: "calves", pattern: "calfRaise", kit: "machine", compound: false },
  { name: "Calf Press On The Leg Press Machine", group: "calves", pattern: "calfRaise", kit: "machine", compound: false },
  { name: "Standing Dumbbell Calf Raise", group: "calves", pattern: "calfRaise", kit: "dumbbell", compound: false },
  { name: "Donkey Calf Raises", group: "calves", pattern: "calfRaise", kit: "bodyweight", compound: false },
];

/** Why you are asking for something else. */
export type SwapReason = "taken" | "noKit" | "tooHard";

export const SWAP_REASONS: { id: SwapReason; label: string; blurb: string }[] = [
  { id: "taken", label: "It's taken", blurb: "Someone's on it. Same muscle, a different station." },
  { id: "noKit", label: "Don't have it", blurb: "This gym hasn't got the kit. Options that need less." },
  { id: "tooHard", label: "Can't do it today", blurb: "Too hard, or it hurts. Something you can actually do." },
];

const KIT_PHRASE: Record<Kit, string> = {
  barbell: "with a barbell",
  dumbbell: "with dumbbells",
  machine: "on a machine",
  cable: "on the cables",
  bodyweight: "with just your bodyweight",
  plate: "with a plate",
};

/**
 * The nearest neighbours, used only as a last resort.
 *
 * If the hip thrust rack is taken there is no second glute movement in
 * the pool, and "nothing, sorry" is a worse answer than a hamstring
 * movement clearly labelled as not being the same thing.
 */
const NEARBY: Partial<Record<CoverageGroup, CoverageGroup[]>> = {
  glutes: ["hamstrings", "quads"],
  hamstrings: ["glutes", "lowerBack"],
  quads: ["glutes"],
  lowerBack: ["hamstrings"],
  forearms: ["biceps"],
  biceps: ["back"],
  triceps: ["chest"],
  chest: ["triceps"],
  back: ["biceps"],
  shoulders: ["chest"],
};

export interface Alternative {
  name: string;
  kit: Kit;
  /** One line on how it relates to what it replaces. Always shown. */
  why: string;
}

const BY_NAME = new Map(MOVEMENTS.map((m) => [normalizeName(m.name), m]));

/**
 * Resolve a written exercise name to a movement in the table.
 *
 * Splits say "Bench Press"; the table says "Barbell Bench Press - Medium
 * Grip". An exact normalised hit wins; otherwise the SHORTEST movement
 * whose name contains the query, so "squat" resolves to Barbell Squat
 * rather than Weighted Sissy Squat. Deterministic by construction —
 * there is no scoring threshold to drift.
 */
export function findMovement(name: string): Movement | null {
  const q = normalizeName(name);
  if (!q) return null;
  const exact = BY_NAME.get(q);
  if (exact) return exact;

  const contains = MOVEMENTS.filter((m) => {
    const n = normalizeName(m.name);
    return n.includes(q) || q.includes(n);
  });
  if (contains.length === 0) return null;
  return [...contains].sort((a, b) => a.name.length - b.name.length)[0];
}

function why(target: Movement, c: Movement): string {
  if (c.group !== target.group) {
    return `Not the same muscle — this works ${GROUP_LABEL[c.group].toLowerCase()} ${KIT_PHRASE[c.kit]}.`;
  }
  if (c.pattern === target.pattern) {
    return `Same movement, ${KIT_PHRASE[c.kit]}.`;
  }
  return `Different angle on the same muscle, ${KIT_PHRASE[c.kit]}.`;
}

function score(target: Movement, c: Movement, reason: SwapReason): number {
  let s = 0;
  if (c.pattern === target.pattern) s += 4;
  if (c.compound === target.compound) s += 2;
  if (c.group === target.group) s += 3;
  if (reason === "noKit" && (c.kit === "bodyweight" || c.kit === "dumbbell")) s += 1.5;
  if (reason === "tooHard" && (c.kit === "machine" || c.kit === "cable")) s += 1.5;
  if (reason === "taken" && c.kit === "bodyweight") s += 0.5;
  // Enough of a penalty to outweigh a pattern match: a glute-ham raise
  // is a true compound answer to a taken hip thrust and still the wrong
  // one to lead with for most people.
  if (c.demanding) s -= 2.5;
  return s;
}

/**
 * What to do instead, best first.
 *
 * Widens in three steps rather than returning nothing: same muscle with
 * different kit, then same muscle with any kit, then the nearest muscle.
 * Each step is only used if the one before it came up short, and the
 * `why` line always says which kind of answer this is — an empty sheet
 * would send the user back to standing next to an occupied machine.
 */
export function alternativesFor(
  name: string,
  reason: SwapReason,
  limit = 4,
): Alternative[] {
  const target = findMovement(name);
  if (!target) return [];

  const usable = (c: Movement) => !(reason === "tooHard" && c.demanding);
  const rank = (list: Movement[]) =>
    [...list]
      .map((m, i) => ({ m, i, s: score(target, m, reason) }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((x) => x.m);

  const sameGroup = MOVEMENTS.filter(
    (c) => c.name !== target.name && c.group === target.group && usable(c),
  );

  // Step 1 — the kit that's the problem is off the table. For "can't do
  // it today" the kit was never the problem, so nothing is excluded.
  const differentKit = reason === "tooHard" ? sameGroup : sameGroup.filter((c) => c.kit !== target.kit);

  const picked: Movement[] = rank(differentKit);

  // Step 2 — same muscle, same kit. Better than an empty answer when a
  // group only has two movements in it.
  if (picked.length < limit) {
    for (const m of rank(sameGroup)) {
      if (!picked.includes(m)) picked.push(m);
    }
  }

  // Step 3 — the nearest muscle, clearly labelled as not the same thing.
  // Ranked WITHIN each neighbour in turn, not across all of them: the
  // first neighbour listed is the closest one, and a bodyweight movement
  // for a more distant muscle should not outrank a loaded one for the
  // near muscle just because the sort liked its kit.
  for (const g of NEARBY[target.group] ?? []) {
    if (picked.length >= limit) break;
    const inGroup = MOVEMENTS.filter(
      (c) => c.group === g && usable(c) && (reason === "tooHard" || c.kit !== target.kit),
    );
    for (const m of rank(inGroup)) {
      if (!picked.includes(m)) picked.push(m);
    }
  }

  return picked.slice(0, limit).map((m) => ({ name: m.name, kit: m.kit, why: why(target, m) }));
}

/**
 * Alternatives for any written exercise, including ones outside the
 * table.
 *
 * A pasted split can contain anything. When the name isn't one of ours,
 * the bundled exercise index still knows what muscle it trains, and a
 * movement for that muscle is a far better answer than a shrug. Falls
 * back to the table's own matcher first because it is synchronous and
 * covers everything the app itself prescribes.
 */
export async function findAlternatives(
  name: string,
  reason: SwapReason,
  limit = 4,
): Promise<Alternative[]> {
  const direct = alternativesFor(name, reason, limit);
  if (direct.length > 0) return direct;

  const info = await findExercise(name);
  if (!info) return [];
  const group = info.p.map(muscleToGroup).find((g): g is CoverageGroup => g !== null);
  if (!group) return [];

  const pool = MOVEMENTS.filter(
    (m) => m.group === group && !(reason === "tooHard" && m.demanding),
  );
  const preferred = (m: Movement) =>
    (reason === "noKit" && (m.kit === "bodyweight" || m.kit === "dumbbell") ? 2 : 0) +
    (reason === "tooHard" && (m.kit === "machine" || m.kit === "cable") ? 2 : 0) +
    (m.compound ? 1 : 0) -
    (m.demanding ? 1 : 0);

  return [...pool]
    .map((m, i) => ({ m, i }))
    .sort((a, b) => preferred(b.m) - preferred(a.m) || a.i - b.i)
    .slice(0, limit)
    .map(({ m }) => ({
      name: m.name,
      kit: m.kit,
      why: `Trains the same muscle — ${GROUP_LABEL[group].toLowerCase()} ${KIT_PHRASE[m.kit]}.`,
    }));
}
