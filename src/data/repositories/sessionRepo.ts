/**
 * Session repository (Stage 2) — workout logging persistence. Local-only.
 * A session snapshots its day's exercises (so later split edits never
 * rewrite history) and owns setLogs. Stage 2 persists working data and
 * lets it survive reload; it does NOT compute streaks, PRs, proof
 * events, or the completion reveal (Stage 3).
 */
import { db, getDeviceId } from "../db";
import type { SessionRow, SetLogRow } from "../db";
import type { DayWithExercises } from "./splitRepo";
import { newId } from "../../lib/id";
import { localDay, nowMs } from "../../lib/date";

export interface SessionSnapshotExercise {
  key: string;
  name: string;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  rpeMin: number | null;
  rpeMax: number | null;
  restSec: number | null;
}
export interface SessionSnapshot {
  dayName: string;
  exercises: SessionSnapshotExercise[];
}

export interface SessionWithLogs {
  session: SessionRow;
  logs: SetLogRow[];
  snapshot: SessionSnapshot;
}

/** Start (or resume) today's active session for a split day. */
export async function startSession(day: DayWithExercises): Promise<string> {
  const now = nowMs();
  const today = localDay();

  // Resume an existing active session for this day today, if present.
  const existing = (await db.sessions.where("dateLocal").equals(today).toArray()).find(
    (s) => s.splitDayId === day.id && s.status === "active" && !s.deletedAt,
  );
  if (existing) return existing.id;

  const snapshot: SessionSnapshot = {
    dayName: day.name,
    exercises: day.exercises.map((e) => ({
      key: e.id,
      name: e.name,
      sets: e.sets,
      repMin: e.repMin,
      repMax: e.repMax,
      rpeMin: e.rpeMin ?? null,
      rpeMax: e.rpeMax ?? null,
      restSec: e.restSec ?? null,
    })),
  };

  const id = newId();
  await db.sessions.put({
    id,
    dateLocal: today,
    splitDayId: day.id,
    splitDaySnapshot: snapshot,
    status: "active",
    qualified: false,
    startedAt: now,
    updatedAt: now,
    deletedAt: null,
    deviceId: getDeviceId(),
  });
  return id;
}

export async function getSession(id: string): Promise<SessionWithLogs | null> {
  const session = await db.sessions.get(id);
  if (!session || session.deletedAt) return null;
  const logs = (await db.setLogs.where("sessionId").equals(id).toArray())
    .filter((l) => !l.deletedAt)
    .sort((a, b) => a.exerciseKey.localeCompare(b.exerciseKey) || a.setIndex - b.setIndex);
  return { session, logs, snapshot: session.splitDaySnapshot as SessionSnapshot };
}

/**
 * Insert or update one logged set. Uses a DETERMINISTIC natural-key id
 * (session:exerciseKey:setIndex) so rapid successive edits are an
 * idempotent `put` — no read-then-write race, exactly one row per set.
 */
export function setLogId(sessionId: string, exerciseKey: string, setIndex: number): string {
  return `${sessionId}:${exerciseKey}:${setIndex}`;
}

export async function upsertSetLog(input: {
  sessionId: string;
  exerciseKey: string;
  exerciseName: string;
  setIndex: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  done: boolean;
  note?: string;
}): Promise<string> {
  const now = nowMs();
  const id = setLogId(input.sessionId, input.exerciseKey, input.setIndex);
  await db.setLogs.put({
    id,
    sessionId: input.sessionId,
    exerciseKey: input.exerciseKey,
    exerciseName: input.exerciseName,
    setIndex: input.setIndex,
    weight: input.weight,
    reps: input.reps,
    rpe: input.rpe,
    done: input.done,
    note: input.note,
    updatedAt: now,
    deletedAt: null,
  });
  await db.sessions.update(input.sessionId, { updatedAt: now });
  return id;
}

/**
 * Finish a session. Stage 2: marks completed/partial and stamps
 * completedAt. `qualified` is recorded but NOT used to compute streaks
 * or the completion reveal here (Stage 3 consumes it).
 */
export async function finishSession(id: string, qualified: boolean): Promise<void> {
  const now = nowMs();
  await db.sessions.update(id, {
    status: qualified ? "completed" : "partial",
    qualified,
    completedAt: now,
    updatedAt: now,
  });
}

export async function discardSession(id: string): Promise<void> {
  const now = nowMs();
  await db.sessions.update(id, { status: "discarded", deletedAt: now, updatedAt: now });
}

/** Most recent completed weight/reps for an exercise name (ghost defaults). */
export async function lastSetForExercise(
  exerciseName: string,
): Promise<{ weight?: number; reps?: number } | null> {
  const logs = (await db.setLogs.toArray())
    .filter((l) => l.exerciseName === exerciseName && l.done && !l.deletedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const l = logs[0];
  return l ? { weight: l.weight, reps: l.reps } : null;
}
