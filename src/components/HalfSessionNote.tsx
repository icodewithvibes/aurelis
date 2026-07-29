/**
 * HalfSessionNote — offers, once, to record why a session stopped.
 *
 * A session that went quiet for two hours has already been closed and
 * already counts for what was actually done. This asks nothing of the
 * user: it states what happened, offers a reason in one tap, and can be
 * dismissed outright. There is no guilt copy, no "you missed a day", and
 * declining to answer costs nothing — the half session stands either way.
 *
 * It disappears for good once answered or dismissed, and never appears
 * for anything older than two days (see pendingHalfSessions).
 */
import { useState } from "react";
import { STALL_REASONS, type StallReason } from "../features/training/staleSession";
import { setStallReason } from "../data/repositories/sessionRepo";
import type { SessionRow } from "../data/db";

interface HalfSessionNoteProps {
  session: SessionRow;
  onDone: () => void;
}

export function HalfSessionNote({ session, onDone }: HalfSessionNoteProps) {
  const [saving, setSaving] = useState(false);
  const dayName =
    (session.splitDaySnapshot as { dayName?: string } | null)?.dayName ?? "That session";

  async function choose(reason: StallReason) {
    setSaving(true);
    await setStallReason(session.id, reason);
    onDone();
  }

  return (
    <section className="mt-4 aur-chrome-surface p-5" aria-label="Half session">
      <p className="aur-label m-0">Half session</p>
      <p className="m-0 mt-2 text-body">
        {dayName} was left open, so it was closed and logged as a half session. The sets you
        did are kept — it just isn&apos;t counted as a kept day.
      </p>
      <p className="aur-meta m-0 mt-2">Want to note why? Optional.</p>

      <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
        {STALL_REASONS.map((r) => (
          <li key={r.key}>
            <button
              type="button"
              disabled={saving}
              onClick={() => void choose(r.key)}
              className="aur-press aur-touch rounded-full px-3 py-1.5 text-small"
              style={{
                background: "var(--aur-glass-tint)",
                border: "1px solid var(--aur-glass-rim)",
                color: "var(--aur-ink)",
              }}
            >
              {r.label}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={saving}
        onClick={onDone}
        className="aur-touch mt-3 text-small"
        style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)", padding: "0.25rem 0" }}
      >
        No reason needed
      </button>
    </section>
  );
}
