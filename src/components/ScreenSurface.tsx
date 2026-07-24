/**
 * ScreenSurface — shared screen wrapper.
 * Paints the SOLID ceremonial-cobalt CSS fallback first (the real
 * background), then optionally layers an approved backplate and a
 * semantic *veil* (not an opaque scrim) tuned per environment:
 *   meadow → invitation (clears through the flower band)
 *   forge  → enclosed sanctuary (soft vignette, calm center)
 * Content renders above everything; the surface is fully usable
 * with all imagery disabled.
 */
import type { ReactNode } from "react";
import { Backplate, type BackplateVariant } from "./Backplate";
import { BloomLayer } from "./BloomLayer";

interface ScreenSurfaceProps {
  children: ReactNode;
  /** Optional approved atmosphere. meadow=Today/onboarding only; forge=Forge only. */
  backplate?: BackplateVariant;
  labelledBy?: string;
}

export function ScreenSurface({ children, backplate, labelledBy }: ScreenSurfaceProps) {
  const fallback =
    backplate === "forge" ? "var(--aur-fallback-forge)" : "var(--aur-fallback-cobalt)";
  const veil =
    backplate === "forge"
      ? "var(--veil-forge)"
      : backplate === "meadow"
        ? "var(--veil-meadow)"
        : undefined;

  return (
    <div
      className="relative min-h-full"
      style={{ background: fallback }}
      aria-labelledby={labelledBy}
    >
      {backplate && <Backplate variant={backplate} />}

      {/* Forge sanctuary: approved analog bloom as a restrained horizon glow. */}
      {backplate === "forge" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[22%] flex justify-center">
          <BloomLayer opacity={0.14} className="aur-halo-slow h-64 w-[130%] max-w-none" />
        </div>
      )}

      {/* Semantic veil keeps text zones safe while letting the environment breathe. */}
      {veil && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: veil }} />
      )}
      {/* Forge feels enclosed: a soft edge vignette. */}
      {backplate === "forge" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--veil-forge-vignette)" }}
        />
      )}
      {/* Faint page-level atmospheric light unifies depth on every screen. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--scrim-atmos)" }}
      />

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
