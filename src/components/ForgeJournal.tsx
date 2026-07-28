/**
 * ForgeJournal — the app's memory.
 *
 * A note you can never read back is a note you stop writing. This shows
 * what you actually set down, newest first, with the step that was
 * offered at the time. Entirely local.
 */
import { useEffect, useState } from "react";
import type { ForgeEntryRow } from "../data/db";
import { deleteForgeEntry, recentForgeEntries } from "../features/forge/forgeRepo";
import { FORGE_STATES } from "../features/forge/types";

const STATE_LABEL = new Map(FORGE_STATES.map((s) => [s.key, s.label]));

function when(dateLocal: string): string {
  const [y, m, d] = dateLocal.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ForgeJournal() {
  const [entries, setEntries] = useState<ForgeEntryRow[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void recentForgeEntries().then((e) => alive && setEntries(e));
    return () => {
      alive = false;
    };
  }, [open]);

  async function remove(id: string) {
    await deleteForgeEntry(id);
    setEntries(await recentForgeEntries());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="aur-press aur-touch mt-4 w-full rounded-full text-body"
        style={{
          background: "var(--aur-glass-tint)",
          color: "var(--aur-ink)",
          border: "1px solid var(--aur-glass-rim)",
        }}
      >
        What you&apos;ve set down
      </button>
    );
  }

  return (
    <section className="mt-4 aur-chrome-surface p-5" aria-label="Journal">
      <div className="flex items-baseline justify-between gap-3">
        <p className="aur-label m-0">What you&apos;ve set down</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="aur-touch text-small"
          style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)" }}
        >
          Close
        </button>
      </div>

      {entries === null && (
        <p className="m-0 mt-3 text-body" style={{ color: "var(--aur-ink-muted)" }}>
          Loading…
        </p>
      )}

      {entries?.length === 0 && (
        <p className="m-0 mt-3 text-body" style={{ color: "var(--aur-ink-muted)" }}>
          Nothing yet. Anything you write in Forge is kept here so you can read it back.
        </p>
      )}

      <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
        {entries?.map((e) => (
          <li
            key={e.id}
            className="rounded-xl p-3"
            style={{ background: "var(--aur-glass-tint)", border: "1px solid var(--aur-glass-rim)" }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="aur-meta">
                {when(e.dateLocal)}
                {STATE_LABEL.get(e.stateKey as never) ? ` · ${STATE_LABEL.get(e.stateKey as never)}` : ""}
                {e.status === "done" ? " · kept" : ""}
              </span>
              <button
                type="button"
                onClick={() => void remove(e.id)}
                aria-label={`Delete the note from ${when(e.dateLocal)}`}
                className="aur-touch text-small"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--aur-ink-faint)",
                  minHeight: 32,
                }}
              >
                ×
              </button>
            </div>

            {e.note ? (
              <p className="m-0 mt-1 text-body">{e.note}</p>
            ) : (
              <p className="m-0 mt-1 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                {e.acknowledgment}
              </p>
            )}

            {e.action && (
              <p className="aur-meta m-0 mt-2">
                Step offered: {e.action}
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className="aur-meta m-0 mt-3">
        Stored only on this device. Included in your backup file.
      </p>
    </section>
  );
}
