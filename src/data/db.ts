/**
 * AURELIS Dexie/IndexedDB — Stage 1 SHELL ONLY.
 *
 * This file defines the object stores, indexes, and version from
 * 02_strategy/04_data-model.md §1 and opens the database on boot.
 * It intentionally performs NO feature reads/writes in Stage 1:
 * no workouts, sessions, Forge entries, proof events, streaks, or
 * settings are persisted. Screens run on the mock-data seam
 * (src/mocks) until Stage 2 replaces it.
 *
 * Sync-ready hygiene (locked decision [A]): UUID string ids,
 * updatedAt / deletedAt fields, schema versioning — kept as data
 * hygiene only. V1 builds NO sync/auth/backend.
 */
import Dexie, { type EntityTable } from "dexie";
import { crisisResourcesFor } from "../features/forge/crisisResources";

/* ---- Entity types (shape stubs; fleshed out by feature stages) ---- */
export interface SplitRow {
  id: string;
  name: string;
  scheduleWeekdays: number[]; // 0=Sun..6=Sat, order preserved as written (LOCKED)
  units: "lb" | "kg";
  rawASF: string;
  notes?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  deviceId: string;
}
export interface SplitDayRow {
  id: string;
  splitId: string;
  name: string;
  order: number;
  note?: string;
  updatedAt: number;
  deletedAt: number | null;
}
export interface TemplateExerciseRow {
  id: string;
  dayId: string;
  order: number;
  name: string;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  repScheme: "range" | "fixed" | "amrap";
  perSide: boolean;
  rpeMin?: number | null;
  rpeMax?: number | null;
  restSec?: number | null;
  note?: string;
  updatedAt: number;
  deletedAt: number | null;
}
export interface SessionRow {
  id: string;
  dateLocal: string; // YYYY-MM-DD device-local
  splitDayId?: string;
  splitDaySnapshot: unknown;
  status: "active" | "completed" | "partial" | "discarded";
  qualified: boolean;
  startedAt: number;
  completedAt?: number;
  notes?: string;
  updatedAt: number;
  deletedAt: number | null;
  deviceId: string;
}
export interface SetLogRow {
  id: string;
  sessionId: string;
  exerciseKey: string;
  exerciseName: string;
  setIndex: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  restActualSec?: number;
  done: boolean;
  note?: string;
  updatedAt: number;
  deletedAt: number | null;
}
export interface ForgeEntryRow {
  id: string;
  dateLocal: string;
  stateKey: string;
  note?: string;
  acknowledgment: string;
  reframe: string;
  action: string;
  estMinutes: number;
  tone: "steady" | "gentle";
  safety: boolean;
  status: "open" | "done" | "skipped";
  isDailyCommitment: boolean;
  completedAt?: number;
  updatedAt: number;
  deletedAt: number | null;
  deviceId: string;
}
export interface PrRow {
  id: string;
  exerciseName: string;
  metric: "topWeight" | "est1RM" | "repPR";
  value: number;
  dateLocal: string;
  sessionId: string;
  updatedAt: number;
  deletedAt: number | null;
}
export interface ProofEventRow {
  id: string;
  dateLocal: string;
  type: "workout" | "forge" | "pr" | "recovery" | "crest_levelup";
  refId?: string;
  title: string;
  summary?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}
export interface DayMarkRow {
  id: string;
  dateLocal: string;
  plannedRecovery: boolean;
  recoveryHonored: boolean;
  dailyCommitmentForgeId?: string;
  updatedAt: number;
  deletedAt: number | null;
}
export interface NoteRow {
  id: string;
  title?: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}
export interface SettingsRow {
  id: "app";
  units: "lb" | "kg";
  reducedMotion: "auto" | "on" | "off";
  streakCountMode: "sessions"; // LOCKED
  crisisRegion: "US-MA"; // LOCKED
  /**
   * Crisis copy (02_strategy/02 §5), seeded from features/forge.
   * Optional so rows written before this field still open; the module
   * remains the fallback and the canonical source.
   */
  crisisResources?: {
    region: string;
    immediate: string;
    distress: string;
    physical: string;
  };
  lastCrestLevel: number;
  updatedAt: number;
}
export interface RecordsRow {
  id: "alltime";
  totalSessionsKept: number;
  totalWorkoutsCompleted: number;
  totalCommitmentsCompleted: number;
  bestStreak: number;
  updatedAt: number;
}
export interface MetaRow {
  id: "meta";
  schemaVersion: number;
}

