/**
 * Settings (Stage 4) — a real local control surface.
 *
 * Every control here changes how the app behaves and persists to the
 * local Dexie row. Nothing is a placeholder, and nothing is sent
 * anywhere: there is no account, no server and no sync to configure.
 */
import { useState } from "react";
import { ScreenSurface } from "../components/ScreenSurface";
import { SegmentedControl } from "../components/SegmentedControl";
import { SCHEMA_VERSION, type ImageMode, type RpeMode, type ThemeName } from "../data/db";
import { clearLocalData, REST_PRESETS } from "../data/repositories/settingsRepo";
import { useUiStore, type ReducedMotionSetting } from "../state/ui";

const THEMES: { value: ThemeName; label: string; hint: string }[] = [
  { value: "ceremonial-chrome", label: "Ceremonial Chrome", hint: "Deep cobalt, silver rims" },
  { value: "luminous-meadow", label: "Luminous Meadow", hint: "Brighter azure bloom" },
  { value: "chrome-rider", label: "Chrome Rider", hint: "Cinematic, high contrast" },
  { value: "quiet-forge", label: "Quiet Forge", hint: "Moonlit blue sanctuary" },
];

const MOTION: { value: ReducedMotionSetting; label: string; hint: string }[] = [
  { value: "auto", label: "System", hint: "Follow device" },
  { value: "on", label: "Reduced", hint: "Hold still" },
  { value: "off", label: "Full", hint: "All motion" },
];

const IMAGES: { value: ImageMode; label: string; hint: string }[] = [
  { value: "auto", label: "Automatic", hint: "Honour Save-Data" },
  { value: "save-data", label: "Save data", hint: "No photos" },
  { value: "always", label: "Always", hint: "Always show" },
];

const RPE: { value: RpeMode; label: string; hint: string }[] = [
  { value: "simple", label: "Simple", hint: "How hard?" },
  { value: "advanced", label: "Advanced", hint: "RPE 1–10" },
  { value: "hidden", label: "Hidden", hint: "Don't ask" },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-body">{label}</span>
      <span className="aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>
        {value}
      </span>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 aur-chrome-surface p-4" aria-label={title}>
      <p className="aur-label m-0">{title}</p>
      {hint && (
        <p className="m-0 mt-1 text-small" style={{ color: "var(--aur-ink-muted)" }}>
          {hint}
        </p>
      )}
      {children}
    </section>
  );
}

