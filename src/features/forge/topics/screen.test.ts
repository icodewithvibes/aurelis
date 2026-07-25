import { describe, it, expect } from "vitest";
import { topicScreen } from "./screen";
import { TOPIC_LEXICON, TOPIC_PRIORITY, type TopicKey } from "./lexicon";
import { TOPIC_TEMPLATES } from "./templates";
import { route } from "../engine";
import { VOICE_BUDGET } from "../types";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** One representative note per category (Stage 4D requirement). */
const CATEGORY_FIXTURES: [TopicKey, string][] = [
  ["recovery_guilt", "took a rest day and i feel guilty for resting"],
  ["missed_session", "i missed my workout yesterday"],
  ["self_criticism", "i suck at this and i keep letting myself down"],
  ["bad_workout", "terrible workout, everything felt heavy"],
  ["sleep_strain", "slept badly and my body feels beat up"],
  ["pre_task_anxiety", "nervous about the interview tomorrow"],
  ["overwhelmed", "too much going on, i cant keep up"],
  ["training_doubt", "not seeing progress, is this even working"],
  ["fear_of_starting", "scared to start, i dont know where to start"],
  ["avoidance", "keep putting it off and scrolling instead"],
  ["decision_fatigue", "cant decide which program to run"],
  ["stuck", "i feel stuck and spinning my wheels"],
  ["low_motivation", "no motivation today"],
  ["small_next_action", "just tell me what to do"],
  ["reflection", "just writing this out, checking in"],
];

describe("topicScreen — every category is reachable", () => {
  it.each(CATEGORY_FIXTURES)("routes to %s", (topic, note) => {
    expect(topicScreen(note)?.topic).toBe(topic);
  });

  it("covers all fifteen declared topics", () => {
    expect(TOPIC_PRIORITY).toHaveLength(15);
    expect(new Set(TOPIC_PRIORITY).size).toBe(15);
    expect(Object.keys(TOPIC_LEXICON).sort()).toEqual([...TOPIC_PRIORITY].sort());
    expect(Object.keys(TOPIC_TEMPLATES).sort()).toEqual([...TOPIC_PRIORITY].sort());
  });
});

describe("topicScreen — deterministic ordering", () => {
  it("resolves a conflict by priority, not by position in the note", () => {
    // "missed my workout" (2nd) beats "no motivation" (13th) either way round.
    const a = "i missed my workout and i have no motivation";
    const b = "no motivation, and i missed my workout";
    expect(topicScreen(a)?.topic).toBe("missed_session");
    expect(topicScreen(b)?.topic).toBe("missed_session");
  });

  it("prefers guilt about rest over a bare missed session", () => {
    expect(topicScreen("missed my workout and feel guilty for resting")?.topic).toBe(
      "recovery_guilt",
    );
  });

  it("prefers a concrete situation over the reflection catch-all", () => {
    expect(topicScreen("just writing this out — terrible workout today")?.topic).toBe(
      "bad_workout",
    );
  });

  it("is stable across repeated calls", () => {
    const note = "cant decide and i feel stuck";
    const first = topicScreen(note);
    for (let i = 0; i < 50; i++) expect(topicScreen(note)).toEqual(first);
    expect(first?.topic).toBe("decision_fatigue"); // 11th beats 12th
  });
});

describe("topicScreen — ordinary gym language must not match", () => {
  const NEUTRAL = [
    "bench 135 for 5, felt good",
    "hit a new best on squats today",
    "legs are sore in a good way",
    "added five pounds to the bar",
    "solid session, everything moved well",
    "warmed up then did the whole list",
    "",
    "   ",
  ];

  it.each(NEUTRAL)("leaves %j unmatched", (note) => {
    expect(topicScreen(note)).toBeNull();
  });

  it("returns null with no note at all", () => {
    expect(topicScreen(undefined)).toBeNull();
  });
});

describe("safety always outranks topics", () => {
  it("keeps a crisis note in gentle mode even when a topic also matches", () => {
    const r = route({
      stateKey: "want_to_quit",
      localDate: "2026-07-25",
      note: "i missed my workout and i want to kill myself",
    });
    expect(r.safety).toBe(true);
    expect(r.safetyCategory).toBe("crisis");
    expect(r.action).toBe("");
    expect(r.topic).toBeUndefined();
  });

  it("keeps an injury note in gentle mode over a bad-workout match", () => {
    const r = route({
      stateKey: "avoiding_training",
      localDate: "2026-07-25",
      note: "terrible workout, sharp pain in my knee",
    });
    expect(r.safety).toBe(true);
    expect(r.safetyCategory).toBe("injury");
  });

  it("does not let a topic phrase widen crisis matching", () => {
    // "broke my streak" is a missed session, never a crisis.
    const r = route({ stateKey: "need_reset", localDate: "2026-07-25", note: "broke my streak" });
    expect(r.safety).toBe(false);
    expect(r.topic).toBe("missed_session");
  });

  it("preserves the narrow safety negation rule underneath", () => {
    const ok = route({
      stateKey: "need_reset",
      localDate: "2026-07-25",
      note: "not suicidal, just no motivation",
    });
    expect(ok.safety).toBe(false);
    expect(ok.topic).toBe("low_motivation");

    const flagged = route({
      stateKey: "need_reset",
      localDate: "2026-07-25",
      note: "i dont want to be here anymore",
    });
    expect(flagged.safety).toBe(true);
  });
});

describe("topic responses obey the voice contract", () => {
  it("respects the length budget", () => {
    for (const t of Object.values(TOPIC_TEMPLATES)) {
      expect(words(t.acknowledgment)).toBeLessThanOrEqual(VOICE_BUDGET.acknowledgment);
      expect(words(t.reframe)).toBeLessThanOrEqual(VOICE_BUDGET.reframe);
      for (const a of t.actions) expect(words(a.text)).toBeLessThanOrEqual(VOICE_BUDGET.action);
    }
  });

  it("never uses the forbidden lexicon", () => {
    const forbidden =
      /\b(crush|destroy|dominate|beast|grind|warrior|no excuses|weak|soft|earn your worth|pain is weakness|lazy)\b/i;
    for (const t of Object.values(TOPIC_TEMPLATES)) {
      for (const line of [t.acknowledgment, t.reframe, ...t.actions.map((a) => a.text)]) {
        expect(line).not.toMatch(forbidden);
      }
    }
  });

  it("offers exactly three variants with a real time box", () => {
    for (const t of Object.values(TOPIC_TEMPLATES)) {
      expect(t.actions).toHaveLength(3);
      for (const a of t.actions) expect(a.estMinutes).toBeGreaterThan(0);
    }
  });

  it("stays deterministic per day and note", () => {
    const input = { stateKey: "need_reset", localDate: "2026-07-25", note: "i feel stuck" } as const;
    const first = route(input);
    for (let i = 0; i < 200; i++) expect(route(input)).toEqual(first);
  });
});
