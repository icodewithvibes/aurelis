/**
 * Planner persistence — the seam between the pure planner and Dexie.
 */
import { db, getDeviceId, type PlanItemRow } from "../../data/db";
import { newId } from "../../lib/id";
import { localDay, nowMs, addDays } from "../../lib/date";
import { carriedOver, itemsForDay, nextUp, openTodayCount, type PlanKind } from "./plan";
import { setPlanBadge } from "./badge";

export async function allPlanItems(): Promise<PlanItemRow[]> {
  return (await db.planItems.toArray()).filter((i) => !i.deletedAt);
}

export interface PlanView {
  today: string;
  /** Today plus the next `days` dates, each with its items. */
  days: { dateLocal: string; items: PlanItemRow[] }[];
  carried: PlanItemRow[];
  next: ReturnType<typeof nextUp>;
  all: PlanItemRow[];
}

export async function loadPlan(days = 7, today = localDay()): Promise<PlanView> {
  const all = await allPlanItems();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // The badge is a side effect of reading the plan on purpose: it keeps
  // the home-screen icon honest without a second scheduler to drift.
  void setPlanBadge(openTodayCount(all, today));

  return {
    today,
    days: Array.from({ length: days }, (_, i) => {
      const date = addDays(today, i);
      return { dateLocal: date, items: itemsForDay(all, date) };
    }),
    carried: carriedOver(all, today),
    next: nextUp(all, today, nowMinutes),
    all,
  };
}

export interface NewPlanItem {
  title: string;
  dateLocal: string;
  atMinutes: number | null;
  estMinutes?: number;
  kind: PlanKind;
  note?: string;
}

export async function addPlanItem(input: NewPlanItem): Promise<string> {
  const now = nowMs();
  const id = newId();
  await db.planItems.put({
    id,
    dateLocal: input.dateLocal,
    title: input.title.trim(),
    atMinutes: input.atMinutes,
    estMinutes: input.estMinutes,
    kind: input.kind,
    status: "open",
    note: input.note?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    deviceId: getDeviceId(),
  });
  return id;
}

export async function setPlanStatus(
  id: string,
  status: PlanItemRow["status"],
): Promise<void> {
  const now = nowMs();
  await db.planItems.update(id, {
    status,
    completedAt: status === "done" ? now : undefined,
    updatedAt: now,
  });
}

/**
 * Move a carried item onto a new day.
 *
 * The original date is kept in `movedFrom` the FIRST time only, so an
 * item pushed four days running still says where it actually started
 * rather than "moved from yesterday" forever.
 */
export async function movePlanItem(id: string, toDate: string): Promise<void> {
  const item = await db.planItems.get(id);
  if (!item) return;
  await db.planItems.update(id, {
    dateLocal: toDate,
    movedFrom: item.movedFrom ?? item.dateLocal,
    updatedAt: nowMs(),
  });
}

export async function editPlanItem(
  id: string,
  fields: Partial<Pick<PlanItemRow, "title" | "atMinutes" | "estMinutes" | "kind" | "note">>,
): Promise<void> {
  await db.planItems.update(id, { ...fields, updatedAt: nowMs() });
}

/** Soft delete, consistent with every other table here. */
export async function removePlanItem(id: string): Promise<void> {
  const now = nowMs();
  await db.planItems.update(id, { deletedAt: now, updatedAt: now });
}

/** Move every carried item to today in one go. */
export async function pullAllCarried(today = localDay()): Promise<number> {
  const carried = carriedOver(await allPlanItems(), today, 100);
  for (const item of carried) await movePlanItem(item.id, today);
  return carried.length;
}
