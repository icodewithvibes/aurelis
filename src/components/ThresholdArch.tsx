/**
 * Threshold Arch — the AURELIS Chrome Crest (Direction B, APPROVED).
 * Exact layered SVG per 03_assets/03_chrome-crest.md §Threshold Arch:
 *   viewBox 0 0 64 64 · stroke-based · stroke-linecap round ·
 *   min stroke 1.5 units · 7 cumulative layers L0..L6 ·
 *   silhouette constant, levels only add.
 *
 * Paint comes from CSS custom properties only. The prismatic layer's
 * stroke needs an SVG paint server (CSS gradient vars cannot paint
 * strokes), so an in-SVG <linearGradient> mirrors the documented
 * `--aur-prism` stops exactly (05 §1). No level-up / completion
 * animation in Stage 1 — that is the Group 3 contract (Stage 3+).
 */

export type CrestLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const CREST_LEVEL_NAMES = [
  "Unmarked",
  "First Mark",
  "Polished Mark",
  "Silver Crest",
  "Cobalt Crest",
  "Prismatic Crest",
  "Ascendant Crest",
] as const;

interface ThresholdArchProps {
  /** How many layers are revealed: level N shows layers L0..LN. */
  level: CrestLevel;
  /** Rendered square size in px (24/48 inline, 256 card, 1024 hero). */
  size?: number;
  className?: string;
  title?: string;
}

let gradientSeq = 0;

export function ThresholdArch({
  level,
  size = 48,
  className,
  title,
}: ThresholdArchProps) {
  // Unique gradient id per instance so multiple crests can coexist.
  const gid = `aur-prism-${++gradientSeq}`;
  const label = title ?? `Threshold Arch — ${CREST_LEVEL_NAMES[level]}`;

  const show = (layer: number) => level >= layer;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
      data-crest-level={level}
      fill="none"
      strokeLinecap="round"
    >
      <defs>
        {/* Mirrors --aur-prism (100deg, restrained spectrum). */}
        <linearGradient id={gid} x1="0" y1="1" x2="0.18" y2="0">
          <stop offset="0" stopColor="#7CA9FF" />
          <stop offset="0.25" stopColor="#B79CFF" />
          <stop offset="0.5" stopColor="#F0A6D8" />
          <stop offset="0.72" stopColor="#FFD59E" />
          <stop offset="1" stopColor="#9CE6D0" />
        </linearGradient>
        {/* Group 6 (Option B): reflective chrome-material sheen for the
            silver strokes — a code-driven premium chrome look, geometry
            unchanged. Stops use design tokens; SVG remains the a11y source. */}
        <linearGradient id={`${gid}-chrome`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="var(--aur-chrome-50)" />
          <stop offset="0.32" stopColor="var(--aur-silver-200)" />
          <stop offset="0.52" stopColor="var(--aur-steel-400)" />
          <stop offset="0.68" stopColor="var(--aur-silver-200)" />
          <stop offset="1" stopColor="var(--aur-chrome-50)" />
        </linearGradient>
      </defs>

      {/* L0 — Unmarked: faint central stem */}
      <path
        data-layer="0"
        d="M32 16 V50"
        stroke="var(--aur-steel-400)"
        strokeWidth="1.5"
        opacity="0.45"
      />

      {/* L1 — First Mark: closed silver arch + baseline (chrome-material) */}
      {show(1) && (
        <g data-layer="1" stroke={`url(#${gid}-chrome)`} strokeWidth="2">
          <path d="M18 50 C18 28 24 15 32 12 C40 15 46 28 46 50" />
          <path d="M18 50 H46" />
        </g>
      )}

      {/* L2 — Polished Mark: reflective chrome edge (upper-left arc) */}
      {show(2) && (
        <path
          data-layer="2"
          d="M21 40 C21 27 26 17 32 14"
          stroke="var(--aur-chrome-50)"
          strokeWidth="1.5"
          opacity="0.9"
        />
      )}

      {/* L3 — Silver Crest: restrained inner arch echo */}
      {show(3) && (
        <path
          data-layer="3"
          d="M23 50 C23 32 27 21 32 18 C37 21 41 32 41 50"
          stroke="var(--aur-silver-200)"
          strokeWidth="1.5"
          opacity="0.8"
        />
      )}

      {/* L4 — Cobalt Crest: thin cobalt channel between L1 and L3 */}
      {show(4) && (
        <path
          data-layer="4"
          d="M20.5 50 C20.5 30 25.5 18 32 15 C38.5 18 43.5 30 43.5 50"
          stroke="var(--aur-cobalt-500)"
          strokeWidth="1.25"
        />
      )}

      {/* L5 — Prismatic Crest: one controlled edge-light, RIGHT arc only */}
      {show(5) && (
        <path
          data-layer="5"
          d="M32 12 C40 15 46 28 46 50"
          stroke={`url(#${gid})`}
          strokeWidth="1.25"
          opacity="0.85"
        />
      )}

      {/* L6 — Ascendant Crest: botanical buds grown from the stem */}
      {show(6) && (
        <g data-layer="6">
          <path
            d="M32 40 C29 38 27.5 36.5 27 34.5"
            stroke="var(--aur-silver-200)"
            strokeWidth="1.25"
          />
          <circle cx="26.6" cy="33.8" r="1.6" fill="var(--aur-cobalt-300)" />
          <path
            d="M32 34 C34.5 32.5 36 30.8 36.4 28.8"
            stroke="var(--aur-silver-200)"
            strokeWidth="1.25"
          />
          <circle cx="36.8" cy="28" r="1.6" fill="var(--aur-cobalt-300)" />
        </g>
      )}
    </svg>
  );
}
