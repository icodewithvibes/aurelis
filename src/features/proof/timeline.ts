/**
 * Timeline shaping — turns the flat proof-event log into one entry per
 * DAY, compressed to a single line, with the full record of that day
 * kept alongside it for when the entry is opened.
 *
 * Why by day: the log records a session, then each PR it produced, then
 * a tier crossing, as separate rows with separate timestamps. Rendered
 * flat that is four near-identical lines for one workout, and a heavy
 * week buries a light one. The day is the unit the crest already counts
 * (a day is kept once, no matter how many sessions it holds), so it is
 * the honest unit to show.
 *
 * Nothing here derives new facts. It groups rows that already exist and
 * phrases them; the counts still come from the engine.
 */
import type {
  ActivityRow,
  ForgeEntryRow,
  PrRow,
  ProofEventRow,
  SessionRow,
  SetLogRow,
} from "../../data/db";
import type { CrestLevel } from "../../components/ThresholdArch";
import { CREST_TIERS } from "../../lib/crest";

export interface TimelineSet {
  weight?: number;
  reps?: number;
  rpe?: number;
  note?: string;
  done: boolean;
}
export interface TimelineExercise {
  name: string;
  sets: TimelineSet[];
}
export interface TimelineNote {
  /** Where it came from, so an opened day reads as a record not a blob. */
  source: string;
  body: string;
}
export interface TimelineDetail {
  exercises: TimelineExercise[];
  prs: string[];
  forge: { action: string; status: ForgeEntryRow["status"]; note?: string }[];
  activities: ActivityRow[];
  notes: TimelineNote[];
}
export interface TimelineDay {
  dateLocal: string;
  /** Closed automatically after going quiet — real work, not a kept day. */
  halfSession: boolean;
  /** Compressed to one line when collapsed. */
  headline: string;
  /** Short facts shown beside the headline. */
  chips: string[];
  /** Set when a tier was crossed on this day — the rail shows the mark. */
  crestLevel: CrestLevel | null;
  crestName: string | null;
  /** A kept day gets a filled node; an unkept one a hollow ring. */
  kept: boolean;
  detail: TimelineDetail;
  /** False when opening it would show nothing — the row stays inert. */
  hasDetail: boolean;
}

export interface TimelineSources {
  events: ProofEventRow[];
  sessions: SessionRow[];
  setLogs: SetLogRow[];
  forgeEntries: ForgeEntryRow[];
  activities: ActivityRow[];
  prs: PrRow[];
}

const live = <T extends { deletedAt: number | null }>(rows: T[]): T[] =>
  rows.filter((r) => !r.deletedAt);

const ACTIVITY_VERB: Record<ActivityRow["kind"], string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
  walk: "Walk",
  row: "Row",
  other: "Activity",
};

/** "Run · 30 min · 3.2 mi" — only the parts that were actually recorded. */
export function activityLabel(a: ActivityRow): string {
  const parts = [ACTIVITY_VERB[a.kind]];
  if (a.minutes != null) parts.push(`${a.minutes} min`);
  if (a.distance != null) parts.push(`${a.distance} ${a.distanceUnit ?? "mi"}`);
  return parts.join(" · ");
}

/** "185 × 5 @8" — omits anything left blank, as the logger allows. */
export function setLabel(s: TimelineSet, units: string): string {
  const parts: string[] = [];
  if (s.weight != null) parts.push(`${s.weight} ${units}`);
  if (s.reps != null) parts.push(`× ${s.reps}`);
  const body = parts.join(" ") || "logged";
  return s.rpe != null ? `${body} @${s.rpe}` : body;
}

function crestLevelForName(name: string): CrestLevel | null {
  return CREST_TIERS.find((t) => t.name === name)?.level ?? null;
}

/**
 * Group everything that happened into days, newest first.
 *
 * `limit` caps the number of DAYS, not rows — so a day with a heavy
 * session can never push older days off the end on its own.
 */
