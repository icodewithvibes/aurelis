/**
 * ExercisePreview — "See the movement".
 *
 * Presented as a bottom sheet rather than an inline card. Inline meant
 * a photo shoving the list around and competing with the sets you were
 * logging; a sheet gives the demonstration the full width, keeps the
 * list still underneath, and dismisses the way every other iOS sheet
 * does — tap the backdrop, or Escape.
 *
 * Nothing loads until asked: the metadata index is lazy-imported and the
 * photo is fetched on demand. No user data leaves the device; a failed
 * image degrades to the written steps.
 */
import { useEffect, useState } from "react";
import { Portal } from "./Portal";
import {
  exerciseImageUrl,
  findExercise,
  hasReference,
  musclesLabel,
  cleanDescription,
} from "../features/exercises/exerciseDb";
import { displayName } from "../features/exercises/displayName";
import type { ExerciseInfo } from "../features/exercises/exerciseDb";

type State =
  | { phase: "closed" }
  | { phase: "loading" }
  | { phase: "found"; info: ExerciseInfo; imageFailed: boolean }
  | { phase: "missing" };

interface ExercisePreviewProps {
  name: string;
  /** Cardio and similar entries have no reference photo by design. */
  hideWhenUnmatched?: boolean;
}

export function ExercisePreview({ name }: ExercisePreviewProps) {
  const [state, setState] = useState<State>({ phase: "closed" });
  const open = state.phase !== "closed";
  // Running and riding have no photo by design; offering a button that
  // can only disappoint is worse than not offering one.
  const referenced = hasReference(name);

  // Escape closes, and the page behind must not scroll under the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState({ phase: "closed" });
    document.addEventListener("keydown", onKey);

    /*
     * Lock the DOCUMENT, not <body>.
     *
     * `overflow` on <body> does not reach the viewport here, because
     * <html> already has a non-visible `overflow-x` and so wins the
     * propagation. Setting it on <body> therefore locks nothing — it
     * just turns <body> into its own scroll container, which is the one
     * arrangement iOS handles worst, and it did it at exactly the
     * moment a fixed overlay was on screen.
     */
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prev;
    };
  }, [open]);

  async function show() {
    setState({ phase: "loading" });
    try {
      const info = await findExercise(name);
      setState(info ? { phase: "found", info, imageFailed: false } : { phase: "missing" });
    } catch {
      setState({ phase: "missing" });
    }
  }

  if (!referenced) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void show()}
        className="aur-touch mt-1 inline-flex items-center gap-1.5 text-small"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--aur-ink-muted)",
          padding: "0.25rem 0",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none">
          <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6.6 5.9 10.6 8l-4 2.1V5.9Z" fill="currentColor" />
        </svg>
        See the movement
      </button>

      {open && (
        <Portal>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`How to perform ${name}`}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{
            background: "rgba(4,8,18,0.62)",
            /* Inline styles bypass the CSS pipeline, so unlike index.css
               order is irrelevant here — but iOS still needs the prefix. */
            WebkitBackdropFilter: "blur(3px)",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setState({ phase: "closed" })}
        >
          <div
            className="aur-sheet w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            style={{
              /* vh first so an engine without dvh still gets a cap. */
              maxHeight: "86vh",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
            }}
          >
            {/* Grab handle — the affordance that says "drag or tap away". */}
            <div className="sticky top-0 z-10 flex justify-center pt-2 pb-1">
              <span
                aria-hidden="true"
                className="block rounded-full"
                style={{ width: 36, height: 4, background: "var(--aur-glass-rim-strong)" }}
              />
            </div>

            {state.phase === "loading" && (
              <p className="m-0 px-5 pb-6 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                Looking it up…
              </p>
            )}

            {state.phase === "missing" && (
              <div className="px-5 pb-6">
                <h2 className="aur-heading">{name}</h2>
                <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                  No reference photo for this one — it may be your own movement, or named
                  differently here. Nothing is wrong with your split.
                </p>
                <button
                  type="button"
                  onClick={() => setState({ phase: "closed" })}
                  className="aur-press aur-touch mt-4 w-full rounded-full text-body"
                  style={{
                    background: "var(--aur-glass-tint)",
                    color: "var(--aur-ink)",
                    border: "1px solid var(--aur-glass-rim)",
                  }}
                >
                  Close
                </button>
              </div>
            )}

            {state.phase === "found" && (
              <>
                {!state.imageFailed && (
                  <img
                    src={exerciseImageUrl(state.info.i)}
                    alt={`Demonstration of ${displayName(state.info.n)}`}
                    /* Intrinsic size reserves the box before the photo
                       arrives, so nothing jumps and the layout does not
                       depend on aspect-ratio support. */
                    width={800}
                    height={600}
                    decoding="async"
                    onError={() => setState({ ...state, imageFailed: true })}
                    className="mt-1 block w-full"
                    style={{
                      height: "auto",
                      objectFit: "cover",
                      background: "var(--aur-glass-tint)",
                    }}
                  />
                )}

                <div className="px-5 pt-4">
                  <h2 className="aur-heading">{displayName(state.info.n)}</h2>

                  <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
                    {state.info.e && <Chip>{state.info.e}</Chip>}
                    {state.info.l && <Chip>{state.info.l}</Chip>}
                    <Chip>{musclesLabel(state.info)}</Chip>
                  </ul>

                  {state.info.d && (
                    <p className="m-0 mt-3 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                      {cleanDescription(state.info.d)}
                    </p>
                  )}

                  {state.imageFailed && (
                    <p className="aur-meta m-0 mt-3">
                      The photo could not load — you may be offline. The steps still apply.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setState({ phase: "closed" })}
                    className="aur-press aur-touch mt-4 w-full rounded-full text-body font-medium"
                    style={{
                      background: "var(--aur-chrome-50)",
                      color: "var(--aur-night)",
                      border: "none",
                      padding: "0.8rem 1.5rem",
                    }}
                  >
                    Got it
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li
      className="rounded-full px-2.5 py-1 text-[0.6875rem]"
      style={{
        background: "var(--aur-glass-tint)",
        border: "1px solid var(--aur-glass-rim)",
        color: "var(--aur-ink-muted)",
      }}
    >
      {children}
    </li>
  );
}
