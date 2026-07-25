/**
 * Crisis resources (02_strategy/02 §5) — LOCKED to United States /
 * Massachusetts for V1.
 *
 * Data-driven so it can be localized later without touching the engine
 * or the UI. This module is the canonical source; `settings.crisisResources`
 * is seeded from it, and this stays the fallback if that row predates the
 * field.
 *
 * Rules baked into the copy: calm, warm, brief, non-clinical,
 * non-shaming. No urgency-panic, no toughness, never a diagnosis, never
 * an implication that the user failed.
 */
import type { SafetyCategory } from "./types";

export interface CrisisResources {
  region: string;
  /** Shown for the self-harm / suicidal-ideation category. */
  immediate: string;
  /** Shown for acute but non-immediate distress. */
  distress: string;
  /** Shown for injury, illness and severe exhaustion. */
  physical: string;
}

export const CRISIS_RESOURCES: Record<string, CrisisResources> = {
  "US-MA": {
    region: "US-MA",
    immediate:
      "Call or text 988 in the U.S. and Canada, call 911 if you're in immediate danger, or reach a trusted person nearby now.",
    distress:
      "This is worth not carrying alone — reach out to someone you trust, and consider talking with a licensed mental-health professional.",
    physical:
      "Pain and exhaustion are stop signals. Rest, and if it persists or worsens, get appropriate medical guidance.",
  },
};

export const DEFAULT_CRISIS_REGION = "US-MA";

export function crisisResourcesFor(region = DEFAULT_CRISIS_REGION): CrisisResources {
  return CRISIS_RESOURCES[region] ?? CRISIS_RESOURCES[DEFAULT_CRISIS_REGION];
}

/** The single resource line that belongs with each safety category. */
export function resourceLineFor(
  category: SafetyCategory,
  resources: CrisisResources = crisisResourcesFor(),
): string {
  switch (category) {
    case "crisis":
      return resources.immediate;
    case "life_crisis":
      return resources.distress;
    case "injury":
    case "exhaustion":
      return resources.physical;
  }
}
