import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "../../data/db";
import { commitImport } from "../asf/importSplit";
import { getActiveSplit, type DayWithExercises } from "../../data/repositories/splitRepo";
import { startSession, upsertSetLog } from "../../data/repositories/sessionRepo";
import { loadProof, recordProof, replayDerivedState } from "./proofRepo";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => readFileSync(resolve(here, "../../../02_strategy/fixtures", n), "utf8");

let day: DayWithExercises;

beforeEach(async () => {
  await db.delete();
  await initDb();
  await commitImport(fx("asf-valid-basic.txt"));
  day = (await getActiveSplit())!.days[0];
});

async function logAndRecord(weight: number, reps: number) {
  const sessionId = await startSession(day);
  await upsertSetLog({
    sessionId,
    exerciseKey: day.exercises[0].id,
    exerciseName: day.exercises[0].name,
    setIndex: 0,
    weight,
    reps,
    done: true,
  });
  await recordProof(sessionId, true);
  return sessionId;
}

const topWeight = async () =>
  (await db.prs.toArray()).find((p) => p.metric === "topWeight")?.value;

describe("replayDerivedState", () => {
  it("is a no-op when nothing changed", async () => {
    await logAndRecord(100, 5);
    const before = await loadProof();
    await replayDerivedState();
    const after = await loadProof();

    expect(after.keptCount).toBe(before.keptCount);
    expect(after.prs.map((p) => `${p.metric}:${p.value}`).sort()).toEqual(
      before.prs.map((p) => `${p.metric}:${p.value}`).sort(),
    );
  });

  it("retracts a PR the corrected log no longer supports", async () => {
    const sessionId = await logAndRecord(225, 5); // fat-fingered
    expect(await topWeight()).toBe(225);

    await upsertSetLog({
      sessionId,
      exerciseKey: day.exercises[0].id,
      exerciseName: day.exercises[0].name,
      setIndex: 0,
      weight: 125, // what actually happened
      reps: 5,
      done: true,
    });
    await replayDerivedState();

    expect(await topWeight()).toBe(125);
    const prEvents = (await db.proofEvents.toArray()).filter((e) => e.type === "pr");
    expect(prEvents.every((e) => !e.summary?.includes("225"))).toBe(true);
  });

  it("awards a PR that the correction reveals", async () => {
    const sessionId = await logAndRecord(100, 5);
    await upsertSetLog({
      sessionId,
      exerciseKey: day.exercises[0].id,
      exerciseName: day.exercises[0].name,
      setIndex: 1,
      weight: 140,
      reps: 3,
      done: true,
    });
    await replayDerivedState();
    expect(await topWeight()).toBe(140);
  });

  it("keeps PRs in chronological order across sessions", async () => {
    await logAndRecord(100, 5);
    await logAndRecord(120, 5);
    await replayDerivedState();

    const weights = (await db.prs.toArray())
      .filter((p) => p.metric === "topWeight")
      .map((p) => p.value)
      .sort((a, b) => a - b);
    // Both were records when they happened; both stay on the timeline.
    expect(weights).toEqual([100, 120]);
  });

  it("never duplicates PR rows when replayed twice", async () => {
    await logAndRecord(100, 5);
    const before = (await db.prs.toArray()).length;
    await replayDerivedState();
    await replayDerivedState();
    expect((await db.prs.toArray()).length).toBe(before);
  });

  it("leaves the session's own history alone", async () => {
    await logAndRecord(100, 5);
    await replayDerivedState();

    const events = await db.proofEvents.toArray();
    expect(events.some((e) => e.type === "workout")).toBe(true);
    expect(events.some((e) => e.type === "crest_levelup")).toBe(true);
  });

  it("refreshes the records row from the log", async () => {
    await logAndRecord(100, 5);
    await db.records.put({
      id: "alltime",
      totalSessionsKept: 99, // corrupted by hand
      totalWorkoutsCompleted: 99,
      totalCommitmentsCompleted: 99,
      bestStreak: 99,
      updatedAt: 0,
    });

    await replayDerivedState();
    const records = await db.records.get("alltime");
    expect(records!.totalSessionsKept).toBe(1);
    expect(records!.totalWorkoutsCompleted).toBe(1);
    expect(records!.bestStreak).toBe(1);
  });
});
