/**
 * Resume — reopen where you left off.
 *
 * iOS evicts a backgrounded web app aggressively. Lock the phone
 * mid-session, come back, and the app boots cold at Today with the
 * session you were four sets into nowhere in sight. The data was never
 * lost — every set is written as it is entered — but you had to
 * navigate back to it, which is exactly the friction that makes someone
 * stop logging halfway through.
 *
 * So the current route is remembered, and boot restores it.
 *
 * WHY localStorage AND NOT IndexedDB: this has to be read synchronously
 * before the first render, or the app paints Today and then jumps,
 * which is worse than not restoring at all. Dexie is async by nature.
 * It is one short string of non-precious data, and if it is missing the
 * app simply opens at Today.
 *
 * WHAT IS NOT RESTORED, deliberately: anything older than the window
 * below. Coming back the next morning should start the day at Today,
 * not drop you into yesterday's half-finished session as though no time
 * had passed. Restoring stale context is its own kind of lie.
 */
const KEY = "aurelis.lastRoute";
/** Beyond this, a return is a new visit rather than a continuation. */
export const RESUME_WINDOW_MS = 6 * 60 * 60 * 1000;

interface StoredRoute {
  hash: string;
  at: number;
}

/** Routes worth returning to. */
export function isResumable(hash: string): boolean {
  const route = hash.replace(/^#/, "");
  // A live session is the case this exists for. The others are places
  // you can be genuinely mid-task.
  return (
    route.startsWith("/session/") ||
    route.startsWith("/forge") ||
    route.startsWith("/import") ||
    route.startsWith("/plan")
  );
}

export function rememberRoute(hash: string, now = Date.now()): void {
  try {
    if (!isResumable(hash)) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify({ hash, at: now } satisfies StoredRoute));
  } catch {
    // Private mode, quota, disabled storage — resuming is a convenience.
  }
}

/**
 * The route to reopen at, or null to start at Today.
 * Reading it CLEARS it: a resume is offered once, not pinned forever.
 */
export function takeResumeRoute(now = Date.now()): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);

    const parsed = JSON.parse(raw) as Partial<StoredRoute>;
    if (typeof parsed?.hash !== "string" || typeof parsed?.at !== "number") return null;
    if (now - parsed.at > RESUME_WINDOW_MS) return null;
    if (!isResumable(parsed.hash)) return null;
    return parsed.hash;
  } catch {
    return null;
  }
}
