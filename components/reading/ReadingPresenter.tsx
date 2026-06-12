import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Copy, RotateCcw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { ClinicalKnobs } from "../../engine/knobs";
import type { SimulationHealth } from "../../engine/protocol";
import type { CaseDocument, ReadingColumnEntry } from "../../caseDoc";
import type { NoteContent } from "../../noteTypes";
import type { PhysicsRefState, SimInstance, SimulationParams } from "../../types";
import { deriveHeadingAnchors } from "../NotePanel";
import { ReadingColumn } from "./ReadingColumn";
import { homeHref } from "../../homeLinks";
import { localeFromPathname } from "../../localeRouting";
import { localeDisplayLabel } from "../../contentI18n";
import { authoredViewsOnly } from "../../features/workbench/authoredViews";
import { collectNoteViewRefIds } from "../../features/workbench/noteViewRefs";
import { ReadExploreSwitcher } from "../workbench/ReadExploreSwitcher";
import type { ReadExploreMode } from "../../features/workbench/readExplore";

function plainTextFromInlineContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    const inline = item as { type?: unknown; text?: unknown; content?: unknown };
    if (inline.type === "text" && typeof inline.text === "string") return inline.text;
    return plainTextFromInlineContent(inline.content);
  }).join(" ");
}

function collectReadingNoteBlocks(column: ReadingColumnEntry[], notes: Record<string, NoteContent>): NoteContent {
  return column.flatMap((entry) => (entry.kind === "noteRef" ? notes[entry.noteId] ?? [] : []));
}

