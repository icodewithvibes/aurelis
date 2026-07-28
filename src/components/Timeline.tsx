/**
 * Timeline — the record of kept days, one line each.
 *
 * A rail runs down the left with the date beside every node, so the
 * shape of a month is legible at a glance instead of having to be read.
 * A day collapses to a single line — what it was, plus a few short
 * facts — and opens on press to the full record: every lift and set,
 * records broken, the Forge commitment, activities, and any notes.
 *
 * The node is the day's mark: filled when the day was kept, hollow when
 * it was not. On a day that crossed a tier the node is replaced by the
 * crest itself at rail size — below 96px CrestEmblem renders the SVG
 * Threshold Arch, so this is the approved asset, not a substitute.
 *
 * Disclosure is a plain button with `aria-expanded`, matching the split
 * library, and the open state simply mounts the detail. No height
 * animation and no framer-motion: an entrance transform on a row would
 * reintroduce exactly the containing-block trap documented in
 * Portal.tsx, and a deferred animation on iOS could leave a day stuck
 * half-open. The only motion is the chevron.
 */
import { useState } from "react";
import { CrestEmblem } from "./CrestEmblem";
import { railDate, setLabel, activityLabel, type TimelineDay } from "../features/proof/timeline";

interface TimelineProps {
  days: TimelineDay[];
  units: string;
}

export function Timeline({ days, units }: TimelineProps) {
  return (
    <ul className="m-0 mt-3 flex list-none flex-col p-0">
      {days.map((day, i) => (
        <TimelineRow key={day.dateLocal} day={day} units={units} last={i === days.length - 1} />
      ))}
    </ul>
  );
}

function TimelineRow({ day, units, last }: { day: TimelineDay; units: string; last: boolean }) {
  const [open, setOpen] = useState(false);
  const { month, day: dayNum } = railDate(day.dateLocal);

  return (
    <li className="relative flex gap-3">
      {/* --- rail ------------------------------------------------- */}
      <div className="relative flex w-11 shrink-0 flex-col items-center">
        <span className="aur-metric block text-center leading-none" style={{ fontSize: "0.9375rem" }}>
          {dayNum}
        </span>
        <span className="aur-meta block text-center leading-none" style={{ fontSize: "0.5625rem" }}>
          {month}
        </span>

        <span className="mt-1.5 grid place-items-center" style={{ height: day.crestLevel != null ? 30 : 12 }}>
          {day.crestLevel != null ? (
            <CrestEmblem
              level={day.crestLevel}
              size={30}
              halo={false}
              title={day.crestName ?? undefined}
            />
          ) : (
            <span
              aria-hidden="true"
              className="block rounded-full"
              style={{
                width: 7,
                height: 7,
                background: day.kept ? "var(--aur-chrome-50)" : "transparent",
                border: day.kept ? "none" : "1px solid var(--aur-glass-rim-strong)",
              }}
            />
          )}
        </span>

        {/* The connecting line, stopping short of the last node so the
            timeline ends rather than trailing off. */}
        {!last && (
          <span
            aria-hidden="true"
            className="mt-1.5 w-px flex-1"
            style={{ background: "var(--aur-glass-rim)", minHeight: 12 }}
          />
        )}
      </div>

      {/* --- entry ------------------------------------------------- */}
      <div className={`min-w-0 flex-1 ${last ? "pb-0" : "pb-4"}`}>
        <button
          type="button"
          disabled={!day.hasDetail}
          aria-expanded={day.hasDetail ? open : undefined}
          onClick={() => day.hasDetail && setOpen((o) => !o)}
          className="aur-touch flex w-full items-start justify-between gap-2 text-left"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            color: "inherit",
            cursor: day.hasDetail ? "pointer" : "default",
          }}
        >
          <span className="min-w-0">
            <span className="block truncate font-medium">{day.headline}</span>
            {day.crestName && (
              <span className="aur-meta block" style={{ color: "var(--aur-chrome-50)" }}>
                {day.crestName}
              </span>
            )}
            {day.chips.length > 0 && (
              <span className="aur-meta block truncate">{day.chips.join(" · ")}</span>
            )}
          </span>

          {day.hasDetail && (
            <svg
              width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none"
              className="mt-1 shrink-0"
              style={{
                color: "var(--aur-ink-faint)",
                transform: open ? "rotate(180deg)" : "none",
                transition: "transform 160ms ease",
              }}
            >
              <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {open && day.hasDetail && <DayDetail day={day} units={units} />}
      </div>
    </li>
  );
}

function DayDetail({ day, units }: { day: TimelineDay; units: string }) {
  const { detail } = day;
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-[10px] p-3" style={{ background: "var(--aur-glass-tint)" }}>
      {detail.exercises.length > 0 && (
        <div>
          <p className="aur-label m-0">Logged</p>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
            {detail.exercises.map((ex) => (
              <li key={ex.name}>
                <span className="block truncate text-small font-medium">{ex.name}</span>
                <span className="aur-meta">
                  {ex.sets.map((s) => setLabel(s, units)).join("  ·  ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.prs.length > 0 && (
        <div>
          <p className="aur-label m-0">Records</p>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-0.5 p-0">
            {detail.prs.map((pr) => (
              <li key={pr} className="aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>
                {pr}
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.activities.length > 0 && (
        <div>
          <p className="aur-label m-0">Also</p>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-0.5 p-0">
            {detail.activities.map((a) => (
              <li key={a.id} className="text-small" style={{ color: "var(--aur-ink-muted)" }}>
                {activityLabel(a)}
                {a.effort != null ? ` · felt ${a.effort}/10` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.forge.length > 0 && (
        <div>
          <p className="aur-label m-0">Forge</p>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-0.5 p-0">
            {detail.forge.map((f, i) => (
              <li key={i} className="text-small" style={{ color: "var(--aur-ink-muted)" }}>
                {f.action}
                <span className="aur-meta">
                  {f.status === "done" ? " · kept" : f.status === "skipped" ? " · skipped" : " · open"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.notes.length > 0 && (
        <div>
          <p className="aur-label m-0">Notes</p>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
            {detail.notes.map((n, i) => (
              <li key={i}>
                <span className="aur-meta block">{n.source}</span>
                <span className="text-small" style={{ color: "var(--aur-ink)" }}>{n.body}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
