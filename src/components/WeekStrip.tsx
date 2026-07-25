/**
 * WeekStrip (Stage 4) — the week at a glance, built for a thumb.
 *
 * Seven columns that fit inside 390px without scrolling: weekday, a
 * status dot, and the planned day's name where there is one. Status
 * wording is plain and never shaming — an unlogged scheduled day reads
 * "not logged", not "missed".
 */
import type { PlannedDay, PlannedStatus } from "../features/planning/week";
import { STATUS_LABEL } from "../features/planning/week";

/** Dot treatment per status. Colour alone never carries the meaning —
 *  each day also exposes its status in the accessible label. */
const DOT: Record<PlannedStatus, { background: string; border: string }> = {
  kept: { background: "var(--aur-success)", border: "transparent" },
  partial: { background: "var(--aur-caution)", border: "transparent" },
  recovery: { background: "var(--aur-cobalt-300)", border: "transparent" },
  open: { background: "transparent", border: "1px solid var(--aur-ink-faint)" },
  rest: { background: "rgba(210,217,230,0.22)", border: "transparent" },
  planned: { background: "var(--aur-silver-200)", border: "transparent" },
};

interface WeekStripProps {
  days: PlannedDay[];
  /** Tapping a day with a session opens it; a planned day can start it. */
  onSelect?: (day: PlannedDay) => void;
}

export function WeekStrip({ days, onSelect }: WeekStripProps) {
  return (
    <ul
      className="m-0 grid list-none grid-cols-7 gap-1 p-0"
      aria-label="This week"
    >
      {days.map((d) => {
        const dot = DOT[d.status];
        const label = `${d.long} ${d.date.slice(5)} — ${
          d.dayName ? `${d.dayName}, ` : ""
        }${STATUS_LABEL[d.status]}${d.isToday ? ", today" : ""}`;

        const content = (
          <>
            <span
              className="block text-[0.625rem] uppercase tracking-[0.08em]"
              style={{ color: d.isToday ? "var(--aur-ink)" : "var(--aur-ink-muted)" }}
            >
              {d.short}
            </span>
            <span
              aria-hidden="true"
              className="mx-auto mt-1 block rounded-full"
              style={{
                width: 8,
                height: 8,
                background: dot.background,
                border: dot.border,
              }}
            />
            <span
              className="mt-1 block truncate text-[0.5625rem] leading-tight"
              style={{ color: "var(--aur-ink-faint)" }}
            >
              {d.dayName ? d.dayName.split(" ")[0] : "—"}
            </span>
          </>
        );

        return (
          <li key={d.date}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(d)}
                aria-label={label}
                className="w-full rounded-lg px-0.5 py-2 text-center"
                style={{
                  minHeight: 44,
                  background: d.isToday ? "rgba(210,217,230,0.12)" : "transparent",
                  border: d.isToday
                    ? "1px solid rgba(210,217,230,0.22)"
                    : "1px solid transparent",
                  color: "var(--aur-ink)",
                }}
              >
                {content}
              </button>
            ) : (
              <div
                aria-label={label}
                className="rounded-lg px-0.5 py-2 text-center"
                style={{
                  background: d.isToday ? "rgba(210,217,230,0.12)" : "transparent",
                }}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
