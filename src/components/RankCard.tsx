/**
 * The rank card.
 *
 * Shows the tier, the progress toward the next one, and — always, not
 * behind a tap — the arithmetic that produced the number. A rank you
 * cannot audit is a rank you cannot trust, and the entire argument for
 * this ladder is that it is earned rather than issued.
 */
import type { RankBreakdown, RankState } from "../features/rank/rank";

interface RankCardProps {
  state: RankState;
  breakdown: RankBreakdown[];
}

export function RankCard({ state, breakdown }: RankCardProps) {
  const pct = Math.round(state.progress * 100);
  const earned = breakdown.filter((row) => row.count > 0);

  return (
    <div className="aur-glass rounded-2xl p-4" aria-label="Rank">
      <div className="flex items-baseline justify-between gap-3">
        <span className="aur-meta">Rank</span>
        <span className="aur-metric" style={{ fontSize: "var(--text-h3)" }}>
          {state.name}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="aur-metric" style={{ fontSize: "var(--text-h1)" }}>
          {state.xp.toLocaleString()}
        </span>
        <span className="aur-meta">XP</span>
      </div>

      {state.nextName ? (
        <>
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "var(--aur-hairline)" }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to ${state.nextName}`}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: "var(--aur-chrome)" }}
            />
          </div>
          <p className="aur-meta mt-2">
            {state.toNext.toLocaleString()} XP to {state.nextName}.
          </p>
        </>
      ) : (
        <p className="aur-meta mt-3">
          Highest rank reached. It keeps counting, because the record is the point.
        </p>
      )}

      {earned.length > 0 && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--aur-hairline)" }}>
          <p className="aur-meta mb-2">Where this came from</p>
          <ul className="flex flex-col gap-1">
            {earned.map((row) => (
              <li key={row.label} className="flex items-baseline justify-between gap-3">
                <span className="aur-meta">
                  {row.label} · {row.count.toLocaleString()}
                </span>
                <span className="aur-metric text-[0.8125rem]">
                  +{row.xp.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="aur-meta mt-3" style={{ opacity: 0.75 }}>
        Rank comes from days kept and your own progress. The weight you lift is
        never scored, so nobody can type their way up the ladder.
      </p>
    </div>
  );
}
