import { describe, it, expect } from "vitest";
import {
  suggestNext, workingWeight, hasStalled, roundToStep, suggestionLabel,
  STEP_LB, type LiftDay, type RepTarget,
  dayGap,
} from "./progression";

const target: RepTarget = { sets: 3, repMin: 5, repMax: 8 };
const day = (dateLocal: string, sets: [number, number][]): LiftDay => ({
  dateLocal,
  sets: sets.map(([weight, reps]) => ({ weight, reps })),
});

describe("workingWeight", () => {
  it("takes the most-used weight, not the heaviest", () => {
    // One heavy single after four working sets is a top set, not the
    // working weight — progressing off it would ratchet the load up.
    const sets = [
      { weight: 185, reps: 8 }, { weight: 185, reps: 8 },
      { weight: 185, reps: 7 }, { weight: 225, reps: 1 },
    ];
    expect(workingWeight(sets)).toBe(185);
  });

  it("breaks ties toward the heavier weight", () => {
    expect(workingWeight([
      { weight: 185, reps: 8 }, { weight: 195, reps: 6 },
    ])).toBe(195);
  });

  it("is null with nothing logged", () => {
    expect(workingWeight([])).toBeNull();
  });
});

describe("roundToStep", () => {
  it("rounds to real plate jumps", () => {
    expect(roundToStep(189.6, "lb")).toBe(190);
    expect(roundToStep(187, "lb")).toBe(185);
    expect(roundToStep(101.2, "kg")).toBe(100);
    expect(roundToStep(101.9, "kg")).toBe(102.5);
  });
});

describe("suggestNext — first time", () => {
  it("refuses to invent a starting weight", () => {
    const s = suggestNext([], target);
    expect(s.verdict).toBe("first-time");
    expect(s.weight).toBeNull();
    expect(s.basedOn).toBeNull();
    expect(s.reason).toMatch(/pick a weight/i);
  });

  it("treats a day with no completed sets as no history", () => {
    const s = suggestNext([day("2026-07-01", [])], target);
    expect(s.verdict).toBe("first-time");
  });
});

describe("suggestNext — earning the jump", () => {
  it("adds weight when every set hit the top of the range", () => {
    const s = suggestNext([day("2026-07-20", [[185, 8], [185, 8], [185, 8]])], target, "lb");
    expect(s.verdict).toBe("add-weight");
    expect(s.weight).toBe(190); // 185 * 1.025 = 189.6 -> 190
    expect(s.repsLow).toBe(5); // reps reset to the bottom
    expect(s.basedOn).toBe("2026-07-20");
    expect(s.reason).toContain("185 lb × 8, 8, 8");
  });

  it("does NOT add weight when the worst set fell short", () => {
    // 8,8,6 is not "hit the top on every set".
    const s = suggestNext([day("2026-07-20", [[185, 8], [185, 8], [185, 6]])], target);
    expect(s.verdict).toBe("add-reps");
    expect(s.weight).toBe(185);
  });

  it("never suggests a jump smaller than one plate step", () => {
    // 45 * 1.025 = 46.1, which rounds back to 45.
    const s = suggestNext([day("2026-07-20", [[45, 8], [45, 8], [45, 8]])], target, "lb");
    expect(s.weight).toBe(45 + STEP_LB);
  });

  it("uses kg steps when the user logs in kg", () => {
    const s = suggestNext([day("2026-07-20", [[100, 8], [100, 8], [100, 8]])], target, "kg");
    expect(s.weight).toBe(102.5);
    expect(s.reason).toContain("kg");
  });
});

describe("suggestNext — chasing reps", () => {
  it("holds the weight and asks for one more rep", () => {
    const s = suggestNext([day("2026-07-20", [[185, 6], [185, 6], [185, 6]])], target);
    expect(s.verdict).toBe("add-reps");
    expect(s.weight).toBe(185);
    expect(s.repsLow).toBe(7);
    expect(s.repsHigh).toBe(8);
  });

  it("never asks for more than the top of the range", () => {
    const s = suggestNext([day("2026-07-20", [[185, 8], [185, 7]])], target);
    expect(s.repsLow).toBeLessThanOrEqual(target.repMax);
  });
});

describe("suggestNext — falling short", () => {
  it("runs the same weight back when below the bottom of the range", () => {
    const s = suggestNext([day("2026-07-20", [[185, 4], [185, 3]])], target);
    expect(s.verdict).toBe("repeat");
    expect(s.weight).toBe(185);
    expect(s.reason).toMatch(/short of 5/);
  });
});

