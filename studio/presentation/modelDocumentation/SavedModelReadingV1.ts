import type { Locale } from "@/localeRouting";
import type { SavedModelDocumentV1 } from "./SavedModelDocumentV1";

export type DocumentContentsV1 = readonly Readonly<{ id: string; title: string; level: number }>[];

/** Regenerable reader projection bound to an immutable scientific archive.
 * Retiring authoring/model code does not affect either this HTML or the archive. */
export type SavedModelReadingV1 = Readonly<{
  schemaId: "circleheart.saved-model-reading.v1";
  source: { documentId: string; contentSha256: string };
  authoring: readonly { path: string; sha256: string }[];
  views: Record<Locale, {
    guide: { html: string; contents: DocumentContentsV1 };
    preset: { beforeHtml: string; records: SavedModelDocumentV1["views"][Locale]["records"];
      afterHtml: string; contents: DocumentContentsV1 };
  }>;
  contentSha256: string;
}>;

export function readingMatchesDocumentV1(reading: SavedModelReadingV1, saved: SavedModelDocumentV1) {
  return reading.schemaId === "circleheart.saved-model-reading.v1"
    && reading.source.documentId === saved.documentId
    && reading.source.contentSha256 === saved.contentSha256;
}

export function savedReadingHtmlV1(reading: SavedModelReadingV1, locale: Locale, view: "guide" | "presets", recordId?: string | null) {
  const projection = reading.views[locale];
  if (view === "guide") return projection.guide.html;
  const preset = projection.preset;
  const record = recordId ? preset.records.find(r => r.recordId === recordId) : preset.records[0];
  if (!record) throw new Error("The requested assessment record is not saved in this document");
  return preset.beforeHtml + record.html + preset.afterHtml;
}
