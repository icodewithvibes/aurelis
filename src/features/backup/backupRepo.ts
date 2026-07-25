/**
 * Backup persistence — read every table out, or replace every table
 * from a validated file.
 *
 * Restore is deliberately a REPLACE, not a merge: merging two histories
 * would silently invent a training record that never happened. The UI
 * states that plainly before the user commits to it.
 */
import { db } from "../../data/db";
import {
  BACKUP_TABLES,
  buildBackup,
  validateBackup,
  type BackupFile,
  type BackupTable,
} from "./backup";

type TableMap = Record<BackupTable, unknown[]>;

function tableRef(name: BackupTable) {
  return (db as unknown as Record<BackupTable, { toArray(): Promise<unknown[]> }>)[name];
}

export async function exportBackup(): Promise<BackupFile> {
  const data = {} as TableMap;
  for (const name of BACKUP_TABLES) {
    data[name] = await tableRef(name).toArray();
  }
  return buildBackup(data);
}

export interface RestoreResult {
  ok: boolean;
  error?: string;
  counts?: Record<string, number>;
}

/**
 * Replace all local data with a backup's contents. Validated first, then
 * applied inside one transaction so a failure part-way cannot leave a
 * half-restored database.
 */
export async function restoreBackup(raw: unknown): Promise<RestoreResult> {
  const result = validateBackup(raw);
  if (!result.ok) return { ok: false, error: result.error };

  const stores = BACKUP_TABLES.map((name) =>
    (db as unknown as Record<string, never>)[name],
  ) as never[];

  await db.transaction("rw", stores, async () => {
    for (const name of BACKUP_TABLES) {
      const table = (db as unknown as Record<
        BackupTable,
        { clear(): Promise<void>; bulkPut(rows: unknown[]): Promise<unknown> }
      >)[name];
      await table.clear();
      const rows = result.file.data[name];
      if (Array.isArray(rows) && rows.length > 0) await table.bulkPut(rows);
    }
  });

  return { ok: true, counts: result.counts };
}

/** Parse text from a chosen file, then restore. */
export async function restoreBackupFromText(text: string): Promise<RestoreResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  return restoreBackup(parsed);
}
