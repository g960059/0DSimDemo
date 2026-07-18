import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1000 },
    locale: "ja-JP",
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [{
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 1440, height: 1000 },
    },
  }],
  webServer: {
    command:
      "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/ja/scientific-performance-lab",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
