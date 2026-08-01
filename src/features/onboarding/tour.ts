/**
 * The guided tour — steps that point at real controls on real screens.
 *
 * The previous walkthrough was a stack of cards describing the app. It
 * read fine and taught nothing, because "the split library is under
 * Train" is a sentence you forget before you have finished reading it.
 * This version navigates to the screen, puts a hole in the dimming
 * around the actual button, and points at it.
 *
 * TARGETING is by `data-tour` attribute, never by class or position.
 * Classes here are Tailwind utilities that change whenever the design
 * does, and a tour that silently stops finding its target is worse than
 * no tour — it would dim the screen and point at nothing. A missing
 * target is treated as a soft failure: the step still shows its text,
 * centred, and the tour carries on.
 *
 * ADVANCING is always possible from the card. Steps can invite a real
 * click, but nothing is ever *required* — a tour that traps you until
 * you press the one blessed button is a hostage situation, and on a
 * phone a mis-tap would strand you.
 */

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Navigate here before showing the step. */
  route?: string;
  /** `[data-tour="…"]` value to spotlight. Omitted = centred card. */
  target?: string;
  /** Nudge when the step wants a real interaction. */
  action?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Two minutes, and it's yours",
    body:
      "AURELIS records what you actually did — no streaks you can buy back, no points, nothing invented. Everything stays on this phone. I'll point at each thing as we go, and you can leave at any time.",
  },
  {
    id: "nav",
    title: "Six places, that's the whole app",
    body:
      "Today is what to do now. Plan is what's coming. Train holds your programs. Forge is the mental side. Proof is the record. Settings is yours to bend.",
    target: "nav",
  },
  {
    id: "train",
    title: "Start here — pick a program",
    body:
      "Train is where your splits live. Tap it and we'll go find one.",
    target: "nav-train",
    action: "Tap Train",
    route: "/train",
  },
  {
    id: "library",
    title: "Fourteen ready-made programs",
    body:
      "Beginner full-body, push/pull/legs, running plans, grip work, and a few built on lifts the old greats named. Take one and edit it however you like — it becomes yours, not a template you're stuck with.",
    route: "/library",
    target: "split-library",
  },
  {
    id: "movement",
    title: "Never guess what a lift is",
    body:
      "Every movement has a picture. Open any program, then tap \"See the movement\" under an exercise — same pose and equipment as a real reference, drawn in the app's own style.",
    route: "/library",
    /* No target on purpose. "See the movement" only exists once a
       program is expanded, which the tour cannot guarantee — pointing
       at a button that may not be there is worse than not pointing. */
    action: "Open a program and look for it",
  },
  {
    id: "logging",
    title: "Log the set, not the intention",
    body:
      "Weight, reps, and how hard it felt if you want it. A set counts when you tap the check. Stop early and the session closes itself as a half session — kept on the record, but never counted as a day you kept.",
    route: "/today",
    target: "today-primary",
  },
  {
    id: "progression",
    title: "It tells you what to lift next",
    body:
      "Once you've logged a lift a couple of times, each exercise shows a suggestion — \"you hit 8 on every set at 185, go to 190\" — worked out from your own numbers, with the reasoning shown. Tap it to fill the sets.",
    route: "/today",
    target: "today-primary",
  },
  {
    id: "proof",
    title: "The crest counts kept days",
    body:
      "Not workouts, not effort — days. Several sessions in one day still count once. The timeline folds each day to a line you can press open, with every lift, set and note underneath.",
    route: "/proof",
    target: "nav-proof",
  },
  {
    id: "plan",
    title: "Plan ahead, and change your mind",
    body:
      "Put things on days ahead at roughly the time you want them. Anything you don't get to is carried, not scolded. Set your wake time and it works out sleep, caffeine and training windows from published research.",
    route: "/plan",
    target: "nav-plan",
  },
  {
    id: "settings",
    title: "Make it look like yours",
    body:
      "Four themes, motion you can hold still, imagery you can switch off. Nothing is uploaded — so export a backup now and then, because a lost browser profile is a lost history.",
    route: "/settings",
    target: "nav-settings",
  },
  {
    id: "done",
    title: "That's everything",
    body:
      "You can replay this any time from Settings. If you adopted a program or logged anything while we walked through, you can wipe just that — the button below removes only what this tour created, and leaves everything else exactly as it was.",
  },
];

export const TOUR_STEP_COUNT = TOUR_STEPS.length;

/** Selector for a step's spotlight target. */
export function targetSelector(step: TourStep): string | null {
  return step.target ? `[data-tour="${step.target}"]` : null;
}
