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
    name: "First Light 3×",
    category: "lift",
    daysPerWeek: 3,
    level: "beginner",
    summary: "Three full-body days. The most productive place to start.",
    rationale:
      "Every muscle is trained three times a week, which gets weekly volume up without long sessions and gives you three chances a week to practise each lift. Practice frequency is where beginners gain fastest.",
    targets: ["Full body", "Quads", "Chest", "Back", "Shoulders"],
    asf: `SPLIT: First Light 3x
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
    name: "Twin Anvils 4×",
    category: "lift",
    daysPerWeek: 4,
    level: "intermediate",
    summary: "Four days, each muscle twice a week. The reliable middle ground.",
    rationale:
      "Splitting upper and lower lets each session stay focused while every muscle still gets two sessions a week, which spreads the weekly volume into manageable chunks and gives strength work the frequency it likes.",
    targets: ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Glutes"],
    asf: `SPLIT: Twin Anvils 4x
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
    name: "The Three Gates 6×",
    category: "lift",
    daysPerWeek: 6,
    level: "advanced",
    summary: "Six days, everything twice. High volume, high commitment.",
    rationale:
      "The highest-volume option here. It only beats the four-day plan if you actually recover from it — volume drives growth with diminishing returns, so this is worth it when four days genuinely is not enough, not by default.",
    targets: ["Chest", "Shoulders", "Triceps", "Back", "Biceps", "Quads", "Hamstrings"],
    asf: `SPLIT: The Three Gates 6x
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
    name: "The Short Watch 2×",
    category: "lift",
    daysPerWeek: 2,
    level: "beginner",
    summary: "Two days, big lifts only. For a genuinely full week.",
    rationale:
      "Two sessions is enough to build and keep strength when the sessions are compound-focused. Far better than an ambitious plan you abandon — the best split is the one you actually complete.",
    targets: ["Full body", "Quads", "Chest", "Back"],
    asf: `SPLIT: The Short Watch 2x
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
    name: "Iron and Road 4×",
    category: "hybrid",
    daysPerWeek: 4,
    level: "intermediate",
    summary: "Two lifting days, two conditioning days, kept apart.",
    rationale:
      "Hard cardio and hard lifting interfere most when stacked on the same muscles the same day. Separating them by day keeps both productive, and the easy aerobic work aids recovery rather than competing with it.",
    targets: ["Full body", "Aerobic base", "Conditioning"],
    asf: `SPLIT: Iron and Road 4x
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
    name: "The Armory 5×",
    category: "lift",
    daysPerWeek: 5,
    level: "intermediate",
    summary: "Four main days plus a short arm and shoulder day.",
    rationale:
      "The four-day skeleton, with one short session for the muscles that usually get the least direct work. A good way to add volume where you want it without lengthening the days you already have.",
    targets: ["Chest", "Back", "Quads", "Hamstrings", "Biceps", "Triceps", "Shoulders"],
    asf: `SPLIT: The Armory 5x
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

DAY: Arms & Forearms
- Barbell Curl | 3 | 10-15 | Rest 60s
- Triceps Pushdown | 3 | 10-15 | Rest 60s
- Hammer Curls | 3 | 10-15 | Rest 60s
- Face Pull | 3 | 12-20 | Rest 60s
- Palms-Up Barbell Wrist Curl Over A Bench | 3 | 12-20 | Rest 45s
- Standing Dumbbell Reverse Curl | 3 | 10-15 | Rest 45s`,
  },
  {
    id: "home-bodyweight-3",
    name: "No Iron 3×",
    category: "lift",
    daysPerWeek: 3,
    level: "beginner",
    summary: "No equipment. Full body, three times a week.",
    rationale:
      "Everything here needs a floor and somewhere to hang. Progress comes from harder variations and more reps rather than more weight, which is a perfectly good driver when load isn't available.",
    targets: ["Full body", "Chest", "Back", "Quads", "Core"],
    asf: `SPLIT: No Iron 3x
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
    name: "The Heavy Vigil 3×",
    category: "lift",
    daysPerWeek: 3,
    level: "intermediate",
    summary: "Low reps, heavy compounds, long rests. Get strong.",
    rationale:
      "Frequency is where strength gains actually respond, so the main lifts recur across the week at low reps with full rests. Size will follow, but this is built around getting stronger first.",
    targets: ["Quads", "Chest", "Back", "Shoulders"],
    asf: `SPLIT: The Heavy Vigil 3x
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
    name: "The Long March 4×",
    category: "cardio",
    daysPerWeek: 4,
    level: "beginner",
    summary: "Three easy runs and one harder session. Build the engine.",
    rationale:
      "Most of the week is easy enough to hold a conversation, which is what actually builds aerobic capacity, with one harder session for the top end. Running hard every day is the classic way to stall.",
    targets: ["Aerobic base", "Running"],
    asf: `SPLIT: The Long March 4x
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
    name: "The Long Road 4×",
    category: "cardio",
    daysPerWeek: 4,
    level: "beginner",
    summary: "Mostly easy riding, one interval day, one long ride.",
    rationale:
      "Cycling is low impact, so weekly volume can be higher than running for the same fatigue. The long ride does the aerobic work; the interval day covers the top end.",
    targets: ["Aerobic base", "Cycling"],
    asf: `SPLIT: The Long Road 4x
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
    name: "First Mile 3×",
    category: "cardio",
    daysPerWeek: 3,
    level: "beginner",
    summary: "Walk/run intervals that build to continuous running.",
    rationale:
      "Alternating running and walking lets the aerobic system adapt while your tendons and joints catch up, which is where most new runners get hurt. Extend the running blocks as they get comfortable.",
    targets: ["Aerobic base", "Running"],
    asf: `SPLIT: First Mile 3x
