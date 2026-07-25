/**
 * Proof persistence seam (Stage 3) — the only place the pure proof
 * engine meets Dexie.
 *
 * Reads assemble day facts from the event log (sessions, dayMarks) plus
 * the active split's schedule, then hand them to the engine. Writes
 * happen in ONE place: `recordProof`, which persists everything before
 * any animation is allowed to play (plan §1.5, step 1).
 */
import { db } from "../../data/db";
import type { PrRow, ProofEventRow } from "../../data/db";
import { getActiveSplit } from "../../data/repositories/splitRepo";
import { newId } from "../../lib/id";
import { addDays, daysBetween, localDay, nowMs, parseLocalDay, weekOf } from "../../lib/date";
import { dayIndexForDate } from "../../lib/schedule";
import { crestStateForSessions } from "../../lib/crest";
import type { CrestLevel } from "../../components/ThresholdArch";
import {
  computeBestStreak,
  computeStreak,
  countKeptDays,
  newPRs,
  prCandidates,
  PR_LABEL,
  weekCompletion,
  type DayFacts,
  type PrCandidate,
  type WeekCompletion,
} from "./engine";

/** Build the contiguous day-fact log the engine folds over. */
export async function collectDayFacts(today = localDay()): Promise<DayFacts[]> {
  const [sessions, marks, forgeEntries, active] = await Promise.all([
    db.sessions.toArray(),
    db.dayMarks.toArray(),
    db.forgeEntries.toArray(),
    getActiveSplit(),
  ]);

  // A Forge daily commitment is an obligation the user set themselves;
  // keeping it counts as a kept day on a non-scheduled day (§1.1).
  const commitments = forgeEntries.filter(
    (e) => !e.deletedAt && e.isDailyCommitment && !e.safety && e.status !== "skipped",
  );
  const commitmentSetDates = new Set(commitments.map((e) => e.dateLocal));
  const commitmentKeptDates = new Set(
    commitments.filter((e) => e.status === "done").map((e) => e.dateLocal),
  );

  const live = sessions.filter((s) => !s.deletedAt);
  const keptDates = new Set(
    live.filter((s) => s.status === "completed" && s.qualified).map((s) => s.dateLocal),
  );
  const liveMarks = marks.filter((m) => !m.deletedAt);
  const marksByDate = new Map(liveMarks.map((m) => [m.dateLocal, m]));

  // The schedule only owes days once the split exists.
  const splitStart = active ? localDay(new Date(active.split.createdAt)) : null;
  const anchor = active ? new Date(active.split.createdAt) : undefined;

  const earliest = [
    ...live.map((s) => s.dateLocal),
    ...liveMarks.map((m) => m.dateLocal),
    ...commitments.map((e) => e.dateLocal),
    ...(splitStart ? [splitStart] : []),
    today,
  ].sort()[0];

  return daysBetween(earliest, today).map((date) => {
    const mark = marksByDate.get(date);
    const scheduled =
      active !== null &&
      splitStart !== null &&
      date >= splitStart &&
      dayIndexForDate(
        active.split.scheduleWeekdays,
        active.days.length,
        parseLocalDay(date),
        anchor,
      ) !== null;

    return {
      date,
      scheduled,
      keptSession: keptDates.has(date),
      commitmentSet: commitmentSetDates.has(date) || mark?.dailyCommitmentForgeId != null,
      commitmentKept: commitmentKeptDates.has(date),
      recoveryHonored: mark?.recoveryHonored === true,
    };
  });
}

export interface ProofState {
  keptCount: number;
  streak: number;
  bestStreak: number;
  week: WeekCompletion;
  crest: ReturnType<typeof crestStateForSessions>;
  totalWorkoutsCompleted: number;
  timeline: ProofEventRow[];
  prs: PrRow[];
}

