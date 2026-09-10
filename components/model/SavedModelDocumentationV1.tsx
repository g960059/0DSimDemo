import React from "react";
import { ChevronDown, Download } from "lucide-react";
// Math font metrics are a reader dependency, not a retired authoring side effect.
import "katex/dist/katex.min.css";
import type { Locale } from "@/localeRouting";
import { savedDocumentHtmlV1, savedDocumentOfflineHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";

function download(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** No exact-model, analysis, authoring-template or live-catalog dependency. */
export function SavedModelDocumentationV1({ document: saved, locale, readingHtml, onRecordChange }: {
  document: SavedModelDocumentV1; locale: Locale;
  readingHtml?: string;
  onRecordChange?: (recordId: string) => void;
}) {
  const t = (ja: string, en: string) => locale === "ja" ? ja : en;
  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent";
  const [record, setRecord] = React.useState(0);
  const root = React.useRef<HTMLDivElement>(null);
  const restored = React.useRef<{ open: number[]; scrollTop: number } | null>(null);
  const html = React.useMemo(() => readingHtml ?? savedDocumentHtmlV1(saved, locale, record), [readingHtml, saved, locale, record]);
  // TOC highlighting must not recreate frozen nodes and lose keyboard focus or
  // the user's open details while the actual document HTML is unchanged.
  const markup = React.useMemo(() => ({ __html: html }), [html]);
  const scroller = () => root.current?.closest<HTMLElement>("[data-reader-scroll]")
    ?? root.current?.querySelector<HTMLElement>('[data-testid="model-documentation-v2"]');
  React.useLayoutEffect(() => {
    if (!restored.current || !root.current) return;
    const { open, scrollTop } = restored.current;
    root.current.querySelectorAll("details").forEach((details, index) => { details.open = open.includes(index); });
    const scrolling = scroller();
    if (scrolling) scrolling.scrollTop = scrollTop;
    root.current.querySelector<HTMLSelectElement>('[data-document-action="record"]')?.focus({ preventScroll: true });
    restored.current = null;
  }, [html]);
  const change = React.useCallback((event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement) || target.dataset.documentAction !== "record") return;
    const index = Number(target.value);
    if (!Number.isInteger(index) || !saved.views[locale].records[index] || !root.current) return;
    restored.current = {
      open: Array.from(root.current.querySelectorAll("details")).flatMap((d, i) => d.open ? [i] : []),
      scrollTop: scroller()?.scrollTop ?? 0,
    };
    if (onRecordChange) onRecordChange(saved.views[locale].records[index].recordId);
    else setRecord(index);
  }, [saved, locale, onRecordChange]);
  // React's synthetic change plugin requires a React-owned select. These
  // selects belong to the frozen markup, so listen to their native event.
  React.useEffect(() => {
    const node = root.current;
    node?.addEventListener("change", change);
    return () => node?.removeEventListener("change", change);
  }, [change]);
  const click = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>("[data-document-action]");
    const action = target?.dataset.documentAction;
    if (!action || action === "record") return;
    event.preventDefault();
    if (action === "expand" || action === "collapse") {
      root.current?.querySelectorAll("details").forEach(d => { d.open = action === "expand"; });
    } else if (action === "csv") {
      download(saved.views[locale].tablesCsv, "text/csv;charset=utf-8", saved.filenames.tables);
    } else if (action === "measurements") {
      download(JSON.stringify(saved.scientificRecord.measurements, null, 2), "application/json", saved.filenames.measurements);
    } else if (action === "archive") {
      download(savedDocumentOfflineHtmlV1(saved, locale), "text/html;charset=utf-8", `${locale}-${saved.filenames.archive}`);
    }
    const menu = target?.closest<HTMLDetailsElement>("details[data-reader-menu]");
    if (menu) menu.open = false;
  };
  return <div className={readingHtml === undefined ? "h-full" : "model-reading-prose min-w-0"} data-saved-document={saved.documentId} onClick={click}>
    {readingHtml !== undefined && <div data-document-toolbar className="mb-6 flex flex-wrap items-center gap-x-4 text-xs text-wb-muted">
      <button data-document-action="expand" className={`min-h-11 rounded hover:text-wb-text ${focus}`}>{t("すべて開く", "Expand all")}</button>
      <button data-document-action="collapse" className={`min-h-11 rounded hover:text-wb-text ${focus}`}>{t("すべて閉じる", "Collapse all")}</button>
      <details data-reader-menu className="relative ml-auto">
        <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded hover:text-wb-text ${focus}`}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />{t("保存", "Save")}<ChevronDown className="h-3 w-3" aria-hidden="true" />
        </summary>
        <div className="absolute right-0 top-full z-10 w-72 max-w-[calc(100vw-2.5rem)] rounded-lg border border-wb-line bg-wb-panel p-2 shadow-xl">
          <button data-document-action="archive" className={`block min-h-11 w-full rounded px-3 text-left text-sm text-wb-text hover:bg-wb-app ${focus}`}>{t("文書一式（HTML）", "Complete document (HTML)")}</button>
          <p className="px-3 pb-2 text-xs leading-6 text-wb-muted">{t("しくみ・設定・全検証記録をまとめて、オフラインで読めます。", "Read the mechanisms, settings and all assessment records offline.")}</p>
          <button data-document-action="measurements" className={`block min-h-11 w-full rounded px-3 text-left text-sm hover:bg-wb-app ${focus}`}>{t("設定・検証記録（JSON）", "Settings and assessment (JSON)")}</button>
          <button data-document-action="csv" className={`block min-h-11 w-full rounded px-3 text-left text-sm hover:bg-wb-app ${focus}`}>{t("数値表（CSV）", "Numeric tables (CSV)")}</button>
        </div>
      </details>
    </div>}
    <div ref={root} className={readingHtml === undefined ? "h-full" : undefined} dangerouslySetInnerHTML={markup} />
  </div>;
}
