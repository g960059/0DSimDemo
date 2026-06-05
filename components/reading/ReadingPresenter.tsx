import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { caseDocumentToSimInstances } from "../../caseDoc";
import { resolveRawEdit, resolveKnobEdit } from "../../engine/instanceKnobs";
import { PreviewController } from "../../engine/previewController";
import type { ClinicalKnobs } from "../../engine/knobs";
import type { SimulationHealth } from "../../engine/protocol";
import type { CaseDocument, ReadingColumnEntry } from "../../caseDoc";
import type { PhysicsRefState, SimInstance, SimulationParams } from "../../types";
import { ReadingColumn } from "./ReadingColumn";

export const ReadingPresenter: React.FC<{
  lessonTitle: string;
  lessonLevel?: string;
  objective?: string;
  caseDoc: CaseDocument;
  column: ReadingColumnEntry[];
}> = ({ lessonTitle, lessonLevel, objective, caseDoc, column }) => {
  const [controller] = useState(() => new PreviewController());
  const [liveInstances, setLiveInstances] = useState<SimInstance[]>(() => caseDocumentToSimInstances(caseDoc));
  const [instanceHealth, setInstanceHealth] = useState<Record<string, SimulationHealth>>({});
  const physicsRefs = useRef<Map<string, PhysicsRefState>>(controller.refs);
  const activeInstanceId = liveInstances[0]?.id ?? "";
  const notes = useMemo(() => caseDoc.notes ?? {}, [caseDoc.notes]);

  useEffect(() => {
    controller.onHealthChange = setInstanceHealth;
    controller.start();
    return () => {
      controller.onHealthChange = undefined;
      controller.stop();
    };
  }, [controller]);

  useEffect(() => {
    controller.setInstances(liveInstances);
  }, [controller, liveInstances]);

  const updateWith = (project: (instance: SimInstance) => SimInstance) => {
    setLiveInstances((current) => {
      const next = current.map(project);
      controller.setInstances(next);
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
    });
  };

  const updateInstanceVolume = (id: string, vol: number) => {
    setLiveInstances((current) => {
      const next = current.map((instance) => (instance.id === id ? { ...instance, targetVolume: vol } : instance));
      controller.setInstanceVolume(id, vol);
      controller.setInstances(next);
      return next;
    });
  };

  // h-full (NOT min-h-full): this div must be the bounded scrollport under
  // Layout's `flex-1 overflow-hidden` <main>. min-h-full grows to content
  // height so nothing scrolls (the reading-article scroll bug).
  return (
    <div className="h-full min-h-0 w-full overflow-y-auto bg-slate-950 text-slate-200">
      <div className="sticky top-0 z-20 h-12 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[960px] items-center gap-3 px-4">
          <Link to="/" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 truncate text-sm font-semibold text-slate-300">{lessonTitle}</div>
        </div>
      </div>

      <article className="mx-auto w-full max-w-[768px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <div className="text-[11px] font-bold uppercase tracking-wide text-blue-400">{lessonLevel ?? "Lesson"}</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-50 sm:text-3xl">{lessonTitle}</h1>
        {objective && <p className="mt-3 text-base leading-7 text-slate-400">{objective}</p>}

        <div className="mt-8">
          <ReadingColumn
            column={column}
            panels={caseDoc.panels}
            notes={notes}
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
            }}
          />
        </div>
      </article>
    </div>
  );
};