describe("hasStalled and deload", () => {
  const stalled = [
    day("2026-07-06", [[185, 6], [185, 6], [185, 6]]),
    day("2026-07-13", [[185, 6], [185, 6], [185, 5]]),
    day("2026-07-20", [[185, 6], [185, 6], [185, 6]]),
  ];

  it("spots three sessions at one weight with no gain in the worst set", () => {
    expect(hasStalled(stalled)).toBe(true);
  });

  it("is not stalled if the worst set improved", () => {
    const improving = [
      day("2026-07-06", [[185, 5], [185, 5], [185, 5]]),
      day("2026-07-13", [[185, 6], [185, 6], [185, 6]]),
      day("2026-07-20", [[185, 7], [185, 7], [185, 7]]),
    ];
    expect(hasStalled(improving)).toBe(false);
  });

  it("is not stalled on too little history", () => {
    expect(hasStalled(stalled.slice(0, 2))).toBe(false);
  });

  it("is not stalled when the weight changed", () => {
    const moving = [
      day("2026-07-06", [[175, 6]]),
      day("2026-07-13", [[185, 6]]),
      day("2026-07-20", [[185, 6]]),
    ];
    expect(hasStalled(moving)).toBe(false);
  });

  it("backs off about 10% when stalled", () => {
    const s = suggestNext(stalled, target, "lb");
    expect(s.verdict).toBe("deload");
    expect(s.weight).toBe(165); // 185 * 0.9 = 166.5 -> 165
    expect(s.reason).toMatch(/without the worst set improving/);
  });

  it("still drops at least one step if rounding would stand still", () => {
    const tiny = [
      day("2026-07-06", [[10, 6]]), day("2026-07-13", [[10, 6]]), day("2026-07-20", [[10, 6]]),
    ];
    const s = suggestNext(tiny, target, "lb");
    expect(s.weight).toBeLessThan(10);
  });

  it("prefers deload over add-weight when both could apply", () => {
    // Three sessions pinned at the top of the range is still a stall.
    const pinned = [
      day("2026-07-06", [[185, 8], [185, 8]]),
      day("2026-07-13", [[185, 8], [185, 8]]),
      day("2026-07-20", [[185, 8], [185, 8]]),
    ];
    expect(suggestNext(pinned, target).verdict).toBe("deload");
  });
});

describe("suggestionLabel", () => {
  it("reads as something you could write on a bar", () => {
    expect(suggestionLabel(suggestNext([day("2026-07-20", [[185, 8], [185, 8], [185, 8]])], target), "lb"))
      .toBe("190 lb × 5–8");
  });

  it("omits a weight it does not have", () => {
    expect(suggestionLabel(suggestNext([], target), "lb")).toBe("5–8 reps");
  });
});

describe("today is not evidence about today", () => {
  const target = { sets: 3, repMin: 5, repMax: 8 };
  const clean = (date: string, weight = 100) => ({
    dateLocal: date,
    sets: [
      { weight, reps: 8 },
      { weight, reps: 8 },
      { weight, reps: 8 },
    ],
  });

  it("does not add weight off the session you are currently in", () => {
    // The reported bug: finish three sets at the top of the range and the
    // app immediately says "add weight" — while sets remain. The verdict
    // must ignore today entirely.
    const s = suggestNext([clean("2026-08-03")], target, "lb", "2026-08-03");
    expect(s.verdict).toBe("first-time");
  });

  it("stays put as the current session fills in", () => {
    // Whatever happens today, the plan for today must not move.
    const history = [clean("2026-07-28")];
    const before = suggestNext(history, target, "lb", "2026-08-03");
    const during = suggestNext(
      [...history, { dateLocal: "2026-08-03", sets: [{ weight: 105, reps: 8 }] }],
      target,
      "lb",
      "2026-08-03",
    );
    expect(during.verdict).toBe(before.verdict);
    expect(during.weight).toBe(before.weight);
  });
});

describe("an earned increase waits for recovery", () => {
  const target = { sets: 3, repMin: 5, repMax: 8 };
  const clean = (date: string, weight = 100) => ({
    dateLocal: date,
    sets: [
      { weight, reps: 8 },
      { weight, reps: 8 },
      { weight, reps: 8 },
    ],
  });

  it("adds weight when the lift has rested", () => {
    const s = suggestNext([clean("2026-08-01")], target, "lb", "2026-08-04");
    expect(s.verdict).toBe("add-weight");
    expect(s.weight).toBeGreaterThan(100);
  });

  it("holds the jump when the lift was trained yesterday", () => {
    // Loading up the morning after tests recovery, not strength.
    const s = suggestNext([clean("2026-08-02")], target, "lb", "2026-08-03");
    expect(s.verdict).toBe("hold");
    expect(s.weight).toBe(100);
    expect(s.reason).toMatch(/rest|day/i);
  });

  it("requires the whole prescription, not two good sets", () => {
    // Two sets at the top of a three-set target is a partial session.
    const partial = {
      dateLocal: "2026-08-01",
      sets: [
        { weight: 100, reps: 8 },
        { weight: 100, reps: 8 },
      ],
    };
    const s = suggestNext([partial], target, "lb", "2026-08-04");
    expect(s.verdict).not.toBe("add-weight");
  });

  it("still refuses to invent a first weight", () => {
    expect(suggestNext([], target, "lb", "2026-08-03").weight).toBeNull();
  });
});

describe("dayGap", () => {
  it("counts whole days across a month boundary", () => {
    expect(dayGap("2026-07-31", "2026-08-03")).toBe(3);
  });
  it("is zero for the same day", () => {
    expect(dayGap("2026-08-03", "2026-08-03")).toBe(0);
  });
  it("survives junk rather than throwing", () => {
    expect(dayGap("nope", "2026-08-03")).toBe(0);
  });
});
