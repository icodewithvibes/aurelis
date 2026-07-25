/**
 * History data seam — assembles completed sessions and their set logs,
 * then hands them to the pure builder. Local only.
 */
import { db } from "../../data/db";
import { buildHistory, type ExerciseHistory, type HistoryEntry } from "./history";

export async function loadExerciseHistory(): Promise<ExerciseHistory[]> {
  const [sessions, logs] = await Promise.all([db.sessions.toArray(), db.setLogs.toArray()]);

  const kept = sessions.filter((s) => !s.deletedAt && s.status === "completed" && s.qualified);
  const bySession = new Map<string, HistoryEntry>();
  for (const s of kept) bySession.set(s.id, { date: s.dateLocal, sets: [] });

  for (const l of logs) {
    if (l.deletedAt) continue;
    const entry = bySession.get(l.sessionId);
    if (!entry) continue; // log belongs to an unfinished or discarded session
    entry.sets.push({
      exerciseName: l.exerciseName,
      weight: l.weight,
      reps: l.reps,
      done: l.done,
    });
  }

  return buildHistory([...bySession.values()]);
}
