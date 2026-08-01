/**
 * First run — whether the guided tour opens by itself.
 *
 * The steps themselves live in tour.ts. This file only answers one
 * question: is this somebody's first time?
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