function countWords(blocks: NoteContent): number {
  const text = blocks.map((block) => {
    const props = (block.props && typeof block.props === "object" ? block.props : {}) as Record<string, unknown>;
    return [
      plainTextFromInlineContent(block.content),
      typeof props.question === "string" ? props.question : "",
      typeof props.options === "string" ? props.options.replace(/\|/g, " ") : "",
    ].filter(Boolean).join(" ");
  }).join(" ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const ReadingPresenter: React.FC<{
  lessonTitle: string;
  lessonLevel?: string;
  objective?: string;
  caseDoc: Pick<CaseDocument, "meta" | "panels" | "notes" | "views" | "exposedControllers">;
  column: ReadingColumnEntry[];
  fallbackLocale?: string;
  runtime: {
    instances: SimInstance[];
    physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
    instanceHealth?: Record<string, SimulationHealth>;
    activeInstanceId: string;
    updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
    updateInstanceKnobs: (id: string, knobs: ClinicalKnobs) => void;
    updateInstanceVolume: (id: string, vol: number) => void;
  };
  chrome?: {
    backHref?: string;
    backLabel?: string;
    showReadExploreSwitcher?: boolean;
    readExploreMode?: ReadExploreMode;
    onReadExploreModeChange?: (mode: ReadExploreMode) => void;
    onResetToAuthorState?: () => void;
    onFork?: () => void | Promise<void>;
    isForking?: boolean;
  };
}> = ({ lessonTitle, lessonLevel, objective, caseDoc, column, fallbackLocale, runtime, chrome }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [readingProgress, setReadingProgress] = useState(0);
  const scrollportRef = useRef<HTMLDivElement>(null);
  const notes = useMemo(() => caseDoc.notes ?? {}, [caseDoc.notes]);
  const authoredViews = useMemo(() => authoredViewsOnly(caseDoc.views), [caseDoc.views]);
  const readingBlocks = useMemo(() => collectReadingNoteBlocks(column, notes), [column, notes]);
  const headingAnchors = useMemo(() => deriveHeadingAnchors(readingBlocks), [readingBlocks]);
  const estimatedReadMinutes = Math.max(1, Math.ceil(countWords(readingBlocks) / 220));
  const noteViewRefs = useMemo(() => collectNoteViewRefIds(notes), [notes]);
  const hasInteractiveViewRefs = authoredViews.some((view) => (
    view.kind === "controller"
    && (noteViewRefs.has(view.id) || column.some((entry) => entry.kind === "viewRef" && entry.viewId === view.id))
  ));
  const hasInteractiveControls = caseDoc.panels.some((panel) => panel.type === "CONTROLS") || (caseDoc.exposedControllers?.length ?? 0) > 0 || hasInteractiveViewRefs;

  const updateReadingProgress = () => {
    const scrollport = scrollportRef.current;
    if (!scrollport) return;
    const scrollable = scrollport.scrollHeight - scrollport.clientHeight;
    setReadingProgress(scrollable <= 0 ? 1 : Math.min(1, Math.max(0, scrollport.scrollTop / scrollable)));
  };

  useEffect(() => {
    updateReadingProgress();
    const scrollport = scrollportRef.current;
    if (!scrollport) return;
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateReadingProgress) : undefined;
    resizeObserver?.observe(scrollport);
    return () => resizeObserver?.disconnect();
  }, [column, headingAnchors.length, runtime.instances.length]);

  // h-full (NOT min-h-full): this div must be the bounded scrollport under
  // Layout's `flex-1 overflow-hidden` <main>. min-h-full grows to content
  // height so nothing scrolls (the reading-article scroll bug).
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-wb-app text-wb-text">
      <div className="workbench-header relative z-20 h-14 shrink-0">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <Link to={chrome?.backHref ?? homeHref(locale)} className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text" aria-label={chrome?.backLabel ?? t("lessonPlayer.backToHome")}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{chrome?.backLabel ?? t("lessonPlayer.backToHome")}</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="min-w-0 truncate text-sm font-bold text-wb-text">{lessonTitle}</div>
            <span className="hidden shrink-0 rounded border border-wb-line bg-wb-strip px-2 py-0.5 text-[11px] font-semibold text-wb-subtle sm:inline">
              {t("workbench.header.readOnlyBadge")}
            </span>
            {chrome?.showReadExploreSwitcher && chrome.readExploreMode && chrome.onReadExploreModeChange && (
              <ReadExploreSwitcher mode={chrome.readExploreMode} onModeChange={chrome.onReadExploreModeChange} className="ml-1" />
            )}
          </div>
          {chrome?.onResetToAuthorState && (
            <button
              type="button"
              onClick={chrome.onResetToAuthorState}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-wb-line bg-transparent px-2.5 text-xs font-bold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{t("workbench.header.resetToAuthorState")}</span>
            </button>
          )}
          {chrome?.onFork && (
            <button
              type="button"
              onClick={chrome.onFork}
              disabled={chrome.isForking}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-wb-primary px-3 text-xs font-bold text-white hover:bg-wb-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{chrome.isForking ? t("workbench.header.saving") : t("workbench.header.fork")}</span>
            </button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-sky-400" style={{ width: `${readingProgress * 100}%` }} />
      </div>

      <div ref={scrollportRef} onScroll={updateReadingProgress} className="min-h-0 flex-1 overflow-y-auto">
      <article className="mx-auto w-full max-w-[860px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="mx-auto w-full max-w-[68ch]">
          <h1 className="text-3xl font-bold text-slate-50 sm:text-[34px]">{lessonTitle}</h1>
          {fallbackLocale && (
            <p className="mt-3 text-sm font-semibold text-amber-300">
              {t("contentI18n.fallbackNotice", { locale: localeDisplayLabel(fallbackLocale, i18n.language) })}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1 font-semibold uppercase tracking-wide">{lessonLevel ?? t("lessonPlayer.lesson")}</span>
            <span>{t("reading.minRead", { count: estimatedReadMinutes })}</span>
            {hasInteractiveControls && <span className="rounded border border-sky-900/70 bg-sky-950/40 px-2 py-1 font-semibold text-sky-300">{t("reading.interactive")}</span>}
          </div>
          {objective && <p className="mt-4 text-base leading-7 text-slate-400">{objective}</p>}
        </header>

        {headingAnchors.length > 0 && (
          <details className="mx-auto mt-8 w-full max-w-[68ch] rounded-md border border-slate-800 bg-slate-900/30 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-300">{t("reading.tableOfContents")}</summary>
            <nav className="mt-3 flex flex-col gap-2">
              {headingAnchors.map((anchor) => (
                <a key={anchor.id} href={`#${anchor.id}`} className="text-sm text-slate-400 hover:text-sky-300">
                  {anchor.text}
                </a>
              ))}
            </nav>
          </details>
        )}

        <div className="mt-8">
          <ReadingColumn
            column={column}
            panels={caseDoc.panels}
            notes={notes}
            headingAnchorIds={headingAnchors.map((anchor) => anchor.id)}
            paneCtx={{
              instances: runtime.instances,
              physicsRefs: runtime.physicsRefs,
              instanceHealth: runtime.instanceHealth,
              activeInstanceId: runtime.activeInstanceId,
              updateInstanceParams: runtime.updateInstanceParams,
              updateInstanceKnobs: runtime.updateInstanceKnobs,
              updateInstanceVolume: runtime.updateInstanceVolume,
              noteMode: "read",
              notes,
              authoredViews,
              noteCaseKey: caseDoc.meta.id,
              presentationMode: "reading",
            }}
          />
        </div>
      </article>
      </div>
    </div>
  );
};
