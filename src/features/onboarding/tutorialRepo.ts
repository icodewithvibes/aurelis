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

/*
 * There is deliberately no `replayTutorial` here.
 *
 * The first version cleared `tutorialSeenAt` and reloaded, expecting
 * boot to notice. It could not work for anyone who had used the app:
 * `decideFirstRun` would find no flag but plenty of history, conclude
 * "existing user", re-mark it seen and show nothing — so the button
 * just reloaded the page. It also leaned on Dexie deleting a property
 * by assigning `undefined`, which `update()` does not do.
 *
 * Replay is now a UI action (`useUiStore.openTutorial`) that opens the
 * overlay directly. A request from the user is not something to
 * re-derive from the shape of their data.
 */
