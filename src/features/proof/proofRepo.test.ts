import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "../../data/db";
import { commitImport } from "../asf/importSplit";
import { getActiveSplit } from "../../data/repositories/splitRepo";
import { startSession, upsertSetLog } from "../../data/repositories/sessionRepo";
import { loadProof, markRecoveryHonored, recordProof } from "./proofRepo";
import { loadHome } from "../../data/access";
import { localDay } from "../../lib/date";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => readFileSync(resolve(here, "../../../02_strategy/fixtures", n), "utf8");

beforeEach(async () => {
  await db.delete();
  await initDb();
});

/** Import the fixture split, log one set of a day, and record proof. */
async function keepASession(weight = 100, reps = 5) {
  await commitImport(fx("asf-valid-basic.txt"));
  const active = await getActiveSplit();
  const day = active!.days[0];
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
  return { sessionId, day, result: await recordProof(sessionId, true) };
}

describe("recordProof", () => {
  it("persists the session, proof event and records before returning", async () => {
    const { sessionId, result } = await keepASession();

    const session = await db.sessions.get(sessionId);
    expect(session!.status).toBe("completed");
    expect(session!.qualified).toBe(true);
    expect(session!.completedAt).toBeGreaterThan(0);

    const events = await db.proofEvents.toArray();
    expect(events.some((e) => e.type === "workout")).toBe(true);

    const records = await db.records.get("alltime");
    expect(records!.totalSessionsKept).toBe(1);
    expect(records!.totalWorkoutsCompleted).toBe(1);

    expect(result.keptCount).toBe(1);
    expect(result.streak).toBe(1);
  });

  it("reports the crest level-up that the completion crossed", async () => {
    const { result } = await keepASession();
    expect(result.crestLevelUp).toEqual({ level: 1, name: "First Mark" });
    expect((await db.settings.get("app"))!.lastCrestLevel).toBe(1);
  });

  it("records first-time PRs and writes a proof event for each", async () => {
    const { result } = await keepASession(100, 5);
    expect(result.prs.map((p) => p.metric).sort()).toEqual(["est1RM", "repPR", "topWeight"]);

    const prs = await db.prs.toArray();
    expect(prs).toHaveLength(3);
    expect(prs.every((p) => p.exerciseName === "Bench Press")).toBe(true);

    const prEvents = (await db.proofEvents.toArray()).filter((e) => e.type === "pr");
    expect(prEvents).toHaveLength(3);
  });

  it("does not re-award a PR that was not beaten", async () => {
    const { day } = await keepASession(100, 5);

    const second = await startSession(day);
    await upsertSetLog({
      sessionId: second,
      exerciseKey: day.exercises[0].id,
      exerciseName: day.exercises[0].name,
      setIndex: 0,
      weight: 90,
      reps: 5,
      done: true,
    });
    const result = await recordProof(second, true);
    expect(result.prs).toEqual([]);
  });

  it("counts one kept DAY even when two sessions are completed", async () => {
    const { day } = await keepASession();
    const second = await startSession(day);
    const result = await recordProof(second, true);

    expect(result.keptCount).toBe(1);
    const records = await db.records.get("alltime");
    expect(records!.totalSessionsKept).toBe(1);
    expect(records!.totalWorkoutsCompleted).toBe(2);
  });

  it("rejects an unknown session rather than writing junk", async () => {
    await expect(recordProof("nope")).rejects.toThrow(/unknown session/);
    expect(await db.proofEvents.count()).toBe(0);
  });
});

describe("loadProof", () => {
  it("reports an honest empty state before anything is kept", async () => {
    const state = await loadProof();
    expect(state.keptCount).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.crest.level).toBe(0);
    expect(state.timeline).toEqual([]);
  });

  it("surfaces the kept session, crest tier and timeline", async () => {
    await keepASession();
    const state = await loadProof();

    expect(state.keptCount).toBe(1);
    expect(state.streak).toBe(1);
    expect(state.crest.name).toBe("First Mark");
    expect(state.totalWorkoutsCompleted).toBe(1);
    expect(state.timeline[0].type).toBeDefined();
    expect(state.week.kept).toBe(1);
  });

  it("agrees with Today's proof language", async () => {
    await keepASession();
    const [proof, home] = await Promise.all([loadProof(), loadHome()]);
    expect(home.sessionsKept).toBe(proof.keptCount);
    expect(home.streak).toBe(proof.streak);
  });
});

describe("markRecoveryHonored", () => {
  it("marks the day and logs it without incrementing the kept count", async () => {
    await markRecoveryHonored(localDay());
    const state = await loadProof();

    expect(state.keptCount).toBe(0);
    expect(state.timeline.some((e) => e.type === "recovery")).toBe(true);
    const marks = await db.dayMarks.toArray();
    expect(marks[0].recoveryHonored).toBe(true);
  });

  it("is idempotent for the same day", async () => {
    await markRecoveryHonored(localDay());
    await markRecoveryHonored(localDay());
    expect(await db.dayMarks.count()).toBe(1);
  });
});
