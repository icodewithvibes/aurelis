import { describe, it, expect } from "vitest";
import { greetingFor, subtitleFor, type GreetingInput } from "./greeting";

const base: GreetingInput = {
  hasSplit: true,
  isTrainingDay: true,
  doneToday: false,
  streak: 0,
  keptCount: 0,
  localDate: "2026-07-25",
  band: "day",
};

const at = (over: Partial<GreetingInput> = {}): GreetingInput => ({ ...base, ...over });

describe("greetingFor", () => {
  it("is stable within a day", () => {
    const first = greetingFor(at());
    for (let i = 0; i < 50; i++) expect(greetingFor(at())).toBe(first);
  });

  it("varies across days", () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      seen.add(greetingFor(at({ localDate: `2026-07-${String(d).padStart(2, "0")}` })));
    }
    expect(seen.size).toBeGreaterThan(2);
  });

  it("speaks differently at different times of day", () => {
    const dawn = new Set<string>();
    const night = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const localDate = `2026-07-${String(d).padStart(2, "0")}`;
      dawn.add(greetingFor(at({ localDate, band: "dawn" })));
      night.add(greetingFor(at({ localDate, band: "night" })));
    }
    // The two bands draw from different libraries.
    expect([...dawn].some((line) => !night.has(line))).toBe(true);
  });

  it("invites setup before a split exists", () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 10; d++) {
      seen.add(greetingFor(at({ hasSplit: false, localDate: `2026-07-0${d % 10}` })));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("acknowledges a finished day rather than nagging", () => {
    const line = greetingFor(at({ doneToday: true }));
    expect(line).toBeTruthy();
    expect(line).not.toMatch(/should|must|failed|behind/i);
  });

  it("names a real run once it exists", () => {
    const lines = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      lines.add(
        greetingFor(at({ doneToday: true, streak: 6, localDate: `2026-07-${String(d).padStart(2, "0")}` })),
      );
    }
    expect([...lines].some((l) => l.includes("6"))).toBe(true);
  });

  it("never claims a streak the data does not support", () => {
    for (let d = 1; d <= 28; d++) {
      const line = greetingFor(
        at({ doneToday: true, streak: 1, localDate: `2026-07-${String(d).padStart(2, "0")}` }),
      );
      expect(line).not.toMatch(/in a row|run stands/i);
    }
  });

  it("treats a rest day as honoured, not as a gap", () => {
    const line = greetingFor(at({ isTrainingDay: false }));
    expect(line).not.toMatch(/missed|skip|fail|lazy/i);
  });

  it("never shames in any branch", () => {
    const shaming = /lazy|weak|excuse|failure|pathetic|behind|should have/i;
    for (const band of ["dawn", "day", "dusk", "night"] as const) {
      for (const doneToday of [true, false]) {
        for (const isTrainingDay of [true, false]) {
          for (let d = 1; d <= 28; d++) {
            const line = greetingFor(
              at({ band, doneToday, isTrainingDay, streak: 4, localDate: `2026-07-${String(d).padStart(2, "0")}` }),
            );
            expect(line).not.toMatch(shaming);
          }
        }
      }
    }
  });
});

describe("subtitleFor", () => {
  it("stays quiet before a split exists", () => {
    expect(subtitleFor(at({ hasSplit: false }))).toBeNull();
  });

  it("invites the first session", () => {
    expect(subtitleFor(at({ keptCount: 0 }))).toMatch(/first kept session/i);
  });

  it("reports a run only above one", () => {
    expect(subtitleFor(at({ doneToday: true, streak: 4 }))).toBe("4 kept in a row.");
    // A streak of one is not a run, so nothing is claimed at all.
    expect(subtitleFor(at({ doneToday: true, streak: 1, keptCount: 1 }))).toBeNull();
  });
});
