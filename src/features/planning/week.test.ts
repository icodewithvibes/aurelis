import { describe, it, expect } from "vitest";
import { buildWeek, buildTrailingWeek, summarizeWeek, STATUS_LABEL, type WeekInputs } from "./week";
import type { DayFacts } from "../proof/engine";

const base: Omit<DayFacts, "date"> = {
  scheduled: false,
  keptSession: false,
  commitmentSet: false,
  commitmentKept: false,
  recoveryHonored: false,
};
const fact = (date: string, over: Partial<DayFacts> = {}): DayFacts => ({ ...base, date, ...over });

// 2026-07-20 is a Monday.
const MONDAY = "2026-07-20";
const ANCHOR = new Date(2026, 6, 20);

const inputs = (over: Partial<WeekInputs> = {}): WeekInputs => ({
  scheduleWeekdays: [1, 3, 5],
  dayNames: ["Push A", "Pull A", "Legs A"],
  dayExerciseCounts: [3, 2, 4],
  anchor: ANCHOR,
  facts: [],
  ...over,
});

describe("buildWeek", () => {
  it("returns exactly seven days starting today", () => {
    const week = buildWeek(inputs(), MONDAY);
    expect(week).toHaveLength(7);
    expect(week[0].date).toBe(MONDAY);
    expect(week[0].isToday).toBe(true);
    expect(week[6].date).toBe("2026-07-26");
    expect(week.slice(1).every((d) => !d.isToday)).toBe(true);
  });

  it("puts the planned workout on its scheduled day", () => {
    const week = buildWeek(inputs(), MONDAY);
    expect(week[0]).toMatchObject({ dayName: "Push A", exerciseCount: 3, status: "planned" });
    expect(week[2]).toMatchObject({ dayName: "Pull A", exerciseCount: 2 }); // Wednesday
    expect(week[4]).toMatchObject({ dayName: "Legs A", exerciseCount: 4 }); // Friday
  });

  it("marks unscheduled days as rest, not as a gap", () => {
    const week = buildWeek(inputs(), MONDAY);
    expect(week[1]).toMatchObject({ dayName: null, status: "rest" }); // Tuesday
    expect(week[5].status).toBe("rest"); // Saturday
  });

  it("names weekdays for a mobile strip", () => {
    const week = buildWeek(inputs(), MONDAY);
    expect(week.map((d) => d.short)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(week[0].long).toBe("Monday");
  });

  it("shows a kept day as kept even when it is today", () => {
    const week = buildWeek(
      inputs({ facts: [fact(MONDAY, { scheduled: true, keptSession: true })] }),
      MONDAY,
    );
    expect(week[0].status).toBe("kept");
  });

  it("has no split to plan against before an import", () => {
    const week = buildWeek(inputs({ dayNames: [], dayExerciseCounts: [] }), MONDAY);
    expect(week.every((d) => d.dayName === null && d.status === "rest")).toBe(true);
  });
});

describe("buildTrailingWeek", () => {
  const FRIDAY = "2026-07-24";

  it("ends on today and looks back seven days", () => {
    const week = buildTrailingWeek(inputs(), FRIDAY);
    expect(week).toHaveLength(7);
    expect(week[6].date).toBe(FRIDAY);
    expect(week[6].isToday).toBe(true);
    expect(week[0].date).toBe("2026-07-18");
  });

  it("calls a scheduled day with nothing recorded 'not logged', never a failure", () => {
    const week = buildTrailingWeek(inputs(), FRIDAY);
    const monday = week.find((d) => d.date === MONDAY)!;
    expect(monday.status).toBe("open");
    expect(STATUS_LABEL.open).toBe("not logged");
    expect(Object.values(STATUS_LABEL).join(" ")).not.toMatch(/fail|missed|skipped/i);
  });

  it("distinguishes kept, partial and honored rest", () => {
    const week = buildTrailingWeek(
      inputs({
        facts: [
          fact(MONDAY, { scheduled: true, keptSession: true }),
          fact("2026-07-22", { scheduled: true, recoveryHonored: true }),
        ],
        sessionsByDate: { "2026-07-23": { id: "s1", status: "partial" } },
      }),
      FRIDAY,
    );
    expect(week.find((d) => d.date === MONDAY)!.status).toBe("kept");
    expect(week.find((d) => d.date === "2026-07-22")!.status).toBe("recovery");
    expect(week.find((d) => d.date === "2026-07-23")!.status).toBe("partial");
  });

  it("links a day to the session that recorded it", () => {
    const week = buildTrailingWeek(
      inputs({ sessionsByDate: { [MONDAY]: { id: "sess-1", status: "completed" } } }),
      FRIDAY,
    );
    expect(week.find((d) => d.date === MONDAY)!.sessionId).toBe("sess-1");
  });

  it("never marks today as not logged", () => {
    const week = buildTrailingWeek(inputs(), FRIDAY);
    expect(week[6].status).toBe("planned"); // Friday is scheduled and still open
  });
});

describe("summarizeWeek", () => {
  it("counts only what the record supports", () => {
    const week = buildTrailingWeek(
      inputs({
        facts: [
          fact(MONDAY, { scheduled: true, keptSession: true }),
          fact("2026-07-22", { scheduled: true, keptSession: true }),
        ],
      }),
      "2026-07-24",
    );
    const s = summarizeWeek(week);
    expect(s.kept).toBe(2);
    expect(s.open).toBe(0);
    expect(s.restDays).toBeGreaterThan(0);
  });
});