SCHEDULE: Mon, Wed, Sat

DAY: Walk-Run A
- Walk-Run Intervals | 8 | 1-3 | Rest 120s

DAY: Walk-Run B
- Walk-Run Intervals | 6 | 2-4 | Rest 120s

DAY: Long Walk-Run
- Walk-Run Intervals | 5 | 3-6 | Rest 150s`,
  },

  /* --------------------------------------------- THE OLD GUARD */
  /*
   * Named lifts, from the people they are named after. These are not
   * novelty — every one earned its name by building something, and
   * several are simply better tools than the machine that replaced
   * them. Kept honest: where a claim is a research finding it is stated
   * as one, and where it is history it is stated as history.
   */
  {
    id: "old-guard-4",
    name: "The Old Guard 4×",
    category: "lift",
    daysPerWeek: 4,
    level: "intermediate",
    summary: "Four days built on lifts the greats named — and still worth doing.",
    rationale:
      "Every movement here is either named after the lifter who built it or is the version research now favours. Hackenschmidt's squat, Zercher's, Gironda's sissy squat and neck press, JM Blakley's press, Louie Simmons' reverse hyper. Two are here for evidence rather than history: the seated leg curl and the overhead triceps extension both train their muscle in a lengthened position, and both beat the version most people default to. Run it like any other program — the names are a reason to try them, not a reason to skip the basics they sit on.",
    targets: ["Quads", "Hamstrings", "Chest", "Back", "Triceps", "Posterior chain"],
    asf: `SPLIT: The Old Guard 4x
SCHEDULE: Mon, Tue, Thu, Fri
NOTE: Seated leg curl over lying is a research call, not nostalgia — training the hamstrings at long muscle length grew them more over 12 weeks (Maeo et al., 2021). Same logic for the overhead triceps extension (Maeo et al., 2022).

DAY: Legs — Hackenschmidt
- Barbell Hack Squat | 4 | 6-10 | Rest 180s
- Zercher Squats | 3 | 6-10 | Rest 180s
- Seated Leg Curl | 4 | 8-12 | Rest 90s
- Weighted Sissy Squat | 3 | 10-15 | Rest 90s
- Standing Calf Raises | 4 | 8-12 | Rest 90s

DAY: Push — Gironda
- Barbell Guillotine Bench Press | 4 | 6-10 | Rest 150s
- Standing Barbell Press Behind Neck | 3 | 6-10 | Rest 150s
- JM Press | 3 | 8-12 | Rest 90s
- Cable Rope Overhead Triceps Extension | 3 | 10-15 | Rest 75s
- Side Lateral Raise | 3 | 12-20 | Rest 60s

DAY: Posterior — Simmons
- Barbell Deadlift | 3 | 3-6 | Rest 210s
- Reverse Hyperextension | 3 | 12-20 | Rest 90s
- Natural Glute Ham Raise | 3 | 6-12 | Rest 120s
- Good Morning | 3 | 8-12 | Rest 120s
- Farmer's Walk | 3 | 1 | Rest 120s

