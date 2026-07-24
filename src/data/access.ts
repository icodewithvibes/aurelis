/**
 * Data-access seam (Stage 1).
 *
 * THE MOCK-DATA BOUNDARY:
 * Screens call these accessors and never import src/mocks directly.
 * In Stage 2+, each accessor's body is replaced with Dexie queries
 * against src/data/db.ts — screen components stay unchanged.
 */
import { mockToday, type MockTodayView } from "../mocks/today";

export type TodayView = MockTodayView;

/** Stage 1: returns labeled mock data. Stage 2: derive from Dexie. */
export function getTodayView(): TodayView {
  return mockToday;
}
