import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { diagnosticEngineTests, fastEngineTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [
      "engine/__tests__/*.test.ts",
    ],
    exclude: [
      ...configDefaults.exclude,
      ".claude/**",
      ".codex/**",
      ".firebase/**",
      "__tests__/firestoreRules.emulator.test.ts",
      ...fastEngineTests,
      ...diagnosticEngineTests,
    ],
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
