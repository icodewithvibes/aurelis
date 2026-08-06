import { describe, expect, it } from "vitest";
import { recommendSplits, type Answers } from "./recommend";
import { SPLIT_LIBRARY } from "../splits/library";

const answers = (over: Partial<Answers> = {}): Answers => ({
  goal: "muscle",
  experience: "new",
  daysPerWeek: 3,
  equipment: "gym",
  ...over,
});

const top = (a: Answers) => recommendSplits(a)[0].template;

describe("recommendSplits", () => {
  it("always returns something for a gym-goer", () => {
    for (const goal of ["strength", "muscle", "lean", "endurance", "health"] as const) {
      for (const days of [2, 3, 4, 5, 6]) {
        const r = recommendSplits(answers({ goal, daysPerWeek: days }));
        expect(r.length).toBeGreaterThan(0);
      }
    }
  });

  it("respects the days someone said they can train", () => {
    // The best split is the one they finish, so days is heavily weighted.
    expect(top(answers({ daysPerWeek: 2 })).daysPerWeek).toBeLessThanOrEqual(3);
    expect(top(answers({ daysPerWeek: 6, experience: "experienced" })).daysPerWeek)
      .toBeGreaterThanOrEqual(5);
  });

  it("never hands a beginner an advanced program", () => {
    for (const days of [2, 3, 4, 5, 6]) {
      const t = top(answers({ experience: "new", daysPerWeek: days }));
      expect(t.level).not.toBe("advanced");
    }
  });

  it("picks a lifting or hybrid split for muscle, never pure cardio", () => {
    expect(top(answers({ goal: "muscle" })).category).not.toBe("cardio");
  });

  it("picks something with running or riding in it for endurance", () => {
    const t = top(answers({ goal: "endurance" }));
    expect(["cardio", "hybrid"]).toContain(t.category);
  });

  it("keeps lifting in the plan for fat loss", () => {
    // Dropping the weights while dieting is how people lose the muscle
    // they came for, so a lean goal must not become pure cardio.
    const t = top(answers({ goal: "lean" }));
    expect(["lift", "hybrid"]).toContain(t.category);
  });
});

describe("equipment is a hard filter, not a preference", () => {
  it("never recommends a barbell program to someone with no equipment", () => {
    const recs = recommendSplits(answers({ equipment: "bodyweight" }), 20);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.template.asf.toLowerCase()).not.toContain("barbell");
    }
  });

  it("still finds something for every goal with no equipment", () => {
    for (const goal of ["strength", "muscle", "lean", "endurance", "health"] as const) {
      expect(recommendSplits(answers({ goal, equipment: "bodyweight" })).length)
        .toBeGreaterThan(0);
    }
  });

  it("prefers home-friendly programs for a home setup", () => {
    const t = top(answers({ equipment: "home", goal: "strength", daysPerWeek: 3 }));
    // The machine-heavy splits should lose to the barbell-and-dumbbell ones.
    expect(["strength-3", "full-body-3", "minimalist-2", "old-guard-4"]).toContain(t.id);
  });
});

describe("every recommendation explains itself", () => {
  it("gives at least one plain-language reason", () => {
    for (const r of recommendSplits(answers(), 3)) {
      expect(r.reasons.length).toBeGreaterThan(0);
      for (const reason of r.reasons) {
        expect(reason.length).toBeGreaterThan(20);
      }
    }
  });

  it("says so when the day count is a compromise rather than a match", () => {
    const r = recommendSplits(answers({ daysPerWeek: 5, goal: "health" }))[0];
    const joined = r.reasons.join(" ");
    if (r.template.daysPerWeek !== 5) {
      expect(joined).toMatch(/against the 5|close enough/i);
    }
  });
});

describe("determinism", () => {
  it("returns the same ranking for the same answers", () => {
    const a = answers({ goal: "lean", daysPerWeek: 4, experience: "returning" });
    expect(recommendSplits(a, 5)).toEqual(recommendSplits(a, 5));
  });

  it("scores every template in the library without throwing", () => {
    expect(SPLIT_LIBRARY.length).toBeGreaterThan(0);
    const all = recommendSplits(answers(), SPLIT_LIBRARY.length);
    expect(all.length).toBeGreaterThan(0);
    expect(all.length).toBeLessThanOrEqual(SPLIT_LIBRARY.length);
  });
});
