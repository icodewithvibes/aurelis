/**
 * Local backup (Stage 5) — the escape hatch a local-first app owes you.
 *
 * Because nothing is ever uploaded, a lost browser profile is a lost
 * training history. This produces a single portable JSON file the user
 * controls, and restores from it.
 *
 * Pure module: building and validating a backup involve no storage.
 * `backupRepo` does the reading and writing.
 */

/** Bump only when the shape changes incompatibly. */
export const BACKUP_SCHEMA = 1;

export const BACKUP_TABLES = [
  "splits",
  "splitDays",
  "templateExercises",
  "sessions",
  "setLogs",
  "forgeEntries",
  "prs",
  "proofEvents",
  "dayMarks",
  "notes",
  "records",
  "settings",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

export interface BackupFile {
  app: "aurelis";
  schema: number;
  exportedAt: string;
  data: Record<BackupTable, unknown[]>;
}

export function buildBackup(
  data: Record<BackupTable, unknown[]>,
  exportedAt = new Date().toISOString(),
): BackupFile {
  return { app: "aurelis", schema: BACKUP_SCHEMA, exportedAt, data };
}

export type ValidationResult =
  | { ok: true; file: BackupFile; counts: Record<string, number> }
  | { ok: false; error: string };

/**
 * Validate an untrusted file before it is allowed anywhere near the
 * database. Restoring replaces everything, so a malformed or foreign
 * file must be rejected outright rather than partially applied.
 */
export function validateBackup(value: unknown): ValidationResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "That file isn't a backup — it doesn't contain an object." };
  }

  const file = value as Partial<BackupFile>;
  if (file.app !== "aurelis") {
    return { ok: false, error: "That file wasn't exported by AURELIS." };
  }
  if (typeof file.schema !== "number") {
    return { ok: false, error: "That backup has no schema version." };
  }
  if (file.schema > BACKUP_SCHEMA) {
    return {
      ok: false,
      error: `That backup is from a newer version of AURELIS (schema ${file.schema}). Update the app first.`,
    };
  }
  if (typeof file.data !== "object" || file.data === null) {
    return { ok: false, error: "That backup has no data." };
  }

  const counts: Record<string, number> = {};
  for (const table of BACKUP_TABLES) {
    const rows = (file.data as Record<string, unknown>)[table];
    if (rows === undefined) {
      counts[table] = 0;
      continue; // a table added after the export simply restores empty
    }
    if (!Array.isArray(rows)) {
      return { ok: false, error: `That backup's "${table}" section is malformed.` };
    }
    counts[table] = rows.length;
  }

  return { ok: true, file: file as BackupFile, counts };
}

/** "aurelis-backup-2026-07-25.json" */
export function backupFilename(exportedAt = new Date()): string {
  const y = exportedAt.getFullYear();
  const m = String(exportedAt.getMonth() + 1).padStart(2, "0");
  const d = String(exportedAt.getDate()).padStart(2, "0");
  return `aurelis-backup-${y}-${m}-${d}.json`;
}

/** A short, human summary of what a validated backup holds. */
export function summarizeBackup(counts: Record<string, number>): string {
  const parts: string[] = [];
  if (counts.sessions) parts.push(`${counts.sessions} session${counts.sessions === 1 ? "" : "s"}`);
  if (counts.setLogs) parts.push(`${counts.setLogs} set${counts.setLogs === 1 ? "" : "s"}`);
  if (counts.forgeEntries) {
    parts.push(`${counts.forgeEntries} Forge entr${counts.forgeEntries === 1 ? "y" : "ies"}`);
  }
  if (counts.splits) parts.push(`${counts.splits} split${counts.splits === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : "no training data";
}
