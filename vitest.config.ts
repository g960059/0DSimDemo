import path from "path";
import { defineConfig } from "vitest/config";

// Standalone config so engine tests don't pull in the React/Tailwind plugins
// from vite.config.ts. Mirrors the "@" path alias used across the app.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
