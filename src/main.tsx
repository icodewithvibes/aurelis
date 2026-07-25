/**
 * Entry point. Loads fonts (self-hosted, no runtime CDN), tokens,
 * initializes the Dexie schema shell (no feature persistence), and
 * mounts the app shell.
 */
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { initDb } from "./data/db";

// Fire-and-forget: schema init must never block first paint.
void initDb();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
