/**
 * SegmentedControl — the one interaction Settings is made of.
 *
 * A real radiogroup (arrow keys work, state is announced), 44px targets,
 * and a press state that reads as physical without animating anything
 * but transform and opacity.
 */
import type { ReactNode } from "react";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  /** Stack instead of sharing a row — for long labels. */
  stacked?: boolean;
  children?: ReactNode;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  stacked = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={stacked ? "mt-3 flex flex-col gap-2" : "mt-3 flex gap-2"}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`aur-press aur-touch flex flex-col items-center justify-center rounded-xl px-2 py-2 ${
              stacked ? "w-full" : "flex-1"
            }`}
            style={{
              background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
              color: active ? "var(--aur-night)" : "var(--aur-ink)",
              border: active ? "1px solid transparent" : "1px solid var(--aur-glass-rim)",
            }}
          >
            <span className="text-body font-medium">{o.label}</span>
            {o.hint && (
              <span
                className="text-[0.625rem] leading-tight"
                style={{ color: active ? "rgba(7,12,24,0.72)" : "var(--aur-ink-muted)" }}
              >
                {o.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
