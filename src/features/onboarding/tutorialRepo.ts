/**
 * First-run persistence. Reads just enough of the database to tell a
 * brand-new user apart from an existing one, and records the flag.
 */
import { db } from "../../data/db";
import { nowMs } from "../../lib/date";
import { decideFirstRun, type FirstRunDecision } from "./tutorial";

/**
 * Counts rather than full reads — this runs on boot, and the question
 * is only "is there anything here at all".
 */
export async function firstRunDecision(): Promise<FirstRunDecision> {
  const [settings, splits, sessions, planItems, forgeEntries] = await Promise.all([
    db.settings.get("app"),
    db.splits.count(),
    db.sessions.count(),
    db.planItems.count(),
    db.forgeEntries.count(),
  ]);

  return decideFirstRun({
    tutorialSeenAt: settings?.tutorialSeenAt,
    hasSplit: splits > 0,
    hasSessions: sessions > 0,
    hasPlanItems: planItems > 0,
    hasForgeEntries: forgeEntries > 0,
  });
}

export async function markTutorialSeen(): Promise<void> {
  await db.settings.update("app", { tutorialSeenAt: nowMs(), updatedAt: nowMs() });
}

/** Settings offers this so "never again" is a default, not a cage. */
export async function replayTutorial(): Promise<void> {
  await db.settings.update("app", { tutorialSeenAt: undefined, updatedAt: nowMs() });
}
