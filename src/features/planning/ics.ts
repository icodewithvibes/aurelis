/**
 * Calendar export — the honest answer to "can we have a widget?".
 *
 * We cannot. A Progressive Web App cannot create an iOS Home Screen or
 * Lock Screen widget; WidgetKit is a native extension, Swift only, and
 * there is no web API for it on any OS. That is still true on iOS 26.
 * Scheduled local notifications do not exist in the web platform
 * either — the Notifications API can only fire immediately, and Web
 * Push, which does reach a closed iOS web app, needs a SERVER to send
 * it. AURELIS has no server on purpose.
 *
 * So instead of faking it, this feeds the widget iOS already ships.
 *
 * Export the plan as a .ics file, open it, and iOS puts the items in
 * Calendar. From there the user gets, for free and with no backend:
 *   - real alerts at the right time, with the app closed;
 *   - the Calendar Lock Screen and StandBy widgets, which show exactly
 *     what this feature wanted to show — what is next, and when;
 *   - the same items on every device signed into their iCloud.
 *
 * It is a one-time import of a file the device already has, so nothing
 * is uploaded and the local-only rule holds. The tradeoff is honest and
 * stated in the UI: exported events are a snapshot. Change the plan and
 * you export again.
 *
 * Format: RFC 5545. Kept deliberately minimal and hand-written — the
 * spec's fussy parts here are line endings (CRLF), escaping, and the
 * 75-octet fold, all of which are handled below.
 */
import type { PlanItemRow } from "../../data/db";
import { itemsForDay } from "./plan";

/** Minutes before an event that the alarm fires. */
const ALARM_LEAD_MIN = 10;
/** Length used for an item that never said how long it would take. */
const DEFAULT_EVENT_MIN = 30;
/** An untimed item becomes an all-day event rather than a fake 9am. */
const ALL_DAY = null;

/** RFC 5545 §3.3.11 — escape the four characters that carry meaning. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * RFC 5545 §3.1 — no line may exceed 75 octets; longer ones continue
 * on the next line beginning with a single space. Counted in UTF-8
 * bytes, not characters, or a title with an em dash can break a parser.
 */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    // 74 leaves room for the leading space on continuation lines.
    if (currentBytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = "";
      currentBytes = 0;
    }
    current += ch;
    currentBytes += size;
  }
  if (current) out.push(current);
  return out.map((l, i) => (i === 0 ? l : ` ${l}`)).join("\r\n");
}

/** "2026-07-29" → "20260729" */
function icsDate(dateLocal: string): string {
  return dateLocal.replace(/-/g, "");
}

/**
 * Local floating time: "20260729T190000".
 *
 * Deliberately WITHOUT a timezone or trailing Z. A floating time means
 * "7pm wherever you are", which is what a plan actually means — an
 * intention to train at 7 should not become 2pm because you flew
 * somewhere.
 */
function icsLocalDateTime(dateLocal: string, minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${icsDate(dateLocal)}T${h}${m}00`;
}

/** UTC stamp for DTSTAMP, which the spec does require to be absolute. */
function icsStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** The next day, for an all-day event's exclusive DTEND. */
function nextDay(dateLocal: string): string {
  const d = new Date(`${dateLocal}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function eventFor(item: PlanItemRow, now: number): string[] {
  const lines: string[] = ["BEGIN:VEVENT"];
  // Stable across exports, so re-importing updates rather than duplicates.
  lines.push(`UID:${item.id}@aurelis.local`);
  lines.push(`DTSTAMP:${icsStamp(now)}`);

  if (item.atMinutes === ALL_DAY) {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(item.dateLocal)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDate(nextDay(item.dateLocal))}`);
  } else {
    const end = item.atMinutes + (item.estMinutes ?? DEFAULT_EVENT_MIN);
    lines.push(`DTSTART:${icsLocalDateTime(item.dateLocal, item.atMinutes)}`);
    // Clamp inside the day; an event crossing midnight is never what
    // "20 minutes at 11:55pm" was meant to express.
    lines.push(`DTEND:${icsLocalDateTime(item.dateLocal, Math.min(end, 23 * 60 + 59))}`);
  }

  lines.push(`SUMMARY:${escapeText(item.title)}`);
  if (item.note) lines.push(`DESCRIPTION:${escapeText(item.note)}`);
  lines.push(`CATEGORIES:${escapeText(item.kind.toUpperCase())}`);

  /*
   * Calendar clients are noticeably more willing to treat an event as
   * real — and to honour its alarm — when it says so explicitly. These
   * three are cheap and standard, and their absence is a known cause of
   * imported events being filed as tentative and silent.
   */
  lines.push("SEQUENCE:0");
  lines.push("STATUS:CONFIRMED");
  lines.push("TRANSP:OPAQUE");

  // The alarm is the point of the whole export — this is what makes the
  // phone speak up with the app closed.
  if (item.atMinutes !== ALL_DAY) {
    /*
     * TWO alarms, deliberately. Some clients quietly drop a negative
     * relative TRIGGER on import while keeping a zero one, so a lead
     * alarm alone can vanish without any error. `RELATED=START` is the
     * default, but stating it removes the other common reason a trigger
     * gets ignored.
     */
    for (const trigger of [`-PT${ALARM_LEAD_MIN}M`, "PT0S"]) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${escapeText(item.title)}`);
      lines.push(`TRIGGER;RELATED=START:${trigger}`);
      lines.push("END:VALARM");
    }
  }

  lines.push("END:VEVENT");
  return lines;
}

/**
 * A calendar of every open item from `today` forward.
 *
 * Done and dropped items are left out: this is a plan, not a log, and
 * the timeline in Proof is where the record lives.
 */
export function buildCalendar(
  items: readonly PlanItemRow[],
  today: string,
  days = 14,
  now = Date.now(),
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AURELIS//Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:AURELIS Plan",
  ];

  const horizon = new Date(`${today}T00:00:00`);
  horizon.setDate(horizon.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  const lastDay = `${horizon.getFullYear()}-${p(horizon.getMonth() + 1)}-${p(horizon.getDate())}`;

  const dates = [
    ...new Set(
      items
        .filter((i) => !i.deletedAt && i.status === "open")
        .map((i) => i.dateLocal)
        .filter((d) => d >= today && d < lastDay),
    ),
  ].sort();

  for (const date of dates) {
    for (const item of itemsForDay(items, date)) {
      if (item.status !== "open") continue;
      lines.push(...eventFor(item, now));
    }
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** How many events an export would actually contain. */
export function calendarEventCount(
  items: readonly PlanItemRow[],
  today: string,
  days = 14,
): number {
  return (buildCalendar(items, today, days).match(/BEGIN:VEVENT/g) ?? []).length;
}

export const CALENDAR_FILENAME = "aurelis-plan.ics";
