/**
 * Stacks — short blocks you can train on their own.
 *
 * The gap this fills: a split can be working and still miss things, and
 * the fix is not always "change programs". Sometimes you just want to
 * do fifteen minutes of core, or grip work, without touching a week
 * that is otherwise fine. And on a rest day, "I want to hit forearms and
 * nothing else" is a completely reasonable thing to want, which nothing
 * in the app previously answered.
 *
 * A stack is standalone by DEFAULT, not by law. `splitDayId` is optional
 * on a session, so training one creates a session that does not disturb
 * the weekly schedule and cannot shift the day rotation. If you want it
 * to become part of the program — and to count as a KEPT DAY, which is
 * where most of the rank's XP actually lives — you add it to your split
 * explicitly. See `stackToSplit.ts`. The two paths are deliberately
 * separate because they mean different things.
 *
 * THREE LEVELS, because "core stack" means something different to
 * someone in their first month than to someone who has trained for five
 * years. Levels are not decoration: the starter level stays on things
 * that can be done on day one, and the harder ones add both the
 * demanding movement and the volume. Nothing is gated — every level is
 * visible, so you pick rather than earn your way in.
 *
 * WHAT THE BLOCKS ARE MADE OF (the part worth not re-deriving):
 *
 *   - CORE trains the four jobs a midsection has, not four versions of
 *     one: resisting extension (plank, ab wheel), resisting rotation
 *     (Pallof press), resisting side bend (side plank), and flexing
 *     under load (cable crunch, hanging leg raise). Loaded flexion is
 *     the one most people skip and the one that responds.
 *   - GRIP trains flexion, extension, rotation and holds — four
 *     different capacities in the same forearm. It is DUMBBELL AND
 *     CABLE work: forearms respond to time under tension and higher
 *     reps, and every gym has dumbbells and a low pulley. No wrist
 *     roller. You have to buy one, and in the gyms that do have one it
 *     lives behind the front desk.
 *   - CALVES trains straight-knee and bent-knee separately, because the
 *     soleus is barely involved once the knee is locked out.
 *   - Everything else pairs a compound with the isolation the compound
 *     leaves short.
 *
 * Every movement resolves against the bundled exercise index, so the
 * app can always show you what it is asking for. Pinned by test — and
 * the test is written so it can fail, because an earlier version of it
 * could not.
 */

import type { CoverageGroup } from "./coverage";

export interface StackExercise {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
}

export type StackLevelId = "starter" | "standard" | "hard";

export const STACK_LEVELS: StackLevelId[] = ["starter", "standard", "hard"];

export const LEVEL_LABEL: Record<StackLevelId, string> = {
  starter: "Starter",
  standard: "Standard",
  hard: "Hard",
};

export interface StackLevel {
  id: StackLevelId;
  /** Who it's for, in one line. */
  summary: string;
  /** Roughly how long, in minutes. */
  minutes: number;
  exercises: StackExercise[];
}

export interface Stack {
  id: string;
  name: string;
  /** One line on what it is for. */
  summary: string;
  /** What it actually trains — used to match stacks to coverage gaps. */
  covers: CoverageGroup[];
  /** Always three, always in order: starter, standard, hard. */
  levels: StackLevel[];
}

const ex = (
  name: string,
  sets: number,
  repMin: number,
  repMax: number,
  restSec = 60,
): StackExercise => ({ name, sets, repMin, repMax, restSec });

const level = (
  id: StackLevelId,
  summary: string,
  minutes: number,
  exercises: StackExercise[],
): StackLevel => ({ id, summary, minutes, exercises });

