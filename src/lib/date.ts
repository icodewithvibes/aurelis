/**
 * Local-day helpers (Stage 2). All day logic uses the DEVICE-LOCAL
 * calendar day as YYYY-MM-DD (02_strategy/04). Centralized so DST /
 * timezone is handled in one place.
 */

export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 0=Sun..6=Sat for the device-local date. */
export function localWeekday(d: Date = new Date()): number {
  return d.getDay();
}

export function nowMs(): number {
  return Date.now();
}

/** Parse a YYYY-MM-DD local day back into a local-midnight Date. */
export function parseLocalDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, delta: number): string {
  const d = parseLocalDay(day);
  d.setDate(d.getDate() + delta);
  return localDay(d);
}

/** Every local day from `from` to `to`, inclusive. Empty if from > to. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The Sunday-anchored calendar week containing `day`, as seven days. */
export function weekOf(day: string): string[] {
  const start = addDays(day, -parseLocalDay(day).getDay());
  return daysBetween(start, addDays(start, 6));
}
