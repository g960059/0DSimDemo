import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/rest/v1/rpc/save_experiment_v1", route => route.abort("blockedbyclient"));
});

test("@desktop @webkit @startup keeps playback presets clickable above layout resize handles", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ja/experiments/new", { waitUntil: "domcontentloaded" });
  const rate = page.getByTestId("v3-playback-rate-trigger");
  await expect(rate).toBeEnabled();
  await rate.click();
  const halfSpeed = page.getByTestId("v3-playback-rate-popover").getByRole("button", { name: "0.5×", exact: true });
  const button = (await halfSpeed.boundingBox())!;
  const clickX = button.x + button.width / 2;
  await page.keyboard.press("Escape");
  const handle = page.getByTestId("workbench-inspector-resize-handle");
  const before = (await handle.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(clickX, before.y + before.height / 2);
  await page.mouse.up();
  await rate.click();
  // Exercise a real overlap: header contents differ between local and
  // configured deployments, and the inspector width is user-adjustable.
  const resized = (await handle.boundingBox())!;
  expect(Math.abs(resized.x + resized.width / 2 - clickX)).toBeLessThan(2);
  expect(button.y + button.height / 2).toBeGreaterThan(resized.y);
  await halfSpeed.click({ timeout: 5_000 });
  await expect(rate).toHaveText("0.5×");
  await page.keyboard.press("Escape");
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(async () => (await handle.boundingBox())!.x).toBeLessThan(resized.x - 1);
});