export function buildTimeline(sources: TimelineSources, limit = 60): TimelineDay[] {
  const events = live(sources.events);
  const sessions = live(sources.sessions);
  const setLogs = live(sources.setLogs);
  const forgeEntries = live(sources.forgeEntries);
  const activities = live(sources.activities);
  const prs = live(sources.prs);

  const logsBySession = new Map<string, SetLogRow[]>();
  for (const l of setLogs) {
    const list = logsBySession.get(l.sessionId) ?? [];
    list.push(l);
    logsBySession.set(l.sessionId, list);
  }

  // Every date that has anything worth showing.
  const dates = new Set<string>();
  for (const e of events) dates.add(e.dateLocal);
  for (const a of activities) dates.add(a.dateLocal);
  for (const s of sessions) if (s.status === "completed" || s.status === "partial") dates.add(s.dateLocal);

  const days = [...dates].sort().reverse().slice(0, limit);

  return days.map((date) => {
    const dayEvents = events
      .filter((e) => e.dateLocal === date)
      .sort((a, b) => b.createdAt - a.createdAt);
    const daySessions = sessions.filter(
      (s) => s.dateLocal === date && (s.status === "completed" || s.status === "partial"),
    );
    const dayActivities = activities.filter((a) => a.dateLocal === date);
    const dayForge = forgeEntries.filter((f) => f.dateLocal === date && !f.safety);
    const dayPrs = prs.filter((p) => p.dateLocal === date);

    // ---- detail -----------------------------------------------------
    const exercises: TimelineExercise[] = [];
    const notes: TimelineNote[] = [];
    for (const session of daySessions) {
      if (session.notes?.trim()) {
        notes.push({ source: "Session note", body: session.notes.trim() });
      }
      /*
       * IN THE ORDER YOU DID THEM.
       *
       * Sorting by setIndex alone interleaves the whole session — every
       * exercise's first set, then every second set — so the exercise
       * order fell out of whichever set-0 row Dexie happened to return
       * first. That is arbitrary, and it made an opened day read as a
       * jumble that did not match the workout.
       *
       * The session's own snapshot holds the prescribed order, which IS
       * the order it was performed in. Sort by that first, then by set
       * within each exercise. Anything not in the snapshot (an exercise
       * added or renamed since) sorts after, alphabetically, so it is
       * still deterministic rather than merely different each read.
       */
      const snapshotOrder = new Map<string, number>();
      const snapshotExercises =
        (session.splitDaySnapshot as { exercises?: { key: string }[] } | null)?.exercises ?? [];
      snapshotExercises.forEach((ex, i) => snapshotOrder.set(ex.key, i));

      const rank = (key: string) => snapshotOrder.get(key) ?? Number.MAX_SAFE_INTEGER;
      const logs = (logsBySession.get(session.id) ?? []).slice().sort((a, b) => {
        const byExerciseOrder = rank(a.exerciseKey) - rank(b.exerciseKey);
        if (byExerciseOrder !== 0) return byExerciseOrder;
        const byName = a.exerciseName.localeCompare(b.exerciseName);
        if (byName !== 0) return byName;
        return a.setIndex - b.setIndex;
      });

      const byExercise = new Map<string, TimelineExercise>();
      for (const l of logs) {
        if (!l.done) continue; // the record is what was DONE, not what was planned
        let ex = byExercise.get(l.exerciseKey);
        if (!ex) {
          ex = { name: l.exerciseName, sets: [] };
          byExercise.set(l.exerciseKey, ex);
        }
        ex.sets.push({
          weight: l.weight,
          reps: l.reps,
          rpe: l.rpe,
          note: l.note,
          done: l.done,
        });
        if (l.note?.trim()) {
          notes.push({ source: l.exerciseName, body: l.note.trim() });
        }
      }
      exercises.push(...byExercise.values());
    }
    for (const f of dayForge) {
      if (f.note?.trim()) notes.push({ source: "Forge", body: f.note.trim() });
    }
    for (const a of dayActivities) {
      if (a.note?.trim()) notes.push({ source: ACTIVITY_VERB[a.kind], body: a.note.trim() });
    }

    const detail: TimelineDetail = {
      exercises,
      prs: dayPrs.map((p) => `${p.exerciseName} — ${p.value}`),
      forge: dayForge.map((f) => ({ action: f.action, status: f.status, note: f.note })),
      activities: dayActivities,
      notes,
    };

    // ---- the collapsed line -----------------------------------------
    const levelUp = dayEvents.find((e) => e.type === "crest_levelup");
    const workout = dayEvents.find((e) => e.type === "workout");
    const recovery = dayEvents.find((e) => e.type === "recovery");
    const half = dayEvents.find((e) => e.type === "half");

    const setCount = exercises.reduce((n, e) => n + e.sets.length, 0);

    let headline: string;
    if (workout) headline = workout.title;
    else if (half) headline = half.title;
    else if (dayActivities.length > 0) headline = activityLabel(dayActivities[0]);
    else if (recovery) headline = "Recovery honored";
    else if (dayForge.some((f) => f.status === "done")) headline = "Commitment kept";
    else headline = dayEvents[0]?.title ?? "Recorded";

    const chips: string[] = [];
    // Said first and plainly. A half session is not a failure and is not
    // hidden — but it must never read as a kept day either.
    if (half && !workout) chips.push("half session");
    if (setCount > 0) chips.push(`${setCount} ${setCount === 1 ? "set" : "sets"}`);
    if (exercises.length > 0) {
      chips.push(`${exercises.length} ${exercises.length === 1 ? "lift" : "lifts"}`);
    }
    if (dayPrs.length > 0) {
      chips.push(`${dayPrs.length} ${dayPrs.length === 1 ? "record" : "records"}`);
    }
    // A second activity alongside a session is worth naming, not hiding.
    if (workout && dayActivities.length > 0) chips.push(activityLabel(dayActivities[0]));
    if (notes.length > 0) chips.push(`${notes.length} ${notes.length === 1 ? "note" : "notes"}`);

    const hasDetail =
      exercises.length > 0 ||
      detail.prs.length > 0 ||
      detail.forge.length > 0 ||
      detail.activities.length > 0 ||
      notes.length > 0;

    return {
      dateLocal: date,
      halfSession: !!half && !workout,
      headline,
      chips,
      crestLevel: levelUp ? crestLevelForName(levelUp.title) : null,
      crestName: levelUp?.title ?? null,
      kept: !!workout || !!recovery || dayForge.some((f) => f.status === "done"),
      detail,
      hasDetail,
    };
  });
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Rail label: `{ month: "JUL", day: "28" }` from a YYYY-MM-DD key. */
export function railDate(dateLocal: string): { month: string; day: string } {
  const [, m, d] = dateLocal.split("-");
  return { month: MONTHS[Number(m) - 1] ?? "", day: String(Number(d)) };
}
