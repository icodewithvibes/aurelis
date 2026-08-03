/**
 * Storage durability (Stage 6).
 *
 * FORGE keeps everything on the device, so storage that quietly fails
 * or gets evicted is not a degraded experience — it is total data loss.
 * Two protections live here:
 *
 * 1. `requestPersistentStorage()` asks the browser to mark this origin
 *    persistent. iOS evicts non-persistent site data after roughly seven
 *    days without engagement, and a home-screen app that sits unused for
 *    a week is exactly the case that gets wiped.
 * 2. `describeStorage()` gives the UI something honest to show when
 *    persistence is not available, instead of pretending a save worked.
 */

export type PersistState = "persisted" | "best-effort" | "unavailable";

export interface StorageReport {
  state: PersistState;
  /** Bytes used, when the browser will say. */
  usage?: number;
  quota?: number;
}

/**
 * Ask for durable storage. Safe to call on every boot: browsers that
 * already granted it return true immediately, and browsers without the
 * API simply report best-effort.
 */
export async function requestPersistentStorage(): Promise<PersistState> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage) return "unavailable";

    if (typeof navigator.storage.persisted === "function") {
      if (await navigator.storage.persisted()) return "persisted";
    }
    if (typeof navigator.storage.persist === "function") {
      return (await navigator.storage.persist()) ? "persisted" : "best-effort";
    }
    return "best-effort";
  } catch {
    return "unavailable";
  }
}

export async function describeStorage(): Promise<StorageReport> {
  const state = await requestPersistentStorage();
  try {
    if (navigator.storage?.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      return { state, usage, quota };
    }
  } catch {
    /* estimate is a nicety; never let it break boot */
  }
  return { state };
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
