/**
 * Split library (Stage 7) — ready-made programs in AURELIS Split Format.
 *
 * What the current evidence actually supports, and what these encode:
 *
 * - VOLUME drives hypertrophy, with clear diminishing returns. Roughly
 *   10–20 hard sets per muscle per week is the productive band for most
 *   people; more is not automatically better.
 * - FREQUENCY, at matched volume, does NOT independently add much
 *   hypertrophy — but it does help STRENGTH, also with diminishing
 *   returns (Sports Medicine 2025 dose-response meta-regressions).
 *   So splitting volume across the week is presented as a practical way
 *   to fit it in and to train each lift more often, NOT as a magic
 *   requirement for growth.
 * - Proximity to failure matters more than exotic programming; these
 *   use plain rep ranges and leave effort to the logger's RPE field.
 * - For concurrent training, hard cardio is placed away from the lifting
 *   it would most interfere with, rather than banned.
 *
 * Every exercise name here resolves in the bundled exercise index, so
 * "Not sure what this looks like?" always has a photo to show.
 */

export type SplitCategory = "lift" | "cardio" | "hybrid";

export interface SplitTemplate {
  id: string;
  name: string;
  category: SplitCategory;
  /** Sessions per week. */
  daysPerWeek: number;
  level: "beginner" | "intermediate" | "advanced";
  /** One line on who it is for. */
  summary: string;
  /** Why it is built this way, in plain language. */
  rationale: string;
  /** Muscle groups or systems it targets. */
  targets: string[];
  /** The program itself, in ASF. */
  asf: string;
}

export const SPLIT_CATEGORIES: { key: SplitCategory; label: string; blurb: string }[] = [
  { key: "lift", label: "Lifting", blurb: "Resistance training only" },
  { key: "hybrid", label: "Lift + cardio", blurb: "Both, without wrecking either" },
  { key: "cardio", label: "Cardio", blurb: "Conditioning focus" },
];

