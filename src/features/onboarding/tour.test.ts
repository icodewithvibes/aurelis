import { describe, it, expect } from "vitest";
import { TOUR_STEPS, targetSelector } from "./tour";

/**
 * A tour that points at nothing is worse than no tour — it dims the
 * screen, draws an arrow into empty space and tells you to tap
 * something that is not there. These pin the things that would cause
 * that, since none of them are visible from reading the step list.
 */
const ROUTES = ["/today", "/plan", "/train", "/forge", "/proof", "/settings", "/library", "/import"];

/** Anchors that actually exist in the app, kept in sync by hand. */
const ANCHORS = [
  "nav",
  "nav-today",
  "nav-plan",
  "nav-train",
  "nav-forge",
  "nav-proof",
  "nav-settings",
  "today-primary",
  "split-library",
];

describe("tour steps", () => {
  it("has unique ids — they key the dots and the step effect", () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only points at anchors that exist in the app", () => {
    // A typo here fails silently at runtime: the step just centres.
    for (const step of TOUR_STEPS) {
      if (step.target) expect(ANCHORS, `step "${step.id}"`).toContain(step.target);
    }
  });

  it("only navigates to routes the app has", () => {
    for (const step of TOUR_STEPS) {
      if (step.route) expect(ROUTES, `step "${step.id}"`).toContain(step.route);
    }
  });

  it("builds a valid attribute selector", () => {
    expect(targetSelector(TOUR_STEPS.find((s) => s.target)!)).toMatch(/^\[data-tour="[\w-]+"\]$/);
    expect(targetSelector({ id: "x", title: "t", body: "b" })).toBeNull();
  });

  it("gives every step real copy", () => {
    for (const s of TOUR_STEPS) {
      expect(s.title.length, s.id).toBeGreaterThan(4);
      expect(s.body.length, s.id).toBeGreaterThan(40);
    }
  });

  it("never nudges a click without a target to click", () => {
    // "Tap Train" with nothing highlighted is an instruction to nowhere.
    for (const s of TOUR_STEPS) {
      if (s.action && !s.target) {
        // Allowed only when the copy points somewhere descriptively
        // rather than at a highlight — check it does not say "tap X".
        expect(s.action.toLowerCase(), s.id).not.toMatch(/^tap /);
      }
    }
  });

  it("opens and closes on steps with no target, so it starts and ends calm", () => {
    expect(TOUR_STEPS[0].target).toBeUndefined();
    expect(TOUR_STEPS[TOUR_STEPS.length - 1].target).toBeUndefined();
  });

  it("ends on the step that offers the undo", () => {
    expect(TOUR_STEPS[TOUR_STEPS.length - 1].id).toBe("done");
  });

  it("stays short enough that people finish it", () => {
    expect(TOUR_STEPS.length).toBeLessThanOrEqual(12);
  });
});
