/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";

// AURELIS Stage 1 — static, local-first frontend.
// `base` stays relative so a future GitHub Pages deploy (out of scope now)
// needs no config change; hash routing keeps SPA routes Pages-safe.
/**
 * A build stamp the phone can show back to us.
 *
 * There is no service worker, so a stale installed PWA is really just a
 * stale `index.html` in the iOS HTTP cache — invisible from the outside
 * and indistinguishable from "the fix didn't work". Settings prints
 * this, which turns "is he even on the new build?" into a question he
 * can answer by reading one line out loud.
 */
const buildStamp = (() => {
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  try {
    const sha = execSync("git rev-parse --short HEAD").toString().trim();
    return `${sha} · ${stamp}`;
  } catch {
    return `local · ${stamp}`;
  }
})();

export default defineConfig({
  base: "./",
  define: { __BUILD_STAMP__: JSON.stringify(buildStamp) },
  plugins: [react(), tailwindcss()],
  build: {
    /**
     * Pin the CSS floor explicitly instead of inheriting `build.target`,
     * whose Safari 14 entry would license esbuild to strip properties
     * this app needs unprefixed.
     *
     * This is hygiene, NOT the fix for the dropped `backdrop-filter` —
     * setting it changed nothing, measured. That bug lives one stage
     * earlier: `@tailwindcss/vite` runs Lightning CSS over the CSS with
     * targets hard-coded in `@tailwindcss/node` (safari 16.4, ios_saf
     * 16.4, chrome 111, firefox 128) and no way to configure them. The
     * unprefixed property only reached Safari in 18, so at a 16.4 floor
     * Lightning treats the pair as one property needing a prefix and
     * emits the prefixed form alone. Chrome takes `-webkit-` as an
     * alias, so the glass survived there and only Firefox lost it —
     * which is why this hid so long. The actual fix is declaration
     * ORDER, in index.css; see the note there before touching it.
     */
    cssTarget: ["chrome90", "edge90", "firefox90", "safari15.4"],
    rollupOptions: {
      output: {
        /**
         * Split the dependencies that change on a different clock from
         * app code, so a copy edit doesn't invalidate React or Dexie in
         * a returning user's cache. Route chunks come from React.lazy in
         * App.tsx; this only groups vendor code.
         */
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          data: ["dexie", "zustand"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: false,
  },
});
