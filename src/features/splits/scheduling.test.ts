import { describe, it, expect } from "vitest";
import { SPLIT_LIBRARY } from "./library";
import { parseASF } from "../asf/parse";
import { dayIndexForDate, scheduleSlots } from "../../lib/schedule";

/**
 * Split scheduling, simulated over a full year.
 *
 * Structural checks (does it parse, do the names resolve) live in
 * library.test.ts. This asks the harder question: once a split is
 * running, does the calendar actually behave?
 *
 * The failure this is really hunting is a ZERO DAY — a date the split
 * claims to schedule that yields no workout, or a day block in the
 * program that no date ever reaches. Either one means a user is shown
 * "rest day" on a day they meant to train, or a written-out session
 * they can never be given, and neither would be visible from reading
 * the template.
 */
const DAY_NAMES: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function scheduleOf(asf: string): number[] {
  const line = /^SCHEDULE:\s*(.+)$/m.exec(asf);
  return (line?.[1] ?? "")
    .split(",")
    .map((s) => DAY_NAMES[s.trim()])
    .filter((n) => n !== undefined);
}

const dayBlockCount = (asf: string) => (asf.match(/^DAY:/gm) ?? []).length;

/** A Monday, so anchoring is not accidentally lucky. */
const ANCHOR = new Date(2026, 0, 5);
const YEAR = 365;

describe.each(SPLIT_LIBRARY.map((t) => [t.id, t] as const))("%s scheduling", (_id, t) => {
  const weekdays = scheduleOf(t.asf);
  const days = dayBlockCount(t.asf);
  const slots = scheduleSlots(weekdays);

  it("parses with no errors", () => {
    const result = parseASF(t.asf);
    const errors = (result.issues ?? []).filter((i) => i.severity === "error");
    expect(errors, JSON.stringify(errors)).toEqual([]);
  });

  it("declares a schedule that matches daysPerWeek", () => {
    expect(slots.length).toBe(t.daysPerWeek);
  });

  it("has NO zero days — every scheduled date yields a workout", () => {
    const misses: string[] = [];
    for (let i = 0; i < YEAR; i++) {
      const d = new Date(ANCHOR);
      d.setDate(d.getDate() + i);
      if (!slots.includes(d.getDay())) continue;
      if (dayIndexForDate(weekdays, days, d, ANCHOR) === null) {
        misses.push(d.toDateString());
      }
    }
    expect(misses.slice(0, 5), `${misses.length} scheduled days produced no workout`).toEqual([]);
  });

  it("never schedules a workout on an unscheduled weekday", () => {
    const extras: string[] = [];
    for (let i = 0; i < YEAR; i++) {
      const d = new Date(ANCHOR);
      d.setDate(d.getDate() + i);
      if (slots.includes(d.getDay())) continue;
      if (dayIndexForDate(weekdays, days, d, ANCHOR) !== null) extras.push(d.toDateString());
    }
    expect(extras.slice(0, 5)).toEqual([]);
  });

  it("reaches every day block it writes out", () => {
    // A session nobody can ever be given is dead weight in the program.
    const seen = new Set<number>();
    for (let i = 0; i < YEAR; i++) {
      const d = new Date(ANCHOR);
      d.setDate(d.getDate() + i);
      const idx = dayIndexForDate(weekdays, days, d, ANCHOR);
      if (idx !== null) seen.add(idx);
    }
    const unreachable = Array.from({ length: days }, (_, i) => i).filter((i) => !seen.has(i));
    expect(unreachable, `day blocks never reachable: ${unreachable.join(", ")}`).toEqual([]);
  });

  it("trains about as often as it promises", () => {
    let count = 0;
    for (let i = 0; i < YEAR; i++) {
      const d = new Date(ANCHOR);
      d.setDate(d.getDate() + i);
      if (dayIndexForDate(weekdays, days, d, ANCHOR) !== null) count++;
    }
    // 52 weeks plus a day or two of remainder.
    expect(count).toBeGreaterThanOrEqual(slots.length * 51);
    expect(count).toBeLessThanOrEqual(slots.length * 53);
  });

  it("starts on the split's FIRST day the week it is imported", () => {
    // A fresh split opening on "Day C" would be baffling.
    for (let i = 0; i < 14; i++) {
      const d = new Date(ANCHOR);
      d.setDate(d.getDate() + i);
      const idx = dayIndexForDate(weekdays, days, d, ANCHOR);
      if (idx !== null) {
        expect(idx).toBe(0);
        return;
      }
    }
    throw new Error("no training day found in the first two weeks");
  });
});

