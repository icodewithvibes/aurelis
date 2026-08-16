/**
 * Building a split instead of picking one.
 *
 * Fourteen templates cover the common cases and none of them cover
 * yours exactly. The reported case: an upper/lower week that was
 * genuinely working — size was going up — but never trained forearms,
 * abs or lower back. The right answer there is not "switch to a
 * different template", it is "keep what is working and close the
 * holes".
 *
 * So this generates a program from goal + days + equipment + the gaps
 * found in what you are already doing, and emits ASF, which is the same
 * format the templates and the paste-your-own importer use. Nothing
 * downstream needs to know a split was generated rather than chosen.
 *
 * Every movement it can select is one with bundled art, so a generated
 * program can always show you what it is asking for.
 */

import { STEP_LB } from "../training/progression";
import { GROUP_LABEL, type CoverageGroup } from "../training/coverage";
import type { Goal } from "./goals";
import type { Equipment, Experience } from "./recommend";

export interface MovementSpec {
  name: string;
  group: CoverageGroup;
  /** Multi-joint movements go first in a session. */
  compound: boolean;
  /** Needs a barbell/rack — excluded for bodyweight setups. */
  needsBarbell: boolean;
  /** Works with nothing but a floor. */
  bodyweight: boolean;
}

/**
 * The selectable pool. Deliberately small and entirely made of
 * movements this app has art for — a generated program that cannot
 * show you the movement is worse than a template that can.
 */
