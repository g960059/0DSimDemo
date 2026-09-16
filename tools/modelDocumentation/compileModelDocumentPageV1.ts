import type { Locale } from "@/localeRouting";
import { modelDocumentationHref } from "@/homeLinks";
import { savedDocumentHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import { readingMatchesDocumentV1, savedReadingHtmlV1, type SavedModelReadingV1 } from "@/studio/presentation/modelDocumentation/SavedModelReadingV1";
import { modelDocumentAssetRootV1, type ModelDocumentPageDataV1 } from "@/studio/presentation/modelDocumentation/ModelDocumentDeliveryV1";

const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** Delivery compilation reads frozen source packages; no model or analysis code is needed. */
export function compileModelDocumentPageV1(saved: SavedModelDocumentV1, reading: SavedModelReadingV1 | null,
  locale: Locale, view: "guide" | "presets", recordId?: string | null): ModelDocumentPageDataV1 {
  if (reading && !readingMatchesDocumentV1(reading, saved)) throw new Error("Reader and scientific archive do not match");
  const records = saved.views[locale].records;
  const index = recordId ? records.findIndex(record => record.recordId === recordId) : 0;
  if (index < 0 || !records[index]) throw new Error("Unavailable documentation record");
  const root = modelDocumentAssetRootV1(saved);
  const downloads = { archive: `${root}/${locale}/archive.html`, csv: `${root}/${locale}/tables.csv`, measurements: `${root}/measurements.json` };
  let html = reading ? savedReadingHtmlV1(reading, locale, view, records[index].recordId) : savedDocumentHtmlV1(saved, locale, index);
  // Native links make every frozen record and export available before hydration.
  const links = records.map(record => {
    const url = modelDocumentationHref({ locale, ...saved.identity, documentId: saved.documentId, view });
    return `<a data-reader-record href="${escapeHtml(url + `&record=${encodeURIComponent(record.recordId)}#baseline`)}"${record.recordId === records[index].recordId ? ' aria-current="page"' : ""} class="rounded border border-wb-line px-3 py-2 text-wb-accent focus-visible:ring-2 focus-visible:ring-wb-accent">${escapeHtml(record.label)}</a>`;
  }).join("");
  html = html.replace(/<label\b[^>]*data-document-record-selector[\s\S]*?<\/label>/g,
    `<nav data-document-record-selector aria-label="${locale === "ja" ? "検証記録" : "Assessment records"}" class="mb-4 flex flex-wrap items-center gap-3 text-xs text-wb-muted">${links}</nav>`)
    .replace(/<div\b[^>]*data-document-toolbar[\s\S]*?<\/div>/g, "")
    .replace(/<button\b[^>]*data-document-action="csv"[^>]*>([\s\S]*?)<\/button>/g, `<a href="${downloads.csv}" download class="text-wb-accent">$1</a>`)
    .replace('href="#document-measurements"', `href="${downloads.measurements}" download`)
    .replace('href="#document-archive"', `href="${downloads.archive}" download`);
  return { schemaId: "circleheart.model-document-page.v1",
    source: { documentId: saved.documentId, identity: saved.identity, contentSha256: saved.contentSha256 },
    locale, view, recordId: records[index].recordId, historical: !reading,
    contents: reading ? reading.views[locale][view === "guide" ? "guide" : "preset"].contents : [], html, downloads };
}
