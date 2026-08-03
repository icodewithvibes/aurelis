/**
 * Entry point. Loads fonts (self-hosted, no runtime CDN), tokens,
 * initializes the Dexie schema, warms everything the first screen
 * needs, and only then reveals the app behind the boot splash.
 *
 * ORDER MATTERS HERE. The database is read BEFORE first paint now,
 * because the theme lives in it: applying defaults and correcting them
 * once IndexedDB answered meant every launch flashed the wrong theme.
 * The splash in index.html is what buys the room to do this properly —
 * it is already on screen before this module is parsed.
 */
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { initDb } from "./data/db";
import { DEFAULT_PREFERENCES, loadPreferences } from "./data/repositories/settingsRepo";
import { useUiStore, applyMotionAttribute, applyThemeAttribute } from "./state/ui";
import { requestPersistentStorage } from "./lib/storage";
import { closeStaleSessions } from "./data/repositories/sessionRepo";
import { takeResumeRoute } from "./lib/resume";
import {
  BOOT_HARD_CAP_MS,
  dismissBootSplash,
  minimumSplashDelay,
  preloadCriticalAssets,
} from "./lib/boot";

const startedAt = Date.now();

/*
 * Restore the route BEFORE React mounts.
 *
 * Set synchronously so HashRouter reads the right location on its first
 * render. Doing it after mount would paint Today and then jump, which
 * is more jarring than not restoring at all.
 */
const resumeTo = takeResumeRoute();
if (resumeTo && location.hash !== resumeTo) {
  history.replaceState(null, "", resumeTo);
}

// Sensible defaults immediately, so even a failed boot is never unstyled.
applyMotionAttribute(DEFAULT_PREFERENCES.reducedMotion);
applyThemeAttribute(DEFAULT_PREFERENCES.theme);

// Ask for durable storage. iOS clears non-persistent site data after
// about a week without engagement, and a home-screen app left alone for
// a week is exactly the case that would silently lose a training log.
// Not awaited: the answer changes nothing about what we render.
void requestPersistentStorage();

// Keep 'auto' resolution live if the OS preference changes.
if (typeof window !== "undefined" && window.matchMedia) {
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    applyMotionAttribute(useUiStore.getState().reducedMotion);
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");
// Created up front, rendered later: this reserves the container without
// painting anything, so `reveal` stays synchronous and un-narrowable.
const reactRoot = createRoot(rootEl);

function mount() {
  reactRoot.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

/**
 * Preferences first (they decide the theme AND whether imagery may be
 * fetched at all), then the assets that preference permits.
 */
async function boot() {
  try {
    const status = await initDb();
    if (status === "ready") {
      // hydrate() applies the theme and motion attributes and mirrors
      // the image mode into lib/media, which preload then honours.
      useUiStore.getState().hydrate(await loadPreferences());
      // A session left open two hours ago is not still happening. Close
      // it as a half session before any screen can render it as live.
      await closeStaleSessions();
    }
    await preloadCriticalAssets();
  } catch (err) {
    // A boot that cannot warm up still has to open. Whatever failed
    // here degrades to the CSS atmosphere and default preferences.
    console.error("[forge] boot warm-up failed; opening anyway.", err);
  }
  await minimumSplashDelay(startedAt);
}

// The splash must never outlive its welcome, whatever `boot` is doing.
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  mount();
  dismissBootSplash();
}

void boot().then(reveal);
setTimeout(reveal, BOOT_HARD_CAP_MS);
