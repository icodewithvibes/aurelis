/**
 * Settings repository (Stage 2/3/4) — the single 'app' settings row.
 * Local-only: preferences never leave the device.
 *
 * Every Stage 4 preference is optional on the row so older rows keep
 * opening; `DEFAULT_PREFERENCES` supplies the gaps in one place.
 */
import { db } from "../db";
import type { ImageMode, RpeMode, SettingsRow, ThemeName } from "../db";
import { nowMs } from "../../lib/date";

export type ReducedMotionSetting = "auto" | "on" | "off";

export interface Preferences {
  units: "lb" | "kg";
  reducedMotion: ReducedMotionSetting;
  theme: ThemeName;
  imageMode: ImageMode;
  rpeMode: RpeMode;
  defaultRestSec: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  units: "lb",
  reducedMotion: "auto",
  theme: "ceremonial-chrome",
  imageMode: "auto",
  rpeMode: "simple",
  defaultRestSec: 90,
};

/** Rest presets offered in Settings, in seconds. */
export const REST_PRESETS = [45, 60, 90, 120, 180] as const;

export async function getSettings(): Promise<SettingsRow | undefined> {
  return db.settings.get("app");
}

/** Everything the UI needs, with defaults already resolved. */
export function resolvePreferences(row?: SettingsRow): Preferences {
  return {
    units: row?.units ?? DEFAULT_PREFERENCES.units,
    reducedMotion: row?.reducedMotion ?? DEFAULT_PREFERENCES.reducedMotion,
    theme: row?.theme ?? DEFAULT_PREFERENCES.theme,
    imageMode: row?.imageMode ?? DEFAULT_PREFERENCES.imageMode,
    rpeMode: row?.rpeMode ?? DEFAULT_PREFERENCES.rpeMode,
    defaultRestSec: row?.defaultRestSec ?? DEFAULT_PREFERENCES.defaultRestSec,
  };
}

export async function loadPreferences(): Promise<Preferences> {
  return resolvePreferences(await getSettings());
}

async function patch(fields: Partial<SettingsRow>): Promise<void> {
  await db.settings.update("app", { ...fields, updatedAt: nowMs() });
}

export const setReducedMotion = (mode: ReducedMotionSetting) => patch({ reducedMotion: mode });
export const setUnits = (units: "lb" | "kg") => patch({ units });
export const setTheme = (theme: ThemeName) => patch({ theme });
export const setImageMode = (imageMode: ImageMode) => patch({ imageMode });
export const setRpeMode = (rpeMode: RpeMode) => patch({ rpeMode });
export const setDefaultRestSec = (defaultRestSec: number) =>
  patch({ defaultRestSec: Math.max(15, Math.min(600, Math.round(defaultRestSec))) });

/**
 * Erase every local record: splits, sessions, logs, Forge entries,
 * proof events, PRs, day marks and notes. Settings and the schema row
 * are re-seeded so the app stays usable. Irreversible — the caller must
 * confirm first.
 */
export async function clearLocalData(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.splits,
      db.splitDays,
      db.templateExercises,
      db.sessions,
      db.setLogs,
      db.forgeEntries,
      db.prs,
      db.proofEvents,
      db.dayMarks,
      db.notes,
      db.records,
    ],
    async () => {
      await Promise.all([
        db.splits.clear(),
        db.splitDays.clear(),
        db.templateExercises.clear(),
        db.sessions.clear(),
        db.setLogs.clear(),
        db.forgeEntries.clear(),
        db.prs.clear(),
        db.proofEvents.clear(),
        db.dayMarks.clear(),
        db.notes.clear(),
      ]);
      await db.records.put({
        id: "alltime",
        totalSessionsKept: 0,
        totalWorkoutsCompleted: 0,
        totalCommitmentsCompleted: 0,
        bestStreak: 0,
        updatedAt: nowMs(),
      });
    },
  );
  // The crest tier is derived from kept sessions; reset its high-water mark.
  await patch({ lastCrestLevel: 0 });
}
