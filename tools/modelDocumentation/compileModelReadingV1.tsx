import React from "react";
import { MemoryRouter } from "react-router-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { studioCanonicalJsonStringify as canonical } from "@/domain/json/CanonicalJson";
import type { SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import type { SavedModelReadingV1 } from "@/studio/presentation/modelDocumentation/SavedModelReadingV1";
import { MAIN_WIRE_MODEL_MODULES_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { MAIN_WIRE_EQUATION_SPECIFICATION_V1 } from "@/studio/presentation/modelDocumentation/MainWireEquationSpecificationV1";
import { MainWireGuideV1 } from "./authoring/MainWireReadingV1";
import { MainWireDocumentV1, type MainWireDocumentContentV1 } from "./authoring/MainWireDocumentV1";
import { StaticCaseDocumentV1 } from "./authoring/StaticCaseDocumentV1";
import type { StaticCaseDocumentContentV1 } from "./authoring/StaticCaseDocumentCompositionV1";
import { MainWireEquationSpecificationContextV1 } from "./authoring/MainWireEquationDetailsV1";
import { modelDocumentationHref } from "@/homeLinks";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function compileModelReadingV1(input: {
  sourcePath: string; target: string; check: boolean;
  measurements: unknown; content: MainWireDocumentContentV1 | StaticCaseDocumentContentV1; staticCase: boolean;
}) {
  const saved = JSON.parse(await readFile(input.sourcePath, "utf8")) as SavedModelDocumentV1;
  const { contentSha256, ...sourceBody } = saved;
  if (sha(JSON.stringify(sourceBody)) !== contentSha256) throw new Error("Scientific archive integrity failed");
  const expected = saved.scientificRecord;
  const actual = { measurements: input.measurements, equations: input.content.equations,
    modules: input.content.moduleIds.map(id => MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === id)!),
    equationSpecification: expected.equationSpecification };
  if (canonical(actual) !== canonical(expected)) {
    const different = (a: unknown, b: unknown, path = ""): string[] => {
      if (canonical(a) === canonical(b)) return [];
      if (!a || !b || typeof a !== "object" || typeof b !== "object") return [path];
      return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => different(
        (a as Record<string, unknown>)[k] ?? null, (b as Record<string, unknown>)[k] ?? null, `${path}.${k}`));
    };
    throw new Error(`Reader projection would change the archived scientific record: ${different(actual, expected).slice(0, 20).join(", ")}`);
  }
  const browser = await chromium.launch({ headless: true });
  // A correction to today's shared authoring text must not silently alter a
  // historical model's saved constitutive specification.
  const render = (element: React.ReactNode) => renderToStaticMarkup(
    <MainWireEquationSpecificationContextV1.Provider value={expected.equationSpecification as typeof MAIN_WIRE_EQUATION_SPECIFICATION_V1}>
      {element}
    </MainWireEquationSpecificationContextV1.Provider>);
  const views = {} as SavedModelReadingV1["views"];
  try {
    const page = await browser.newPage({ javaScriptEnabled: false });
    const inspect = async (html: string) => {
      await page.setContent(html);
      return page.evaluate(() => {
        if (document.querySelector("script,iframe,object,embed,base,form,details details,.katex-error")) throw new Error("Invalid reading structure");
        const ids = new Set<string>();
        for (const e of document.querySelectorAll("*")) {
          if (e.id && ids.has(e.id)) throw new Error(`Repeated reading anchor: ${e.id}`);
          if (e.id) ids.add(e.id);
          for (const a of e.attributes) if (/^on/i.test(a.name) || /^(?:javascript|vbscript):/i.test(a.value.trim())) throw new Error("Executable reading content");
        }
        return Array.from(document.querySelectorAll("section[id] > h2, article[id] > h3"))
          .map(h => ({ id: h.parentElement!.id, title: h.textContent!, level: h.tagName === "H2" ? 2 : 3 }));
      });
    };
    for (const locale of ["ja", "en"] as const) {
      const settingsHref = modelDocumentationHref({ locale, ...saved.identity, documentId: saved.documentId, view: "presets" }) + "#settings";
      const guide = render(<MainWireGuideV1 document={input.content} locale={locale} settingsHref={settingsHref} />);
      const contents = await inspect(guide);
      const rendered = [];
      for (const recordIndex of [0, 1] as const) {
        const html = render(<MemoryRouter>{input.staticCase
          ? <StaticCaseDocumentV1 document={input.content as StaticCaseDocumentContentV1} locale={locale} recordIndex={recordIndex} reading />
          : <MainWireDocumentV1 document={input.content as MainWireDocumentContentV1} locale={locale} recordIndex={recordIndex} reading />}</MemoryRouter>);
        const presetContents = await inspect(html);
        // Declared authoring boundaries, not heuristic extraction of old HTML.
        const start = html.indexOf('<section id="baseline"'), end = html.indexOf('<section id="record"');
        if (start < 0 || end <= start) throw new Error("Missing reading assessment boundary");
        rendered.push({ before: html.slice(0, start), html: html.slice(start, end), after: html.slice(end), contents: presetContents });
      }
      if (rendered[0].before !== rendered[1].before || rendered[0].after !== rendered[1].after) throw new Error("Assessment leaked into shared setting text");
      views[locale] = { guide: { html: guide, contents }, preset: {
        beforeHtml: rendered[0].before, afterHtml: rendered[0].after, contents: rendered[0].contents,
        records: rendered.map((r, i) => ({ ...saved.views[locale].records[i], html: r.html })),
      } };
    }
  } finally { await browser.close(); }
  const files = ["tools/modelDocumentation/compileModelReadingV1.tsx", "tools/modelDocumentation/authoring/MainWireReadingV1.tsx",
    "tools/modelDocumentation/authoring/MainWireDocumentV1.tsx", "tools/modelDocumentation/authoring/StaticCaseDocumentV1.tsx",
    "tools/modelDocumentation/authoring/MainWireModuleExplanationsV1.tsx", "tools/modelDocumentation/authoring/MainWireEquationDetailsV1.tsx"];
  const body = { schemaId: "circleheart.saved-model-reading.v1" as const,
    source: { documentId: saved.documentId, contentSha256 },
    authoring: await Promise.all(files.map(async path => ({ path, sha256: sha(await readFile(path, "utf8")) }))), views };
  const result = { ...body, contentSha256: sha(JSON.stringify(body)) };
  const json = JSON.stringify(result, null, 2) + "\n";
  if (input.check) {
    if (await readFile(input.target, "utf8") !== json) throw new Error("Reader projection differs; regenerate explicitly");
  } else await writeFile(input.target, json);
  console.log(JSON.stringify({ target: input.target, sourceDocumentId: saved.documentId, contentSha256: result.contentSha256, simulated: false, scientificRecordChanged: false }));
}
