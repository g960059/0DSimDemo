import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { modelDocumentationHref } from "@/homeLinks";
import type { Locale } from "@/localeRouting";
import type { SavedModelDocumentV1 as Archive } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import type { SavedModelReadingV1 as Reading } from "@/studio/presentation/modelDocumentation/SavedModelReadingV1";
import { baselineNumberV1 as number, baselineUnitV1 as unit, BASELINE_ROLE_LABELS_V1 as roles,
  BASELINE_STATUS_LABELS_V1 as statuses, type BaselineDocumentationRowV1 as Row } from "@/studio/presentation/modelDocumentation/MainWireBaselineDocumentationV1";
import type { MainWireStaticCaseFittingResultV1 as Result } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { resolveMainWireStaticCaseDefinitionV1 as definition } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import type { mainWireReviewPresetV1, verifyMainWireReviewContinuationV1 } from "../registry/MainWireRegistryReviewArtifactV1";
import type { composeRegistryCaseReviewDocumentV1 } from "./authoring/RegistryCaseReviewDocumentV1";
import { registryCaseAssessmentRowsV1 as rowsFor, registryCaseSourcesV1 as sourcesFor,
  registryCaseNarrativeV1 as narrative } from "./authoring/RegistryCaseAssessmentRowsV1";
import { MainWireGuideV1, MainWireReadingSettingsV1 } from "./authoring/MainWireReadingV1";
import { MainWireEquationSpecificationContextV1 } from "./authoring/MainWireEquationDetailsV1";
import { resolvedMainWireEquationDataV1 as equationsFor } from "./authoring/ResolvedMainWireEquationDataV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import type { MainWireStaticCaseCheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireStaticCaseCheckpointV1";

type Dossier = Awaited<ReturnType<typeof composeRegistryCaseReviewDocumentV1>>["document"];
type Launch = Awaited<ReturnType<typeof mainWireReviewPresetV1>>;
type Continuation = Awaited<ReturnType<typeof verifyMainWireReviewContinuationV1>>;
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const details = (label: string, value: unknown) => <details className="my-5"><summary className="cursor-pointer text-sm font-medium">{label}</summary>
  <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(value, null, 2)}</pre></details>;

function Assessment({ rows, locale, dtMs }: { rows: readonly Row[]; locale: Locale; dtMs: number }) {
  const t = (ja: string, en: string) => locale === "ja" ? ja : en;
  return <section id="baseline" className="scroll-mt-24 border-t border-wb-line py-8">
    <h2 className="mb-4 text-xl font-semibold">{t("この設定の評価", "Assessment of this setting")} · {dtMs} ms</h2>
    <p className="mb-5 text-sm text-wb-muted">{t("作動点の目標・構造の検査・文献との比較は別の役割です。参考範囲外を必須条件の不適合と混同しないでください。", "Operating targets, construction checks and source comparisons have different roles. A reference warning is not a failed required condition.")}</p>
    <div>{rows.map(row => <details key={row.id} className="group border-b border-wb-line py-3 text-sm">
      <summary className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <span className="font-medium"><span aria-hidden="true" className="mr-2 inline-block group-open:rotate-90">▸</span>{row.label}<span className="mt-1 block text-xs font-normal text-wb-muted">{roles[locale][row.role]}</span></span>
        <span className="text-right"><span data-measured-value className="whitespace-nowrap tabular-nums">{row.value === null ? t("未測定", "Unmeasured") : number(row.value, row.unit)} {unit(row.unit)}</span>
          <span className="mt-1 block text-xs text-wb-muted">{statuses[locale][row.status]}</span></span>
      </summary>
        <div className="mt-4 max-w-2xl space-y-3 text-sm leading-7 text-wb-muted">
          <p>{row.meaning}</p><p>{row.rationale}</p>
          {row.ranges.map((range, i) => <p key={i}>{range.label}: {range.lower === null ? "" : `${number(range.lower, row.unit)} ${range.lowerInclusive === false ? "<" : "≤"} `}x{range.upper === null ? "" : ` ${range.upperInclusive === false ? "<" : "≤"} ${number(range.upper, row.unit)}`} {unit(row.unit)}</p>)}
          <ul>{row.sources.map((source, i) => <li key={i}><a className="underline" href={source.url} rel="noreferrer">{source.title}</a> · {source.locator}</li>)}</ul>
        </div></details>)}</div>
  </section>;
}

/** One compiler for any supported case; no previous case's successful tests or
 * coefficients enter the document. IDs identify draft material, not adoption. */
