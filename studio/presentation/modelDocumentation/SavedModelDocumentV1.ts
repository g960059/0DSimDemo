import type { Locale } from "@/localeRouting";

/** Compiled, trusted documentation, not an executable model or a new runtime identity.
 * Authoring modules are resolved when this package is created, never when read.
 * HTML is generated from repository-owned React/KaTeX, not supplied by users.
 */
export type SavedModelDocumentV1 = Readonly<{
  schemaId: "circleheart.saved-model-document.v1";
  documentId: string;
  identity: Readonly<{
    modelId: string; surfaceReleaseId: string; surfaceSeriesId: string;
    baselineId: string; title: string; releaseStatus: string;
  }>;
  provenance: Readonly<{
    sourceCommit: string; uncommittedSources: boolean;
    files: readonly Readonly<{ path: string; sha256: string }>[];
  }>;
  views: Readonly<Record<Locale, Readonly<{
    beforeAssessmentHtml: string;
    records: readonly Readonly<{ recordId: string; label: string; html: string }>[];
    afterAssessmentHtml: string;
    tablesCsv: string;
  }>>>;
  scientificRecord: Readonly<{
    measurements: unknown; equations: unknown; modules: unknown; equationSpecification: unknown;
  }>;
  filenames: Readonly<{ measurements: string; tables: string; archive: string }>;
  archiveCss: string;
  contentSha256: string;
}>;

export function savedDocumentMatchesV1(
  document: Pick<SavedModelDocumentV1, "schemaId" | "identity">, modelId: string | undefined, surfaceReleaseId: string | null | undefined,
): boolean {
  return document.schemaId === "circleheart.saved-model-document.v1"
    && document.identity.modelId === modelId && document.identity.surfaceReleaseId === surfaceReleaseId;
}

export function savedDocumentHtmlV1(document: SavedModelDocumentV1, locale: Locale, recordIndex = 0): string {
  const view = document.views[locale];
  const record = view.records[recordIndex];
  if (!record) throw new Error(`Unavailable documentation record: ${recordIndex}`);
  return view.beforeAssessmentHtml + record.html + view.afterAssessmentHtml;
}

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const dataHref = (type: string, content: string) => `data:${type};charset=utf-8,${encodeURIComponent(content)}`;

/** Script-free, offline-readable fallback. All assessment records are retained;
 * <details>, SVG, MathML, local font data and downloadable tables need no app.
 */
export function savedDocumentOfflineHtmlV1(document: SavedModelDocumentV1, locale: Locale): string {
  const view = document.views[locale];
  const records = view.records.map((record, index) => record.html
    .replace('id="baseline"', `id="${index === 0 ? "baseline" : `baseline-record-${index}`}"`)
    .replace(/<label\b[^>]*data-document-record-selector[\s\S]*?<\/label>/,
      `<p class="my-5 text-sm">${escapeHtml(record.label)}</p>`)).join("\n");
  let body = view.beforeAssessmentHtml + records + view.afterAssessmentHtml;
  body = body.replace(/<div\b[^>]*data-document-toolbar[\s\S]*?<\/div>/, "")
    .replace(/<a\b[^>]*data-document-action="archive"[\s\S]*?<\/a>/, "")
    .replace(/<a\b[^>]*href="\/(?:ja|en)"[\s\S]*?<\/a>/, "")
    .replace(/<button\b([^>]*data-document-action="csv"[^>]*)>([\s\S]*?)<\/button>/,
      `<a href="${dataHref("text/csv", view.tablesCsv)}" download="${escapeHtml(document.filenames.tables)}" $1>$2</a>`)
    .replace('href="#document-measurements"', `href="${dataHref("application/json", JSON.stringify(document.scientificRecord.measurements, null, 2))}"`);
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; base-uri 'none'; form-action 'none'"><title>${escapeHtml(document.identity.title)}</title><style>${document.archiveCss}</style></head><body data-app-theme="dark">${body}<footer class="mx-auto max-w-4xl px-5 py-8 text-xs" style="overflow-wrap:anywhere">${escapeHtml(document.documentId)} · SHA-256 ${document.contentSha256}</footer></body></html>`;
}
