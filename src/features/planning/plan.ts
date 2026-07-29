/**
 * The planner — what you intend to do, and when, across the days ahead.
 *
 * The whole design follows from one admission: you will not do
 * everything you planned yesterday. Most planners treat that as
 * failure and quietly delete the evidence, or leave a red overdue badge
 * shouting at you forever. Both are lies about how a week actually
 * goes.
 *
 * So an item that did not happen does not vanish and is not scolded.
 * It becomes CARRIED — still real, still yours, offered back with one
 * tap to move it to today. You decide whether it still matters. If it
 * does not, drop it, and dropping it is a legitimate outcome rather
 * than a failure state.
 *
 * Times are intentions, not appointments. "Around 7pm" is what people
 * actually mean, so an item may have no time at all, and a timed item
 * is never treated as late — only as next, now, or done.
 *
 * Pure module: no Dexie, no clock of its own. Everything takes `now`
 * so it can be tested at any moment of any day.
 */
import type { PlanItemRow } from "../../data/db";
import { formatClock } from "./rhythm";

export type PlanKind = "training" | "forge" | "life" | "recovery";
export type PlanStatus = "open" | "done" | "dropped";

export const PLAN_KINDS: { key: PlanKind; label: string }[] = [
  { key: "training", label: "Training" },
  { key: "forge", label: "Forge" },
  { key: "life", label: "Life" },
  { key: "recovery", label: "Recovery" },
];

export function planKindLabel(kind: PlanKind): string {
  return PLAN_KINDS.find((k) => k.key === kind)?.label ?? "Life";
}

const live = (rows: readonly PlanItemRow[]) => rows.filter((r) => !r.deletedAt);

/** Sort: timed items in clock order first, untimed after, then by creation. */
export function sortItems(items: readonly PlanItemRow[]): PlanItemRow[] {
  return [...items].sort((a, b) => {
    if (a.atMinutes == null && b.atMinutes == null) return a.createdAt - b.createdAt;
    if (a.atMinutes == null) return 1;
    if (b.atMinutes == null) return -1;
    return a.atMinutes - b.atMinutes || a.createdAt - b.createdAt;
  });
}

export function itemsForDay(items: readonly PlanItemRow[], date: string): PlanItemRow[] {
  return sortItems(live(items).filter((i) => i.dateLocal === date));
}

/**
 * Items still open on a day already past.
 *
 * Newest first: what you meant to do yesterday is more likely to still
 * matter than what you meant to do last Tuesday.
 */
export function carriedOver(
  items: readonly PlanItemRow[],
  today: string,
  limit = 10,
): PlanItemRow[] {
  return live(items)
    .filter((i) => i.status === "open" && i.dateLocal < today)
    .sort((a, b) => b.dateLocal.localeCompare(a.dateLocal) || a.createdAt - b.createdAt)
    .slice(0, limit);
}

export interface NextUp {
  item: PlanItemRow;
  /** Minutes until it starts; negative once its time has passed. */
  inMinutes: number | null;
  /** Its time has arrived and nothing later has started. */
  isNow: boolean;
}

/**
 * What to do next — the one question the whole screen exists to answer.
 *
 * Prefers the next timed item still ahead. If every timed item is
 * behind us, the most recent one that has come due is "now" rather
 * than "missed", because a plan is not a train timetable. With no
 * timed items at all, the first untimed one stands in.
 */
export function nextUp(
  items: readonly PlanItemRow[],
  today: string,
  nowMinutes: number,
): NextUp | null {
  const open = itemsForDay(items, today).filter((i) => i.status === "open");
  if (open.length === 0) return null;

  const timed = open.filter((i) => i.atMinutes != null);
  const ahead = timed.find((i) => i.atMinutes! >= nowMinutes);
  if (ahead) {
    return { item: ahead, inMinutes: ahead.atMinutes! - nowMinutes, isNow: false };
  }

  const current = timed[timed.length - 1];
  if (current) {
    return { item: current, inMinutes: current.atMinutes! - nowMinutes, isNow: true };
  }

  return { item: open[0], inMinutes: null, isNow: false };
}

/** "in 25m" / "in 2h 10m" / "now" / "started 15m ago". */
export function whenLabel(next: NextUp): string {
  if (next.inMinutes == null) return "sometime today";
  const m = next.inMinutes;
  if (m === 0) return "now";
  if (m > 0) {
    if (m < 60) return `in ${m}m`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest === 0 ? `in ${h}h` : `in ${h}h ${rest}m`;
  }
  const ago = -m;
  if (ago < 60) return `started ${ago}m ago`;
  const h = Math.floor(ago / 60);
  return `started ${h}h ago`;
}

/** Time as it should read on the row, or a plain word when untimed. */
export function itemTimeLabel(item: PlanItemRow): string {
  return item.atMinutes == null ? "Anytime" : formatClock(item.atMinutes);
}

export interface DayLoad {
  open: number;
  done: number;
  /** Minutes of planned work, from the estimates given. */
  plannedMinutes: number;
  /** Two timed items whose estimated blocks overlap. */
  clashes: [PlanItemRow, PlanItemRow][];
}

/**
 * What a day is actually carrying.
 *
 * Overlaps are reported, never blocked. Double-booking yourself is
 * sometimes the correct decision and the app does not get a vote — it
 * just makes sure you saw it.
 */
export function dayLoad(items: readonly PlanItemRow[], date: string): DayLoad {
  const day = itemsForDay(items, date);
  const open = day.filter((i) => i.status === "open");
  const timed = open.filter((i) => i.atMinutes != null);

  const clashes: [PlanItemRow, PlanItemRow][] = [];
  for (let i = 0; i < timed.length - 1; i++) {
    const a = timed[i];
    const b = timed[i + 1];
    const aEnd = a.atMinutes! + (a.estMinutes ?? 0);
    if (aEnd > b.atMinutes!) clashes.push([a, b]);
  }

  return {
    open: open.length,
    done: day.filter((i) => i.status === "done").length,
    plannedMinutes: open.reduce((n, i) => n + (i.estMinutes ?? 0), 0),
    clashes,
  };
}

/**
 * How many things are open today — the number the app icon badge
 * shows. Capped, because a badge reading 40 is just noise.
 */
export function openTodayCount(items: readonly PlanItemRow[], today: string): number {
  return Math.min(99, itemsForDay(items, today).filter((i) => i.status === "open").length);
}
