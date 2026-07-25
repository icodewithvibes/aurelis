/**
 * Today — real Stage 2 home. Reads the active split from Dexie:
 * - no split → invitation to import
 * - split + training day → today's day list to start logging
 * - split + rest day → calm rest state
 * Meadow backplate (approved Group 2) is allowed here ONLY.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { ProofSystem } from "../components/ProofSystem";
import { useAsync } from "../hooks/useAsync";
import { loadHome } from "../data/access";
import { startSession } from "../data/repositories/sessionRepo";
import type { DayWithExercises } from "../data/repositories/splitRepo";

export function Today() {
  const nav = useNavigate();
  const { data, loading } = useAsync(loadHome);
  const reduce = useReducedMotion();
  const stagger = (i: number) =>
    reduce ? {} : {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
    };

  async function start(day: DayWithExercises) {
    const sid = await startSession(day);
    nav(`/session/${sid}`);
  }

  return (
    <ScreenSurface backplate="meadow" labelledBy="today-heading">
      <motion.header {...stagger(0)} className="flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="m-0 text-small" style={{ color: "var(--aur-ink-muted)" }}>{data?.dateLabel ?? ""}</p>
          <h1 id="today-heading" className="m-0 mt-1" style={{
            fontFamily: "var(--font-display)", fontSize: "var(--text-display)", fontWeight: 470,
            lineHeight: 1.12, letterSpacing: "-0.025em", textShadow: "0 1px 20px rgba(5,9,20,0.55)",
          }}>
            {!data?.hasSplit ? "Begin." : data.isTrainingDay ? "A training day." : "Rest, honored."}
          </h1>
        </div>
        {data && <ProofSystem sessionsKept={data.sessionsKept} variant="compact" />}
      </motion.header>

      <div className="flex-1" />

      <motion.section {...stagger(1)} aria-label="Today" className="aur-chrome-surface p-5">
        {loading && <p className="m-0 text-body" style={{ color: "var(--aur-ink-muted)" }}>Loading…</p>}

        {!loading && data && !data.hasSplit && (
          <>
            <p className="m-0 text-[0.6875rem] uppercase tracking-[0.18em]" style={{ color: "var(--aur-ink-muted)" }}>No split yet</p>
            <h2 className="m-0 mt-1" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h1)", fontWeight: 500 }}>Import your program</h2>
            <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
              Paste a split in AURELIS Split Format to know exactly what to train.
            </p>
            <button type="button" onClick={() => nav("/import")} className="aur-touch mt-4 w-full rounded-full text-body font-medium"
              style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none", padding: "0.875rem 1.5rem" }}>
              Import a split
            </button>
          </>
        )}

        {!loading && data && data.hasSplit && (
          <>
            <div className="flex items-center justify-between">
              <p className="m-0 text-[0.6875rem] uppercase tracking-[0.18em]" style={{ color: "var(--aur-ink-muted)" }}>
                {data.isTrainingDay ? "Scheduled today" : "Your split"}
              </p>
              <span className="font-mono text-[0.6875rem]" style={{ color: "var(--aur-ink-muted)" }}>{data.splitName}</span>
            </div>
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {data.days.map((d) => {
                const done = data.todaySessionByDay[d.id]?.status === "completed";
                return (
                  <li key={d.id}>
                    <button type="button" onClick={() => start(d)}
                      className="aur-touch flex w-full items-center justify-between rounded-xl px-4 py-3 text-left"
                      style={{ background: "rgba(210,217,230,0.06)", border: "1px solid rgba(210,217,230,0.1)", color: "var(--aur-ink)" }}>
                      <span>
                        <span className="block font-medium">{d.name}</span>
                        <span className="block text-small" style={{ color: "var(--aur-ink-muted)" }}>{d.exercises.length} exercises</span>
                      </span>
                      <span className="font-mono text-small" style={{ color: done ? "var(--aur-success)" : "var(--aur-ink-muted)" }}>
                        {done ? "kept ✓" : data.todaySessionByDay[d.id] ? "resume" : "start"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!data.isTrainingDay && (
              <p className="m-0 mt-3 text-[0.6875rem]" style={{ color: "var(--aur-ink-faint)" }}>
                Not scheduled today — training any day still counts.
              </p>
            )}
          </>
        )}
      </motion.section>
    </ScreenSurface>
  );
}
