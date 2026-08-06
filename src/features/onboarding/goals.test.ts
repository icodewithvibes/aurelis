import { describe, expect, it } from "vitest";
import { readGoalText } from "./goals";

const g = (s: string) => readGoalText(s).goal;

describe("readGoalText — the plain cases", () => {
  it("reads the five goals from how people actually phrase them", () => {
    expect(g("i want to get stronger")).toBe("strength");
    expect(g("build muscle")).toBe("muscle");
    expect(g("lose fat")).toBe("lean");
    expect(g("train for a 10k")).toBe("endurance");
    expect(g("just want to feel better")).toBe("health");
  });

  it("handles slang", () => {
    expect(g("wanna get jacked")).toBe("muscle");
    expect(g("tryna get shredded")).toBe("lean");
    expect(g("get swole")).toBe("muscle");
    expect(g("i want big arms")).toBe("muscle");
  });

  it("handles the goals people give instead of a goal", () => {
    expect(g("wedding in june, want to look good")).toBe("lean");
    expect(g("lose my beer belly")).toBe("lean");
    expect(g("get back into it after years off")).toBe("health");
    expect(g("my doctor told me to move more")).toBe("health");
  });

  it("reads numeric strength goals", () => {
    expect(g("i want to bench 225")).toBe("strength");
    expect(g("two plates on squat")).toBe("strength");
    expect(g("get my numbers up")).toBe("strength");
  });

  it("is case and punctuation insensitive", () => {
    expect(g("GET LEAN!!!")).toBe("lean");
    expect(g("  Build   Muscle.  ")).toBe("muscle");
  });
});

describe("readGoalText — the cases that make it deterministic", () => {
  it("says nothing rather than guessing when it recognises nothing", () => {
    const r = readGoalText("asdf qwerty");
    expect(r.goal).toBeNull();
    expect(r.unrecognised).toBe(true);
  });

  it("treats empty input as no answer, not as unrecognised", () => {
    const r = readGoalText("   ");
    expect(r.goal).toBeNull();
    expect(r.unrecognised).toBe(false);
  });

  it("does not fire on words that merely contain a keyword", () => {
    // "abs" inside "absolutely" must not read as a fat-loss goal.
    expect(g("absolutely no idea")).toBeNull();
    // "pr" inside "practice".
    expect(g("practice")).toBeNull();
  });

  it("respects negation", () => {
    // Saying what you do NOT want must not select it.
    const r = readGoalText("i don't want to bulk, i want to get lean");
    expect(r.goal).toBe("lean");
  });

  it("does not let a negation leak across clauses", () => {
    const r = readGoalText("i hate running. i want to build muscle");
    expect(r.goal).toBe("muscle");
  });

  it("returns the runner-up so a close call can be offered, not assumed", () => {
    const r = readGoalText("build muscle and lose fat");
    expect(r.ranked.length).toBeGreaterThanOrEqual(2);
    expect(r.ranked.map((x) => x.goal)).toEqual(
      expect.arrayContaining(["muscle", "lean"]),
    );
  });

  it("lets several weak signals outvote one strong one", () => {
    // "tone up" + "belly" + "definition" is a lean goal even though each
    // word on its own is vague.
    expect(g("tone up, lose the belly, get some definition")).toBe("lean");
  });

  it("shows its work", () => {
    const r = readGoalText("i want to get stronger");
    expect(r.matched).toContain("stronger");
  });

  it("is stable — the same text always reads the same way", () => {
    const once = readGoalText("get lean and run a 5k");
    const twice = readGoalText("get lean and run a 5k");
    expect(once).toEqual(twice);
  });
});
