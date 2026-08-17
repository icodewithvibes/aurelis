/**
 * SplitEditor (Stage 5) — rename, reorder and edit an imported split.
 *
 * Import stops being a one-way door: a program can be corrected in place
 * without re-pasting it. Every write is local and immediate, and none of
 * it touches history — sessions snapshot their day when they start, so
 * past workouts keep the exercises they were actually performed with.
 *
 * Three things this could not do until now, all of which sent people
 * back to re-importing the whole program: add a day, move an exercise
 * within its day, and replace an exercise your gym hasn't got the kit
 * for. Order inside a day matters — the first movement gets the effort
 * the last one doesn't — so reordering exercises is not cosmetic.
 */
import { useState } from "react";
import type { DayWithExercises } from "../data/repositories/splitRepo";
import {
  addSplitDay,
  addTemplateExercise,
  moveSplitDay,
  moveTemplateExercise,
  removeSplitDay,
  removeTemplateExercise,
  renameSplitDay,
  updateTemplateExercise,
} from "../data/repositories/splitRepo";
import { ExercisePicker } from "./ExercisePicker";
import { alternativesFor } from "../features/training/substitutions";
import { displayName } from "../features/exercises/displayName";

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
  const [swapping, setSwapping] = useState<string | null>(null);
  const [newDay, setNewDay] = useState("");
  const splitId = days[0]?.splitId ?? null;

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

          <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
            {d.exercises.map((ex, xi) => (
              <li key={ex.id}>
                <div className="flex items-center gap-2">
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
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Move ${ex.name} up`}
                    disabled={xi === 0}
                    onClick={() => void run(() => moveTemplateExercise(ex.id, -1))}
                    className="aur-press grid place-items-center rounded-lg"
                    style={{ ...iconButtonStyle, width: 36, height: 36, opacity: xi === 0 ? 0.35 : 1 }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${ex.name} down`}
                    disabled={xi === d.exercises.length - 1}
                    onClick={() => void run(() => moveTemplateExercise(ex.id, 1))}
                    className="aur-press grid place-items-center rounded-lg"
                    style={{
                      ...iconButtonStyle,
                      width: 36,
                      height: 36,
                      opacity: xi === d.exercises.length - 1 ? 0.35 : 1,
                    }}
                  >
                    ↓
                  </button>
                  {/* The permanent version of the in-session swap: this
                      gym hasn't got it, so stop programming it. */}
                  <button
                    type="button"
                    aria-expanded={swapping === ex.id}
                    onClick={() => setSwapping(swapping === ex.id ? null : ex.id)}
                    className="aur-touch text-small"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--aur-ink-muted)",
                      padding: "0.25rem 0",
                    }}
                  >
                    {swapping === ex.id ? "Never mind" : "Replace it"}
                  </button>
                </div>

                {swapping === ex.id && (
                  <SwapOptions
                    name={ex.name}
                    onPick={(name) =>
                      void run(async () => {
                        await updateTemplateExercise(ex.id, { name });
                        setSwapping(null);
                      })
                    }
                  />
                )}
              </li>
            ))}
          </ul>

          <ExercisePicker
            id={`add-${d.id}`}
            placeholder={`Add to ${d.name}`}
            onPick={(name) => run(() => addTemplateExercise(d.id, { name }))}
          />

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

      {/* Days could be removed but never added, which made shrinking a
          program permanent. */}
      {splitId && (
        <section className="aur-chrome-surface p-4" aria-label="Add a day">
          <p className="aur-label m-0">Add a day</p>
          <div className="mt-2 flex items-center gap-2">
            <label className="sr-only" htmlFor="new-day-name">
              Name of the new day
            </label>
            <input
              id="new-day-name"
              value={newDay}
              placeholder="Arms, Legs B, Conditioning…"
              onChange={(e) => setNewDay(e.target.value)}
              className="aur-touch min-w-0 flex-1 rounded-lg px-3 text-body"
              style={fieldStyle}
            />
            <button
              type="button"
              disabled={!newDay.trim()}
              onClick={() =>
                void run(async () => {
                  await addSplitDay(splitId, newDay);
                  setNewDay("");
                })
              }
              className="aur-press aur-touch shrink-0 rounded-full px-4 text-small font-medium"
              style={{
                background: newDay.trim() ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                color: newDay.trim() ? "var(--aur-night)" : "var(--aur-ink-muted)",
                border: "none",
              }}
            >
              Add day
            </button>
          </div>
          <p className="aur-meta m-0 mt-2">
            Your week rotates through the days in order, so adding one changes which session lands
            on which weekday from here on.
          </p>
        </section>
      )}
    </div>
  );
}

/** Same engine the in-session swap uses, minus the "it's taken" case —
    nothing is taken while you're editing a program at home. */
function SwapOptions({ name, onPick }: { name: string; onPick: (name: string) => void }) {
  const options = alternativesFor(name, "noKit", 4);
  if (options.length === 0) {
    return (
      <p className="aur-meta m-0 mt-2">
        Nothing close enough to suggest for this one — type over the name instead.
      </p>
    );
  }
  return (
    <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
      {options.map((o) => (
        <li key={o.name}>
          <button
            type="button"
            onClick={() => onPick(o.name)}
            className="aur-press w-full rounded-lg px-3 py-2 text-left"
            style={{
              minHeight: 44,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--aur-hairline)",
              color: "var(--aur-ink)",
            }}
          >
            <span className="block text-small">{displayName(o.name)}</span>
            <span className="aur-meta block">{o.why}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
