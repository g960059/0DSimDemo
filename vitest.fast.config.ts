import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { diagnosticResearchTests, fastEngineTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [
      "__tests__/*.test.ts",
      "components/__tests__/*.test.ts",
      ...fastEngineTests,
    ],
    exclude: [
      ...configDefaults.exclude,
      ".claude/**",
      ".codex/**",
      ".firebase/**",
      "__tests__/firestoreRules.emulator.test.ts",
      ...diagnosticResearchTests,
    ],
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
