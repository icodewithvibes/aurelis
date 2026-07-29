import { describe, it, expect, afterAll } from "vitest";
import { db, initDb, SCHEMA_VERSION } from "./db";

describe("Dexie schema shell (Stage 1)", () => {
  it("opens the database at the expected version with all stores defined", async () => {
    await initDb();
    expect(db.isOpen()).toBe(true);
    expect(db.verno).toBe(SCHEMA_VERSION);

    const expectedStores = [
      "splits",
      "splitDays",
      "templateExercises",
      "sessions",
      "setLogs",
      "forgeEntries",
      "prs",
      "proofEvents",
      "dayMarks",
      // v2: work done outside the split (runs, rides).
      "activities",
      // v3: the planner.
      "planItems",
      "notes",
      "settings",
      "records",
      "meta",
    ];
    const actual = db.tables.map((t) => t.name).sort();
    expect(actual).toEqual([...expectedStores].sort());
  });

  it("persists no real feature data on boot (shell only)", async () => {
    await initDb();
    // No feature writes happen anywhere in Stage 1.
    expect(await db.sessions.count()).toBe(0);
    expect(await db.forgeEntries.count()).toBe(0);
    expect(await db.proofEvents.count()).toBe(0);
    expect(await db.splits.count()).toBe(0);
  });

  afterAll(async () => {
    db.close();
  });
});
