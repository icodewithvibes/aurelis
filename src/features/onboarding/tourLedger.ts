/**
 * Tour ledger — "undo everything the tutorial did".
 *
 * A guided tour that has you adopt a split, start a session and log a
 * set leaves real rows behind. For someone trying the app out that is
 * exactly right — you learn by doing the real thing, not a mock — but
 * it means the tour can hand you a history you never actually trained.
 * The crest counting a session you did as a demonstration would be the
 * fabricated progress this whole app exists to refuse.
 *
 * So the tour is reversible.
 *
 * HOW, and why this way: the ledger records the set of row IDs that
 * existed BEFORE the tour, per table. Reverting deletes any row not in
 * that set. Not a timestamp comparison, which drifts and depends on
 * clocks; not a diff of counts, which cannot tell you which row to
 * remove. Set difference is exact.
 *
 * Settings are handled separately — the tour lets you change the theme,
 * which is an edit rather than an insertion, so the whole row is
 * captured and written back.
 *
 * HARD RULE: revert only ever removes rows the tour itself created. A
 * user who already had six months of sessions must end the tour with
 * exactly those six months, whatever they pressed along the way.
 */
import { db, type SettingsRow } from "../../data/db";

/** Every table a tour can plausibly write to. */
const TRACKED = [
  "splits",
  "splitDays",
  "templateExercises",
  "sessions",
  "setLogs",
  "forgeEntries",
  "planItems",
  "proofEvents",
  "prs",
  "dayMarks",
  "activities",
] as const;

type TrackedTable = (typeof TRACKED)[number];

export interface TourSnapshot {
  takenAt: number;
  /** Row ids that existed before the tour, per table. */
  ids: Record<TrackedTable, string[]>;
  /** The settings row as it stood, so theme edits can be undone. */
  settings: SettingsRow | undefined;
}

export async function takeSnapshot(): Promise<TourSnapshot> {
  const ids = {} as Record<TrackedTable, string[]>;
  await Promise.all(
    TRACKED.map(async (name) => {
      const rows = await db.table(name).toArray();
      ids[name] = rows.map((r: { id: string }) => r.id);
    }),
  );
  return { takenAt: Date.now(), ids, settings: await db.settings.get("app") };
}

export interface RevertResult {
  /** How many rows were removed, per table, for the summary. */
  removed: Record<string, number>;
  total: number;
}

/**
 * Delete everything created since the snapshot and restore settings.
 *
 * Hard-deletes rather than soft-deletes: a soft delete would leave the
 * demonstration in the log forever, and "revert" has to mean the app
 * looks as though the tour never happened.
 */
export async function revertToSnapshot(snapshot: TourSnapshot): Promise<RevertResult> {
  const removed: Record<string, number> = {};
  let total = 0;

  for (const name of TRACKED) {
    const before = new Set(snapshot.ids[name] ?? []);
    const rows = await db.table(name).toArray();
    const created = rows
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !before.has(id));
    if (created.length > 0) {
      await db.table(name).bulkDelete(created);
      removed[name] = created.length;
      total += created.length;
    }
  }

  // Settings is an edit, not an insertion, so put the old row back.
  if (snapshot.settings) await db.settings.put(snapshot.settings);

  return { removed, total };
}

/** Plain-language summary of what a revert would undo. */
export function describeRevert(result: RevertResult): string {
  if (result.total === 0) return "Nothing to undo — the tour left no trace.";
  const parts: string[] = [];
  const label: Record<string, [string, string]> = {
    splits: ["split", "splits"],
    sessions: ["session", "sessions"],
    setLogs: ["set", "sets"],
    planItems: ["plan item", "plan items"],
    forgeEntries: ["Forge entry", "Forge entries"],
    activities: ["activity", "activities"],
  };
  for (const [table, [one, many]] of Object.entries(label)) {
    const n = result.removed[table];
    if (n) parts.push(`${n} ${n === 1 ? one : many}`);
  }
  if (parts.length === 0) return "Cleared what the tour created.";
  return `Removed ${parts.join(", ")}.`;
}
