/**
 * ExerciseDone — the collapsed state of a finished exercise.
 *
 * Once every set is marked, the block of inputs has nothing left to
 * offer: it is four rows of numbers you cannot usefully change and have
 * to scroll past to reach the lift you are actually on. So it folds
 * down to one line that says it is done and what you did.
 *
 * It is a disclosure, not a deletion. Pressing it opens the sets back
 * up to be corrected — a mistyped rep count has to stay fixable, and an
 * app that hides finished work behind a wall would be editing history
 * by omission.
 *
 * The height animation is height-only, deliberately: `transform` on
 * this card would make it the containing block for the movement sheet's
 * `position: fixed` overlay, which is the exact bug documented in
 * Portal.tsx. Grid-rows is used rather than max-height so the collapse
 * fits the real content instead of a guessed ceiling.
 */
import { motion } from "framer-motion";
import { useMotionDisabled } from "../hooks/useMotionDisabled";

interface ExerciseDoneProps {
  name: string;
  /** "3 sets · 185 lb × 8, 8, 7" — what was actually logged. */
  summary: string;
  open: boolean;
  onToggle: () => void;
}

export function ExerciseDone({ name, summary, open, onToggle }: ExerciseDoneProps) {
  const reduce = useMotionDisabled();

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? `Collapse ${name}` : `${name} done. Reopen to edit`}
      onClick={onToggle}
      className="aur-press aur-touch flex w-full items-center gap-3 text-left"
      style={{ background: "transparent", border: "none", padding: "0.35rem 0", color: "inherit" }}
    >
      <motion.span
        aria-hidden="true"
        className="grid shrink-0 place-items-center rounded-full"
        initial={reduce ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: 26, height: 26, background: "var(--aur-success)", color: "var(--aur-night)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M5 12.5 L10 17.5 L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
      </motion.span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        <span className="aur-meta">{summary}</span>
      </span>

      <span
        aria-hidden="true"
        className="shrink-0 text-small"
        style={{
          color: "var(--aur-ink-faint)",
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 160ms var(--ease-standard)",
          display: "inline-block",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

/**
 * Wraps the set rows so they can fold away.
 *
 * `grid-template-rows: 0fr -> 1fr` collapses to the content's own
 * height with no magic number, and animating only that (plus opacity)
 * keeps `transform` off the card — a transform here would make it the
 * containing block for the movement sheet's fixed overlay.
 *
 * A PLAIN CSS TRANSITION, not framer-motion, and for the same reason
 * the tutorial does not use AnimatePresence: the collapsed state must
 * not depend on an animation completing. Here the style is applied
 * immediately and the transition merely smooths the change, so if iOS
 * defers or drops the animation the section still ends up collapsed.
 * Driving it through `animate` meant a deferred animation left the rows
 * open at full height forever.
 */
export function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduce = useMotionDisabled();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        opacity: open ? 1 : 0,
        transition: reduce
          ? "none"
          : "grid-template-rows 320ms var(--ease-standard), opacity 240ms var(--ease-standard)",
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
    </div>
  );
}
