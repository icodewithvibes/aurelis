import { describe, it, expect } from "vitest";
import {
  adviseForSoreness,
  inferMuscleGroups,
  MUSCLE_GROUPS,
  type SorenessDay,
} from "./soreness";

const days: SorenessDay[] = [
  { dayIndex: 0, name: "Push A", groups: ["chest", "triceps", "shoulders"] },
  { dayIndex: 1, name: "Pull A", groups: ["back", "biceps"] },
  { dayIndex: 2, name: "Legs A", groups: ["quads", "glutes", "hamstrings"] },
];

describe("inferMuscleGroups", () => {
  it("classifies common pressing work", () => {
    expect(inferMuscleGroups(["Bench Press"])).toEqual(
      expect.arrayContaining(["chest", "triceps", "shoulders"]),
    );
  });

  it("classifies pulling work", () => {
    const g = inferMuscleGroups(["Barbell Row", "Lat Pulldown"]);
    expect(g).toEqual(expect.arrayContaining(["back", "biceps"]));
  });

  it("treats a deadlift as posterior chain, not just back", () => {
    expect(inferMuscleGroups(["Deadlift"])).toEqual(
      expect.arrayContaining(["back", "hamstrings", "glutes"]),
    );
  });

  it("does not confuse a Romanian deadlift with a conventional one", () => {
    expect(inferMuscleGroups(["Romanian Deadlift"])).toEqual(["hamstrings"]);
  });

  it("classifies squats as quads and glutes", () => {
    expect(inferMuscleGroups(["Back Squat"])).toEqual(expect.arrayContaining(["quads", "glutes"]));
  });

  it("returns nothing for an unrecognised name rather than guessing", () => {
    expect(inferMuscleGroups(["Sled Drag", "Turkish Get-up"])).toEqual([]);
  });

  it("covers every declared group with some exercise", () => {
    const all = inferMuscleGroups([
      "Bench Press", "Barbell Row", "Overhead Press", "Bicep Curl",
      "Tricep Pushdown", "Back Squat", "Leg Curl", "Hip Thrust",
      "Calf Raise", "Plank",
    ]);
    for (const { key } of MUSCLE_GROUPS) expect(all).toContain(key);
  });
});

describe("adviseForSoreness", () => {
  it("routes pain away from training entirely", () => {
    const a = adviseForSoreness({ sore: ["quads"], severity: "mild", days, isPain: true });
    expect(a.recommended).toBeNull();
    expect(a.trainAnyway).toBe(false);
    expect(a.headline).toMatch(/pain, not soreness/i);
    expect(a.detail).toMatch(/medical/i);
  });

  it("says train it anyway when soreness is mild, and explains why", () => {
    const a = adviseForSoreness({ sore: ["chest"], severity: "mild", days });
    expect(a.trainAnyway).toBe(true);
    expect(a.recommended?.name).toBe("Push A");
    expect(a.detail).toMatch(/warm up|generally fine/i);
  });

  it("suggests a clear day when soreness is moderate", () => {
    const a = adviseForSoreness({ sore: ["chest", "triceps"], severity: "moderate", days });
    expect(a.recommended?.name).toBe("Pull A");
    expect(a.clear.map((d) => d.name)).toEqual(["Pull A", "Legs A"]);
    expect(a.trainAnyway).toBe(false);
  });

  it("suggests a clear day when soreness is severe", () => {
    const a = adviseForSoreness({ sore: ["quads", "glutes"], severity: "severe", days });
    expect(a.recommended?.name).toBe("Push A");
    expect(a.detail).toMatch(/48 hours/i);
  });

  it("calls a recovery day when every day overlaps", () => {
    const a = adviseForSoreness({
      sore: ["chest", "back", "quads", "triceps", "shoulders", "biceps", "glutes", "hamstrings"],
      severity: "severe",
      days,
    });
    expect(a.recommended).toBeNull();
    expect(a.headline).toMatch(/recovery day/i);
    expect(a.clear).toHaveLength(0);
  });

  it("does not invent a rest day when nothing is sore", () => {
    const a = adviseForSoreness({ sore: [], severity: "mild", days });
    expect(a.recommended?.name).toBe("Push A");
    expect(a.clear).toHaveLength(3);
  });

  it("never shames and never claims to diagnose", () => {
    const shaming = /lazy|excuse|weak|soft|man up|push through/i;
    for (const severity of ["mild", "moderate", "severe"] as const) {
      for (const isPain of [true, false]) {
        const a = adviseForSoreness({ sore: ["chest"], severity, days, isPain });
        expect(`${a.headline} ${a.detail}`).not.toMatch(shaming);
        expect(`${a.headline} ${a.detail}`).not.toMatch(/you have (a|an) \w+ injury/i);
      }
    }
  });
});
