/**
 * Half sessions — the day you started, did real work, and stopped.
 *
 * A session left open is not evidence of anything on its own, but the
 * sets already logged in it ARE. Losing them because the workout was
 * never formally "finished" would be the app quietly editing history,
 * which is the one thing it must never do.
 *
 * So: once a session has gone quiet for long enough that it plainly is
 * not still happening, it is closed as PARTIAL. That means
 *   - the sets stay, and stay in per-lift history;
 *   - it appears on the timeline as a half session;
 *   - it does NOT count as a kept day and does NOT mark the crest;
 *   - PRs are not awarded from it.
 *
 * The last point is deliberate. A set you walked away from is a set you
 * did not finish the session behind, and the crest counts days you kept,
 * not days you started. Half credit is still credit — it is on the
 * record, and the record is the point.
 *
 * Everything here is pure. The Dexie side lives in sessionRepo.
 */
import type { SessionRow, SetLogRow } from "../../data/db";

/**
 * How long a session may sit idle before it is treated as abandoned.
 *
 * Two hours. Long enough to cover a genuinely long session, a rest-pause
 * set, a phone that locked, or a conversation on the gym floor; short
 * enough that a session abandoned in the morning is closed before the
 * evening. Yuriel picked the figure from what a real workout looks like,
 * which is the right way to pick it.
 */
export const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

/** Why a session ended early. Optional — never demanded. */
export type StallReason = "sore" | "time" | "energy" | "injury" | "other";

export const STALL_REASONS: { key: StallReason; label: string }[] = [
  { key: "sore", label: "Too sore" },
  { key: "time", label: "Ran out of time" },
  { key: "energy", label: "No energy" },
  { key: "injury", label: "Something hurt" },
  { key: "other", label: "Another reason" },
];

export function stallReasonLabel(key: StallReason): string {
  return STALL_REASONS.find((r) => r.key === key)?.label ?? "Another reason";
}

/**
 * The last moment anything actually happened in a session.
 *
 * Set logs are the signal, not `session.updatedAt` — that gets touched
 * by bookkeeping writes that do not mean the user was present.
 */
export function lastActivityAt(session: SessionRow, logs: readonly SetLogRow[]): number {
  const live = logs.filter((l) => !l.deletedAt);
  return live.reduce((latest, l) => Math.max(latest, l.updatedAt), session.startedAt);
}

export interface StaleSession {
  session: SessionRow;
  /** Sets actually completed before it went quiet. */
  doneSets: number;
  idleMs: number;
}

/**
 * Which open sessions have gone quiet long enough to close.
 *
 * A session with NO completed sets is not a half session — nothing
 * happened in it. Those are discarded instead, because recording "you
 * started and did nothing" as an event on the timeline is noise, and
 * the timeline is supposed to be evidence.
 */
export function findStaleSessions(
  sessions: readonly SessionRow[],
  logsBySession: ReadonlyMap<string, SetLogRow[]>,
  now: number,
  staleAfterMs = STALE_AFTER_MS,
): { close: StaleSession[]; discard: SessionRow[] } {
  const close: StaleSession[] = [];
  const discard: SessionRow[] = [];

  // 0 or less means the user turned auto-closing off. Nothing is
  // touched — an open session stays open until they finish it.
  if (staleAfterMs <= 0) return { close, discard };

  for (const session of sessions) {
    if (session.deletedAt || session.status !== "active") continue;

    const logs = logsBySession.get(session.id) ?? [];
    const idleMs = now - lastActivityAt(session, logs);
    if (idleMs < staleAfterMs) continue;

    const doneSets = logs.filter((l) => l.done && !l.deletedAt).length;
    if (doneSets > 0) close.push({ session, doneSets, idleMs });
    else discard.push(session);
  }

  return { close, discard };
}

/** "3 sets in" — what the half session is worth saying about itself. */
export function halfSessionSummary(doneSets: number): string {
  return `${doneSets} ${doneSets === 1 ? "set" : "sets"} logged before it stopped`;
}
