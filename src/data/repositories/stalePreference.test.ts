import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { db, SCHEMA_VERSION } from "../db";
import {
  DEFAULT_PREFERENCES,
  resolvePreferences,
  setStaleAfterHours,
  loadPreferences,
  STALE_PRESETS,
} from "./settingsRepo";
import { findStaleSessions } from "../../features/training/staleSession";
import type { SessionRow, SetLogRow } from "../db";

const HOUR = 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("staleAfterHours preference", () => {
  it("defaults to two hours", () => {
    expect(DEFAULT_PREFERENCES.staleAfterHours).toBe(2);
  });

  it("resolves the default for rows written before the field existed", () => {
    // Older settings rows have no staleAfterHours. They must still open.
    const row = { id: "app", units: "lb", reducedMotion: "auto" } as never;
    expect(resolvePreferences(row).staleAfterHours).toBe(2);
  });

  it("offers 1h, 2h, 3h and Never", () => {
    expect([...STALE_PRESETS]).toEqual([1, 2, 3, 0]);
  });

  it("clamps out-of-range values but preserves 0 as 'never'", async () => {
    await db.open();
    await db.settings.put({
      id: "app", units: "lb", reducedMotion: "auto",
      streakCountMode: "sessions", crisisRegion: "US-MA",
      schemaVersion: SCHEMA_VERSION, updatedAt: NOW,
    } as never);

    await setStaleAfterHours(99);
    expect((await loadPreferences()).staleAfterHours).toBe(24);

    await setStaleAfterHours(0);
    expect((await loadPreferences()).staleAfterHours).toBe(0);

    await setStaleAfterHours(-5);
    expect((await loadPreferences()).staleAfterHours).toBe(0);

    await setStaleAfterHours(3);
    expect((await loadPreferences()).staleAfterHours).toBe(3);
    db.close();
  });
});

describe("the preference actually drives the behaviour", () => {
  const session = { id: "s1", dateLocal: "2026-07-28", splitDaySnapshot: null, status: "active",
    qualified: false, startedAt: NOW - 10 * HOUR, updatedAt: NOW, deletedAt: null, deviceId: "d" } as SessionRow;
  const logs = new Map<string, SetLogRow[]>([
    ["s1", [{ id: "l1", sessionId: "s1", exerciseKey: "b", exerciseName: "Bench", setIndex: 0,
      done: true, updatedAt: NOW - 2.5 * HOUR, deletedAt: null } as SetLogRow]],
  ]);

  it("closes at a 2h setting", () => {
    expect(findStaleSessions([session], logs, NOW, 2 * HOUR).close).toHaveLength(1);
  });

  it("does NOT close at a 3h setting — 2.5h idle is still within it", () => {
    expect(findStaleSessions([session], logs, NOW, 3 * HOUR).close).toHaveLength(0);
  });

  it("closes at a 1h setting", () => {
    expect(findStaleSessions([session], logs, NOW, 1 * HOUR).close).toHaveLength(1);
  });

  it("'Never' touches nothing, however long it has been idle", () => {
    const ancient = new Map<string, SetLogRow[]>([
      ["s1", [{ id: "l1", sessionId: "s1", exerciseKey: "b", exerciseName: "Bench", setIndex: 0,
        done: true, updatedAt: NOW - 500 * HOUR, deletedAt: null } as SetLogRow]],
    ]);
    const { close, discard } = findStaleSessions([session], ancient, NOW, 0);
    expect(close).toHaveLength(0);
    expect(discard).toHaveLength(0);
  });

  it("'Never' does not discard empty sessions either", () => {
    const empty = new Map<string, SetLogRow[]>();
    const { close, discard } = findStaleSessions([session], empty, NOW, 0);
    expect(close).toHaveLength(0);
    expect(discard).toHaveLength(0);
  });
});
