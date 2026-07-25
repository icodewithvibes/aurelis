import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "../../data/db";
import { commitImport } from "../asf/importSplit";
import { getActiveSplit } from "../../data/repositories/splitRepo";
import { startSession, upsertSetLog } from "../../data/repositories/sessionRepo";
import { recordProof, loadProof } from "../proof/proofRepo";
import { exportBackup, restoreBackup, restoreBackupFromText } from "./backupRepo";
import { backupFilename, summarizeBackup, validateBackup, BACKUP_SCHEMA } from "./backup";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => readFileSync(resolve(here, "../../../02_strategy/fixtures", n), "utf8");

beforeEach(async () => {
  await db.delete();
  await initDb();
});

async function seed() {
  await commitImport(fx("asf-valid-basic.txt"));
  const day = (await getActiveSplit())!.days[0];
  const sessionId = await startSession(day);
  await upsertSetLog({
    sessionId,
    exerciseKey: day.exercises[0].id,
    exerciseName: day.exercises[0].name,
    setIndex: 0,
    weight: 135,
    reps: 5,
    done: true,
  });
  await recordProof(sessionId, true);
}

describe("validateBackup", () => {
  it("rejects anything that is not an AURELIS backup", () => {
    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup("nope").ok).toBe(false);
    expect(validateBackup({ app: "other", schema: 1, data: {} }).ok).toBe(false);
  });

  it("rejects a backup from a newer app version rather than guessing", () => {
    const r = validateBackup({ app: "aurelis", schema: BACKUP_SCHEMA + 1, data: {} });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/newer version/i);
  });

  it("rejects a malformed table", () => {
    const r = validateBackup({ app: "aurelis", schema: 1, data: { sessions: "not-an-array" } });
    expect(r.ok).toBe(false);
  });

  it("tolerates a table missing from an older export", () => {
    const r = validateBackup({ app: "aurelis", schema: 1, data: { sessions: [] } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.counts.notes).toBe(0);
  });
});

describe("export and restore", () => {
  it("round-trips a full training history", async () => {
    await seed();
    const before = await loadProof();
    const file = await exportBackup();

    expect(file.app).toBe("aurelis");
    expect(file.data.sessions).toHaveLength(1);
    expect(file.data.setLogs).toHaveLength(1);

    // Wipe everything, then restore.
    await db.delete();
    await initDb();
    expect((await loadProof()).keptCount).toBe(0);

    const result = await restoreBackup(file);
    expect(result.ok).toBe(true);

    const after = await loadProof();
    expect(after.keptCount).toBe(before.keptCount);
    expect(after.totalWorkoutsCompleted).toBe(before.totalWorkoutsCompleted);
    expect((await getActiveSplit())!.split.name).toBe("Push / Pull / Legs");
    expect(await db.prs.count()).toBe(3);
  });

  it("REPLACES rather than merges, so no invented history", async () => {
    await seed();
    const file = await exportBackup();

    // Record a second, different day of work.
    const day = (await getActiveSplit())!.days[0];
    const second = await startSession(day);
    await recordProof(second, true);
    const extra = await db.sessions.count();
    expect(extra).toBe(2);

    await restoreBackup(file);
    expect(await db.sessions.count()).toBe(1);
  });

  it("leaves the database untouched when the file is rejected", async () => {
    await seed();
    const before = await db.sessions.count();

    const result = await restoreBackup({ app: "not-aurelis" });
    expect(result.ok).toBe(false);
    expect(await db.sessions.count()).toBe(before);
  });

  it("reports invalid JSON instead of throwing", async () => {
    const r = await restoreBackupFromText("{ definitely not json");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/valid JSON/i);
  });

  it("restores from exported text", async () => {
    await seed();
    const text = JSON.stringify(await exportBackup());
    await db.delete();
    await initDb();

    expect((await restoreBackupFromText(text)).ok).toBe(true);
    expect((await loadProof()).keptCount).toBe(1);
  });
});

describe("presentation helpers", () => {
  it("names the file by date", () => {
    expect(backupFilename(new Date(2026, 6, 25))).toBe("aurelis-backup-2026-07-25.json");
  });

  it("summarises what a backup holds", () => {
    expect(summarizeBackup({ sessions: 1, setLogs: 4, splits: 1 })).toBe(
      "1 session · 4 sets · 1 split",
    );
    expect(summarizeBackup({})).toBe("no training data");
  });
});
