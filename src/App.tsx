/**
 * App shell — routes the five Stage 1 destinations under a persistent
 * bottom nav, with the global grain overlay. HashRouter keeps SPA
 * routes portable (and Pages-safe for a future, out-of-scope deploy).
 */
import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { GrainOverlay } from "./components/GrainOverlay";
import { Today } from "./screens/Today";

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

export function App() {
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
      <main id="main" className="min-h-dvh">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<Today />} />
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
    </HashRouter>
  );
}
