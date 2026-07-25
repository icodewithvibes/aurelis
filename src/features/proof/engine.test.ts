import { describe, it, expect } from "vitest";
import {
  computeBestStreak,
  computeStreak,
  countKeptDays,
  est1RM,
  newPRs,
  prCandidates,
  resolveDayStatus,
  weekCompletion,
  type DayFacts,
} from "./engine";

const base: Omit<DayFacts, "date"> = {
  scheduled: false,
  keptSession: false,
  commitmentSet: false,
  commitmentKept: false,
  recoveryHonored: false,
};

const day = (date: string, over: Partial<DayFacts> = {}): DayFacts => ({ ...base, date, ...over });

describe("resolveDayStatus", () => {
  it("counts a completed session as kept", () => {
    expect(resolveDayStatus(day("2026-07-20", { scheduled: true, keptSession: true }))).toBe("kept");
  });

  it("counts a kept Forge commitment as kept, even unscheduled", () => {
    expect(resolveDayStatus(day("2026-07-20", { commitmentSet: true, commitmentKept: true }))).toBe("kept");
  });

  it("treats an unmet obligation as missed", () => {
    expect(resolveDayStatus(day("2026-07-20", { scheduled: true }))).toBe("missed");
    expect(resolveDayStatus(day("2026-07-20", { commitmentSet: true }))).toBe("missed");
  });

  it("honours recovery over a missed obligation", () => {
    expect(resolveDayStatus(day("2026-07-20", { scheduled: true, recoveryHonored: true }))).toBe("recovery");
  });

  it("treats a day with nothing owed as rest", () => {
    expect(resolveDayStatus(day("2026-07-20"))).toBe("rest");
  });
});

