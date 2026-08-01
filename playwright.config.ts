import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  // Each project autostarts an exact V3 numerical Worker. Shared CI runners
  // cannot provide a meaningful playback-rate signal while desktop and mobile
  // simulations compete for the same CPU, so preserve the threshold and
  // serialize projects only in CI.
  workers: process.env.CI ? 1 : undefined,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/ja/workbench",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      grep: /@desktop/,
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      grep: /@mobile/,
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});
