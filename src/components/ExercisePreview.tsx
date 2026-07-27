/**
 * ExercisePreview — "Not sure what this looks like?"
 *
 * Tap it and you get a photo of the movement, the equipment it needs,
 * the muscles it works, and a two-sentence description.
 *
 * Nothing loads until you ask: the metadata index is lazy-imported and
 * the photo is fetched on demand. No user data leaves the device — it is
 * a plain GET for a public-domain image — and if it fails, the text
 * still stands on its own.
 */
import { useState } from "react";
import {
  exerciseImageUrl,
  findExercise,
  musclesLabel,
  type ExerciseInfo,
} from "../features/exercises/exerciseDb";

type State =
  | { phase: "closed" }
  | { phase: "loading" }
  | { phase: "found"; info: ExerciseInfo; imageFailed: boolean }
  | { phase: "missing" };

interface ExercisePreviewProps {
  name: string;
}

export function ExercisePreview({ name }: ExercisePreviewProps) {
  const [state, setState] = useState<State>({ phase: "closed" });

  async function open() {
    setState({ phase: "loading" });
    try {
      const info = await findExercise(name);
      setState(info ? { phase: "found", info, imageFailed: false } : { phase: "missing" });
    } catch {
      setState({ phase: "missing" });
    }
  }

  if (state.phase === "closed") {
    return (
      <button
        type="button"
        onClick={() => void open()}
        className="aur-touch mt-1 text-small"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--aur-ink-muted)",
          padding: "0.25rem 0",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Not sure what this looks like?
      </button>
    );
  }

  return (
    <div
      className="aur-glass mt-2 overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--aur-glass-rim)" }}
    >
      {state.phase === "loading" && (
        <p className="m-0 p-3 text-small" style={{ color: "var(--aur-ink-muted)" }}>
          Looking it up…
        </p>
      )}

      {state.phase === "missing" && (
        <div className="p-3">
          <p className="m-0 text-small" style={{ color: "var(--aur-ink-muted)" }}>
            No reference found for “{name}”. It may be named differently here, or be your own
            movement — nothing is wrong with your split.
          </p>
          <button
            type="button"
            onClick={() => setState({ phase: "closed" })}
            className="aur-touch mt-1 text-small"
            style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)" }}
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
              alt={`Demonstration of ${state.info.n}`}
              loading="lazy"
              decoding="async"
              onError={() => setState({ ...state, imageFailed: true })}
              className="block w-full"
              style={{ aspectRatio: "4 / 3", objectFit: "cover", background: "var(--aur-glass-tint)" }}
            />
          )}
          <div className="p-3">
            <p className="m-0 text-body font-medium">{state.info.n}</p>
            <p className="aur-meta m-0 mt-0.5">
              {[state.info.e, musclesLabel(state.info)].filter(Boolean).join(" · ")}
            </p>
            {state.info.d && (
              <p className="m-0 mt-2 text-small" style={{ color: "var(--aur-ink-muted)" }}>
                {state.info.d}
              </p>
            )}
            {state.imageFailed && (
              <p className="aur-meta m-0 mt-2">
                The photo could not load — you may be offline. The description still applies.
              </p>
            )}
            <button
              type="button"
              onClick={() => setState({ phase: "closed" })}
              className="aur-touch mt-1 text-small"
              style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)" }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
