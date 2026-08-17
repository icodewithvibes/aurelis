/**
 * ExercisePicker — adding to your split without knowing the exact name.
 *
 * The old add field was a bare text box. Whatever you typed became an
 * exercise, so "incline db press" went in as "incline db press" and then
 * matched no reference photo, no muscle data and no coverage group —
 * the split silently got worse at everything the app does for you, and
 * nothing said so.
 *
 * So: browse by muscle when you don't know what you want, search when
 * you do, and free text still works because it is your program and you
 * are allowed to write "Sled Push" in it. Movements FORGE has art for
 * are offered first and marked, because those are the ones the rest of
 * the app can actually reason about.
 */
import { useEffect, useMemo, useState } from "react";
import { GROUP_LABEL, type CoverageGroup } from "../features/training/coverage";
import { MOVEMENTS } from "../features/training/substitutions";
import {
  loadExerciseIndex,
  normalizeName,
  type ExerciseInfo,
} from "../features/exercises/exerciseDb";
import { displayName } from "../features/exercises/displayName";

interface ExercisePickerProps {
  onPick: (name: string) => void | Promise<void>;
  /** Labels the field for screen readers; each day has its own picker. */
  id: string;
  placeholder?: string;
}

const GROUP_ORDER: CoverageGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "abs", "lowerBack", "quads", "hamstrings", "glutes", "calves",
];

export function ExercisePicker({ onPick, id, placeholder = "Add an exercise" }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<CoverageGroup | null>(null);
  const [index, setIndex] = useState<ExerciseInfo[] | null>(null);

  // The full 873-movement index is only worth downloading once someone
  // is actually searching for something outside our own pool.
  useEffect(() => {
    if (query.trim().length < 2 || index) return;
    let alive = true;
    void loadExerciseIndex().then((i) => alive && setIndex(i));
    return () => {
      alive = false;
    };
  }, [query, index]);

  const suggestions = useMemo(() => {
    const q = normalizeName(query);
    if (!q) {
      return group ? MOVEMENTS.filter((m) => m.group === group).map((m) => m.name) : [];
    }
    const ours = MOVEMENTS.filter((m) => normalizeName(m.name).includes(q)).map((m) => m.name);
    const theirs = (index ?? [])
      .filter((e) => e.k.includes(q))
      .map((e) => e.n)
      .filter((n) => !ours.includes(n));
    return [...ours, ...theirs].slice(0, 8);
  }, [query, group, index]);

  async function pick(name: string) {
    setQuery("");
    setGroup(null);
    await onPick(name);
  }

  const typed = query.trim();
  const exactlyTyped = suggestions.some((s) => normalizeName(s) === normalizeName(typed));

  return (
    <div className="mt-3">
      <label className="sr-only" htmlFor={id}>
        {placeholder}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          className="aur-touch min-w-0 flex-1 rounded-lg px-3 text-body"
          style={{
            height: 44,
            color: "var(--aur-ink)",
            background: "rgba(7,12,24,0.55)",
            border: "1px solid var(--aur-glass-rim)",
          }}
        />
        <button
          type="button"
          disabled={!typed}
          onClick={() => void pick(typed)}
          className="aur-press aur-touch shrink-0 rounded-full px-4 text-small font-medium"
          style={{
            background: typed ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
            color: typed ? "var(--aur-night)" : "var(--aur-ink-muted)",
            border: "none",
          }}
        >
          Add
        </button>
      </div>

      {/* Empty field, no idea what to add: pick the muscle instead. */}
      {!typed && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Browse movements by muscle">
          {GROUP_ORDER.map((g) => {
            const active = group === g;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={active}
                onClick={() => setGroup(active ? null : g)}
                className="aur-press rounded-full px-3 text-small"
                style={{
                  minHeight: 36,
                  background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                  color: active ? "var(--aur-night)" : "var(--aur-ink-muted)",
                  border: "1px solid var(--aur-glass-rim)",
                }}
              >
                {GROUP_LABEL[g]}
              </button>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => void pick(name)}
                className="aur-press w-full rounded-lg px-3 py-2 text-left text-small"
                style={{
                  minHeight: 44,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--aur-hairline)",
                  color: "var(--aur-ink)",
                }}
              >
                {displayName(name)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Your program, your names. Typing something we've never heard of
          is allowed — it just won't have a photo. */}
      {typed.length >= 2 && !exactlyTyped && (
        <p className="aur-meta m-0 mt-2">
          Nothing here has to match — tap Add to put “{typed}” in as written.
        </p>
      )}
    </div>
  );
}
