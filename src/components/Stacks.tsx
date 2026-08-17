/**
 * Stacks on the Train screen.
 *
 * Ordered by what the current split actually misses, so the block that
 * closes a real hole sits at the top instead of being one of six equal
 * options. If nothing is missing they are still offered, just without
 * the "fills a gap" note — a complete program is not a reason to hide
 * fifteen minutes of extra work.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { startStackSession } from "../data/repositories/sessionRepo";
import { coverageOfActiveSplit } from "../features/training/coverageRepo";
import { GROUP_LABEL } from "../features/training/coverage";
import { STACKS, stackSnapshot, stacksForGaps, type Stack } from "../features/training/stacks";
import { ExercisePreview } from "./ExercisePreview";
import { displayName } from "../features/exercises/displayName";

export function Stacks() {
  const nav = useNavigate();
  const { data: coverage } = useAsync(coverageOfActiveSplit);
  const [open, setOpen] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const gaps = (coverage?.gaps ?? []).map((g) => g.group);
  const suggested = stacksForGaps(gaps);
  const suggestedIds = new Set(suggested.map((s) => s.id));
  const ordered: Stack[] = [...suggested, ...STACKS.filter((s) => !suggestedIds.has(s.id))];

  async function start(stack: Stack) {
    setStarting(stack.id);
    try {
      const id = await startStackSession(stackSnapshot(stack));
      nav(`/session/${id}`);
    } finally {
      setStarting(null);
    }
  }

  return (
    <section className="mt-4 aur-chrome-surface p-5" aria-label="Stacks">
      <p className="aur-label m-0">Stacks</p>
      <p className="aur-meta m-0 mt-1">
        Short blocks you can train on their own. They don't change your split —
        they're logged as their own session and still count.
      </p>

      <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
        {ordered.map((s) => {
          const fills = s.covers.filter((c) => gaps.includes(c));
          const isOpen = open === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : s.id)}
                aria-expanded={isOpen}
                className="w-full rounded-xl px-4 py-3 text-left"
                style={{
                  minHeight: 56,
                  background: "rgba(255,255,255,0.04)",
                  boxShadow: fills.length
                    ? "inset 0 0 0 1px var(--aur-chrome)"
                    : "inset 0 0 0 1px var(--aur-hairline)",
                }}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="aur-section">{s.name}</span>
                  <span className="aur-meta">{s.minutes} min</span>
                </span>
                <span className="aur-meta mt-0.5 block">{s.summary}</span>
                {fills.length > 0 && (
                  <span className="aur-meta mt-1 block" style={{ color: "var(--aur-chrome)" }}>
                    Fills a gap in your split:{" "}
                    {fills.map((c) => GROUP_LABEL[c].toLowerCase()).join(", ")}.
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="mt-2 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {s.exercises.map((e) => (
                      <li key={e.name} className="flex items-center justify-between gap-2">
                        <span className="aur-meta min-w-0 truncate">
                          {displayName(e.name)} · {e.sets}×{e.repMin}–{e.repMax}
                        </span>
                        <ExercisePreview name={e.name} />
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => void start(s)}
                    disabled={starting !== null}
                    className="aur-button mt-3 w-full rounded-xl px-4 py-3 disabled:opacity-60"
                    style={{ minHeight: 48 }}
                  >
                    {starting === s.id ? "Starting…" : `Train ${s.name}`}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
