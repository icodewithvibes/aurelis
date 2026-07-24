/**
 * ScreenSurface — shared screen wrapper.
 * Paints the SOLID ceremonial-cobalt CSS fallback first (the real
 * background), then optionally layers an approved backplate +
 * legibility scrim. Content renders above everything; the surface is
 * fully usable with all imagery disabled.
 */
import type { ReactNode } from "react";
import { Backplate, type BackplateVariant } from "./Backplate";

interface ScreenSurfaceProps {
  children: ReactNode;
  /** Optional approved atmosphere. meadow=Today/onboarding only; forge=Forge only. */
  backplate?: BackplateVariant;
  /** aria label / heading id hook for the surface */
  labelledBy?: string;
}

export function ScreenSurface({ children, backplate, labelledBy }: ScreenSurfaceProps) {
  const fallback =
    backplate === "forge" ? "var(--aur-fallback-forge)" : "var(--aur-fallback-cobalt)";
  return (
    <div
      className="relative min-h-full"
      style={{ background: fallback }}
      aria-labelledby={labelledBy}
    >
      {backplate && <Backplate variant={backplate} />}
      {backplate && (
        /* Bottom scrim keeps content legible over imagery (TX-3, CSS-first). */
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--aur-scrim-bottom)" }}
        />
      )}
      <div
        className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
          paddingBottom: "calc(var(--nav-height) + env(safe-area-inset-bottom) + 1.5rem)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
