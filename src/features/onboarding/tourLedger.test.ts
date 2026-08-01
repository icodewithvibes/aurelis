import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../../data/db";
import { takeSnapshot, revertToSnapshot, describeRevert } from "./tourLedger";

/**
 * The tour is allowed to create real rows, so revert has to be exact.
 *
 * The failure that matters is not "revert missed something" — it is
 * "revert deleted work the user actually did". Someone with months of
 * sessions must finish the tour with exactly those months, whatever
 * they pressed along the way. Most of these tests exist to pin that.
 */
const now = 1_700_000_000_000;

const settingsRow = (theme = "ceremonial-chrome") =>
  ({
    id: "app", units: "lb", reducedMotion: "auto", streakCountMode: "sessions",
    crisisRegion: "US-MA", theme, lastCrestLevel: 0, updatedAt: now,
  }) as never;

const session = (id: string) =>
  ({
    id, dateLocal: "2026-08-01", splitDaySnapshot: null, status: "completed",
    qualified: true, startedAt: now, updatedAt: now, deletedAt: null, deviceId: "d",
  }) as never;

const planItem = (id: string) =>
  ({
    id, dateLocal: "2026-08-01", title: "x", atMinutes: null, kind: "life",
    status: "open", createdAt: now, updatedAt: now, deletedAt: null, deviceId: "d",
  }) as never;

describe("tour revert", () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await Promise.all(
      ["sessions", "setLogs", "planItems", "splits", "proofEvents", "activities"].map((t) =>
        db.table(t).clear(),
      ),
    );
    await db.settings.put(settingsRow());
  });

  it("removes what the tour created", async () => {
    const snap = await takeSnapshot();
    await db.sessions.put(session("tour-1"));
    await db.planItems.put(planItem("tour-2"));

    const result = await revertToSnapshot(snap);

    expect(await db.sessions.count()).toBe(0);
    expect(await db.planItems.count()).toBe(0);
    expect(result.total).toBe(2);
  });

  it("NEVER removes work that existed before the tour", async () => {
    // The whole point. Six months of history must survive intact.
    await db.sessions.bulkPut([session("old-1"), session("old-2"), session("old-3")]);
    await db.planItems.put(planItem("old-plan"));

    const snap = await takeSnapshot();
    await db.sessions.put(session("tour-1"));
    await revertToSnapshot(snap);

    const left = (await db.sessions.toArray()).map((s) => s.id).sort();
    expect(left).toEqual(["old-1", "old-2", "old-3"]);
    expect(await db.planItems.count()).toBe(1);
  });

  it("is a no-op when the tour created nothing", async () => {
    await db.sessions.put(session("old-1"));
    const snap = await takeSnapshot();

    const result = await revertToSnapshot(snap);

    expect(result.total).toBe(0);
    expect(await db.sessions.count()).toBe(1);
    expect(describeRevert(result)).toMatch(/left no trace/i);
  });

  it("restores a setting the tour changed", async () => {
    const snap = await takeSnapshot();
    await db.settings.put(settingsRow("quiet-forge"));

    await revertToSnapshot(snap);

    expect((await db.settings.get("app"))?.theme).toBe("ceremonial-chrome");
  });

  it("is safe to run twice", async () => {
    await db.sessions.put(session("old-1"));
    const snap = await takeSnapshot();
    await db.sessions.put(session("tour-1"));

    await revertToSnapshot(snap);
    const second = await revertToSnapshot(snap);

    expect(second.total).toBe(0);
    expect(await db.sessions.count()).toBe(1);
  });

  it("hard-deletes rather than soft-deleting", async () => {
    // A soft delete would leave the demonstration in the log forever;
    // revert has to mean the app looks as though the tour never ran.
    const snap = await takeSnapshot();
    await db.sessions.put(session("tour-1"));
    await revertToSnapshot(snap);

    expect(await db.sessions.get("tour-1")).toBeUndefined();
  });

  it("sweeps every table the tour can write to", async () => {
    const snap = await takeSnapshot();
    await db.sessions.put(session("s"));
    await db.planItems.put(planItem("p"));
    await db.activities.put({
      id: "a", dateLocal: "2026-08-01", kind: "run", createdAt: now,
      updatedAt: now, deletedAt: null, deviceId: "d",
    } as never);
    await db.proofEvents.put({
      id: "e", dateLocal: "2026-08-01", type: "workout", title: "x",
      createdAt: now, updatedAt: now, deletedAt: null,
    } as never);

    const result = await revertToSnapshot(snap);

    expect(result.total).toBe(4);
    for (const t of ["sessions", "planItems", "activities", "proofEvents"]) {
      expect(await db.table(t).count(), t).toBe(0);
    }
  });
});

describe("describeRevert", () => {
  it("says what it removed, in plain words", () => {
    expect(describeRevert({ total: 3, removed: { sessions: 1, setLogs: 2 } }))
      .toBe("Removed 1 session, 2 sets.");
  });

  it("says so when there was nothing to undo", () => {
    expect(describeRevert({ total: 0, removed: {} })).toMatch(/left no trace/i);
  });
});
