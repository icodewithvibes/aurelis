import { describe, expect, it } from "vitest";
import { findStack, stackSnapshot, stacksForGaps, STACKS } from "./stacks";
import { hasReference } from "../exercises/exerciseDb";
import { COVERAGE_GROUPS } from "./coverage";

describe("the stack library", () => {
  it("only prescribes movements the app can show you", () => {
    for (const s of STACKS) {
      for (const e of s.exercises) {
        expect({ stack: s.id, movement: e.name, hasArt: hasReference(e.name) }).toEqual({
          stack: s.id,
          movement: e.name,
          hasArt: true,
        });
      }
    }
  });

  it("uses real coverage groups, so gap matching cannot silently miss", () => {
    for (const s of STACKS) {
      for (const c of s.covers) {
        expect(COVERAGE_GROUPS).toContain(c);
      }
    }
  });

  it("has unique ids", () => {
    expect(new Set(STACKS.map((s) => s.id)).size).toBe(STACKS.length);
  });

  it("is short enough to actually be added onto a day", () => {
    // A "stack" that takes an hour is just another training day.
    for (const s of STACKS) {
      expect(s.minutes).toBeLessThanOrEqual(20);
      expect(s.exercises.length).toBeLessThanOrEqual(4);
    }
  });

  it("covers the gaps that prompted this — abs, forearms, lower back", () => {
    const covered = new Set(STACKS.flatMap((s) => s.covers));
    expect(covered.has("abs")).toBe(true);
    expect(covered.has("forearms")).toBe(true);
    expect(covered.has("lowerBack")).toBe(true);
  });
});

describe("stacksForGaps", () => {
  it("offers nothing when there is nothing missing", () => {
    expect(stacksForGaps([])).toEqual([]);
  });

  it("offers the focused block for a single gap", () => {
    expect(stacksForGaps(["abs"])[0].id).toBe("core");
    expect(stacksForGaps(["forearms"])[0].id).toBe("grip");
    expect(stacksForGaps(["lowerBack"])[0].id).toBe("lower-back");
  });

  it("never offers a stack that misses the gap entirely", () => {
    for (const s of stacksForGaps(["abs"])) {
      expect(s.covers).toContain("abs");
    }
  });

  it("ranks a stack that closes more of the list first", () => {
    const ranked = stacksForGaps(["biceps", "triceps", "calves"]);
    // Arms closes two of the three; calves closes one.
    expect(ranked[0].id).toBe("arms");
  });

  it("breaks ties toward the shorter block", () => {
    const ranked = stacksForGaps(["abs", "forearms", "calves"]);
    const minutes = ranked.map((s) => s.minutes);
    // All three close exactly one gap, so the quickest comes first.
    expect(minutes[0]).toBeLessThanOrEqual(minutes[minutes.length - 1]);
  });
});

describe("stackSnapshot", () => {
  it("produces a session snapshot the logger can run", () => {
    const snap = stackSnapshot(findStack("core")!);
    expect(snap.dayName).toBe("Core stack");
    expect(snap.exercises.length).toBeGreaterThan(0);
    for (const e of snap.exercises) {
      expect(typeof e.key).toBe("string");
      expect(e.sets).toBeGreaterThan(0);
      expect(e.repMax).toBeGreaterThanOrEqual(e.repMin);
    }
  });

  it("gives every exercise a distinct key", () => {
    for (const s of STACKS) {
      const keys = stackSnapshot(s).exercises.map((e) => e.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("names the stack so it is distinguishable in the record", () => {
    // A stack session sits in the same log as split sessions; it has to
    // be obvious later which was which.
    for (const s of STACKS) {
      expect(stackSnapshot(s).dayName).toMatch(/stack$/);
    }
  });
});
