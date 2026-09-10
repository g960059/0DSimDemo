import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { MainWireDocumentV1 } from "./authoring/MainWireDocumentV1";
import { MAIN_WIRE_MODEL_MODULES_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { MAIN_WIRE_EQUATION_SPECIFICATION_V1 } from "@/studio/presentation/modelDocumentation/MainWireEquationSpecificationV1";
import { savedDocumentOfflineHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import { composeStaticCaseDocumentV1, type StaticCaseDocumentContentV1 } from "./authoring/StaticCaseDocumentCompositionV1";
import { StaticCaseDocumentV1 } from "./authoring/StaticCaseDocumentV1";
import type { MainWireDocumentContentV1 } from "./authoring/MainWireDocumentV1";
import { compileModelReadingV1 } from "./compileModelReadingV1";
import { composeStaticBaselineDocumentV1 } from "./authoring/StaticBaselineDocumentCompositionV1";
import { composeBoundStaticCaseDocumentV1 } from "./authoring/BoundStaticCaseDocumentCompositionV1";

// Explicit document compiler. Never invoked by a reader, npm build, or model
// activation. This freezes existing explanations; it neither simulates nor votes.
const arg = (key: string) => { const index = process.argv.indexOf(key); return index < 0 ? undefined : process.argv[index + 1]; };
const fittedId = arg("--document-id");
const staticEvidencePath = arg("--static-case-evidence"), staticBundlePath = arg("--bundle");
const staticBaselinePath = arg("--static-baseline-qualification");
const boundCasePath = arg("--bound-case-coarse"), boundCaseFine = arg("--bound-case-fine");
if (process.argv.includes("--help")) {
  console.log("Pass --static-case-evidence EVIDENCE_JSON --bundle BUNDLE_JSON, or --static-baseline-qualification FINAL_JSON --bundle BUNDLE_JSON; custom compositions require --document-id NEW_ID [--output-dir NEW_DIRECTORY]. Add --reading to regenerate the reading projection of an existing archive, or --reading --check to verify it. Never changes a selected case or existing scientific archive.");
  process.exit(0);
}
if (!(staticEvidencePath && staticBundlePath && fittedId)
  && !(staticBaselinePath && staticBundlePath && fittedId)) throw new Error("Require a complete document composition");
if ([!!staticEvidencePath, !!staticBaselinePath].filter(Boolean).length !== 1) throw new Error("Choose one composition");
if (boundCasePath && (!boundCaseFine || !staticBaselinePath || !staticBundlePath || !fittedId)
  || boundCaseFine && !boundCasePath) throw new Error("Bound case requires coarse/fine results, baseline qualification, bundle and new document ID");
const staticComposition = boundCasePath ? await composeBoundStaticCaseDocumentV1({ qualificationPath: staticBaselinePath!,
  coarsePath: boundCasePath, finePath: boundCaseFine!, bundlePath: staticBundlePath!, documentId: fittedId! }) : staticEvidencePath ? await composeStaticCaseDocumentV1({
  evidencePath: staticEvidencePath, bundlePath: staticBundlePath!, documentId: fittedId!,
}) : null;
const baselineComposition = staticBaselinePath && !boundCasePath ? await composeStaticBaselineDocumentV1({
  qualificationPath: staticBaselinePath, bundlePath: staticBundlePath!, documentId: fittedId!,
}) : null;
const composition = baselineComposition ?? staticComposition!;
const { documentId, measurements, content } = composition;
const { equations, moduleIds } = content;
const target = path.join(arg("--output-dir") ?? "studio/presentation/modelDocumentation/packages", `${documentId}.json`);
if (process.argv.includes("--reading")) {
  await compileModelReadingV1({ sourcePath: target, target: target.replace(/\.json$/, ".reading-v1.json"),
    check: process.argv.includes("--check"), measurements, content, staticCase: !!staticComposition });
  process.exit(0);
}
const archiveDirectory = `artifacts/model-documentation/releases/${documentId}`;
if (!process.argv.includes("--check") && (existsSync(target) || existsSync(target.replace(/\.json$/, ".index.json"))
  || existsSync(archiveDirectory))) {
  throw new Error("Document already exists. Preserve it and choose a new document ID.");
}
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const files = [
  ...(boundCasePath ? ["tools/modelDocumentation/authoring/BoundStaticCaseDocumentCompositionV1.ts"] : []),
  "tools/modelDocumentation/generateSavedModelDocumentV1.tsx",
  "tools/modelDocumentation/authoring/MainWireDocumentV1.tsx",
  "tools/modelDocumentation/authoring/MainWireEquationDetailsV1.tsx",
  "tools/modelDocumentation/authoring/MainWireModuleExplanationsV1.tsx",
  "components/model/ModelMathV1.tsx",
  "studio/presentation/modelDocumentation/MainWireModelModulesV1.ts",
  "studio/presentation/modelDocumentation/MainWireEquationSpecificationV1.ts",
  "studio/presentation/modelDocumentation/MainWireBaselineDocumentationV1.ts",
  "studio/presentation/modelDocumentation/packages/standard71-document-v1.json",
  "studio/presentation/StudioItemPresentationCatalogV1.ts",
  "locales/ja/translation.json", "locales/en/translation.json", "index.css",
  ...(staticComposition ? [...staticComposition.sourceFiles,
    "tools/modelDocumentation/authoring/StaticCaseDocumentCompositionV1.ts",
    "tools/modelDocumentation/authoring/StaticCaseDocumentV1.tsx",
    "tools/modelDocumentation/authoring/HfrefCaseDocumentTextV1.ts",
    "tools/modelDocumentation/authoring/ResolvedMainWireEquationDataV1.ts",
    "data/physiology/main-wire-hfref-dilated-reference-v1.json",
    "data/physiology/main-wire-hfref-reference-v1.json",
    "analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1.ts",
    "analysis/methods/mainWire/MainWireRelaxationTauV1.ts",
    "engine/myocardium/mechanics/MainWireStaticCaseAnatomyV1.ts",
    "engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1.ts",
    "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1.ts",
  ] : []),
  ...(baselineComposition ? [...baselineComposition.sourceFiles,
    "tools/modelDocumentation/authoring/StaticBaselineDocumentCompositionV1.ts",
    "tools/modelDocumentation/authoring/ResolvedMainWireEquationDataV1.ts",
    "analysis/methods/mainWire/MainWireStaticBaselineQualificationV1.ts",
    "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1.ts",
  ] : []),
];
const browser = await chromium.launch({ headless: true });
const classes = new Set<string>(["my-5", "text-sm", "mx-auto", "max-w-4xl", "px-5", "py-8", "text-xs"]);
const views = {} as Record<"ja" | "en", SavedModelDocumentV1["views"]["ja"]>;
try {
  const page = await browser.newPage({ javaScriptEnabled: false });
  for (const locale of ["ja", "en"] as const) {
    const rendered = [];
    for (const recordIndex of [0, 1] as const) {
      const html = renderToStaticMarkup(<MemoryRouter>{staticComposition
        ? <StaticCaseDocumentV1 document={content as StaticCaseDocumentContentV1} locale={locale} recordIndex={recordIndex} />
        : <MainWireDocumentV1 document={content as MainWireDocumentContentV1} locale={locale} recordIndex={recordIndex} />}</MemoryRouter>);
      await page.setContent(html);
      const projection = await page.evaluate(() => {
        if (document.querySelector("script,iframe,object,embed,base,form,details details,.katex-error")) throw new Error("Invalid compiled document structure");
        for (const e of document.querySelectorAll("*")) for (const a of e.attributes) {
          if (/^on/i.test(a.name) || /^(?:javascript|vbscript):/i.test(a.value.trim())) throw new Error("Executable document content rejected");
        }
        const csv: string[][] = [[document.querySelector("h1")!.textContent!]];
        document.querySelectorAll<HTMLTableElement>("table[data-equation-table]").forEach(table => {
          csv.push([], [(table.caption?.textContent ?? "").trim()]);
          Array.from(table.rows).forEach(row => csv.push(Array.from(row.cells).map(cell => {
            const numerical = cell.getAttribute("data-stored-number");
            if (numerical !== null) return numerical;
            const copy = cell.cloneNode(true) as HTMLElement;
            copy.querySelectorAll<HTMLElement>("[data-math-plain]").forEach(math => math.replaceWith(math.dataset.mathPlain!));
            return (copy.textContent ?? "").trim();
          })));
        });
        return {
          classes: Array.from(document.querySelectorAll("[class]")).flatMap(e => Array.from(e.classList)),
          csv: "\ufeff" + csv.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n"),
          recordLabel: document.querySelector<HTMLSelectElement>('[data-document-action="record"]')!.selectedOptions[0].textContent!,
        };
      });
      projection.classes.forEach(c => classes.add(c));
      // These two explicit section boundaries are the template contract. The
      // model's shared chapters are stored once, not copied for each dt record.
      const start = html.indexOf('<section id="baseline"');
      const end = html.indexOf('<section id="record"');
      if (start < 0 || end <= start) throw new Error("Missing document chapter boundaries");
      rendered.push({ before: html.slice(0, start), html: html.slice(start, end), after: html.slice(end), ...projection });
    }
    if (rendered[0].before !== rendered[1].before || rendered[0].after !== rendered[1].after || rendered[0].csv !== rendered[1].csv) {
      throw new Error("Record-dependent content escaped the assessment chapter");
    }
    views[locale] = {
      beforeAssessmentHtml: rendered[0].before,
      records: rendered.map((r, i) => ({ recordId: `dt-${measurements.observations[i].dtSec}`, label: r.recordLabel, html: r.html })),
      afterAssessmentHtml: rendered[0].after,
      tablesCsv: rendered[0].csv,
    };
  }
} finally { await browser.close(); }

const cssCompiler = await compile(await readFile("index.css", "utf8"), { base: process.cwd(), onDependency: () => {} });
const appCss = cssCompiler.build([...classes].sort());
const require = createRequire(import.meta.url);
const katexDir = path.dirname(require.resolve("katex/package.json"));
const fontCss = (await readFile(path.join(katexDir, "dist/katex.min.css"), "utf8"))
  .replace(/src:url\(fonts\/([^)]*\.woff2)\)[^}]+/g, (_match, filename: string) =>
    `src:url(data:font/woff2;base64,${readFileSync(path.join(katexDir, "dist/fonts", filename)).toString("base64")}) format("woff2")`);
