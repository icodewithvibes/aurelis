/**
 * Topic lexicon (Stage 4) — what the note is ABOUT.
 *
 * This layer sits strictly BELOW safety. `safetyScreen` runs first and
 * always wins; nothing here can promote a note out of gentle mode, and
 * none of these phrases widen crisis matching. Topics only decide which
 * ordinary, encouraging response family to use.
 *
 * Matching is the same as safety: normalised, word-boundary aware. There
 * is no negation handling here on purpose — a cancelled topic simply
 * falls through to the next one or to the user's chosen state, which is
 * harmless, whereas the safety layer's narrow negation rule is load
 * bearing and stays where it is.
 */

export type TopicKey =
  | "recovery_guilt"
  | "missed_session"
  | "self_criticism"
  | "bad_workout"
  | "sleep_strain"
  | "pre_task_anxiety"
  | "overwhelmed"
  | "training_doubt"
  | "fear_of_starting"
  | "avoidance"
  | "decision_fatigue"
  | "stuck"
  | "low_motivation"
  | "small_next_action"
  | "reflection";

/**
 * Deterministic priority. When several topics match the SAME note, the
 * one earliest in this list wins — no scoring, no randomness, no
 * dependence on note order. The ordering runs from the most specific
 * situation to the most general feeling, so a concrete circumstance is
 * never swallowed by a vague one:
 *
 *   situations (guilt about rest, a missed day, a bad session, sleep)
 *   → sharp feelings (self-criticism, anxiety, overwhelm)
 *   → doubts and blocks (training doubt, fear, avoidance, decisions)
 *   → diffuse states (stuck, low motivation)
 *   → requests and reflection (the catch-alls, last)
 */
export const TOPIC_PRIORITY: TopicKey[] = [
  "recovery_guilt",
  "missed_session",
  "self_criticism",
  "bad_workout",
  "sleep_strain",
  "pre_task_anxiety",
  "overwhelmed",
  "training_doubt",
  "fear_of_starting",
  "avoidance",
  "decision_fatigue",
  "stuck",
  "low_motivation",
  "small_next_action",
  "reflection",
];

export const TOPIC_LEXICON: Record<TopicKey, string[]> = {
  recovery_guilt: [
    "feel guilty for resting",
    "guilty about resting",
    "guilty for taking a rest day",
    "guilty taking a day off",
    "feel lazy for resting",
    "lazy for taking a rest day",
    "should be training instead of resting",
    "bad about taking a rest day",
    "rest day guilt",
    "feel bad for resting",
  ],

  missed_session: [
    "missed my workout",
    "missed the workout",
    "missed my session",
    "missed training",
    "skipped my workout",
    "skipped the gym",
    "skipped training",
    "didnt train yesterday",
    "did not train yesterday",
    "havent trained all week",
    "missed two days",
    "missed a few days",
    "broke my streak",
    "lost my streak",
  ],

  self_criticism: [
    "i suck",
    "im useless",
    "im pathetic",
    "im so weak",
    "im a failure",
    "im failing",
    "hate myself for",
    "im disappointed in myself",
    "let myself down",
    "im not good enough",
    "im so bad at this",
    "beating myself up",
    "im embarrassed",
  ],

  bad_workout: [
    "terrible workout",
    "awful workout",
    "bad session",
    "bad workout",
    "worst session",
    "everything felt heavy",
    "felt weaker than",
    "couldnt hit my numbers",
    "missed all my reps",
    "session fell apart",
    "had to cut it short",
    "form fell apart",
  ],

  sleep_strain: [
    "slept badly",
    "bad sleep",
    "poor sleep",
    "only got four hours",
    "only got five hours",
    "up all night",
    "restless night",
    "sleep has been rough",
    "not recovering",
    "still sore from",
    "body feels beat up",
    "run down",
  ],

  pre_task_anxiety: [
    "nervous about",
    "anxious about",
    "scared about the",
    "big meeting",
    "presentation tomorrow",
    "exam tomorrow",
    "interview tomorrow",
    "test tomorrow",
    "deadline tomorrow",
    "have to present",
    "dreading tomorrow",
  ],

  overwhelmed: [
    "too much going on",
    "so much to do",
    "everything at once",
    "cant keep up",
    "drowning in",
    "spread too thin",
    "my plate is full",
    "overloaded",
    "overwhelmed",
    "too many things",
  ],

  training_doubt: [
    "is this even working",
    "isnt working",
    "not seeing progress",
    "no progress",
    "not getting stronger",
    "wasting my time",
    "should i change my program",
    "is my split right",
    "am i doing this right",
    "plateau",
    "plateaued",
    "stuck at the same weight",
  ],

  fear_of_starting: [
    "scared to start",
    "afraid to start",
    "afraid to begin",
    "dont know where to start",
    "do not know where to start",
    "nervous to start",
    "intimidated",
    "everyone is watching",
    "feel out of place",
    "first day back",
    "what if i fail",
  ],

  avoidance: [
    "keep putting it off",
    "putting it off",
    "procrastinating",
    "procrastinate",
    "keep delaying",
    "keep avoiding",
    "finding excuses",
    "keep scrolling",
    "one more episode",
    "ill do it later",
    "i will do it later",
    "been meaning to",
  ],

  decision_fatigue: [
    "cant decide",
    "can not decide",
    "too many choices",
    "dont know what to do first",
    "do not know what to do first",
    "keep changing my mind",
    "overthinking the plan",
    "which one should i",
    "too many options",
    "decision",
  ],

  stuck: [
    "feel stuck",
    "im stuck",
    "going nowhere",
    "spinning my wheels",
    "same place",
    "no momentum",
    "treading water",
    "stalled",
  ],

  low_motivation: [
    "no motivation",
    "cant be bothered",
    "dont feel like it",
    "do not feel like it",
    "no desire",
    "unmotivated",
    "lost interest",
    "hard to care",
    "dont want to",
  ],

  small_next_action: [
    "just tell me what to do",
    "what should i do",
    "one thing",
    "give me a step",
    "next step",
    "where do i start",
    "smallest thing",
    "just need a push",
  ],

  reflection: [
    "thinking about",
    "been reflecting",
    "just writing",
    "setting this down",
    "getting this out",
    "no idea why",
    "wanted to note",
    "checking in",
  ],
};
