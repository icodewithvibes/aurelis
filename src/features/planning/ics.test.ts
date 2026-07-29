import { describe, it, expect } from "vitest";
import { buildCalendar, calendarEventCount } from "./ics";
import type { PlanItemRow } from "../../data/db";

let seq = 0;
const item = (p: Partial<PlanItemRow> & Pick<PlanItemRow, "dateLocal" | "title">): PlanItemRow =>
  ({
    id: `p${++seq}`, atMinutes: null, kind: "life", status: "open",
    createdAt: seq, updatedAt: seq, deletedAt: null, deviceId: "d", ...p,
  }) as PlanItemRow;

const TODAY = "2026-07-29";
const NOW = Date.UTC(2026, 6, 29, 12, 0, 0);
const at = (h: number, m = 0) => h * 60 + m;

describe("buildCalendar", () => {
  it("produces a well-formed VCALENDAR with CRLF line endings", () => {
    const ics = buildCalendar([item({ dateLocal: TODAY, title: "Train", atMinutes: at(19) })], TODAY, 14, NOW);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    // RFC 5545 requires CRLF, and Apple Calendar is strict about it.
    expect(ics.includes("\r\n")).toBe(true);
    expect(/[^\r]\n/.test(ics)).toBe(false);
  });

  it("writes a timed event as FLOATING local time, with no Z or TZID", () => {
    // "7pm" should mean 7pm wherever you are, not shift when you travel.
    const ics = buildCalendar([item({ dateLocal: TODAY, title: "Train", atMinutes: at(19), estMinutes: 60 })], TODAY, 14, NOW);
    expect(ics).toContain("DTSTART:20260729T190000");
    expect(ics).toContain("DTEND:20260729T200000");
    expect(ics).not.toMatch(/DTSTART[^\r\n]*Z/);
    expect(ics).not.toContain("TZID");
  });

  it("gives a timed event TWO alarms — the reason the export exists", () => {
    // A lead alarm alone can be dropped silently on import, so a
    // zero-offset one rides along as the backstop.
    const ics = buildCalendar([item({ dateLocal: TODAY, title: "Train", atMinutes: at(19) })], TODAY, 14, NOW);
    expect((ics.match(/BEGIN:VALARM/g) ?? []).length).toBe(2);
    expect(ics).toContain("TRIGGER;RELATED=START:-PT10M");
    expect(ics).toContain("TRIGGER;RELATED=START:PT0S");
    expect(ics).toContain("ACTION:DISPLAY");
  });

  it("marks events confirmed and busy so they are not filed as tentative", () => {
    const ics = buildCalendar([item({ dateLocal: TODAY, title: "Train", atMinutes: at(19) })], TODAY, 14, NOW);
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).toContain("TRANSP:OPAQUE");
    expect(ics).toContain("SEQUENCE:0");
  });

  it("makes an untimed item an all-day event, not a fake morning slot", () => {
    const ics = buildCalendar([item({ dateLocal: TODAY, title: "Read" })], TODAY, 14, NOW);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260729");
    expect(ics).toContain("DTEND;VALUE=DATE:20260730");
    // No time means no alarm to fire.
    expect(ics).not.toContain("BEGIN:VALARM");
  });

  it("uses a stable UID so re-importing updates instead of duplicating", () => {
    const rows = [item({ dateLocal: TODAY, title: "Train", atMinutes: at(19) })];
    const a = buildCalendar(rows, TODAY, 14, NOW);
    const b = buildCalendar(rows, TODAY, 14, NOW + 500000);
    const uid = (s: string) => /UID:(.+)/.exec(s)![1];
    expect(uid(a)).toBe(uid(b));
  });

  it("escapes the characters that would otherwise break a parser", () => {
    const ics = buildCalendar(
      [item({ dateLocal: TODAY, title: "Squat; then bench, hard\\fast", atMinutes: at(9) })],
      TODAY, 14, NOW,
    );
    expect(ics).toContain("SUMMARY:Squat\\; then bench\\, hard\\\\fast");
  });

  it("folds a long line at 75 octets with a leading space", () => {
    const long = "A".repeat(200);
    const ics = buildCalendar([item({ dateLocal: TODAY, title: long, atMinutes: at(9) })], TODAY, 14, NOW);
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(ics).toMatch(/\r\n /);
  });

  it("counts multi-byte characters as octets when folding", () => {
    const ics = buildCalendar([item({ dateLocal: TODAY, title: "—".repeat(60), atMinutes: at(9) })], TODAY, 14, NOW);
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("exports only open items — a plan, not a log", () => {
    const rows = [
      item({ dateLocal: TODAY, title: "Open", atMinutes: at(9) }),
      item({ dateLocal: TODAY, title: "Done", atMinutes: at(10), status: "done" }),
      item({ dateLocal: TODAY, title: "Dropped", atMinutes: at(11), status: "dropped" }),
      item({ dateLocal: TODAY, title: "Deleted", atMinutes: at(12), deletedAt: 1 }),
    ];
    expect(calendarEventCount(rows, TODAY)).toBe(1);
    expect(buildCalendar(rows, TODAY, 14, NOW)).toContain("SUMMARY:Open");
  });

  it("excludes the past and anything past the horizon", () => {
    const rows = [
      item({ dateLocal: "2026-07-28", title: "Yesterday", atMinutes: at(9) }),
      item({ dateLocal: TODAY, title: "Today", atMinutes: at(9) }),
      item({ dateLocal: "2026-08-30", title: "Far future", atMinutes: at(9) }),
    ];
    const ics = buildCalendar(rows, TODAY, 14, NOW);
    expect(ics).toContain("SUMMARY:Today");
    expect(ics).not.toContain("SUMMARY:Yesterday");
    expect(ics).not.toContain("SUMMARY:Far future");
  });

  it("keeps an event inside its own day rather than crossing midnight", () => {
    const ics = buildCalendar(
      [item({ dateLocal: TODAY, title: "Late", atMinutes: at(23, 55), estMinutes: 30 })],
      TODAY, 14, NOW,
    );
    expect(ics).toContain("DTEND:20260729T235900");
  });

  it("produces a valid empty calendar when there is nothing to export", () => {
    const ics = buildCalendar([], TODAY, 14, NOW);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(calendarEventCount([], TODAY)).toBe(0);
  });

  it("pairs every BEGIN with an END", () => {
    const rows = [
      item({ dateLocal: TODAY, title: "A", atMinutes: at(9) }),
      item({ dateLocal: "2026-07-30", title: "B" }),
    ];
    const ics = buildCalendar(rows, TODAY, 14, NOW);
    const count = (re: RegExp) => (ics.match(re) ?? []).length;
    expect(count(/BEGIN:VEVENT/g)).toBe(count(/END:VEVENT/g));
    expect(count(/BEGIN:VALARM/g)).toBe(count(/END:VALARM/g));
  });
});
