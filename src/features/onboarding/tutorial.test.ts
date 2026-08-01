import { describe, it, expect } from "vitest";
import { decideFirstRun, type FirstRunFacts } from "./tutorial";

const empty: FirstRunFacts = {
  tutorialSeenAt: undefined,
  hasSplit: false,
  hasSessions: false,
  hasPlanItems: false,
  hasForgeEntries: false,
};

describe("decideFirstRun", () => {
  it("shows for a genuinely empty install", () => {
    expect(decideFirstRun(empty)).toBe("show");
  });

  it("never shows again once seen", () => {
    expect(decideFirstRun({ ...empty, tutorialSeenAt: 1 })).toBe("skip");
  });

  it("stays skipped even if the user later clears their data", () => {
    // The flag is the only authority — an empty database is not a
    // reason to re-teach someone who already sat through it.
    expect(decideFirstRun({ ...empty, tutorialSeenAt: 1 })).toBe("skip");
  });

  it.each([
    ["a split", { hasSplit: true }],
    ["sessions", { hasSessions: true }],
    ["plan items", { hasPlanItems: true }],
    ["forge entries", { hasForgeEntries: true }],
  ])("marks an existing user with %s as seen SILENTLY", (_label, facts) => {
    // This is the branch that matters. Without it, everyone already
    // using the app gets a "here's how to log a set" walkthrough on the
    // launch after this ships.
    expect(decideFirstRun({ ...empty, ...facts })).toBe("mark-seen-silently");
  });

  it("treats any history at all as existing, not just a split", () => {
    expect(
      decideFirstRun({ ...empty, hasSessions: true, hasForgeEntries: true }),
    ).toBe("mark-seen-silently");
  });
});
