/**
 * safetyScreen (02_strategy/02 §4) — runs BEFORE any template, always.
 *
 * Pure and deterministic: no time, no storage, no network, no
 * randomness. Matching is case-insensitive and word-boundary aware,
 * with narrow negation handling (see lexicon).
 *
 * Bias toward caution: when a note is ambiguous the screen flags it,
 * because the consequence of flagging is only a gentler message.
 */
import type { SafetyCategory } from "../types";
import {
  CATEGORY_PRIORITY,
  NEGATION_WINDOW,
  NEGATORS,
  SAFETY_LEXICON,
  type SafetyPhrase,
} from "./lexicon";

export interface SafetyFlag {
  category: SafetyCategory;
  /** The phrase that matched — for tests and transparency, never shown as a diagnosis. */
  matched: string;
}

/**
 * Lowercase, strip punctuation to spaces, collapse whitespace. Keeps
 * apostrophe-less forms aligned so "don't" and "dont" both match.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isNegated(words: string[], matchStart: number): boolean {
  const from = Math.max(0, matchStart - NEGATION_WINDOW);
  return words.slice(from, matchStart).some((w) => NEGATORS.includes(w));
}

/** Index of the first word-aligned occurrence of `phrase`, or -1. */
function findPhrase(words: string[], phraseWords: string[]): number {
  outer: for (let i = 0; i + phraseWords.length <= words.length; i++) {
    for (let j = 0; j < phraseWords.length; j++) {
      if (words[i + j] !== phraseWords[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function matchCategory(words: string[], phrases: SafetyPhrase[]): string | null {
  for (const { phrase, negatable } of phrases) {
    const phraseWords = normalize(phrase).split(" ");
    const at = findPhrase(words, phraseWords);
    if (at < 0) continue;
    // Only short symptom words may be cancelled; everything else stands.
    if (negatable && isNegated(words, at)) continue;
    return phrase;
  }
  return null;
}

/**
 * Screen a free-text note. Returns the most serious category that
 * matched, or null when nothing did.
 */
export function safetyScreen(note?: string): SafetyFlag | null {
  if (!note || !note.trim()) return null;
  const words = normalize(note).split(" ").filter(Boolean);
  if (words.length === 0) return null;

  for (const category of CATEGORY_PRIORITY) {
    const matched = matchCategory(words, SAFETY_LEXICON[category]);
    if (matched) return { category, matched };
  }
  return null;
}
