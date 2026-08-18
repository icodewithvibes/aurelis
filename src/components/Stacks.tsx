/**
 * Stacks — the picker.
 *
 * Ordered by what the current split actually misses, so the block that
 * closes a real hole sits at the top instead of being one of ten equal
 * options. If nothing is missing they are still offered, just without
 * the "fills a gap" note — a complete program is not a reason to hide
 * fifteen minutes of extra work.
 *
 * Two things the list has to survive: ten stacks is more than fits on a
 * phone screen, and "I want core, today, nothing else" has to be one
 * tap. So there is a muscle filter above the list, and each block opens
 * to three levels rather than a single fixed prescription.
 *
 * Each block offers TWO actions, and the difference between them is
 * stated rather than implied. Training it now logs a standalone session
 * — the sets count toward the rank, the day does not. Adding it to the
 * split makes it work the program asks for, which is what a kept day is
 * made of. Anything else would be the app quietly implying a six-minute
 * calf block is worth the same as a training day.
 *
 * The `rest` variant is the same component with different framing, for
 * the Today screen on a day with nothing scheduled — that is the day
 * someone most wants to train one thing on purpose.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { startStackSession } from "../data/repositories/sessionRepo";
import { coverageOfActiveSplit } from "../features/training/coverageRepo";
import { loadHome } from "../data/access";
import { GROUP_LABEL, type CoverageGroup } from "../features/training/coverage";
import {
  LEVEL_LABEL,
  STACKS,
  STACK_LEVELS,
  stackGroups,
  stackLevel,
  stackSnapshot,
  stacksForGaps,
  type Stack,
  type StackLevelId,
} from "../features/training/stacks";
import {
  addOutcomeSentence,
  addStackToSplit,
  type StackTarget,
} from "../features/training/stackToSplit";
import { ExercisePreview } from "./ExercisePreview";
import { displayName } from "../features/exercises/displayName";

interface StacksProps {
  /** `rest` reframes the copy for a day with nothing scheduled. */
  variant?: "full" | "rest";
  /** Show only the top few, with a link to the rest. */
  limit?: number;
}

