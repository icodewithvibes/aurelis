/**
 * Train — the active split (Stage 2). Shows each day and its exercises,
 * lets you start/resume logging a day, and import/replace the split.
 * Reads real data from Dexie; honest empty state when no split exists.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { SplitEditor } from "../components/SplitEditor";
import { SorenessCheck } from "../components/SorenessCheck";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { useAsync } from "../hooks/useAsync";
import { loadHome } from "../data/access";
import { loadWeek } from "../features/planning/planningRepo";
import { WeekStrip } from "../components/WeekStrip";
import { STATUS_LABEL } from "../features/planning/week";
import { startSession } from "../data/repositories/sessionRepo";
import type { DayWithExercises } from "../data/repositories/splitRepo";

export function Train() {
  const nav = useNavigate();
  const { data, loading, reload } = useAsync(loadHome);
  const { data: week, reload: reloadWeek } = useAsync(loadWeek);
  const [editing, setEditing] = useState(false);
  const reduce = useMotionDisabled();

  /** After any split edit, re-read both views so nothing goes stale. */
  const refresh = () => {
    reload();
    reloadWeek();
  };
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
        <div className="flex shrink-0 gap-2">
          {data?.hasSplit && (
            <button type="button" onClick={() => setEditing((v) => !v)} aria-pressed={editing}
              className="aur-press aur-touch rounded-full px-4 text-small"
              style={{
                background: editing ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                color: editing ? "var(--aur-night)" : "var(--aur-ink)",
                border: "1px solid var(--aur-glass-rim)",
              }}>
              {editing ? "Done" : "Edit"}
            </button>
          )}
          <button type="button" onClick={() => nav("/library")} className="aur-press aur-touch rounded-full px-4 text-small"
            style={{ background: "var(--aur-glass-tint)", color: "var(--aur-ink)", border: "1px solid var(--aur-glass-rim)" }}>
            Library
          </button>
        </div>
      </motion.header>

      {loading && <p className="mt-6 text-body" style={{ color: "var(--aur-ink-muted)" }}>Loading…</p>}

      {/* How the last seven days actually went — from the record only. */}
      {!loading && week?.hasSplit && (
        <motion.section {...rise} className="mt-5 aur-chrome-surface p-4" aria-label="This week">
          <div className="flex items-baseline justify-between gap-3">
            <p className="aur-label m-0">Last seven days</p>
            <span className="aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>
              {week.summary.kept} kept
            </span>
          </div>
          <div className="mt-3">
            <WeekStrip
              days={week.trailing}
              onSelect={(d) => d.sessionId && nav(`/session/${d.sessionId}`)}
            />
          </div>
          <p className="aur-meta m-0 mt-3">
            {week.summary.open > 0
              ? `${week.summary.open} scheduled ${week.summary.open === 1 ? "day" : "days"} ${STATUS_LABEL.open}. Pick it up whenever — the next session is still there.`
              : "Everything scheduled this week is on the record."}
          </p>
        </motion.section>
      )}

      {!loading && data && !data.hasSplit && (
        <motion.section {...rise} className="mt-6 aur-chrome-surface p-5">
          <p className="aur-label m-0">No split yet</p>
          <p className="m-0 mt-2 text-body">
            Pick a ready-made program, or paste your own in FORGE Split Format.
          </p>
          <button type="button" onClick={() => nav("/library")} className="aur-press aur-touch mt-4 w-full rounded-full text-body font-medium"
            style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none", padding: "0.875rem 1.5rem" }}>
            Browse the split library
          </button>
          <button type="button" onClick={() => nav("/import")} className="aur-press aur-touch mt-2 w-full rounded-full text-body"
            style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "1px solid var(--aur-glass-rim)", padding: "0.875rem 1.5rem" }}>
            Paste my own split
          </button>
        </motion.section>
      )}

      {!loading && data?.hasSplit && !editing && (
        <SorenessCheck days={data.days} onStart={(d) => void start(d)} />
      )}

      {!loading && data?.hasSplit && editing && (
        <>
          <p className="aur-meta m-0 mt-5">
            Rename, reorder, or change any exercise. Sessions you already recorded keep their own
            copy and never change.
          </p>
          <SplitEditor days={data.days} onChanged={refresh} />
        </>
      )}

      {!loading && data?.hasSplit && !editing && (
        <div className="mt-5 flex flex-col gap-4">
          {data.days.map((d) => (
            <motion.section key={d.id} {...rise} className="aur-chrome-surface p-4" aria-label={d.name}>
              <div className="flex items-center justify-between">
                <h2 className="aur-section flex items-baseline gap-2">
                  {d.name}
                  {d.id === data.todayDay?.id && (
                    <span className="rounded-full px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.14em]"
                      style={{ background: "rgba(210,217,230,0.12)", color: "var(--aur-ink-muted)" }}>
                      Today
                    </span>
                  )}
                  {d.id === data.nextUp?.day.id && d.id !== data.todayDay?.id && (
                    <span className="rounded-full px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.14em]"
                      style={{ background: "rgba(210,217,230,0.06)", color: "var(--aur-ink-faint)" }}>
                      {data.nextUp.label}
                    </span>
                  )}
                </h2>
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
                    <span className="aur-metric whitespace-nowrap text-small" style={{ color: "var(--aur-ink-muted)" }}>
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
