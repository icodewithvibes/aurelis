import { describe, expect, it } from "vitest";
import { isTimedMovement, setUnit } from "./measure";
import { STACKS } from "../training/stacks";

describe("how a movement is measured", () => {
  it("knows a plank is held, not repped", () => {
    expect(isTimedMovement("Plank")).toBe(true);
    expect(setUnit("Plank")).toBe("sec");
  });

  it("catches the way carries are actually written", () => {
    // The stacks say "Farmers Walk", the exercise index says
    // "Farmer's Walk". Both are the same held movement.
    expect(isTimedMovement("Farmers Walk")).toBe(true);
    expect(isTimedMovement("Farmer's Walk")).toBe(true);
    expect(isTimedMovement("Plate Pinch")).toBe(true);
  });

  it("leaves ordinary lifts alone", () => {
    for (const n of ["Barbell Squat", "Mountain Climbers", "Hanging Leg Raise", "Finger Curls"]) {
      expect({ movement: n, timed: isTimedMovement(n) }).toEqual({ movement: n, timed: false });
    }
    expect(setUnit("Barbell Squat")).toBe("reps");
  });

  it("recognises every held movement the stacks prescribe", () => {
    // Whatever a stack asks you to hold has to be labelled as held —
    // "3 × 30–60 reps" for a plank is the bug this exists to stop.
    const held = new Set(["Plank", "Farmers Walk", "Plate Pinch"]);
    const prescribed = new Set(
      STACKS.flatMap((s) => s.levels.flatMap((l) => l.exercises.map((e) => e.name))),
    );
    for (const name of held) {
      if (!prescribed.has(name)) continue;
      expect({ name, timed: isTimedMovement(name) }).toEqual({ name, timed: true });
    }
  });
});
