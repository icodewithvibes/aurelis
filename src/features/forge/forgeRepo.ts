/**
 * Forge persistence (02_strategy/02 §3, 04_data-model §forgeEntries).
 *
 * The engine stays pure; every write lives here. A Forge entry records
 * exactly what the user was shown, so history never drifts if the
 * templates are later edited.
 *
 * Safety entries are stored too — a flagged moment is part of the
 * honest record — but they are never given a task, never create a
 * commitment, and never touch the streak.
 */
import { db, getDeviceId } from "../../data/db";
import type { ForgeEntryRow } from "../../data/db";
import { newId } from "../../lib/id";
import { localDay, nowMs } from "../../lib/date";
import { crisisResourcesFor, type CrisisResources } from "./crisisResources";
import { route } from "./engine";
import { refreshRecords } from "../proof/proofRepo";
import type { ForgeInput, ForgeResponse } from "./types";

export interface ForgeSession {
  entry: ForgeEntryRow;
  response: ForgeResponse;
}

/** Run the engine and persist the result as an OPEN entry. */
export async function openForgeEntry(
  stateKey: ForgeInput["stateKey"],
  note: string | undefined,
  isDailyCommitment = false,
): Promise<ForgeSession> {
  const today = localDay();
  const response = route({ stateKey, note, localDate: today });
  const now = nowMs();

  const entry: ForgeEntryRow = {
    id: newId(),
    dateLocal: today,
    stateKey,
    note: note?.trim() || undefined,
    acknowledgment: response.acknowledgment,
    reframe: response.reframe,
    action: response.action,
    estMinutes: response.estMinutes,
    tone: response.tone,
    safety: response.safety,
    status: "open",
    // A safety response has no task, so it can never be a commitment.
    isDailyCommitment: isDailyCommitment && !response.safety,
    updatedAt: now,
    deletedAt: null,
    deviceId: getDeviceId(),
  };

  await db.forgeEntries.put(entry);
  return { entry, response };
}

/** Mark the entry done and record it in the proof timeline. */
export async function completeForgeEntry(id: string): Promise<void> {
  const now = nowMs();
  const entry = await db.forgeEntries.get(id);
  if (!entry || entry.deletedAt) throw new Error(`completeForgeEntry: unknown entry ${id}`);

  await db.forgeEntries.update(id, { status: "done", completedAt: now, updatedAt: now });
  await db.proofEvents.put({

    id: newId(),
    dateLocal: entry.dateLocal,
    type: "forge",
    refId: id,
    title: entry.isDailyCommitment ? "Daily commitment kept" : "Forge rep",
    summary: entry.action || undefined,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  // A kept commitment can change the kept-day count and the best run.
  await refreshRecords();
}

/** "Not now" — no shame copy, the entry simply stays open. */
export async function skipForgeEntry(id: string): Promise<void> {
  const now = nowMs();
  await db.forgeEntries.update(id, { status: "skipped", updatedAt: now });
}

export async function setDailyCommitment(id: string, on: boolean): Promise<void> {
  const entry = await db.forgeEntries.get(id);
  if (!entry || entry.safety) return; // never from a safety response
  await db.forgeEntries.update(id, { isDailyCommitment: on, updatedAt: nowMs() });
}

export async function forgeEntriesFor(date = localDay()): Promise<ForgeEntryRow[]> {
  return (await db.forgeEntries.where("dateLocal").equals(date).toArray())
    .filter((e) => !e.deletedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** The crisis copy to display — settings first, module as fallback. */
export async function loadCrisisResources(): Promise<CrisisResources> {
  const settings = await db.settings.get("app");
  return settings?.crisisResources ?? crisisResourcesFor(settings?.crisisRegion);
}