export async function loadProof(today = localDay()): Promise<ProofState> {
  const facts = await collectDayFacts(today);
  const [events, prs, sessions] = await Promise.all([
    db.proofEvents.toArray(),
    db.prs.toArray(),
    db.sessions.toArray(),
  ]);

  const keptCount = countKeptDays(facts, today);
  return {
    keptCount,
    streak: computeStreak(facts, today),
    bestStreak: computeBestStreak(facts, today),
    week: weekCompletion(facts, weekOf(today), today),
    crest: crestStateForSessions(keptCount),
    totalWorkoutsCompleted: sessions.filter(
      (s) => !s.deletedAt && s.status === "completed" && s.qualified,
    ).length,
    timeline: events
      .filter((e) => !e.deletedAt)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50),
    prs: prs.filter((p) => !p.deletedAt),
  };
}

/**
 * Recompute the all-time records row from the log. Called after any
 * event that can change it — a session, a Forge commitment, an edit —
 * so the totals are always a fold, never an increment that can drift.
 */
export async function refreshRecords(today = localDay()): Promise<void> {
  const facts = await collectDayFacts(today);
  const [sessions, forgeEntries] = await Promise.all([
    db.sessions.toArray(),
    db.forgeEntries.toArray(),
  ]);

  await db.records.put({
    id: "alltime",
    totalSessionsKept: countKeptDays(facts, today),
    totalWorkoutsCompleted: sessions.filter(
      (s) => !s.deletedAt && s.status === "completed" && s.qualified,
    ).length,
    totalCommitmentsCompleted: forgeEntries.filter(
      (e) => !e.deletedAt && e.isDailyCommitment && e.status === "done",
    ).length,
    bestStreak: computeBestStreak(facts, today),
    updatedAt: nowMs(),
  });
}

/**
 * Deterministic replay (04_data-model §4) — rebuild everything derived
 * from the log, in order, as if it were being recorded for the first
 * time. This is what makes editing history safe: a corrected session
 * cannot leave behind a PR that never happened.
 *
 * Rebuilt: the `prs` table and its proof events, then the records row.
 * Left alone: workout, forge and recovery events — those record that
 * something *happened*, which an edit does not undo.
 */
export async function replayDerivedState(today = localDay()): Promise<void> {
  const now = nowMs();
  const [sessions, allLogs, events] = await Promise.all([
    db.sessions.toArray(),
    db.setLogs.toArray(),
    db.proofEvents.toArray(),
  ]);

  const logsBySession = new Map<string, typeof allLogs>();
  for (const l of allLogs) {
    if (l.deletedAt) continue;
    const list = logsBySession.get(l.sessionId) ?? [];
    list.push(l);
    logsBySession.set(l.sessionId, list);
  }

  const kept = sessions
    .filter((s) => !s.deletedAt && s.status === "completed" && s.qualified)
    .sort((a, b) => (a.completedAt ?? a.startedAt) - (b.completedAt ?? b.startedAt));

  await db.prs.clear();
  for (const e of events) {
    if (e.type === "pr") await db.proofEvents.delete(e.id);
  }

  const standing = new Map<string, number>();
  for (const session of kept) {
    const logs = logsBySession.get(session.id) ?? [];
    const beaten = newPRs(
      prCandidates(
        logs.map((l) => ({
          exerciseName: l.exerciseName,
          weight: l.weight,
          reps: l.reps,
          done: l.done,
        })),
      ),
      standing,
    );

    for (const pr of beaten) {
      standing.set(`${pr.exerciseName}|${pr.metric}`, pr.value);
      await db.prs.put({
        id: newId(),
        exerciseName: pr.exerciseName,
        metric: pr.metric,
        value: pr.value,
        dateLocal: session.dateLocal,
        sessionId: session.id,
        updatedAt: now,
        deletedAt: null,
      });
      await db.proofEvents.put({
        id: newId(),
        dateLocal: session.dateLocal,
        type: "pr",
        refId: session.id,
        title: `${pr.exerciseName} — ${PR_LABEL[pr.metric]}`,
        summary: `${pr.value}`,
        createdAt: session.completedAt ?? session.startedAt,
        updatedAt: now,
        deletedAt: null,
      });
    }
  }

  await refreshRecords(today);
}

export interface ProofResult {
  keptCount: number;
  streak: number;
  /** Non-null when this completion crossed into a new crest tier. */
  crestLevelUp: { level: CrestLevel; name: string } | null;
  prs: PrCandidate[];
}