export function Stacks({ variant = "full", limit }: StacksProps) {
  const nav = useNavigate();
  const { data: coverage } = useAsync(coverageOfActiveSplit);
  const { data: home, reload: reloadHome } = useAsync(loadHome);
  const [open, setOpen] = useState<string | null>(null);
  const [levels, setLevels] = useState<Record<string, StackLevelId>>({});
  const [filter, setFilter] = useState<CoverageGroup | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  /** Which stack is showing the "add to split" choices. */
  const [adding, setAdding] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  const gaps = (coverage?.gaps ?? []).map((g) => g.group);
  const suggested = stacksForGaps(gaps);
  const suggestedIds = new Set(suggested.map((s) => s.id));
  const ranked: Stack[] = [...suggested, ...STACKS.filter((s) => !suggestedIds.has(s.id))];
  const filtered = filter ? ranked.filter((s) => s.covers.includes(filter)) : ranked;
  const shown = limit ? filtered.slice(0, limit) : filtered;
  const days = home?.days ?? [];

  async function start(stack: Stack, levelId: StackLevelId) {
    setStarting(stack.id);
    try {
      const id = await startStackSession(stackSnapshot(stack, levelId));
      nav(`/session/${id}`);
    } finally {
      setStarting(null);
    }
  }

  async function addToSplit(stack: Stack, levelId: StackLevelId, target: StackTarget) {
    const result = await addStackToSplit(stack, levelId, target);
    setAdding(null);
    setOutcome(result ? addOutcomeSentence(result) : "No active split to add this to.");
    reloadHome();
  }

  return (
    <section className="mt-4 aur-chrome-surface p-5" aria-label="Stacks">
      <p className="aur-label m-0">{variant === "rest" ? "Train one thing" : "Stacks"}</p>
      <p className="aur-meta m-0 mt-1">
        {variant === "rest"
          ? "Nothing is scheduled, but a short block on one muscle costs you no recovery you needed. It's logged as its own session and the sets still count."
          : "Short blocks you can train on their own. Train one now and it logs as its own session, or add it to your split so it counts as a kept day."}
      </p>

      {outcome && (
        <div
          className="mt-3 rounded-xl p-3"
          style={{ background: "var(--aur-glass-tint)", border: "1px solid var(--aur-glass-rim)" }}
        >
          <p className="m-0 text-small" style={{ color: "var(--aur-ink)" }}>{outcome}</p>
          <button
            type="button"
            onClick={() => setOutcome(null)}
            className="aur-touch mt-1 text-small"
            style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)", padding: "0.25rem 0" }}
          >
            Got it
          </button>
        </div>
      )}

      {/* One tap from "I want to hit core" to the core block. */}
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter stacks by muscle">
        <FilterChip active={filter === null} onClick={() => setFilter(null)}>
          All
        </FilterChip>
        {stackGroups().map((g) => (
          <FilterChip key={g} active={filter === g} onClick={() => setFilter(filter === g ? null : g)}>
            {GROUP_LABEL[g]}
          </FilterChip>
        ))}
      </div>

      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {shown.map((s) => {
          const fills = s.covers.filter((c) => gaps.includes(c));
          const isOpen = open === s.id;
          const levelId = levels[s.id] ?? "standard";
          const lvl = stackLevel(s, levelId);
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
                  <span className="aur-meta whitespace-nowrap">{lvl.minutes} min</span>
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
                  {/* Levels are visible, not earned. Someone in their
                      first month picks starter; nobody is gated. */}
                  <div className="flex gap-1.5" role="group" aria-label={`${s.name} level`}>
                    {STACK_LEVELS.map((id) => {
                      const active = id === levelId;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setLevels((m) => ({ ...m, [s.id]: id }))}
                          className="aur-press flex-1 rounded-lg px-2 text-small"
                          style={{
                            minHeight: 44,
                            background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                            color: active ? "var(--aur-night)" : "var(--aur-ink)",
                            border: "1px solid var(--aur-glass-rim)",
                          }}
                        >
                          {LEVEL_LABEL[id]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="aur-meta m-0 mt-2">{lvl.summary}</p>

                  <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                    {lvl.exercises.map((e) => (
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
                    onClick={() => void start(s, levelId)}
                    disabled={starting !== null}
                    className="aur-button mt-3 w-full rounded-xl px-4 py-3 disabled:opacity-60"
                    style={{ minHeight: 48 }}
                  >
                    {starting === s.id
                      ? "Starting…"
                      : `Train ${s.name} · ${LEVEL_LABEL[levelId].toLowerCase()}`}
                  </button>

                  {/* The honest version of "make it count for more". */}
                  {days.length > 0 && (
                    <>
                      <button
                        type="button"
                        aria-expanded={adding === s.id}
                        onClick={() => setAdding(adding === s.id ? null : s.id)}
                        className="aur-press aur-touch mt-2 w-full rounded-xl px-4 text-small"
                        style={{
                          minHeight: 44,
                          background: "var(--aur-glass-tint)",
                          color: "var(--aur-ink)",
                          border: "1px solid var(--aur-glass-rim)",
                        }}
                      >
                        {adding === s.id ? "Never mind" : "Add to my split"}
                      </button>

                      {adding === s.id && (
                        <div className="mt-2">
                          <p className="aur-meta m-0">
                            Trained on its own, a stack logs its sets and they count toward your
                            rank — but a kept day comes from work your program asked for. Put it in
                            the split and it counts as a day.
                          </p>
                          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                            {days.map((d) => (
                              <li key={d.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void addToSplit(s, levelId, { kind: "existingDay", dayId: d.id })
                                  }
                                  className="aur-press w-full rounded-lg px-3 py-2 text-left text-small"
                                  style={{
                                    minHeight: 44,
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid var(--aur-hairline)",
                                    color: "var(--aur-ink)",
                                  }}
                                >
                                  Add to {d.name}
                                </button>
                              </li>
                            ))}
                            <li>
                              <button
                                type="button"
                                onClick={() => void addToSplit(s, levelId, { kind: "newDay" })}
                                className="aur-press w-full rounded-lg px-3 py-2 text-left text-small"
                                style={{
                                  minHeight: 44,
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid var(--aur-hairline)",
                                  color: "var(--aur-ink)",
                                }}
                              >
                                Add as its own day
                                <span className="aur-meta mt-0.5 block">
                                  Your week rotates through {days.length} days now — a new one
                                  shifts which session lands on which weekday.
                                </span>
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {limit && filtered.length > shown.length && (
        <button
          type="button"
          onClick={() => nav("/train")}
          className="aur-press aur-touch mt-3 w-full rounded-full text-small"
          style={{
            background: "transparent",
            color: "var(--aur-ink-muted)",
            border: "1px solid var(--aur-glass-rim)",
          }}
        >
          See all {filtered.length} stacks
        </button>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="aur-press rounded-full px-3 text-small"
      style={{
        minHeight: 40,
        background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
        color: active ? "var(--aur-night)" : "var(--aur-ink-muted)",
        border: "1px solid var(--aur-glass-rim)",
      }}
    >
      {children}
    </button>
  );
}
