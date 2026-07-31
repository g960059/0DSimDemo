import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { canonicalScientificTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [...canonicalScientificTests],
    exclude: [
      ...configDefaults.exclude,
      ".claude/**",
      ".codex/**",
    ],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
