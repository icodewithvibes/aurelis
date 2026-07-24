import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "../db";
import { commitImport } from "../../features/asf/importSplit";
import { getActiveSplit, saveProgramAsActiveSplit } from "./splitRepo";
import { parseASF } from "../../features/asf/parse";
import {
  startSession,
  upsertSetLog,
  finishSession,
  getSession,
  lastSetForExercise,
} from "./sessionRepo";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) =>
  readFileSync(resolve(here, "../../../02_strategy/fixtures", n), "utf8");

beforeEach(async () => {
  // Fresh DB per test (fake-indexeddb).
  await db.delete();
  await initDb();
});

describe("split import persistence", () => {
  it("imports a valid ASF program as the active split and survives a reopen", async () => {
    await commitImport(fx("asf-valid-basic.txt"));
    // simulate reload: close + reopen
    db.close();
    await initDb();

    const active = await getActiveSplit();
    expect(active).not.toBeNull();
    expect(active!.split.name).toBe("Push / Pull / Legs");
    expect(active!.split.scheduleWeekdays).toEqual([1, 3, 5]);
    expect(active!.days[0].name).toBe("Push A");
    expect(active!.days[0].exercises[0]).toMatchObject({ name: "Bench Press", sets: 4, restSec: 120 });
  });

  it("replacing the active split soft-deactivates the prior one (deletion-safe, only one active)", async () => {
    await saveProgramAsActiveSplit(parseASF(fx("asf-valid-basic.txt")).program, "a");
    await saveProgramAsActiveSplit(parseASF(fx("asf-valid-multi-day.txt")).program, "b");

    const active = await getActiveSplit();
    expect(active!.split.name).toBe("Push Pull Legs x2");
    const stillActive = (await db.splits.toArray()).filter((s) => s.active && !s.deletedAt);
    expect(stillActive).toHaveLength(1);
    // prior split row is retained (not hard-deleted)
    expect((await db.splits.toArray()).length).toBe(2);
  });

  it("refuses to import a program with blocking errors", async () => {
    await expect(commitImport(fx("asf-invalid-bad-sets.txt"))).rejects.toThrow();
    expect(await getActiveSplit()).toBeNull();
  });
});

describe("workout logging persistence", () => {
  it("logs sets that survive a reload and resumes the same session", async () => {
    await commitImport(fx("asf-valid-basic.txt"));
    const active = await getActiveSplit();
    const day = active!.days[0];

    const sessionId = await startSession(day);
    await upsertSetLog({
      sessionId, exerciseKey: day.exercises[0].id, exerciseName: "Bench Press",
      setIndex: 0, weight: 135, reps: 8, rpe: 8, done: true,
    });
    // edit same set (upsert, not duplicate)
    await upsertSetLog({
      sessionId, exerciseKey: day.exercises[0].id, exerciseName: "Bench Press",
      setIndex: 0, weight: 140, reps: 8, rpe: 8, done: true,
    });

    // simulate reload
    db.close();
    await initDb();

    const resumedId = await startSession(day); // resumes, not new
    expect(resumedId).toBe(sessionId);
    const s = await getSession(sessionId);
    expect(s!.logs).toHaveLength(1);
    expect(s!.logs[0]).toMatchObject({ weight: 140, reps: 8, done: true });

    const ghost = await lastSetForExercise("Bench Press");
    expect(ghost).toMatchObject({ weight: 140, reps: 8 });
  });

  it("concurrent edits of the same set never duplicate (deterministic id)", async () => {
    await commitImport(fx("asf-valid-basic.txt"));
    const day = (await getActiveSplit())!.days[0];
    const sessionId = await startSession(day);
    const exKey = day.exercises[0].id;
    // Fire upserts for the SAME set without awaiting between them (the race).
    await Promise.all([
      upsertSetLog({ sessionId, exerciseKey: exKey, exerciseName: "Bench Press", setIndex: 0, weight: 135, done: false }),
      upsertSetLog({ sessionId, exerciseKey: exKey, exerciseName: "Bench Press", setIndex: 0, weight: 135, reps: 8, done: false }),
      upsertSetLog({ sessionId, exerciseKey: exKey, exerciseName: "Bench Press", setIndex: 0, weight: 135, reps: 8, done: true }),
    ]);
    const s = await getSession(sessionId);
    expect(s!.logs).toHaveLength(1);
  });

  it("finishing a session records status + qualified without computing streaks", async () => {
    await commitImport(fx("asf-valid-basic.txt"));
    const day = (await getActiveSplit())!.days[0];
    const id = await startSession(day);
    await finishSession(id, true);
    const s = await getSession(id);
    expect(s!.session.status).toBe("completed");
    expect(s!.session.qualified).toBe(true);
    // Stage 3 territory stays empty:
    expect(await db.proofEvents.count()).toBe(0);
    expect(await db.prs.count()).toBe(0);
  });
});
