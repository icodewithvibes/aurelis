/**
 * CrestEmblem — presentation wrapper that gives the Threshold Arch a
 * deliberate "ceremonial object" presence WITHOUT changing its approved
 * geometry: a soft breathing halo behind it and a reflective silver
 * glow around the strokes. All motion is CSS and freezes to an elegant
 * static state under prefers-reduced-motion.
 */
import { ThresholdArch, type CrestLevel } from "./ThresholdArch";

interface CrestEmblemProps {
  level: CrestLevel;
  size?: number;
  /** Soft radial halo behind the crest (ceremonial presence). */
  halo?: boolean;
  className?: string;
  title?: string;
}

export function CrestEmblem({
  level,
  size = 72,
  halo = true,
  className,
  title,
}: CrestEmblemProps) {
  return (
    <div
      className={`aur-crest-emblem relative inline-grid place-items-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {halo && <span aria-hidden="true" className="aur-halo" />}
      <ThresholdArch level={level} size={size} title={title} className="relative" />
    </div>
  );
}
