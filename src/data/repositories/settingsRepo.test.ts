import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "../db";
import { commitImport } from "../../features/asf/importSplit";
import { getActiveSplit } from "./splitRepo";
import { startSession, upsertSetLog } from "./sessionRepo";
import { recordProof } from "../../features/proof/proofRepo";
import { openForgeEntry } from "../../features/forge/forgeRepo";
import {
  clearLocalData,
  DEFAULT_PREFERENCES,
  loadPreferences,
  resolvePreferences,
  setDefaultRestSec,
  setRpeMode,
  setTheme,
  setUnits,
} from "./settingsRepo";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => readFileSync(resolve(here, "../../../02_strategy/fixtures", n), "utf8");

beforeEach(async () => {
  await db.delete();
  await initDb();
});

describe("preferences", () => {
  it("fall back to defaults for a row written before the fields existed", () => {
    expect(resolvePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    const partial = { id: "app", units: "kg" } as never;
    expect(resolvePreferences(partial).units).toBe("kg");
    expect(resolvePreferences(partial).theme).toBe(DEFAULT_PREFERENCES.theme);
  });

  it("persist and reload", async () => {
    await setTheme("chrome-rider");
    await setUnits("kg");
    await setRpeMode("hidden");
    await setDefaultRestSec(120);

    const prefs = await loadPreferences();
    expect(prefs).toMatchObject({
      theme: "chrome-rider",
      units: "kg",
      rpeMode: "hidden",
      defaultRestSec: 120,
    });
  });

  it("survive a close and reopen", async () => {
    await setTheme("quiet-forge");
    db.close();
    await initDb();
    expect((await loadPreferences()).theme).toBe("quiet-forge");
  });

  it("clamp an absurd rest duration instead of storing it", async () => {
    await setDefaultRestSec(99999);
    expect((await loadPreferences()).defaultRestSec).toBe(600);
    await setDefaultRestSec(1);
    expect((await loadPreferences()).defaultRestSec).toBe(15);
  });
});

describe("clearLocalData", () => {
  it("erases training data but leaves the app usable", async () => {
    await commitImport(fx("asf-valid-basic.txt"));
    const day = (await getActiveSplit())!.days[0];
    const sessionId = await startSession(day);
    await upsertSetLog({
      sessionId,
      exerciseKey: day.exercises[0].id,
      exerciseName: day.exercises[0].name,
      setIndex: 0,
      weight: 100,
      reps: 5,
      done: true,
    });
    await recordProof(sessionId, true);
    await openForgeEntry("need_reset", undefined);

    await setTheme("luminous-meadow");
    await clearLocalData();

    expect(await db.splits.count()).toBe(0);
    expect(await db.splitDays.count()).toBe(0);
    expect(await db.templateExercises.count()).toBe(0);
    expect(await db.sessions.count()).toBe(0);
    expect(await db.setLogs.count()).toBe(0);
    expect(await db.forgeEntries.count()).toBe(0);
    expect(await db.prs.count()).toBe(0);
    expect(await db.proofEvents.count()).toBe(0);

    // Settings survive — clearing data is not a factory reset of choices.
    const prefs = await loadPreferences();
    expect(prefs.theme).toBe("luminous-meadow");

    // Records are re-seeded to zero rather than left dangling.
    const records = await db.records.get("alltime");
    expect(records).toMatchObject({ totalSessionsKept: 0, bestStreak: 0 });

    // The crest high-water mark resets with the data it was derived from.
    expect((await db.settings.get("app"))!.lastCrestLevel).toBe(0);
  });

  it("is safe to run on an empty database", async () => {
    await clearLocalData();
    expect(await db.sessions.count()).toBe(0);
  });
});
