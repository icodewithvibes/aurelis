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
import { loadProof } from "../features/proof/proofRepo";
import type { ProofEventRow } from "../data/db";

const EVENT_LABEL: Record<ProofEventRow["type"], string> = {
  workout: "Session kept",
  forge: "Forge",
  pr: "New best",
  recovery: "Recovery honored",
  crest_levelup: "Crest advanced",
};

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

          <motion.section {...rise} className="mt-4 aur-chrome-surface p-5" aria-label="Timeline">
            <p className="aur-label m-0">Timeline</p>
            {data.timeline.length === 0 && (
              <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                Nothing recorded yet. Your first kept session marks the crest.
              </p>
            )}
            <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
              {data.timeline.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-medium">{e.title}</span>
                    <span className="aur-meta">
                      {EVENT_LABEL[e.type]}
                      {e.summary ? ` · ${e.summary}` : ""}
                    </span>
                  </span>
                  <span className="aur-metric shrink-0 text-small" style={{ color: "var(--aur-ink-faint)" }}>
                    {e.dateLocal.slice(5)}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        </>
      )}
    </ScreenSurface>
  );
}
