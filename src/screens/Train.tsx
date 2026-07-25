/**
 * Train — the active split (Stage 2). Shows each day and its exercises,
 * lets you start/resume logging a day, and import/replace the split.
 * Reads real data from Dexie; honest empty state when no split exists.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { useAsync } from "../hooks/useAsync";
import { loadHome } from "../data/access";
import { startSession } from "../data/repositories/sessionRepo";
import type { DayWithExercises } from "../data/repositories/splitRepo";

export function Train() {
  const nav = useNavigate();
  const { data, loading } = useAsync(loadHome);
  const reduce = useReducedMotion();
  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  };

  async function start(day: DayWithExercises) {
    const sid = await startSession(day);
    nav(`/session/${sid}`);
  }

  return (
    <ScreenSurface labelledBy="train-heading">
      <motion.header {...rise} className="flex items-start justify-between gap-3 pt-2">
        <div>
          <h1 id="train-heading" className="aur-title">Train</h1>
          {data?.hasSplit && <p className="aur-date m-0 mt-1">{data.splitName}</p>}
        </div>
        <button type="button" onClick={() => nav("/import")} className="aur-touch rounded-full px-4 text-small"
          style={{ background: "rgba(210,217,230,0.1)", color: "var(--aur-ink)", border: "none" }}>
          {data?.hasSplit ? "Replace" : "Import"}
        </button>
      </motion.header>

      {loading && <p className="mt-6 text-body" style={{ color: "var(--aur-ink-muted)" }}>Loading…</p>}

      {!loading && data && !data.hasSplit && (
        <motion.section {...rise} className="mt-6 aur-chrome-surface p-5">
          <p className="m-0 text-[0.6875rem] uppercase tracking-[0.18em]" style={{ color: "var(--aur-ink-muted)" }}>No split yet</p>
          <p className="m-0 mt-2 text-body">Import a program in AURELIS Split Format to begin.</p>
          <button type="button" onClick={() => nav("/import")} className="aur-touch mt-4 w-full rounded-full text-body font-medium"
            style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none", padding: "0.875rem 1.5rem" }}>
            Import a split
          </button>
        </motion.section>
      )}

      {!loading && data?.hasSplit && (
        <div className="mt-5 flex flex-col gap-4">
          {data.days.map((d) => (
            <motion.section key={d.id} {...rise} className="aur-chrome-surface p-4" aria-label={d.name}>
              <div className="flex items-center justify-between">
                <h2 className="m-0" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h2)", fontWeight: 500 }}>{d.name}</h2>
                <button type="button" onClick={() => start(d)} className="aur-touch rounded-full px-4 text-small font-medium"
                  style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none" }}>
                  {data.todaySessionByDay[d.id] ? "Resume" : "Start"}
                </button>
              </div>
              <hr className="aur-hairline my-3" />
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {d.exercises.map((ex) => (
                  <li key={ex.id} className="flex items-baseline justify-between gap-3">
                    <span className="text-body">{ex.name}</span>
                    <span className="whitespace-nowrap font-mono text-small" style={{ color: "var(--aur-ink-muted)" }}>
                      {ex.sets}×{ex.repScheme === "amrap" ? "AMRAP" : ex.repMin === ex.repMax ? ex.repMin : `${ex.repMin}-${ex.repMax}`}
                      {ex.rpeMin ? ` · RPE ${ex.rpeMin}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>
      )}
    </ScreenSurface>
  );
}
