import { compileModelDocumentPageV1 } from "./compileModelDocumentPageV1";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { modelDocumentationHref } from "@/homeLinks";
import { MODEL_READING_ENTRIES_V1, type ModelReadingEntryV1 } from "@/studio/presentation/modelDocumentation/ModelReadingCatalogV1";
import { savedDocumentOfflineHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import { readingMatchesDocumentV1, type SavedModelReadingV1 } from "@/studio/presentation/modelDocumentation/SavedModelReadingV1";
import { modelDocumentAssetRootV1, modelDocumentPagePathV1, type ModelDocumentPageDataV1 } from "@/studio/presentation/modelDocumentation/ModelDocumentDeliveryV1";
import { ModelDocumentationViewV1 } from "@/components/model/ModelDocumentationViewV1";

const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
function verifyHash(value: { contentSha256: string }) {
  const { contentSha256, ...body } = value;
  if (sha(JSON.stringify(body)) !== contentSha256) throw new Error("Modified saved documentation package");
}

export function renderModelDocumentFragmentV1(page: ModelDocumentPageDataV1, entry: ModelReadingEntryV1,
  entries: readonly ModelReadingEntryV1[], path: string): string {
  const url = modelDocumentationHref({ locale: page.locale, ...entry.identity, documentId: entry.documentId, view: page.view });
  const { html: _html, ...bootstrap } = page;
  return `<div class="public-static-shell public-static-model">${renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}><ModelDocumentationViewV1 page={page} entry={entry} entries={entries} /></MemoryRouter>,
  )}<script id="model-document-bootstrap-v1" type="application/json" data-path="${escapeHtml(path)}">${JSON.stringify(bootstrap).replaceAll("<", "\\u003c")}</script></div>`;
}

export async function buildModelDocumentPagesV1(input: {
  root: string; production: boolean; emit: (path: string, content: string) => Promise<void> | void;
}) {
  const entries = MODEL_READING_ENTRIES_V1.filter(entry => !input.production || entry.state !== "research");
  for (const entry of entries) {
    if (!/^[a-z0-9][a-z0-9.-]+$/.test(entry.documentId)) throw new Error("Unsafe document package name");
    const base = join(input.root, "studio/presentation/modelDocumentation/packages", entry.documentId);
    const saved = JSON.parse(await readFile(`${base}.json`, "utf8")) as SavedModelDocumentV1;
    verifyHash(saved);
    if (saved.schemaId !== entry.schemaId || saved.contentSha256 !== entry.contentSha256
      || saved.documentId !== entry.documentId || Object.entries(entry.identity).some(([key, value]) => saved.identity[key] !== value)) throw new Error(`Document index mismatch: ${entry.documentId}`);
    let reading: SavedModelReadingV1 | null = null;
    try { reading = JSON.parse(await readFile(`${base}.reading-v1.json`, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (reading) {
      verifyHash(reading);
      if (!readingMatchesDocumentV1(reading, saved)) throw new Error(`Reading source mismatch: ${entry.documentId}`);
    }
    const root = modelDocumentAssetRootV1(saved);
    await input.emit(`${root}/measurements.json`, JSON.stringify(saved.scientificRecord.measurements, null, 2));
    for (const locale of ["ja", "en"] as const) {
      if (reading && JSON.stringify(reading.views[locale].preset.records.map(r => r.recordId)) !== JSON.stringify(saved.views[locale].records.map(r => r.recordId))) throw new Error(`Reading records mismatch: ${entry.documentId}`);
      await input.emit(`${root}/${locale}/archive.html`, savedDocumentOfflineHtmlV1(saved, locale));
      await input.emit(`${root}/${locale}/tables.csv`, saved.views[locale].tablesCsv);
      for (const view of ["guide", "presets"] as const) {
        for (const recordId of [null, ...saved.views[locale].records.map(record => record.recordId)]) {
          const page = compileModelDocumentPageV1(saved, reading, locale, view, recordId);
          const path = modelDocumentPagePathV1(saved, locale, view, recordId);
          await input.emit(path, JSON.stringify(page));
          await input.emit(path.replace(/\.json$/, ".html"), renderModelDocumentFragmentV1(page, entry, entries, path));
        }
      }
    }
  }
}
