import { describe, it, expect } from "vitest";
import { normalize, safetyScreen } from "./screen";
import type { SafetyCategory } from "../types";

/**
 * Fixture set required by 02_strategy/02 §6. The screen is a guardrail,
 * not a clinical detector: catching too much is acceptable, missing a
 * serious note is not.
 */
const MUST_FLAG: [string, SafetyCategory][] = [
  ["I want to kill myself", "crisis"],
  ["been thinking about suicide again", "crisis"],
  ["i dont want to be here anymore", "crisis"],
  ["I don't want to be here anymore", "crisis"],
  ["there's no reason to live", "crisis"],
  ["I've been cutting myself", "crisis"],
  ["everyone would be better off without me", "crisis"],
  ["I can't go on like this", "crisis"],
  ["sharp pain in my shoulder", "injury"],
  ["I think I pulled a muscle", "injury"],
  ["my knee gave out mid set", "injury"],
  ["shoulder is swollen and it hurts to move", "injury"],
  ["haven't slept in two days", "exhaustion"],
  ["I havent eaten anything today", "exhaustion"],
  ["completely burnt out", "exhaustion"],
  ["been throwing up all morning", "exhaustion"],
  ["had a panic attack this morning", "life_crisis"],
  ["my grandfather passed away", "life_crisis"],
  ["lost my job yesterday", "life_crisis"],
];

const MUST_NOT_FLAG = [
  "I'm not suicidal, just tired of the same routine",
  "no pain today, felt strong",
  "legs are sore but fine",
  "just feeling lazy this morning",
  "don't feel like training",
  "work has been busy",
  "want to skip today and play games",
  "bench felt heavy but good",
  "not injured, just unmotivated",
  "no injury, just rusty",
  "",
  "   ",
];

describe("normalize", () => {
  it("folds case, punctuation and apostrophes", () => {
    expect(normalize("Don't  GO!!")).toBe("dont go");
    expect(normalize("I’m fine.")).toBe("im fine");
  });
});

describe("safetyScreen — must flag", () => {
  it.each(MUST_FLAG)("flags %j as %s", (note, category) => {
    const flag = safetyScreen(note);
    expect(flag).not.toBeNull();
    expect(flag!.category).toBe(category);
  });
});

describe("safetyScreen — must not flag", () => {
  it.each(MUST_NOT_FLAG)("leaves %j alone", (note) => {
    expect(safetyScreen(note)).toBeNull();
  });

  it("returns null for a missing note", () => {
    expect(safetyScreen(undefined)).toBeNull();
  });
});

describe("safetyScreen — negation is narrow on purpose", () => {
  it("cancels short symptom words that are plainly negated", () => {
    expect(safetyScreen("not suicidal")).toBeNull();
    expect(safetyScreen("no pain at all")).toBeNull();
    expect(safetyScreen("never exhausted")).toBeNull();
  });

  it("NEVER lets a negator silence a multi-word crisis phrase", () => {
    // These phrases carry their own negation; cancelling them would
    // silence the most serious inputs there are.
    expect(safetyScreen("i dont want to be here anymore")?.category).toBe("crisis");
    expect(safetyScreen("i cant go on")?.category).toBe("crisis");
    expect(safetyScreen("no reason to live")?.category).toBe("crisis");
  });

  it("only cancels when the negator is close to the word", () => {
    // "no" here belongs to another clause entirely.
    expect(safetyScreen("no music today and the pain is back")?.category).toBe("injury");
  });
});

describe("safetyScreen — priority", () => {
  it("returns the most serious category when several match", () => {
    const note = "my knee hurts, i havent slept, and i want to kill myself";
    expect(safetyScreen(note)?.category).toBe("crisis");
  });

  it("prefers injury over exhaustion", () => {
    expect(safetyScreen("sharp pain and i am exhausted")?.category).toBe("injury");
  });
});

describe("safetyScreen — matching is word-boundary aware", () => {
  it("does not match inside unrelated words", () => {
    expect(safetyScreen("therapist appointment went well")).toBeNull();
    expect(safetyScreen("painting the garage today")).toBeNull();
    expect(safetyScreen("sprinted to the bus")).toBeNull();
  });
});
