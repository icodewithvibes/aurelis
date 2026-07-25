/**
 * Topic template families (Stage 4) — fifteen deterministic response
 * families, three variants each, selected by the same hash the seven
 * states use. No randomness.
 *
 * Voice is unchanged and enforced by tests: direct, calm, firm, concise,
 * action-oriented. Acknowledgment ≤ 12 words, reframe ≤ 24, action ≤ 16.
 * Never shame, never diagnose, never "crush / grind / no excuses", never
 * push through injury or exhaustion.
 */
import type { TemplateFamily } from "../templates";
import type { TopicKey } from "./lexicon";

export const TOPIC_TEMPLATES: Record<TopicKey, TemplateFamily> = {
  recovery_guilt: {
    acknowledgment: "Resting felt like slacking. It wasn't.",
    reframe: "Recovery is where the work sets. Taking it on purpose is part of the plan, not a break from it.",
    tone: "gentle",
    actions: [
      { text: "Mark today recovery honored and leave it there.", estMinutes: 1 },
      { text: "Take an easy ten-minute walk, nothing more.", estMinutes: 10 },
      { text: "Write down tomorrow's session, then stop for today.", estMinutes: 3 },
    ],
  },

  missed_session: {
    acknowledgment: "You missed one. The plan still stands.",
    reframe: "A missed day is a gap, not a verdict. The next session is the only one that decides anything.",
    tone: "steady",
    actions: [
      { text: "Open your next scheduled day and read the first exercise.", estMinutes: 2 },
      { text: "Do the first exercise of the missed day, one set.", estMinutes: 5 },
      { text: "Put the next session in your calendar now.", estMinutes: 2 },
    ],
  },

  self_criticism: {
    acknowledgment: "You're talking to yourself like an enemy.",
    reframe: "You would not coach anyone else this way. Judge the next action, not your worth.",
    tone: "gentle",
    actions: [
      { text: "Write one sentence about what you actually did today.", estMinutes: 3 },
      { text: "Name the next small action and start it.", estMinutes: 5 },
      { text: "Set the note down and take five slow breaths.", estMinutes: 2 },
    ],
  },

  bad_workout: {
    acknowledgment: "That session did not go your way.",
    reframe: "One rough session is data, not decline. Showing up on a bad day is the harder skill.",
    tone: "steady",
    actions: [
      { text: "Log what you did honestly, including the misses.", estMinutes: 3 },
      { text: "Note one thing to change next time, then close it.", estMinutes: 2 },
      { text: "Eat something and get to bed on time tonight.", estMinutes: 5 },
    ],
  },

  sleep_strain: {
    acknowledgment: "You're running on short sleep.",
    reframe: "Training hard on an empty tank borrows from tomorrow. Today can be lighter and still count.",
    tone: "gentle",
    actions: [
      { text: "Cut today's session in half and keep the first exercise.", estMinutes: 15 },
      { text: "Swap today for an easy walk and an early night.", estMinutes: 15 },
      { text: "Drink water, eat properly, and reassess in an hour.", estMinutes: 10 },
    ],
  },

  pre_task_anxiety: {
    acknowledgment: "Something big is coming and your body knows.",
    reframe: "Nerves are readiness without a job yet. Give them one concrete thing to do.",
    tone: "gentle",
    actions: [
      { text: "Prepare the first two minutes of it out loud.", estMinutes: 5 },
      { text: "Write the opening line you will actually say.", estMinutes: 5 },
      { text: "Lay out everything you need, then stop preparing.", estMinutes: 10 },
    ],
  },

  overwhelmed: {
    acknowledgment: "Too many things are pulling at once.",
    reframe: "You can't carry it all at the same time. Order beats volume, and one item beats a list.",
    tone: "gentle",
    actions: [
      { text: "Write every task down, then circle exactly one.", estMinutes: 5 },
      { text: "Pick the one with the nearest deadline and start it.", estMinutes: 10 },
      { text: "Do the two-minute task first to clear the noise.", estMinutes: 2 },
    ],
  },

  training_doubt: {
    acknowledgment: "You're not sure this is working.",
    reframe: "Progress is slower than attention. Look at your own record before you change the plan.",
    tone: "steady",
    actions: [
      { text: "Open Proof and compare this month to last.", estMinutes: 3 },
      { text: "Keep the plan and add five pounds to one lift.", estMinutes: 2 },
      { text: "Log four more sessions before deciding anything.", estMinutes: 2 },
    ],
  },

  fear_of_starting: {
    acknowledgment: "Starting is the part that feels expensive.",
    reframe: "Nobody is grading the first attempt. Beginning badly still beats not beginning.",
    tone: "gentle",
    actions: [
      { text: "Do the easiest exercise on the list, one set.", estMinutes: 5 },
      { text: "Show up, warm up, and allow yourself to leave.", estMinutes: 10 },
      { text: "Set out your clothes and shoes for tomorrow.", estMinutes: 3 },
    ],
  },

  avoidance: {
    acknowledgment: "You keep moving it to later.",
    reframe: "Later is where this has been living. Two minutes of the real thing changes its address.",
    tone: "steady",
    actions: [
      { text: "Start a two-minute timer and begin the real task.", estMinutes: 2 },
      { text: "Put the phone in another room, then start.", estMinutes: 3 },
      { text: "Do the very first physical step, nothing after it.", estMinutes: 3 },
    ],
  },

  decision_fatigue: {
    acknowledgment: "You're spending on choosing, not doing.",
    reframe: "Most options here are close enough. The cost of deciding has passed the cost of picking wrong.",
    tone: "steady",
    actions: [
      { text: "Pick the first option and commit for today only.", estMinutes: 2 },
      { text: "Set a two-minute limit, then take whatever leads.", estMinutes: 2 },
      { text: "Do the option already written in your plan.", estMinutes: 3 },
    ],
  },

  stuck: {
    acknowledgment: "Nothing is moving and you can feel it.",
    reframe: "Stuck usually means the next step is too large. Shrink it until it's almost trivial.",
    tone: "steady",
    actions: [
      { text: "Name the smallest version of the next step, then do it.", estMinutes: 5 },
      { text: "Change your location and start one thing there.", estMinutes: 10 },
      { text: "Do five minutes of anything on the list.", estMinutes: 5 },
    ],
  },

  low_motivation: {
    acknowledgment: "The wanting isn't there today.",
    reframe: "Motivation follows movement more often than it leads. Start small and let it catch up.",
    tone: "steady",
    actions: [
      { text: "Commit to five minutes, then decide again.", estMinutes: 5 },
      { text: "Do the first set only. Stop there if you want.", estMinutes: 5 },
      { text: "Put on your shoes and walk out the door.", estMinutes: 3 },
    ],
  },

  small_next_action: {
    acknowledgment: "You want one thing, not a plan.",
    reframe: "Good. One clear action is the whole point, and the rest can wait until it's done.",
    tone: "steady",
    actions: [
      { text: "Do the first exercise on today's list, one set.", estMinutes: 5 },
      { text: "Set a five-minute timer and start the easiest part.", estMinutes: 5 },
      { text: "Write the next step on one line, then begin it.", estMinutes: 2 },
    ],
  },

  reflection: {
    acknowledgment: "You wanted to set something down.",
    reframe: "Writing it is enough on its own. If a next step appears, take the smallest one.",
    tone: "gentle",
    actions: [
      { text: "Finish the thought in one more sentence, then stop.", estMinutes: 3 },
      { text: "Name one thing that went well today.", estMinutes: 2 },
      { text: "Pick one small thing and do it now.", estMinutes: 5 },
    ],
  },
};
