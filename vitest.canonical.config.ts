import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { canonicalScientificTestGlobs, fastTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [...canonicalScientificTestGlobs],
    exclude: [
      ...configDefaults.exclude,
      ".claude/**",
      ".codex/**",
      ...fastTests,
    ],
    passWithNoTests: true,
    testTimeout: 600_000,
    hookTimeout: 600_000,
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
