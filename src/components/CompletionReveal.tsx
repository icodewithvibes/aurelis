/**
 * CompletionReveal (Stage 3) — the 450–650ms ceremony after proof is
 * recorded (docs/stage-3-product-and-ux-plan.md §1.5, 03_assets/10).
 *
 * Contract:
 * - Everything is ALREADY persisted before this mounts. The animation is
 *   decoration over a fact, never a promise of one.
 * - Sequence: silver edge-light trace → the crest resolves → one
 *   restrained prismatic glint. A tier crossing adds a ~900ms flourish.
 * - Skippable and non-blocking: tap anywhere, or wait.
 * - Reduced motion → the final state, immediately, with no sweep.
 * - Never confetti, coins, XP, or fabricated progress.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { CrestEmblem } from "./CrestEmblem";
import { PrismaticGlint } from "./PrismaticGlint";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import type { ProofResult } from "../features/proof/proofRepo";
import { PR_LABEL } from "../features/proof/engine";

const REVEAL_MS = 550;
const LEVEL_UP_MS = 900;

interface CompletionRevealProps {
  result: ProofResult;
  crestLevel: number;
  onDone: () => void;
}

export function CompletionReveal({ result, crestLevel, onDone }: CompletionRevealProps) {
  const reduce = useMotionDisabled();
  const holdMs = (reduce ? 0 : result.crestLevelUp ? LEVEL_UP_MS : REVEAL_MS) + 1400;

  // Auto-dismiss; the user can always leave sooner.
  useEffect(() => {
    const t = setTimeout(onDone, holdMs);
    return () => clearTimeout(t);
  }, [holdMs, onDone]);

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 },
      };

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className="fixed inset-0 z-50 grid place-items-center px-6"
      style={{ background: "rgba(5,9,20,0.86)", backdropFilter: "blur(6px)" }}
    >
      <motion.div {...fade} className="flex w-full max-w-xs flex-col items-center gap-4 text-center">
        <div className="relative">
          <CrestEmblem
            level={crestLevel as 0 | 1 | 2 | 3 | 4 | 5 | 6}
            size={132}
            richBloom={!!result.crestLevelUp}
          />
          {/* Silver edge-light trace across the crest — one pass, never looped. */}
          {!reduce && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
              animate={{ opacity: [0, 0.9, 0], clipPath: "inset(0 0 0 0)" }}
              transition={{ duration: REVEAL_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background:
                  "linear-gradient(100deg, transparent 35%, var(--aur-chrome-50) 50%, transparent 65%)",
                mixBlendMode: "screen",
              }}
            />
          )}
        </div>

        <div>
          <p className="aur-heading">Proof recorded</p>
          <p className="m-0 mt-1 aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>
            {result.keptCount} {result.keptCount === 1 ? "session" : "sessions"} kept
            {result.streak > 1 ? ` · ${result.streak} in a row` : ""}
          </p>
        </div>

        <PrismaticGlint className="h-3 w-44" opacity={0.55} />

        {result.crestLevelUp && (
          <motion.p
            className="m-0 text-small"
            style={{ color: "var(--aur-ink)" }}
            initial={reduce ? undefined : { opacity: 0, y: 6 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: LEVEL_UP_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
          >
            {result.crestLevelUp.name} — the crest advances.
          </motion.p>
        )}

        {result.prs.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {result.prs.map((pr) => (
              <li
                key={`${pr.exerciseName}-${pr.metric}`}
                className="aur-metric text-small"
                style={{ color: "var(--aur-ink-muted)" }}
              >
                {pr.exerciseName} — {PR_LABEL[pr.metric]} {pr.value}
              </li>
            ))}
          </ul>
        )}

        <p className="aur-meta m-0">Tap to continue</p>
      </motion.div>
    </div>
  );
}
