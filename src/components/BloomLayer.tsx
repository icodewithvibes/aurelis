/**
 * BloomLayer — approved TX-2 soft bloom (Group 1), screen-blended.
 * Optional enhancement for nonessential visual zones only — never
 * beneath key inputs, controls, or dense text (03_assets/07 §3).
 * CSS radial-gradient fallback happens implicitly: absence of this
 * layer changes nothing functional.
 */
import { saveDataRequested } from "../lib/media";
import bloomUrl from "../design/assets/textures/bloom_1024.webp";

interface BloomLayerProps {
  /** Opacity 0..1 — keep low; resting glow ≈ 0.08–0.22. */
  opacity?: number;
  className?: string;
}

export function BloomLayer({ opacity = 0.12, className }: BloomLayerProps) {
  if (saveDataRequested()) return null;
  return (
    <img
      src={bloomUrl}
      alt=""
      aria-hidden="true"
      width={1024}
      height={1024}
      className={`pointer-events-none select-none ${className ?? ""}`}
      style={{ mixBlendMode: "screen", opacity }}
    />
  );
}
