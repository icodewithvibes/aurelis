/**
 * App shell — routes the five Stage 1 destinations under a persistent
 * bottom nav, with the global grain overlay. HashRouter keeps SPA
 * routes portable (and Pages-safe for a future, out-of-scope deploy).
 */
import { lazy, Suspense, useEffect, useRef } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { rememberRoute } from "./lib/resume";
import { BottomNav } from "./components/BottomNav";
import { GrainOverlay } from "./components/GrainOverlay";
import { TutorialCoach } from "./components/TutorialCoach";
import { Today } from "./screens/Today";
import { firstRunDecision, markTutorialSeen } from "./features/onboarding/tutorialRepo";
import { takeSnapshot, revertToSnapshot, describeRevert, type TourSnapshot } from "./features/onboarding/tourLedger";
import { useUiStore } from "./state/ui";

/**
 * Today is bundled with the shell because it is the landing route and
 * must paint immediately. Every other screen is fetched on first visit,
 * which keeps the initial download to what a cold start actually needs.
 * Chunks are small and same-origin, so the swap is imperceptible; the
 * fallback below exists only for a slow first tap.
 */
const Train = lazy(() => import("./screens/Train").then((m) => ({ default: m.Train })));
const Forge = lazy(() => import("./screens/Forge").then((m) => ({ default: m.Forge })));
const Proof = lazy(() => import("./screens/Proof").then((m) => ({ default: m.Proof })));
const Settings = lazy(() => import("./screens/Settings").then((m) => ({ default: m.Settings })));
const Import = lazy(() => import("./screens/Import").then((m) => ({ default: m.Import })));
const Library = lazy(() => import("./screens/Library").then((m) => ({ default: m.Library })));
const Plan = lazy(() => import("./screens/Plan").then((m) => ({ default: m.Plan })));
const Session = lazy(() => import("./screens/Session").then((m) => ({ default: m.Session })));

/** Calm and unstyled-free: the cobalt surface, never a spinner flash. */
function RouteFallback() {
  return (
    <div
      className="min-h-dvh"
      style={{ background: "var(--aur-fallback-cobalt)" }}
      aria-busy="true"
      aria-live="polite"
    />
  );
}

/**
 * Decides once per launch whether this is somebody's first time.
 *
 * An existing user who predates the tutorial is marked seen SILENTLY —
 * meeting a "here's how to log a set" walkthrough after months of
 * sessions would be insulting. See features/onboarding/tutorial.ts.
 *
 * This ONLY handles the automatic case. Opening the tutorial on request
 * goes straight to the store, because re-deriving "is this a new user"
 * would answer no for anyone with history and silently discard the ask.
 */
function useFirstRun(): void {
  const openTutorial = useUiStore((s) => s.openTutorial);

  useEffect(() => {
    let alive = true;
    void firstRunDecision().then(async (decision) => {
      if (!alive) return;
      if (decision === "show") openTutorial();
      else if (decision === "mark-seen-silently") await markTutorialSeen();
    });
    return () => {
      alive = false;
    };
  }, [openTutorial]);
}

/**
 * Remembers the current route so a phone that locks mid-session comes
 * back to that session rather than to Today. Lives inside the router so
 * it can see navigation; the restore itself already happened in main.
 */
function RouteMemory() {
  const location = useLocation();
  useEffect(() => {
    rememberRoute(`#${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);
  return null;
}

export function App() {
  useFirstRun();
  const tutorialOpen = useUiStore((s) => s.tutorialOpen);
  const closeTutorial = useUiStore((s) => s.closeTutorial);

  /*
   * The state of the database the instant the tour opened.
   *
   * Captured here rather than inside the coach so it is taken BEFORE
   * the first step can navigate anywhere or create anything — a
   * snapshot taken a moment late would treat the tour's own first row
   * as pre-existing and refuse to undo it.
   */
  const snapshotRef = useRef<TourSnapshot | null>(null);
  useEffect(() => {
    if (!tutorialOpen) return;
    let alive = true;
    void takeSnapshot().then((s) => {
      if (alive) snapshotRef.current = s;
    });
    return () => {
      alive = false;
    };
  }, [tutorialOpen]);

  return (
    <HashRouter>
      <a
        href="#main"
        className="sr-only focus:not-sr-only"
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          zIndex: 60,
          background: "var(--aur-chrome-50)",
          color: "var(--aur-night)",
          padding: "0.5rem 0.75rem",
          borderRadius: 8,
        }}
      >
        Skip to content
      </a>
      <RouteMemory />
      <main id="main" className="min-h-dvh">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<Today />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/train" element={<Train />} />
            <Route path="/import" element={<Import />} />
            <Route path="/library" element={<Library />} />
            <Route path="/session/:id" element={<Session />} />
            <Route path="/forge" element={<Forge />} />
            <Route path="/proof" element={<Proof />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </Suspense>
      </main>
      <BottomNav />
      <GrainOverlay />
      {tutorialOpen && (
        <TutorialCoach
          onClose={() => {
            closeTutorial();
            void markTutorialSeen();
          }}
          onRevert={async () => {
            /* Snapshot is taken when the tour opens, so this can only
               ever remove rows the tour itself created. */
            const snap = snapshotRef.current;
            if (!snap) return "Nothing to undo.";
            return describeRevert(await revertToSnapshot(snap));
          }}
        />
      )}
    </HashRouter>
  );
}
