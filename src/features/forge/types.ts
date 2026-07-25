/**
 * Forge contract (02_strategy/02 §0, §3) — FROZEN.
 *
 * `generateResponse()` is the only unit a future private AI may replace.
 * It must return exactly this shape, and it must still be reached
 * through `safetyScreen()`. UI and storage never change around it.
 */

export type ForgeStateKey =
  | "overthinking"
  | "low_energy"
  | "avoiding_training"
  | "avoiding_work"
  | "want_to_quit"
  | "need_recovery"
  | "need_reset";

export const FORGE_STATES: { key: ForgeStateKey; label: string }[] = [
  { key: "overthinking", label: "Overthinking" },
  { key: "low_energy", label: "Low energy" },
  { key: "avoiding_training", label: "Avoiding training" },
  { key: "avoiding_work", label: "Avoiding school or work" },
  { key: "want_to_quit", label: "Want to quit" },
  { key: "need_recovery", label: "Need recovery" },
  { key: "need_reset", label: "Need to reset" },
];

export type SafetyCategory = "crisis" | "injury" | "exhaustion" | "life_crisis";

export interface ForgeInput {
  stateKey: ForgeStateKey;
  note?: string;
  /** Device-local YYYY-MM-DD. Keeps selection deterministic per day. */
  localDate: string;
}

export interface ForgeResponse {
  acknowledgment: string;
  reframe: string;
  /** Empty in safety mode — a flagged input is never given a task. */
  action: string;
  /** Zero in safety mode — no time box, no pressure. */
  estMinutes: number;
  tone: "steady" | "gentle";
  safety: boolean;
  /**
   * Additive, optional: lets the surface show the right resources
   * without re-running the screen. Never set outside safety mode.
   */
  safetyCategory?: SafetyCategory;
  /**
   * Additive, optional: which topic family answered, when the note named
   * one. Diagnostic only — the UI reads the three text fields.
   */
  topic?: string;
}

/** Voice length budget (02_strategy/02 §1). Enforced by tests. */
export const VOICE_BUDGET = {
  acknowledgment: 12,
  reframe: 24,
  action: 16,
} as const;
