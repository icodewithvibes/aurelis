/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// AURELIS Stage 1 — static, local-first frontend.
// `base` stays relative so a future GitHub Pages deploy (out of scope now)
// needs no config change; hash routing keeps SPA routes Pages-safe.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
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
