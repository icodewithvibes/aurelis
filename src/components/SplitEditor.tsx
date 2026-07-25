/**
 * SplitEditor (Stage 5) — rename, reorder and edit an imported split.
 *
 * Import stops being a one-way door: a program can be corrected in place
 * without re-pasting it. Every write is local and immediate, and none of
 * it touches history — sessions snapshot their day when they start, so
 * past workouts keep the exercises they were actually performed with.
 */
import { useState } from "react";
import type { DayWithExercises } from "../data/repositories/splitRepo";
import {
  addTemplateExercise,
  moveSplitDay,
  removeSplitDay,
  removeTemplateExercise,
  renameSplitDay,
  updateTemplateExercise,
} from "../data/repositories/splitRepo";

interface SplitEditorProps {
  days: DayWithExercises[];
  /** Re-read from Dexie after any write. */
  onChanged: () => void;
}

const fieldStyle = {
  height: 44,
  color: "var(--aur-ink)",
  background: "rgba(7,12,24,0.55)",
  border: "1px solid var(--aur-glass-rim)",
} as const;

const iconButtonStyle = {
  width: 44,
  height: 44,
  background: "var(--aur-glass-tint)",
  border: "1px solid var(--aur-glass-rim)",
  color: "var(--aur-ink)",
} as const;

export function SplitEditor({ days, onChanged }: SplitEditorProps) {
  const [confirmDay, setConfirmDay] = useState<string | null>(null);
  const [adding, setAdding] = useState<Record<string, string>>({});

  async function run(fn: () => Promise<unknown>) {
    await fn();
    onChanged();
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
      {days.map((d, i) => (
        <section key={d.id} className="aur-chrome-surface p-4" aria-label={`Edit ${d.name}`}>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`day-${d.id}`}>
              Day name
            </label>
            <input
              id={`day-${d.id}`}
              defaultValue={d.name}
              onBlur={(e) => void run(() => renameSplitDay(d.id, e.target.value))}
              className="aur-touch aur-section min-w-0 flex-1 rounded-lg px-3"
              style={fieldStyle}
            />
            <button
              type="button"
              aria-label={`Move ${d.name} up`}
              disabled={i === 0}
              onClick={() => void run(() => moveSplitDay(d.id, -1))}
              className="aur-press aur-touch grid shrink-0 place-items-center rounded-lg"
              style={{ ...iconButtonStyle, opacity: i === 0 ? 0.35 : 1 }}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${d.name} down`}
              disabled={i === days.length - 1}
              onClick={() => void run(() => moveSplitDay(d.id, 1))}
              className="aur-press aur-touch grid shrink-0 place-items-center rounded-lg"
              style={{ ...iconButtonStyle, opacity: i === days.length - 1 ? 0.35 : 1 }}
            >
              ↓
            </button>
          </div>

          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {d.exercises.map((ex) => (
              <li key={ex.id} className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`ex-${ex.id}`}>
                  Exercise name
                </label>
                <input
                  id={`ex-${ex.id}`}
                  defaultValue={ex.name}
                  onBlur={(e) => void run(() => updateTemplateExercise(ex.id, { name: e.target.value }))}
                  className="aur-touch min-w-0 flex-1 rounded-lg px-3 text-body"
                  style={fieldStyle}
                />
                <label className="sr-only" htmlFor={`sets-${ex.id}`}>
                  Sets for {ex.name}
                </label>
                <input
                  id={`sets-${ex.id}`}
                  defaultValue={ex.sets}
                  inputMode="numeric"
                  aria-label={`Sets for ${ex.name}`}
                  onBlur={(e) =>
                    void run(() => updateTemplateExercise(ex.id, { sets: Number(e.target.value) || 1 }))
                  }
                  className="aur-touch aur-metric w-12 shrink-0 rounded-lg px-1 text-center"
                  style={fieldStyle}
                />
                <button
                  type="button"
                  aria-label={`Remove ${ex.name}`}
                  onClick={() => void run(() => removeTemplateExercise(ex.id))}
                  className="aur-press aur-touch grid shrink-0 place-items-center rounded-lg"
                  style={{ ...iconButtonStyle, color: "var(--aur-ink-muted)" }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-2">
            <label className="sr-only" htmlFor={`add-${d.id}`}>
              Add an exercise to {d.name}
            </label>
            <input
              id={`add-${d.id}`}
              value={adding[d.id] ?? ""}
              placeholder="Add an exercise"
              onChange={(e) => setAdding((a) => ({ ...a, [d.id]: e.target.value }))}
              className="aur-touch min-w-0 flex-1 rounded-lg px-3 text-body"
              style={fieldStyle}
            />
            <button
              type="button"
              disabled={!(adding[d.id] ?? "").trim()}
              onClick={() =>
                void run(async () => {
                  await addTemplateExercise(d.id, { name: adding[d.id] ?? "" });
                  setAdding((a) => ({ ...a, [d.id]: "" }));
                })
              }
              className="aur-press aur-touch shrink-0 rounded-full px-4 text-small font-medium"
              style={{
                background: (adding[d.id] ?? "").trim() ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                color: (adding[d.id] ?? "").trim() ? "var(--aur-night)" : "var(--aur-ink-muted)",
                border: "none",
              }}
            >
              Add
            </button>
          </div>

          {confirmDay === d.id ? (
            <div className="mt-3">
              <p className="aur-meta m-0">
                Remove {d.name} and its exercises? Sessions you already recorded keep their own
                copy and are not affected.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void run(async () => {
                      await removeSplitDay(d.id);
                      setConfirmDay(null);
                    })
                  }
                  className="aur-press aur-touch flex-1 rounded-full text-small font-medium"
                  style={{ background: "var(--aur-danger)", color: "var(--aur-night)", border: "none" }}
                >
                  Remove day
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDay(null)}
                  className="aur-press aur-touch flex-1 rounded-full text-small"
                  style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "1px solid var(--aur-glass-rim)" }}
                >
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDay(d.id)}
              className="aur-touch mt-2 text-small"
              style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)", padding: "0.25rem 0" }}
            >
              Remove this day
            </button>
          )}
        </section>
      ))}
    </div>
  );
}
