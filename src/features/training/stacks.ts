/**
 * Stacks — short blocks you can train on their own.
 *
 * The gap this fills: a split can be working and still miss things, and
 * the fix is not always "change programs". Sometimes you just want to
 * do fifteen minutes of core, or grip work, without touching a week
 * that is otherwise fine.
 *
 * A stack is deliberately NOT part of your split. It creates a
 * standalone session — `splitDayId` is optional on a session and the
 * session carries its own snapshot, so a stack needs no split day, does
 * not disturb the weekly schedule, and cannot shift the day rotation.
 * It still logs sets, still counts toward the rank, still feeds
 * progression, because it is a real session in every other respect.
 *
 * Every movement here has bundled art, so a stack can always show you
 * what it is asking for.
 */

import type { CoverageGroup } from "./coverage";

export interface StackExercise {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
}

export interface Stack {
  id: string;
  name: string;
  /** One line on what it is for. */
  summary: string;
  /** Roughly how long, in minutes. */
  minutes: number;
  /** What it actually trains — used to match stacks to coverage gaps. */
  covers: CoverageGroup[];
  exercises: StackExercise[];
}

const ex = (
  name: string,
  sets: number,
  repMin: number,
  repMax: number,
  restSec = 60,
): StackExercise => ({ name, sets, repMin, repMax, restSec });

export const STACKS: Stack[] = [
  {
    id: "core",
    name: "Core",
    summary: "Direct abdominal work. The thing most splits leave out.",
    minutes: 12,
    covers: ["abs"],
    exercises: [
      ex("Hanging Leg Raise", 3, 8, 15),
      ex("Plank", 3, 30, 60, 45),
      ex("Mountain Climbers", 3, 20, 30, 45),
    ],
  },
  {
    id: "grip",
    name: "Grip & forearms",
    summary: "Forearms trained directly, not just as whatever holds the bar.",
    minutes: 10,
    covers: ["forearms"],
    exercises: [
      ex("Wrist Roller", 3, 8, 12),
      ex("Plate Pinch", 3, 20, 45, 60),
      ex("Farmers Walk", 3, 30, 60, 90),
    ],
  },
  {
    id: "lower-back",
    name: "Lower back",
    summary: "Posterior chain work that squats and rows never quite cover.",
    minutes: 12,
    covers: ["lowerBack"],
    exercises: [
      ex("Reverse Hyperextension", 3, 10, 15),
      ex("Good Morning", 3, 8, 12, 90),
    ],
  },
  {
    id: "arms",
    name: "Arms",
    summary: "Biceps and triceps, when the main session ran out of time.",
    minutes: 15,
    covers: ["biceps", "triceps"],
    exercises: [
      ex("Barbell Curl", 3, 8, 12),
      ex("Incline Dumbbell Curl", 3, 10, 15),
      ex("Triceps Pushdown", 3, 10, 15),
      ex("Cable Rope Overhead Triceps Extension", 3, 10, 15),
    ],
  },
  {
    id: "calves",
    name: "Calves",
    summary: "The one everybody skips.",
    minutes: 8,
    covers: ["calves"],
    exercises: [
      ex("Standing Calf Raises", 4, 10, 15, 45),
      ex("Seated Calf Raise", 3, 12, 20, 45),
    ],
  },
  {
    id: "shoulders-health",
    name: "Shoulders & upper back",
    summary: "Rear delts and pulling, to balance a press-heavy week.",
    minutes: 12,
    covers: ["shoulders", "back"],
    exercises: [
      ex("Face Pull", 3, 12, 20, 45),
      ex("Side Lateral Raise", 3, 12, 20, 45),
      ex("Inverted Row", 3, 8, 15),
    ],
  },
];

export function findStack(id: string): Stack | undefined {
  return STACKS.find((s) => s.id === id);
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
    .sort((a, b) => b.hits - a.hits || a.s.minutes - b.s.minutes)
    .map((x) => x.s);
}

/** The session snapshot a stack turns into. */
export function stackSnapshot(stack: Stack) {
  return {
    dayName: `${stack.name} stack`,
    exercises: stack.exercises.map((e, i) => ({
      key: `${stack.id}:${i}`,
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
