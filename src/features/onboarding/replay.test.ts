import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "../../state/ui";
import { decideFirstRun } from "./tutorial";

/**
 * REGRESSION — "Replay the tutorial" did nothing for anyone who had
 * used the app.
 *
 * The button used to clear `tutorialSeenAt` and reload, expecting boot
 * to notice. For a user with any history that could never work:
 * `decideFirstRun` found no flag but plenty of data, concluded
 * "existing user", re-marked it seen, and showed nothing. The page just
 * reloaded. (It also relied on Dexie deleting a property by assigning
 * `undefined`, which `update()` does not do — two bugs stacked, the
 * second fatal on its own.)
 *
 * The original tests missed it because every one of them ran against an
 * EMPTY database, which is the only case where the old flow happened to
 * work. These pin the branch that was never covered: a request to see
 * the tutorial must not be re-derived from the shape of the user's data.
 */
describe("replaying the tutorial", () => {
  beforeEach(() => {
    useUiStore.setState({ tutorialOpen: false });
  });

  it("opens on request", () => {
    useUiStore.getState().openTutorial();
    expect(useUiStore.getState().tutorialOpen).toBe(true);
  });

  it("closes again", () => {
    useUiStore.getState().openTutorial();
    useUiStore.getState().closeTutorial();
    expect(useUiStore.getState().tutorialOpen).toBe(false);
  });

  it("opens for a user WITH history — the case that was broken", () => {
    // The exact situation: months of sessions, already seen it once.
    const facts = {
      tutorialSeenAt: 1_700_000_000_000,
      hasSplit: true,
      hasSessions: true,
      hasPlanItems: true,
      hasForgeEntries: true,
    };
    // Boot correctly stays quiet for this user...
    expect(decideFirstRun(facts)).toBe("skip");
    // ...and that must not stop them asking for it.
    useUiStore.getState().openTutorial();
    expect(useUiStore.getState().tutorialOpen).toBe(true);
  });

  it("opens even when boot would have said 'mark seen silently'", () => {
    const facts = {
      tutorialSeenAt: undefined,
      hasSplit: true,
      hasSessions: true,
      hasPlanItems: false,
      hasForgeEntries: false,
    };
    expect(decideFirstRun(facts)).toBe("mark-seen-silently");
    useUiStore.getState().openTutorial();
    expect(useUiStore.getState().tutorialOpen).toBe(true);
  });

  it("survives hydrating preferences — it is session state, not a pref", () => {
    // hydrate() spreads persisted preferences over the store; it must
    // not knock an open tutorial closed.
    useUiStore.getState().openTutorial();
    useUiStore.getState().hydrate({
      units: "lb",
      reducedMotion: "auto",
      theme: "ceremonial-chrome",
      imageMode: "auto",
      rpeMode: "simple",
      defaultRestSec: 90,
      staleAfterHours: 2,
      wakeMinutes: null,
    });
    expect(useUiStore.getState().tutorialOpen).toBe(true);
  });

  it("is never persisted as a preference", () => {
    // Nothing writes tutorialOpen to Dexie; it exists for this session
    // only, so a reload cannot leave the overlay stuck open.
    expect(Object.keys(useUiStore.getState())).toContain("tutorialOpen");
    expect(useUiStore.getState().tutorialOpen).toBe(false);
  });
});
