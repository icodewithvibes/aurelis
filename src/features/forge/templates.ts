/**
 * Forge template library (02_strategy/02 §1, §2, §4).
 *
 * Seven states, each a family of three variants so repeat use doesn't
 * feel robotic. Acknowledgment and reframe are the spec's copy verbatim
 * and stay fixed per state; the variants differ in the single action
 * and its time box — the pattern the spec itself demonstrates.
 *
 * Voice: direct, calm, firm, concise, action-oriented. Short sentences,
 * second person, exactly one doable thing. Never shame, never a named
 * person's voice, never a diagnosis, never training through injury.
 * Length budget (12 / 24 / 16 words) is enforced by tests.
 */
import type { ForgeStateKey, SafetyCategory } from "./types";

export interface ForgeAction {
  text: string;
  estMinutes: number;
}

export interface TemplateFamily {
  acknowledgment: string;
  reframe: string;
  tone: "steady" | "gentle";
  /** Exactly three; selected deterministically, never at random. */
  actions: [ForgeAction, ForgeAction, ForgeAction];
}

export const TEMPLATES: Record<ForgeStateKey, TemplateFamily> = {
  overthinking: {
    acknowledgment: "Your head is running ahead of you.",
    reframe:
      "You don't need the whole plan — only the next move. Thinking stops when doing starts.",
    tone: "steady",
    actions: [
      { text: "Do one set of the first exercise. Just one.", estMinutes: 3 },
      { text: "Write the single next step on one line, then start it.", estMinutes: 2 },
      { text: "Set a 5-minute timer and begin the easiest part.", estMinutes: 5 },
    ],
  },

  low_energy: {
    acknowledgment: "Low battery today. Noted.",
    reframe: "You're not aiming for your best session. You're aiming to start and see.",
    tone: "steady",
    actions: [
      { text: "Do a 5-minute easy warm-up, then reassess.", estMinutes: 5 },
      { text: "Do the first exercise at half your usual weight.", estMinutes: 4 },
      { text: "Walk for five minutes, then decide whether to train.", estMinutes: 5 },
    ],
  },

  avoiding_training: {
    acknowledgment: "You're circling the workout, not doing it.",
    reframe: "The gap between avoiding and starting is one small action. Close it once.",
    tone: "steady",
    actions: [
      { text: "Put on your training clothes and set out your first weight.", estMinutes: 4 },
      { text: "Pack your bag and walk to the door.", estMinutes: 3 },
      { text: "Do one warm-up set, then choose again.", estMinutes: 3 },
    ],
  },

  avoiding_work: {
    acknowledgment: "The task is sitting there, and so are you.",
    reframe: "You don't have to finish it. You have to open it and touch the first piece.",
    tone: "steady",
    actions: [
      { text: "Open the task and work only the first 10 minutes.", estMinutes: 10 },
      { text: "Write one honest sentence into the task, then stop.", estMinutes: 5 },
      { text: "Set a 10-minute timer and touch the first piece.", estMinutes: 10 },
    ],
  },

  want_to_quit: {
    acknowledgment: "You're at the edge and it feels like enough.",
    reframe: "Quitting the day isn't quitting forever. Do one honest rep, then decide.",
    tone: "steady",
    actions: [
      { text: "Do a single minimum rep of the thing, then choose again.", estMinutes: 3 },
      { text: "Give it two more minutes, then decide honestly.", estMinutes: 2 },
      { text: "Finish the set you're in. Stop there if you need to.", estMinutes: 5 },
    ],
  },

  need_recovery: {
    acknowledgment: "Your body is asking for rest. That's information.",
    reframe:
      "Recovery is part of the work, not the opposite of it. Honoring it protects the streak.",
    tone: "gentle",
    actions: [
      { text: "Mark today recovery honored and take an easy 5-minute walk.", estMinutes: 5 },
      { text: "Mark today recovery honored and set the session down.", estMinutes: 2 },
      { text: "Do five minutes of easy mobility, then sleep earlier tonight.", estMinutes: 5 },
    ],
  },

  need_reset: {
    acknowledgment: "The day got away from you. It can turn now.",
    reframe: "You don't restart the week. You restart the next hour.",
    tone: "gentle",
    actions: [
      { text: "Pick one small win, do it in the next 15 minutes.", estMinutes: 15 },
      { text: "Clear one surface, then start the next honest thing.", estMinutes: 10 },
      { text: "Name the next hour's single task and begin it.", estMinutes: 15 },
    ],
  },
};

/**
 * Safety-mode copy (§4, §5). No task, no time box, no Next-rep
 * pressure — the action is deliberately empty and estMinutes is 0.
 * The surface pairs these with the configured crisis resource line.
 */
export const SAFETY_TEMPLATES: Record<
  SafetyCategory,
  { acknowledgment: string; reframe: string }
> = {
  crisis: {
    acknowledgment: "I'm glad you wrote that down.",
    reframe:
      "This is bigger than a workout, and you don't have to handle it alone. Reaching out is the strong move here.",
  },
  injury: {
    acknowledgment: "Something in your body is telling you to stop.",
    reframe:
      "Pain during movement is a stop signal, not something to push through. Set the session down.",
  },
  exhaustion: {
    acknowledgment: "Your body isn't a problem to override today.",
    reframe:
      "Rest, food, water and sleep are the work right now. You don't have to earn rest.",
  },
  life_crisis: {
    acknowledgment: "That's a lot to be carrying.",
    reframe:
      "You don't need to perform through this. One real person is worth more than any session today.",
  },
};
