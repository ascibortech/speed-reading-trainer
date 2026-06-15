import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves a project site under /speed-reading-trainer/. Use that base
// for production builds; "/" for local dev (architecture-plan §4).
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/speed-reading-trainer/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
}));
