/**
 * SorenessCheck (Stage 6) — "what's sore?" → "train this instead", or
 * "that's fine, train it anyway, here's why".
 *
 * Deliberately ephemeral: nothing is stored. Soreness is a snapshot of
 * right now, and a stale record of last Tuesday's sore quads would be
 * worse than no record. It reads your actual split and answers from it.
 */
import { useMemo, useState } from "react";
import type { DayWithExercises } from "../data/repositories/splitRepo";
import {
  adviseForSoreness,
  inferMuscleGroups,
  MUSCLE_GROUPS,
  type MuscleGroup,
  type Severity,
  type SorenessDay,
} from "../features/training/soreness";

const SEVERITIES: { value: Severity; label: string; hint: string }[] = [
  { value: "mild", label: "Mild", hint: "Noticeable" },
  { value: "moderate", label: "Moderate", hint: "Stiff" },
  { value: "severe", label: "Severe", hint: "Hurts to move" },
];

interface SorenessCheckProps {
  days: DayWithExercises[];
  onStart: (day: DayWithExercises) => void;
}

export function SorenessCheck({ days, onStart }: SorenessCheckProps) {
  const [open, setOpen] = useState(false);
  const [sore, setSore] = useState<MuscleGroup[]>([]);
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [isPain, setIsPain] = useState(false);

  const mapped: SorenessDay[] = useMemo(
    () =>
      days.map((d, i) => ({
        dayIndex: i,
        name: d.name,
        groups: inferMuscleGroups(d.exercises.map((e) => e.name)),
      })),
    [days],
  );

  const advice = useMemo(
    () => adviseForSoreness({ sore, severity, days: mapped, isPain }),
    [sore, severity, mapped, isPain],
  );

  const toggle = (g: MuscleGroup) =>
    setSore((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));

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
        Feeling sore? Find what to train
      </button>
    );
  }

  return (
    <section className="mt-4 aur-chrome-surface p-4" aria-label="Soreness check">
      <div className="flex items-baseline justify-between gap-3">
        <p className="aur-label m-0">What&apos;s sore?</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="aur-touch text-small"
          style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)" }}
        >
          Close
        </button>
      </div>

      <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
        {MUSCLE_GROUPS.map((g) => {
          const active = sore.includes(g.key);
          return (
            <li key={g.key}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggle(g.key)}
                className="aur-press aur-touch rounded-full px-3 text-small"
                style={{
                  background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                  color: active ? "var(--aur-night)" : "var(--aur-ink)",
                  border: "1px solid var(--aur-glass-rim)",
                }}
              >
                {g.label}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="aur-label m-0 mt-4">How bad?</p>
      <div role="radiogroup" aria-label="Soreness severity" className="mt-2 flex gap-2">
        {SEVERITIES.map((s) => {
          const active = severity === s.value;
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSeverity(s.value)}
              className="aur-press aur-touch flex flex-1 flex-col items-center rounded-xl py-2"
              style={{
                background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                color: active ? "var(--aur-night)" : "var(--aur-ink)",
                border: "1px solid var(--aur-glass-rim)",
              }}
            >
              <span className="text-small font-medium">{s.label}</span>
              <span
                className="text-[0.625rem]"
                style={{ color: active ? "rgba(7,12,24,0.7)" : "var(--aur-ink-muted)" }}
              >
                {s.hint}
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-3 flex items-center gap-3 text-small">
        <input
          type="checkbox"
          checked={isPain}
          onChange={(e) => setIsPain(e.target.checked)}
          style={{ width: 22, height: 22 }}
        />
        <span>It&apos;s sharp or joint pain, not muscle soreness</span>
      </label>

      {/* The answer. */}
      <div
        className="mt-4 rounded-xl p-4"
        style={{ background: "var(--aur-glass-tint)", border: "1px solid var(--aur-glass-rim)" }}
      >
        <p className="m-0 text-body font-medium">{advice.headline}</p>
        <p className="m-0 mt-2 text-small" style={{ color: "var(--aur-ink-muted)" }}>
          {advice.detail}
        </p>

        {advice.recommended && (
          <button
            type="button"
            onClick={() => onStart(days[advice.recommended!.dayIndex])}
            className="aur-press aur-touch mt-3 w-full rounded-full text-body font-medium"
            style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none", padding: "0.75rem 1.25rem" }}
          >
            Start {advice.recommended.name}
          </button>
        )}

        {advice.clear.length > 0 && sore.length > 0 && !advice.trainAnyway && (
          <p className="aur-meta m-0 mt-2">
            Clear today: {advice.clear.map((d) => d.name).join(" · ")}
          </p>
        )}
      </div>

      <p className="aur-meta m-0 mt-3">
        General training guidance, not medical advice. FORGE never diagnoses anything.
      </p>
    </section>
  );
}
