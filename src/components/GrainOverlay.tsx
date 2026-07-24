/**
 * GrainOverlay — approved TX-1 procedural film grain (Group 1).
 * Static tiling PNG, mix-blend overlay, opacity via --grain-opacity.
 * Purely decorative: skipped under Save-Data, aria-hidden, and the
 * app is fully correct without it (03_assets/07 §2).
 */
import { saveDataRequested } from "../lib/media";
import grainUrl from "../design/assets/textures/grain_128.png";

export function GrainOverlay() {
  if (saveDataRequested()) return null;
  return (
    <div
      aria-hidden="true"
      data-grain
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        backgroundImage: `url(${grainUrl})`,
        backgroundRepeat: "repeat",
        mixBlendMode: "overlay",
        opacity: "var(--grain-opacity)",
      }}
    />
  );
}
