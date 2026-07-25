/**
 * Today hero registry (Stage 3) — the knight scenes that carry the
 * Today background through the day.
 *
 * Each band may hold several scenes; `heroForTime` picks one
 * deterministically per (day, band). Bands with no art of their own
 * fall back to the approved Chrome Rider, so the system is complete
 * and shippable at every point of the asset pipeline.
 *
 * Only the *chosen* scene is ever rendered, so the browser fetches one
 * hero, not the whole set — these imports resolve to URLs, not bytes.
 */
import { bandForDate, variantIndex, type TimeBand } from "../lib/timeOfDay";

import heroWebp from "./assets/backplates/hero_1080x1910.webp";
import heroJpg from "./assets/backplates/hero_1080x1910.jpg";
import heroLqip from "./assets/backplates/hero_lqip.webp";
import dawnWebp from "./assets/backplates/hero_dawn_1080x1910.webp";
import dawnJpg from "./assets/backplates/hero_dawn_1080x1910.jpg";
import dawnLqip from "./assets/backplates/hero_dawn_lqip.webp";
import dayWebp from "./assets/backplates/hero_day_1080x1910.webp";
import dayJpg from "./assets/backplates/hero_day_1080x1910.jpg";
import dayLqip from "./assets/backplates/hero_day_lqip.webp";
import nightWebp from "./assets/backplates/hero_night_1080x1910.webp";
import nightJpg from "./assets/backplates/hero_night_1080x1910.jpg";
import nightLqip from "./assets/backplates/hero_night_lqip.webp";

export interface HeroScene {
  /** Stable id — used by tests and the asset manifests. */
  id: string;
  band: TimeBand;
  webp: string;
  jpg: string;
  lqip: string;
  /** CSS object-position; keeps the figure anchored as the frame crops. */
  objectPosition: string;
}

/** Approved Group 5 Chrome Rider — deep cobalt + warm gold rim light. */
const chromeRider: HeroScene = {
  id: "chrome-rider-dusk",
  band: "dusk",
  webp: heroWebp,
  jpg: heroJpg,
  lqip: heroLqip,
  objectPosition: "center bottom",
};

/** Approved Group 9 — rose-gold sunrise over a cobalt meadow. */
const dawnKnight: HeroScene = {
  id: "knight-dawn",
  band: "dawn",
  webp: dawnWebp,
  jpg: dawnJpg,
  lqip: dawnLqip,
  objectPosition: "center bottom",
};

/** Approved Group 9 — luminous azure, open field, wind-caught cloak. */
const dayKnight: HeroScene = {
  id: "knight-day",
  band: "day",
  webp: dayWebp,
  jpg: dayJpg,
  lqip: dayLqip,
  objectPosition: "center bottom",
};

/** Approved Group 9 — moonlit kneel, dew caustics. Mirrored on export so
 *  the moon clears the top-left, where the date and title sit. */
const nightKnight: HeroScene = {
  id: "knight-night",
  band: "night",
  webp: nightWebp,
  jpg: nightJpg,
  lqip: nightLqip,
  objectPosition: "center bottom",
};

/**
 * Scenes per band. A band with more than one scene rotates
 * deterministically by day; an empty band falls back to the Chrome Rider.
 */
export const HERO_SCENES: Record<TimeBand, HeroScene[]> = {
  dawn: [dawnKnight],
  day: [dayKnight],
  dusk: [chromeRider],
  night: [nightKnight],
};

export const DEFAULT_HERO = chromeRider;

/**
 * The hero for a moment in time. Deterministic: the same date and band
 * always resolve to the same scene, so re-renders never swap the image.
 */
export function heroForTime(date: Date = new Date(), seed = 0): HeroScene {
  const band = bandForDate(date);
  const scenes = HERO_SCENES[band];
  if (scenes.length === 0) return DEFAULT_HERO;
  return scenes[variantIndex(scenes.length, date, seed)];
}
