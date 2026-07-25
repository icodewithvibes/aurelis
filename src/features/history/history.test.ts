import { describe, it, expect } from "vitest";
import { buildHistory, normalizeSeries, type HistoryEntry } from "./history";
import { est1RM } from "../proof/engine";

const entry = (date: string, sets: HistoryEntry["sets"]): HistoryEntry => ({ date, sets });
const set = (exerciseName: string, weight?: number, reps?: number, done = true) => ({
  exerciseName,
  weight,
  reps,
  done,
});

describe("buildHistory", () => {
  it("keeps the best of each metric per day", () => {
    const [squat] = buildHistory([
      entry("2026-07-20", [set("Squat", 100, 5), set("Squat", 120, 3), set("Squat", 60, 12)]),
    ]);
    expect(squat.points[0]).toEqual({
      date: "2026-07-20",
      topWeight: 120,
      est1RM: est1RM(120, 3),
      bestReps: 12,
    });
  });

  it("ignores sets that were never completed", () => {
    const out = buildHistory([entry("2026-07-20", [set("Squat", 500, 5, false)])]);
    expect(out).toHaveLength(0);
  });

  it("ignores sets with no usable numbers", () => {
    expect(buildHistory([entry("2026-07-20", [set("Squat")])])).toHaveLength(0);
    expect(buildHistory([entry("2026-07-20", [set("Squat", 0, 0)])])).toHaveLength(0);
  });

  it("orders points by date and reports the change", () => {
    const [squat] = buildHistory([
      entry("2026-07-24", [set("Squat", 120, 5)]),
      entry("2026-07-20", [set("Squat", 100, 5)]),
    ]);
    expect(squat.points.map((p) => p.date)).toEqual(["2026-07-20", "2026-07-24"]);
    expect(squat.sessions).toBe(2);
    expect(squat.latest.topWeight).toBe(120);
    expect(squat.changeEst1RM).toBeCloseTo(est1RM(120, 5) - est1RM(100, 5), 1);
  });

  it("refuses to call one session a trend", () => {
    const [squat] = buildHistory([entry("2026-07-20", [set("Squat", 100, 5)])]);
    expect(squat.changeEst1RM).toBeNull();
  });

  it("reports a decline honestly", () => {
    const [squat] = buildHistory([
      entry("2026-07-20", [set("Squat", 140, 5)]),
      entry("2026-07-24", [set("Squat", 100, 5)]),
    ]);
    expect(squat.changeEst1RM!).toBeLessThan(0);
    expect(squat.best.date).toBe("2026-07-20"); // the best stays the best
  });

  it("tracks a bodyweight lift with reps only", () => {
    const [pullup] = buildHistory([entry("2026-07-20", [set("Pull-up", undefined, 8)])]);
    expect(pullup.latest.bestReps).toBe(8);
    expect(pullup.latest.topWeight).toBe(0);
  });

  it("separates exercises and lists the most recent first", () => {
    const out = buildHistory([
      entry("2026-07-20", [set("Bench", 100, 5)]),
      entry("2026-07-24", [set("Squat", 100, 5)]),
    ]);
    expect(out.map((e) => e.name)).toEqual(["Squat", "Bench"]);
  });

  it("merges several sessions on the same day into one point", () => {
    const [squat] = buildHistory([
      entry("2026-07-20", [set("Squat", 100, 5)]),
      entry("2026-07-20", [set("Squat", 130, 2)]),
    ]);
    expect(squat.points).toHaveLength(1);
    expect(squat.points[0].topWeight).toBe(130);
  });
});

describe("normalizeSeries", () => {
  it("maps a range onto 0..1", () => {
    expect(normalizeSeries([10, 20, 30])).toEqual([0, 0.5, 1]);
  });

  it("draws a flat series level rather than at the floor", () => {
    expect(normalizeSeries([50, 50, 50])).toEqual([0.5, 0.5, 0.5]);
  });

  it("handles an empty series", () => {
    expect(normalizeSeries([])).toEqual([]);
  });
});
