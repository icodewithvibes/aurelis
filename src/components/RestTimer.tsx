/**
 * RestTimer — calm countdown after a completed set (02_strategy/01 §5).
 * Numeric, accessible, one-handed. The ring is a cheap SVG stroke (no
 * per-frame JS layout); the count is announced politely. Skip / +30s.
 * Purely local, no persistence.
 */
import { useEffect, useRef, useState } from "react";

interface RestTimerProps {
  seconds: number;
  onDone: () => void;
  onDismiss: () => void;
}

export function RestTimer({ seconds, onDone, onDismiss }: RestTimerProps) {
  const [total, setTotal] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const doneRef = useRef(false);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const left = Math.max(0, total - elapsed);
      setRemaining(left);
      if (left <= 0 && !doneRef.current) {
        doneRef.current = true;
        window.clearInterval(id);
        onDone();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [total, onDone]);

  const pct = total > 0 ? remaining / total : 0;
  const R = 26;
  const C = 2 * Math.PI * R;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const low = remaining <= 10;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Rest: ${remaining} seconds remaining`}
      className="aur-chrome-surface flex items-center gap-4 p-4"
    >
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(210,217,230,0.14)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={R} fill="none"
          stroke={low ? "var(--aur-cobalt-300)" : "var(--aur-silver-200)"}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset 0.25s linear" }}
        />
      </svg>
      <div className="flex-1">
        <p className="aur-label m-0">
          Rest
        </p>
        <p className="aur-metric m-0 text-2xl" style={{ color: low ? "var(--aur-cobalt-300)" : "var(--aur-ink)" }}>
          {mm}:{ss}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTotal((t) => t + 30)}
          className="aur-touch rounded-full px-3 text-small"
          style={{ background: "rgba(210,217,230,0.1)", color: "var(--aur-ink)", border: "none" }}
        >
          +30s
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="aur-touch rounded-full px-3 text-small"
          style={{ background: "rgba(210,217,230,0.1)", color: "var(--aur-ink)", border: "none" }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
