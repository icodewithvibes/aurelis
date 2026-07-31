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
import { refreshRecords } from "../../features/proof/proofRepo";
import { loadPreferences } from "./settingsRepo";
import type { CompletedSet, LiftDay } from "../../features/training/progression";
import {
  findStaleSessions,
  halfSessionSummary,
  stallReasonLabel,
  type StallReason,
  type StaleSession,
} from "../../features/training/staleSession";

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

/**
 * Close any session that was left open and has gone quiet.
 *
 * Runs once on boot. There is no background worker in a local-first
 * app, so "two hours have passed" can only be noticed the next time the
 * app is opened — which is exactly when it matters, because that is
 * when the user would otherwise be shown a stale session still
 * pretending to be in progress.
 *
 * Returns what was closed so the UI can offer to record why.
 */
export async function closeStaleSessions(now = nowMs()): Promise<StaleSession[]> {
  const [sessions, logs, prefs] = await Promise.all([
    db.sessions.toArray(),
    db.setLogs.toArray(),
    loadPreferences(),
  ]);
  const staleAfterMs = prefs.staleAfterHours * 60 * 60 * 1000;

  const bySession = new Map<string, SetLogRow[]>();
  for (const l of logs) {
    const list = bySession.get(l.sessionId) ?? [];
    list.push(l);
    bySession.set(l.sessionId, list);
  }

  const { close, discard } = findStaleSessions(sessions, bySession, now, staleAfterMs);

  for (const s of discard) {
    // Started, nothing logged. Not evidence of anything; drop it rather
    // than put an empty row on the timeline.
    await db.sessions.update(s.id, { status: "discarded", deletedAt: now, updatedAt: now });
  }

  for (const { session, doneSets } of close) {
    await db.sessions.update(session.id, {
      status: "partial",
      qualified: false,
      completedAt: now,
      updatedAt: now,
    });
    await db.proofEvents.put({
      id: newId(),
      dateLocal: session.dateLocal,
      type: "half",
      refId: session.id,
      title: sessionDayName(session),
      summary: halfSessionSummary(doneSets),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  // Records are a fold over the log, so recompute rather than adjust.
  if (close.length > 0 || discard.length > 0) await refreshRecords();
  return close;
}

/**
 * Recent half sessions that have not been given a reason yet.
 *
 * Scoped to the last two days on purpose: being asked why you stopped a
 * workout last month is an interrogation, not a record. If it is not
 * answered soon it is dropped, and the half session stands on its own.
 */
export async function pendingHalfSessions(now = nowMs()): Promise<SessionRow[]> {
  const cutoff = now - 2 * 24 * 60 * 60 * 1000;
  return (await db.sessions.toArray()).filter(
    (s) =>
      !s.deletedAt &&
      s.status === "partial" &&
      (s.completedAt ?? 0) >= cutoff &&
      !(s.notes ?? "").includes("Stopped early"),
  );
}

/** The reason a half session ended, recorded only if the user offers one. */
export async function setStallReason(sessionId: string, reason: StallReason): Promise<void> {
  const now = nowMs();
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  const label = stallReasonLabel(reason);
  await db.sessions.update(sessionId, {
    notes: [session.notes, `Stopped early — ${label.toLowerCase()}.`].filter(Boolean).join("\n"),
    updatedAt: now,
  });
  const event = (await db.proofEvents.toArray()).find(
    (e) => e.refId === sessionId && e.type === "half" && !e.deletedAt,
  );
  if (event) {
    await db.proofEvents.update(event.id, {
      summary: `${event.summary} · ${label.toLowerCase()}`,
      updatedAt: now,
    });
  }
}

function sessionDayName(session: SessionRow): string {
  return (session.splitDaySnapshot as { dayName?: string } | null)?.dayName ?? "Session";
}

export async function discardSession(id: string): Promise<void> {
  const now = nowMs();
  await db.sessions.update(id, { status: "discarded", deletedAt: now, updatedAt: now });
}

/**
 * Every day this lift was trained, ascending, with only the sets that
 * were actually COMPLETED — the evidence the progression engine reads.
 *
 * Sessions still in progress are included: work you did an hour ago is
 * as real as work you did last week, and waiting for a session to be
 * formally finished before it can inform the next one would make the
 * suggestion stale exactly when it matters.
 */
export async function liftDaysFor(exerciseName: string): Promise<LiftDay[]> {
  const [sessions, logs] = await Promise.all([db.sessions.toArray(), db.setLogs.toArray()]);

  const liveSessions = new Map(
    sessions.filter((s) => !s.deletedAt && s.status !== "discarded").map((s) => [s.id, s]),
  );

  const byDate = new Map<string, CompletedSet[]>();
  for (const l of logs) {
    if (l.deletedAt || !l.done) continue;
    if (l.exerciseName !== exerciseName) continue;
    if (l.weight == null || l.reps == null) continue; // nothing to progress from
    const session = liveSessions.get(l.sessionId);
    if (!session) continue;
    const list = byDate.get(session.dateLocal) ?? [];
    list.push({ weight: l.weight, reps: l.reps });
    byDate.set(session.dateLocal, list);
  }

  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateLocal, sets]) => ({ dateLocal, sets }));
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
