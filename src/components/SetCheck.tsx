/**
 * SetCheck — the button that marks a set done.
 *
 * This is the single most-pressed control in the app, and it used to be
 * a text "✓" that turned green. That reads as a state change rather
 * than an achievement, and a set is the smallest unit of work the whole
 * record is built from — it deserves to feel like something happened.
 *
 * So: the tick is a real stroked path that DRAWS itself, the button
 * swells and settles, and a chrome ring expands out once and vanishes.
 * All three run from the same state change, and all three are decoration
 * over a fact that is already persisted — completeSet awaits the write
 * before this ever turns.
 *
 * Under reduced motion nothing moves. The tick is simply there, filled
 * and complete, because the information is the point and the animation
 * is not carrying any of it.
 */
import { motion } from "framer-motion";
import { useMotionDisabled } from "../hooks/useMotionDisabled";

interface SetCheckProps {
  done: boolean;
  label: string;
  onToggle: () => void;
}

export function SetCheck({ done, label, onToggle }: SetCheckProps) {
  const reduce = useMotionDisabled();

  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={label}
      onClick={onToggle}
      className="aur-press aur-touch relative grid shrink-0 place-items-center rounded-full"
      style={{
        width: 44,
        height: 44,
        background: done ? "var(--aur-success)" : "rgba(210,217,230,0.1)",
        color: done ? "var(--aur-night)" : "var(--aur-ink-muted)",
        border: "none",
        transition: "background var(--dur-fast) var(--ease-standard)",
      }}
    >
      {/* The ring: one outward pulse on completion, then gone. Keyed on
          `done` so it replays every time a set is re-marked, and
          pointer-events-none so it can never eat the next tap. */}
      {done && !reduce && (
        <motion.span
          key="ring"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 1.55 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ border: "2px solid var(--aur-chrome-50)" }}
        />
      )}

      <motion.span
        className="grid place-items-center"
        animate={reduce ? undefined : { scale: done ? [1, 1.18, 1] : 1 }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <motion.path
            d="M5 12.5 L10 17.5 L19 7"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            /* pathLength drives the draw. At rest the tick sits at 0.35
               so the button is never empty — there is always a mark to
               aim at, it just is not finished yet. */
            animate={{ pathLength: done ? 1 : 0.35, opacity: done ? 1 : 0.5 }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: done ? 0.04 : 0 }
            }
          />
        </svg>
      </motion.span>
    </button>
  );
}