const fontLicense = await readFile(path.join(katexDir, "LICENSE"), "utf8");
const archiveCss = appCss + "\n/* KaTeX: " + fontLicense.replaceAll("*/", "* /") + " */\n" + fontCss + "\nhtml,body{margin:0;min-height:100%;font-family:system-ui,sans-serif}body{background:var(--wb-app-bg);color:var(--wb-text)}[data-testid=model-documentation-v2]{height:auto;overflow:visible}svg{max-width:100%}@media print{details>summary{break-after:avoid}table{break-inside:auto}}";
if (/@import|url\(fonts\//.test(archiveCss)) throw new Error("Unresolved archive stylesheet dependency");
const body: Omit<SavedModelDocumentV1, "contentSha256"> = {
  schemaId: "circleheart.saved-model-document.v1", documentId,
  identity: { modelId: measurements.modelId, surfaceReleaseId: measurements.surfaceReleaseId,
    surfaceSeriesId: measurements.surfaceSeriesId, baselineId: measurements.baselineId,
    title: content.title, releaseStatus: measurements.releaseStatus },
  provenance: {
    sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    uncommittedSources: execFileSync("git", ["status", "--porcelain", "--", ...files], { encoding: "utf8" }).trim().length > 0,
    files: await Promise.all(files.map(async file => ({ path: file, sha256: sha(await readFile(file, "utf8")) }))),
  },
  views,
  scientificRecord: { measurements, equations,
    modules: moduleIds.map(id => MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === id)!),
    equationSpecification: MAIN_WIRE_EQUATION_SPECIFICATION_V1 },
  filenames: { measurements: `${documentId}-measurements.json`, tables: `${documentId}-tables.csv`, archive: `${documentId}.html` },
  archiveCss,
};
const savedPackage: SavedModelDocumentV1 = { ...body, contentSha256: sha(JSON.stringify(body)) };
if (process.argv.includes("--check")) {
  const previous = JSON.parse(await readFile(target, "utf8")) as SavedModelDocumentV1;
  const checkedBody = { ...body, provenance: { ...body.provenance, sourceCommit: previous.provenance.sourceCommit, uncommittedSources: previous.provenance.uncommittedSources } };
  Object.assign(savedPackage, checkedBody, { contentSha256: sha(JSON.stringify(checkedBody)) });
}
const serialized = JSON.stringify(savedPackage, null, 2) + "\n";
const indexTarget = target.replace(/\.json$/, ".index.json");
const index = JSON.stringify({ schemaId: savedPackage.schemaId, documentId: savedPackage.documentId,
  identity: savedPackage.identity, contentSha256: savedPackage.contentSha256 }, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (await readFile(target, "utf8") !== serialized) throw new Error("Saved document differs from its current authoring sources; review and regenerate explicitly");
  if (await readFile(indexTarget, "utf8") !== index) throw new Error("Document index differs from saved package");
} else {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, serialized, { flag: "wx" });
  await writeFile(indexTarget, index, { flag: "wx" });
}
// A portable fallback outside the application build, with no service or worker.
if (!process.argv.includes("--check")) {
  await mkdir(path.dirname(archiveDirectory), { recursive: true });
  await mkdir(archiveDirectory);
  for (const locale of ["ja", "en"] as const) {
    await writeFile(`${archiveDirectory}/${locale}.html`, savedDocumentOfflineHtmlV1(savedPackage, locale), { flag: "wx" });
    await writeFile(`${archiveDirectory}/${locale}.csv`, savedPackage.views[locale].tablesCsv, { flag: "wx" });
  }
  await writeFile(`${archiveDirectory}/document.json`, serialized, { flag: "wx" });
}
console.log(JSON.stringify({ target, archiveDirectory, bytes: Buffer.byteLength(serialized), contentSha256: savedPackage.contentSha256,
  uncommittedSources: savedPackage.provenance.uncommittedSources, simulated: false,
  qualificationRerun: false, promoted: false }));
