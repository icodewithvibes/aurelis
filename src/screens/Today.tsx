/**
 * Today — real Stage 2/3 home. Reads the active split from Dexie and
 * leads with ONE clear action:
 * - no split → invitation to import
 * - training day → today's scheduled day, primary; everything else demoted
 * - rest day → calm honored-rest state + what comes next
 * The time-of-day hero backplate is allowed here ONLY.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { ProofSystem } from "../components/ProofSystem";
import { useAsync } from "../hooks/useAsync";
import { loadHome } from "../data/access";
import { loadWeek } from "../features/planning/planningRepo";
import { WeekStrip } from "../components/WeekStrip";
import { LogActivity } from "../components/LogActivity";
import { startSession, pendingHalfSessions } from "../data/repositories/sessionRepo";
import { HalfSessionNote } from "../components/HalfSessionNote";
import { bandFor, greetingFor, subtitleFor, type GreetingInput } from "../features/training/greeting";
import { localDay } from "../lib/date";
import type { DayWithExercises } from "../data/repositories/splitRepo";

const LABEL_CLASS = "aur-label m-0";

export function Today() {
  const nav = useNavigate();
  const { data, loading } = useAsync(loadHome);
  const { data: week } = useAsync(loadWeek);
  const reduce = useMotionDisabled();
  const [showOthers, setShowOthers] = useState(false);
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

  const primary = data?.todayDay ?? null;
  const primaryState = primary ? data?.todaySessionByDay[primary.id] : undefined;
  const primaryDone = primaryState?.status === "completed";
  const others = data?.otherDays ?? [];

  /* A line that reacts to the day rather than three fixed strings. */
  const greetingInput: GreetingInput = {
    hasSplit: data?.hasSplit ?? false,
    isTrainingDay: data?.isTrainingDay ?? false,
    doneToday: primaryDone,
    streak: data?.streak ?? 0,
    keptCount: data?.sessionsKept ?? 0,
    localDate: localDay(),
    band: bandFor(),
  };
  const greeting = data ? greetingFor(greetingInput) : "";
  const subtitle = data ? subtitleFor(greetingInput) : null;

  // Asked once, never nagged: dismissing only has to last this mount,
  // because answering or declining removes it from the query anyway.
  const { data: halfSessions } = useAsync(pendingHalfSessions);
  const [dismissedHalf, setDismissedHalf] = useState<string[]>([]);
  const halfSession = halfSessions?.find((s) => !dismissedHalf.includes(s.id)) ?? null;

  return (
    <ScreenSurface backplate="hero" labelledBy="today-heading">
      <motion.header {...stagger(0)} className="flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="aur-date m-0">{data?.dateLabel ?? ""}</p>
          <h1
            id="today-heading"
            className="aur-display mt-1"
            style={{ textShadow: "0 1px 20px rgba(5,9,20,0.55)" }}
          >
            {greeting}
          </h1>
          {subtitle && (
            <p className="m-0 mt-1 text-small" style={{ color: "var(--aur-ink-faint)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {data && <ProofSystem xp={data.xp} variant="compact" />}
      </motion.header>

      <div className="flex-1" />

      {halfSession && (
        <HalfSessionNote
          session={halfSession}
          onDone={() => setDismissedHalf((ids) => [...ids, halfSession.id])}
        />
      )}

      <motion.section {...stagger(1)} data-tour="today-primary" aria-label="Today" className="aur-chrome-surface p-5">
        {loading && <p className="m-0 text-body" style={{ color: "var(--aur-ink-muted)" }}>Loading…</p>}

        {!loading && data && !data.hasSplit && (
          <>
            <p className={LABEL_CLASS}>No split yet</p>
            <h2 className="aur-heading mt-1">Import your program</h2>
            <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
              Paste a split in FORGE Split Format to know exactly what to train.
            </p>
            <button type="button" onClick={() => nav("/import")} className="aur-touch mt-4 w-full rounded-full text-body font-medium"
              style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none", padding: "0.875rem 1.5rem" }}>
              Import a split
            </button>
          </>
        )}

        {!loading && data?.hasSplit && (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className={LABEL_CLASS}>
                {primary ? "Today" : "Rest day"}
              </p>
              <span className="aur-metric truncate text-[0.6875rem]" style={{ color: "var(--aur-ink-muted)" }}>{data.splitName}</span>
            </div>

            {/* PRIMARY — the single action for today. */}
            {primary && (
              <>
                <h2 className="aur-heading mt-1">{primary.name}</h2>
                <p className="m-0 mt-1 text-small" style={{ color: "var(--aur-ink-muted)" }}>
                  {primary.exercises.length} exercises
                  {primaryDone ? " · kept today ✓" : ""}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    primaryDone && primaryState
                      ? nav(`/session/${primaryState.id}`)
                      : void start(primary)
                  }
                  className="aur-touch mt-4 w-full rounded-full text-body font-medium"
                  style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none", padding: "0.875rem 1.5rem" }}>
                  {primaryDone ? "Review or edit today's session" : primaryState ? `Resume ${primary.name}` : `Start ${primary.name}`}
                </button>
              </>
            )}

            {/* REST — calm, not a list of everything. */}
            {!primary && (
              <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                Nothing is scheduled today. Recovery is part of the work.
              </p>
            )}

            {data.nextUp && (
              <p className="m-0 mt-3 text-small" style={{ color: "var(--aur-ink-faint)" }}>
                Next: {data.nextUp.day.name}, {data.nextUp.label}
              </p>
            )}

            {/* Work done outside the split — a run on top of the session. */}
            <LogActivity />

            {/* The week ahead — one glance, no calendar grid. */}
            {week && week.ahead.length > 0 && (
              <div className="mt-4">
                <hr className="aur-hairline mb-3" />
                <p className="aur-label m-0 mb-2">The week ahead</p>
                <WeekStrip
                  days={week.ahead}
                  onSelect={(d) => {
                    if (d.sessionId) nav(`/session/${d.sessionId}`);
                    else nav("/train");
                  }}
                />
              </div>
            )}

            {/* SECONDARY — everything else, folded away. */}
            {others.length > 0 && (
              <>
                <button type="button" onClick={() => setShowOthers((v) => !v)} aria-expanded={showOthers}
                  className="aur-touch mt-3 w-full rounded-full text-small"
                  style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "1px solid rgba(210,217,230,0.14)" }}>
                  {showOthers ? "Hide other days" : primary ? "Or train something else" : "Train anyway"}
                </button>
                {showOthers && (
                  <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                    {others.map((d) => {
                      const s = data.todaySessionByDay[d.id];
                      return (
                        <li key={d.id}>
                          <button type="button" onClick={() => start(d)}
                            className="aur-touch flex w-full items-center justify-between rounded-xl px-4 py-3 text-left"
                            style={{ background: "rgba(210,217,230,0.06)", border: "1px solid rgba(210,217,230,0.1)", color: "var(--aur-ink)" }}>
                            <span>
                              <span className="block font-medium">{d.name}</span>
                              <span className="block text-small" style={{ color: "var(--aur-ink-muted)" }}>{d.exercises.length} exercises</span>
                            </span>
                            <span className="aur-metric text-small" style={{ color: s?.status === "completed" ? "var(--aur-success)" : "var(--aur-ink-muted)" }}>
                              {s?.status === "completed" ? "kept ✓" : s ? "resume" : "start"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </motion.section>
    </ScreenSurface>
  );
}
