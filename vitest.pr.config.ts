import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { prSmokeTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [...prSmokeTests],
    exclude: [
      ...configDefaults.exclude,
      ".claude/**",
      ".codex/**",
    ],
    testTimeout: 10_000,
    hookTimeout: 10_000,
    slowTestThreshold: 1_000,
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
