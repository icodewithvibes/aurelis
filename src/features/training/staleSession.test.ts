import { describe, it, expect } from "vitest";
import {
  findStaleSessions,
  lastActivityAt,
  halfSessionSummary,
  stallReasonLabel,
  STALE_AFTER_MS,
} from "./staleSession";
import type { SessionRow, SetLogRow } from "../../data/db";

const HOUR = 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

const session = (p: Partial<SessionRow> & Pick<SessionRow, "id">) =>
  ({
    dateLocal: "2026-07-28", splitDaySnapshot: { dayName: "Push Day" }, status: "active",
    qualified: false, startedAt: NOW - 4 * HOUR, updatedAt: NOW, deletedAt: null, deviceId: "d",
    ...p,
  }) as SessionRow;

const log = (p: Partial<SetLogRow> & Pick<SetLogRow, "id" | "sessionId">) =>
  ({
    exerciseKey: "bench", exerciseName: "Bench", setIndex: 0, done: true,
    updatedAt: NOW - 4 * HOUR, deletedAt: null, ...p,
  }) as SetLogRow;

const map = (logs: SetLogRow[]) => {
  const m = new Map<string, SetLogRow[]>();
  for (const l of logs) m.set(l.sessionId, [...(m.get(l.sessionId) ?? []), l]);
  return m;
};

describe("lastActivityAt", () => {
  it("uses the newest set log, not the session's own updatedAt", () => {
    // updatedAt gets touched by bookkeeping writes that do not mean the
    // user was present, so it must not be what decides staleness.
    const s = session({ id: "s1", startedAt: NOW - 5 * HOUR, updatedAt: NOW });
    const logs = [log({ id: "l1", sessionId: "s1", updatedAt: NOW - 3 * HOUR })];
    expect(lastActivityAt(s, logs)).toBe(NOW - 3 * HOUR);
  });

  it("falls back to startedAt when nothing was logged", () => {
    const s = session({ id: "s1", startedAt: NOW - 5 * HOUR });
    expect(lastActivityAt(s, [])).toBe(NOW - 5 * HOUR);
  });

  it("ignores deleted logs", () => {
    const s = session({ id: "s1", startedAt: NOW - 5 * HOUR });
    const logs = [log({ id: "l1", sessionId: "s1", updatedAt: NOW, deletedAt: 1 })];
    expect(lastActivityAt(s, logs)).toBe(NOW - 5 * HOUR);
  });
});

describe("findStaleSessions", () => {
  it("closes a session that did real work then went quiet", () => {
    const s = session({ id: "s1" });
    const logs = [
      log({ id: "l1", sessionId: "s1", updatedAt: NOW - 3 * HOUR }),
      log({ id: "l2", sessionId: "s1", setIndex: 1, updatedAt: NOW - 3 * HOUR }),
    ];
    const { close, discard } = findStaleSessions([s], map(logs), NOW);
    expect(close).toHaveLength(1);
    expect(close[0].doneSets).toBe(2);
    expect(discard).toHaveLength(0);
  });

  it("leaves a session that is still active alone", () => {
    const s = session({ id: "s1" });
    const logs = [log({ id: "l1", sessionId: "s1", updatedAt: NOW - 20 * 60 * 1000 })];
    const { close } = findStaleSessions([s], map(logs), NOW);
    expect(close).toHaveLength(0);
  });

  it("does not close right up to the threshold, and does just past it", () => {
    const s = session({ id: "s1" });
    const just = [log({ id: "l1", sessionId: "s1", updatedAt: NOW - STALE_AFTER_MS + 1000 })];
    const past = [log({ id: "l1", sessionId: "s1", updatedAt: NOW - STALE_AFTER_MS - 1000 })];
    expect(findStaleSessions([s], map(just), NOW).close).toHaveLength(0);
    expect(findStaleSessions([s], map(past), NOW).close).toHaveLength(1);
  });

  it("DISCARDS a stale session with nothing logged rather than recording it", () => {
    // "You started and did nothing" is noise, and the timeline is
    // supposed to be evidence.
    const s = session({ id: "s1", startedAt: NOW - 5 * HOUR });
    const { close, discard } = findStaleSessions([s], map([]), NOW);
    expect(close).toHaveLength(0);
    expect(discard.map((d) => d.id)).toEqual(["s1"]);
  });

  it("treats sets that were never completed as no work done", () => {
    const s = session({ id: "s1" });
    const logs = [log({ id: "l1", sessionId: "s1", done: false, updatedAt: NOW - 3 * HOUR })];
    const { close, discard } = findStaleSessions([s], map(logs), NOW);
    expect(close).toHaveLength(0);
    expect(discard).toHaveLength(1);
  });

  it("ignores sessions that are already finished or deleted", () => {
    const done = session({ id: "s1", status: "completed" });
    const gone = session({ id: "s2", deletedAt: 1 });
    const part = session({ id: "s3", status: "partial" });
    const logs = [
      log({ id: "l1", sessionId: "s1", updatedAt: NOW - 5 * HOUR }),
      log({ id: "l2", sessionId: "s2", updatedAt: NOW - 5 * HOUR }),
      log({ id: "l3", sessionId: "s3", updatedAt: NOW - 5 * HOUR }),
    ];
    const { close, discard } = findStaleSessions([done, gone, part], map(logs), NOW);
    expect(close).toHaveLength(0);
    expect(discard).toHaveLength(0);
  });

  it("handles several open sessions independently", () => {
    const a = session({ id: "a" });
    const b = session({ id: "b" });
    const logs = [
      log({ id: "l1", sessionId: "a", updatedAt: NOW - 3 * HOUR }),
      log({ id: "l2", sessionId: "b", updatedAt: NOW - 5 * 60 * 1000 }),
    ];
    const { close } = findStaleSessions([a, b], map(logs), NOW);
    expect(close.map((c) => c.session.id)).toEqual(["a"]);
  });
});

describe("wording", () => {
  it("counts sets in plain language", () => {
    expect(halfSessionSummary(1)).toBe("1 set logged before it stopped");
    expect(halfSessionSummary(4)).toBe("4 sets logged before it stopped");
  });

  it("names every reason, and falls back safely", () => {
    expect(stallReasonLabel("sore")).toBe("Too sore");
    expect(stallReasonLabel("injury")).toBe("Something hurt");
  });
});