export const STACKS: Stack[] = [
  {
    id: "core",
    name: "Core",
    summary: "All four jobs of a midsection, not four versions of one.",
    covers: ["abs"],
    levels: [
      level("starter", "Floor work. Nothing to hang from, nothing to load.", 10, [
        ex("Dead Bug", 3, 8, 12, 45),
        ex("Plank", 3, 20, 40, 45),
        ex("Side Bridge", 2, 20, 30, 45),
      ]),
      level("standard", "Adds loaded flexion and anti-rotation — the two most people skip.", 14, [
        ex("Cable Crunch", 3, 10, 15, 60),
        ex("Pallof Press", 3, 10, 12, 45),
        ex("Hanging Leg Raise", 3, 8, 15, 60),
        ex("Plank", 3, 30, 60, 45),
      ]),
      level("hard", "Heavier flexion, the ab wheel, and holds that hurt.", 20, [
        ex("Cable Crunch", 4, 10, 15, 60),
        ex("Hanging Leg Raise", 4, 10, 15, 60),
        ex("Ab Roller", 3, 8, 12, 60),
        ex("Pallof Press", 3, 10, 12, 45),
        ex("Side Bridge", 3, 30, 45, 45),
      ]),
    ],
  },
  {
    id: "grip",
    name: "Grip & forearms",
    summary: "Dumbbells and cables. Flexion, extension, rotation, holds.",
    covers: ["forearms"],
    levels: [
      level("starter", "Two dumbbells and a walk. Nothing to book, nothing to ask for.", 10, [
        ex("Seated Dumbbell Palms-Up Wrist Curl", 3, 12, 20, 45),
        ex("Standing Dumbbell Reverse Curl", 3, 12, 15, 45),
        ex("Farmer's Walk", 2, 30, 45, 75),
      ]),
      level("standard", "Both sides of the wrist, then the grip itself.", 15, [
        ex("Palms-Up Dumbbell Wrist Curl Over A Bench", 3, 12, 20, 45),
        ex("Palms-Down Dumbbell Wrist Curl Over A Bench", 3, 12, 20, 45),
        ex("Hammer Curls", 3, 10, 15, 45),
        ex("Farmer's Walk", 3, 30, 60, 75),
      ]),
      level("hard", "Constant cable tension end to end, then rotation, then holds.", 21, [
        ex("Cable Wrist Curl", 4, 15, 20, 45),
        ex("Palms-Down Dumbbell Wrist Curl Over A Bench", 3, 15, 20, 45),
        ex("Zottman Curl", 3, 10, 15, 45),
        ex("Plate Pinch", 3, 30, 60, 60),
        ex("Farmer's Walk", 3, 45, 60, 90),
      ]),
    ],
  },
  {
    id: "lower-back",
    name: "Lower back",
    summary: "Posterior chain work that squats and rows never quite cover.",
    covers: ["lowerBack"],
    levels: [
      level("starter", "Unloaded first — the spine gets the light version.", 10, [
        ex("Reverse Hyperextension", 3, 10, 15, 60),
        ex("Hyperextensions (Back Extensions)", 3, 12, 15, 60),
      ]),
      level("standard", "A hinge under load, then two ways to extend.", 15, [
        ex("Good Morning", 3, 8, 12, 90),
        ex("Hyperextensions (Back Extensions)", 3, 12, 15, 60),
        ex("Reverse Hyperextension", 3, 10, 15, 60),
      ]),
      level("hard", "Pulls from the floor. Only on a day your back is fresh.", 20, [
        ex("Barbell Deadlift", 3, 5, 8, 150),
        ex("Good Morning", 3, 8, 12, 90),
        ex("Reverse Hyperextension", 3, 12, 15, 60),
      ]),
    ],
  },
  {
    id: "arms",
    name: "Arms",
    summary: "Biceps and triceps, when the main session ran out of time.",
    covers: ["biceps", "triceps"],
    levels: [
      level("starter", "One curl, one extension, one for the brachialis.", 11, [
        ex("Incline Dumbbell Curl", 3, 10, 15, 45),
        ex("Triceps Pushdown", 3, 10, 15, 45),
        ex("Hammer Curls", 2, 10, 15, 45),
      ]),
      level("standard", "Two angles each — long head and short.", 16, [
        ex("Barbell Curl", 3, 8, 12, 60),
        ex("Incline Dumbbell Curl", 3, 10, 15, 45),
        ex("Triceps Pushdown", 3, 10, 15, 45),
        ex("Cable Rope Overhead Triceps Extension", 3, 10, 15, 45),
      ]),
      level("hard", "Heavier curls, dips carrying the triceps, cables to finish.", 21, [
        ex("Barbell Curl", 4, 6, 10, 75),
        ex("Hammer Curls", 3, 10, 15, 45),
        ex("Dips - Triceps Version", 3, 6, 12, 90),
        ex("Cable Rope Overhead Triceps Extension", 3, 12, 15, 45),
        ex("Triceps Pushdown", 3, 12, 20, 45),
      ]),
    ],
  },
  {
    id: "calves",
    name: "Calves",
    summary: "The one everybody skips. Straight knee and bent knee.",
    covers: ["calves"],
    levels: [
      level("starter", "Straight-knee work, high reps, full stretch at the bottom.", 9, [
        ex("Standing Calf Raises", 3, 12, 20, 45),
        ex("Seated Calf Raise", 2, 15, 20, 45),
      ]),
      level("standard", "Both knee angles — the soleus barely works when you're locked out.", 13, [
        ex("Standing Calf Raises", 4, 10, 15, 45),
        ex("Seated Calf Raise", 3, 12, 20, 45),
        ex("Calf Press On The Leg Press Machine", 2, 15, 20, 60),
      ]),
      level("hard", "Heavy standing work, then soleus and donkeys to failure.", 19, [
        ex("Standing Calf Raises", 5, 8, 12, 60),
        ex("Seated Calf Raise", 4, 15, 25, 45),
        ex("Donkey Calf Raises", 3, 12, 20, 45),
      ]),
    ],
  },
  {
    id: "shoulders-health",
    name: "Shoulders & upper back",
    summary: "Rear delts and pulling, to balance a press-heavy week.",
    covers: ["shoulders", "back"],
    levels: [
      level("starter", "The two raises that undo a week at a desk.", 10, [
        ex("Face Pull", 3, 12, 20, 45),
        ex("Side Lateral Raise", 3, 12, 20, 45),
      ]),
      level("standard", "Adds a horizontal pull and the rear delt on a machine.", 16, [
        ex("Face Pull", 3, 12, 20, 45),
        ex("Side Lateral Raise", 3, 12, 20, 45),
        ex("Reverse Machine Flyes", 3, 12, 20, 45),
        ex("Inverted Row", 3, 8, 15, 60),
      ]),
      level("hard", "More volume, and traps at the end.", 21, [
        ex("Face Pull", 4, 15, 20, 45),
        ex("Side Lateral Raise", 4, 12, 20, 45),
        ex("Reverse Machine Flyes", 3, 15, 20, 45),
        ex("Inverted Row", 4, 10, 15, 60),
        ex("Barbell Shrug Behind The Back", 3, 10, 15, 60),
      ]),
    ],
  },
  {
    id: "chest",
    name: "Chest",
    summary: "Pressing and a stretch, without a full push day.",
    covers: ["chest"],
    levels: [
      level("starter", "Bodyweight pressing, no spotter needed.", 11, [
        ex("Pushups", 3, 8, 15, 60),
        ex("Dumbbell Flyes", 3, 12, 15, 45),
      ]),
      level("standard", "Incline press, then two ways to finish the stretch.", 17, [
        ex("Incline Dumbbell Press", 3, 8, 12, 90),
        ex("Pushups", 3, 10, 20, 60),
        ex("Cable Crossover", 3, 12, 15, 45),
        ex("Dumbbell Flyes", 3, 12, 15, 45),
      ]),
      level("hard", "The bench leads, then incline, then cables.", 21, [
        ex("Barbell Bench Press - Medium Grip", 4, 6, 10, 120),
        ex("Incline Dumbbell Press", 3, 8, 12, 90),
        ex("Cable Crossover", 3, 12, 15, 45),
        ex("Pushups", 2, 10, 25, 60),
      ]),
    ],
  },
  {
    id: "back",
    name: "Back",
    summary: "Vertical and horizontal pulling in one short block.",
    covers: ["back"],
    levels: [
      level("starter", "Both directions, loaded as light as you like.", 12, [
        ex("Seated Cable Rows", 3, 10, 15, 60),
        ex("Wide-Grip Lat Pulldown", 3, 10, 15, 60),
      ]),
      level("standard", "Pulldown, one-arm row, cable row, then the lats alone.", 17, [
        ex("Wide-Grip Lat Pulldown", 3, 8, 12, 75),
        ex("One-Arm Dumbbell Row", 3, 8, 12, 60),
        ex("Seated Cable Rows", 3, 10, 15, 60),
        ex("Straight-Arm Dumbbell Pullover", 3, 12, 15, 45),
      ]),
      level("hard", "Pull-ups lead, barbell rows follow.", 21, [
        ex("Pullups", 4, 5, 10, 90),
        ex("Bent Over Barbell Row", 3, 6, 10, 120),
        ex("Seated Cable Rows", 3, 8, 12, 60),
        ex("Straight-Arm Dumbbell Pullover", 3, 12, 15, 45),
      ]),
    ],
  },
  {
    id: "posterior",
    name: "Glutes & hamstrings",
    summary: "The back of the legs, which quad-heavy weeks under-train.",
    covers: ["glutes", "hamstrings"],
    levels: [
      level("starter", "Thrusts, a curl machine and a bridge. No hinging under load.", 12, [
        ex("Barbell Hip Thrust", 3, 10, 15, 75),
        ex("Lying Leg Curls", 3, 10, 15, 60),
        ex("Butt Lift (Bridge)", 2, 15, 20, 45),
      ]),
      level("standard", "A hinge, a thrust, a curl and a pull-through — the full job.", 18, [
        ex("Romanian Deadlift", 3, 8, 12, 120),
        ex("Barbell Hip Thrust", 3, 8, 12, 90),
        ex("Seated Leg Curl", 3, 10, 15, 60),
        ex("Pull Through", 3, 12, 15, 45),
      ]),
      level("hard", "Heavier hinge, then glute-hams, which are brutal.", 22, [
        ex("Romanian Deadlift", 4, 6, 10, 120),
        ex("Barbell Hip Thrust", 4, 8, 12, 90),
        ex("Natural Glute Ham Raise", 3, 5, 10, 90),
        ex("One-Legged Cable Kickback", 3, 12, 15, 45),
      ]),
    ],
  },
  {
    id: "quads",
    name: "Quads",
    summary: "Front of the legs when you want legs but not a leg day.",
    covers: ["quads"],
    levels: [
      level("starter", "Machines only — nothing on your back.", 12, [
        ex("Leg Press", 3, 10, 15, 90),
        ex("Leg Extensions", 3, 12, 15, 45),
      ]),
      level("standard", "Squat first, then the machines that finish the job.", 18, [
        ex("Barbell Squat", 3, 6, 10, 150),
        ex("Leg Press", 3, 10, 15, 90),
        ex("Leg Extensions", 3, 12, 15, 45),
      ]),
      level("hard", "Heavy squats, then everything that stops you hiding.", 22, [
        ex("Barbell Squat", 4, 5, 8, 180),
        ex("Leg Press", 3, 12, 20, 90),
        ex("Leg Extensions", 3, 15, 20, 45),
        ex("Bodyweight Walking Lunge", 2, 12, 20, 60),
      ]),
    ],
  },
];

