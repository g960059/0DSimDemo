import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { caseDocumentToSimInstances } from "../caseDoc";
import { lessonById } from "../lessonDoc";
import { officialCaseById } from "../officialCases";
import { NotePanel } from "./NotePanel";
import { MetricsPanel, PVLoopPanel, WaveformPanel } from "./Charts";
import { PreviewController } from "../engine/previewController";
import type { PanelInstanceConfig, PhysicsRefState } from "../types";

const configFor = (ids: string[], signals: string[]): Record<string, PanelInstanceConfig> =>
  Object.fromEntries(ids.map((id) => [id, { visible: true, selectedSignals: signals }]));

const StagePanel: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <section className={`min-h-0 rounded border border-slate-800 bg-[#0B1120] overflow-hidden ${className}`}>
    <div className="h-8 px-3 flex items-center border-b border-slate-800 text-[11px] font-semibold text-slate-400">
      {title}
    </div>
    <div className="relative h-[calc(100%-2rem)] min-h-0">
      {children}
    </div>
  </section>
);

export const LessonPlayer = () => {
  const { id } = useParams();
  return <LessonPlayerBody key={id ?? "missing"} lessonId={id} />;
};

const LessonPlayerBody: React.FC<{ lessonId?: string }> = ({ lessonId }) => {
  const lesson = lessonId ? lessonById(lessonId) : undefined;
  const caseDoc = lesson ? officialCaseById(lesson.caseId) : undefined;
  const [controller] = useState(() => new PreviewController());
  const physicsRefs = useRef<Map<string, PhysicsRefState>>(controller.refs);

  const instances = useMemo(() => {
    if (!caseDoc) return [];
    try {
      return caseDocumentToSimInstances(caseDoc);
    } catch {
      return [];
    }
  }, [caseDoc]);

  const ids = useMemo(() => instances.map((inst) => inst.id), [instances]);
  const waveformConfig = useMemo(() => configFor(ids, ["LVP", "AoP", "LAP"]), [ids]);
  const pvConfig = useMemo(() => configFor(ids, ["LV"]), [ids]);
  const metricsConfig = useMemo(() => configFor(ids, ["CO", "ABP", "CVP"]), [ids]);

  useEffect(() => {
    if (instances.length === 0) return;
    controller.setInstances(instances);
    controller.start();
    return () => controller.stop();
  }, [controller, instances]);

  if (!lesson || !caseDoc || instances.length === 0) {
    return (
      <div className="h-full w-full bg-slate-950 text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Lesson not found</h1>
          <p className="text-sm text-slate-400 mb-5">This lesson is not available in the current learning path.</p>
          <Link to="/" className="inline-flex px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-bold">
            Back to learning path
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950 text-slate-200">
      <div className="min-h-full grid grid-cols-1 lg:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.35fr)] gap-3 p-3 sm:p-4">
        <section className="min-h-[420px] lg:min-h-0 rounded border border-slate-800 bg-[#0B1120] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="text-[11px] uppercase font-bold text-blue-400 tracking-wide">{lesson.meta.level ?? "Lesson"}</div>
            <h1 className="text-lg font-bold text-slate-100">{lesson.meta.title}</h1>
            {lesson.meta.objective && <p className="text-sm text-slate-400 mt-1">{lesson.meta.objective}</p>}
          </div>
          <div className="flex-1 min-h-0">
            <NotePanel mode="read" content={lesson.noteSpine} />
          </div>
        </section>

        <section className="min-h-[760px] lg:min-h-0 grid grid-rows-[minmax(260px,1fr)_minmax(260px,1fr)_minmax(180px,0.7fr)] gap-3">
          <StagePanel title="Waveforms">
            <WaveformPanel physicsRefs={physicsRefs} instances={instances} timeWindow={5000} config={waveformConfig} />
          </StagePanel>
          <StagePanel title="PV Loop">
            <PVLoopPanel physicsRefs={physicsRefs} instances={instances} config={pvConfig} showGuides />
          </StagePanel>
          <StagePanel title="Metrics">
            <MetricsPanel physicsRefs={physicsRefs} instances={instances} config={metricsConfig} />
          </StagePanel>
        </section>
      </div>
    </div>
  );
};
