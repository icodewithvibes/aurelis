/**
 * UI preference store (Stage 3/4).
 *
 * Every preference here is FUNCTIONAL, not cosmetic bookkeeping:
 * - reducedMotion: 'auto' follows the OS; 'on' forces calm/static; 'off'
 *   keeps ambient motion. Applied as `data-reduced-motion` on <html> so
 *   CSS freezes, and read by `useMotionDisabled` for Framer.
 * - theme: applied as `data-theme` on <html>, so switching a theme is one
 *   attribute change and never a re-render of the tree.
 * - imageMode: mirrored into lib/media so synchronous render paths can
 *   decide whether optional rasters may be fetched at all.
 *
 * All of it persists to the local Dexie settings row. Nothing leaves the
 * device.
 */
import { create } from "zustand";
import { prefersReducedMotion, setImageModePreference } from "../lib/media";
import type { ImageMode, RpeMode, ThemeName } from "../data/db";
import {
  DEFAULT_PREFERENCES,
  setDefaultRestSec as persistRest,
  setStaleAfterHours as persistStaleAfterHours,
  setWakeMinutes as persistWakeMinutes,
  setImageMode as persistImageMode,
  setReducedMotion as persistReducedMotion,
  setRpeMode as persistRpeMode,
  setTheme as persistTheme,
  setUnits as persistUnits,
  type Preferences,
} from "../data/repositories/settingsRepo";

export type ReducedMotionSetting = "auto" | "on" | "off";

export function resolveMotionDisabled(mode: ReducedMotionSetting): boolean {
  if (mode === "on") return true;
  if (mode === "off") return false;
  return prefersReducedMotion();
}

/** Reflect the resolved preference onto <html> so CSS animations freeze. */
export function applyMotionAttribute(mode: ReducedMotionSetting): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.reducedMotion = resolveMotionDisabled(mode) ? "true" : "false";
}

export function applyThemeAttribute(theme: ThemeName): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

interface UiState extends Preferences {
  /** Hydrate from persisted settings on boot (no persist write). */
  hydrate: (prefs: Preferences) => void;
  setReducedMotion: (mode: ReducedMotionSetting) => void;
  setTheme: (theme: ThemeName) => void;
  setImageMode: (mode: ImageMode) => void;
  setUnits: (units: "lb" | "kg") => void;
  setRpeMode: (mode: RpeMode) => void;
  setDefaultRestSec: (seconds: number) => void;
  setStaleAfterHours: (hours: number) => void;
  setWakeMinutes: (minutes: number) => void;
  motionDisabled: () => boolean;
}

export const useUiStore = create<UiState>()((set, get) => ({
  ...DEFAULT_PREFERENCES,

  hydrate: (prefs) => {
    set(prefs);
    applyMotionAttribute(prefs.reducedMotion);
    applyThemeAttribute(prefs.theme);
    setImageModePreference(prefs.imageMode);
  },

  setReducedMotion: (mode) => {
    set({ reducedMotion: mode });
    applyMotionAttribute(mode);
    void persistReducedMotion(mode);
  },

  setTheme: (theme) => {
    set({ theme });
    applyThemeAttribute(theme);
    void persistTheme(theme);
  },

  setImageMode: (imageMode) => {
    set({ imageMode });
    setImageModePreference(imageMode);
    void persistImageMode(imageMode);
  },

  setUnits: (units) => {
    set({ units });
    void persistUnits(units);
  },

  setRpeMode: (rpeMode) => {
    set({ rpeMode });
    void persistRpeMode(rpeMode);
  },

  setDefaultRestSec: (defaultRestSec) => {
    set({ defaultRestSec });
    void persistRest(defaultRestSec);
  },

  setStaleAfterHours: (staleAfterHours) => {
    set({ staleAfterHours });
    void persistStaleAfterHours(staleAfterHours);
  },

  setWakeMinutes: (wakeMinutes) => {
    set({ wakeMinutes });
    void persistWakeMinutes(wakeMinutes);
  },

  motionDisabled: () => resolveMotionDisabled(get().reducedMotion),
}));
