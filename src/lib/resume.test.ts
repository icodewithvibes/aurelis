import { describe, it, expect, beforeEach } from "vitest";
import { isResumable, rememberRoute, takeResumeRoute, RESUME_WINDOW_MS } from "./resume";

const NOW = 1_700_000_000_000;

describe("isResumable", () => {
  it("resumes places you can be mid-task", () => {
    expect(isResumable("#/session/abc")).toBe(true);
    expect(isResumable("#/forge")).toBe(true);
    expect(isResumable("#/import")).toBe(true);
    expect(isResumable("#/plan")).toBe(true);
  });

  it("does NOT resume places that are just views", () => {
    // Reopening the app onto Settings or Proof would be worse than Today.
    for (const r of ["#/today", "#/settings", "#/proof", "#/train", "#/library"]) {
      expect(isResumable(r)).toBe(false);
    }
  });
});

describe("remember and restore", () => {
  beforeEach(() => localStorage.clear());

  it("returns you to the session you were in", () => {
    rememberRoute("#/session/abc", NOW);
    expect(takeResumeRoute(NOW + 60_000)).toBe("#/session/abc");
  });

  it("is consumed once, not pinned forever", () => {
    // Otherwise every launch for the rest of the day reopens the same
    // session, including after you deliberately left it.
    rememberRoute("#/session/abc", NOW);
    expect(takeResumeRoute(NOW)).toBe("#/session/abc");
    expect(takeResumeRoute(NOW)).toBeNull();
  });

  it("forgets a stale session rather than pretending no time passed", () => {
    rememberRoute("#/session/abc", NOW);
    expect(takeResumeRoute(NOW + RESUME_WINDOW_MS + 1)).toBeNull();
  });

  it("still resumes just inside the window", () => {
    rememberRoute("#/session/abc", NOW);
    expect(takeResumeRoute(NOW + RESUME_WINDOW_MS - 1)).toBe("#/session/abc");
  });

  it("clears the memory when you navigate somewhere not worth resuming", () => {
    rememberRoute("#/session/abc", NOW);
    rememberRoute("#/today", NOW);
    expect(takeResumeRoute(NOW)).toBeNull();
  });

  it("returns null with nothing stored", () => {
    expect(takeResumeRoute(NOW)).toBeNull();
  });

  it("survives corrupt storage without throwing", () => {
    localStorage.setItem("aurelis.lastRoute", "not json");
    expect(takeResumeRoute(NOW)).toBeNull();
  });

  it("ignores a stored route that is no longer resumable", () => {
    localStorage.setItem("aurelis.lastRoute", JSON.stringify({ hash: "#/settings", at: NOW }));
    expect(takeResumeRoute(NOW)).toBeNull();
  });

  it("ignores a malformed record", () => {
    localStorage.setItem("aurelis.lastRoute", JSON.stringify({ hash: 42 }));
    expect(takeResumeRoute(NOW)).toBeNull();
  });
});
