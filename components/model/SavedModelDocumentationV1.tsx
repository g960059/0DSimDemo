import React from "react";
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
export function SavedModelDocumentationV1({ document: saved, locale }: {
  document: SavedModelDocumentV1; locale: Locale;
}) {
  const [record, setRecord] = React.useState(0);
  const root = React.useRef<HTMLDivElement>(null);
  const restored = React.useRef<{ open: number[]; scrollTop: number } | null>(null);
  const html = React.useMemo(() => savedDocumentHtmlV1(saved, locale, record), [saved, locale, record]);
  React.useLayoutEffect(() => {
    if (!restored.current || !root.current) return;
    const { open, scrollTop } = restored.current;
    root.current.querySelectorAll("details").forEach((details, index) => { details.open = open.includes(index); });
    const scroller = root.current.querySelector<HTMLElement>('[data-testid="model-documentation-v2"]');
    if (scroller) scroller.scrollTop = scrollTop;
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
      scrollTop: root.current.querySelector<HTMLElement>('[data-testid="model-documentation-v2"]')?.scrollTop ?? 0,
    };
    setRecord(index);
  }, [saved, locale]);
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
  };
  return <div ref={root} className="h-full" data-saved-document={saved.documentId}
    onClick={click} dangerouslySetInnerHTML={{ __html: html }} />;
}
