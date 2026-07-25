/**
 * CrestEmblem — presentation wrapper that gives the crest a deliberate
 * "ceremonial object" presence: a soft breathing halo behind it and a
 * reflective silver glow around the strokes. For rare elevated moments
 * (Proof hero, completion reveal) the approved TX-2 bloom asset can sit
 * behind it as restrained chrome light.
 *
 * Two renderings of the SAME seven tiers:
 * - The approved SVG Threshold Arch is the source of truth. It is
 *   crisp at any size, needs no network, and is the Save-Data and
 *   small-size rendering (02_strategy/05, plan §1.5).
 * - At ceremonial sizes (>=96px) the approved engraved medallion raster
 *   is used instead — the same silhouette with real chrome and gold.
 *
 * All motion is CSS and freezes to an elegant static state under
 * prefers-reduced-motion; the CSS halo is the Save-Data fallback.
 */
import { ThresholdArch, CREST_LEVEL_NAMES, type CrestLevel } from "./ThresholdArch";
import { BloomLayer } from "./BloomLayer";
import { saveDataRequested } from "../lib/media";

import crest0 from "../design/assets/crest/crest_L1_320.webp";
import crest1 from "../design/assets/crest/crest_L2_320.webp";
import crest2 from "../design/assets/crest/crest_L3_320.webp";
import crest3 from "../design/assets/crest/crest_L4_320.webp";
import crest4 from "../design/assets/crest/crest_L5_320.webp";
import crest5 from "../design/assets/crest/crest_L6_320.webp";
import crest6 from "../design/assets/crest/crest_L7_320.webp";

/** Index = CrestLevel; the files are numbered from 1. */
const MEDALLIONS = [crest0, crest1, crest2, crest3, crest4, crest5, crest6] as const;

/** Below this the engraving stops resolving, so the SVG reads better. */
const MEDALLION_MIN_PX = 96;

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
  const useMedallion = size >= MEDALLION_MIN_PX && !saveDataRequested();

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
      {useMedallion ? (
        <img
          src={MEDALLIONS[level]}
          alt={title ?? `Chrome Crest — ${CREST_LEVEL_NAMES[level]}`}
          width={size}
          height={size}
          decoding="async"
          className="relative block"
          style={{ width: size, height: size }}
        />
      ) : (
        <ThresholdArch level={level} size={size} title={title} className="relative" />
      )}
    </div>
  );
}
