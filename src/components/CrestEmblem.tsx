/**
 * CrestEmblem — presentation wrapper that gives the Threshold Arch a
 * deliberate "ceremonial object" presence WITHOUT changing its approved
 * geometry: a soft breathing halo behind it and a reflective silver
 * glow around the strokes. For rare elevated moments (Proof hero), the
 * approved TX-2 bloom asset can sit behind it as restrained chrome light.
 * All motion is CSS and freezes to an elegant static state under
 * prefers-reduced-motion; the CSS halo is the Save-Data fallback.
 */
import { ThresholdArch, type CrestLevel } from "./ThresholdArch";
import { BloomLayer } from "./BloomLayer";

interface CrestEmblemProps {
  level: CrestLevel;
  size?: number;
  /** Soft CSS radial halo behind the crest (ceremonial presence, always cheap). */
  halo?: boolean;
  /** Rare: approved TX-2 bloom asset behind the crest (elevated moments only). */
  richBloom?: boolean;
  className?: string;
  title?: string;
}

export function CrestEmblem({
  level,
  size = 72,
  halo = true,
  richBloom = false,
  className,
  title,
}: CrestEmblemProps) {
  return (
    <div
      className={`aur-crest-emblem relative inline-grid place-items-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {halo && <span aria-hidden="true" className="aur-halo" />}
      {richBloom && (
        <BloomLayer
          opacity={0.34}
          className="aur-halo-slow pointer-events-none absolute inset-[-55%] h-[210%] w-[210%] max-w-none"
        />
      )}
      <ThresholdArch level={level} size={size} title={title} className="relative" />
    </div>
  );
}
