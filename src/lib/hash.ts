/**
 * FNV-1a — small, stable, dependency-free string hash.
 *
 * Used wherever FORGE needs a choice that is varied but REPRODUCIBLE:
 * the time-of-day hero variant and the Forge template variant. Never
 * use Math.random for those — the same input must always give the same
 * output so the app is testable and never flickers.
 */
export function hashString(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Deterministic index into a list of `count` items. */
export function hashIndex(key: string, count: number): number {
  if (count <= 1) return 0;
  return hashString(key) % count;
}
