import { describe, expect, it } from "vitest";
import { buildSplit, POOL, type BuildRequest } from "./buildSplit";
import { outcomeOf, parseASF } from "../asf/parse";
import { hasReference } from "../exercises/exerciseDb";
import { COVERAGE_GROUPS, type CoverageGroup } from "../training/coverage";

const req = (over: Partial<BuildRequest> = {}): BuildRequest => ({
  goal: "muscle",
  experience: "experienced",
  daysPerWeek: 4,
  equipment: "gym",
  ...over,
});

const namesIn = (asf: string) =>
  parseASF(asf).program.days.flatMap((d) => d.exercises.map((e) => e.name));

describe("the generated program is a real program", () => {
  it("parses as valid ASF for every goal, day count and setup", () => {
    // If this ever emits something the parser rejects, the generated
    // split cannot be adopted at all — so cover the whole matrix.
    for (const goal of ["strength", "muscle", "lean", "endurance", "health"] as const) {
      for (const days of [2, 3, 4, 5, 6]) {
        for (const equipment of ["gym", "home", "bodyweight"] as const) {
          const built = buildSplit(req({ goal, daysPerWeek: days, equipment }));
          const parsed = parseASF(built.asf);
          // outcomeOf is the real validity gate the importer uses.
          // Asserting on a `.errors` property that does not exist made
          // this test pass without checking anything.
          expect({ goal, days, equipment, outcome: outcomeOf(parsed) }).toEqual({
            goal, days, equipment, outcome: "VALID",
          });
          expect(parsed.program.days.length).toBe(days);
          for (const d of parsed.program.days) {
            expect(d.exercises.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("never prescribes a movement the app cannot show you", () => {
    // A generated program that can't display the movement is worse than
    // a template that can.
    for (const m of POOL) {
      expect(hasReference(m.name)).toBe(true);
    }
  });

  it("schedules rest days rather than filling the week", () => {
    const built = buildSplit(req({ daysPerWeek: 4 }));
    const schedule = parseASF(built.asf).program.scheduleWeekdays ?? [];
    expect(schedule.length).toBe(4);
    expect(built.notes.join(" ")).toMatch(/3 days are rest/);
  });

  it("never repeats a movement across the week", () => {
    const names = namesIn(buildSplit(req({ daysPerWeek: 6 })).asf);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("equipment is honoured, not approximated", () => {
  it("uses nothing but bodyweight movements when there is no equipment", () => {
    const built = buildSplit(req({ equipment: "bodyweight", daysPerWeek: 3 }));
    const bodyweightNames = new Set(POOL.filter((m) => m.bodyweight).map((m) => m.name));
    for (const n of namesIn(built.asf)) {
      expect(bodyweightNames.has(n)).toBe(true);
    }
  });

  it("still produces a full week with no equipment", () => {
    for (const days of [2, 3, 4]) {
      const parsed = parseASF(buildSplit(req({ equipment: "bodyweight", daysPerWeek: days })).asf);
      expect(parsed.program.days.length).toBe(days);
    }
  });
});

describe("closing the gaps — the reported problem", () => {
  const GAPS: CoverageGroup[] = ["forearms", "abs", "lowerBack"];

  it("includes direct work for every group it was told is missing", () => {
    const built = buildSplit(req({ daysPerWeek: 4, mustInclude: GAPS }));
    const chosen = namesIn(built.asf);
    const groupsCovered = new Set(
      POOL.filter((m) => chosen.includes(m.name)).map((m) => m.group),
    );
    for (const g of GAPS) expect(groupsCovered.has(g)).toBe(true);
    expect(built.closed.sort()).toEqual([...GAPS].sort());
  });

  it("says in plain words what it added and why", () => {
    const built = buildSplit(req({ mustInclude: GAPS }));
    const note = built.notes.join(" ");
    expect(note).toMatch(/forearms/i);
    expect(note).toMatch(/abs/i);
    expect(note).toMatch(/lower back/i);
  });

  it("puts the gap work early, not last where it gets skipped", () => {
    // The thing you keep missing is the thing that ends up at the end of
    // a session and then gets dropped when time runs out.
    const built = buildSplit(req({ daysPerWeek: 4, mustInclude: ["abs"] }));
    const days = parseASF(built.asf).program.days;
    const dayWithAbs = days.find((d) =>
      d.exercises.some((e) => POOL.find((m) => m.name === e.name)?.group === "abs"),
    );
    expect(dayWithAbs).toBeTruthy();
    const idx = dayWithAbs!.exercises.findIndex(
      (e) => POOL.find((m) => m.name === e.name)?.group === "abs",
    );
    expect(idx).toBeLessThan(dayWithAbs!.exercises.length - 1);
  });

  it("spreads gap work across days instead of dumping it in one session", () => {
    const built = buildSplit(req({ daysPerWeek: 4, mustInclude: COVERAGE_GROUPS.slice() }));
    const parsed = parseASF(built.asf);
    const perDay = parsed.program.days.map((d) => d.exercises.length);
    expect(Math.max(...perDay) - Math.min(...perDay)).toBeLessThanOrEqual(2);
  });
});

describe("prescriptions match the goal", () => {
  it("gives strength low reps and long rests", () => {
    const asf = buildSplit(req({ goal: "strength" })).asf;
    expect(asf).toMatch(/\| 4-6 \|/);
    expect(asf).toMatch(/Rest 180s/);
  });

  it("gives fat loss higher reps and shorter rests", () => {
    const asf = buildSplit(req({ goal: "lean" })).asf;
    expect(asf).toMatch(/Rest 75s/);
  });

  it("gives a beginner fewer movements per session than an experienced lifter", () => {
    const beginner = parseASF(buildSplit(req({ experience: "new" })).asf).program.days[0];
    const advanced = parseASF(buildSplit(req({ experience: "experienced" })).asf).program.days[0];
    expect(beginner.exercises.length).toBeLessThan(advanced.exercises.length);
  });

  it("never invents a starting weight", () => {
    // The app's standing rule. A number made up by an app is worse than
    // no number.
    const built = buildSplit(req());
    expect(built.asf).not.toMatch(/\d+\s*(lb|kg)/i);
    expect(built.notes.join(" ")).toMatch(/never invents a starting number/i);
  });
});

describe("determinism", () => {
  it("builds the identical program for identical input", () => {
    const a = buildSplit(req({ mustInclude: ["abs", "forearms"] }));
    const b = buildSplit(req({ mustInclude: ["abs", "forearms"] }));
    expect(a.asf).toBe(b.asf);
  });
});
