/**
 * PlaceholderScreen — honest "coming later" surface.
 * Shows the design system without pretending the feature exists.
 * No functional controls, inputs, journal text, or safety copy.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { ScreenSurface } from "./ScreenSurface";
import type { BackplateVariant } from "./Backplate";

interface PlaceholderScreenProps {
  id: string;
  title: string;
  intent: string;
  stageNote: string;
  backplate?: BackplateVariant;
  /** Optional ceremonial visual shown prominently in the open central space. */
  hero?: ReactNode;
  children?: ReactNode;
}

export function PlaceholderScreen({
  id,
  title,
  intent,
  stageNote,
  backplate,
  hero,
  children,
}: PlaceholderScreenProps) {
  const reduce = useMotionDisabled();
  const stagger = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <ScreenSurface backplate={backplate} labelledBy={id}>
      <motion.header {...stagger(0)} className="pt-2">
        <h1 id={id} className="aur-title">
          {title}
        </h1>
        <p className="m-0 mt-2 max-w-xs text-body" style={{ color: "var(--aur-ink-muted)" }}>
          {intent}
        </p>
      </motion.header>

      {hero ? (
        <motion.div
          {...stagger(1)}
          className="flex flex-1 items-center justify-center py-8"
        >
          {hero}
        </motion.div>
      ) : (
        <div className="flex-1" />
      )}

      <motion.section {...stagger(hero ? 2 : 1)} className="aur-chrome-surface p-5">
        <p className="aur-label m-0">Not built yet</p>
        <p className="m-0 mt-2 text-body">{stageNote}</p>
        {children}
      </motion.section>
    </ScreenSurface>
  );
}
