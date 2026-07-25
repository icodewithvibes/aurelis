/**
 * Forge engine (02_strategy/02 §0) — the AI-swappable seam.
 *
 *   route() ──► safetyScreen() ── flagged ──► SAFETY MODE (never a task)
 *      │
 *      ▼ not flagged
 *   generateResponse()  ◄── V1: deterministic templates
 *                           Future: replace ONLY this function
 *
 * A future private AI must return the same `ForgeResponse` and must
 * still be reached through `route()`, so the safety screen can never be
 * bypassed. Nothing here reads the clock, storage or the network, and
 * there is no randomness anywhere: the same input on the same day
 * always produces the same response.
 */
import { hashIndex } from "../../lib/hash";
import { safetyScreen } from "./safety/screen";
import { SAFETY_TEMPLATES, TEMPLATES } from "./templates";
import type { ForgeInput, ForgeResponse, SafetyCategory } from "./types";

/** `hash(stateKey + localDate + note) % variants.length` (§2). */
export function variantIndexFor(input: ForgeInput, count: number): number {
  return hashIndex(`${input.stateKey}|${input.localDate}|${input.note ?? ""}`, count);
}

export function safetyResponse(category: SafetyCategory): ForgeResponse {
  const t = SAFETY_TEMPLATES[category];
  return {
    acknowledgment: t.acknowledgment,
    reframe: t.reframe,
    action: "", // no task
    estMinutes: 0, // no time box
    tone: "gentle",
    safety: true,
    safetyCategory: category,
  };
}

/**
 * The deterministic template response. Callers should use `route()` —
 * this skips the safety screen and exists as the isolated seam.
 */
export function generateResponse(input: ForgeInput): ForgeResponse {
  const family = TEMPLATES[input.stateKey];
  const action = family.actions[variantIndexFor(input, family.actions.length)];
  return {
    acknowledgment: family.acknowledgment,
    reframe: family.reframe,
    action: action.text,
    estMinutes: action.estMinutes,
    tone: family.tone,
    safety: false,
  };
}

/** Safety first, always. This is the only entry point the UI may call. */
export function route(input: ForgeInput): ForgeResponse {
  const flag = safetyScreen(input.note);
  if (flag) return safetyResponse(flag.category);
  return generateResponse(input);
}
