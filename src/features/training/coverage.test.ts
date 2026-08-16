import { describe, expect, it } from "vitest";
import {
  coverageOf,
  findGaps,
  gapSentence,
  muscleToGroup,
  type MovementMuscles,
} from "./coverage";

const mv = (name: string, primary: string[], secondary: string[] = []): MovementMuscles => ({
  name,
  primary,
  secondary,
});

/** Roughly Yuriel's upper/lower week, which is what prompted all this. */
const UPPER_LOWER: MovementMuscles[] = [
  mv("Barbell Bench Press", ["chest"], ["triceps", "shoulders"]),
  mv("Bent Over Barbell Row", ["middle back"], ["biceps", "forearms", "lats"]),
  mv("Barbell Shoulder Press", ["shoulders"], ["triceps"]),
  mv("Barbell Curl", ["biceps"], ["forearms"]),
  mv("Triceps Pushdown", ["triceps"], []),
  mv("Barbell Squat", ["quadriceps"], ["glutes", "hamstrings", "lower back"]),
  mv("Romanian Deadlift", ["hamstrings"], ["glutes", "lower back", "forearms"]),
  mv("Standing Calf Raises", ["calves"], []),
];

describe("muscleToGroup", () => {
  it("collapses the source labels a lifter treats as one thing", () => {
    expect(muscleToGroup("lats")).toBe("back");
    expect(muscleToGroup("middle back")).toBe("back");
    expect(muscleToGroup("traps")).toBe("back");
  });

  it("keeps lower back separate from back, because they are trained apart", () => {
    expect(muscleToGroup("lower back")).toBe("lowerBack");
    expect(muscleToGroup("lats")).not.toBe("lowerBack");
  });

  it("is case and whitespace insensitive", () => {
    expect(muscleToGroup("  ABDOMINALS ")).toBe("abs");
  });

  it("leaves niche groups unmapped rather than raising false alarms", () => {
    // Nobody is owed a warning that they are not training their neck.
    expect(muscleToGroup("neck")).toBeNull();
    expect(muscleToGroup("adductors")).toBeNull();
  });
});

describe("coverageOf", () => {
  it("records a movement under every group it trains directly", () => {
    const c = coverageOf([mv("Barbell Squat", ["quadriceps"], ["glutes"])]);
    expect(c.quads.direct).toContain("Barbell Squat");
    expect(c.glutes.indirect).toContain("Barbell Squat");
  });

  it("never counts the same movement as both direct and indirect", () => {
    const c = coverageOf([mv("Deadlift", ["hamstrings"], ["hamstrings", "glutes"])]);
    expect(c.hamstrings.direct).toContain("Deadlift");
    expect(c.hamstrings.indirect).not.toContain("Deadlift");
  });

  it("does not double-list a movement", () => {
    const c = coverageOf([mv("Row", ["lats", "middle back"], [])]);
    expect(c.back.direct).toEqual(["Row"]);
  });
});

describe("findGaps — the actual reported problem", () => {
  it("catches exactly what the upper/lower split was missing", () => {
    // The complaint: it's building size but skips forearms, abs and
    // lower back. The engine has to find those without being told.
    const gaps = findGaps(coverageOf(UPPER_LOWER));
    const groups = gaps.map((g) => g.group);
    expect(groups).toContain("abs");
    expect(groups).toContain("forearms");
    expect(groups).toContain("lowerBack");
  });

  it("does not flag what the split genuinely trains", () => {
    const groups = findGaps(coverageOf(UPPER_LOWER)).map((g) => g.group);
    expect(groups).not.toContain("chest");
    expect(groups).not.toContain("quads");
    expect(groups).not.toContain("back");
  });

  it("separates never-trained from only-ever-assists", () => {
    const gaps = findGaps(coverageOf(UPPER_LOWER));
    const abs = gaps.find((g) => g.group === "abs");
    const forearms = gaps.find((g) => g.group === "forearms");
    // Abs appear nowhere at all. Forearms assist on rows, curls and RDLs
    // — telling someone who wants bigger forearms that rows count would
    // be true and useless, so it is reported as the weaker gap.
    expect(abs?.severity).toBe("untrained");
    expect(forearms?.severity).toBe("indirectOnly");
    expect(forearms?.assistedBy.length).toBeGreaterThan(0);
  });

  it("puts the harder omission first", () => {
    const gaps = findGaps(coverageOf(UPPER_LOWER));
    const firstIndirect = gaps.findIndex((g) => g.severity === "indirectOnly");
    const lastUntrained = gaps.map((g) => g.severity).lastIndexOf("untrained");
    expect(lastUntrained).toBeLessThan(firstIndirect);
  });

  it("reports nothing for a program that covers everything", () => {
    const full = [
      ...UPPER_LOWER,
      mv("Hanging Leg Raise", ["abdominals"]),
      mv("Wrist Roller", ["forearms"]),
      mv("Reverse Hyperextension", ["lower back"]),
      mv("Barbell Hip Thrust", ["glutes"]),
    ];
    expect(findGaps(coverageOf(full))).toEqual([]);
  });
});

describe("gapSentence", () => {
  it("says nothing when there is nothing to say", () => {
    expect(gapSentence([])).toBeNull();
  });

  it("names the holes in one readable sentence", () => {
    const s = gapSentence(findGaps(coverageOf(UPPER_LOWER)));
    expect(s).toBeTruthy();
    expect(s!.toLowerCase()).toContain("abs");
    expect(s!.toLowerCase()).toContain("lower back");
  });

  it("gets subject-verb agreement right for one gap and for several", () => {
    // "Forearms and glutes only ever assists" is wrong, and this string
    // is shown on the program-review screen.
    const one = gapSentence([
      { group: "forearms", label: "Forearms", severity: "indirectOnly", assistedBy: ["Row"] },
    ])!;
    const many = gapSentence([
      { group: "forearms", label: "Forearms", severity: "indirectOnly", assistedBy: ["Row"] },
      { group: "glutes", label: "Glutes", severity: "indirectOnly", assistedBy: ["Squat"] },
    ])!;
    expect(one).toContain("only ever assists");
    expect(many).toContain("only ever assist ");
    expect(many).not.toContain("only ever assists");
  });

  it("reads as prose, not a list dump", () => {
    const s = gapSentence(findGaps(coverageOf(UPPER_LOWER)))!;
    expect(s).toMatch(/ and /);
    expect(s.endsWith(".")).toBe(true);
  });
});
