/**
 * LogActivity — record a run (or ride, walk, row, swim) done outside the
 * split. "I lifted and then ran a mile" is real work and belongs on the
 * record; it just isn't the split's session, so it is stored separately
 * and never inflates the kept-day count.
 */
import { useEffect, useState } from "react";
import type { ActivityRow } from "../data/db";
import {
  ACTIVITY_KINDS,
  deleteActivity,
  describeActivity,
  logActivity,
  paceFor,
  activitiesOn,
} from "../features/activity/activityRepo";
import { useUiStore } from "../state/ui";

const numeric = (v: string) => (v.trim() ? Number(v.replace(/[^\d.]/g, "")) : undefined);

export function LogActivity() {
  const units = useUiStore((s) => s.units);
  const distanceUnit = units === "kg" ? "km" : "mi";

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ActivityRow["kind"]>("run");
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [recent, setRecent] = useState<ActivityRow[]>([]);

  /*
   * TODAY'S activities only.
   *
   * This used to load the five most recent across ALL time, with no
   * date shown — so a run logged days ago sat under "Today" forever and
   * read as if it had just happened. Completing a session did not clear
   * it either, because nothing about the list was scoped to the day.
   *
   * The full history is not lost: every activity still appears on its
   * own day in the Proof timeline, which is where a record belongs.
   */
  useEffect(() => {
    let alive = true;
    void activitiesOn().then((a) => alive && setRecent(a));
    return () => {
      alive = false;
    };
  }, []);

  const canSave = numeric(distance) !== undefined || numeric(minutes) !== undefined;

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await logActivity({
        kind,
        distance: numeric(distance),
        minutes: numeric(minutes),
        distanceUnit,
        note,
      });
      setDistance("");
      setMinutes("");
      setNote("");
      setOpen(false);
      setRecent(await activitiesOn());
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await deleteActivity(id);
    setRecent(await activitiesOn());
  }

  const field = {
    height: 44,
    color: "var(--aur-ink)",
    background: "rgba(7,12,24,0.55)",
    border: "1px solid var(--aur-glass-rim)",
  } as const;

  return (
    <div className="mt-4">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="aur-press aur-touch w-full rounded-full text-body"
          style={{
            background: "var(--aur-glass-tint)",
            color: "var(--aur-ink)",
            border: "1px solid var(--aur-glass-rim)",
          }}
        >
          Log a run or ride
        </button>
      )}

      {open && (
        <section aria-label="Log an activity">
          <div className="flex items-baseline justify-between gap-3">
            <p className="aur-label m-0">Log an activity</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="aur-touch text-small"
              style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)" }}
            >
              Close
            </button>
          </div>

          <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
            {ACTIVITY_KINDS.map((k) => {
              const active = kind === k.key;
              return (
                <li key={k.key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setKind(k.key)}
                    className="aur-press aur-touch rounded-full px-3 text-[0.75rem]"
                    style={{
                      minHeight: 36,
                      background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                      color: active ? "var(--aur-night)" : "var(--aur-ink-muted)",
                      border: "1px solid var(--aur-glass-rim)",
                    }}
                  >
                    {k.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex gap-2">
            <div className="flex-1">
              <label className="sr-only" htmlFor="act-distance">
                Distance in {distanceUnit}
              </label>
              <input
                id="act-distance"
                value={distance}
                inputMode="decimal"
                placeholder={distanceUnit}
                onChange={(e) => setDistance(e.target.value.replace(/[^\d.]/g, ""))}
                className="aur-touch aur-metric w-full rounded-lg px-3 text-center"
                style={field}
              />
            </div>
            <div className="flex-1">
              <label className="sr-only" htmlFor="act-minutes">
                Minutes
              </label>
              <input
                id="act-minutes"
                value={minutes}
                inputMode="numeric"
                placeholder="min"
                onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, ""))}
                className="aur-touch aur-metric w-full rounded-lg px-3 text-center"
                style={field}
              />
            </div>
          </div>

          <label className="sr-only" htmlFor="act-note">
            Note
          </label>
          <input
            id="act-note"
            value={note}
            placeholder="Note (optional)"
            onChange={(e) => setNote(e.target.value)}
            className="aur-touch mt-2 w-full rounded-lg px-3 text-body"
            style={field}
          />

          <button
            type="button"
            onClick={() => void save()}
            disabled={!canSave || saving}
            className="aur-press aur-touch mt-3 w-full rounded-full text-body font-medium"
            style={{
              background: canSave ? "var(--aur-chrome-50)" : "rgba(210,217,230,0.16)",
              color: canSave ? "var(--aur-night)" : "var(--aur-ink-muted)",
              border: "none",
              padding: "0.75rem 1.25rem",
            }}
          >
            {saving ? "Saving…" : "Record it"}
          </button>

          <p className="aur-meta m-0 mt-2">
            Kept on your timeline. It doesn&apos;t change your split&apos;s kept-day count — that
            stays a record of the plan itself.
          </p>
        </section>
      )}

      {recent.length > 0 && (
        <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
          {recent.map((a) => {
            const pace = paceFor(a);
            return (
              <li key={a.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-small">{describeActivity(a)}</span>
                  {pace && <span className="aur-meta">{pace}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => void remove(a.id)}
                  aria-label={`Delete ${describeActivity(a)}`}
                  className="aur-touch shrink-0 text-small"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--aur-ink-faint)",
                    minHeight: 32,
                  }}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
