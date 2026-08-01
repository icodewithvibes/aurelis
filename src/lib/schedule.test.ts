import { describe, it, expect } from "vitest";
import {
  dayIndexForDate,
  planSchedule,
  relativeDayLabel,
  scheduleSlots,
  weekdayName,
} from "./schedule";

/** Local-midnight date helper (month is 1-based here for readability). */
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

// 2026-07-20 is a Monday; that week runs Mon 20 … Sun 26.
const MON = d(2026, 7, 20);
const TUE = d(2026, 7, 21);
const WED = d(2026, 7, 22);
const FRI = d(2026, 7, 24);
const SAT = d(2026, 7, 25);

const MWF = [1, 3, 5];

describe("scheduleSlots", () => {
  /*
   * Ordering runs from the FIRST weekday written, not from Sunday.
   *
   * The data model calls this order LOCKED — "order preserved as
   * written" — and sorting ascending quietly threw it away. That got a
   * shipped split wrong: "Mon, Wed, Fri, Sun" over [Easy, Intervals,
   * Easy, Long] put Sunday at slot 0, making Sunday the easy run and
   * dropping the long run on a Friday.
   */
  it("de-duplicates and orders from the first weekday written", () => {
    expect(scheduleSlots([5, 1, 3, 1])).toEqual([5, 1, 3]); // Fri, Mon, Wed
    expect(scheduleSlots([6, 0])).toEqual([6, 0]); // Sat, Sun
  });

  it("leaves an already-ascending schedule exactly as it was", () => {
    // Every split without a wrapping weekday is untouched by the change.
    expect(scheduleSlots([1, 3, 5])).toEqual([1, 3, 5]);
    expect(scheduleSlots([1, 2, 4, 5])).toEqual([1, 2, 4, 5]);
  });

  it("keeps a schedule that wraps past Sunday in the author's order", () => {
    expect(scheduleSlots([1, 3, 5, 0])).toEqual([1, 3, 5, 0]); // Mon, Wed, Fri, Sun
    expect(scheduleSlots([2, 4, 6, 0])).toEqual([2, 4, 6, 0]); // Tue, Thu, Sat, Sun
  });

  it("normalises out-of-range weekdays", () => {
    expect(scheduleSlots([7, 8])).toEqual([0, 1]);
  });
});

describe("dayIndexForDate — even split (3 days over 3 slots)", () => {
  it("maps each scheduled weekday to its own day, in order", () => {
    expect(dayIndexForDate(MWF, 3, MON)).toBe(0);
    expect(dayIndexForDate(MWF, 3, WED)).toBe(1);
    expect(dayIndexForDate(MWF, 3, FRI)).toBe(2);
  });

  it("returns null on unscheduled days", () => {
    expect(dayIndexForDate(MWF, 3, TUE)).toBeNull();
    expect(dayIndexForDate(MWF, 3, SAT)).toBeNull();
  });

  it("repeats identically the following week (no drift)", () => {
    expect(dayIndexForDate(MWF, 3, d(2026, 7, 27))).toBe(0); // next Monday
    expect(dayIndexForDate(MWF, 3, d(2026, 8, 3))).toBe(0);
    expect(dayIndexForDate(MWF, 3, d(2027, 1, 4))).toBe(0);
  });
});

describe("dayIndexForDate — rotation (4 days over 3 slots)", () => {
  it("carries the rotation forward each week from the import week", () => {
    // week 1: A B C
    expect(dayIndexForDate(MWF, 4, MON, MON)).toBe(0);
    expect(dayIndexForDate(MWF, 4, WED, MON)).toBe(1);
    expect(dayIndexForDate(MWF, 4, FRI, MON)).toBe(2);
    // week 2: D A B
    expect(dayIndexForDate(MWF, 4, d(2026, 7, 27), MON)).toBe(3);
    expect(dayIndexForDate(MWF, 4, d(2026, 7, 29), MON)).toBe(0);
    expect(dayIndexForDate(MWF, 4, d(2026, 7, 31), MON)).toBe(1);
    // week 3: C D A
    expect(dayIndexForDate(MWF, 4, d(2026, 8, 3), MON)).toBe(2);
    expect(dayIndexForDate(MWF, 4, d(2026, 8, 5), MON)).toBe(3);
    expect(dayIndexForDate(MWF, 4, d(2026, 8, 7), MON)).toBe(0);
  });

  it("visits every day of the split before repeating one", () => {
    const seen = new Set<number | null>();
    for (let i = 0; i < 28; i++) {
      seen.add(dayIndexForDate(MWF, 4, d(2026, 7, 20 + i), MON));
    }
    expect([...seen].filter((v) => v !== null).sort()).toEqual([0, 1, 2, 3]);
  });

  it("alternates A/B for a 2-day split on a 1-day schedule", () => {
    const sunday = [0];
    const anchor = d(2026, 7, 19); // a Sunday
    expect(dayIndexForDate(sunday, 2, d(2026, 7, 19), anchor)).toBe(0);
    expect(dayIndexForDate(sunday, 2, d(2026, 7, 26), anchor)).toBe(1);
    expect(dayIndexForDate(sunday, 2, d(2026, 8, 2), anchor)).toBe(0);
  });

  it("starts a mid-week import on the slot that comes next, not day one", () => {
    // Imported Tuesday: Wednesday is slot 1 → Pull A, per the split's own order.
    expect(dayIndexForDate(MWF, 3, WED, TUE)).toBe(1);
  });
});

describe("dayIndexForDate — degenerate input", () => {
  it("returns null with no schedule or no days", () => {
    expect(dayIndexForDate([], 3, MON)).toBeNull();
    expect(dayIndexForDate(MWF, 0, MON)).toBeNull();
  });
});

describe("planSchedule", () => {
  it("resolves today and the next session on a training day", () => {
    const plan = planSchedule(MWF, 3, MON);
    expect(plan.isTrainingDay).toBe(true);
    expect(plan.todayDayIndex).toBe(0);
    expect(plan.next).toEqual({ dayIndex: 1, weekday: 3, daysAway: 2 });
  });

  it("resolves a rest day and still points at what is next", () => {
    const plan = planSchedule(MWF, 3, SAT);
    expect(plan.isTrainingDay).toBe(false);
    expect(plan.todayDayIndex).toBeNull();
    expect(plan.next).toEqual({ dayIndex: 0, weekday: 1, daysAway: 2 });
  });

  it("looks a full week ahead for a single-day schedule", () => {
    const plan = planSchedule([1], 1, MON);
    expect(plan.next).toEqual({ dayIndex: 0, weekday: 1, daysAway: 7 });
  });

  it("has no next session when nothing is scheduled", () => {
    expect(planSchedule([], 3, MON).next).toBeNull();
  });
});

describe("labels", () => {
  it("names weekdays", () => {
    expect(weekdayName(0)).toBe("Sunday");
    expect(weekdayName(3)).toBe("Wednesday");
  });

  it("reads naturally at each distance", () => {
    expect(relativeDayLabel(1, 2)).toBe("tomorrow");
    expect(relativeDayLabel(3, 4)).toBe("Thursday");
    expect(relativeDayLabel(7, 1)).toBe("next Monday");
  });
});
