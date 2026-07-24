/**
 * Today — Stage 1 STATIC screen fed by the mock-data seam.
 * Meadow backplate (approved Group 2) is allowed here ONLY.
 * All figures are sample data; nothing is wired to logic yet.
 */
import { motion, useReducedMotion } from "framer-motion";
import { ScreenSurface } from "../components/ScreenSurface";
import { CrestEmblem } from "../components/CrestEmblem";
import { getTodayView } from "../data/access";
import type { CrestLevel } from "../components/ThresholdArch";

function MockBadge() {
  return (
    <span
      data-mock="true"
      className="rounded-full px-2 py-0.5 text-[0.625rem] uppercase tracking-widest"
      style={{
        color: "var(--aur-ink-faint)",
        border: "1px solid var(--aur-ink-faint)",
      }}
    >
      sample data
    </span>
  );
}

export function Today() {
  const today = getTodayView();
  const reduce = useReducedMotion();

  // Soft staggered entrance for screen content.
  const stagger = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <ScreenSurface backplate="meadow" labelledBy="today-heading">
      {/* Upper third = image text-safe zone (manifest 09 §3): heading lives here. */}
      <motion.header {...stagger(0)} className="flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="m-0 text-small" style={{ color: "var(--aur-ink-muted)" }}>
            {today.dateLabel}
          </p>
          <h1
            id="today-heading"
            className="m-0 mt-1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-display)",
              fontWeight: 470,
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              textShadow: "0 1px 20px rgba(5,9,20,0.55)",
            }}
          >
            {today.greeting}
          </h1>
        </div>
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <CrestEmblem level={today.crestLevel as CrestLevel} size={72} />
          <span
            className="font-mono text-[0.6875rem] tracking-wide"
            style={{ color: "var(--aur-ink-muted)" }}
          >
            {today.sessionsKept} kept
          </span>
        </div>
      </motion.header>

      <div className="flex-1" />

      {/* Planned-day card floats as a chrome surface within the meadow. */}
      <motion.section
        {...stagger(1)}
        aria-label="Planned session"
        className="aur-chrome-surface p-5"
      >
        <div className="flex items-center justify-between">
          <p
            className="m-0 text-[0.6875rem] uppercase tracking-[0.18em]"
            style={{ color: "var(--aur-ink-muted)" }}
          >
            Scheduled today
          </p>
          <MockBadge />
        </div>
        <h2
          className="m-0 mt-1"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-h1)",
            fontWeight: 500,
          }}
        >
          {today.dayName}
        </h2>

        <hr className="aur-hairline my-4" />

        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {today.exercises.map((ex) => (
            <li key={ex.name} className="flex items-baseline justify-between gap-3">
              <span className="text-body">{ex.name}</span>
              <span
                className="whitespace-nowrap font-mono text-small"
                style={{ color: "var(--aur-ink-muted)" }}
              >
                {ex.sets}×{ex.reps}
                {ex.rpe ? ` · ${ex.rpe}` : ""}
              </span>
            </li>
          ))}
        </ul>

        {/* Week completion placeholder — visual only. */}
        <div className="mt-5" aria-label="This week (sample)">
          <div className="flex items-center justify-between text-[0.6875rem]" style={{ color: "var(--aur-ink-muted)" }}>
            <span>This week</span>
            <span className="font-mono">
              {today.weekCompletion.done} of {today.weekCompletion.planned} kept
            </span>
          </div>
          <div
            className="mt-1.5 h-1 overflow-hidden rounded-full"
            style={{ background: "rgba(210,217,230,0.14)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(today.weekCompletion.done / today.weekCompletion.planned) * 100}%`,
                background: "var(--aur-silver-200)",
              }}
            />
          </div>
        </div>

        {/* Primary CTA — intentionally inert in Stage 1 (logger is Stage 2). */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="aur-touch mt-5 w-full rounded-full text-body font-medium"
          style={{
            background: "var(--aur-chrome-50)",
            color: "var(--aur-night)",
            border: "none",
            opacity: 0.55,
            padding: "0.875rem 1.5rem",
            cursor: "not-allowed",
          }}
        >
          Start workout
        </button>
        <p
          className="m-0 mt-2 text-center text-[0.6875rem]"
          style={{ color: "var(--aur-ink-faint)" }}
        >
          Logging arrives in Stage 2.
        </p>
      </motion.section>
    </ScreenSurface>
  );
}
