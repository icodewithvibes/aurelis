/**
 * Entry point. Loads fonts (self-hosted, no runtime CDN), tokens,
 * initializes the Dexie schema shell (no feature persistence), and
 * mounts the app shell.
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

// Fire-and-forget: schema init must never block first paint.
// After init, hydrate every persisted preference and apply it.
void initDb().then(async (status) => {
  if (status === "ready") useUiStore.getState().hydrate(await loadPreferences());
});

// Ask for durable storage. iOS clears non-persistent site data after
// about a week without engagement, and a home-screen app left alone for
// a week is exactly the case that would silently lose a training log.
void requestPersistentStorage();
// Sensible defaults before hydration so the first paint is never unstyled.
applyMotionAttribute(DEFAULT_PREFERENCES.reducedMotion);
applyThemeAttribute(DEFAULT_PREFERENCES.theme);

// Keep 'auto' resolution live if the OS preference changes.
if (typeof window !== "undefined" && window.matchMedia) {
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    applyMotionAttribute(useUiStore.getState().reducedMotion);
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
