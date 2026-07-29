import { describe, it, expect } from "vitest";
import {
  parseTime, formatTime, formatClock, formatDuration, rhythmFor, trainingVerdict,
  pastCoffeeCutoff, SLEEP_CYCLE_MIN, SLEEP_LATENCY_MIN, COFFEE_CUTOFF_H,
  PREWORKOUT_CUTOFF_H, HARD_TRAINING_CLEAR_H,
} from "./rhythm";

const at = (h: number, m = 0) => h * 60 + m;

describe("time helpers", () => {
  it("parses and rejects", () => {
    expect(parseTime("07:30")).toBe(450);
    expect(parseTime("7:05")).toBe(425);
    expect(parseTime("00:00")).toBe(0);
    expect(parseTime("23:59")).toBe(1439);
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("07:60")).toBeNull();
    expect(parseTime("nope")).toBeNull();
  });

  it("formats, wrapping across midnight so negatives are safe", () => {
    expect(formatTime(450)).toBe("07:30");
    expect(formatTime(-60)).toBe("23:00");   // an hour before midnight
    expect(formatTime(-90)).toBe("22:30");
    expect(formatClock(450)).toBe("7:30 AM");
    expect(formatClock(0)).toBe("12:00 AM");
    expect(formatClock(720)).toBe("12:00 PM");
    expect(formatClock(1335)).toBe("10:15 PM");
    expect(formatClock(-45)).toBe("11:15 PM");
  });

  it("formats durations", () => {
    expect(formatDuration(450)).toBe("7h 30m");
    expect(formatDuration(540)).toBe("9h");
    expect(formatDuration(45)).toBe("45m");
  });
});

describe("rhythmFor", () => {
  const r = rhythmFor(at(7)); // up at 07:00

  it("offers 6 cycles first, then 5 — longest sleep leads", () => {
    expect(r.bedtimes.map((b) => b.cycles)).toEqual([6, 5]);
    expect(r.bedtimes[0].sleepMinutes).toBe(6 * SLEEP_CYCLE_MIN); // 9h
    expect(r.bedtimes[1].sleepMinutes).toBe(5 * SLEEP_CYCLE_MIN); // 7.5h
  });

  it("puts both options inside the AASM 7-9h band", () => {
    for (const b of r.bedtimes) {
      expect(b.sleepMinutes).toBeGreaterThanOrEqual(7 * 60);
      expect(b.sleepMinutes).toBeLessThanOrEqual(9 * 60);
    }
  });

  it("subtracts sleep-onset latency to get the IN BED time", () => {
    // 6 cycles = 9h. Asleep by 22:00, so in bed 15 min earlier.
    expect(formatTime(r.bedtimes[0].asleepMinutes)).toBe("22:00");
    expect(formatTime(r.bedtimes[0].bedMinutes)).toBe("21:45");
    expect(r.bedtimes[0].asleepMinutes - r.bedtimes[0].bedMinutes).toBe(SLEEP_LATENCY_MIN);
  });

  it("computes 5-cycle bedtime correctly too", () => {
    expect(formatTime(r.bedtimes[1].asleepMinutes)).toBe("23:30");
    expect(formatTime(r.bedtimes[1].bedMinutes)).toBe("23:15");
  });

  it("anchors cutoffs to the EARLIEST bedtime, not the latest", () => {
    // A cutoff that only holds if you go to bed late is not a cutoff.
    const anchor = r.bedtimes[0].asleepMinutes;
    expect(r.coffeeCutoffMinutes).toBe(anchor - Math.round(COFFEE_CUTOFF_H * 60));
    expect(r.preworkoutCutoffMinutes).toBe(anchor - Math.round(PREWORKOUT_CUTOFF_H * 60));
  });

  it("puts the coffee cutoff at 8.8h before sleep (Gardiner 2023)", () => {
    // asleep 22:00 − 8h48m = 13:12
    expect(formatTime(r.coffeeCutoffMinutes)).toBe("13:12");
  });

  it("puts the pre-workout cutoff at 13.2h before sleep", () => {
    // asleep 22:00 − 13h12m = 08:48
    expect(formatTime(r.preworkoutCutoffMinutes)).toBe("08:48");
  });

  it("puts the hard-training clear line 4h before sleep", () => {
    expect(formatTime(r.trainingClearMinutes)).toBe("18:00");
    expect(r.trainingClearMinutes).toBe(r.bedtimes[0].asleepMinutes - HARD_TRAINING_CLEAR_H * 60);
  });

  it("handles an early riser without breaking across midnight", () => {
    const early = rhythmFor(at(5));
    expect(formatTime(early.bedtimes[0].asleepMinutes)).toBe("20:00");
    expect(formatTime(early.coffeeCutoffMinutes)).toBe("11:12");
  });

  it("handles a late riser", () => {
    const late = rhythmFor(at(11));
    expect(formatTime(late.bedtimes[0].asleepMinutes)).toBe("02:00");
    expect(formatTime(late.bedtimes[1].asleepMinutes)).toBe("03:30");
  });
});

describe("trainingVerdict", () => {
  const r = rhythmFor(at(7)); // asleep 22:00, clear 18:00, late 21:00

  it("is clear at or before four hours out", () => {
    expect(trainingVerdict(at(17), r)).toBe("clear");
    expect(trainingVerdict(at(18), r)).toBe("clear");
  });

  it("is close between four hours and one hour out", () => {
    expect(trainingVerdict(at(19), r)).toBe("close");
    expect(trainingVerdict(at(21), r)).toBe("close");
  });

  it("is late only inside the final hour", () => {
    expect(trainingVerdict(at(21, 30), r)).toBe("late");
    expect(trainingVerdict(at(22), r)).toBe("late");
  });

  it("does not call a normal evening session a problem", () => {
    // The evidence says 2-4h out is fine; flagging 7pm would be invented.
    expect(trainingVerdict(at(19), r)).not.toBe("late");
  });
});

describe("pastCoffeeCutoff", () => {
  const r = rhythmFor(at(7)); // cutoff 13:12
  it("is false before and true after", () => {
    expect(pastCoffeeCutoff(at(13), r)).toBe(false);
    expect(pastCoffeeCutoff(at(14), r)).toBe(true);
  });
});
