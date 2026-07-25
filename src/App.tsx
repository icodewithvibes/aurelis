/**
 * App shell — routes the five Stage 1 destinations under a persistent
 * bottom nav, with the global grain overlay. HashRouter keeps SPA
 * routes portable (and Pages-safe for a future, out-of-scope deploy).
 */
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { GrainOverlay } from "./components/GrainOverlay";
import { Today } from "./screens/Today";
import { Train } from "./screens/Train";
import { Forge } from "./screens/Forge";
import { Proof } from "./screens/Proof";
import { Settings } from "./screens/Settings";
import { Import } from "./screens/Import";
import { Session } from "./screens/Session";

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
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/train" element={<Train />} />
          <Route path="/import" element={<Import />} />
          <Route path="/session/:id" element={<Session />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/proof" element={<Proof />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <BottomNav />
      <GrainOverlay />
    </HashRouter>
  );
}
