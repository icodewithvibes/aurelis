/**
 * Settings — Stage 3: a functional, persisted **motion control** (the
 * animation/motion fix), plus read-only local/privacy facts. Other
 * controls (units, export/import) remain later-stage.
 */
import { ScreenSurface } from "../components/ScreenSurface";
import { SCHEMA_VERSION } from "../data/db";
import { useUiStore, type ReducedMotionSetting } from "../state/ui";

const MOTION_OPTIONS: { value: ReducedMotionSetting; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Follow device" },
  { value: "on", label: "Calm", hint: "Reduce motion" },
  { value: "off", label: "Full", hint: "All motion" },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-body">{label}</span>
      <span className="aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>{value}</span>
    </div>
  );
}

export function Settings() {
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  const setReducedMotion = useUiStore((s) => s.setReducedMotion);

  return (
    <ScreenSurface labelledBy="settings-heading">
      <header className="pt-2">
        <h1 id="settings-heading" className="aur-title">Settings</h1>
        <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
          Preferences, data, and about — kept simple and private.
        </p>
      </header>

      {/* Functional motion control */}
      <section className="mt-5 aur-chrome-surface p-4" aria-label="Motion">
        <p className="aur-label m-0">Motion &amp; animation</p>
        <p className="m-0 mt-1 text-small" style={{ color: "var(--aur-ink-muted)" }}>
          How much ambient movement AURELIS uses. "Calm" holds everything still.
        </p>
        <div
          role="radiogroup"
          aria-label="Motion preference"
          className="mt-3 flex gap-2"
        >
          {MOTION_OPTIONS.map((o) => {
            const active = reducedMotion === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setReducedMotion(o.value)}
                className="aur-touch flex flex-1 flex-col items-center justify-center rounded-xl px-2 py-2"
                style={{
                  background: active ? "var(--aur-chrome-50)" : "rgba(210,217,230,0.08)",
                  color: active ? "var(--aur-night)" : "var(--aur-ink)",
                  border: active ? "none" : "1px solid rgba(210,217,230,0.12)",
                  transition: "background var(--dur-fast) var(--ease-standard)",
                }}
              >
                <span className="text-body font-medium">{o.label}</span>
                <span
                  className="text-[0.625rem]"
                  style={{ color: active ? "rgba(7,12,24,0.7)" : "var(--aur-ink-muted)" }}
                >
                  {o.hint}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Read-only facts */}
      <section className="mt-4 aur-chrome-surface p-4" aria-label="About">
        <p className="aur-label m-0">Your data</p>
        <div className="mt-2">
          <div className="aur-hairline" />
          <Row label="Units" value="lb" />
          <div className="aur-hairline" />
          <Row label="Storage" value="On this device only" />
          <div className="aur-hairline" />
          <Row label="Local database" value={`v${SCHEMA_VERSION} · active`} />
          <div className="aur-hairline" />
        </div>
        <p className="aur-meta m-0 mt-3">
          AURELIS is local-first. No account, no server, no sync, no tracking.
        </p>
      </section>
    </ScreenSurface>
  );
}