export async function compileRegistryCaseDocumentV1(input: {
  documentId: string; dossier: Dossier; results: readonly Result[]; grids: readonly unknown[];
  launch: Launch; continuation: Continuation; preparationSourceSha256: string;
}) {
  const { dossier: d, launch, continuation, documentId } = input;
  if (!/^[a-z0-9][a-z0-9.-]+$/.test(documentId) || d.status !== "review-pending" || d.publicPromotionAuthorized !== false
    || input.results.length !== 2 || input.grids.length !== 2 || input.results.some((r, i) => r.nominalDtSec !== [.002, .001][i]
      || r.initialization.kind !== "cold" || r.modelId !== d.identity.modelId || r.rest.referenceId !== d.identity.referenceId
      || canonical(r.candidateInputs) !== canonical(d.candidateInputs))
    || input.results[0]!.resultSha256 !== launch.binding.sourceResultSha256 || launch.preset.modelId !== d.identity.modelId
    || continuation.presetId !== launch.preset.presetId || continuation.steps !== 1000 || continuation.completeFramesAndTerminalCaptureEqual !== true)
    throw new Error("Archive requires this case's qualified cold pair and verified launch, with review still pending");
  const { contentSha256: dossierSha256, ...dossierBody } = d;
  if (await hash(dossierBody) !== dossierSha256) throw new Error("Archive dossier digest differs");
  const surface = d.surface as { surfaceReleaseId: string; surfaceSeriesId: string };
  const checkpoint = launch.preset.capture.checkpoint.payload as unknown as Checkpoint;
  const c = input.results[0]!.candidateInputs, fixture = fixtureFor(c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  if (checkpoint.checkpointSha256 !== launch.binding.launchCheckpointSha256
    || canonical(checkpoint.base.completedBeatMetrics) !== canonical(input.results[0]!.execution.diagnostics.completedBeat))
    throw new Error("Archive launch checkpoint differs from its evidence");
  // The archive describes the actual launch state, not the nearby qualification
  // checkpoint. A sub-tick alignment must not silently change initial conditions.
  const equations = equationsFor(c, checkpoint.base, fixture);
  equations.anatomy = { ...equations.anatomy, triSeg: { ...equations.anatomy.triSeg, wallGeometryParameters: fixture.staticAnatomy.trisegWalls } };
  const content = { moduleIds: d.modules.map(m => m.id), equations };
  const render = (node: React.ReactNode) => renderToStaticMarkup(
    <MainWireEquationSpecificationContextV1.Provider value={d.equationSpecification}>{node}</MainWireEquationSpecificationContextV1.Provider>);
  const identity = { ...d.identity, ...surface, baselineId: launch.preset.presetId, title: d.title, releaseStatus: "research-review-pending" };
  const rows = { ja: input.results.map((r, i) => rowsFor(r, input.grids[i], "ja")), en: input.results.map((r, i) => rowsFor(r, input.grids[i], "en")) };
  const measurements = { schemaId: "main-wire-registry-case-archive-measurements-v1", identity: d.identity,
    title: d.title, kind: d.kind, description: d.description, status: "review-pending", surface: d.surface,
    caseSpecification: d.caseSpecification, candidateInputs: d.candidateInputs, inputBinding: d.inputBinding,
    observations: d.observations, qualification: d.qualification, comparison: d.comparison,
    sourceFiles: d.sourceFiles, researchDossierSha256: dossierSha256,
    launch: { ...launch, continuation }, preparationSourceSha256: input.preparationSourceSha256,
    assessmentRows: rows, formalReview: { gate: "1-of-2", status: "pending" },
    supportingExperiments: "not-revalidated", publicPromotionAuthorized: false };
  const files = ["tools/modelDocumentation/compileRegistryCaseDocumentV1.tsx",
    ...["RegistryCaseAssessmentRowsV1.ts", "MainWireReadingV1.tsx", "MainWireModuleExplanationsV1.tsx", "MainWireEquationDetailsV1.tsx",
      "ResolvedMainWireEquationDataV1.ts", "HfrefCaseDocumentTextV1.ts"].map(f => `tools/modelDocumentation/authoring/${f}`),
    "components/model/ModelMathV1.tsx", "studio/presentation/modelDocumentation/MainWireModelModulesV1.ts",
    "studio/presentation/modelDocumentation/MainWireEquationSpecificationV1.ts", "studio/presentation/modelDocumentation/MainWireBaselineDocumentationV1.ts", "index.css"];
  const provenance = { sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    uncommittedSources: !!execFileSync("git", ["status", "--porcelain", "--", ...files], { encoding: "utf8" }).trim(),
    files: await Promise.all(files.map(async path => ({ path, sha256: sha(await readFile(path)) }))) };
  const views = {} as Record<Locale, Archive["views"]["ja"]>, readingViews = {} as Record<Locale, Reading["views"]["ja"]>;
  const browser = await chromium.launch({ headless: true });
  const classes = new Set<string>(["mx-auto", "max-w-5xl", "px-5", "py-8", "max-w-4xl", "text-xs"]);
  try {
    const page = await browser.newPage({ javaScriptEnabled: false });
    const inspect = async (html: string) => {
      await page.setContent(html);
      const result = await page.evaluate(() => {
        if (document.querySelector("script,iframe,object,embed,base,form,details details,.katex-error")) throw new Error("Invalid saved case document structure");
        const ids = new Set<string>();
        for (const e of document.querySelectorAll("*")) {
          if (e.id && ids.has(e.id)) throw new Error(`Repeated document anchor: ${e.id}`);
          if (e.id) ids.add(e.id);
          for (const a of e.attributes) if (/^on/i.test(a.name) || /^(?:javascript|vbscript):/i.test(a.value.trim())) throw new Error("Executable saved document content");
        }
        const csv: string[][] = [];
        document.querySelectorAll<HTMLTableElement>("table[data-equation-table]").forEach(table => {
          csv.push([], [(table.caption?.textContent ?? "").trim()]);
          Array.from(table.rows).forEach(row => csv.push(Array.from(row.cells).map(cell => {
            const n = cell.getAttribute("data-stored-number"); if (n !== null) return n;
            const copy = cell.cloneNode(true) as HTMLElement;
            copy.querySelectorAll<HTMLElement>("[data-math-plain]").forEach(math => math.replaceWith(math.dataset.mathPlain!));
            return (copy.textContent ?? "").trim();
          })));
        });
        return { classes: Array.from(document.querySelectorAll("[class]")).flatMap(e => Array.from(e.classList)),
          contents: Array.from(document.querySelectorAll("section[id] > h2, article[id] > h3"))
            .map(h => ({ id: h.parentElement!.id, title: h.textContent!, level: h.tagName === "H2" ? 2 : 3 })),
          csv: "\ufeff" + csv.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n") };
      });
      result.classes.forEach(c => classes.add(c)); return result;
    };
    for (const locale of ["ja", "en"] as const) {
      const t = (ja: string, en: string) => locale === "ja" ? ja : en;
      const header = render(<header className="mb-8"><p className="text-sm text-wb-muted">{t("研究候補 · レビュー待ち · 未公開", "Research candidate · review pending · unpublished")}</p>
        <h1 className="my-3 text-2xl font-semibold">{locale === "ja" ? d.title : definition(d.identity.referenceId).titleEn}</h1>
        <p className="text-sm leading-7">{t("自動確認は通過していますが、原波形・構成のレビューと正式採択は未完了です。過去の症例の採択や追加解析を引き継いだとは扱いません。",
          "Automated checks passed. Raw-waveform/construction review and formal adoption remain pending. Previous case approvals and additional analyses are not carried forward.")}</p>
        {narrative(input.results[0]!, locale).map((p, i) => <p className="my-3 text-sm leading-7" key={i}>{p}</p>)}</header>);
      const settingsHref = modelDocumentationHref({ locale, ...identity, documentId, view: "presets" }) + "#settings";
      const guide = render(<MainWireGuideV1 document={content} locale={locale} settingsHref={settingsHref} />);
      const offlineGuide = render(<MainWireGuideV1 document={content} locale={locale} settingsHref="#settings" />);
      const guideInspection = await inspect(guide);
      const after = render(<><section id="settings" className="scroll-mt-24 border-t border-wb-line py-8">
        <h2 className="text-xl font-semibold">{t("この設定の係数・形状・初期状態", "Coefficients, anatomy and initial state")}</h2>
        <p className="my-3 text-sm text-wb-muted">{t("ノブの倍率だけでなく、起動に用いる全入力と状態を記録します。", "Complete inputs and the launch state are retained, not just knob multipliers.")}</p>
        <MainWireReadingSettingsV1 document={content} locale={locale} />
      </section><section id="record" className="scroll-mt-24 border-t border-wb-line py-8">
        <h2 className="text-xl font-semibold">{t("測定記録・根拠・未完了項目", "Records, evidence and pending review")}</h2>
        <p className="my-4 text-sm text-wb-muted">{t("各資料の対象集団と測定条件を、今回の測定と区別して読みます。下の原記録には出典の言語をそのまま残しています。", "Source populations and measurement conditions are distinct from this simulation. Raw records below retain their source language.")}</p>
        {sourcesFor(input.results[0]!.rest.referenceId, locale).map(source => <details className="my-4 text-sm" key={source.id}>
          <summary className="cursor-pointer">{source.title}</summary><p className="my-3 text-wb-muted">{source.description}</p>
          <a href={source.url} className="underline" rel="noreferrer">{t("出典を見る", "Open source")}</a></details>)}
        {details(t("自動確認と未完了のレビュー", "Automated checks and pending review"), d.qualification)}
        {details(t("症例仕様・文献・測定法", "Case specification, sources and methods"), d.caseSpecification)}
        {details(t("2 / 1 msの全観測値と評価", "Complete 2 / 1 ms observations and assessments"), d.observations)}
        {details(t("全入力と起動checkpointの出自", "Full inputs and launch-checkpoint provenance"), { inputs: d.candidateInputs, inputBinding: d.inputBinding, launchBinding: launch.binding, continuation })}
        <p className="text-sm text-wb-muted">{t("過去のESPVR・EDPVR・PVAや受動力学の試験は、今回の成功例として再利用していません。必要な追加検証はレビュー後に行います。",
          "Previous ESPVR, EDPVR, PVA and passive-mechanics tests are not claimed as fresh successes. Required supporting experiments follow review.")}</p>
      </section></>);
      const records = input.results.map((r, i) => ({ recordId: `dt-${r.nominalDtSec}`, label: `${r.nominalDtSec * 1000} ms · independent cold`,
        html: render(<Assessment rows={rows[locale][i]!} locale={locale} dtMs={r.nominalDtSec * 1000} />) }));
      let presetInspection: Awaited<ReturnType<typeof inspect>> | null = null;
      for (const record of records) {
        presetInspection = await inspect(header + record.html + after);
        await inspect(header + offlineGuide + record.html + after);
      }
      const navigation = render(<nav className="mb-8 flex flex-wrap gap-4 text-sm" aria-label={t("目次", "Contents")}>
        {[["overview", t("回路", "Circuit")], ["mechanisms", t("数式", "Equations")], ["baseline", t("評価", "Assessment")],
          ["settings", t("設定", "Settings")], ["record", t("根拠・記録", "Evidence and records")]].map(([id, label]) => <a key={id} href={`#${id}`} className="underline">{label}</a>)}
      </nav>);
      await inspect(navigation + header + offlineGuide + records[0]!.html + after);
      views[locale] = { beforeAssessmentHtml: `<main class="mx-auto max-w-5xl px-5 py-8">${header}${navigation}${offlineGuide}`,
        records, afterAssessmentHtml: after + "</main>", tablesCsv: presetInspection!.csv };
      readingViews[locale] = { guide: { html: guide, contents: guideInspection.contents },
        preset: { beforeHtml: header, records, afterHtml: after, contents: presetInspection!.contents } };
    }
  } finally { await browser.close(); }
  const appCss = (await compile(await readFile("index.css", "utf8"), { base: process.cwd(), onDependency: () => {} })).build([...classes].sort());
  const katexDir = dirname(createRequire(import.meta.url).resolve("katex/package.json"));
  let fontCss = await readFile(join(katexDir, "dist/katex.min.css"), "utf8");
  for (const match of [...fontCss.matchAll(/src:url\(fonts\/([^)]*\.woff2)\)[^}]+/g)]) {
    const bytes = await readFile(join(katexDir, "dist/fonts", match[1]!));
    fontCss = fontCss.replace(match[0], `src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2")`);
  }
  const license = (await readFile(join(katexDir, "LICENSE"), "utf8")).replaceAll("*/", "* /");
  const archiveCss = appCss + `\n/* KaTeX: ${license} */\n` + fontCss
    + "\nhtml,body{margin:0;min-height:100%;font-family:system-ui,sans-serif}body{background:var(--wb-app-bg);color:var(--wb-text)}main{overflow-wrap:anywhere}svg{max-width:100%}section,details{min-width:0}summary:focus-visible{outline:2px solid currentColor;outline-offset:3px}";
  if (/@import|url\(fonts\//.test(archiveCss)) throw new Error("Unresolved archive stylesheet dependency");
  const body: Omit<Archive, "contentSha256"> = { schemaId: "circleheart.saved-model-document.v1", documentId, identity, provenance, views,
    scientificRecord: { measurements, equations, modules: d.modules, equationSpecification: d.equationSpecification },
    filenames: { measurements: `${documentId}-measurements.json`, tables: `${documentId}-tables.csv`, archive: `${documentId}.html` }, archiveCss };
  const archive: Archive = { ...body, contentSha256: sha(JSON.stringify(body)) };
  const readingBody = { schemaId: "circleheart.saved-model-reading.v1" as const, source: { documentId, contentSha256: archive.contentSha256 },
    authoring: provenance.files, views: readingViews };
  const reading: Reading = { ...readingBody, contentSha256: sha(JSON.stringify(readingBody)) };
  return { archive, reading };
}