describe("computeStreak", () => {
  const today = "2026-07-24";

  it("is zero with no history", () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it("counts the first kept day as 1 immediately", () => {
    expect(computeStreak([day(today, { scheduled: true, keptSession: true })], today)).toBe(1);
  });

  it("counts consecutive kept obligations", () => {
    const days = [
      day("2026-07-22", { scheduled: true, keptSession: true }),
      day("2026-07-23", { scheduled: true, keptSession: true }),
      day(today, { scheduled: true, keptSession: true }),
    ];
    expect(computeStreak(days, today)).toBe(3);
  });

  it("bridges rest days without incrementing", () => {
    const days = [
      day("2026-07-22", { scheduled: true, keptSession: true }),
      day("2026-07-23"), // nothing owed
      day(today, { scheduled: true, keptSession: true }),
    ];
    expect(computeStreak(days, today)).toBe(2);
  });

  it("bridges honored recovery without incrementing", () => {
    const days = [
      day("2026-07-22", { scheduled: true, keptSession: true }),
      day("2026-07-23", { scheduled: true, recoveryHonored: true }),
      day(today, { scheduled: true, keptSession: true }),
    ];
    expect(computeStreak(days, today)).toBe(2);
  });

  it("breaks on a missed obligation in the past", () => {
    const days = [
      day("2026-07-21", { scheduled: true, keptSession: true }),
      day("2026-07-22", { scheduled: true }), // missed
      day("2026-07-23", { scheduled: true, keptSession: true }),
      day(today, { scheduled: true, keptSession: true }),
    ];
    expect(computeStreak(days, today)).toBe(2);
  });

  it("does not let an unfinished today break the run", () => {
    const days = [
      day("2026-07-22", { scheduled: true, keptSession: true }),
      day("2026-07-23", { scheduled: true, keptSession: true }),
      day(today, { scheduled: true }), // owed, not yet done
    ];
    expect(computeStreak(days, today)).toBe(2);
  });

  it("ignores days after today", () => {
    const days = [
      day(today, { scheduled: true, keptSession: true }),
      day("2026-07-25", { scheduled: true }),
    ];
    expect(computeStreak(days, today)).toBe(1);
  });
});

describe("computeBestStreak", () => {
  it("remembers the longest past run", () => {
    const today = "2026-07-24";
    const days = [
      day("2026-07-18", { scheduled: true, keptSession: true }),
      day("2026-07-19", { scheduled: true, keptSession: true }),
      day("2026-07-20", { scheduled: true, keptSession: true }),
      day("2026-07-21", { scheduled: true }), // break
      day("2026-07-22", { scheduled: true, keptSession: true }),
      day("2026-07-23", { scheduled: true, keptSession: true }),
      day(today, { scheduled: true }),
    ];
    expect(computeBestStreak(days, today)).toBe(3);
    expect(computeStreak(days, today)).toBe(2);
  });
});

describe("weekCompletion", () => {
  const week = ["2026-07-19", "2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25"];

  it("counts only obligations up to today", () => {
    const days = [
      day("2026-07-20", { scheduled: true, keptSession: true }),
      day("2026-07-22", { scheduled: true, keptSession: true }),
      day("2026-07-24", { scheduled: true }), // today, still owed
      day("2026-07-25", { scheduled: true }), // tomorrow, not yet owed
    ];
    expect(weekCompletion(days, week, "2026-07-24")).toEqual({ kept: 2, obligations: 3, ratio: 2 / 3 });
  });

  it("reports a full ratio when nothing is owed", () => {
    expect(weekCompletion([day("2026-07-20")], week, "2026-07-24")).toEqual({
      kept: 0,
      obligations: 0,
      ratio: 1,
    });
  });
});

describe("countKeptDays", () => {
  it("counts kept days at or before today", () => {
    const days = [
      day("2026-07-23", { scheduled: true, keptSession: true }),
      day("2026-07-24", { commitmentSet: true, commitmentKept: true }),
      day("2026-07-25", { scheduled: true, keptSession: true }),
    ];
    expect(countKeptDays(days, "2026-07-24")).toBe(2);
  });
});

describe("est1RM", () => {
  it("returns the weight itself for a single rep", () => {
    expect(est1RM(100, 1)).toBe(100);
    expect(est1RM(100, 0)).toBe(100);
  });

  it("applies Epley above one rep", () => {
    expect(est1RM(100, 10)).toBe(133.3);
  });
});

describe("prCandidates", () => {
  it("takes the best of each metric per exercise, ignoring unfinished sets", () => {
    const out = prCandidates([
      { exerciseName: "Squat", weight: 100, reps: 5, done: true },
      { exerciseName: "Squat", weight: 120, reps: 3, done: true },
      { exerciseName: "Squat", weight: 200, reps: 1, done: false }, // not completed
      { exerciseName: "Squat", weight: 60, reps: 12, done: true },
    ]);
    const by = (m: string) => out.find((c) => c.metric === m)!.value;
    expect(by("topWeight")).toBe(120);
    expect(by("repPR")).toBe(12);
    expect(by("est1RM")).toBe(est1RM(120, 3)); // 132 beats 100x5 (116.7) and 60x12 (84)
  });

  it("ignores sets with no usable numbers", () => {
    expect(prCandidates([{ exerciseName: "Squat", done: true }])).toEqual([]);
    expect(prCandidates([{ exerciseName: "Squat", weight: 0, reps: 0, done: true }])).toEqual([]);
  });

  it("records a bodyweight rep PR with no weight", () => {
    const out = prCandidates([{ exerciseName: "Pull-up", reps: 8, done: true }]);
    expect(out).toEqual([{ exerciseName: "Pull-up", metric: "repPR", value: 8 }]);
  });
});

describe("newPRs", () => {
  it("keeps only values that beat the standing record", () => {
    const candidates = prCandidates([{ exerciseName: "Squat", weight: 120, reps: 1, done: true }]);
    const standing = new Map([
      ["Squat|topWeight", 120],
      ["Squat|est1RM", 100],
    ]);
    expect(newPRs(candidates, standing).map((c) => c.metric).sort()).toEqual(["est1RM", "repPR"]);
  });

  it("counts a first-ever entry as a PR", () => {
    const candidates = prCandidates([{ exerciseName: "Row", weight: 60, reps: 8, done: true }]);
    expect(newPRs(candidates, new Map())).toHaveLength(3);
  });
});
