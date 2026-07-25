/**
 * Combined motion preference: the in-app setting OR the OS preference.
 * Reactive to the store so toggling the control updates the UI live.
 * Use this in place of Framer's useReducedMotion so the Settings control
 * actually governs motion.
 */
import { useUiStore, resolveMotionDisabled } from "../state/ui";

export function useMotionDisabled(): boolean {
  const mode = useUiStore((s) => s.reducedMotion);
  return resolveMotionDisabled(mode);
}
