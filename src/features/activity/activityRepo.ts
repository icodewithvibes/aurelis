/**
 * Activity log (Stage 8) — work done outside the split.
 *
 * A run on top of your lifting session is real training, but it is not
 * "the plan kept", so it lives in its own store. Sessions stay the
 * measure of whether you did what you set out to do; activities are the
 * rest of what you did. Conflating them would quietly inflate the proof
 * record, which is the one thing this app must not do.
 */
import { db, getDeviceId } from "../../data/db";
import type { ActivityRow } from "../../data/db";
import { newId } from "../../lib/id";
import { localDay, nowMs } from "../../lib/date";

export const ACTIVITY_KINDS: { key: ActivityRow["kind"]; label: string }[] = [
  { key: "run", label: "Run" },
  { key: "ride", label: "Ride" },
  { key: "walk", label: "Walk" },
  { key: "row", label: "Row" },
  { key: "swim", label: "Swim" },
  { key: "other", label: "Other" },
];

export interface ActivityInput {
  kind: ActivityRow["kind"];
  minutes?: number;
  distance?: number;
  distanceUnit?: "mi" | "km";
  effort?: number;
  note?: string;
  dateLocal?: string;
}

/** Records an activity. Returns null when there is nothing to record. */
export async function logActivity(input: ActivityInput): Promise<string | null> {
  const minutes = clamp(input.minutes, 1, 1440);
  const distance = clamp(input.distance, 0.01, 1000);
  // Refuse an empty entry rather than storing a row that says nothing.
  if (minutes === undefined && distance === undefined) return null;

  const now = nowMs();
  const id = newId();
  const row: ActivityRow = {
    id,
    dateLocal: input.dateLocal ?? localDay(),
    kind: input.kind,
    minutes,
    distance,
    distanceUnit: input.distanceUnit ?? "mi",
    effort: clamp(input.effort, 1, 10),
    note: input.note?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    deviceId: getDeviceId(),
  };

  await db.activities.put(row);
  await db.proofEvents.put({
    id: newId(),
    dateLocal: row.dateLocal,
    type: "recovery", // the closest existing timeline type; not a kept session
    refId: id,
    title: describeActivity(row),
    summary: row.note,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  return id;
}

export async function recentActivities(limit = 20): Promise<ActivityRow[]> {
  return (await db.activities.toArray())
    .filter((a) => !a.deletedAt)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export async function activitiesOn(date = localDay()): Promise<ActivityRow[]> {
  return (await db.activities.where("dateLocal").equals(date).toArray()).filter((a) => !a.deletedAt);
}

export async function deleteActivity(id: string): Promise<void> {
  const now = nowMs();
  await db.activities.update(id, { deletedAt: now, updatedAt: now });
}

/** "Run · 3.1 mi · 28 min" */
export function describeActivity(a: ActivityRow): string {
  const label = ACTIVITY_KINDS.find((k) => k.key === a.kind)?.label ?? "Activity";
  const parts: string[] = [label];
  if (a.distance !== undefined) parts.push(`${trim(a.distance)} ${a.distanceUnit ?? "mi"}`);
  if (a.minutes !== undefined) parts.push(`${a.minutes} min`);
  return parts.join(" · ");
}

/** Pace, only when both numbers exist and it would be meaningful. */
export function paceFor(a: ActivityRow): string | null {
  if (!a.minutes || !a.distance || a.distance <= 0) return null;
  if (a.kind !== "run" && a.kind !== "walk") return null;
  const perUnit = a.minutes / a.distance;
  const m = Math.floor(perUnit);
  const s = Math.round((perUnit - m) * 60);
  if (!Number.isFinite(m) || m > 99) return null;
  return `${m}:${String(s).padStart(2, "0")} / ${a.distanceUnit ?? "mi"}`;
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
}

function clamp(value: number | undefined, min: number, max: number): number | undefined {
  if (value === undefined || Number.isNaN(value) || value <= 0) return undefined;
  return Math.min(max, Math.max(min, value));
}
