/**
 * SwapExercise — "machine's taken", answered in two taps.
 *
 * Sits on every exercise in a live session. Ask why you can't do it, and
 * it gives movements that train the same thing with what's actually
 * free, each with a line saying how it relates to the one it replaces —
 * a swap you can't reason about is just the app choosing for you.
 *
 * The swap is local to today's session. The split is only touched if you
 * explicitly ask for it, which is the right default: a machine being
 * busy on a Tuesday is not a reason to rewrite your program, but a gym
 * that hasn't got the machine at all very much is.
 */
import { useEffect, useState } from "react";
import { Portal } from "./Portal";
import { ExercisePreview } from "./ExercisePreview";
import { displayName } from "../features/exercises/displayName";
import {
  findAlternatives,
  SWAP_REASONS,
  type Alternative,
  type SwapReason,
} from "../features/training/substitutions";
import { swapSessionExercise, type SwapMode } from "../data/repositories/sessionRepo";
import {
  templateExerciseExists,
  updateTemplateExercise,
} from "../data/repositories/splitRepo";

interface SwapExerciseProps {
  sessionId: string;
  exerciseKey: string;
  name: string;
  /** Re-read the session after a successful swap. */
  onSwapped: (mode: SwapMode, newName: string) => void;
}

export function SwapExercise({ sessionId, exerciseKey, name, onSwapped }: SwapExerciseProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<SwapReason>("taken");
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null);
  const [alsoSplit, setAlsoSplit] = useState(false);
  const [inSplit, setInSplit] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  // Escape closes, and the page behind must not scroll under the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prev;
    };
  }, [open]);

  // Only offer to change the split when this exercise IS in the split —
  // a stack session, or something already swapped, has nothing to edit.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void templateExerciseExists(exerciseKey).then((yes) => alive && setInSplit(yes));
    return () => {
      alive = false;
    };
  }, [open, exerciseKey]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setAlternatives(null);
    void findAlternatives(name, reason).then((list) => alive && setAlternatives(list));
    return () => {
      alive = false;
    };
  }, [open, name, reason]);

  async function choose(alt: Alternative) {
    setWorking(alt.name);
    try {
      const mode = await swapSessionExercise(sessionId, exerciseKey, alt.name);
      if (alsoSplit && inSplit) {
        await updateTemplateExercise(exerciseKey, { name: alt.name });
      }
      setOpen(false);
      if (mode) onSwapped(mode, alt.name);
    } finally {
      setWorking(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="aur-touch mt-1 inline-flex items-center gap-1.5 text-small"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--aur-ink-muted)",
          padding: "0.25rem 0",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none">
          <path d="M2.5 5.2h9m0 0L9.3 3m2.2 2.2L9.3 7.4M13.5 10.8h-9m0 0L6.7 8.6m-2.2 2.2 2.2 2.2"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Can't do this one?
      </button>

      {open && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Swap ${displayName(name)}`}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{
              background: "rgba(4,8,18,0.62)",
              WebkitBackdropFilter: "blur(3px)",
              backdropFilter: "blur(3px)",
            }}
            onClick={() => setOpen(false)}
          >
            <div
              className="aur-sheet w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxHeight: "86vh",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
              }}
            >
              <div className="sticky top-0 z-10 flex justify-center pt-2 pb-1">
                <span aria-hidden="true" className="block rounded-full"
                  style={{ width: 36, height: 4, background: "var(--aur-glass-rim-strong)" }} />
              </div>

              <div className="px-5 pb-6 pt-2">
                <p className="aur-label m-0">Instead of</p>
                <h2 className="aur-heading mt-1">{displayName(name)}</h2>

                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Why you need something else">
                  {SWAP_REASONS.map((r) => {
                    const active = r.id === reason;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setReason(r.id)}
                        className="aur-press aur-touch rounded-full px-3 text-small"
                        style={{
                          minHeight: 44,
                          background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                          color: active ? "var(--aur-night)" : "var(--aur-ink)",
                          border: "1px solid var(--aur-glass-rim)",
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
                <p className="aur-meta m-0 mt-2">
                  {SWAP_REASONS.find((r) => r.id === reason)?.blurb}
                </p>

                {alternatives === null && (
                  <p className="m-0 mt-4 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                    Finding something…
                  </p>
                )}

                {alternatives?.length === 0 && (
                  <p className="m-0 mt-4 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                    Nothing close enough to suggest for this one. Skip it and keep the rest of the
                    session — a missed exercise is not a missed workout.
                  </p>
                )}

                <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                  {(alternatives ?? []).map((alt) => (
                    <li key={alt.name}>
                      <button
                        type="button"
                        disabled={working !== null}
                        onClick={() => void choose(alt)}
                        className="aur-press w-full rounded-xl px-4 py-3 text-left disabled:opacity-60"
                        style={{
                          minHeight: 56,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid var(--aur-glass-rim)",
                          color: "var(--aur-ink)",
                        }}
                      >
                        <span className="aur-section block">{displayName(alt.name)}</span>
                        <span className="aur-meta mt-0.5 block">
                          {working === alt.name ? "Swapping…" : alt.why}
                        </span>
                      </button>
                      <div className="mt-1 pl-1">
                        <ExercisePreview name={alt.name} />
                      </div>
                    </li>
                  ))}
                </ul>

                {inSplit && (alternatives?.length ?? 0) > 0 && (
                  <label className="mt-4 flex items-start gap-2 text-small" style={{ color: "var(--aur-ink-muted)" }}>
                    <input
                      type="checkbox"
                      checked={alsoSplit}
                      onChange={(e) => setAlsoSplit(e.target.checked)}
                      style={{ width: 18, height: 18, marginTop: 2, accentColor: "var(--aur-chrome-50)" }}
                    />
                    <span>
                      Change it in my split too — for when this gym simply hasn't got it. Sessions
                      you already recorded keep what you actually did.
                    </span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="aur-press aur-touch mt-4 w-full rounded-full text-body"
                  style={{
                    background: "var(--aur-glass-tint)",
                    color: "var(--aur-ink)",
                    border: "1px solid var(--aur-glass-rim)",
                  }}
                >
                  Keep it as it is
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
