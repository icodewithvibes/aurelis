/**
 * First run — the one time AURELIS explains itself.
 *
 * The rule that matters most here is when NOT to show it. A tutorial
 * that reappears is an annoyance, and one that greets someone who has
 * been using the app for a month is an insult. So:
 *
 *   - Seen it? Never again. The flag is the only authority.
 *   - Never seen it, but the database already has real work in it?
 *     That is an existing user meeting a new feature, not a beginner.
 *     Mark it seen SILENTLY and say nothing.
 *   - Never seen it, and nothing has happened yet? Show it.
 *
 * The middle case is the one people get wrong. Yuriel has months of
 * sessions; shipping this without that branch would have opened a
 * "here's how to log a set" walkthrough in his face on launch.
 *
 * It stays replayable from Settings, because "never again" should be a
 * default, not a cage.
 */

export interface TutorialStep {
  /** Stable id — used by the dots and by tests. */
  id: string;
  title: string;
  body: string;
  /** Where this lives, so the words point at something real. */
  where?: string;
  /** Route the step can take you to, if it names one. */
  route?: string;
  cta?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "This is a record, not a coach",
    body:
      "AURELIS tracks what you actually did. No streaks you can buy back, no points, no fabricated progress — the numbers are only ever counted from the work. Everything stays on this phone.",
  },
  {
    id: "split",
    title: "Start with a split",
    body:
      "A split is your program: which days you train and what is on each one. Take a ready-made one from the library, then edit it however you like — the eleven in there include research-backed programs and lifts the old greats built.",
    where: "Train → Split library",
    route: "/library",
    cta: "Open the library",
  },
  {
    id: "movement",
    title: "Not sure what a lift looks like?",
    body:
      "Every movement has a picture. Tap “See the movement” under any exercise and it opens full width — same pose and equipment as a real reference, drawn in the app's own language.",
    where: "Under any exercise, while training or in the library",
  },
  {
    id: "logging",
    title: "Log the set, not the intention",
    body:
      "Weight, reps, and how hard it felt if you want it. A set counts when you mark it done. Stop early and the session closes itself as a half session — kept on the record, but not counted as a day you kept.",
    where: "Train → start a session",
  },
  {
    id: "proof",
    title: "The crest counts kept days",
    body:
      "Not workouts, not effort — days. Several sessions in one day still count once. The timeline compresses each day to a line you can press open, with every lift, set and note underneath.",
    where: "Proof",
    route: "/proof",
  },
  {
    id: "plan",
    title: "Plan ahead, and change your mind",
    body:
      "Put things on days ahead at roughly the time you want them. Anything you do not get to is carried, not scolded — move it or drop it. Set your wake time and it works out sleep, caffeine and training windows from published research.",
    where: "Plan",
    route: "/plan",
  },
  {
    id: "make-it-yours",
    title: "Make it look like yours",
    body:
      "Four themes, motion you can hold still, and imagery you can turn off entirely. Nothing is uploaded, so export a backup now and then — a lost browser profile is a lost history.",
    where: "Settings → Appearance",
    route: "/settings",
    cta: "Open Settings",
  },
];

export interface FirstRunFacts {
  /** Set once the tutorial has been seen or dismissed. */
  tutorialSeenAt?: number;
  /** Anything at all in the database that a real user would have made. */
  hasSplit: boolean;
  hasSessions: boolean;
  hasPlanItems: boolean;
  hasForgeEntries: boolean;
}

export type FirstRunDecision =
  /** Genuinely new — run the tutorial. */
  | "show"
  /** Existing user who predates the tutorial — record it, stay quiet. */
  | "mark-seen-silently"
  /** Already handled. */
  | "skip";

export function decideFirstRun(facts: FirstRunFacts): FirstRunDecision {
  if (facts.tutorialSeenAt != null) return "skip";

  const hasHistory =
    facts.hasSplit || facts.hasSessions || facts.hasPlanItems || facts.hasForgeEntries;

  return hasHistory ? "mark-seen-silently" : "show";
}

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;
