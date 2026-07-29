/**
 * Plan — what you intend to do, and when.
 *
 * Built around one honest premise: you will not do everything you
 * planned yesterday. So the screen leads with the single next thing,
 * offers yesterday's unfinished items back without scolding, and lets
 * a plan be changed rather than failed.
 *
 * The Rhythm block is the deterministic half — a wake time in, a set of
 * research-backed times out. It never adapts or learns; the same input
 * always gives the same answer, which is what makes it checkable.
 * Citations live in features/planning/rhythm.ts.
 *
 * "Send to Calendar" is the closest thing to a widget a web app can
 * honestly offer, and the copy says so rather than implying more.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScreenSurface } from "../components/ScreenSurface";
import { useAsync } from "../hooks/useAsync";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { useUiStore } from "../state/ui";
import { localDay, addDays } from "../lib/date";
import {
  loadPlan, addPlanItem, setPlanStatus, movePlanItem, removePlanItem, pullAllCarried,
} from "../features/planning/planRepo";
import {
  dayLoad, itemTimeLabel, whenLabel, planKindLabel, PLAN_KINDS, type PlanKind,
} from "../features/planning/plan";
import {
  rhythmFor, parseTime, formatTime, formatClock, formatDuration, isNextDay,
  trainingVerdict, TRAINING_VERDICT_COPY,
} from "../features/planning/rhythm";
import { buildCalendar, calendarEventCount, CALENDAR_FILENAME } from "../features/planning/ics";
import { badgingSupported, notificationPermission, requestBadgePermission } from "../features/planning/badge";
import type { PlanItemRow } from "../data/db";

const DAYS_AHEAD = 7;

function dayLabel(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function Plan() {
  const { data, loading, reload } = useAsync(() => loadPlan(DAYS_AHEAD));
  const prefs = useUiStore();
  const reduce = useMotionDisabled();
  const today = localDay();

  const [openDay, setOpenDay] = useState<string>(today);
  const [exported, setExported] = useState(false);
  const [permission, setPermission] = useState(notificationPermission());

  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  };

  const rhythm = useMemo(
    () => (prefs.wakeMinutes == null ? null : rhythmFor(prefs.wakeMinutes)),
    [prefs.wakeMinutes],
  );

  async function act(fn: () => Promise<unknown>) {
    await fn();
    reload();
  }

  function exportCalendar() {
    if (!data) return;
    const ics = buildCalendar(data.all, today, 14);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = CALENDAR_FILENAME;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
  }

  return (
    <ScreenSurface labelledBy="plan-heading">
      <motion.header {...rise} className="pt-2">
        <h1 id="plan-heading" className="aur-title">Plan</h1>
        <p className="aur-date m-0 mt-1">What you intend to do, and when.</p>
      </motion.header>

      {loading && <p className="mt-6 text-body" style={{ color: "var(--aur-ink-muted)" }}>Loading…</p>}

      {!loading && data && (
        <>
          {/* ---- NEXT UP: the one question this screen answers ---- */}
          <motion.section {...rise} className="mt-6 aur-chrome-surface p-5" aria-label="Next up">
            <p className="aur-label m-0">Next up</p>
            {data.next ? (
              <>
                <h2 className="aur-heading mt-1">{data.next.item.title}</h2>
                <p className="m-0 mt-1 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                  {itemTimeLabel(data.next.item)} · {whenLabel(data.next)}
                  {data.next.item.estMinutes ? ` · ~${data.next.item.estMinutes}m` : ""}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void act(() => setPlanStatus(data.next!.item.id, "done"))}
                    className="aur-press aur-touch flex-1 rounded-full text-body font-medium"
                    style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none", padding: "0.8rem 1rem" }}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => void act(() => movePlanItem(data.next!.item.id, addDays(today, 1)))}
                    className="aur-press aur-touch rounded-full text-body"
                    style={{ background: "var(--aur-glass-tint)", color: "var(--aur-ink)", border: "1px solid var(--aur-glass-rim)", padding: "0.8rem 1.1rem" }}
                  >
                    Tomorrow
                  </button>
                </div>
              </>
            ) : (
              <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                Nothing planned for today. Add something below, or leave it — an empty day
                you chose is not the same as one you lost.
              </p>
            )}
          </motion.section>

          {/* ---- CARRIED: offered back, never scolded ---- */}
          {data.carried.length > 0 && (
            <motion.section {...rise} className="mt-4 aur-chrome-surface p-5" aria-label="Carried over">
              <div className="flex items-baseline justify-between gap-3">
                <p className="aur-label m-0">Carried over</p>
                <button
                  type="button"
                  onClick={() => void act(() => pullAllCarried(today))}
                  className="aur-touch text-small"
                  style={{ background: "transparent", border: "none", color: "var(--aur-chrome-50)", padding: "0.25rem 0" }}
                >
                  Pull all to today
                </button>
              </div>
              <p className="aur-meta m-0 mt-1">
                These did not happen. That is information, not a failure — move what still
                matters and drop what does not.
              </p>
              <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
                {data.carried.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-small font-medium">{item.title}</span>
                      <span className="aur-meta">
                        {dayLabel(item.dateLocal, today)} · {planKindLabel(item.kind)}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => void act(() => movePlanItem(item.id, today))}
                        className="aur-press aur-touch rounded-full px-3 text-small"
                        style={{ background: "var(--aur-glass-tint)", color: "var(--aur-ink)", border: "1px solid var(--aur-glass-rim)" }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        aria-label={`Drop ${item.title}`}
                        onClick={() => void act(() => setPlanStatus(item.id, "dropped"))}
                        className="aur-press aur-touch rounded-full px-3 text-small"
                        style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "1px solid var(--aur-glass-rim)" }}
                      >
                        Drop
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {/* ---- THE DAYS ---- */}
          <motion.section {...rise} className="mt-4 aur-chrome-surface p-5" aria-label="The days ahead">
            <p className="aur-label m-0">The days ahead</p>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Choose a day">
              {data.days.map((d) => {
                const active = d.dateLocal === openDay;
                const load = dayLoad(data.all, d.dateLocal);
                return (
                  <button
                    key={d.dateLocal}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setOpenDay(d.dateLocal)}
                    className="aur-press aur-touch shrink-0 rounded-full px-3 text-small"
                    style={{
                      background: active ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
                      color: active ? "var(--aur-night)" : "var(--aur-ink)",
                      border: active ? "1px solid transparent" : "1px solid var(--aur-glass-rim)",
                    }}
                  >
                    {d.dateLocal === today ? "Today" : dayLabel(d.dateLocal, today).slice(0, 3)}
                    {load.open > 0 ? ` · ${load.open}` : ""}
                  </button>
                );
              })}
            </div>

            <DayPanel
              date={openDay}
              today={today}
              items={data.days.find((d) => d.dateLocal === openDay)?.items ?? []}
              all={data.all}
              rhythmTrainingCheck={rhythm}
              onChanged={reload}
            />
          </motion.section>

          {/* ---- RHYTHM: the deterministic half ---- */}
          <motion.section {...rise} className="mt-4 aur-chrome-surface p-5" aria-label="Rhythm">
            <p className="aur-label m-0">Rhythm</p>
            <p className="aur-meta m-0 mt-1">
              Set when you want to be up. Everything below follows from that number and
              published research — nothing here learns or adapts.
            </p>

            <label className="mt-3 flex items-center justify-between gap-3">
              <span className="text-body">Up at</span>
              <input
                type="time"
                value={prefs.wakeMinutes == null ? "" : formatTime(prefs.wakeMinutes)}
                onChange={(e) => {
                  const m = parseTime(e.target.value);
                  if (m != null) prefs.setWakeMinutes(m);
                }}
                className="aur-touch rounded-[10px] px-3 text-body"
                style={{
                  background: "var(--aur-glass-tint)",
                  border: "1px solid var(--aur-glass-rim)",
                  color: "var(--aur-ink)",
                  colorScheme: "dark",
                }}
              />
            </label>

            {rhythm && (
              <>
                <div className="mt-4">
                  <p className="aur-label m-0">Asleep by</p>
                  <ul className="m-0 mt-1.5 flex list-none flex-col gap-1 p-0">
                    {rhythm.bedtimes.map((b) => (
                      <li key={b.cycles} className="flex items-baseline justify-between gap-3">
                        <span className="aur-metric text-body">
                          {formatClock(b.asleepMinutes)}
                          {isNextDay(b.asleepMinutes) ? " (next day)" : ""}
                        </span>
                        <span className="aur-meta">
                          {formatDuration(b.sleepMinutes)} · {b.cycles} cycles · in bed{" "}
                          {formatClock(b.bedMinutes)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <hr className="aur-hairline my-4" />

                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  <RhythmRow
                    label="Last coffee"
                    value={formatClock(rhythm.coffeeCutoffMinutes)}
                    note="8.8 h before sleep (Gardiner 2023, 24-study meta-analysis)"
                  />
                  <RhythmRow
                    label="Last pre-workout"
                    value={formatClock(rhythm.preworkoutCutoffMinutes)}
                    note="13.2 h — a ~217 mg dose clears far more slowly"
                  />
                  <RhythmRow
                    label="Hard training done by"
                    value={formatClock(rhythm.trainingClearMinutes)}
                    note="4 h out is reliably neutral; 2–4 h is fine for most people"
                  />
                </ul>

                <p className="aur-meta m-0 mt-4">
                  Population figures, not a prescription. Caffeine half-life alone ranges from
                  about 1.5 to 9.5 hours between people — treat these as a starting point to
                  test against your own nights.
                </p>
              </>
            )}
          </motion.section>

          {/* ---- THE WIDGET ANSWER ---- */}
          <motion.section {...rise} className="mt-4 aur-chrome-surface p-5" aria-label="Reminders">
            <p className="aur-label m-0">Reminders and widgets</p>
            <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
              AURELIS is a web app, and a web app cannot create an iPhone widget or schedule a
              notification on its own — those need a native app and a server. What it can do is
              hand your plan to the Calendar app, which already has both.
            </p>
            <button
              type="button"
              onClick={exportCalendar}
              className="aur-press aur-touch mt-3 w-full rounded-full text-body font-medium"
              style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none", padding: "0.875rem 1.5rem" }}
            >
              {exported ? "Sent ✓ — open it to add" : `Send ${calendarEventCount(data.all, today)} items to Calendar`}
            </button>
            <p className="aur-meta m-0 mt-2">
              Opens a calendar file. Adding it gives you real alerts 10 minutes before each
              item, and the Calendar lock-screen widget will show what is next. It is a
              snapshot — change the plan and send it again.
            </p>

            {badgingSupported() && (
              <>
                <hr className="aur-hairline my-4" />
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-small font-medium">App icon count</span>
                    <span className="aur-meta">
                      {permission === "granted"
                        ? "The icon shows how many things are still open today."
                        : "Needs notification permission. Installed home-screen app only."}
                    </span>
                  </span>
                  {permission !== "granted" && (
                    <button
                      type="button"
                      onClick={() => void requestBadgePermission().then(setPermission)}
                      className="aur-press aur-touch shrink-0 rounded-full px-3 text-small"
                      style={{ background: "var(--aur-glass-tint)", color: "var(--aur-ink)", border: "1px solid var(--aur-glass-rim)" }}
                    >
                      Allow
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.section>
        </>
      )}
    </ScreenSurface>
  );
}

function RhythmRow({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-body">{label}</span>
        <span className="aur-metric text-body" style={{ color: "var(--aur-chrome-50)" }}>{value}</span>
      </div>
      <span className="aur-meta">{note}</span>
    </li>
  );
}

/** One day: its items, and the form to add another. */
function DayPanel({
  date, today, items, all, rhythmTrainingCheck, onChanged,
}: {
  date: string;
  today: string;
  items: PlanItemRow[];
  all: PlanItemRow[];
  rhythmTrainingCheck: ReturnType<typeof rhythmFor> | null;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [kind, setKind] = useState<PlanKind>("life");
  const [est, setEst] = useState("");

  const load = dayLoad(all, date);

  async function add() {
    if (!title.trim()) return;
    await addPlanItem({
      title,
      dateLocal: date,
      atMinutes: parseTime(time),
      estMinutes: est ? Number(est) : undefined,
      kind,
    });
    setTitle(""); setTime(""); setEst("");
    onChanged();
  }

  async function act(fn: () => Promise<unknown>) {
    await fn();
    onChanged();
  }

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="aur-label m-0">{dayLabel(date, today)}</p>
        {load.plannedMinutes > 0 && (
          <span className="aur-meta">{formatDuration(load.plannedMinutes)} planned</span>
        )}
      </div>

      {load.clashes.length > 0 && (
        <p className="aur-meta m-0 mt-1" style={{ color: "var(--aur-ink)" }}>
          {load.clashes.length === 1 ? "Two items overlap" : `${load.clashes.length} overlaps`} —
          fine if you meant it.
        </p>
      )}

      {items.length === 0 && (
        <p className="m-0 mt-2 text-small" style={{ color: "var(--aur-ink-muted)" }}>
          Nothing planned yet.
        </p>
      )}

      <ul className="m-0 mt-2 flex list-none flex-col gap-2.5 p-0">
        {items.map((item) => {
          const done = item.status === "done";
          const verdict =
            rhythmTrainingCheck && item.kind === "training" && item.atMinutes != null
              ? trainingVerdict(item.atMinutes + (item.estMinutes ?? 0), rhythmTrainingCheck)
              : null;
          return (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span
                  className="block truncate text-small font-medium"
                  style={{
                    color: done ? "var(--aur-ink-muted)" : "var(--aur-ink)",
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {item.title}
                </span>
                <span className="aur-meta">
                  {itemTimeLabel(item)}
                  {item.estMinutes ? ` · ~${item.estMinutes}m` : ""} · {planKindLabel(item.kind)}
                  {item.movedFrom ? " · moved" : ""}
                </span>
                {verdict === "late" && (
                  <span className="aur-meta block" style={{ color: "var(--aur-ink)" }}>
                    {TRAINING_VERDICT_COPY.late}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 gap-1.5">
                {item.status === "open" ? (
                  <button
                    type="button"
                    aria-label={`Mark ${item.title} done`}
                    onClick={() => void act(() => setPlanStatus(item.id, "done"))}
                    className="aur-press aur-touch rounded-full px-3 text-small"
                    style={{ background: "var(--aur-glass-tint)", color: "var(--aur-ink)", border: "1px solid var(--aur-glass-rim)" }}
                  >
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`Reopen ${item.title}`}
                    onClick={() => void act(() => setPlanStatus(item.id, "open"))}
                    className="aur-press aur-touch rounded-full px-3 text-small"
                    style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "1px solid var(--aur-glass-rim)" }}
                  >
                    Undo
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => void act(() => removePlanItem(item.id))}
                  className="aur-press aur-touch rounded-full px-2.5 text-small"
                  style={{ background: "transparent", color: "var(--aur-ink-faint)", border: "none" }}
                >
                  ×
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      {/* ---- add ---- */}
      <div className="mt-4 rounded-[10px] p-3" style={{ background: "var(--aur-glass-tint)" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
          placeholder="What do you want to do?"
          aria-label="What do you want to do?"
          className="aur-touch w-full rounded-[8px] px-3 text-body"
          style={{ background: "var(--aur-night)", border: "1px solid var(--aur-glass-rim)", color: "var(--aur-ink)" }}
        />
        <div className="mt-2 flex gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Around what time"
            className="aur-touch flex-1 rounded-[8px] px-2 text-small"
            style={{ background: "var(--aur-night)", border: "1px solid var(--aur-glass-rim)", color: "var(--aur-ink)", colorScheme: "dark" }}
          />
          <input
            type="number"
            inputMode="numeric"
            value={est}
            onChange={(e) => setEst(e.target.value)}
            placeholder="mins"
            aria-label="Roughly how long, in minutes"
            className="aur-touch w-20 rounded-[8px] px-2 text-small"
            style={{ background: "var(--aur-night)", border: "1px solid var(--aur-glass-rim)", color: "var(--aur-ink)" }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kind">
          {PLAN_KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              role="radio"
              aria-checked={kind === k.key}
              onClick={() => setKind(k.key)}
              className="aur-press aur-touch rounded-full px-3 text-small"
              style={{
                background: kind === k.key ? "var(--aur-chrome-50)" : "transparent",
                color: kind === k.key ? "var(--aur-night)" : "var(--aur-ink-muted)",
                border: "1px solid var(--aur-glass-rim)",
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void add()}
          disabled={!title.trim()}
          className="aur-press aur-touch mt-2 w-full rounded-full text-body font-medium"
          style={{
            background: title.trim() ? "var(--aur-chrome-50)" : "var(--aur-glass-tint)",
            color: title.trim() ? "var(--aur-night)" : "var(--aur-ink-faint)",
            border: "none",
            padding: "0.7rem 1rem",
          }}
        >
          Add to {dayLabel(date, today).toLowerCase()}
        </button>
      </div>
    </div>
  );
}