export const POOL: MovementSpec[] = [
  // Chest
  { name: "Barbell Bench Press - Medium Grip", group: "chest", compound: true, needsBarbell: true, bodyweight: false },
  { name: "Incline Dumbbell Press", group: "chest", compound: true, needsBarbell: false, bodyweight: false },
  { name: "Dumbbell Flyes", group: "chest", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Pushups", group: "chest", compound: true, needsBarbell: false, bodyweight: true },
  // Back
  { name: "Bent Over Barbell Row", group: "back", compound: true, needsBarbell: true, bodyweight: false },
  { name: "Wide-Grip Lat Pulldown", group: "back", compound: true, needsBarbell: false, bodyweight: false },
  { name: "One-Arm Dumbbell Row", group: "back", compound: true, needsBarbell: false, bodyweight: false },
  { name: "Pullups", group: "back", compound: true, needsBarbell: false, bodyweight: true },
  { name: "Inverted Row", group: "back", compound: true, needsBarbell: false, bodyweight: true },
  // Shoulders
  { name: "Barbell Shoulder Press", group: "shoulders", compound: true, needsBarbell: true, bodyweight: false },
  { name: "Dumbbell Shoulder Press", group: "shoulders", compound: true, needsBarbell: false, bodyweight: false },
  { name: "Side Lateral Raise", group: "shoulders", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Face Pull", group: "shoulders", compound: false, needsBarbell: false, bodyweight: false },
  // Arms
  { name: "Barbell Curl", group: "biceps", compound: false, needsBarbell: true, bodyweight: false },
  { name: "Hammer Curls", group: "biceps", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Incline Dumbbell Curl", group: "biceps", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Triceps Pushdown", group: "triceps", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Cable Rope Overhead Triceps Extension", group: "triceps", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Dips - Triceps Version", group: "triceps", compound: true, needsBarbell: false, bodyweight: true },
  // Forearms
  { name: "Wrist Roller", group: "forearms", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Palms-Up Barbell Wrist Curl Over A Bench", group: "forearms", compound: false, needsBarbell: true, bodyweight: false },
  { name: "Palms-Down Wrist Curl Over A Bench", group: "forearms", compound: false, needsBarbell: true, bodyweight: false },
  { name: "Plate Pinch", group: "forearms", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Farmers Walk", group: "forearms", compound: true, needsBarbell: false, bodyweight: false },
  // Abs
  { name: "Hanging Leg Raise", group: "abs", compound: false, needsBarbell: false, bodyweight: true },
  { name: "Plank", group: "abs", compound: false, needsBarbell: false, bodyweight: true },
  { name: "Mountain Climbers", group: "abs", compound: false, needsBarbell: false, bodyweight: true },
  // Lower back
  { name: "Reverse Hyperextension", group: "lowerBack", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Good Morning", group: "lowerBack", compound: true, needsBarbell: true, bodyweight: false },
  { name: "Barbell Deadlift", group: "lowerBack", compound: true, needsBarbell: true, bodyweight: false },
  // Legs
  { name: "Barbell Squat", group: "quads", compound: true, needsBarbell: true, bodyweight: false },
  { name: "Front Barbell Squat", group: "quads", compound: true, needsBarbell: true, bodyweight: false },
  { name: "Leg Press", group: "quads", compound: true, needsBarbell: false, bodyweight: false },
  { name: "Leg Extensions", group: "quads", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Bodyweight Squat", group: "quads", compound: true, needsBarbell: false, bodyweight: true },
  { name: "Bodyweight Walking Lunge", group: "quads", compound: true, needsBarbell: false, bodyweight: true },
  { name: "Romanian Deadlift", group: "hamstrings", compound: true, needsBarbell: true, bodyweight: false },
  { name: "Lying Leg Curls", group: "hamstrings", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Seated Leg Curl", group: "hamstrings", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Natural Glute Ham Raise", group: "hamstrings", compound: true, needsBarbell: false, bodyweight: true },
  { name: "Barbell Hip Thrust", group: "glutes", compound: true, needsBarbell: true, bodyweight: false },
  { name: "Standing Calf Raises", group: "calves", compound: false, needsBarbell: false, bodyweight: false },
  { name: "Seated Calf Raise", group: "calves", compound: false, needsBarbell: false, bodyweight: false },
];

/** Rep prescription per goal. Ordinary practice, stated as such. */
const REPS: Record<Goal, { compound: [number, number]; isolation: [number, number]; rest: number }> = {
  strength: { compound: [4, 6], isolation: [6, 10], rest: 180 },
  muscle: { compound: [6, 10], isolation: [10, 15], rest: 120 },
  lean: { compound: [8, 12], isolation: [12, 15], rest: 75 },
  endurance: { compound: [10, 15], isolation: [12, 20], rest: 60 },
  health: { compound: [8, 12], isolation: [10, 15], rest: 90 },
};

/** Which groups a day of each kind is responsible for. */
const DAY_PLANS: Record<string, CoverageGroup[]> = {
  Upper: ["chest", "back", "shoulders", "triceps", "biceps"],
  Lower: ["quads", "hamstrings", "glutes", "calves"],
  Push: ["chest", "shoulders", "triceps"],
  Pull: ["back", "biceps", "forearms"],
  Legs: ["quads", "hamstrings", "glutes", "calves"],
  "Full Body": ["quads", "chest", "back", "shoulders", "hamstrings"],
};

/** Day templates by weekly frequency, with rest built in. */
const WEEK_SHAPES: Record<number, { days: string[]; schedule: string[] }> = {
  2: { days: ["Full Body", "Full Body"], schedule: ["Tue", "Sat"] },
  3: { days: ["Full Body", "Full Body", "Full Body"], schedule: ["Mon", "Wed", "Fri"] },
  4: { days: ["Upper", "Lower", "Upper", "Lower"], schedule: ["Mon", "Tue", "Thu", "Fri"] },
  5: { days: ["Push", "Pull", "Legs", "Upper", "Lower"], schedule: ["Mon", "Tue", "Wed", "Fri", "Sat"] },
  6: { days: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"], schedule: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
};

export interface BuildRequest {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  equipment: Equipment;
  /** Groups to make sure appear, e.g. gaps in the current program. */
  mustInclude?: CoverageGroup[];
  name?: string;
}

export interface BuiltSplit {
  name: string;
  asf: string;
  /** Plain sentences explaining the shape. */
  notes: string[];
  /** Groups deliberately added to close a gap. */
  closed: CoverageGroup[];
}

function allowed(m: MovementSpec, equipment: Equipment): boolean {
  if (equipment === "bodyweight") return m.bodyweight;
  if (equipment === "home") return !m.needsBarbell || m.compound;
  return true;
}

/**
 * Build the program.
 *
 * Gap-closing work is placed FIRST among the accessories on the day it
 * belongs to, because the thing you keep skipping is the thing that
 * ends up last in a session and then gets dropped when time runs out.
 */
export function buildSplit(req: BuildRequest): BuiltSplit {
  const days = Math.min(6, Math.max(2, Math.round(req.daysPerWeek)));
  const shape = WEEK_SHAPES[days];
  const reps = REPS[req.goal];
  const mustInclude = [...new Set(req.mustInclude ?? [])];
  const pool = POOL.filter((m) => allowed(m, req.equipment));

  // Beginners get fewer movements per session; the limiting factor is
  // practice quality, not volume.
  const perDay = req.experience === "new" ? 4 : req.experience === "returning" ? 5 : 6;

  const used = new Set<string>();
  const closed: CoverageGroup[] = [];

  /*
   * Variety is preferred but never at the cost of an empty day.
   *
   * With a full gym the pool is wide enough that nothing repeats across
   * a week. With bodyweight only it is not: a four-day week asks for two
   * lower-body days and there are barely enough floor movements for one,
   * which produced a session containing no exercises at all. Repeating
   * a squat twice a week is completely ordinary; an empty training day
   * is a broken program.
   */
  const pick = (
    group: CoverageGroup,
    wantCompound?: boolean,
    allowRepeat = false,
  ): MovementSpec | null => {
    const inGroup = pool.filter((m) => m.group === group);
    const chosen =
      inGroup.find((m) => !used.has(m.name) && (wantCompound === undefined || m.compound === wantCompound)) ??
      inGroup.find((m) => !used.has(m.name)) ??
      (allowRepeat ? inGroup[0] ?? null : null);
    if (chosen) used.add(chosen.name);
    return chosen;
  };

  const lines: string[] = [];
  const name = req.name ?? `Custom ${days}×`;
  lines.push(`SPLIT: ${name}`);
  lines.push(`SCHEDULE: ${shape.schedule.join(", ")}`);
  lines.push("");

  // Spread the required groups across days so no single session becomes
  // a dumping ground for everything that was missing.
  const pendingGaps = [...mustInclude];

  shape.days.forEach((dayKind, i) => {
    const label = shape.days.filter((d) => d === dayKind).length > 1
      ? `${dayKind} ${String.fromCharCode(65 + shape.days.slice(0, i).filter((d) => d === dayKind).length)}`
      : dayKind;
    lines.push(`DAY: ${label}`);

    const groups = DAY_PLANS[dayKind] ?? DAY_PLANS["Full Body"];
    const chosen: MovementSpec[] = [];

    // Gap work first among the accessories, and only where it fits the
    // day — abs and lower back can go anywhere, arms belong on upper.
    const gapsForToday = pendingGaps.filter(
      (g) => groups.includes(g) || g === "abs" || g === "lowerBack" || g === "forearms",
    );
    for (const g of gapsForToday) {
      if (chosen.length >= perDay) break;
      const m = pick(g);
      if (!m) continue;
      chosen.push(m);
      closed.push(g);
      pendingGaps.splice(pendingGaps.indexOf(g), 1);
    }

    // Then the day's own job, compounds before isolation.
    for (const g of groups) {
      if (chosen.length >= perDay) break;
      const m = pick(g, true) ?? pick(g);
      if (m) chosen.push(m);
    }
    for (const g of groups) {
      if (chosen.length >= perDay) break;
      const m = pick(g);
      if (m) chosen.push(m);
    }

    // Last resort: a small pool (bodyweight, especially) can exhaust
    // itself before a day is filled. Repeat rather than emit a day with
    // nothing in it.
    if (chosen.length === 0) {
      for (const g of groups) {
        const m = pick(g, undefined, true);
        if (m && !chosen.includes(m)) chosen.push(m);
        if (chosen.length >= Math.min(perDay, 3)) break;
      }
    }

    chosen
      .sort((a, b) => Number(b.compound) - Number(a.compound))
      .forEach((m) => {
        const [lo, hi] = m.compound ? reps.compound : reps.isolation;
        const sets = m.compound ? (req.goal === "strength" ? 4 : 3) : 3;
        lines.push(`- ${m.name} | ${sets} | ${lo}-${hi} | Rest ${m.compound ? reps.rest : Math.round(reps.rest * 0.7)}s`);
      });

    lines.push("");
  });

  const notes: string[] = [];
  notes.push(
    `${days} sessions a week on ${shape.schedule.join(", ")} — the other ${7 - days} days are rest.`,
  );
  notes.push(
    `Rep ranges are set for ${req.goal === "strength" ? "strength: low reps, long rests" : req.goal === "muscle" ? "size: moderate reps, moderate rests" : req.goal === "lean" ? "leaning out: higher reps, shorter rests" : req.goal === "endurance" ? "conditioning: high reps, short rests" : "sustainability: moderate throughout"}.`,
  );
  if (closed.length > 0) {
    const labels = [...new Set(closed)].map((g) => GROUP_LABEL[g].toLowerCase());
    notes.push(
      `Added direct work for ${labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`}, which your current program never trains. It is placed early in the session, because the thing you keep skipping is the thing that ends up last.`,
    );
  }
  if (req.equipment === "bodyweight") {
    notes.push("Nothing in it needs a loaded barbell.");
  }
  notes.push(
    `Weights are yours to set — the app never invents a starting number. Add ${STEP_LB} lb when you hit the top of the range on every set, once the lift has had a rest day.`,
  );

  return { name, asf: lines.join("\n").trim(), notes, closed: [...new Set(closed)] };
}
