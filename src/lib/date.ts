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
