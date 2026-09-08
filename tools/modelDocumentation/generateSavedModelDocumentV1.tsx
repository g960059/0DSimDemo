import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { MainWireDocumentV1 } from "./authoring/MainWireDocumentV1";
import { STANDARD72_DOCUMENT_COMPOSITION_V1 } from "./authoring/Standard72DocumentCompositionV1";
import { MAIN_WIRE_MODEL_MODULES_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { MAIN_WIRE_EQUATION_SPECIFICATION_V1 } from "@/studio/presentation/modelDocumentation/MainWireEquationSpecificationV1";
import { savedDocumentOfflineHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";

// Explicit mint-time compiler. Never invoked by a reader, npm build, or model
// activation. This freezes existing explanations; it neither simulates nor votes.
const compositions = { "standard72-document-v1": STANDARD72_DOCUMENT_COMPOSITION_V1 };
const requested = process.argv.find(arg => arg in compositions);
if (!requested) throw new Error("Pass a registered authoring composition document ID");
const composition = compositions[requested as keyof typeof compositions];
const { documentId, measurements, content } = composition;
const { equations, moduleIds } = content;
const target = `studio/presentation/modelDocumentation/packages/${documentId}.json`;
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const files = [
  "tools/modelDocumentation/generateSavedModelDocumentV1.tsx",
  "tools/modelDocumentation/authoring/MainWireDocumentV1.tsx",
  "tools/modelDocumentation/authoring/MainWireEquationDetailsV1.tsx",
  "tools/modelDocumentation/authoring/Standard72DocumentCompositionV1.ts",
  "components/model/ModelMathV1.tsx",
  "studio/presentation/modelDocumentation/MainWireModelModulesV1.ts",
  "studio/presentation/modelDocumentation/MainWireEquationSpecificationV1.ts",
  "studio/presentation/modelDocumentation/MainWireBaselineDocumentationV1.ts",
  "studio/presentation/modelDocumentation/packages/standard71-document-v1.json",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json",
  "studio/integrations/mainWireIntegratedV3/standard72-baseline-binding-evidence.json",
  "studio/integrations/mainWireIntegratedV3/standard72-launch-checkpoint.json",
  "studio/integrations/mainWireIntegratedV3/standard72-registry-admission-lock.json",
  "data/model-baselines/standard72-reviewed-eligibility-v1.json",
  "data/model-baselines/standard72-reviewed-executable-v1.json",
  "studio/presentation/StudioItemPresentationCatalogV1.ts",
  "locales/ja/translation.json", "locales/en/translation.json", "index.css",
];
const browser = await chromium.launch({ headless: true });
const classes = new Set<string>(["my-5", "text-sm", "mx-auto", "max-w-4xl", "px-5", "py-8", "text-xs"]);
const views = {} as Record<"ja" | "en", SavedModelDocumentV1["views"]["ja"]>;
try {
  const page = await browser.newPage({ javaScriptEnabled: false });
  for (const locale of ["ja", "en"] as const) {
    const rendered = [];
    for (const recordIndex of [0, 1] as const) {
      const html = renderToStaticMarkup(<MemoryRouter><MainWireDocumentV1 document={content} locale={locale} recordIndex={recordIndex} /></MemoryRouter>);
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
  await writeFile(target, serialized);
  await writeFile(indexTarget, index);
}
// A portable fallback outside the application build, with no service or worker.
const archiveDirectory = `artifacts/model-documentation/releases/${documentId}`;
if (!process.argv.includes("--check")) {
  await mkdir(archiveDirectory, { recursive: true });
  for (const locale of ["ja", "en"] as const) {
    await writeFile(`${archiveDirectory}/${locale}.html`, savedDocumentOfflineHtmlV1(savedPackage, locale));
    await writeFile(`${archiveDirectory}/${locale}.csv`, savedPackage.views[locale].tablesCsv);
  }
  await writeFile(`${archiveDirectory}/document.json`, serialized);
}
console.log(JSON.stringify({ target, archiveDirectory, bytes: Buffer.byteLength(serialized), contentSha256: savedPackage.contentSha256,
  uncommittedSources: savedPackage.provenance.uncommittedSources, simulated: false, promoted: false }));
