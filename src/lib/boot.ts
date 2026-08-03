/**
 * Boot gate — everything the first screen needs, fetched and decoded
 * BEFORE the app is revealed, so opening FORGE never shows pieces
 * arriving one at a time.
 *
 * What gets waited on, and why only these:
 * - The database, and the preferences inside it. Theme and motion were
 *   previously applied as defaults and then corrected once IndexedDB
 *   answered, which meant a themed user watched the wrong theme repaint
 *   into the right one on every single launch. That is the worst pop-in
 *   in the app and it is fixed by ordering, not animation.
 * - Fonts. Text drawn in a fallback face and reflowed into Fraunces a
 *   moment later is the second most visible one.
 * - The imagery Today actually opens with — the current hero for this
 *   time band, and the grain. `decode()` rather than `load`, so the
 *   bitmap is ready to paint, not merely downloaded.
 *
 * What does NOT gate the reveal: route chunks (Today ships in the
 * shell), exercise photos (fetched on demand, by design), and the crest
 * medallions (only the Proof hero uses them).
 *
 * Two budgets keep this honest. Imagery gets its own short budget and
 * is abandoned quietly when the network is slow — the app is correct
 * without it, and the CSS atmosphere is the real background. Then a
 * hard cap covers the whole gate, because a splash that can hang is a
 * worse failure than any pop-in it was meant to prevent.
 */
import { imageryAllowed } from "./media";
import { heroForTime } from "../design/heroes";
import grainUrl from "../design/assets/textures/grain_128.png";

/** Slow imagery is dropped rather than waited on. */
const IMAGE_BUDGET_MS = 2500;
/** Nothing may hold the splash longer than this, for any reason. */
export const BOOT_HARD_CAP_MS = 6000;
/** Below this the splash reads as a flicker, so hold it a beat. */
const MIN_VISIBLE_MS = 420;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Fetch and decode one image. Never rejects: a missing decorative
 * raster is a non-event, and the caller has nothing to do about it.
 */
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // decode() puts the bitmap in memory; without it the first paint
      // still does the decode work and can drop a frame.
      if (typeof img.decode === "function") img.decode().then(() => resolve(), () => resolve());
      else resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** Fonts, then the imagery the landing screen opens with. */
export async function preloadCriticalAssets(): Promise<void> {
  const fonts =
    typeof document !== "undefined" && "fonts" in document
      ? withTimeout(document.fonts.ready, IMAGE_BUDGET_MS)
      : Promise.resolve(null);

  // Save-Data (or an explicit opt-out) means these are never fetched at
  // all — waiting on them here would quietly defeat that choice.
  const images = imageryAllowed()
    ? withTimeout(
        Promise.all([preloadImage(heroForTime().webp), preloadImage(grainUrl)]).then(() => null),
        IMAGE_BUDGET_MS,
      )
    : Promise.resolve(null);

  await Promise.all([fonts, images]);
}

/**
 * Fade the splash out and remove it. Safe to call more than once, and a
 * no-op if the element is already gone.
 */
export function dismissBootSplash(): void {
  const splash = document.getElementById("boot-splash");
  if (!splash || splash.dataset.leaving === "true") return;
  splash.dataset.leaving = "true";
  const done = () => splash.remove();
  splash.addEventListener("transitionend", done, { once: true });
  // transitionend never fires if the element is not compositing (a
  // backgrounded tab, reduced motion in some engines), so back it up.
  setTimeout(done, 600);
}

/** Holds the splash to MIN_VISIBLE_MS so a warm start does not flash. */
export function minimumSplashDelay(startedAt: number): Promise<void> {
  const remaining = MIN_VISIBLE_MS - (Date.now() - startedAt);
  return remaining > 0 ? new Promise((r) => setTimeout(r, remaining)) : Promise.resolve();
}
