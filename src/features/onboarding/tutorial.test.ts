import { describe, it, expect } from "vitest";
import { decideFirstRun, TUTORIAL_STEPS, type FirstRunFacts } from "./tutorial";

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

describe("the steps themselves", () => {
  it("covers what a new user actually has to find", () => {
    const ids = TUTORIAL_STEPS.map((s) => s.id);
    for (const needed of ["split", "movement", "logging", "proof", "plan", "make-it-yours"]) {
      expect(ids).toContain(needed);
    }
  });

  it("has unique ids, since they key the animation and the dots", () => {
    const ids = TUTORIAL_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every step real copy", () => {
    for (const s of TUTORIAL_STEPS) {
      expect(s.title.length).toBeGreaterThan(4);
      expect(s.body.length).toBeGreaterThan(40);
    }
  });

  it("never promises a route without a label to press", () => {
    for (const s of TUTORIAL_STEPS) {
      if (s.cta) expect(s.route).toBeTruthy();
    }
  });

  it("only points at routes the app actually has", () => {
    const routes = ["/today", "/plan", "/train", "/forge", "/proof", "/settings", "/library", "/import"];
    for (const s of TUTORIAL_STEPS) {
      if (s.route) expect(routes).toContain(s.route);
    }
  });

  it("stays short enough that people finish it", () => {
    expect(TUTORIAL_STEPS.length).toBeLessThanOrEqual(8);
  });
});
