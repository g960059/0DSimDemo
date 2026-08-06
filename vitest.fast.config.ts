import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { fastTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [...fastTests],
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
