import { defineConfig } from "@playwright/test";

/**
 * Explicit, production-preview performance harness.
 *
 * CPU throttling is a reproducible regression proxy, not a claim about a real
 * phone or low-end laptop. Device qualification still requires the same run on
 * named physical hardware as documented in DESIGN-STUDIO-005.
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
      name: "mobile-layout-proxy",
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});
