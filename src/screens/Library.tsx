/**
 * Library — ready-made splits you can adopt in one tap.
 *
 * Each entry says who it is for and WHY it is built that way, because a
 * program you don't understand is one you abandon. Every exercise in
 * here resolves to a reference photo, so nothing is a mystery name.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { ExercisePreview } from "../components/ExercisePreview";
import { displayName } from "../features/exercises/displayName";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { commitImport } from "../features/asf/importSplit";
import {
  SPLIT_CATEGORIES,
  splitsByCategory,
  templateExerciseNames,
  type SplitCategory,
  type SplitTemplate,
} from "../features/splits/library";
import { parseASF } from "../features/asf/parse";

export function Library() {
  const nav = useNavigate();
  const reduce = useMotionDisabled();
  const [category, setCategory] = useState<SplitCategory>("lift");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);

  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  };

  async function adopt(t: SplitTemplate) {
    setAdopting(t.id);
    try {
      await commitImport(t.asf);
      nav("/train");
    } finally {
      setAdopting(null);
    }
  }

  return (
    <ScreenSurface labelledBy="library-heading">
      <motion.header {...rise} className="pt-2">
        <h1 id="library-heading" data-tour="split-library" className="aur-title">Split library</h1>
        <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
          Ready-made programs. Adopt one, then edit it however you like.
        </p>
      </motion.header>

      <motion.div {...rise} role="tablist" aria-label="Split category" className="mt-5 flex gap-2">
        {SPLIT_CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(c.key)}
              className="aur-press aur-touch flex flex-1 flex-col items-center rounded-xl px-2 py-2"
              style={{
                background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                color: active ? "var(--aur-night)" : "var(--aur-ink)",
                border: "1px solid var(--aur-glass-rim)",
              }}
            >
              <span className="text-small font-medium">{c.label}</span>
              <span
                className="text-[0.625rem] leading-tight"
                style={{ color: active ? "rgba(7,12,24,0.72)" : "var(--aur-ink-muted)" }}
              >
                {c.blurb}
              </span>
            </button>
          );
        })}
      </motion.div>

      <div className="mt-4 flex flex-col gap-4">
        {splitsByCategory(category).map((t) => {
          const open = expanded === t.id;
          const days = parseASF(t.asf).program.days;
          return (
            <motion.section key={t.id} {...rise} className="aur-chrome-surface p-4" aria-label={t.name}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="aur-section">{t.name}</h2>
                <span className="aur-metric shrink-0 text-small" style={{ color: "var(--aur-ink-muted)" }}>
                  {t.daysPerWeek}×/week
                </span>
              </div>
              <p className="m-0 mt-1 text-body">{t.summary}</p>

              <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
                <li>
                  <span className="rounded-full px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.12em]"
                    style={{ background: "var(--aur-glass-tint)", color: "var(--aur-ink-muted)" }}>
                    {t.level}
                  </span>
                </li>
                {t.targets.map((m) => (
                  <li key={m}>
                    <span className="rounded-full px-2 py-0.5 text-[0.625rem]"
                      style={{ background: "var(--aur-glass-tint)", color: "var(--aur-ink-muted)" }}>
                      {m}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="m-0 mt-3 text-small" style={{ color: "var(--aur-ink-muted)" }}>
                {t.rationale}
              </p>

              <button
                type="button"
                aria-expanded={open}
                onClick={() => setExpanded(open ? null : t.id)}
                className="aur-touch mt-2 text-small"
                style={{ background: "transparent", border: "none", color: "var(--aur-ink)", padding: "0.25rem 0" }}
              >
                {open ? "Hide the sessions" : `See all ${days.length} sessions`}
              </button>

              {open && (
                <div className="mt-2 flex flex-col gap-3">
                  {days.map((d) => (
                    <div key={d.name}>
                      <p className="aur-label m-0">{d.name}</p>
                      <ul className="m-0 mt-1 flex list-none flex-col gap-2 p-0">
                        {d.exercises.map((e) => (
                          <li key={e.name}>
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="min-w-0 truncate text-small">{displayName(e.name)}</span>
                              <span className="aur-metric shrink-0 text-small" style={{ color: "var(--aur-ink-muted)" }}>
                                {e.sets}×{e.repMin ?? "?"}–{e.repMax ?? "?"}
                              </span>
                            </div>
                            <ExercisePreview name={e.name} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p className="aur-meta m-0">
                    {templateExerciseNames(t).length} exercises · reference photos from the public-domain
                    free-exercise-db
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => void adopt(t)}
                disabled={adopting !== null}
                className="aur-press aur-touch mt-3 w-full rounded-full text-body font-medium"
                style={{
                  background: "var(--aur-chrome-50)",
                  color: "var(--aur-night)",
                  border: "none",
                  padding: "0.875rem 1.5rem",
                  opacity: adopting === t.id ? 0.6 : 1,
                }}
              >
                {adopting === t.id ? "Setting it up…" : `Use ${t.name}`}
              </button>
            </motion.section>
          );
        })}
      </div>

      <p className="aur-meta m-0 mt-4">
        Adopting a split replaces your current one. Your recorded sessions are never touched.
      </p>
    </ScreenSurface>
  );
}
