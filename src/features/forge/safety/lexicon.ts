/**
 * Safety lexicon (02_strategy/02 §4) — curated phrases per category.
 *
 * This is NOT a clinical detector. It is a caring guardrail: a match
 * only ever softens the response (gentle mode, no task, no time box).
 * A false positive costs a kind message; a false negative costs far
 * more, so the lists lean deliberately toward catching too much.
 *
 * Negation is handled narrowly and ON PURPOSE. Only short symptom words
 * may be cancelled by a preceding negator ("not suicidal", "no pain").
 * Multi-word phrases that already carry their own negation — "don't
 * want to be here", "can't go on" — must NEVER be cancellable, or the
 * negation rule would silence the most serious inputs.
 */
import type { SafetyCategory } from "../types";

export interface SafetyPhrase {
  phrase: string;
  /** Only true for short symptom words a person plainly negates. */
  negatable?: boolean;
}

const p = (phrase: string, negatable = false): SafetyPhrase => ({ phrase, negatable });

export const SAFETY_LEXICON: Record<SafetyCategory, SafetyPhrase[]> = {
  /** 1. Self-harm, suicidal ideation, hopelessness as crisis. */
  crisis: [
    p("suicidal", true),
    p("suicide", true),
    p("kill myself"),
    p("killing myself"),
    p("end my life"),
    p("ending my life"),
    p("take my own life"),
    p("want to die"),
    p("wanna die"),
    p("wish i was dead"),
    p("wish i were dead"),
    p("better off dead"),
    p("better off without me"),
    p("dont want to be here anymore"),
    p("do not want to be here anymore"),
    p("dont want to exist"),
    p("no reason to live"),
    p("nothing to live for"),
    p("no point in living"),
    p("cant go on"),
    p("can not go on"),
    p("cant do this anymore"),
    p("hurt myself"),
    p("hurting myself"),
    p("harm myself"),
    p("self harm"),
    p("cut myself"),
    p("cutting myself"),
    p("end it all"),
    p("want it all to stop"),
    p("everyone would be better off"),
  ],

  /** 2. Injury / acute pain. */
  injury: [
    p("injured", true),
    p("injury", true),
    p("pain", true),
    p("sharp pain"),
    p("shooting pain"),
    p("stabbing pain"),
    p("pulled a muscle"),
    p("tore my"),
    p("torn"),
    p("sprained"),
    p("sprain"),
    p("strained my"),
    p("my back went"),
    p("back gave out"),
    p("knee gave out"),
    p("gave out on me"),
    p("hurts to move"),
    p("hurts when i"),
    p("cant lift my"),
    p("cant move my"),
    p("swollen"),
    p("dislocated"),
    p("fracture"),
    p("fractured"),
    p("broken bone"),
    p("herniated"),
    p("pinched nerve"),
    p("something popped"),
  ],

  /** 3. Severe exhaustion / illness / not eating / not sleeping. */
  exhaustion: [
    p("exhausted", true),
    p("dizzy", true),
    p("nauseous", true),
    p("havent slept"),
    p("have not slept"),
    p("no sleep"),
    p("cant sleep"),
    p("barely slept"),
    p("havent eaten"),
    p("have not eaten"),
    p("not eating"),
    p("skipping meals"),
    p("starving myself"),
    p("burnt out"),
    p("burned out"),
    p("running on empty"),
    p("fever"),
    p("the flu"),
    p("throwing up"),
    p("vomiting"),
    p("lightheaded"),
    p("light headed"),
    p("dehydrated"),
    p("overtrained"),
    p("overtraining"),
    p("can barely stand"),
    p("body is shutting down"),
  ],

  /** 4. Crisis in life — grief, panic, acute distress. */
  life_crisis: [
    p("panic attack"),
    p("panicking"),
    p("passed away"),
    p("death in the family"),
    p("funeral"),
    p("grieving"),
    p("grief"),
    p("falling apart"),
    p("breaking down"),
    p("having a breakdown"),
    p("cant stop crying"),
    p("crying all day"),
    p("lost my job"),
    p("got fired"),
    p("evicted"),
    p("going through a divorce"),
  ],
};

/** Words that cancel a following negatable symptom word. */
export const NEGATORS = [
  "not",
  "no",
  "never",
  "isnt",
  "arent",
  "wasnt",
  "dont",
  "doesnt",
  "didnt",
  "without",
  "zero",
];

/** How many words before a match are scanned for a negator. */
export const NEGATION_WINDOW = 3;

/** Category priority — the most serious wins when several match. */
export const CATEGORY_PRIORITY: SafetyCategory[] = [
  "crisis",
  "injury",
  "exhaustion",
  "life_crisis",
];
