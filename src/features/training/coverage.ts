/**
 * Coverage — what a program is quietly not training.
 *
 * This exists because of a real complaint: an upper/lower split was
 * working, the lifter was getting bigger, and it still had holes in it.
 * Forearms, abs and lower back were never directly trained, and nothing
 * in the app said so. A program you are happy with can still be leaving
 * something out, and only the app is in a position to notice — the
 * whole point of logging every set is that the gap is derivable.
 *
 * Two sources are worth checking and they answer different questions:
 *
 *   - The SPLIT tells you what you were supposed to train. A hole here
 *     is a design gap and will never close on its own.
 *   - The LOG tells you what you actually trained. A hole here might
 *     just be a skipped day, so it is reported separately and more
 *     gently.
 *
 * Nothing here prescribes. It reports a gap and names movements that
 * would fill it; what to do about that stays the lifter's call.
 */

export type CoverageGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "lowerBack"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export const COVERAGE_GROUPS: CoverageGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "abs", "lowerBack", "quads", "hamstrings", "glutes", "calves",
];

export const GROUP_LABEL: Record<CoverageGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  lowerBack: "Lower back",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
};

/**
 * The source data uses seventeen labels; several are the same trainable
 * thing from a lifter's point of view. `lats`, `middle back` and `traps`
 * all mean "back day". Neck, adductors and abductors are deliberately
 * unmapped — nobody is owed a warning that they are not training their
 * neck, and a false alarm costs more than the omission.
 */
const MUSCLE_TO_GROUP: Record<string, CoverageGroup> = {
  chest: "chest",
  lats: "back",
  "middle back": "back",
  traps: "back",
  shoulders: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  abdominals: "abs",
  "lower back": "lowerBack",
  quadriceps: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  calves: "calves",
};

export function muscleToGroup(muscle: string): CoverageGroup | null {
  return MUSCLE_TO_GROUP[muscle.trim().toLowerCase()] ?? null;
}

/** What one movement trains, already resolved to groups. */
export interface MovementMuscles {
  name: string;
  /** Primary movers. */
  primary: string[];
  /** Assisting muscles. */
  secondary: string[];
}

export interface GroupCoverage {
  group: CoverageGroup;
  /** Movements that train this group directly. */
  direct: string[];
  /** Movements where it only assists. */
  indirect: string[];
}

export type Coverage = Record<CoverageGroup, GroupCoverage>;

export function emptyCoverage(): Coverage {
  const out = {} as Coverage;
  for (const g of COVERAGE_GROUPS) {
    out[g] = { group: g, direct: [], indirect: [] };
  }
  return out;
}

export function coverageOf(movements: readonly MovementMuscles[]): Coverage {
  const out = emptyCoverage();
  for (const m of movements) {
    const seenDirect = new Set<CoverageGroup>();
    for (const p of m.primary) {
      const g = muscleToGroup(p);
      if (!g) continue;
      seenDirect.add(g);
      if (!out[g].direct.includes(m.name)) out[g].direct.push(m.name);
    }
    for (const s of m.secondary) {
      const g = muscleToGroup(s);
      if (!g || seenDirect.has(g)) continue;
      if (!out[g].indirect.includes(m.name)) out[g].indirect.push(m.name);
    }
  }
  return out;
}

export type GapSeverity =
  /** Not trained at all, not even as an assisting muscle. */
  | "untrained"
  /** Only ever assists — never the target of a movement. */
  | "indirectOnly";

export interface Gap {
  group: CoverageGroup;
  label: string;
  severity: GapSeverity;
  /** Movements where it currently only assists, if any. */
  assistedBy: string[];
}

/**
 * Groups with no direct work.
 *
 * "Indirect only" is a real and common case worth separating: deadlifts
 * hit the forearms hard, but a lifter who wants bigger forearms is not
 * served by being told deadlifts count. Reporting it as a weaker gap
 * says the true thing without crying wolf.
 */
export function findGaps(coverage: Coverage): Gap[] {
  const gaps: Gap[] = [];
  for (const g of COVERAGE_GROUPS) {
    const c = coverage[g];
    if (c.direct.length > 0) continue;
    gaps.push({
      group: g,
      label: GROUP_LABEL[g],
      severity: c.indirect.length > 0 ? "indirectOnly" : "untrained",
      assistedBy: c.indirect.slice(0, 3),
    });
  }
  // Untrained before indirect-only: the harder omission is the one
  // worth reading first.
  return gaps.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "untrained" ? -1 : 1;
    return COVERAGE_GROUPS.indexOf(a.group) - COVERAGE_GROUPS.indexOf(b.group);
  });
}

/** One plain sentence naming the holes, or null when there are none. */
export function gapSentence(gaps: readonly Gap[]): string | null {
  const hard = gaps.filter((g) => g.severity === "untrained").map((g) => g.label.toLowerCase());
  const soft = gaps.filter((g) => g.severity === "indirectOnly").map((g) => g.label.toLowerCase());
  const list = (xs: string[]) =>
    xs.length <= 1
      ? xs[0] ?? ""
      : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

  // "Forearms and glutes only ever assists" is wrong, and this string is
  // shown to the user on the program-review screen.
  const assist = soft.length === 1 ? "assists" : "assist";
  const sentenceCase = (s: string) => `${s[0].toUpperCase()}${s.slice(1)}`;

  if (hard.length === 0 && soft.length === 0) return null;
  if (hard.length > 0 && soft.length > 0) {
    return `Nothing in this trains ${list(hard)}. ${sentenceCase(list(soft))} only ever ${assist}.`;
  }
  if (hard.length > 0) return `Nothing in this trains ${list(hard)}.`;
  return `${sentenceCase(list(soft))} only ever ${assist} — never trained directly.`;
}
