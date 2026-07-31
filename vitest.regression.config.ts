import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { regressionTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [...regressionTests],
    exclude: [
      ...configDefaults.exclude,
      ".claude/**",
      ".codex/**",
    ],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
