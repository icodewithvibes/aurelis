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
 */
import { useState } from "react";
import { saveDataRequested } from "../lib/media";

import meadowWebp from "../design/assets/backplates/meadow_1080x1910.webp";
import meadowJpg from "../design/assets/backplates/meadow_1080x1910.jpg";
import meadowLqip from "../design/assets/backplates/meadow_lqip.webp";
import forgeWebp from "../design/assets/backplates/forge_1080x1910.webp";
import forgeJpg from "../design/assets/backplates/forge_1080x1910.jpg";
import forgeLqip from "../design/assets/backplates/forge_lqip.webp";

const SOURCES = {
  meadow: { webp: meadowWebp, jpg: meadowJpg, lqip: meadowLqip },
  forge: { webp: forgeWebp, jpg: forgeJpg, lqip: forgeLqip },
} as const;

export type BackplateVariant = keyof typeof SOURCES;

interface BackplateProps {
  variant: BackplateVariant;
}

export function Backplate({ variant }: BackplateProps) {
  const [loaded, setLoaded] = useState(false);

  // Save-Data: skip optional raster imagery entirely.
  if (saveDataRequested()) return null;

  const src = SOURCES[variant];

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" data-backplate={variant}>
      {/* LQIP blur-up (inline-sized, ~0.1 KB) */}
      <img
        src={src.lqip}
        alt=""
        width={1080}
        height={1910}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "blur(18px)", transform: "scale(1.06)" }}
      />
      <picture>
        <source srcSet={src.webp} type="image/webp" />
        <img
          src={src.jpg}
          alt=""
          width={1080}
          height={1910}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: variant === "meadow" ? "center bottom" : "center",
            opacity: loaded ? 1 : 0,
            transition: "opacity var(--dur-slow) var(--ease-standard)",
          }}
        />
      </picture>
    </div>
  );
}