export const SCHEMA_VERSION = 1;

class AurelisDB extends Dexie {
  splits!: EntityTable<SplitRow, "id">;
  splitDays!: EntityTable<SplitDayRow, "id">;
  templateExercises!: EntityTable<TemplateExerciseRow, "id">;
  sessions!: EntityTable<SessionRow, "id">;
  setLogs!: EntityTable<SetLogRow, "id">;
  forgeEntries!: EntityTable<ForgeEntryRow, "id">;
  prs!: EntityTable<PrRow, "id">;
  proofEvents!: EntityTable<ProofEventRow, "id">;
  dayMarks!: EntityTable<DayMarkRow, "id">;
  notes!: EntityTable<NoteRow, "id">;
  settings!: EntityTable<SettingsRow, "id">;
  records!: EntityTable<RecordsRow, "id">;
  meta!: EntityTable<MetaRow, "id">;

  constructor() {
    super("aurelis");
    // Indexes per 02_strategy/04 §1 (&id = primary key).
    this.version(SCHEMA_VERSION)
      .stores({
        splits: "&id, active, updatedAt",
        splitDays: "&id, splitId, order",
        templateExercises: "&id, dayId, order",
        sessions: "&id, dateLocal, splitDayId, status, updatedAt",
        setLogs: "&id, sessionId, exerciseKey, order",
        forgeEntries: "&id, dateLocal, status",
        prs: "&id, exerciseName, dateLocal",
        proofEvents: "&id, dateLocal, type, createdAt",
        dayMarks: "&id, &dateLocal",
        notes: "&id, updatedAt",
        settings: "&id",
        records: "&id",
        meta: "&id",
      })
      // No-op migration shell: future versions chain .upgrade() here.
      .upgrade(() => {
        /* v1 baseline — nothing to migrate */
      });
  }
}

export const db = new AurelisDB();

/** Stable per-device id (sync-ready hygiene; never leaves the device). */
export function getDeviceId(): string {
  const KEY = "aurelis.deviceId";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Seed singleton default rows once (Stage 2). Local only; idempotent.
 * Locked V1 values: streakCountMode='sessions', crisisRegion='US-MA'.
 */
export async function seedDefaults(): Promise<void> {
  const now = Date.now();
  await db.transaction("rw", db.settings, db.records, db.meta, async () => {
    const settings = await db.settings.get("app");
    if (!settings) {
      await db.settings.put({
        id: "app",
        units: "lb",
        reducedMotion: "auto",
        streakCountMode: "sessions",
        crisisRegion: "US-MA",
        crisisResources: crisisResourcesFor("US-MA"),
        lastCrestLevel: 0,
        updatedAt: now,
      });
    } else if (!settings.crisisResources) {
      // Backfill for rows written before the field existed.
      await db.settings.update("app", {
        crisisResources: crisisResourcesFor(settings.crisisRegion),
        updatedAt: now,
      });
    }
    if (!(await db.records.get("alltime"))) {
      await db.records.put({
        id: "alltime",
        totalSessionsKept: 0,
        totalWorkoutsCompleted: 0,
        totalCommitmentsCompleted: 0,
        bestStreak: 0,
        updatedAt: now,
      });
    }
    if (!(await db.meta.get("meta"))) {
      await db.meta.put({ id: "meta", schemaVersion: SCHEMA_VERSION });
    }
  });
}

/**
 * Open the database on boot and seed defaults (Stage 2).
 * Never blocks rendering; failure is logged and the app degrades to a
 * no-persistence state rather than crashing.
 */
export async function initDb(): Promise<void> {
  try {
    await db.open();
    await seedDefaults();
  } catch (err) {
    console.error("[aurelis] IndexedDB unavailable — continuing without persistence.", err);
  }
}
