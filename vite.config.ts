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
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: false,
  },
});
