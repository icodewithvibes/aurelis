/**
 * Backplate — optional full-bleed atmosphere imagery (approved assets).
 *
 * Rules (manifests 09/12 + 03_assets/06):
 * - The REAL background is always the solid ceremonial-cobalt CSS
 *   fallback painted by the parent surface; this component is a
 *   progressive enhancement layered on top.
 * - Save-Data → render nothing (fallback shows).
 * - LQIP blur-up first, then <picture> webp→jpg; dimensions reserved
 *   by absolute positioning (zero layout shift).
 * - Decorative only: alt="" + aria-hidden; never required for use.
 * - meadow → Today/onboarding surfaces ONLY.
 * - forge  → Forge surfaces ONLY.
 * - hero   → Today. Resolved per time-of-day band (src/design/heroes),
 *   so the scene follows dawn → day → dusk → night. Only the active
 *   band's image is ever requested.
 */
import { useState } from "react";
import { saveDataRequested } from "../lib/media";
import { heroForTime } from "../design/heroes";
import { useTimeBand } from "../hooks/useTimeBand";

import meadowWebp from "../design/assets/backplates/meadow_1080x1910.webp";
import meadowJpg from "../design/assets/backplates/meadow_1080x1910.jpg";
import meadowLqip from "../design/assets/backplates/meadow_lqip.webp";
import forgeWebp from "../design/assets/backplates/forge_1080x1910.webp";
import forgeJpg from "../design/assets/backplates/forge_1080x1910.jpg";
import forgeLqip from "../design/assets/backplates/forge_lqip.webp";

interface PlateSource {
  webp: string;
  jpg: string;
  lqip: string;
  objectPosition: string;
}

const STATIC_SOURCES = {
  meadow: {
    webp: meadowWebp,
    jpg: meadowJpg,
    lqip: meadowLqip,
    objectPosition: "center bottom",
  },
  forge: {
    webp: forgeWebp,
    jpg: forgeJpg,
    lqip: forgeLqip,
    objectPosition: "center 62%",
  },
} as const;

export type BackplateVariant = "hero" | keyof typeof STATIC_SOURCES;

interface BackplateProps {
  variant: BackplateVariant;
}

export function Backplate({ variant }: BackplateProps) {
  // Re-resolves the hero when the band turns over while the app is open.
  const band = useTimeBand();
  // Track *which* source finished so a band change fades in cleanly.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  /**
   * Which source FAILED. A broken <img> — even with alt="" — paints a
   * broken-image glyph in Safari, so a 404 or an offline load would
   * show an error where the atmosphere belongs. Unmounting the raster
   * hands the screen back to the solid CSS environment underneath,
   * which is the real background anyway.
   */
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [lqipFailed, setLqipFailed] = useState<string | null>(null);

  // Save-Data: skip optional raster imagery entirely.
  if (saveDataRequested()) return null;

  const src: PlateSource = variant === "hero" ? heroForTime() : STATIC_SOURCES[variant];
  const loaded = loadedSrc === src.jpg;

  // Nothing to show: the parent surface's cobalt atmosphere stands alone,
  // and it is designed to look intentional rather than empty.
  if (failedSrc === src.jpg) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      data-backplate={variant}
      data-band={variant === "hero" ? band : undefined}
    >
      {/* LQIP blur-up (inline-sized, ~0.1 KB) */}
      {lqipFailed !== src.lqip && (
        <img
          key={`lqip-${src.lqip}`}
          src={src.lqip}
          alt=""
          width={1080}
          height={1910}
          onError={() => setLqipFailed(src.lqip)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "blur(18px)", transform: "scale(1.06)" }}
        />
      )}
      {/* Slow atmospheric drift (frozen static by reduced-motion). */}
      <picture>
        <source srcSet={src.webp} type="image/webp" />
        <img
          key={src.jpg}
          src={src.jpg}
          alt=""
          width={1080}
          height={1910}
          /* Always in the initial viewport, so `lazy` would only delay it;
             low priority keeps it behind the app's own work, and Save-Data
             skips this component entirely. */
          loading="eager"
          fetchPriority="low"
          decoding="async"
          onLoad={() => setLoadedSrc(src.jpg)}
          onError={() => setFailedSrc(src.jpg)}
          /* A cached image finishes loading before React attaches onLoad,
             and `load` never fires again — so on a repeat visit the plate
             would stay at opacity 0 behind the blur. Catch that here. */
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0) setLoadedSrc(src.jpg);
          }}
          className="aur-drift absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: src.objectPosition,
            opacity: loaded ? 1 : 0,
            transition: "opacity var(--dur-slow) var(--ease-standard)",
          }}
        />
      </picture>
    </div>
  );
}