export const SPLIT_LIBRARY: SplitTemplate[] = [
  /* ------------------------------------------------------- LIFTING */
  {
    id: "full-body-3",
    name: "Full Body 3×",
    category: "lift",
    daysPerWeek: 3,
    level: "beginner",
    summary: "Three full-body days. The most productive place to start.",
    rationale:
      "Every muscle is trained three times a week, which gets weekly volume up without long sessions and gives you three chances a week to practise each lift. Practice frequency is where beginners gain fastest.",
    targets: ["Full body", "Quads", "Chest", "Back", "Shoulders"],
    asf: `SPLIT: Full Body 3x
SCHEDULE: Mon, Wed, Fri

DAY: Full Body A
- Barbell Squat | 3 | 5-8 | Rest 180s
- Barbell Bench Press - Medium Grip | 3 | 5-8 | Rest 150s
- Bent Over Barbell Row | 3 | 6-10 | Rest 120s
- Plank | 3 | 30-60 | Rest 60s

DAY: Full Body B
- Barbell Deadlift | 2 | 4-6 | Rest 210s
- Barbell Shoulder Press | 3 | 6-10 | Rest 150s
- Wide-Grip Lat Pulldown | 3 | 8-12 | Rest 120s
- Standing Calf Raises | 3 | 10-15 | Rest 60s

DAY: Full Body C
- Front Barbell Squat | 3 | 6-10 | Rest 150s
- Incline Dumbbell Press | 3 | 8-12 | Rest 120s
- Seated Cable Rows | 3 | 8-12 | Rest 120s
- Barbell Curl | 2 | 10-15 | Rest 60s`,
  },
  {
    id: "upper-lower-4",
    name: "Upper / Lower 4×",
    category: "lift",
    daysPerWeek: 4,
    level: "intermediate",
    summary: "Four days, each muscle twice a week. The reliable middle ground.",
    rationale:
      "Splitting upper and lower lets each session stay focused while every muscle still gets two sessions a week, which spreads the weekly volume into manageable chunks and gives strength work the frequency it likes.",
    targets: ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Glutes"],
    asf: `SPLIT: Upper / Lower 4x
SCHEDULE: Mon, Tue, Thu, Fri

DAY: Upper A
- Barbell Bench Press - Medium Grip | 4 | 5-8 | Rest 180s
- Bent Over Barbell Row | 4 | 6-10 | Rest 150s
- Barbell Shoulder Press | 3 | 8-12 | Rest 120s
- Wide-Grip Lat Pulldown | 3 | 10-12 | Rest 90s
- Barbell Curl | 2 | 10-15 | Rest 60s

DAY: Lower A
- Barbell Squat | 4 | 5-8 | Rest 180s
- Romanian Deadlift | 3 | 8-12 | Rest 150s
- Leg Extensions | 3 | 12-15 | Rest 90s
- Standing Calf Raises | 4 | 10-15 | Rest 60s

DAY: Upper B
- Barbell Incline Bench Press Medium-Grip | 4 | 6-10 | Rest 150s
- Pullups | 4 | 6-10 | Rest 150s
- Side Lateral Raise | 3 | 12-15 | Rest 60s
- Seated Cable Rows | 3 | 10-12 | Rest 90s
- Triceps Pushdown | 2 | 10-15 | Rest 60s

DAY: Lower B
- Barbell Deadlift | 3 | 4-6 | Rest 210s
- Leg Press | 3 | 10-15 | Rest 120s
- Lying Leg Curls | 3 | 10-15 | Rest 90s
- Plank | 3 | 30-60 | Rest 60s`,
  },
  {
    id: "ppl-6",
    name: "Push / Pull / Legs 6×",
    category: "lift",
    daysPerWeek: 6,
    level: "advanced",
    summary: "Six days, everything twice. High volume, high commitment.",
    rationale:
      "The highest-volume option here. It only beats the four-day plan if you actually recover from it — volume drives growth with diminishing returns, so this is worth it when four days genuinely is not enough, not by default.",
    targets: ["Chest", "Shoulders", "Triceps", "Back", "Biceps", "Quads", "Hamstrings"],
    asf: `SPLIT: Push / Pull / Legs 6x
SCHEDULE: Mon, Tue, Wed, Thu, Fri, Sat

DAY: Push A
- Barbell Bench Press - Medium Grip | 4 | 5-8 | Rest 180s
- Barbell Shoulder Press | 3 | 8-12 | Rest 150s
- Incline Dumbbell Press | 3 | 8-12 | Rest 120s
- Side Lateral Raise | 3 | 12-15 | Rest 60s
- Triceps Pushdown | 3 | 10-15 | Rest 60s

DAY: Pull A
- Bent Over Barbell Row | 4 | 6-10 | Rest 150s
- Pullups | 3 | 6-10 | Rest 150s
- Seated Cable Rows | 3 | 10-12 | Rest 90s
- Face Pull | 3 | 12-20 | Rest 60s
- Barbell Curl | 3 | 10-15 | Rest 60s

DAY: Legs A
- Barbell Squat | 4 | 5-8 | Rest 180s
- Romanian Deadlift | 3 | 8-12 | Rest 150s
- Leg Press | 3 | 10-15 | Rest 120s
- Lying Leg Curls | 3 | 10-15 | Rest 90s
- Standing Calf Raises | 4 | 10-15 | Rest 60s

DAY: Push B
- Barbell Incline Bench Press Medium-Grip | 4 | 6-10 | Rest 150s
- Dumbbell Shoulder Press | 3 | 8-12 | Rest 120s
- Dumbbell Flyes | 3 | 12-15 | Rest 90s
- Side Lateral Raise | 3 | 12-20 | Rest 60s
- Dips - Triceps Version | 3 | 8-12 | Rest 90s

DAY: Pull B
- Barbell Deadlift | 3 | 4-6 | Rest 210s
- Wide-Grip Lat Pulldown | 3 | 10-12 | Rest 90s
- One-Arm Dumbbell Row | 3 | 8-12 | Rest 90s
- Face Pull | 3 | 12-20 | Rest 60s
- Hammer Curls | 3 | 10-15 | Rest 60s

DAY: Legs B
- Front Barbell Squat | 4 | 6-10 | Rest 150s
- Barbell Hip Thrust | 3 | 8-12 | Rest 120s
- Leg Extensions | 3 | 12-15 | Rest 90s
- Seated Calf Raise | 4 | 12-20 | Rest 60s`,
  },
  {
    id: "minimalist-2",
    name: "Minimalist 2×",
    category: "lift",
    daysPerWeek: 2,
    level: "beginner",
    summary: "Two days, big lifts only. For a genuinely full week.",
    rationale:
      "Two sessions is enough to build and keep strength when the sessions are compound-focused. Far better than an ambitious plan you abandon — the best split is the one you actually complete.",
    targets: ["Full body", "Quads", "Chest", "Back"],
    asf: `SPLIT: Minimalist 2x
SCHEDULE: Tue, Sat

DAY: Strength A
- Barbell Squat | 4 | 5-8 | Rest 180s
- Barbell Bench Press - Medium Grip | 4 | 5-8 | Rest 180s
- Bent Over Barbell Row | 3 | 6-10 | Rest 150s

DAY: Strength B
- Barbell Deadlift | 3 | 4-6 | Rest 210s
- Barbell Shoulder Press | 4 | 6-10 | Rest 150s
- Pullups | 3 | 6-10 | Rest 150s`,
  },

  /* -------------------------------------------------------- HYBRID */
  {
    id: "hybrid-4",
    name: "Lift + Cardio 4×",
    category: "hybrid",
    daysPerWeek: 4,
    level: "intermediate",
    summary: "Two lifting days, two conditioning days, kept apart.",
    rationale:
      "Hard cardio and hard lifting interfere most when stacked on the same muscles the same day. Separating them by day keeps both productive, and the easy aerobic work aids recovery rather than competing with it.",
    targets: ["Full body", "Aerobic base", "Conditioning"],
    asf: `SPLIT: Lift + Cardio 4x
SCHEDULE: Mon, Tue, Thu, Fri

DAY: Full Body Lift A
- Barbell Squat | 3 | 5-8 | Rest 180s
- Barbell Bench Press - Medium Grip | 3 | 5-8 | Rest 150s
- Bent Over Barbell Row | 3 | 6-10 | Rest 120s

DAY: Easy Aerobic
- Elliptical Trainer | 1 | 30-45 | Rest 0s
- Plank | 3 | 30-60 | Rest 60s

DAY: Full Body Lift B
- Barbell Deadlift | 3 | 4-6 | Rest 210s
- Barbell Shoulder Press | 3 | 6-10 | Rest 150s
- Wide-Grip Lat Pulldown | 3 | 8-12 | Rest 120s

DAY: Intervals
- Rowing, Stationary | 6 | 2-4 | Rest 120s
- Standing Calf Raises | 3 | 12-20 | Rest 60s`,
  },

  {
    id: "upper-lower-arms-5",
    name: "Upper / Lower + Arms 5×",
    category: "lift",
    daysPerWeek: 5,
    level: "intermediate",
    summary: "Four main days plus a short arm and shoulder day.",
    rationale:
      "The four-day skeleton, with one short session for the muscles that usually get the least direct work. A good way to add volume where you want it without lengthening the days you already have.",
    targets: ["Chest", "Back", "Quads", "Hamstrings", "Biceps", "Triceps", "Shoulders"],
    asf: `SPLIT: Upper / Lower + Arms 5x
SCHEDULE: Mon, Tue, Thu, Fri, Sat

DAY: Upper A
- Barbell Bench Press - Medium Grip | 4 | 5-8 | Rest 180s
- Bent Over Barbell Row | 4 | 6-10 | Rest 150s
- Barbell Shoulder Press | 3 | 8-12 | Rest 120s
- Wide-Grip Lat Pulldown | 3 | 10-12 | Rest 90s

DAY: Lower A
- Barbell Squat | 4 | 5-8 | Rest 180s
- Romanian Deadlift | 3 | 8-12 | Rest 150s
- Leg Extensions | 3 | 12-15 | Rest 90s
- Standing Calf Raises | 4 | 10-15 | Rest 60s

DAY: Upper B
- Barbell Incline Bench Press Medium-Grip | 4 | 6-10 | Rest 150s
- Pullups | 4 | 6-10 | Rest 150s
- Seated Cable Rows | 3 | 10-12 | Rest 90s
- Side Lateral Raise | 3 | 12-15 | Rest 60s

DAY: Lower B
- Barbell Deadlift | 3 | 4-6 | Rest 210s
- Leg Press | 3 | 10-15 | Rest 120s
- Lying Leg Curls | 3 | 10-15 | Rest 90s
- Plank | 3 | 30-60 | Rest 60s

DAY: Arms & Shoulders
- Barbell Curl | 3 | 10-15 | Rest 60s
- Triceps Pushdown | 3 | 10-15 | Rest 60s
- Hammer Curls | 3 | 10-15 | Rest 60s
- Face Pull | 3 | 12-20 | Rest 60s`,
  },
  {
    id: "home-bodyweight-3",
    name: "Home Bodyweight 3×",
    category: "lift",
    daysPerWeek: 3,
    level: "beginner",
    summary: "No equipment. Full body, three times a week.",
    rationale:
      "Everything here needs a floor and somewhere to hang. Progress comes from harder variations and more reps rather than more weight, which is a perfectly good driver when load isn't available.",
    targets: ["Full body", "Chest", "Back", "Quads", "Core"],
    asf: `SPLIT: Home Bodyweight 3x
SCHEDULE: Mon, Wed, Fri

DAY: Bodyweight A
- Pushups | 4 | 8-20 | Rest 90s
- Pullups | 4 | 3-10 | Rest 120s
- Bodyweight Squat | 4 | 15-25 | Rest 90s
- Plank | 3 | 30-60 | Rest 60s

DAY: Bodyweight B
- Dips - Triceps Version | 4 | 5-12 | Rest 120s
- Chin-Up | 4 | 3-10 | Rest 120s
- Bodyweight Walking Lunge | 3 | 10-20 | Rest 90s
- Mountain Climbers | 3 | 20-40 | Rest 60s

DAY: Bodyweight C
- Pushups | 4 | 10-25 | Rest 90s
- Inverted Row | 4 | 8-15 | Rest 90s
- Bodyweight Squat | 4 | 20-30 | Rest 90s
- Hanging Leg Raise | 3 | 8-15 | Rest 60s`,
  },
  {
    id: "strength-3",
    name: "Strength 3×",
    category: "lift",
    daysPerWeek: 3,
    level: "intermediate",
    summary: "Low reps, heavy compounds, long rests. Get strong.",
    rationale:
      "Frequency is where strength gains actually respond, so the main lifts recur across the week at low reps with full rests. Size will follow, but this is built around getting stronger first.",
    targets: ["Quads", "Chest", "Back", "Shoulders"],
    asf: `SPLIT: Strength 3x
SCHEDULE: Mon, Wed, Fri

DAY: Squat Focus
- Barbell Squat | 5 | 3-5 | Rest 210s
- Barbell Bench Press - Medium Grip | 3 | 5-8 | Rest 180s
- Bent Over Barbell Row | 3 | 6-8 | Rest 150s

DAY: Press Focus
- Barbell Shoulder Press | 5 | 3-5 | Rest 210s
- Front Barbell Squat | 3 | 5-8 | Rest 180s
- Pullups | 3 | 5-8 | Rest 150s

DAY: Deadlift Focus
- Barbell Deadlift | 4 | 3-5 | Rest 240s
- Barbell Incline Bench Press Medium-Grip | 3 | 6-8 | Rest 180s
- Seated Cable Rows | 3 | 8-10 | Rest 120s`,
  },

  /* -------------------------------------------------------- CARDIO */
  {
    id: "run-base-4",
    name: "Running Base 4×",
    category: "cardio",
    daysPerWeek: 4,
    level: "beginner",
    summary: "Three easy runs and one harder session. Build the engine.",
    rationale:
      "Most of the week is easy enough to hold a conversation, which is what actually builds aerobic capacity, with one harder session for the top end. Running hard every day is the classic way to stall.",
    targets: ["Aerobic base", "Running"],
    asf: `SPLIT: Running Base 4x
SCHEDULE: Mon, Wed, Fri, Sun

DAY: Easy Run
- Easy Run | 1 | 25-40 | Rest 0s

DAY: Intervals
- Running Intervals | 8 | 1-3 | Rest 120s

DAY: Steady Run
- Steady Run | 1 | 30-45 | Rest 0s

DAY: Long Run
- Long Run | 1 | 50-80 | Rest 0s`,
  },
  {
    id: "cycling-base-4",
    name: "Cycling Base 4×",
    category: "cardio",
    daysPerWeek: 4,
    level: "beginner",
    summary: "Mostly easy riding, one interval day, one long ride.",
    rationale:
      "Cycling is low impact, so weekly volume can be higher than running for the same fatigue. The long ride does the aerobic work; the interval day covers the top end.",
    targets: ["Aerobic base", "Cycling"],
    asf: `SPLIT: Cycling Base 4x
SCHEDULE: Tue, Thu, Sat, Sun

DAY: Easy Ride
- Easy Ride | 1 | 40-60 | Rest 0s

DAY: Bike Intervals
- Bike Intervals | 6 | 3-5 | Rest 180s

DAY: Steady Ride
- Steady Ride | 1 | 45-75 | Rest 0s

DAY: Long Ride
- Long Ride | 1 | 90-150 | Rest 0s`,
  },
  {
    id: "couch-to-run-3",
    name: "Start Running 3×",
    category: "cardio",
    daysPerWeek: 3,
    level: "beginner",
    summary: "Walk/run intervals that build to continuous running.",
    rationale:
      "Alternating running and walking lets the aerobic system adapt while your tendons and joints catch up, which is where most new runners get hurt. Extend the running blocks as they get comfortable.",
    targets: ["Aerobic base", "Running"],
    asf: `SPLIT: Start Running 3x
SCHEDULE: Mon, Wed, Sat

DAY: Walk-Run A
- Walk-Run Intervals | 8 | 1-3 | Rest 120s

DAY: Walk-Run B
- Walk-Run Intervals | 6 | 2-4 | Rest 120s

DAY: Long Walk-Run
- Walk-Run Intervals | 5 | 3-6 | Rest 150s`,
  },
];

export function splitsByCategory(category: SplitCategory): SplitTemplate[] {
  return SPLIT_LIBRARY.filter((s) => s.category === category);
}

export function findTemplate(id: string): SplitTemplate | undefined {
  return SPLIT_LIBRARY.find((s) => s.id === id);
}

/** Every exercise name used across the library, for coverage checks. */
export function templateExerciseNames(t: SplitTemplate): string[] {
  return t.asf
    .split("\n")
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.replace(/^\s*-\s*/, "").split("|")[0].trim())
    .filter(Boolean);
}
