import { describe, it, expect } from "vitest";
import {
  exerciseImageUrl,
  loadExerciseIndex,
  matchExercise,
  musclesLabel,
  normalizeName,
  type ExerciseInfo,
} from "./exerciseDb";

const ex = (n: string, over: Partial<ExerciseInfo> = {}): ExerciseInfo => ({
  k: normalizeName(n),
  n,
  e: "barbell",
  l: "intermediate",
  c: "strength",
  p: ["chest"],
  s: ["triceps"],
  i: "Some_Ex/0.jpg",
  d: "Do the thing.",
  ...over,
});

describe("normalizeName", () => {
  it("folds case and punctuation", () => {
    expect(normalizeName("Barbell Bench Press - Medium Grip")).toBe(
      "barbell bench press medium grip",
    );
    expect(normalizeName("3/4 Sit-Up")).toBe("3 4 sit up");
  });
});

describe("exerciseImageUrl", () => {
  it("builds a CDN url and tolerates a prefixed path", () => {
    expect(exerciseImageUrl("Air_Bike/0.jpg")).toBe(
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Air_Bike/0.jpg",
    );
    expect(exerciseImageUrl("exercises/Air_Bike/0.jpg")).toContain("/exercises/Air_Bike/0.jpg");
  });
});

describe("matchExercise", () => {
  const index = [
    ex("Barbell Bench Press - Medium Grip"),
    ex("Decline Barbell Bench Press"),
    ex("Dumbbell Bench Press"),
    ex("Barbell Squat"),
    ex("Romanian Deadlift"),
    ex("Barbell Deadlift"),
    ex("Face Pull"),
  ];

  it("matches an exact name", () => {
    expect(matchExercise("Barbell Squat", index)?.n).toBe("Barbell Squat");
  });

  it("is case and punctuation insensitive", () => {
    expect(matchExercise("barbell squat!!", index)?.n).toBe("Barbell Squat");
  });

  it("prefers the plain variant over a decline one", () => {
    expect(matchExercise("Bench Press", index)?.n).toBe("Barbell Bench Press - Medium Grip");
  });

  it("keeps a qualifier that actually identifies the lift", () => {
    expect(matchExercise("Dumbbell Bench Press", index)?.n).toBe("Dumbbell Bench Press");
    expect(matchExercise("Decline Bench Press", index)?.n).toBe("Decline Barbell Bench Press");
  });

  it("does not confuse a Romanian deadlift with a conventional one", () => {
    expect(matchExercise("Romanian Deadlift", index)?.n).toBe("Romanian Deadlift");
  });

  it("returns null rather than showing a confidently wrong picture", () => {
    expect(matchExercise("Sled Push", index)).toBeNull();
    expect(matchExercise("Turkish Get-Up", index)).toBeNull();
    expect(matchExercise("", index)).toBeNull();
    expect(matchExercise("   ", index)).toBeNull();
  });
});

describe("bundled index", () => {
  it("loads and is well formed", async () => {
    const index = await loadExerciseIndex();
    expect(index.length).toBeGreaterThan(800);
    for (const e of index.slice(0, 50)) {
      expect(e.n).toBeTruthy();
      expect(e.i).toBeTruthy();
      expect(Array.isArray(e.p)).toBe(true);
    }
  });

  it("caches after the first load", async () => {
    const a = await loadExerciseIndex();
    const b = await loadExerciseIndex();
    expect(a).toBe(b);
  });

  it("resolves the common lifts a split actually names", async () => {
    const index = await loadExerciseIndex();
    for (const name of [
      "Bench Press", "Barbell Row", "Overhead Press", "Back Squat",
      "Romanian Deadlift", "Lat Pulldown", "Bicep Curl", "Calf Raise",
    ]) {
      expect(matchExercise(name, index), `no match for ${name}`).not.toBeNull();
    }
  });
});

describe("musclesLabel", () => {
  it("title-cases and joins", () => {
    expect(musclesLabel(ex("X", { p: ["chest"], s: ["triceps", "shoulders"] }))).toBe(
      "Chest · Triceps · Shoulders",
    );
  });
});
