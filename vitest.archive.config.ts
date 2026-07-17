import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { archivedResearchTestGlobs, fastTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [...archivedResearchTestGlobs],
    exclude: [
      ...configDefaults.exclude,
      ".claude/**",
      ".codex/**",
      ".firebase/**",
      ...fastTests,
    ],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
