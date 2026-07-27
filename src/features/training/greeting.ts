/**
 * Today's line (Stage 6) — pure.
 *
 * The greeting used to be three fixed strings, so the app said the same
 * thing every single morning. This picks from a library that reacts to
 * the actual state — time of day, streak, whether today is scheduled,
 * whether it is already done — and rotates deterministically per day, so
 * it changes as you open the app across days but never flickers within
 * one.
 *
 * Tone rules, same as Forge: direct, calm, never shaming, never hype.
 */
import { hashIndex } from "../../lib/hash";
import { bandForDate, type TimeBand } from "../../lib/timeOfDay";

export interface GreetingInput {
  hasSplit: boolean;
  isTrainingDay: boolean;
  /** Today's scheduled day is already recorded. */
  doneToday: boolean;
  streak: number;
  keptCount: number;
  /** Device-local YYYY-MM-DD, for the daily rotation. */
  localDate: string;
  band: TimeBand;
}

const NO_SPLIT = ["Begin.", "Start here.", "First, the plan.", "Nothing loaded yet."];

const DONE = [
  "Kept.",
  "That's today.",
  "Done, and recorded.",
  "On the record.",
  "Today holds.",
];

const REST = [
  "Rest, honored.",
  "Recovery counts.",
  "Nothing owed today.",
  "A quiet day.",
  "Rest is the work too.",
];

/** Training days, split by time of day so morning ≠ late night. */
const TRAINING: Record<TimeBand, string[]> = {
  dawn: ["An early start.", "First light, first set.", "A training day.", "Begin while it's quiet."],
  day: ["A training day.", "There's work today.", "Today has a session.", "Time to move."],
  dusk: ["Still time today.", "A training day.", "The day isn't done.", "Evening work."],
  night: ["Late, but open.", "A training day.", "Still yours if you want it.", "There's time."],
};

/** Replaces the generic line when a run is genuinely going. */
const STREAK = [
  "{n} in a row.",
  "{n} kept, back to back.",
  "The run stands at {n}.",
];

export function greetingFor(input: GreetingInput): string {
  const seed = `${input.localDate}|${input.band}|${input.isTrainingDay}|${input.doneToday}`;

  if (!input.hasSplit) return pick(NO_SPLIT, seed);
  if (input.doneToday) {
    // A real run is worth naming; otherwise just acknowledge the day.
    if (input.streak >= 3 && hashIndex(`${seed}|s`, 2) === 0) {
      return pick(STREAK, seed).replace("{n}", String(input.streak));
    }
    return pick(DONE, seed);
  }
  if (!input.isTrainingDay) return pick(REST, seed);
  return pick(TRAINING[input.band], seed);
}

function pick(list: readonly string[], seed: string): string {
  return list[hashIndex(seed, list.length)];
}

/** A second, smaller line — context rather than mood. */
export function subtitleFor(input: GreetingInput): string | null {
  if (!input.hasSplit) return null;
  if (input.doneToday && input.streak > 1) return `${input.streak} kept in a row.`;
  if (input.keptCount === 0) return "Your first kept session marks the crest.";
  if (!input.isTrainingDay && input.keptCount > 0) return `${input.keptCount} kept so far.`;
  return null;
}

export function bandFor(date = new Date()): TimeBand {
  return bandForDate(date);
}