/**
 * Finish a session and persist every derived consequence — session
 * status, PRs, proof events, records, crest level — BEFORE the reveal
 * animation runs. Returns what the reveal should say.
 */
export async function recordProof(sessionId: string, qualified = true): Promise<ProofResult> {
  const now = nowMs();
  const today = localDay();

  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error(`recordProof: unknown session ${sessionId}`);

  const settings = await db.settings.get("app");
  const priorLevel = settings?.lastCrestLevel ?? 0;

  await db.sessions.update(sessionId, {
    status: qualified ? "completed" : "partial",
    qualified,
    completedAt: now,
    updatedAt: now,
  });

  // --- PRs (only from this session's completed sets) -----------------
  const logs = (await db.setLogs.where("sessionId").equals(sessionId).toArray()).filter(
    (l) => !l.deletedAt,
  );
  const standing = new Map<string, number>();
  for (const p of await db.prs.toArray()) {
    if (!p.deletedAt) standing.set(`${p.exerciseName}|${p.metric}`, p.value);
  }
  const prs = qualified
    ? newPRs(
        prCandidates(
          logs.map((l) => ({
            exerciseName: l.exerciseName,
            weight: l.weight,
            reps: l.reps,
            done: l.done,
          })),
        ),
        standing,
      )
    : [];

  const dayName = (session.splitDaySnapshot as { dayName?: string } | null)?.dayName ?? "Session";
  const doneSets = logs.filter((l) => l.done).length;
  const events: ProofEventRow[] = [];

  for (const pr of prs) {
    await db.prs.put({
      id: newId(),
      exerciseName: pr.exerciseName,
      metric: pr.metric,
      value: pr.value,
      dateLocal: today,
      sessionId,
      updatedAt: now,
      deletedAt: null,
    });
    events.push({
      id: newId(),
      dateLocal: today,
      type: "pr",
      refId: sessionId,
      title: `${pr.exerciseName} — ${PR_LABEL[pr.metric]}`,
      summary: `${pr.value}`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  if (qualified) {
    events.unshift({
      id: newId(),
      dateLocal: today,
      type: "workout",
      refId: sessionId,
      title: dayName,
      summary: `${doneSets} ${doneSets === 1 ? "set" : "sets"} logged`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  // --- Derived state, recomputed from the log (never incremented) ----
  const facts = await collectDayFacts(today);
  const keptCount = countKeptDays(facts, today);
  const streak = computeStreak(facts, today);
  const crest = crestStateForSessions(keptCount);

  const crestLevelUp =
    crest.level > priorLevel ? { level: crest.level, name: crest.name } : null;
  if (crestLevelUp) {
    events.push({
      id: newId(),
      dateLocal: today,
      type: "crest_levelup",
      title: crest.name,
      summary: `${keptCount} ${keptCount === 1 ? "session" : "sessions"} kept`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  // Stamp descending timestamps so the timeline keeps this deliberate
  // order (session, then its PRs, then the tier crossing) instead of
  // relying on an unstable sort of identical milliseconds.
  events.forEach((e, i) => {
    e.createdAt = now - i;
  });
  for (const e of events) await db.proofEvents.put(e);

  await refreshRecords(today);

  if (settings) {
    await db.settings.update("app", { lastCrestLevel: crest.level, updatedAt: now });
  }

  return { keptCount, streak, crestLevelUp, prs };
}

/** Mark a day as honored recovery — bridges a run without incrementing. */
export async function markRecoveryHonored(date = localDay()): Promise<void> {
  const now = nowMs();
  const existing = (await db.dayMarks.toArray()).find((m) => m.dateLocal === date);
  await db.dayMarks.put({
    id: existing?.id ?? newId(),
    dateLocal: date,
    plannedRecovery: existing?.plannedRecovery ?? false,
    recoveryHonored: true,
    dailyCommitmentForgeId: existing?.dailyCommitmentForgeId,
    updatedAt: now,
    deletedAt: null,
  });
  await db.proofEvents.put({
    id: newId(),
    dateLocal: date,
    type: "recovery",
    title: "Recovery honored",
    summary: "Rest taken on purpose.",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
}

/** Yesterday's local day — used by the recovery affordance. */
export const yesterday = (today = localDay()) => addDays(today, -1);
