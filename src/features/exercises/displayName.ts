/**
 * Display names — what a lift is called on screen.
 *
 * The exercise database names things for a database: "Barbell Bench
 * Press - Medium Grip", "Dips - Triceps Version", "Rowing, Stationary".
 * Precise, and nothing anyone says in a gym.
 *
 * DISPLAY ONLY. The stored `exerciseName` on every set log is unchanged
 * and stays the database name, because that string is the key that
 * per-lift history, PR matching and the progression engine all join on.
 * Rewriting it would sever every logged set from its own history and
 * silently reset people's progress. This maps at the edge, on render,
 * and nowhere else.
 *
 * The explicit table covers the movements the shipped splits use, so
 * those are reviewed rather than guessed. Everything else falls through
 * to `tidyName`, which only removes the database's own formatting
 * clutter and never renames anything.
 */

/** Reviewed names for the lifts the split library actually uses. */
const DISPLAY_NAMES: Record<string, string> = {
  "Barbell Bench Press - Medium Grip": "Bench Press",
  /*
   * Two keys for one lift, on purpose. The split library writes
   * "Barbell Incline Bench Press Medium-Grip" (which is what lands in
   * setLogs and so what Proof and the timeline render), while the
   * exercise database calls the same movement "…Press - Medium Grip"
   * (which is what the photo sheet renders). Both strings are real and
   * both reach a screen, so both are mapped.
   */
  "Barbell Incline Bench Press Medium-Grip": "Incline Bench Press",
  "Barbell Incline Bench Press - Medium Grip": "Incline Bench Press",
  "Barbell Squat": "Back Squat",
  "Front Barbell Squat": "Front Squat",
  "Barbell Deadlift": "Deadlift",
  "Barbell Shoulder Press": "Overhead Press",
  "Bent Over Barbell Row": "Barbell Row",
  "Wide-Grip Lat Pulldown": "Lat Pulldown",
  "Dips - Triceps Version": "Triceps Dips",
  "Side Lateral Raise": "Lateral Raise",
  "Leg Extensions": "Leg Extension",
  "Lying Leg Curls": "Lying Leg Curl",
  "Seated Cable Rows": "Seated Cable Row",
  "Standing Calf Raises": "Standing Calf Raise",
  "Hammer Curls": "Hammer Curl",
  "Dumbbell Flyes": "Dumbbell Flye",
  "Bodyweight Walking Lunge": "Walking Lunge",
  "Rowing, Stationary": "Rowing Machine",
  "Elliptical Trainer": "Elliptical",
  Pullups: "Pull-Up",
  Pushups: "Push-Up",
  "Straight-Arm Dumbbell Pullover": "Dumbbell Pullover",
  "Natural Glute Ham Raise": "Glute-Ham Raise",
  "Reverse Hyperextension": "Reverse Hyper",
  "Weighted Sissy Squat": "Sissy Squat",
  "Zercher Squats": "Zercher Squat",
  "Jefferson Squats": "Jefferson Squat",
  "Barbell Hack Squat": "Hack Squat",
  "Barbell Hip Thrust": "Hip Thrust",
  "Barbell Guillotine Bench Press": "Guillotine Press",
  "Standing Barbell Press Behind Neck": "Behind-the-Neck Press",
  "Barbell Shrug Behind The Back": "Behind-the-Back Shrug",
  "Cable Rope Overhead Triceps Extension": "Overhead Triceps Extension",
  // Grip and forearms.
  "Palms-Up Barbell Wrist Curl Over A Bench": "Wrist Curl",
  "Palms-Down Wrist Curl Over A Bench": "Reverse Wrist Curl",
  "Standing Dumbbell Reverse Curl": "Reverse Curl",
  "Finger Curls": "Finger Curl",
  "Plate Pinch": "Plate Pinch",
  "Wrist Roller": "Wrist Roller",
  "Zottman Curl": "Zottman Curl",
};

/**
 * Generic cleanup for anything not in the table.
 *
 * Only strips the database's formatting habits — a trailing qualifier
 * after a dash, an inverted "Thing, Modifier" — and never invents a
 * different name for a movement.
 */
export function tidyName(name: string): string {
  let out = name.trim();

  // "Rowing, Stationary" -> "Stationary Rowing"
  const inverted = /^([^,]+),\s+(.+)$/.exec(out);
  if (inverted) out = `${inverted[2]} ${inverted[1]}`;

  // "Dips - Triceps Version" -> "Dips"; keeps hyphenated words intact
  // because the split is on " - " with spaces, not on "-".
  out = out.split(" - ")[0];

  // Grip qualifiers that add nothing on screen.
  out = out.replace(/\s+Medium-Grip$/i, "").replace(/\s+Version$/i, "");

  return out.replace(/\s{2,}/g, " ").trim();
}

/** What to show the user for a stored exercise name. */
export function displayName(storedName: string): string {
  return DISPLAY_NAMES[storedName] ?? tidyName(storedName);
}

/** Every stored name that has a reviewed display name, for tests. */
export function mappedNames(): string[] {
  return Object.keys(DISPLAY_NAMES);
}
