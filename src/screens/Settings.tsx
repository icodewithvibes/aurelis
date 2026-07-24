/**
 * Settings — placeholder. Shows the design system honestly; no
 * functional toggles are wired in Stage 1 (no theme switcher per spec).
 * Displays read-only, locked V1 facts for orientation only.
 */
import { PlaceholderScreen } from "../components/PlaceholderScreen";
import { SCHEMA_VERSION } from "../data/db";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-body">{label}</span>
      <span className="font-mono text-small" style={{ color: "var(--aur-ink-muted)" }}>
        {value}
      </span>
    </div>
  );
}

export function Settings() {
  return (
    <PlaceholderScreen
      id="settings-heading"
      title="Settings"
      intent="Preferences, data, and about — kept simple and private."
      stageNote="Units, motion preferences, and local export/import become functional in a later stage. Values below are read-only."
    >
      <div className="mt-3" role="group" aria-label="Read-only settings (sample)">
        <div className="aur-hairline" />
        <Row label="Units" value="lb" />
        <div className="aur-hairline" />
        <Row label="Reduced motion" value="Auto (follows device)" />
        <div className="aur-hairline" />
        <Row label="Data" value="On this device only" />
        <div className="aur-hairline" />
        <Row label="Local database" value={`v${SCHEMA_VERSION} · initialized`} />
        <div className="aur-hairline" />
      </div>
      <p className="m-0 mt-4 text-[0.6875rem]" style={{ color: "var(--aur-ink-faint)" }}>
        AURELIS is local-first. No account, no server, no sync, no tracking.
      </p>
    </PlaceholderScreen>
  );
}