DAY: Pull — Reeves
- Pullups | 4 | 5-10 | Rest 150s
- Bent Over Barbell Row | 4 | 6-10 | Rest 150s
- Straight-Arm Dumbbell Pullover | 3 | 10-15 | Rest 90s
- Barbell Shrug Behind The Back | 3 | 8-12 | Rest 90s
- Incline Dumbbell Curl | 3 | 8-12 | Rest 75s`,
  },

  /* ------------------------------------------ LENGTHENED POSITION */
  {
    id: "lengthened-3",
    name: "The Long Position 3×",
    category: "lift",
    daysPerWeek: 3,
    level: "intermediate",
    summary: "Every accessory picked for the version that trains the muscle stretched.",
    rationale:
      "Where two exercises train the same muscle, the one that loads it in a lengthened position tends to grow it more. Two direct 12-week comparisons make the point: the seated leg curl beat the lying version for the hamstrings that cross both joints, and the overhead cable extension beat the pushdown for the triceps by roughly 40%. The compounds here are ordinary on purpose — this is about which accessory you pick after them, not about replacing the basics.",
    targets: ["Hamstrings", "Triceps", "Biceps", "Chest", "Quads"],
    asf: `SPLIT: The Long Position 3x
SCHEDULE: Mon, Wed, Fri
NOTE: Sources — Maeo et al. 2021 (seated vs prone leg curl, MRI, 12 weeks) and Maeo et al. 2022, Eur J Sport Sci (overhead vs neutral elbow extension, 12 weeks). Both trained the same person's two limbs against each other, which is why they are worth listening to.

DAY: Lower — long
- Barbell Squat | 4 | 5-8 | Rest 180s
- Romanian Deadlift | 3 | 8-12 | Rest 150s
- Seated Leg Curl | 4 | 8-12 | Rest 90s
- Weighted Sissy Squat | 3 | 10-15 | Rest 90s
- Seated Calf Raise | 4 | 10-15 | Rest 75s

DAY: Push — long
- Barbell Incline Bench Press Medium-Grip | 4 | 6-10 | Rest 150s
- Dumbbell Flyes | 3 | 10-15 | Rest 90s
- Cable Rope Overhead Triceps Extension | 4 | 10-15 | Rest 75s
- Side Lateral Raise | 3 | 12-20 | Rest 60s

DAY: Pull — long
- Chin-Up | 4 | 5-10 | Rest 150s
- Seated Cable Rows | 3 | 8-12 | Rest 120s
- Straight-Arm Dumbbell Pullover | 3 | 10-15 | Rest 90s
- Incline Dumbbell Curl | 4 | 8-12 | Rest 75s
- Face Pull | 3 | 12-20 | Rest 60s`,
  },

  /* ------------------------------------------------- GRIP & FOREARMS */
  {
    id: "vice-grip-3",
    name: "Vice Grip 3×",
    category: "lift",
    daysPerWeek: 3,
    level: "intermediate",
    summary: "Forearms and grip, trained on purpose instead of by accident.",
    rationale:
      "Most programs leave the forearms to whatever the big lifts happen to give them, which is why grip is so often the thing that fails first on a heavy row or a long carry. This trains them directly and from both sides — wrist flexion and extension, plus loaded carries and static holds, which is closer to what grip actually does. The compounds are here so it is a whole session rather than an accessory day, and forearms recover quickly enough to take three exposures a week.",
    targets: ["Forearms", "Grip", "Biceps", "Back", "Traps"],
    asf: `SPLIT: Vice Grip 3x
SCHEDULE: Mon, Wed, Sat
NOTE: Straps defeat the point on these — if a set fails because your hands gave out, that is the set working. Save straps for the heaviest pulls only.

DAY: Pull & Crush
- Bent Over Barbell Row | 4 | 6-10 | Rest 150s
- Chin-Up | 3 | 6-10 | Rest 150s
- Palms-Up Barbell Wrist Curl Over A Bench | 4 | 12-20 | Rest 45s
- Plate Pinch | 3 | 1 | Rest 60s
- Farmer's Walk | 3 | 1 | Rest 120s

DAY: Press & Extend
- Barbell Bench Press - Medium Grip | 4 | 5-8 | Rest 180s
- Barbell Shoulder Press | 3 | 8-12 | Rest 120s
- Palms-Down Wrist Curl Over A Bench | 4 | 12-20 | Rest 45s
- Standing Dumbbell Reverse Curl | 3 | 10-15 | Rest 60s
- Wrist Roller | 2 | 1 | Rest 90s

DAY: Carry & Hold
- Barbell Deadlift | 3 | 4-6 | Rest 210s
- One-Arm Dumbbell Row | 3 | 8-12 | Rest 90s
- Zottman Curl | 3 | 10-15 | Rest 60s
- Finger Curls | 3 | 15-25 | Rest 45s
- Farmer's Walk | 3 | 1 | Rest 120s`,
  },
];

/** Where a new split slots in, so the array stays readable. */
export function splitCount(): number {
  return SPLIT_LIBRARY.length;
}

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
