import React from "react";
import { ChevronDown, Download } from "lucide-react";
import type { ModelDocumentPageDataV1 } from "@/studio/presentation/modelDocumentation/ModelDocumentDeliveryV1";

/** Frozen prose is sufficient to read. Large offline exports are ordinary download links. */
export function SavedModelDocumentationV1({ page }: { page: ModelDocumentPageDataV1 }) {
  const t = (ja: string, en: string) => page.locale === "ja" ? ja : en;
  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent";
  const root = React.useRef<HTMLDivElement>(null);
  const markup = React.useMemo(() => ({ __html: page.html }), [page.html]);
  const click = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const action = event.target.closest<HTMLElement>("[data-document-action]")?.dataset.documentAction;
    if (action === "expand" || action === "collapse") {
      event.preventDefault();
      root.current?.querySelectorAll("details").forEach(d => { d.open = action === "expand"; });
    }
  };
  return <div className={page.historical ? "h-full" : "model-reading-prose min-w-0"} data-saved-document={page.source.documentId} onClick={click}>
    <div data-document-toolbar className="mb-6 flex flex-wrap items-center gap-x-4 text-xs text-wb-muted">
      <button data-document-action="expand" className={`min-h-11 rounded hover:text-wb-text ${focus}`}>{t("すべて開く", "Expand all")}</button>
      <button data-document-action="collapse" className={`min-h-11 rounded hover:text-wb-text ${focus}`}>{t("すべて閉じる", "Collapse all")}</button>
      <details data-reader-menu className="relative ml-auto">
        <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded hover:text-wb-text ${focus}`}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />{t("保存", "Save")}<ChevronDown className="h-3 w-3" aria-hidden="true" />
        </summary>
        <div className="absolute right-0 top-full z-10 w-72 max-w-[calc(100vw-2.5rem)] rounded-lg border border-wb-line bg-wb-panel p-2 shadow-xl">
          <a href={page.downloads.archive} download className={`flex min-h-11 items-center rounded px-3 text-sm text-wb-text hover:bg-wb-app ${focus}`}>{t("文書一式（HTML）", "Complete document (HTML)")}</a>
          <p className="px-3 pb-2 text-xs leading-6 text-wb-muted">{t("しくみ・設定・全検証記録をまとめて、オフラインで読めます。", "Read the mechanisms, settings and all assessment records offline.")}</p>
          <a href={page.downloads.measurements} download className={`flex min-h-11 items-center rounded px-3 text-sm hover:bg-wb-app ${focus}`}>{t("設定・検証記録（JSON）", "Settings and assessment (JSON)")}</a>
          <a href={page.downloads.csv} download className={`flex min-h-11 items-center rounded px-3 text-sm hover:bg-wb-app ${focus}`}>{t("数値表（CSV）", "Numeric tables (CSV)")}</a>
        </div>
      </details>
    </div>
    <div ref={root} data-model-reading-body className={page.historical ? "h-full" : undefined} dangerouslySetInnerHTML={markup} />
  </div>;
}
