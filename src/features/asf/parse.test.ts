/**
 * ASF parser acceptance tests — BINDING.
 * Loads the real repository fixtures (02_strategy/fixtures/) and asserts
 * the F1–F11 expectations from 02_strategy/07_asf-parser-test-fixtures.md.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseASF, outcomeOf } from "./parse";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name: string) =>
  readFileSync(resolve(here, "../../../02_strategy/fixtures", name), "utf8");

const codes = (r: ReturnType<typeof parseASF>) => r.issues.map((i) => i.code);

describe("ASF parser — valid fixtures", () => {
  it("F1 basic → VALID with exact parse", () => {
    const r = parseASF(fx("asf-valid-basic.txt"));
    expect(outcomeOf(r)).toBe("VALID");
    expect(r.issues).toHaveLength(0);
    expect(r.program.name).toBe("Push / Pull / Legs");
    expect(r.program.scheduleWeekdays).toEqual([1, 3, 5]);
    const push = r.program.days[0];
    expect(push.name).toBe("Push A");
    expect(push.exercises[0]).toMatchObject({
      name: "Bench Press", sets: 4, repMin: 6, repMax: 8, repScheme: "range",
      rpeMin: 8, rpeMax: 8, restSec: 120, flags: [],
    });
  });

  it("F2 complete → VALID with all normalizations", () => {
    const r = parseASF(fx("asf-valid-complete.txt"));
    expect(outcomeOf(r)).toBe("VALID");
    expect(r.program.scheduleWeekdays).toEqual([1, 2, 4, 5]);
    expect(r.program.units).toBe("kg");
    const upper = r.program.days[0];
    expect(upper.note).toBe("Focus on bar speed.");
    const pull = upper.exercises[1]; // Weighted Pull-up | 4 | AMRAP | @9 | Rest 2m30s
    expect(pull).toMatchObject({ repScheme: "amrap", repMin: null, rpeMin: 9, rpeMax: 9, restSec: 150 });
    const ohp = upper.exercises[2]; // RPE 7-8
    expect(ohp).toMatchObject({ rpeMin: 7, rpeMax: 8, restSec: 120 });
    const lower = r.program.days[1];
    const rdl = lower.exercises[1]; // Rest 150s | keep neutral spine
    expect(rdl).toMatchObject({ restSec: 150, rpeMin: null, note: "keep neutral spine", flags: [] });
    const lunge = lower.exercises[2]; // 10-12/side
    expect(lunge).toMatchObject({ repMin: 10, repMax: 12, perSide: true });
  });

  it("F3 minimal → VALID (info default only)", () => {
    const r = parseASF(fx("asf-valid-minimal.txt"));
    expect(outcomeOf(r)).toBe("VALID");
    expect(r.program.name).toBe("Untitled Split");
    expect(r.program.scheduleWeekdays).toEqual([]);
    expect(codes(r)).toContain("DEFAULT_APPLIED");
    expect(r.program.days[0].exercises[0]).toMatchObject({ repScheme: "fixed", repMin: 5, repMax: 5 });
  });

  it("F4 multi-day → VALID, 4 days, order-preserved schedule", () => {
    const r = parseASF(fx("asf-valid-multi-day.txt"));
    expect(outcomeOf(r)).toBe("VALID");
    expect(r.program.days.map((d) => d.name)).toEqual(["Push A", "Pull A", "Legs A", "Push B"]);
    expect(r.program.scheduleWeekdays).toEqual([1, 2, 3, 5, 6, 0]); // never sorted
  });
});

describe("ASF parser — defect fixtures", () => {
  it("F5 no-day → INVALID (EXERCISE_OUTSIDE_DAY @5 + NO_DAY_BLOCKS)", () => {
    const r = parseASF(fx("asf-invalid-no-day.txt"));
    expect(outcomeOf(r)).toBe("INVALID");
    expect(r.issues.find((i) => i.code === "EXERCISE_OUTSIDE_DAY")?.line).toBe(5);
    expect(r.issues.find((i) => i.code === "NO_DAY_BLOCKS")?.line).toBeNull();
    expect(r.program.days).toHaveLength(0);
  });

  it("F6 bad-sets → INVALID, row preserved + flagged, sibling valid", () => {
    const r = parseASF(fx("asf-invalid-bad-sets.txt"));
    expect(outcomeOf(r)).toBe("INVALID");
    const bad = r.issues.find((i) => i.code === "BAD_SETS");
    expect(bad?.line).toBe(5);
    expect(bad?.field).toBe("Sets");
    const day = r.program.days[0];
    expect(day.exercises[0]).toMatchObject({ sets: null, flags: ["BAD_SETS"] });
    expect(day.exercises[1]).toMatchObject({ sets: 3, flags: [] });
  });

  it("F7 bad-reps → INVALID; AMRAP sibling valid", () => {
    const r = parseASF(fx("asf-invalid-bad-reps.txt"));
    expect(outcomeOf(r)).toBe("INVALID");
    expect(r.issues.find((i) => i.code === "BAD_REPS")?.line).toBe(5);
    expect(r.program.days[0].exercises[1]).toMatchObject({ repScheme: "amrap" });
  });

  it("F8 bad-rpe → VALID_WITH_REVIEW, 2 warnings, rpe cleared", () => {
    const r = parseASF(fx("asf-invalid-bad-rpe.txt"));
    expect(outcomeOf(r)).toBe("VALID_WITH_REVIEW");
    const w = r.issues.filter((i) => i.code === "BAD_RPE");
    expect(w.map((i) => i.line)).toEqual([5, 6]);
    expect(r.program.days[0].exercises[0]).toMatchObject({ rpeMin: null, sets: 4, flags: ["BAD_RPE"] });
  });

  it("F9 bad-rest → VALID_WITH_REVIEW, 2 warnings, rest cleared", () => {
    const r = parseASF(fx("asf-invalid-bad-rest.txt"));
    expect(outcomeOf(r)).toBe("VALID_WITH_REVIEW");
    const w = r.issues.filter((i) => i.code === "BAD_REST");
    expect(w.map((i) => i.line)).toEqual([5, 6]);
    expect(r.program.days[0].exercises[0]).toMatchObject({ restSec: null, flags: ["BAD_REST"] });
  });

  it("F10 unknown-field → VALID_WITH_REVIEW; unknowns preserved, never dropped", () => {
    const r = parseASF(fx("asf-invalid-unknown-field.txt"));
    expect(outcomeOf(r)).toBe("VALID_WITH_REVIEW");
    expect(r.issues.find((i) => i.code === "UNKNOWN_HEADER")?.line).toBe(3);
    const uf = r.issues.filter((i) => i.code === "UNKNOWN_FIELD");
    expect(uf.map((i) => i.line)).toEqual([6, 7]);
    // preserved as notes (not silently ignored)
    expect(r.program.days[0].exercises[0].note).toContain("Tempo 3011");
    expect(r.program.days[0].exercises[1].note).toContain("RIR 2");
    expect(r.program.notes ?? "").toContain("TEMPO-DEFAULT");
  });

  it("F11 malformed → INVALID; 3 errors, final row valid, all rows retained", () => {
    const r = parseASF(fx("asf-invalid-malformed-exercise.txt"));
    expect(outcomeOf(r)).toBe("INVALID");
    expect(r.issues.find((i) => i.code === "MALFORMED_LINE")?.line).toBe(5);
    expect(r.issues.find((i) => i.code === "MISSING_NAME")?.line).toBe(6);
    expect(r.issues.find((i) => i.code === "MISSING_REPS")?.line).toBe(7);
    const day = r.program.days[0];
    expect(day.exercises).toHaveLength(4);
    expect(day.exercises[3]).toMatchObject({ name: "Incline Press", sets: 3, flags: [] });
  });

  it("never throws on hostile input", () => {
    for (const t of ["", "   ", "\n\n", "# only comment", "DAY:", "- \n- \n", "|||", "x".repeat(5000)]) {
      expect(() => parseASF(t)).not.toThrow();
    }
  });
});
