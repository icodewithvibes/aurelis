import { describe, it, expect } from "vitest";
import {
  SPLIT_CATEGORIES,
  SPLIT_LIBRARY,
  findTemplate,
  splitsByCategory,
  templateExerciseNames,
} from "./library";
import { parseASF, outcomeOf } from "../asf/parse";
import {
  hasReference,
  loadExerciseIndex,
  matchExercise,
  TEXT_ONLY_EXERCISES,
} from "../exercises/exerciseDb";

describe("library shape", () => {
  it("has unique ids and covers every category", () => {
    const ids = SPLIT_LIBRARY.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { key } of SPLIT_CATEGORIES) {
      expect(splitsByCategory(key).length).toBeGreaterThan(0);
    }
  });

  it("finds a template by id", () => {
    expect(findTemplate("ppl-6")?.name).toBe("The Three Gates 6×");
    expect(findTemplate("nope")).toBeUndefined();
  });

  it("describes who each split is for and why it is built that way", () => {
    for (const s of SPLIT_LIBRARY) {
      expect(s.summary.length).toBeGreaterThan(10);
      expect(s.rationale.length).toBeGreaterThan(40);
      expect(s.targets.length).toBeGreaterThan(0);
      expect(s.daysPerWeek).toBeGreaterThan(0);
    }
  });

  it("never oversells volume or frequency", () => {
    // The 2025 dose-response work is clear that frequency does not add
    // much hypertrophy at matched volume. Nothing here should claim it.
    for (const s of SPLIT_LIBRARY) {
      expect(s.rationale).not.toMatch(/must train each muscle twice/i);
      expect(s.rationale).not.toMatch(/only way to (grow|build)/i);
      // Whole words only. Unbounded, "hack" also fires inside
      // "Hackenschmidt" — a lifter's name, and the origin of a lift in
      // the library. The guard is about marketing language, not spelling.
      expect(`${s.summary} ${s.rationale}`).not.toMatch(
        /\b(guarantee\w*|shred\w*|melt\w*|hacks?)\b/i,
      );
    }
  });
});

describe("every template is valid ASF", () => {
  it.each(SPLIT_LIBRARY.map((s) => [s.id, s] as const))("%s parses with no errors", (_id, s) => {
    const result = parseASF(s.asf);
    const errors = result.issues.filter((i) => i.severity === "error");
    expect(errors, JSON.stringify(errors)).toHaveLength(0);
    expect(outcomeOf(result)).not.toBe("blocked");
    expect(result.program.days.length).toBeGreaterThan(0);
  });

  it("schedules as many weekdays as it claims days per week", () => {
    for (const s of SPLIT_LIBRARY) {
      const { program } = parseASF(s.asf);
      expect(program.scheduleWeekdays.length, s.id).toBe(s.daysPerWeek);
      expect(program.days.length, s.id).toBe(s.daysPerWeek);
    }
  });
});

describe("every exercise either has a photo or is deliberately text-only", () => {
  it("leaves nothing accidentally unmatched", async () => {
    const index = await loadExerciseIndex();
    const unmatched: string[] = [];

    for (const s of SPLIT_LIBRARY) {
      for (const name of templateExerciseNames(s)) {
        // Running and riding are declared text-only on purpose; anything
        // else failing to match would be an accident, not a decision.
        if (!hasReference(name)) continue;
        if (!matchExercise(name, index)) unmatched.push(`${s.id}: ${name}`);
      }
    }

    expect(unmatched, `unmatched: ${unmatched.join(", ")}`).toEqual([]);
  });

  it("only declares cardio as text-only", async () => {
    const index = await loadExerciseIndex();
    for (const name of TEXT_ONLY_EXERCISES) {
      // If the dataset ever gains one of these, drop it from the list
      // rather than hiding a photo we could have shown.
      expect(matchExercise(name, index), `${name} now has a reference`).toBeNull();
    }
  });
});
