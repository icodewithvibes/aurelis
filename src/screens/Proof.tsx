/**
 * Proof (Stage 3) — the honest record. Every number here is derived by
 * the proof engine from the event log, never stored as truth and never
 * inflated: the crest tier, the exact kept count, the current run, this
 * week's completion, all-time records, and a chronological timeline.
 * No XP, no coins, no fabricated progress.
 */
import { motion } from "framer-motion";
import { ScreenSurface } from "../components/ScreenSurface";
import { ProofSystem } from "../components/ProofSystem";
import { useAsync } from "../hooks/useAsync";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { loadProof, loadTimeline } from "../features/proof/proofRepo";
import { Timeline } from "../components/Timeline";
import { loadExerciseHistory } from "../features/history/historyRepo";
import { Sparkline } from "../components/Sparkline";
import { useUiStore } from "../state/ui";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="aur-metric" style={{ fontSize: "var(--text-h2)" }}>{value}</span>
      <span className="aur-meta">{label}</span>
    </div>
  );
}

export function Proof() {
  const { data, loading } = useAsync(loadProof);
  const { data: history } = useAsync(loadExerciseHistory);
  const { data: timeline } = useAsync(loadTimeline);
  const units = useUiStore((s) => s.units);
  const reduce = useMotionDisabled();
  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  };

  const week = data?.week;
  const owed = !!week && week.obligations > 0;
  const weekPct = week ? Math.round(week.ratio * 100) : 0;

  return (
    <ScreenSurface labelledBy="proof-heading">
      <motion.header {...rise} className="pt-2">
        <h1 id="proof-heading" className="aur-title">Proof</h1>
        <p className="aur-date m-0 mt-1">A visible record of kept sessions.</p>
      </motion.header>

      {loading && <p className="mt-6 text-body" style={{ color: "var(--aur-ink-muted)" }}>Loading…</p>}

      {!loading && data && (
        <>
          <motion.section {...rise} className="mt-6" aria-label="Crest">
            <ProofSystem sessionsKept={data.keptCount} variant="hero" />
            {/* What actually moves this number, phrased against the
                user's own data rather than a generic rule. */}
            <p
              className="m-0 mx-auto mt-4 max-w-[19rem] text-center text-small"
              style={{ color: "var(--aur-ink-muted)" }}
            >
              {data.keptCount === 0
                ? "The crest is marked by kept days. Record one session and it begins."
                : data.crest.nextName
                  ? `The crest counts kept days, not workouts — several sessions in one day still count once. ${data.crest.toNext} more ${data.crest.toNext === 1 ? "day" : "days"} reaches ${data.crest.nextName}.`
                  : "Highest crest reached. It keeps counting because the record is the point, not the tier."}
            </p>
          </motion.section>

          <motion.section {...rise} className="mt-6 aur-chrome-surface p-5" aria-label="Records">
            <p className="aur-label m-0">Records</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Stat label="current run" value={String(data.streak)} />
              <Stat label="best run" value={String(data.bestStreak)} />
              <Stat label="workouts" value={String(data.totalWorkoutsCompleted)} />
            </div>

            <hr className="aur-hairline my-4" />

            <div className="flex items-baseline justify-between gap-3">
              <p className="aur-label m-0">This week</p>
              <span className="aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>
                {owed
                  ? `${week!.kept}/${week!.obligations} kept`
                  : `${week?.kept ?? 0} kept`}
              </span>
            </div>
            {owed && (
              <div
                className="relative mt-2 h-[3px] overflow-hidden rounded-full"
                role="img"
                aria-label={`${weekPct}% of this week's scheduled sessions kept`}
                style={{ background: "rgba(210,217,230,0.14)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${weekPct}%`,
                    background: "linear-gradient(90deg, var(--aur-cobalt-500), var(--aur-silver-200))",
                  }}
                />
              </div>
            )}
            <p className="aur-meta m-0 mt-2">
              {owed
                ? "Counts only days already owed — future days aren't held against you."
                : "Nothing was owed this week. Anything kept is a bonus."}
            </p>
          </motion.section>

          {/* Per-lift progress — drawn only from completed sets. */}
          {history && history.length > 0 && (
            <motion.section {...rise} className="mt-4 aur-chrome-surface p-5" aria-label="Per-lift progress">
              <p className="aur-label m-0">Per-lift progress</p>
              <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
                {history.slice(0, 8).map((h) => {
                  /*
                   * Say what actually happened, in the numbers that were
                   * logged.
                   *
                   * This line used to read "up 12 lb", which was the
                   * change in ESTIMATED one-rep max — a derived figure
                   * from a formula, for a lift nobody performed. It is a
                   * reasonable thing to plot and a confusing thing to
                   * lead with, because it is not a weight anyone put on
                   * a bar. The heaviest set is.
                   */
                  const first = h.points[0];
                  const heavier = h.latest.topWeight - first.topWeight;
                  const trend =
                    h.points.length < 2
                      ? "first time logged"
                      : heavier > 0
                        ? `up ${heavier} ${units} since ${first.date.slice(5)}`
                        : heavier < 0
                          ? `${Math.abs(heavier)} ${units} below your opener`
                          : "same top weight so far";
                  const best = h.best.topWeight > 0 ? `best ${h.best.topWeight} ${units}` : null;
                  return (
                    <li key={h.name} className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{h.name}</span>
                        <span className="aur-meta block">
                          {h.latest.topWeight > 0
                            ? `Last: ${h.latest.topWeight} ${units} × ${h.latest.bestReps}`
                            : `Last: ${h.latest.bestReps} reps`}
                          {best ? ` · ${best}` : ""}
                        </span>
                        <span className="aur-meta">
                          {h.sessions} {h.sessions === 1 ? "session" : "sessions"} · {trend}
                        </span>
                      </span>
                      <Sparkline
                        values={h.points.map((p) => p.topWeight || p.bestReps)}
                        label={`${h.name}: heaviest set across ${h.sessions} sessions, ${trend}`}
                      />
                    </li>
                  );
                })}
              </ul>
              <p className="aur-meta m-0 mt-3">
                Your heaviest completed set each day, and how it has moved. Nothing is estimated
                or extrapolated — these are weights you actually lifted.
              </p>
            </motion.section>
          )}

          <motion.section {...rise} className="mt-4 aur-chrome-surface p-5" aria-label="Timeline">
            <div className="flex items-baseline justify-between gap-3">
              <p className="aur-label m-0">Timeline</p>
              {timeline && timeline.length > 0 && (
                <span className="aur-meta">Press a day to open it</span>
              )}
            </div>
            {(!timeline || timeline.length === 0) && (
              <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                {data.totalWorkoutsCompleted === 0
                  ? "Nothing recorded yet. Your first kept session marks the crest."
                  : "No events on the timeline yet — they appear as you record sessions."}
              </p>
            )}
            {timeline && timeline.length > 0 && <Timeline days={timeline} units={units} />}
          </motion.section>
        </>
      )}
    </ScreenSurface>
  );
}
