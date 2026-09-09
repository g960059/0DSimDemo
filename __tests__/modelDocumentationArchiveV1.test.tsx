import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { build } from "esbuild";
import { describe, it, expect } from "vitest";
import saved from "@/studio/presentation/modelDocumentation/packages/standard71-document-v1.json";
import index from "@/studio/presentation/modelDocumentation/packages/standard71-document-v1.index.json";
import saved72 from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.json";
import index72 from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.index.json";
import hfref from "@/studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.json";
import { SavedModelDocumentationV1 } from "@/components/model/SavedModelDocumentationV1";
import { savedDocumentMatchesV1, savedDocumentHtmlV1, savedDocumentOfflineHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";

// Permanent archive tests: deliberately no imports of current source models,
// current gates, equation-authoring modules, live catalog, or fixture factories.
const document = saved as SavedModelDocumentV1;
describe("saved model documentation, independent of retired source", () => {
  it("preserves a disease-case assessment without importing healthy baseline gates", () => {
    const { contentSha256, ...body } = hfref;
    expect(createHash("sha256").update(JSON.stringify(body)).digest("hex")).toBe(contentSha256);
    const m = hfref.scientificRecord.measurements;
    expect(m.reference.referenceId).toBe("hfref-chronic-dilated-v1");
    expect(m.registrationProposal.adopted).toBe(false);
    expect(m.registrationProposal.writesPerformed).toBe(false);
    expect(m.observations.map(o => o.dtSec)).toEqual([.002, .001]);
    for (const o of m.observations) {
      expect(o.assessment.screenPassed).toBe(true);
      expect(o.assessment.preferredTargetsMet).toBe(true);
      expect(o.assessment.publicPromotionAuthorized).toBe(false);
      expect(o.values.glantzTauMs).toBeNull();
      expect(o.tau.sensitivityStatus).toBe("poor-fit");
      expect(o.morphology.LVP.significantPeakCount).toBe(1);
    }
    expect(m.construction.anatomy.lvMassG).toBeCloseTo(135.375, 8);
    expect(hfref.scientificRecord.equations.anatomy.triSeg.wallGeometryParameters).toEqual(m.construction.anatomy.trisegWalls);
    expect(hfref.scientificRecord.equations.pericardium).toEqual(m.construction.pericardium);
    expect(m.construction.coronaryConstruction.referenceBedMassRepresentsCurrentAnatomy).toBe(false);
    expect(m.settings).toHaveLength(53);
    expect(m.settings.some(s => s.observed.status === "unsupported")).toBe(false);
    expect(m.reference.restScreen.every(r => r.sourceIds.length > 0)).toBe(true);
    expect(m.reference.fittingTargets.every(r => r.sourceIds.length > 0)).toBe(true);
    expect(m.reference.sources.find(s => s.sourceId === "ishihara-1994-dcm-energetics")?.observations?.eaToEes).toEqual({ mean: 3.24, se: .28 });
    expect(m.referenceCorrection).toMatchObject({ from: 3.14, to: 3.24,
      previousReferenceSha256: "847163d82537132005c75fad668c36b2d43410f8527b2738f960f438266b1bf8" });
    expect(m.slowTail.map(s => [s.dtSec, s.extensionCycles])).toEqual([[.002, 60], [.001, 60]]);
    expect(m.slowTail[0].inputPath).toContain("static-case-lab-003/cold-1.json");
    expect(m.slowTail[0].finalValues.ci - m.slowTail[0].initialValues.ci).toBeCloseTo(.00045839646201, 12);
    expect(m.passiveComparison).toMatchObject({ rvVolumeMl: 140, lvTransmuralPressureMmHg: 10 });
    expect(m.passiveComparison.baselineVolumeMl).toBeCloseTo(150.84566, 4);
    expect(m.passiveComparison.caseVolumeMl).toBeCloseTo(184.31221, 4);
    expect(JSON.stringify(hfref)).not.toMatch(/\/Users\/|\/private\/var\//);
  });
  it.each(["ja", "en"] as const)("keeps the %s case self-contained and its poor Glantz fit unavailable", locale => {
    const document = hfref as SavedModelDocumentV1, html = savedDocumentOfflineHtmlV1(document, locale);
    expect(html).not.toMatch(/<script|<iframe|<select|<button|<link/i);
    expect(html).not.toMatch(/href="\/(?:ja|en)|href="#document-/);
    expect(html).toContain("data:font/woff2;base64,");
    expect(html).toContain("katex-mathml");
    expect(html).not.toContain("katex-error");
    expect(html).toContain("7000");
    expect(html).toContain(locale === "ja" ? "正式登録には" : "Formal registration still requires");
    expect(html).toContain('data-testid="equation-initial-state"');
    const view = savedDocumentHtmlV1(document, locale);
    expect(view).toContain("mean LAP");
    expect(view).not.toContain("mean LAP / PCWP");
    expect(view).toContain("Ao node mean");
    expect(view).toContain(locale === "ja" ? "再現できたHFrEFの所見ではなく" : "not an established HFrEF finding reproduced here");
    if (locale === "en") {
      for (const source of hfref.scientificRecord.measurements.reference.sources) {
        expect(view).not.toContain(source.population);
        expect(view).not.toContain(source.limitations);
      }
      for (const rule of [...hfref.scientificRecord.measurements.reference.restScreen, ...hfref.scientificRecord.measurements.reference.fittingTargets]) {
        expect(view).not.toContain(rule.rationale);
      }
      expect(view).toContain("diagnostic lower limit");
    }
    const glantzRow = savedDocumentHtmlV1(document, locale).match(/data-case-metric="glantzTauMs"[\s\S]*?<\/tr>/)![0];
    expect(glantzRow).toContain("—");
    expect(glantzRow).not.toContain("125");
    let depth = 0;
    for (const tag of html.matchAll(/<details\b|<\/details>/g)) {
      depth += tag[0].startsWith("</") ? -1 : 1;
      expect(depth).toBeLessThanOrEqual(1);
    }
    expect(depth).toBe(0);
  });
  it("exports the saved package through the normal npm CLI without a forwarded separator", async () => {
    const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "saved-model-document-export-"));
    const outputDirectory = path.join(temporaryDirectory, "offline output");
    const input = path.resolve("studio/presentation/modelDocumentation/packages/standard71-document-v1.json");
    const original = await readFile(input, "utf8");
    try {
      // npm consumes this separator; vite-node receives PACKAGE and OUTPUT
      // directly after the script path, including the space in OUTPUT.
      const { stdout } = await promisify(execFile)("npm", ["run", "export:model-document", "--", input, outputDirectory],
        { cwd: process.cwd(), encoding: "utf8", timeout: 10_000 });
      expect(stdout).toContain(`"documentId":"${document.documentId}"`);
      expect((await readdir(outputDirectory)).sort()).toEqual(["document.json", "en.csv", "en.html", "ja.csv", "ja.html"]);
      expect(await readFile(path.join(outputDirectory, "document.json"), "utf8")).toBe(original);
      for (const locale of ["ja", "en"] as const) {
        expect(await readFile(path.join(outputDirectory, `${locale}.csv`), "utf8")).toBe(document.views[locale].tablesCsv);
        const html = await readFile(path.join(outputDirectory, `${locale}.html`), "utf8");
        expect(html).toContain(document.identity.title);
        expect(html).toContain(document.contentSha256);
        expect(html).toContain("Content-Security-Policy");
        for (const record of document.views[locale].records) expect(html).toContain(record.label);
        expect(html).not.toMatch(/<script|<iframe|<select|<button|<link/i);
      }
      expect(await readFile(input, "utf8")).toBe(original);
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }, 15_000);
  it("preserves successor content and offline records independently of authoring or runtime", () => {
    const { contentSha256, ...body } = saved72;
    expect(createHash("sha256").update(JSON.stringify(body)).digest("hex")).toBe(contentSha256);
    expect(index72.identity).toEqual(saved72.identity);
    expect(index72.contentSha256).toBe(contentSha256);
    for (const locale of ["ja", "en"] as const) {
      const html = savedDocumentOfflineHtmlV1(saved72 as SavedModelDocumentV1, locale);
      expect(html).toContain(saved72.identity.title);
      expect(html).toContain('id="baseline-record-1"');
      expect(html).toContain("katex-mathml");
      expect(html).toContain("data:font/woff2;base64,");
      expect(html).toContain("data:text/csv;charset=utf-8,");
      expect(html).not.toMatch(/<script|<iframe|<select|<button|<link/i);
      expect(html).not.toMatch(/href="\/(?:ja|en)|href="#document-/);
      expect(html).not.toMatch(/@import|url\(fonts\//);
    }
  });
  it("checks frozen content integrity without comparing it to today's model", () => {
    const { contentSha256, ...body } = saved;
    expect(createHash("sha256").update(JSON.stringify(body)).digest("hex")).toBe(contentSha256);
    expect(saved.identity.releaseStatus).toBe("local-candidate-not-registered");
    expect(saved.scientificRecord.measurements.modelId).toBe(saved.identity.modelId);
    expect(saved.provenance.uncommittedSources).toBe(true);
    expect(saved.provenance.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(index.identity).toEqual(saved.identity);
    expect(index.contentSha256).toBe(saved.contentSha256);
  });
  it("resolves only the documented exact/Surface pair", () => {
    const { modelId, surfaceReleaseId } = document.identity;
    expect(savedDocumentMatchesV1(document, modelId, surfaceReleaseId)).toBe(true);
    expect(savedDocumentMatchesV1(document, modelId, surfaceReleaseId + ".next")).toBe(false);
    expect(savedDocumentMatchesV1(document, modelId + ".next", surfaceReleaseId)).toBe(false);
    expect(() => savedDocumentHtmlV1(document, "ja", 2)).toThrow("Unavailable documentation record");
  });
  it.each(["ja", "en"] as const)("renders %s with complete equations, independent dt records and CSV", locale => {
    const html = renderToStaticMarkup(<SavedModelDocumentationV1 document={document} locale={locale} />);
    expect(html).toContain(document.identity.title);
    expect(html).toContain("katex-mathml"); expect(html).not.toContain("katex-error");
    expect(html).toContain("<msub>");
    expect(html).toContain('data-testid="equation-initial-state"');
    expect(html.match(/data-control-id=/g)).toHaveLength(52);
    expect(document.views[locale].records).toHaveLength(2);
    for (const module of saved.scientificRecord.modules) expect(html).toContain(`id="${module.id}"`);
    expect(document.views[locale].tablesCsv).toContain("238816.54628141236");
    expect(document.views[locale].tablesCsv).toContain("143.71107118194095");
    expect(document.views[locale].tablesCsv).not.toContain("\\mathrm");
    const fine = savedDocumentHtmlV1(document, locale, 1);
    expect(fine).not.toBe(savedDocumentHtmlV1(document, locale, 0));
    expect(fine).toContain("4.27");
    for (const view of [html, fine]) {
      let depth = 0;
      for (const tag of view.matchAll(/<details\b|<\/details>/g)) {
        depth += tag[0].startsWith("</") ? -1 : 1;
        expect(depth).toBeLessThanOrEqual(1);
      }
      expect(depth).toBe(0);
    }
  });
  it.each(["ja", "en"] as const)("exports an offline %s document without JavaScript, app paths or network fonts", locale => {
    const html = savedDocumentOfflineHtmlV1(document, locale);
    expect(html).not.toMatch(/<script|<iframe|<select|<button|<link/i);
    expect(html).not.toMatch(/href="\/(?:ja|en)|href="#document-/);
    expect(html).not.toMatch(/@import|url\(fonts\//);
    expect(html).toContain("data:font/woff2;base64,");
    expect(html).toContain("data:text/csv;charset=utf-8,");
    expect(html).toContain("data:application/json;charset=utf-8,");
    expect(html).toContain('id="baseline-record-1"');
    for (const record of document.views[locale].records) expect(html).toContain(record.label);
    expect(html).toContain("Content-Security-Policy");
  });
  it("can bundle the reader when all model/analysis/authoring sources are unavailable", async () => {
    const result = await build({
      stdin: { contents: 'export {SavedModelDocumentationV1} from "./components/model/SavedModelDocumentationV1"; export {resolveSavedModelDocumentV1} from "./studio/presentation/modelDocumentation/SavedModelDocumentLibraryV1";', resolveDir: process.cwd(), loader: "tsx" },
      bundle: true, write: false, metafile: true, platform: "browser", external: ["react", "react/jsx-runtime"],
      outdir: "unused-in-memory-reader-build",
      loader: { ".woff": "dataurl", ".woff2": "dataurl", ".ttf": "dataurl" },
      alias: { "@": process.cwd() }, logLevel: "silent",
      plugins: [{ name: "retired-model-sources-unavailable", setup(context) {
        context.onLoad({ filter: /(?:engine|analysis|tools[\\/]modelDocumentation|studio[\\/]integrations)[\\/]/ }, args => {
          throw new Error(`Reader must not require retired implementation: ${args.path}`);
        });
      } }],
    });
    const inputs = Object.keys(result.metafile!.inputs);
    expect(inputs.some(p => p.endsWith("standard71-document-v1.json"))).toBe(true);
    expect(inputs.some(p => p.endsWith("standard72-document-v1.json"))).toBe(true);
    expect(inputs.some(p => p.endsWith("katex.min.css"))).toBe(true);
    expect(inputs.some(p => /MainWireModelModules|MainWireBaselineDocumentation|MainWireEquationSpecification|ModelMathV1/.test(p))).toBe(false);
  });
  it("preserves the recorded topology and volume closure", () => {
    const d = saved.scientificRecord.equations;
    const nodes = new Set([...d.nodes.map(n => n.id), ...d.coronary.topology.nodes.map(n => n.nodeId)]);
    expect(nodes.size).toBe(31);
    for (const [from, to] of [...d.edges.map(e => [e.upstream, e.downstream]), ...d.coronary.topology.edges.map(e => [e.upstreamNodeId, e.downstreamNodeId])]) {
      expect(nodes.has(from)).toBe(true); expect(nodes.has(to)).toBe(true);
    }
    expect([...Object.values(d.initial.volumesMl), ...Object.values(d.initial.coronary.volumeMlByNode)].reduce((sum, v) => sum + v, 0)).toBeCloseTo(d.initial.totalBloodVolumeMl, 9);
  });
  it("keeps archived prose and fonts out of the workbench's document index", async () => {
    const result = await build({ entryPoints: ["studio/presentation/modelDocumentation/SavedModelDocumentCatalogV1.ts"],
      bundle: true, write: false, metafile: true, platform: "browser", alias: { "@": process.cwd() }, logLevel: "silent" });
    expect(Object.keys(result.metafile!.inputs).some(p => /standard7[12]-document-v1\.json$/.test(p))).toBe(false);
    expect(result.outputFiles[0].contents.byteLength).toBeLessThan(10_000);
  });
  it.each([false, true])("loads independent document chunks; research visibility = %s", async dev => {
    const result = await build({ entryPoints: ["studio/presentation/modelDocumentation/SavedModelDocumentLibraryV1.ts"],
      bundle: true, splitting: true, format: "esm", write: false, metafile: true, platform: "browser",
      define: { "import.meta.env.PROD": String(!dev) },
      outdir: "unused-in-memory-reader-build", alias: { "@": process.cwd() }, logLevel: "silent" });
    const outputs = Object.values(result.metafile!.outputs);
    const library = outputs.find(output => output.entryPoint?.endsWith("SavedModelDocumentLibraryV1.ts"))!;
    expect(library.bytes).toBeLessThan(10_000);
    expect(library.imports.filter(item => item.kind === "dynamic-import")).toHaveLength(dev ? 5 : 3);
    expect(outputs.some(output => output.entryPoint?.endsWith("hfref-static-case-document-v4.reading-v1.json"))).toBe(dev);
    expect(outputs.some(output => output.entryPoint?.endsWith("hfref-static-case-document-v4.json"))).toBe(dev);
    for (const version of [71, 72]) {
      const chunk = outputs.find(output => output.entryPoint?.endsWith(`standard${version}-document-v1.json`))!;
      expect(chunk).toBeDefined();
      expect(Object.keys(chunk.inputs).some(input => input.endsWith(`standard${version === 71 ? 72 : 71}-document-v1.json`))).toBe(false);
    }
  });
});
