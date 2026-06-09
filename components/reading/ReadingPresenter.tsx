import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { caseDocumentToSimInstances } from "../../caseDoc";
import { resolveRawEdit, resolveKnobEdit } from "../../engine/instanceKnobs";
import { PreviewController } from "../../engine/previewController";
import type { ClinicalKnobs } from "../../engine/knobs";
import type { SimulationHealth } from "../../engine/protocol";
import type { CaseDocument, ReadingColumnEntry } from "../../caseDoc";
import type { NoteContent } from "../../noteTypes";
import type { PhysicsRefState, SimInstance, SimulationParams } from "../../types";
import { deriveHeadingAnchors } from "../NotePanel";
import { ReadingColumn } from "./ReadingColumn";
import { homeHref } from "../../homeLinks";
import { localeFromPathname } from "../../localeRouting";

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
  caseDoc: CaseDocument;
  column: ReadingColumnEntry[];
}> = ({ lessonTitle, lessonLevel, objective, caseDoc, column }) => {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [controller] = useState(() => new PreviewController());
  const [liveInstances, setLiveInstances] = useState<SimInstance[]>(() => caseDocumentToSimInstances(caseDoc));
  const [instanceHealth, setInstanceHealth] = useState<Record<string, SimulationHealth>>({});
  const [readingProgress, setReadingProgress] = useState(0);
  const scrollportRef = useRef<HTMLDivElement>(null);
  const physicsRefs = useRef<Map<string, PhysicsRefState>>(controller.refs);
  const pendingSteadyTransitionIdsRef = useRef<Set<string>>(new Set());
  const activeInstanceId = liveInstances[0]?.id ?? "";
  const notes = useMemo(() => caseDoc.notes ?? {}, [caseDoc.notes]);
  const readingBlocks = useMemo(() => collectReadingNoteBlocks(column, notes), [column, notes]);
  const headingAnchors = useMemo(() => deriveHeadingAnchors(readingBlocks), [readingBlocks]);
  const estimatedReadMinutes = Math.max(1, Math.ceil(countWords(readingBlocks) / 220));
  const hasInteractiveControls = caseDoc.panels.some((panel) => panel.type === "CONTROLS") || (caseDoc.exposedControllers?.length ?? 0) > 0;

  useEffect(() => {
    controller.onHealthChange = setInstanceHealth;
    controller.start();
    return () => {
      controller.onHealthChange = undefined;
      controller.stop();
    };
  }, [controller]);

  useEffect(() => {
    const steadyTransitionIds = [...pendingSteadyTransitionIdsRef.current];
    pendingSteadyTransitionIdsRef.current.clear();
    controller.setInstances(liveInstances, steadyTransitionIds.length > 0 ? { steadyTransitionIds } : undefined);
  }, [controller, liveInstances]);

  const updateWith = (project: (instance: SimInstance) => SimInstance, steadyTransitionIds: string[] = []) => {
    setLiveInstances((current) => {
      const next = current.map(project);
      steadyTransitionIds.forEach((id) => pendingSteadyTransitionIdsRef.current.add(id));
      controller.setInstances(next, steadyTransitionIds.length > 0 ? { steadyTransitionIds } : undefined);
      for (const id of steadyTransitionIds) {
        const target = next.find((instance) => instance.id === id);
        if (target) controller.requestNextSteady(target);
      }
      return next;
    });
  };

  const updateInstanceParams = (id: string, params: Partial<SimulationParams>) => {
    updateWith((instance) => {
      if (instance.id !== id) return instance;
      const next = resolveRawEdit({
        params: instance.params,
        knobs: instance.knobs,
        knobBaseline: instance.knobBaseline,
      }, params);
      return { ...instance, ...next };
    });
  };

  const updateInstanceKnobs = (id: string, knobs: ClinicalKnobs) => {
    updateWith((instance) => {
      if (instance.id !== id) return instance;
      const next = resolveKnobEdit({
        params: instance.params,
        knobs: instance.knobs,
        knobBaseline: instance.knobBaseline,
      }, knobs);
      return { ...instance, ...next };
    }, [id]);
  };

  const updateInstanceVolume = (id: string, vol: number) => {
    setLiveInstances((current) => {
      const next = current.map((instance) => (instance.id === id ? { ...instance, targetVolume: vol } : instance));
      pendingSteadyTransitionIdsRef.current.add(id);
      controller.setInstances(next, { steadyTransitionIds: [id] });
      const target = next.find((instance) => instance.id === id);
      if (target) controller.requestNextSteady(target);
      return next;
    });
  };

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
  }, [column, headingAnchors.length, liveInstances.length]);

  // h-full (NOT min-h-full): this div must be the bounded scrollport under
  // Layout's `flex-1 overflow-hidden` <main>. min-h-full grows to content
  // height so nothing scrolls (the reading-article scroll bug).
  return (
    <div ref={scrollportRef} onScroll={updateReadingProgress} className="h-full min-h-0 w-full overflow-y-auto bg-slate-950 text-slate-200">
      <div className="sticky top-0 z-20 h-12 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[960px] items-center gap-3 px-4">
          <Link to={homeHref(locale)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 truncate text-sm font-semibold text-slate-300">{lessonTitle}</div>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-sky-400" style={{ width: `${readingProgress * 100}%` }} />
      </div>

      <article className="mx-auto w-full max-w-[860px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="mx-auto w-full max-w-[68ch]">
          <h1 className="text-3xl font-bold text-slate-50 sm:text-[34px]">{lessonTitle}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1 font-semibold uppercase tracking-wide">{lessonLevel ?? "Lesson"}</span>
            <span>{estimatedReadMinutes} min read</span>
            {hasInteractiveControls && <span className="rounded border border-sky-900/70 bg-sky-950/40 px-2 py-1 font-semibold text-sky-300">Interactive</span>}
          </div>
          {objective && <p className="mt-4 text-base leading-7 text-slate-400">{objective}</p>}
        </header>

        {headingAnchors.length > 0 && (
          <details className="mx-auto mt-8 w-full max-w-[68ch] rounded-md border border-slate-800 bg-slate-900/30 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-300">目次</summary>
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
              instances: liveInstances,
              physicsRefs,
              instanceHealth,
              activeInstanceId,
              updateInstanceParams,
              updateInstanceKnobs,
              updateInstanceVolume,
              noteMode: "read",
              notes,
              noteCaseKey: caseDoc.meta.id,
              presentationMode: "reading",
            }}
          />
        </div>
      </article>
    </div>
  );
};
