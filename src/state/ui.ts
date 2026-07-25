/**
 * UI preference store (Stage 3). `reducedMotion` is now a FUNCTIONAL
 * control: 'auto' follows the OS `prefers-reduced-motion`; 'on' forces
 * calm/static; 'off' keeps ambient motion. Persisted to Dexie settings,
 * and applied globally via a `data-reduced-motion` attribute on <html>
 * (CSS freezes) plus the `useMotionDisabled` hook (Framer).
 */
import { create } from "zustand";
import { prefersReducedMotion } from "../lib/media";
import { setReducedMotion as persistReducedMotion } from "../data/repositories/settingsRepo";

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

interface UiState {
  reducedMotion: ReducedMotionSetting;
  /** hydrate from persisted settings on boot (no persist write). */
  hydrateReducedMotion: (mode: ReducedMotionSetting) => void;
  /** user action: update, persist, and apply. */
  setReducedMotion: (mode: ReducedMotionSetting) => void;
  motionDisabled: () => boolean;
}

export const useUiStore = create<UiState>()((set, get) => ({
  reducedMotion: "auto",
  hydrateReducedMotion: (mode) => {
    set({ reducedMotion: mode });
    applyMotionAttribute(mode);
  },
  setReducedMotion: (mode) => {
    set({ reducedMotion: mode });
    applyMotionAttribute(mode);
    void persistReducedMotion(mode);
  },
  motionDisabled: () => resolveMotionDisabled(get().reducedMotion),
}));
