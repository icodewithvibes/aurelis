/**
 * Sparkline — a plain SVG trend line. No charting library, no canvas.
 *
 * Accessibility: the drawing is decorative, and the meaning is carried
 * by a text label the caller supplies, so a screen reader gets the
 * summary rather than a list of coordinates.
 */
import { normalizeSeries } from "../features/history/history";

interface SparklineProps {
  values: number[];
  /** Read out instead of the shape, e.g. "estimated 1RM, up 12 lb over 6 sessions". */
  label: string;
  width?: number;
  height?: number;
}

export function Sparkline({ values, label, width = 96, height = 28 }: SparklineProps) {
  if (values.length === 0) return null;

  const pad = 2;
  const norm = normalizeSeries(values);
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const points = norm.map((v, i) => {
    const x = pad + i * stepX;
    const y = height - pad - v * (height - pad * 2);
    return [x, y] as const;
  });

  // A single session draws a dot, not a line — one point is not a trend.
  const single = points.length === 1;
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="block shrink-0"
    >
      {!single && (
        <path
          d={path}
          fill="none"
          stroke="var(--aur-silver-200)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      )}
      <circle cx={last[0]} cy={last[1]} r={2.5} fill="var(--aur-cobalt-300)" />
    </svg>
  );
}
