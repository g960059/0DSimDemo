import type { Locale } from "@/localeRouting";
import type { SavedModelDocumentV1 } from "./SavedModelDocumentV1";
import type { DocumentContentsV1 } from "./SavedModelReadingV1";

export type ModelDocumentIndexV1 = Pick<SavedModelDocumentV1, "documentId" | "contentSha256" | "identity">;
/** A disposable delivery projection. Exact and Surface identities remain those of the saved source. */
export type ModelDocumentPageDataV1 = Readonly<{
  schemaId: "circleheart.model-document-page.v1";
  source: ModelDocumentIndexV1;
  locale: Locale;
  view: "guide" | "presets";
  recordId: string | null;
  historical: boolean;
  contents: DocumentContentsV1;
  html: string;
  downloads: Readonly<{ archive: string; measurements: string; csv: string }>;
}>;

export function modelDocumentAssetRootV1(index: ModelDocumentIndexV1): string {
  return `/model-documents/v1/${encodeURIComponent(index.documentId)}/${index.contentSha256}`;
}

export function modelDocumentPagePathV1(index: ModelDocumentIndexV1, locale: Locale,
  view: "guide" | "presets", recordId?: string | null): string {
  // UTF-8 hex also supports future scoped record IDs without filesystem separators.
  const record = recordId ? "-r-" + Array.from(new TextEncoder().encode(recordId), byte => byte.toString(16).padStart(2, "0")).join("") : "";
  return `${modelDocumentAssetRootV1(index)}/${locale}/${view}${record}.json`;
}

export function matchesModelDocumentPageV1(value: unknown, index: ModelDocumentIndexV1,
  locale: Locale, view: "guide" | "presets", recordId?: string | null): value is ModelDocumentPageDataV1 {
  if (!value || typeof value !== "object") return false;
  const page = value as ModelDocumentPageDataV1;
  const root = modelDocumentAssetRootV1(index) + "/";
  return page.schemaId === "circleheart.model-document-page.v1"
    && page.source?.documentId === index.documentId && page.source?.contentSha256 === index.contentSha256
    && page.source?.identity?.modelId === index.identity.modelId
    && page.source?.identity?.surfaceReleaseId === index.identity.surfaceReleaseId
    && page.source?.identity?.baselineId === index.identity.baselineId
    && page.locale === locale && page.view === view && (!recordId || page.recordId === recordId)
    && typeof page.historical === "boolean" && typeof page.html === "string"
    && Array.isArray(page.contents) && page.contents.every(item => typeof item.id === "string" && typeof item.title === "string" && Number.isInteger(item.level))
    && [page.downloads?.archive, page.downloads?.measurements, page.downloads?.csv]
      .every(href => typeof href === "string" && href.startsWith(root) && !href.includes(".."));
}
