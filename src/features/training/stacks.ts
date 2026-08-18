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
 * A stack is deliberately NOT part of your split. It creates a
 * standalone session — `splitDayId` is optional on a session and the
 * session carries its own snapshot, so a stack needs no split day, does
 * not disturb the weekly schedule, and cannot shift the day rotation.
 * It still logs sets, still counts toward the rank, still feeds
 * progression, because it is a real session in every other respect.
 *
 * THREE LEVELS, because "core stack" means something different to
 * someone in their first month than to someone who has been training
 * for five years. Levels are not decoration: the harder ones add the
 * demanding movement (hanging leg raises, dips, glute-ham raises) and
 * the volume, while the starter level stays on things that can be done
 * on day one. Nothing is hidden — every level is visible, so you pick
 * rather than earn your way in.
 *
 * How the blocks are composed:
 *
 *   - CORE covers the three jobs a midsection has — bracing against
 *     extension (planks), resisting movement while the limbs move
 *     (mountain climbers), and flexing under load (hanging leg raises).
 *     Picking three crunch variants would train one of the three.
 *   - GRIP covers flexion, extension, pinch and carry, which are four
 *     different capacities in the same forearm. Wrist curls alone build
 *     one of them. There is NO wrist roller in here: it is the one
 *     piece of kit you have to go and buy, and most gyms don't have one.
 *   - CALVES trains straight-knee and bent-knee separately, because the
 *     soleus is barely involved when the knee is locked out.
 *   - Everything else pairs a compound with the isolation the compound
 *     leaves short.
 *
 * Every movement here has bundled art, so a stack can always show you
 * what it is asking for — pinned by test, since the whole point is that
 * someone can train something they have never trained before.
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
    summary: "Direct abdominal work. The thing most splits leave out.",
    covers: ["abs"],
    levels: [
      level("starter", "Nothing that needs a bar to hang from.", 8, [
        ex("Plank", 3, 20, 40, 45),
        ex("Mountain Climbers", 3, 20, 30, 45),
      ]),
      level("standard", "Brace, resist, and flex under load — all three jobs.", 12, [
        ex("Hanging Leg Raise", 3, 8, 15),
        ex("Plank", 3, 30, 60, 45),
        ex("Mountain Climbers", 3, 20, 30, 45),
      ]),
      level("hard", "Same three jobs, more of them, longer holds.", 17, [
        ex("Hanging Leg Raise", 4, 10, 15),
        ex("Plank", 4, 45, 75, 45),
        ex("Mountain Climbers", 4, 30, 40, 45),
      ]),
    ],
  },
  {
    id: "grip",
    name: "Grip & forearms",
    summary: "Forearms trained directly, not just as whatever holds the bar.",
    covers: ["forearms"],
    levels: [
      level("starter", "Flexors, extensors, and a carry. Dumbbells only.", 9, [
        ex("Standing Dumbbell Reverse Curl", 3, 10, 15, 45),
        ex("Palms-Up Barbell Wrist Curl Over A Bench", 3, 12, 20, 45),
        ex("Farmers Walk", 2, 30, 45, 75),
      ]),
      level("standard", "Both sides of the wrist, plus pinch and carry.", 13, [
        ex("Palms-Up Barbell Wrist Curl Over A Bench", 3, 12, 20, 45),
        ex("Palms-Down Wrist Curl Over A Bench", 3, 12, 20, 45),
        ex("Plate Pinch", 3, 20, 45, 60),
        ex("Farmers Walk", 3, 30, 60, 75),
      ]),
      level("hard", "Finger curls at the end, when the rest stops being hard.", 17, [
        ex("Finger Curls", 3, 12, 20, 45),
        ex("Palms-Down Wrist Curl Over A Bench", 3, 15, 20, 45),
        ex("Plate Pinch", 3, 30, 60, 60),
        ex("Farmers Walk", 3, 45, 60, 90),
      ]),
    ],
  },
  {
    id: "lower-back",
    name: "Lower back",
    summary: "Posterior chain work that squats and rows never quite cover.",
    covers: ["lowerBack"],
    levels: [
      level("starter", "Unloaded first — the spine gets the light version.", 9, [
        ex("Reverse Hyperextension", 3, 10, 15, 60),
        ex("Good Morning", 2, 8, 12, 90),
      ]),
      level("standard", "A hinge under load, then the machine to finish.", 12, [
        ex("Good Morning", 3, 8, 12, 90),
        ex("Reverse Hyperextension", 3, 10, 15, 60),
      ]),
      level("hard", "Pulls from the floor. Only on a day your back is fresh.", 18, [
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
      level("starter", "One for each, nothing to learn.", 9, [
        ex("Incline Dumbbell Curl", 3, 10, 15, 45),
        ex("Triceps Pushdown", 3, 10, 15, 45),
      ]),
      level("standard", "Two angles each — long head and short.", 15, [
        ex("Barbell Curl", 3, 8, 12),
        ex("Incline Dumbbell Curl", 3, 10, 15, 45),
        ex("Triceps Pushdown", 3, 10, 15, 45),
        ex("Cable Rope Overhead Triceps Extension", 3, 10, 15, 45),
      ]),
      level("hard", "Heavier curls and dips carrying the triceps.", 18, [
        ex("Barbell Curl", 4, 6, 10, 75),
        ex("Hammer Curls", 3, 10, 15, 45),
        ex("Dips - Triceps Version", 3, 6, 12, 90),
        ex("Cable Rope Overhead Triceps Extension", 3, 12, 15, 45),
      ]),
    ],
  },
  {
    id: "calves",
    name: "Calves",
    summary: "The one everybody skips.",
    covers: ["calves"],
    levels: [
      level("starter", "Straight-knee only, high reps.", 6, [
        ex("Standing Calf Raises", 3, 12, 20, 45),
      ]),
      level("standard", "Straight knee and bent knee — two different muscles.", 9, [
        ex("Standing Calf Raises", 4, 10, 15, 45),
        ex("Seated Calf Raise", 3, 12, 20, 45),
      ]),
      level("hard", "Heavy standing work, then soleus to failure.", 14, [
        ex("Standing Calf Raises", 5, 8, 12, 60),
        ex("Seated Calf Raise", 4, 15, 25, 45),
      ]),
    ],
  },
  {
    id: "shoulders-health",
    name: "Shoulders & upper back",
    summary: "Rear delts and pulling, to balance a press-heavy week.",
    covers: ["shoulders", "back"],
    levels: [
      level("starter", "The two raises that fix a rounded desk posture.", 9, [
        ex("Face Pull", 3, 12, 20, 45),
        ex("Side Lateral Raise", 3, 12, 20, 45),
      ]),
      level("standard", "Adds a horizontal pull to the two raises.", 13, [
        ex("Face Pull", 3, 12, 20, 45),
        ex("Side Lateral Raise", 3, 12, 20, 45),
        ex("Inverted Row", 3, 8, 15),
      ]),
      level("hard", "More volume, and traps at the end.", 18, [
        ex("Face Pull", 4, 15, 20, 45),
        ex("Side Lateral Raise", 4, 12, 20, 45),
        ex("Inverted Row", 4, 10, 15),
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
      level("starter", "Bodyweight pressing, no spotter needed.", 10, [
        ex("Pushups", 3, 8, 15, 60),
        ex("Dumbbell Flyes", 2, 12, 15, 45),
      ]),
      level("standard", "Incline press first, flyes to finish.", 15, [
        ex("Incline Dumbbell Press", 3, 8, 12, 90),
        ex("Pushups", 3, 10, 20, 60),
        ex("Dumbbell Flyes", 3, 12, 15, 45),
      ]),
      level("hard", "The bench leads, then incline, then the stretch.", 20, [
        ex("Barbell Bench Press - Medium Grip", 4, 6, 10, 120),
        ex("Incline Dumbbell Press", 3, 8, 12, 90),
        ex("Dumbbell Flyes", 3, 12, 15, 45),
      ]),
    ],
  },
  {
    id: "back",
    name: "Back",
    summary: "Vertical and horizontal pulling in one short block.",
    covers: ["back"],
    levels: [
      level("starter", "Both directions, both on a machine you can load lightly.", 11, [
        ex("Seated Cable Rows", 3, 10, 15, 60),
        ex("Wide-Grip Lat Pulldown", 3, 10, 15, 60),
      ]),
      level("standard", "Pulldown, one-arm row, cable row.", 16, [
        ex("Wide-Grip Lat Pulldown", 3, 8, 12, 75),
        ex("One-Arm Dumbbell Row", 3, 8, 12, 60),
        ex("Seated Cable Rows", 3, 10, 15, 60),
      ]),
      level("hard", "Pull-ups lead, barbell rows follow.", 20, [
        ex("Pullups", 4, 5, 10, 90),
        ex("Bent Over Barbell Row", 3, 6, 10, 120),
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
      level("starter", "Thrusts and a curl machine. No hinging under load.", 11, [
        ex("Barbell Hip Thrust", 3, 10, 15, 75),
        ex("Lying Leg Curls", 3, 10, 15, 60),
      ]),
      level("standard", "A hinge, a thrust, and a curl — the full job.", 16, [
        ex("Romanian Deadlift", 3, 8, 12, 120),
        ex("Barbell Hip Thrust", 3, 8, 12, 90),
        ex("Seated Leg Curl", 3, 10, 15, 60),
      ]),
      level("hard", "Heavier hinge, then glute-hams, which are brutal.", 20, [
        ex("Romanian Deadlift", 4, 6, 10, 120),
        ex("Barbell Hip Thrust", 4, 8, 12, 90),
        ex("Natural Glute Ham Raise", 3, 5, 10, 90),
      ]),
    ],
  },
  {
    id: "quads",
    name: "Quads",
    summary: "Front of the legs when you want legs but not a leg day.",
    covers: ["quads"],
    levels: [
      level("starter", "Machines only — nothing on your back.", 11, [
        ex("Leg Press", 3, 10, 15, 90),
        ex("Leg Extensions", 3, 12, 15, 45),
      ]),
      level("standard", "Squat first, then the machines that finish the job.", 18, [
        ex("Barbell Squat", 3, 6, 10, 150),
        ex("Leg Press", 3, 10, 15, 90),
        ex("Leg Extensions", 3, 12, 15, 45),
      ]),
      level("hard", "Heavy squats, extensions to failure.", 20, [
        ex("Barbell Squat", 4, 5, 8, 180),
        ex("Leg Extensions", 3, 15, 20, 45),
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
    .sort(
      (a, b) =>
        b.hits - a.hits || stackLevel(a.s).minutes - stackLevel(b.s).minutes,
    )
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
