import path from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { heavyTests } from "./vitest.suites";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [...heavyTests],
    exclude: [...configDefaults.exclude, ".claude/**", ".codex/**", ".firebase/**"],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
});
