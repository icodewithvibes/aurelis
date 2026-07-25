/**
 * UI preference store (Stage 1).
 * `reducedMotion` is the in-app seam required by the design system
 * (05 §4): 'auto' follows the OS `prefers-reduced-motion`.
 * Stage 1 ships NO functional switcher — the value stays 'auto';
 * later stages may surface it in Settings.
 */
import { create } from "zustand";
import { prefersReducedMotion } from "../lib/media";

export type ReducedMotionSetting = "auto" | "on" | "off";

interface UiState {
  reducedMotion: ReducedMotionSetting;
  /** Resolved: should non-essential motion be disabled right now? */
  motionDisabled: () => boolean;
}

export const useUiStore = create<UiState>()((_set, get) => ({
  reducedMotion: "auto",
  motionDisabled: () => {
    const pref = get().reducedMotion;
    if (pref === "on") return true;
    if (pref === "off") return false;
    return prefersReducedMotion();
  },
}));
