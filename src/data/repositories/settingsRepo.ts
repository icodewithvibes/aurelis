/**
 * Settings repository (Stage 2/3) — the single 'app' settings row.
 * Local-only. Stage 3 wires the reduced-motion preference here so the
 * motion control actually persists across reloads.
 */
import { db } from "../db";
import type { SettingsRow } from "../db";
import { nowMs } from "../../lib/date";

export type ReducedMotionSetting = "auto" | "on" | "off";

export async function getSettings(): Promise<SettingsRow | undefined> {
  return db.settings.get("app");
}

export async function setReducedMotion(mode: ReducedMotionSetting): Promise<void> {
  await db.settings.update("app", { reducedMotion: mode, updatedAt: nowMs() });
}

export async function setUnits(units: "lb" | "kg"): Promise<void> {
  await db.settings.update("app", { units, updatedAt: nowMs() });
}
