/**
 * PrismaticGlint — the approved TX-4 prismatic glint (Group 1), used as a
 * rare, STATIC chrome/proof-language accent. Never looped or ambient.
 * Reserved for proof/reveal moments; the full animated completion sweep
 * remains Stage 3 (03_assets/10). Optional: Save-Data → a CSS `--aur-prism`
 * hairline fallback; the app is correct without it.
 */
import { saveDataRequested } from "../lib/media";
import glintUrl from "../design/assets/textures/glint_1024x128.webp";

interface PrismaticGlintProps {
  className?: string;
  /** 0..1 — keep restrained. */
  opacity?: number;
}

export function PrismaticGlint({ className, opacity = 0.7 }: PrismaticGlintProps) {
  if (saveDataRequested()) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          display: "block",
          height: 2,
          background: "var(--aur-prism)",
          opacity: opacity * 0.7,
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)",
          maskImage:
            "linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)",
        }}
      />
    );
  }
  return (
    <img
      src={glintUrl}
      alt=""
      aria-hidden="true"
      width={1024}
      height={128}
      className={className}
      style={{ mixBlendMode: "screen", opacity, display: "block" }}
    />
  );
}
