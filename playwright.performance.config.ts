import { defineConfig } from "@playwright/test";

/**
 * Explicit, production-preview performance harness.
 *
 * CDP CPU throttling is a main-thread/layout regression proxy. Chromium does
 * not reliably apply it to dedicated numerical Workers, so every report probes
 * and records main-thread and Worker slowdown separately. Device qualification
 * requires the in-product diagnostic on named physical hardware.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "workbench-performance-v3.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 45_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4174",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm run preview -- --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174/ja/experiments",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "reference-desktop",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "constrained-desktop-proxy",
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile-main-thread-layout-proxy",
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});
