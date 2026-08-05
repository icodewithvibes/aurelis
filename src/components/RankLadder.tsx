/**
 * The whole ladder, at a glance.
 *
 * A single tier name and a progress bar tells you where you are but not
 * where you are GOING, which is most of what makes a rank feel worth
 * chasing. Showing all seven turns an abstract number into a route:
 * three behind you, one you are standing on, three ahead.
 *
 * Earned tiers stay lit. That matters — the tiers you already passed are
 * the evidence, and dimming them would quietly imply the work expired.
 */
import { CrestEmblem } from "./CrestEmblem";
import type { CrestLevel } from "./ThresholdArch";
import { RANK_TIERS } from "../features/rank/rank";

interface RankLadderProps {
  level: CrestLevel;
  /** Current XP, so the next tier can show what it still costs. */
  xp: number;
}

export function RankLadder({ level, xp }: RankLadderProps) {
  return (
    <ol
      className="m-0 flex list-none items-end justify-between gap-1 p-0"
      aria-label="Rank ladder"
    >
      {RANK_TIERS.map((tier) => {
        const earned = tier.level <= level;
        const current = tier.level === level;
        const remaining = Math.max(0, tier.minXp - xp);

        return (
          <li
            key={tier.level}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
            aria-current={current ? "step" : undefined}
          >
            <div
              className="grid place-items-center rounded-full transition-opacity"
              style={{
                // The current tier is the only one that gets a ring, so
                // the eye lands on "you are here" before anything else.
                boxShadow: current ? "0 0 0 2px var(--aur-chrome)" : "none",
                padding: current ? 3 : 0,
                opacity: earned ? 1 : 0.28,
              }}
            >
              <CrestEmblem level={tier.level} size={current ? 34 : 26} />
            </div>
            <span
              className="aur-meta w-full truncate text-center leading-tight"
              style={{
                fontSize: "0.5625rem",
                opacity: earned ? 0.95 : 0.45,
              }}
              title={
                earned
                  ? tier.name
                  : `${tier.name} — ${remaining.toLocaleString()} XP away`
              }
            >
              {/* Only the first word: seven full names will not fit on a
                  390px screen, and "Prismatic" reads as clearly as
                  "Prismatic Crest" once the crest is right above it. */}
              {tier.name.split(" ")[0]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