export function Settings() {
  const prefs = useUiStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function doClear() {
    await clearLocalData();
    setCleared(true);
    setConfirmClear(false);
  }

  return (
    <ScreenSurface labelledBy="settings-heading">
      <header className="pt-2">
        <h1 id="settings-heading" className="aur-title">Settings</h1>
        <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
          Everything here stays on this device.
        </p>
      </header>

      <Card title="Theme" hint="Same layout and contrast throughout — only the light changes.">
        <SegmentedControl
          label="Theme"
          value={prefs.theme}
          options={THEMES}
          onChange={prefs.setTheme}
          stacked
        />
      </Card>

      <Card title="Motion" hint='"Reduced" holds ambient movement still and keeps every screen readable.'>
        <SegmentedControl
          label="Motion preference"
          value={prefs.reducedMotion}
          options={MOTION}
          onChange={prefs.setReducedMotion}
        />
      </Card>

      <Card
        title="Imagery"
        hint="Backgrounds are optional. Turning them off leaves the painted atmosphere, which is the real background anyway."
      >
        <SegmentedControl
          label="Image behaviour"
          value={prefs.imageMode}
          options={IMAGES}
          onChange={prefs.setImageMode}
        />
      </Card>

      <Card title="Weight units" hint="Used in the logger, your records and every suggestion.">
        <SegmentedControl
          label="Weight units"
          value={prefs.units}
          options={[
            { value: "lb", label: "lb", hint: "Pounds" },
            { value: "kg", label: "kg", hint: "Kilograms" },
          ]}
          onChange={prefs.setUnits}
        />
      </Card>

      <Card title="Rest timer" hint="Used when an exercise doesn't set its own rest.">
        <div role="radiogroup" aria-label="Default rest" className="mt-3 flex flex-wrap gap-2">
          {REST_PRESETS.map((s) => {
            const active = prefs.defaultRestSec === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => prefs.setDefaultRestSec(s)}
                className="aur-press aur-touch rounded-full px-4 text-small"
                style={{
                  background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                  color: active ? "var(--aur-night)" : "var(--aur-ink)",
                  border: active ? "1px solid transparent" : "1px solid var(--aur-glass-rim)",
                }}
              >
                {s < 60 ? `${s}s` : `${s / 60}:${String(s % 60).padStart(2, "0")}`}
              </button>
            );
          })}
        </div>
      </Card>

      <Card
        title="Effort check"
        hint="After a set, AURELIS can ask how hard it felt. Simple mode uses plain language; advanced shows the RPE scale; hidden leaves it out."
      >
        <SegmentedControl
          label="Effort check mode"
          value={prefs.rpeMode}
          options={RPE}
          onChange={prefs.setRpeMode}
        />
      </Card>

      <Card title="Install on iPhone" hint="AURELIS runs as a home-screen app, offline and account-free.">
        <ol
          className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-small"
          style={{ color: "var(--aur-ink-muted)" }}
        >
          <li>1. Open this page in Safari.</li>
          <li>2. Tap the Share button.</li>
          <li>3. Choose “Add to Home Screen”.</li>
        </ol>
        <p className="aur-meta m-0 mt-2">
          It opens full-screen with its own icon. Your data stays in this browser's local storage —
          installing does not upload anything.
        </p>
      </Card>

      <Card title="Accessibility">
        <div className="mt-2">
          <div className="aur-hairline" />
          <Row label="Touch targets" value="44px minimum" />
          <div className="aur-hairline" />
          <Row label="Motion" value={prefs.reducedMotion === "on" ? "Held still" : prefs.reducedMotion === "off" ? "Full" : "Follows device"} />
          <div className="aur-hairline" />
          <Row label="Imagery" value={prefs.imageMode === "save-data" ? "Off" : prefs.imageMode === "always" ? "Always on" : "Automatic"} />
          <div className="aur-hairline" />
          <Row label="Decorative images" value="Hidden from screen readers" />
          <div className="aur-hairline" />
        </div>
      </Card>

      <Card title="Your data">
        <div className="mt-2">
          <div className="aur-hairline" />
          <Row label="Storage" value="This device only" />
          <div className="aur-hairline" />
          <Row label="Local database" value={`v${SCHEMA_VERSION} · active`} />
          <div className="aur-hairline" />
          <Row label="Account" value="None" />
          <div className="aur-hairline" />
          <Row label="Analytics" value="None" />
          <div className="aur-hairline" />
        </div>
        <p className="aur-meta m-0 mt-3">
          AURELIS is local-first: no account, no server, no sync, no tracking. Your splits,
          sessions and Forge entries are stored in this browser and never sent anywhere.
        </p>

        {!confirmClear && !cleared && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="aur-press aur-touch mt-4 w-full rounded-full text-body"
            style={{
              background: "transparent",
              color: "var(--aur-danger)",
              border: "1px solid var(--aur-glass-rim)",
            }}
          >
            Clear all local data
          </button>
        )}

        {confirmClear && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: "var(--aur-glass-tint)", border: "1px solid var(--aur-glass-rim)" }}
          >
            <p className="m-0 text-body">
              This permanently deletes your split, every recorded session and set, your Forge
              entries, your records and your proof timeline.
            </p>
            <p className="aur-meta m-0 mt-2">
              It cannot be undone, and there is no backup — nothing was ever uploaded.
            </p>
            <button
              type="button"
              onClick={() => void doClear()}
              className="aur-press aur-touch mt-3 w-full rounded-full text-body font-medium"
              style={{ background: "var(--aur-danger)", color: "var(--aur-night)", border: "none" }}
            >
              Yes, delete everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="aur-press aur-touch mt-2 w-full rounded-full text-body"
              style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "none" }}
            >
              Keep my data
            </button>
          </div>
        )}

        {cleared && (
          <p className="m-0 mt-4 text-body" role="status">
            Local data cleared. Import a split to begin again.
          </p>
        )}
      </Card>
    </ScreenSurface>
  );
}