export function findStack(id: string): Stack | undefined {
  return STACKS.find((s) => s.id === id);
}

/** A level by id, falling back to standard rather than to nothing. */
export function stackLevel(stack: Stack, id: StackLevelId = "standard"): StackLevel {
  return stack.levels.find((l) => l.id === id) ?? stack.levels[1] ?? stack.levels[0];
}

/**
 * Stacks that would close the given gaps, best match first.
 *
 * Sorted by how much of the gap list a stack covers, so someone missing
 * abs and forearms is offered the two focused blocks rather than a
 * general one that touches neither squarely.
 */
export function stacksForGaps(gaps: readonly CoverageGroup[]): Stack[] {
  if (gaps.length === 0) return [];
  const wanted = new Set(gaps);
  return STACKS.map((s) => ({ s, hits: s.covers.filter((c) => wanted.has(c)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || stackLevel(a.s).minutes - stackLevel(b.s).minutes)
    .map((x) => x.s);
}

/** Every stack that trains this muscle group directly. */
export function stacksForGroup(group: CoverageGroup): Stack[] {
  return STACKS.filter((s) => s.covers.includes(group));
}

/** The groups any stack can train, in the order the stacks are listed. */
export function stackGroups(): CoverageGroup[] {
  return [...new Set(STACKS.flatMap((s) => s.covers))];
}

/**
 * The session snapshot a stack turns into.
 *
 * The level is in the name, because a stack session sits in the same log
 * as everything else and "Core stack" three times over tells you nothing
 * about which one you actually did.
 */
export function stackSnapshot(stack: Stack, levelId: StackLevelId = "standard") {
  const lvl = stackLevel(stack, levelId);
  return {
    dayName: `${stack.name} stack · ${LEVEL_LABEL[lvl.id]}`,
    exercises: lvl.exercises.map((e, i) => ({
      key: `${stack.id}:${lvl.id}:${i}`,
      name: e.name,
      sets: e.sets,
      repMin: e.repMin,
      repMax: e.repMax,
      rpeMin: null,
      rpeMax: null,
      restSec: e.restSec,
    })),
  };
}
