import { describe, it, expect } from "vitest";
import { generateResponse, route, safetyResponse, variantIndexFor } from "./engine";
import { SAFETY_TEMPLATES, TEMPLATES } from "./templates";
import { FORGE_STATES, VOICE_BUDGET, type ForgeInput, type ForgeStateKey } from "./types";

const input = (over: Partial<ForgeInput> = {}): ForgeInput => ({
  stateKey: "overthinking",
  localDate: "2026-07-25",
  ...over,
});

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const ALL_STATES = FORGE_STATES.map((s) => s.key);

describe("determinism (02_strategy/02 §2, §6)", () => {
  it("gives the same response for the same input", () => {
    expect(generateResponse(input())).toEqual(generateResponse(input()));
  });

  it("gives the same response for a repeated note on the same day", () => {
    const a = route(input({ note: "cant get started" }));
    const b = route(input({ note: "cant get started" }));
    expect(a).toEqual(b);
  });

  it("varies across days", () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const date = `2026-07-${String(d).padStart(2, "0")}`;
      seen.add(generateResponse(input({ localDate: date })).action);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("keeps the variant index inside the family", () => {
    for (const stateKey of ALL_STATES) {
      for (let d = 1; d <= 31; d++) {
        const i = variantIndexFor(
          input({ stateKey, localDate: `2026-07-${String(d).padStart(2, "0")}` }),
          3,
        );
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(3);
      }
    }
  });

  it("uses no randomness — a thousand calls agree", () => {
    const first = generateResponse(input({ stateKey: "need_reset", note: "x" }));
    for (let i = 0; i < 1000; i++) {
      expect(generateResponse(input({ stateKey: "need_reset", note: "x" }))).toEqual(first);
    }
  });
});

describe("every state answers", () => {
  it.each(ALL_STATES)("%s returns a complete response", (stateKey) => {
    const r = generateResponse(input({ stateKey: stateKey as ForgeStateKey }));
    expect(r.acknowledgment).toBeTruthy();
    expect(r.reframe).toBeTruthy();
    expect(r.action).toBeTruthy();
    expect(r.estMinutes).toBeGreaterThan(0);
    expect(r.safety).toBe(false);
    expect(r.safetyCategory).toBeUndefined();
  });

  it("marks recovery and reset as gentle", () => {
    expect(generateResponse(input({ stateKey: "need_recovery" })).tone).toBe("gentle");
    expect(generateResponse(input({ stateKey: "need_reset" })).tone).toBe("gentle");
    expect(generateResponse(input({ stateKey: "want_to_quit" })).tone).toBe("steady");
  });

  it("offers exactly three variants per state", () => {
    for (const stateKey of ALL_STATES) expect(TEMPLATES[stateKey].actions).toHaveLength(3);
  });
});

describe("voice (§1)", () => {
  it("respects the length budget in every template", () => {
    for (const stateKey of ALL_STATES) {
      const f = TEMPLATES[stateKey];
      expect(words(f.acknowledgment)).toBeLessThanOrEqual(VOICE_BUDGET.acknowledgment);
      expect(words(f.reframe)).toBeLessThanOrEqual(VOICE_BUDGET.reframe);
      for (const a of f.actions) {
        expect(words(a.text)).toBeLessThanOrEqual(VOICE_BUDGET.action);
      }
    }
  });

  it("respects the length budget in safety copy", () => {
    for (const t of Object.values(SAFETY_TEMPLATES)) {
      expect(words(t.acknowledgment)).toBeLessThanOrEqual(VOICE_BUDGET.acknowledgment);
      expect(words(t.reframe)).toBeLessThanOrEqual(VOICE_BUDGET.reframe);
    }
  });

  it("never uses the forbidden lexicon", () => {
    const forbidden =
      /\b(crush|destroy|dominate|beast|grind|warrior|no excuses|weak|soft|earn your worth|pain is weakness)\b/i;
    const all = [
      ...ALL_STATES.flatMap((k) => [
        TEMPLATES[k].acknowledgment,
        TEMPLATES[k].reframe,
        ...TEMPLATES[k].actions.map((a) => a.text),
      ]),
      ...Object.values(SAFETY_TEMPLATES).flatMap((t) => [t.acknowledgment, t.reframe]),
    ];
    for (const line of all) expect(line).not.toMatch(forbidden);
  });

  it("gives exactly one action, never a stack of tasks", () => {
    for (const stateKey of ALL_STATES) {
      for (const a of TEMPLATES[stateKey].actions) {
        expect(a.text.split(/\band\b/i).length).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe("safety mode (§4)", () => {
  it("never assigns a task or a time box", () => {
    for (const category of ["crisis", "injury", "exhaustion", "life_crisis"] as const) {
      const r = safetyResponse(category);
      expect(r.action).toBe("");
      expect(r.estMinutes).toBe(0);
      expect(r.tone).toBe("gentle");
      expect(r.safety).toBe(true);
      expect(r.safetyCategory).toBe(category);
    }
  });

  it("screens BEFORE the template, whatever state was chosen", () => {
    for (const stateKey of ALL_STATES) {
      const r = route(input({ stateKey: stateKey as ForgeStateKey, note: "i want to kill myself" }));
      expect(r.safety).toBe(true);
      expect(r.safetyCategory).toBe("crisis");
      expect(r.action).toBe("");
    }
  });

  it("routes an injury note away from training, even from a training state", () => {
    const r = route(input({ stateKey: "avoiding_training", note: "sharp pain in my knee" }));
    expect(r.safety).toBe(true);
    expect(r.safetyCategory).toBe("injury");
  });

  it("routes exhaustion away from a push, per the low-energy rule", () => {
    const r = route(input({ stateKey: "low_energy", note: "havent slept in two days" }));
    expect(r.safety).toBe(true);
    expect(r.safetyCategory).toBe("exhaustion");
  });

  it("leaves an ordinary note on the normal path", () => {
    const r = route(input({ stateKey: "low_energy", note: "just a bit flat today" }));
    expect(r.safety).toBe(false);
    expect(r.action).toBeTruthy();
  });
});