test("@desktop @mobile @webkit @startup preserves the requested speed through startup and Scenario changes", async ({ page, context }) => {
  // Capture even brief intermediate labels from the very first live render.
  await page.addInitScript(() => {
    const values: string[] = [];
    Object.assign(window, { startupPlaybackLabels: values });
    new MutationObserver(() => {
      const value = document.querySelector('[data-testid="v3-playback-rate-trigger"]')?.textContent?.trim();
      if (value && values.at(-1) !== value) values.push(value);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await context.route(/\/assets\/StudioSimulationWorkerV2-[^/]+\.js$/, async route => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  const rate = page.getByTestId("v3-playback-rate-trigger");
  try {
    await page.goto("/ja/experiments/new", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-simulation-preparation="true"]')).toBeVisible();
    await expect(rate).toHaveCount(0);
  } finally {
    release();
  }
  const root = page.getByTestId("v3-dockview-workbench");
  await expect(rate).toHaveText("1×");
  await expect(rate).toBeEnabled();
  const mobile = (page.viewportSize()?.width ?? 1440) < 768;
  const deck = page.getByTestId("workbench-mobile-task-deck");
  if (mobile) await deck.getByRole("tab", { name: "Scenario", exact: true }).click();
  const manager = page.getByTestId("workbench-scenario-manager-v3");
  const checkProgress = async () => {
    const before = Number(await root.getAttribute("data-model-time-sec"));
    await expect.poll(async () => Number(await root.getAttribute("data-model-time-sec"))).toBeGreaterThan(before + 0.5);
    await expect(page.getByTestId("workbench-calculation-stopped")).toHaveCount(0);
  };
  const duplicate = async () => {
    await manager.getByRole("button", { name: "Scenarioメニュー: baseline", exact: true }).click();
    await page.getByRole("menu", { name: "Scenarioメニュー: baseline", exact: true }).getByRole("menuitem", { name: "複製", exact: true }).click();
    await expect(manager.getByRole("button", { name: /Scenarioメニュー:/ })).toHaveCount(2);
    await checkProgress();
  };
  await checkProgress();
  await duplicate();
  await expect(rate).toHaveText("1×");
  await manager.getByRole("button", { name: "Scenarioメニュー: baseline のコピー", exact: true }).click();
  await page.getByRole("menu", { name: "Scenarioメニュー: baseline のコピー", exact: true }).getByRole("menuitem", { name: "削除", exact: true }).click();
  await expect(manager.getByRole("button", { name: /Scenarioメニュー:/ })).toHaveCount(1);
  await checkProgress();
  expect(await page.evaluate(() => (window as unknown as { startupPlaybackLabels: string[] }).startupPlaybackLabels)).toEqual(["1×"]);

  // A deliberately selected slow speed is also retained, never promoted by
  // calibration or reset after the Scenario topology changes.
  await rate.click();
  await page.getByTestId("v3-playback-rate-popover").getByRole("button", { name: "0.5×", exact: true }).click();
  await page.keyboard.press("Escape");
  await duplicate();
  await expect(rate).toHaveText("0.5×");
  expect(await page.evaluate(() => (window as unknown as { startupPlaybackLabels: string[] }).startupPlaybackLabels)).toEqual(["1×", "0.5×"]);
});

test("@desktop @mobile @webkit @startup shows preparation without technical copy or fabricated progress, then releases ready content", async ({ page, context }, testInfo) => {
  await page.clock.install();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  // Delay the actual Worker in both local-registry and configured builds.
  // The isolated browser CI build intentionally makes no remote registry call.
  await context.route(/\/assets\/StudioSimulationWorkerV2-[^/]+\.js$/, async route => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto("/ja/experiments/new", { waitUntil: "domcontentloaded" });
  const root = page.getByTestId("v3-dockview-workbench");
  const preparing = root.locator('[data-simulation-preparation="true"]');
  try {
    await expect(preparing).toBeVisible();
    await expect(preparing.getByRole("status")).toHaveText("シミュレーションを準備しています…");
    await expect(root.locator('[data-simulation-placeholder="graph"]').first()).toBeVisible();
    await expect(root.getByRole("progressbar")).toHaveCount(0);
    await expect(preparing).not.toContainText(/V3|Worker|registry|workbench|accepted/i);
    await page.screenshot({ path: testInfo.outputPath("preparing.png") });
    await page.clock.fastForward(10_100);
    await expect(preparing.getByRole("button", { name: "もう一度読み込む" })).toBeVisible();
    await expect(preparing).toContainText("通常より時間がかかっています");
    await preparing.getByRole("button", { name: "もう一度読み込む" }).click();
    await expect(preparing.getByRole("button")).toHaveCount(0);
    await expect(preparing).toHaveCount(1);
  } finally {
    release();
  }
  await expect(preparing).toHaveCount(0);
  await expect(root.locator('[data-simulation-placeholder="output"]')).toHaveCount(0);
  await expect(root.locator('[data-chart-kind="pressure-volume-loop-v3"]')).toBeVisible();
});

test("@desktop @mobile @webkit @startup uses the resolved pane titles and keeps ready charts independent of optional curve loading", async ({ page, context }, testInfo) => {
  let releaseWorker!: () => void;
  let releaseCurves!: () => void;
  const workerGate = new Promise<void>(resolve => { releaseWorker = resolve; });
  const curvesGate = new Promise<void>(resolve => { releaseCurves = resolve; });
  let curveRequests = 0;
  await context.route(/\/assets\/StudioSimulationWorkerV2-[^/]+\.js$/, async route => {
    const response = await route.fetch();
    await workerGate;
    await route.fulfill({ response });
  });
  await page.route(/\/assets\/[a-f0-9]{64}-[^/]+\.json$/, async route => {
    curveRequests += 1;
    const response = await route.fetch();
    await curvesGate;
    await route.fulfill({ response });
  });
  try {
    await page.goto("/ja/experiments/new", { waitUntil: "domcontentloaded" });
    const root = page.getByTestId("v3-dockview-workbench");
    await expect(root.getByText("PV loop", { exact: true }).first()).toBeVisible();
    await expect(root.locator('[data-simulation-placeholder="graph"]').first()).toBeVisible();
    await expect(root.locator('[data-simulation-preparation="true"]')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("resolved-layout-preparing.png") });
    releaseWorker();
    await expect(root.locator('[data-simulation-preparation="true"]')).toHaveCount(0);
    const pv = root.locator('[data-chart-kind="pressure-volume-loop-v3"]');
    await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "1");
    expect(curveRequests).toBeGreaterThan(0);
    await expect(pv).toHaveAttribute("data-pva-analysis-pending", "true");
    const legend = pv.locator('[data-chart-legend-row="true"]');
    const indicator = legend.locator('[data-simulation-update="true"]');
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute("title", "補助線を準備しています…");
    await expect(indicator).toHaveText("");
    await expect(pv.locator('[data-simulation-chart-status="true"]')).toHaveCount(0);
    const legendBox = (await legend.boundingBox())!;
    const indicatorBox = (await indicator.boundingBox())!;
    const settings = legend.getByTestId("pane-settings-button-v3");
    await expect(settings).toBeVisible();
    const settingsBox = (await settings.boundingBox())!;
    // The pane-specific Settings action now owns the far right of the legend row.
    expect(Math.abs(legendBox.x + legendBox.width - settingsBox.x - settingsBox.width)).toBeLessThanOrEqual(14);
    expect(indicatorBox.x + indicatorBox.width).toBeLessThanOrEqual(settingsBox.x + 1);
    expect(Math.abs(indicatorBox.y + indicatorBox.height / 2 - settingsBox.y - settingsBox.height / 2)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath("legend-update-icon.png") });
    if ((page.viewportSize()?.width ?? 1440) >= 768) {
      const structural = root.locator('[data-analysis-pending="true"]');
      await expect(structural.locator('[data-chart-legend-row="true"] [data-simulation-update="true"]')).toBeVisible();
      expect(await structural.innerText()).not.toContain("曲線を準備しています");
    }
    // A delayed optional curve must not block exact simulation data or controls.
    await expect(root.getByRole("textbox", { name: /^HRの正確な値/ })).toBeEnabled();
  } finally {
    releaseWorker();
    releaseCurves();
  }
});

test("@desktop @mobile @webkit @startup draws an open PV trajectory before the first complete beat and preserves it while paused", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const drawn: { lines: number; closed: boolean }[] = [];
    Object.assign(window, { partialPvStrokes: drawn });
    const paths = new WeakMap<CanvasRenderingContext2D, { lines: number; closed: boolean }>();
    const prototype = CanvasRenderingContext2D.prototype;
    const { beginPath, lineTo, closePath, stroke } = prototype;
    prototype.beginPath = function () { paths.set(this, { lines: 0, closed: false }); return beginPath.call(this); };
    prototype.lineTo = function (x, y) { const path = paths.get(this); if (path) path.lines++; return lineTo.call(this, x, y); };
    prototype.closePath = function () { const path = paths.get(this); if (path) path.closed = true; return closePath.call(this); };
    prototype.stroke = function (explicitPath?: Path2D) {
      const chart = this.canvas.closest('[data-chart-kind="pressure-volume-loop-v3"]');
      const path = paths.get(this);
      if (chart?.getAttribute("data-pv-ready-trace-count") === "0" && this.lineWidth === 2
        && this.getLineDash().length === 0 && path && path.lines > 0) drawn.push({ ...path });
      return Reflect.apply(stroke, this, explicitPath === undefined ? [] : [explicitPath]);
    };
  });
  await page.goto("/ja/experiments/new");
  const root = page.getByTestId("v3-dockview-workbench");
  const pv = root.locator('[data-chart-kind="pressure-volume-loop-v3"]');
  await expect(pv).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { partialPvStrokes: unknown[] }).partialPvStrokes.length)).toBeGreaterThan(0);
  await page.getByTestId("v3-playback-toggle").click();
  await expect(root).toHaveAttribute("data-playback", "paused");
  await expect(pv).toHaveAttribute("data-pv-cycle-pending", "true");
  await expect(pv).toHaveAttribute("data-pv-drawn-trace-count", "1");
  // Prepared reference curves do not count as an actual recorded heartbeat.
  await expect.poll(async () => Number(await pv.getAttribute("data-pva-drawing-count"))).toBeGreaterThan(0);
  await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "0");
  await expect(pv.locator('[data-simulation-chart-status="true"]')).toHaveCount(0);
  const partialStrokes = await page.evaluate(() => (window as unknown as { partialPvStrokes: { closed: boolean }[] }).partialPvStrokes);
  expect(partialStrokes.every(stroke => !stroke.closed)).toBe(true);
  const before = await pv.locator("canvas").boundingBox();
  await page.screenshot({ path: testInfo.outputPath("first-beat-paused.png") });
  await page.getByTestId("v3-playback-toggle").click();
  await expect(pv.locator('[data-simulation-chart-status="true"]')).toHaveCount(0);
  await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "1");
  await expect(pv.locator('[data-simulation-chart-status="true"]')).toHaveCount(0);
  const after = await pv.locator("canvas").boundingBox();
  for (const key of ["x", "y", "width", "height"] as const) expect(Math.abs(after![key] - before![key])).toBeLessThanOrEqual(1);
  await page.getByTestId("v3-playback-toggle").click();
  await page.screenshot({ path: testInfo.outputPath("ready.png") });
  // Retain history while paused after an input change, then draw the first new
  // samples without waiting for a complete cycle.
  const hr = root.getByRole("textbox", { name: /^HRの正確な値/ });
  await hr.fill("80");
  await hr.press("Enter");
  await expect(pv).toHaveAttribute("data-pv-cycle-pending", "true");
  await expect(pv).toHaveAttribute("data-pv-drawn-trace-count", "0");
  await expect(pv).toHaveAttribute("data-pv-history-loop-count", "1");
  await expect(root.getByText("薄い線：変更前", { exact: true })).toHaveCount(0);
  await expect(pv.getByRole("status")).toHaveText("再生すると、軌跡の描画を開始します");
  await page.getByTestId("v3-playback-toggle").click();
  await expect(pv).toHaveAttribute("data-pv-drawn-trace-count", "1");
  await expect(pv).toHaveAttribute("data-pv-ready-trace-count", "0");
  await expect(pv).not.toContainText(/1拍|complete beat/);
  await expect(pv).toHaveAttribute("data-pv-cycle-pending", "false");
  await expect(root).not.toContainText(/V3 pane|accepted step|Settling source/);
  expect(errors).toEqual([]);
});
