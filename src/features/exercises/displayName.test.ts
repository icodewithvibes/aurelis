import { describe, it, expect } from "vitest";
import { displayName, tidyName, mappedNames } from "./displayName";
import { SPLIT_LIBRARY, templateExerciseNames } from "../splits/library";
import index from "./exerciseIndex.json";

describe("displayName", () => {
  it("says what people say in a gym", () => {
    expect(displayName("Barbell Bench Press - Medium Grip")).toBe("Bench Press");
    expect(displayName("Barbell Squat")).toBe("Back Squat");
    expect(displayName("Wide-Grip Lat Pulldown")).toBe("Lat Pulldown");
    expect(displayName("Rowing, Stationary")).toBe("Rowing Machine");
    expect(displayName("Pullups")).toBe("Pull-Up");
  });

  it("leaves a name that is already fine alone", () => {
    for (const n of ["Face Pull", "Plank", "JM Press", "Leg Press", "Good Morning"]) {
      expect(displayName(n)).toBe(n);
    }
  });
});

describe("tidyName — the fallback for anything unmapped", () => {
  it("drops a trailing qualifier after a spaced dash", () => {
    expect(tidyName("Dips - Triceps Version")).toBe("Dips");
  });

  it("does NOT break hyphenated words", () => {
    // "Chin-Up" must survive; the split is on " - ", not "-".
    expect(tidyName("Chin-Up")).toBe("Chin-Up");
    expect(tidyName("One-Arm Dumbbell Row")).toBe("One-Arm Dumbbell Row");
  });

  it("un-inverts a comma name", () => {
    expect(tidyName("Rowing, Stationary")).toBe("Stationary Rowing");
  });

  it("strips grip qualifiers that add nothing", () => {
    expect(tidyName("Barbell Incline Bench Press Medium-Grip")).toBe("Barbell Incline Bench Press");
  });

  it("never returns an empty string", () => {
    for (const e of (index as { n: string }[]).slice(0, 300)) {
      expect(displayName(e.n).length).toBeGreaterThan(0);
    }
  });
});

describe("it is DISPLAY only", () => {
  it("every mapped key is a string the app actually renders", () => {
    /*
     * A key that matches neither source is dead: the map silently stops
     * applying, and it implies a rename that never happened.
     *
     * TWO sources count, because two different strings reach a screen.
     * The split library's name is what gets written to setLogs, so it
     * is what Proof and the timeline show; the database's name is what
     * the photo sheet shows. They are not always identical — incline
     * bench is "…Press Medium-Grip" in one and "…Press - Medium Grip"
     * in the other.
     */
    const dbNames = new Set((index as { n: string }[]).map((e) => e.n));
    const splitNames = new Set<string>();
    for (const t of SPLIT_LIBRARY) for (const n of templateExerciseNames(t)) splitNames.add(n);

    for (const key of mappedNames()) {
      expect(
        dbNames.has(key) || splitNames.has(key),
        `${key} appears in neither the exercise database nor the split library`,
      ).toBe(true);
    }
  });

  it("covers every lift the shipped splits use", () => {
    const used = new Set<string>();
    for (const t of SPLIT_LIBRARY) for (const n of templateExerciseNames(t)) used.add(n);

    // Anything not explicitly mapped must at least come out tidy —
    // no trailing dashes, no inverted commas, no double spaces.
    for (const name of used) {
      const shown = displayName(name);
      expect(shown).not.toMatch(/ - /);
      expect(shown).not.toMatch(/,\s*$/);
      expect(shown).not.toMatch(/\s{2,}/);
      expect(shown.trim()).toBe(shown);
    }
  });

  it("is stable — the same input always gives the same output", () => {
    expect(displayName("Barbell Squat")).toBe(displayName("Barbell Squat"));
  });
});
