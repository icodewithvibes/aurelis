/**
 * PlaceholderScreen — honest "coming later" surface.
 * Shows the design system without pretending the feature exists.
 * No functional controls, inputs, journal text, or safety copy.
 */
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ScreenSurface } from "./ScreenSurface";
import type { BackplateVariant } from "./Backplate";

interface PlaceholderScreenProps {
  id: string;
  title: string;
  intent: string;
  stageNote: string;
  backplate?: BackplateVariant;
  children?: ReactNode;
}

export function PlaceholderScreen({
  id,
  title,
  intent,
  stageNote,
  backplate,
  children,
}: PlaceholderScreenProps) {
  const reduce = useReducedMotion();
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <ScreenSurface backplate={backplate} labelledBy={id}>
      <motion.header {...rise} className="pt-2">
        <h1
          id={id}
          className="m-0"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-sm)",
            fontWeight: 480,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <p className="m-0 mt-2 max-w-xs text-body" style={{ color: "var(--aur-ink-muted)" }}>
          {intent}
        </p>
      </motion.header>

      <div className="flex-1" />

      <motion.section {...rise} className="aur-glass p-5">
        <p
          className="m-0 text-[0.6875rem] uppercase tracking-[0.18em]"
          style={{ color: "var(--aur-ink-muted)" }}
        >
          Not built yet
        </p>
        <p className="m-0 mt-2 text-body">{stageNote}</p>
        {children}
      </motion.section>
    </ScreenSurface>
  );
}
