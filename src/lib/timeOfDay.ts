/**
 * Time-of-day bands (Stage 3). Drives the Today hero, which changes
 * through the day: dawn → day → dusk → night.
 *
 * Pure and device-local. Selection is deterministic per (day, band) so
 * the hero never flickers between re-renders, yet still varies across
 * days when a band holds more than one scene.
 */

import { hashIndex } from "./hash";

export type TimeBand = "dawn" | "day" | "dusk" | "night";

export const TIME_BANDS: readonly TimeBand[] = ["dawn", "day", "dusk", "night"] as const;

/** Band boundaries (device-local hour, 24h): 05–09 · 09–17 · 17–21 · 21–05. */
export function bandForHour(hour: number): TimeBand {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h >= 5 && h < 9) return "dawn";
  if (h >= 9 && h < 17) return "day";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
}

export function bandForDate(d: Date = new Date()): TimeBand {
  return bandForHour(d.getHours());
}

/** Milliseconds until the current band ends — lets the UI re-band itself without polling hard. */
export function msUntilNextBand(d: Date = new Date()): number {
  const starts = [5, 9, 17, 21];
  const h = d.getHours();
  const next = starts.find((s) => s > h) ?? 24 + starts[0];
  const boundary = new Date(d);
  boundary.setHours(next, 0, 0, 0);
  return boundary.getTime() - d.getTime();
}

/**
 * Deterministic index into a band's scene list. Same day + band + seed
 * always yields the same scene; different days rotate through variants.
 */
export function variantIndex(count: number, date: Date = new Date(), seed = 0): number {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}|${bandForDate(date)}|${seed}`;
  return hashIndex(key, count);
}
