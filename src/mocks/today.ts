/**
 * ============================================================
 * MOCK DATA — Stage 1 only. NOT real user data. NOT persisted.
 * ============================================================
 * This module is the ONLY source of screen data in Stage 1.
 * Every object carries `isMock: true` and screens surface a
 * visible "sample data" marker. Stage 2 replaces the accessor
 * in src/data/access.ts with Dexie-backed reads — screens must
 * not import this file directly.
 */

export interface MockExercisePreview {
  name: string;
  sets: number;
  reps: string;
  rpe?: string;
  rest?: string;
}

export interface MockTodayView {
  isMock: true;
  greeting: string;
  dateLabel: string;
  status: "SCHEDULED_WORKOUT";
  dayName: string;
  exercises: MockExercisePreview[];
  crestLevel: number; // 0..6 Threshold Arch level
  sessionsKept: number;
  weekCompletion: { done: number; planned: number };
}

export const mockToday: MockTodayView = {
  isMock: true,
  greeting: "The work is waiting, calmly.",
  dateLabel: "Friday, July 24",
  status: "SCHEDULED_WORKOUT",
  dayName: "Push A",
  exercises: [
    { name: "Bench Press", sets: 4, reps: "6–8", rpe: "RPE 8", rest: "120s" },
    { name: "Incline Dumbbell Press", sets: 3, reps: "8–10", rpe: "RPE 8", rest: "90s" },
    { name: "Cable Fly", sets: 3, reps: "12–15", rpe: "RPE 7", rest: "60s" },
  ],
  crestLevel: 3,
  sessionsKept: 12,
  weekCompletion: { done: 2, planned: 3 },
};