describe("the cardio splits land their sessions on the right weekdays", () => {
  /*
   * REGRESSION. `scheduleSlots` used to sort ascending, so "Mon, Wed,
   * Fri, Sun" became [Sun, Mon, Wed, Fri] and the whole week shifted by
   * one: Sunday got the Easy Run, Monday got Intervals, and the Long
   * Run — the point of the plan — landed on a Friday.
   *
   * Named days rather than indices, because the index being "1" says
   * nothing about whether the plan is right.
   */
  const dayNamesOf = (asf: string) =>
    [...asf.matchAll(/^DAY:\s*(.+)$/gm)].map((m) => m[1].trim());

  it.each([
    ["run-base-4", { Mon: "Easy Run", Wed: "Intervals", Fri: "Steady Run", Sun: "Long Run" }],
    ["cycling-base-4", { Tue: "Easy Ride", Thu: "Bike Intervals", Sat: "Steady Ride", Sun: "Long Ride" }],
  ])("%s puts each session on the weekday it was written for", (id, expected) => {
    const split = SPLIT_LIBRARY.find((t) => t.id === id)!;
    const weekdays = scheduleOf(split.asf);
    const names = dayNamesOf(split.asf);
    const anchor = new Date(2026, 0, 5); // Monday

    const actual: Record<string, string> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor);
      d.setDate(d.getDate() + i);
      const idx = dayIndexForDate(weekdays, names.length, d, anchor);
      if (idx === null) continue;
      const label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      actual[label] = names[idx];
    }
    expect(actual).toEqual(expected);
  });

  it("keeps the long session on the weekend, not mid-week", () => {
    for (const id of ["run-base-4", "cycling-base-4"]) {
      const split = SPLIT_LIBRARY.find((t) => t.id === id)!;
      const weekdays = scheduleOf(split.asf);
      const names = dayNamesOf(split.asf);
      const anchor = new Date(2026, 0, 5);
      const longIdx = names.findIndex((n) => /^Long/.test(n));
      expect(longIdx).toBeGreaterThanOrEqual(0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(anchor);
        d.setDate(d.getDate() + i);
        if (dayIndexForDate(weekdays, names.length, d, anchor) === longIdx) {
          expect([0, 6], `${id}: long session fell on weekday ${d.getDay()}`).toContain(d.getDay());
        }
      }
    }
  });
});

describe("the library as a whole", () => {
  it("offers every category", () => {
    const cats = new Set(SPLIT_LIBRARY.map((t) => t.category));
    expect([...cats].sort()).toEqual(["cardio", "hybrid", "lift"]);
  });

  it("has unique ids and unique names", () => {
    const ids = SPLIT_LIBRARY.map((t) => t.id);
    const names = SPLIT_LIBRARY.map((t) => t.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("names the split the same way in the card and in the ASF", () => {
    // The card offers one name; importing must not produce a different one.
    for (const t of SPLIT_LIBRARY) {
      const inAsf = /^SPLIT:\s*(.+)$/m.exec(t.asf)?.[1].trim();
      const normalise = (s: string) => s.replace(/×/g, "x").trim();
      expect(normalise(inAsf ?? ""), `${t.id} card says "${t.name}"`).toBe(normalise(t.name));
    }
  });

  it("gives every day block at least one exercise", () => {
    for (const t of SPLIT_LIBRARY) {
      let current: string | null = null;
      const counts = new Map<string, number>();
      for (const line of t.asf.split("\n")) {
        const day = /^DAY:\s*(.+)$/.exec(line);
        if (day) {
          current = day[1].trim();
          counts.set(current, 0);
          continue;
        }
        if (/^-\s/.test(line) && current) counts.set(current, (counts.get(current) ?? 0) + 1);
      }
      for (const [day, n] of counts) {
        expect(n, `${t.id} → "${day}" has no exercises`).toBeGreaterThan(0);
      }
    }
  });
});
