import { chromium, expect } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { savedDocumentOfflineHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import selected from "@/data/model-baselines/current-baseline-selection-v1.json";

// Optional local end-to-end check of a real exported qualification package.
// Reuses the ordinary workbench workers and analyses; no synthetic pass fixture.
const { values } = parseArgs({ options: { case: { type: "string" }, output: { type: "string" }, url: { type: "string" }, document: { type: "string" } } });
if (!values.case || !values.output || !values.url) throw new Error("Require --case EXPORTED_JSON --output NEW_DIR --url http://127.0.0.1:PORT/ja/dev/model-lab");
const url = new URL(values.url);
if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)
  || url.pathname !== "/ja/dev/model-lab") throw new Error("Use a local Japanese Model Lab URL");
const candidate = JSON.parse(await readFile(values.case, "utf8")), output = resolve(values.output);
await mkdir(output);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(url.href);
  const root = page.getByTestId("v3-dockview-workbench"), tbv = page.getByRole("slider", { name: "総血液量 (TBV)", exact: true });
  await expect(root).toHaveAttribute("data-model-id", candidate.preset.modelId, { timeout: 60_000 });
  const originalTbv = await tbv.inputValue();
  await page.locator('input[type="file"]').setInputFiles(values.case);
  await expect(page.getByText(`${candidate.preset.title} · 未採用の候補`, { exact: true })).toBeVisible();
  await expect(root).toHaveAttribute("data-model-id", candidate.preset.modelId, { timeout: 60_000 });
  // HTML range presentation may snap to its step; the exact input is the
  // restored capture, already verified against the unchanged artifact.
  const step = Number(await tbv.getAttribute("step") ?? "1");
  expect(Math.abs(Number(await tbv.inputValue()) - candidate.preset.capture.fixture.hemodynamicResearchInputs.totalBloodVolumeMl))
    .toBeLessThanOrEqual(step / 2 + 1e-8);
  const startTime = Number(await root.getAttribute("data-model-time-sec"));
  expect(startTime).toBeGreaterThanOrEqual(candidate.preset.capture.checkpoint.acceptedTimeSec);
  await page.getByTestId("workbench-simulation-info-trigger-v3").click();
  await page.getByRole("tab", { name: "数理モデル", exact: true }).click();
  await expect(page.getByText(/読み込んだ候補の最終検証記録/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect.poll(() => page.locator("[data-pva-result-count]").evaluateAll(nodes =>
    nodes.some(node => Number(node.getAttribute("data-pva-result-count")) > 0)), { timeout: 90_000 }).toBe(true);
  await page.screenshot({ path: join(output, "candidate.png") });
  await page.getByRole("button", { name: "Presetから追加", exact: true }).click();
  await page.getByRole("menuitem", { name: /baseline/ }).click();
  await expect(page.getByRole("heading", { name: "Scenarios (2)" })).toBeVisible();
  await page.getByRole("button", { name: "baselineから新規起動", exact: true }).click();
  await expect(tbv).toHaveValue(originalTbv);
  await expect(root).toHaveAttribute("data-model-id", candidate.preset.modelId);
  await page.getByTestId("workbench-simulation-info-trigger-v3").click();
  await page.getByRole("tab", { name: "数理モデル", exact: true }).click();
  await expect(page.getByText(/baseline採用時の記録/)).toBeVisible();
  const href = await page.locator('a[href*="/models/"]').getAttribute("href");
  expect(new URL(href!, url).searchParams.get("document")).toBe(selected.document.documentId);
  const documentPage = await browser.newPage({ viewport: { width: 1200, height: 950 } });
  documentPage.on("pageerror", error => errors.push(error.message));
  await documentPage.goto(new URL(href!, url).href);
  await expect(documentPage.locator("[data-saved-document]")).toHaveAttribute("data-saved-document", selected.document.documentId);
  if (values.document) {
    const compiled = JSON.parse(await readFile(values.document, "utf8")) as SavedModelDocumentV1;
    expect(compiled.identity.baselineId).toBe(candidate.preset.presetId);
    expect(compiled.identity.modelId).toBe(candidate.preset.modelId);
    await documentPage.setContent(savedDocumentOfflineHtmlV1(compiled, "ja"));
    const fixture = candidate.preset.capture.fixture;
    // All control values and equations are present in this self-contained page.
    const printedTbv = await documentPage.locator('[data-control-id="hemodynamics.total-blood-volume-ml"] td').textContent();
    expect(parseFloat(printedTbv!.replaceAll(",", ""))).toBe(fixture.hemodynamicResearchInputs.totalBloodVolumeMl);
    await expect(documentPage.locator(".katex-error")).toHaveCount(0);
    await expect(documentPage.locator("details details")).toHaveCount(0);
    await documentPage.locator("#settings").scrollIntoViewIfNeeded();
    await documentPage.screenshot({ path: join(output, "candidate-document.png") });
  }
  expect(errors).toEqual([]);
  const report = { modelId: candidate.preset.modelId, caseSha256: candidate.recordSha256,
    candidateStartTimeSec: startTime, candidateAssessmentOwn: true, pvaAvailable: true,
    presetCopyAvailable: true, baselineRestored: true, selectedDocumentPinned: true,
    candidateDocumentVerified: Boolean(values.document), errors };
  await writeFile(join(output, "verification.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  process.stdout.write(JSON.stringify(report) + "\n");
} catch (error) {
  await page.screenshot({ path: join(output, "failure.png") });
  throw error;
} finally { await browser.close(); }
