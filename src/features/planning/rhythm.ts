/**
 * Rhythm — the deterministic half of the planner.
 *
 * You give it the time you want to be up. It gives you back the times
 * that follow from that, and nothing else: when to be asleep, when the
 * last coffee stops being free, when hard training starts costing you
 * the night.
 *
 * Every number here is a published figure with a citation, not a guess
 * dressed as advice. Nothing adapts, nothing learns, nothing is
 * personalised behind your back — the same wake time always produces
 * the same schedule, which is what makes it checkable. Where the
 * evidence is a range, the range is shown rather than averaged into a
 * false precision.
 *
 * SOURCES
 * - Sleep duration: AASM/SRS consensus — adults should sleep 7+ hours,
 *   with 7–9h appropriate for optimal health.
 *   https://aasm.org/advocacy/position-statements/adult-sleep-duration-health-advisory/
 * - Cycle length: sleep cycles run ~90 minutes in adults, so 5 cycles
 *   ≈ 7.5h and 6 ≈ 9h both land inside the recommended band.
 * - Sleep onset latency: 10–20 minutes is normal in healthy adults;
 *   15 is used here as the midpoint. Over 30 is clinically prolonged.
 * - Caffeine: Gardiner et al. 2023, Sleep Medicine Reviews (24-study
 *   meta-analysis) — coffee (107 mg) at least 8.8 h before bed, a
 *   pre-workout dose (217.5 mg) at least 13.2 h.
 *   https://www.sciencedirect.com/science/article/pii/S1087079223000205
 * - Training: high-intensity work ending ≥4 h before sleep shows no
 *   association with sleep changes; 2–4 h is generally fine; sessions
 *   ending ≤1 h before bed can delay onset and shorten sleep.
 *
 * THE HONEST CAVEAT, which the UI repeats: individual caffeine
 * half-life ranges from about 1.5 to 9.5 hours. These are population
 * figures. They are a starting point to test against your own nights,
 * not a prescription.
 */

/** Minutes in one sleep cycle. */
export const SLEEP_CYCLE_MIN = 90;
/** Midpoint of the normal 10–20 min range to fall asleep. */
export const SLEEP_LATENCY_MIN = 15;
/** 5 cycles ≈ 7.5 h, 6 ≈ 9 h — both inside the recommended 7–9 h. */
export const CYCLE_OPTIONS = [6, 5] as const;
/** Hours before bed to stop ordinary coffee (~107 mg). */
export const COFFEE_CUTOFF_H = 8.8;
/** Hours before bed to stop a pre-workout dose (~217 mg). */
export const PREWORKOUT_CUTOFF_H = 13.2;
/** Hours before sleep after which hard training is reliably neutral. */
export const HARD_TRAINING_CLEAR_H = 4;
/** Inside this window before bed, intense work can delay sleep onset. */
export const TRAINING_TOO_LATE_H = 1;

/* ---- minute-of-day arithmetic ------------------------------------ */

/** "07:30" → 450. Returns null for anything unparseable. */
export function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 450 → "07:30". Wraps across midnight so negatives are safe. */
export function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 450 → "7:30 AM". The display form; formatTime stays the data form. */
export function formatClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

/** "7h 30m" from a duration in minutes. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * True when a time has run past midnight into the next calendar day.
 *
 * The rhythm's day runs from the wake time forward, so minutes past
 * 1440 are tomorrow — a 2am bedtime for someone who gets up at 11.
 */
export function isNextDay(minutes: number): boolean {
  return minutes >= 1440;
}

export interface BedtimeOption {
  /** Full 90-minute cycles this option gives. */
  cycles: number;
  /** Minute-of-day to be IN BED (asleep time minus latency). */
  bedMinutes: number;
  /** Minute-of-day sleep would actually begin. */
  asleepMinutes: number;
  /** Total sleep in minutes. */
  sleepMinutes: number;
}

export interface Rhythm {
  wakeMinutes: number;
  /** Longest first — the one worth aiming at leads. */
  bedtimes: BedtimeOption[];
  /** Last ordinary coffee, relative to the LONGEST bedtime option. */
  coffeeCutoffMinutes: number;
  /** Last pre-workout dose. */
  preworkoutCutoffMinutes: number;
  /** Finish hard training by here and it is reliably neutral. */
  trainingClearMinutes: number;
  /** Past here, intense work can push sleep onset back. */
  trainingLateMinutes: number;
}

/**
 * The whole schedule that follows from one wake time.
 *
 * THE DAY RUNS FORWARD FROM WAKING. "Up at 7" means tonight's bedtime,
 * not this morning's — so every time here is measured from the NEXT
 * wake, which is 24 hours after the one given. That keeps everything on
 * one axis: 22:00 is 1320, and a 2am bedtime for an 11am riser comes
 * out as 1560, i.e. past midnight, which `isNextDay` reports and
 * `formatTime` wraps for display.
 *
 * Getting this backwards is easy and silent — the clock strings still
 * look right while every comparison against a same-day time is wrong.
 *
 * Cutoffs are computed against the EARLIEST bedtime on offer (the
 * longest sleep), because a cutoff that only holds if you go to bed
 * late is not a cutoff worth printing.
 */
export function rhythmFor(wakeMinutes: number): Rhythm {
  const nextWake = wakeMinutes + 1440;

  const bedtimes: BedtimeOption[] = CYCLE_OPTIONS.map((cycles) => {
    const sleepMinutes = cycles * SLEEP_CYCLE_MIN;
    const asleepMinutes = nextWake - sleepMinutes;
    return {
      cycles,
      sleepMinutes,
      asleepMinutes,
      bedMinutes: asleepMinutes - SLEEP_LATENCY_MIN,
    };
  });

  // CYCLE_OPTIONS is longest-first, so [0] is the earliest bedtime.
  const anchor = bedtimes[0].asleepMinutes;

  return {
    wakeMinutes,
    bedtimes,
    coffeeCutoffMinutes: anchor - Math.round(COFFEE_CUTOFF_H * 60),
    preworkoutCutoffMinutes: anchor - Math.round(PREWORKOUT_CUTOFF_H * 60),
    trainingClearMinutes: anchor - HARD_TRAINING_CLEAR_H * 60,
    trainingLateMinutes: anchor - TRAINING_TOO_LATE_H * 60,
  };
}

export type TrainingVerdict = "clear" | "close" | "late";

/**
 * How a training time sits against the night.
 *
 * Deliberately three states, not a score. "close" is not a warning —
 * the evidence says 2–4 hours out is fine, and telling someone their
 * 7pm session is a problem when it isn't would be the kind of made-up
 * advice this module exists to avoid.
 */
export function trainingVerdict(trainMinutes: number, rhythm: Rhythm): TrainingVerdict {
  if (trainMinutes <= rhythm.trainingClearMinutes) return "clear";
  if (trainMinutes <= rhythm.trainingLateMinutes) return "close";
  return "late";
}

export const TRAINING_VERDICT_COPY: Record<TrainingVerdict, string> = {
  clear: "Finishes well clear of sleep.",
  close: "Inside four hours of sleep — fine for most people, worth watching.",
  late: "Within an hour of bed. Intense work here can delay sleep onset.",
};

/** True when this minute-of-day is past the last useful coffee. */
export function pastCoffeeCutoff(nowMinutes: number, rhythm: Rhythm): boolean {
  return nowMinutes > rhythm.coffeeCutoffMinutes;
}
