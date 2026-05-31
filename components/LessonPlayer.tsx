import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { caseDocumentToSimInstances } from "../caseDoc";
import { lessonById, resolveLessonCase } from "../lessonDoc";
import { NotePanel } from "./NotePanel";
import { MetricsPanel, PVLoopPanel, WaveformPanel } from "./Charts";
import { PreviewController } from "../engine/previewController";
import type { PanelInstanceConfig, PhysicsRefState } from "../types";
import type { PanelKey } from "../lessonDoc";

const configFor = (ids: string[], signals: string[]): Record<string, PanelInstanceConfig> =>
  Object.fromEntries(ids.map((id) => [id, { visible: true, selectedSignals: signals }]));

const maskConfig = (
  baseConfig: Record<string, PanelInstanceConfig>,
  visibleIds: string[],
): Record<string, PanelInstanceConfig> => {
  const visible = new Set(visibleIds);
  return Object.fromEntries(Object.entries(baseConfig).filter(([id]) => visible.has(id)));
};

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
  const caseDoc = lesson ? resolveLessonCase(lesson) : undefined;
  const [controller] = useState(() => new PreviewController());
  const [stepIndex, setStepIndex] = useState(0);
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
  const baseWaveformConfig = useMemo(() => configFor(ids, ["LVP", "AoP", "LAP"]), [ids]);
  const basePvConfig = useMemo(() => configFor(ids, ["LV"]), [ids]);
  const baseMetricsConfig = useMemo(() => configFor(ids, ["CO", "ABP", "CVP"]), [ids]);
  const steps = lesson?.steps ?? [];
  const isStepped = steps.length > 0;
  const currentStep = isStepped ? steps[Math.min(stepIndex, steps.length - 1)] : undefined;
  const visibleIds = useMemo(
    () => currentStep?.stage.visibleInstances ?? ids,
    [currentStep?.stage.visibleInstances, ids],
  );
  const waveformConfig = useMemo(() => maskConfig(baseWaveformConfig, visibleIds), [baseWaveformConfig, visibleIds]);
  const pvConfig = useMemo(() => maskConfig(basePvConfig, visibleIds), [basePvConfig, visibleIds]);
  const metricsConfig = useMemo(() => maskConfig(baseMetricsConfig, visibleIds), [baseMetricsConfig, visibleIds]);
  const visiblePanels = currentStep?.stage.visiblePanels;
  const showPanel = (panel: PanelKey) => !visiblePanels || visiblePanels.includes(panel);
  const noteContent = currentStep?.note ?? lesson?.noteSpine;
  const nextLabel = currentStep?.stage.challenge?.kind === "predict"
    ? (currentStep.stage.challenge.revealLabel ?? "Reveal")
    : "Next";

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
            {isStepped && currentStep && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>{currentStep.title ?? `Step ${stepIndex + 1}`}</span>
                  <span>{stepIndex + 1} / {steps.length}</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
                </div>
                {currentStep.stage.challenge?.prompt && (
                  <p className="mt-2 text-xs text-amber-300">{currentStep.stage.challenge.prompt}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <NotePanel key={currentStep?.id ?? "one-page"} mode="read" content={noteContent} />
          </div>
          {isStepped && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-800">
              <button
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                disabled={stepIndex === 0}
                className="px-3 py-1.5 rounded bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                Back
              </button>
              <button
                onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                disabled={stepIndex >= steps.length - 1}
                className="px-4 py-1.5 rounded bg-blue-600 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500"
              >
                {stepIndex >= steps.length - 1 ? "Complete" : nextLabel}
              </button>
            </div>
          )}
        </section>

        <section className="min-h-[760px] lg:min-h-0 grid grid-rows-[minmax(260px,1fr)_minmax(260px,1fr)_minmax(180px,0.7fr)] gap-3">
          {showPanel("waveform") && (
            <StagePanel title="Waveforms">
              <WaveformPanel physicsRefs={physicsRefs} instances={instances} timeWindow={5000} config={waveformConfig} />
            </StagePanel>
          )}
          {showPanel("pvloop") && (
            <StagePanel title="PV Loop">
              <PVLoopPanel physicsRefs={physicsRefs} instances={instances} config={pvConfig} showGuides />
            </StagePanel>
          )}
          {showPanel("metrics") && (
            <StagePanel title="Metrics">
              <MetricsPanel physicsRefs={physicsRefs} instances={instances} config={metricsConfig} />
            </StagePanel>
          )}
        </section>
      </div>
    </div>
  );
};
