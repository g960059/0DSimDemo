import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const model = "circleheart.main-wire-integrated-transaction-v3.reference-baseline.standard-71";
const surface = "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.workbench-v2";
const path = `/ja/models/${model}?surface=${surface}`;
test("standalone model documentation is readable and shallow @desktop @mobile @webkit", async ({ page, browser }, testInfo) => {
  const errors: string[] = [];
  const workers: string[] = [];
  const fontFailures: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("worker", worker => workers.push(worker.url()));
  page.on("requestfailed", request => { if (/\.(woff2?|ttf)(?:\?|$)/.test(request.url())) fontFailures.push(request.url()); });
  page.on("response", response => { if (/\.(woff2?|ttf)(?:\?|$)/.test(response.url()) && !response.ok()) fontFailures.push(`${response.status()} ${response.url()}`); });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Main Wire Standard 71", exact: true })).toBeVisible();
  await expect(page.locator("details details")).toHaveCount(0);
  await expect(page.locator("details[open]")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("overview.png") });

  await page.getByRole("link", { name: "baselineの評価", exact: true }).click();
  await expect(page.locator('[data-metric-id="timing.tei-index"]')).toHaveAttribute("data-status", "warning");
  await page.locator('[data-metric-id="aortic-valve.mean-gradient"] summary').click();
  await expect(page.locator('[data-metric-id="aortic-valve.mean-gradient"]')).toHaveAttribute("open", "");
  await page.getByLabel("検証記録", { exact: true }).selectOption("1");
  await expect(page.locator('[data-metric-id="aortic-valve.mean-gradient"] summary')).toContainText("4.27");
  await page.screenshot({ path: testInfo.outputPath("baseline.png") });
  await page.getByRole("button", { name: "説明をすべて開く", exact: true }).click();
  expect(await page.locator("details:not([open])").count()).toBe(0);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  // A computed font-family is insufficient: the old worktree preview had that
  // family in CSS but returned 403 for every actual font file.
  const loadedFonts = await page.evaluate(async () => {
    const fonts = await Promise.all(["16px KaTeX_Main", "italic 16px KaTeX_Math", "16px KaTeX_Size2"].map(font => document.fonts.load(font)));
    await document.fonts.ready;
    return fonts.map(faces => faces.length > 0 && faces.every(face => face.status === "loaded"));
  });
  expect(loadedFonts).toEqual([true, true, true]);
  const wallSymbols = page.locator("#five-wall-energy-triseg-v1 .model-symbol-definitions dt");
  await expect(wallSymbols).toHaveCount(3);
  for (const symbol of await wallSymbols.all()) {
    await expect(symbol.locator(".katex")).toHaveCount(1);
    expect(await symbol.locator(".katex-mathml msub").count()).toBeGreaterThan(0);
  }
  await page.locator("#five-wall-energy-triseg-v1 .model-math-display").first().screenshot({ path: testInfo.outputPath("wall-equation-typography.png") });
  await page.locator("#five-wall-energy-triseg-v1 .model-symbol-definitions").screenshot({ path: testInfo.outputPath("wall-symbol-typography.png") });
  const controls = page.locator("[data-control-id]");
  await expect(controls).toHaveCount(52);
  await expect(page.locator('[data-control-id="hemodynamics.pulmonary-resistance"] td')).toContainText("0.625");
  await expect(page.locator("#settings")).toContainText("0.0085");
  for (const row of await controls.all()) {
    expect(await row.locator("th").innerText()).not.toBe(await row.getAttribute("data-control-id"));
  }
  await expect(page.getByRole("link", { name: "Klotz et al. 2006", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lumens et al. 2009 · TriSeg", exact: true })).toBeVisible();
  await page.locator("#land-deactivation-v2").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("equations.png") });
  await page.getByTestId("detailed-circuit").locator("p").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("detailed-circuit.png") });
  await expect(page.getByTestId("detailed-circuit").getByRole("table").locator("tbody tr")).toHaveCount(15);
  await page.locator("#land-state-equations").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("land-state-equations.png") });
  await page.locator("#triseg-geometry").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("triseg-geometry.png") });
  await page.getByRole("img", { name: "TriSegの断面模式図：共通の接合円、左室壁、中隔、右室壁", exact: true }).screenshot({ path: testInfo.outputPath("triseg-figure.png") });
  await page.getByRole("img", { name: "冠循環：領域ごとの並列二層回路", exact: true }).screenshot({ path: testInfo.outputPath("coronary-figure.png") });
  await page.locator("#coronary-storage").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("coronary-equations.png") });
  await page.getByTestId("equation-initial-state").locator("p").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("assembly.png") });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "採用値・初期条件の表を保存（CSV）", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("standard71-equations-parameters-initial-state.csv");
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("初期血液量（mL）");
  expect(csv).toContain("238816.54628141236");
  expect(csv).toContain("心室三壁");
  expect(csv).toContain("143.71107118194095");
  expect(csv).not.toContain("nodeVolumesMl");
  expect(csv).toContain("Amax (cm²)");
  expect(csv).not.toContain("\\mathrm");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator("[data-control-id]").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("settings.png") });
  const recordDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "表示データ・測定記録をダウンロード" }).click();
  const savedRecord = await recordDownload;
  expect(JSON.parse(await readFile((await savedRecord.path())!, "utf8")).modelId).toBe(model);
  const archiveDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "この説明を保存（オフラインHTML）", exact: true }).click();
  const archive = await archiveDownload;
  const archivePath = testInfo.outputPath("standard71-offline.html");
  await archive.saveAs(archivePath);
  // No app, source code, simulation worker, network, or JavaScript is available.
  const offline = await browser.newContext({ offline: true, javaScriptEnabled: false,
    viewport: page.viewportSize()! });
  try {
    const reader = await offline.newPage();
    const network: string[] = [];
    reader.on("request", request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    // WebKit's automation process can reject file navigation while offline.
    // Feed the saved file directly there; Chromium also exercises file://.
    if (browser.browserType().name() === "webkit") await reader.setContent(await readFile(archivePath, "utf8"));
    else await reader.goto(pathToFileURL(archivePath).href);
    await expect(reader.getByRole("heading", { name: "Main Wire Standard 71", exact: true })).toBeVisible();
    await expect(reader.locator("script, select, button, details details")).toHaveCount(0);
    await expect(reader.locator('[id="baseline"]')).toHaveCount(1);
    await expect(reader.locator('[id="baseline-record-1"]')).toHaveCount(1);
    await expect(reader.locator("body")).toContainText("1 ms · 同一物理構成の研究記録");
    await reader.locator("#five-wall-energy-triseg-v1 details > summary").click();
    await expect(reader.locator("#five-wall-energy-triseg-v1 .model-symbol-definitions")).toBeVisible();
    const fontCounts = await reader.evaluate(async () => Promise.all(
      ["16px KaTeX_Main", "italic 16px KaTeX_Math", "16px KaTeX_Size2"].map(async font => (await document.fonts.load(font)).length)));
    expect(fontCounts.every(n => n > 0)).toBe(true);
    await reader.locator("#five-wall-energy-triseg-v1 .model-math-display").first().screenshot({ path: testInfo.outputPath("offline-equation.png") });
    expect(await reader.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(network).toEqual([]);
  } finally { await offline.close(); }
  await page.getByRole("button", { name: "すべて閉じる", exact: true }).click();
  await expect(page.locator("details[open]")).toHaveCount(0);

  await page.getByLabel("モデル", { exact: true }).selectOption({ label: "Standard 70" });
  await expect(page.getByTestId("standard70-model-documentation-v1")).toBeVisible();
  await page.getByLabel("モデル", { exact: true }).selectOption(model);
  await expect(page.getByTestId("model-documentation-v2")).toBeVisible();
  await expect(page.locator("details[open]")).toHaveCount(0);
  expect(workers).toEqual([]);
  expect(errors).toEqual([]);
  expect(fontFailures).toEqual([]);
});
