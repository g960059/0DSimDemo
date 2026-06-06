import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { caseDocumentToSimInstances } from "../caseDoc";
import { caseDocumentToLesson, lessonById, resolveLessonCase, type Lesson } from "../lessonDoc";
import { fetchPublishedLesson } from "../lessonCloud";
import { fetchCase } from "../caseCloud";
import { NotePanel } from "./NotePanel";
import { ExposedKnobs } from "./ExposedKnobs";
import { MetricsPanel, PVLoopPanel, WaveformPanel } from "./Charts";
import { PreviewController } from "../engine/previewController";
import type { PanelInstanceConfig, PhysicsRefState } from "../types";
import type { NumericKnobKey, PanelKey } from "../lessonDoc";
import { applyExposedKnob, computeStepResetIds, deriveStepInstances, resolveKnobTarget } from "../lessonKnobs";

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

const safeConvert = (caseDoc: NonNullable<ReturnType<typeof resolveLessonCase>>) => {
  try {
    return caseDocumentToSimInstances(caseDoc);
  } catch {
    return [];
  }
};

const LessonNotFound = () => (
  <div className="h-full w-full bg-slate-950 text-slate-200 flex items-center justify-center p-6">
    <div className="max-w-md text-center">
      <h1 className="text-2xl font-bold mb-3">Lesson not found</h1>
      <p className="text-sm text-slate-400 mb-5">This lesson is not available in the current learning path.</p>
      <Link to="/" className="inline-flex px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-bold">
        Back to Home
      </Link>
    </div>
  </div>
);

const LessonLoading = () => (
  <div className="h-full w-full bg-slate-950 text-slate-200 flex items-center justify-center p-6">
    <div className="text-sm font-bold text-slate-400">Loading lesson...</div>
  </div>
);

type CloudResolveState =
  | { status: "idle" | "loading" | "notfound" }
  | { status: "ready"; lesson: Lesson };

export const LessonPlayer = () => {
  const { id } = useParams();
  const localLesson = useMemo(() => (id ? lessonById(id) : undefined), [id]);
  const [cloudState, setCloudState] = useState<CloudResolveState>({ status: "idle" });

  useEffect(() => {
    if (!id || localLesson) {
      setCloudState({ status: "idle" });
      return;
    }

    let ignore = false;
    setCloudState({ status: "loading" });
    Promise.all([fetchCase(id), fetchPublishedLesson(id)]).then(([caseDoc, lesson]) => {
      if (ignore) return;
      const caseLesson = caseDoc ? caseDocumentToLesson(caseDoc) : undefined;
      const resolved = caseLesson ?? lesson;
      setCloudState(resolved ? { status: "ready", lesson: resolved } : { status: "notfound" });
    });

    return () => {
      ignore = true;
    };
  }, [id, localLesson]);

  if (!id) return <LessonNotFound />;
  if (localLesson) return <LessonPlayerBody key={localLesson.meta.id} lesson={localLesson} />;
  if (cloudState.status === "loading" || cloudState.status === "idle") return <LessonLoading />;
  if (cloudState.status === "ready") return <LessonPlayerBody key={cloudState.lesson.meta.id} lesson={cloudState.lesson} />;
  return <LessonNotFound />;
};

const LessonPlayerBody: React.FC<{ lesson: Lesson }> = ({ lesson }) => {
  const caseDoc = resolveLessonCase(lesson);
  const steps = lesson?.steps ?? [];
  const [controller] = useState(() => new PreviewController());
  const [baseInstances] = useState(() => caseDoc ? safeConvert(caseDoc) : []);
  const [liveInstances, setLiveInstances] = useState(() => deriveStepInstances(baseInstances, steps[0]));
  const [stepIndex, setStepIndex] = useState(0);
  const physicsRefs = useRef<Map<string, PhysicsRefState>>(controller.refs);
  const liveInstancesRef = useRef(liveInstances);
  const pendingResetIdsRef = useRef<string[]>([]);
  const pendingSteadyTransitionIdsRef = useRef<Set<string>>(new Set());
  const dirtyIdsRef = useRef<Set<string>>(new Set());

  const ids = useMemo(() => baseInstances.map((inst) => inst.id), [baseInstances]);
  const baseWaveformConfig = useMemo(() => configFor(ids, ["LVP", "AoP", "LAP"]), [ids]);
  const basePvConfig = useMemo(() => configFor(ids, ["LV"]), [ids]);
  const baseMetricsConfig = useMemo(() => configFor(ids, ["CO", "ABP", "CVP"]), [ids]);
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
  const exposedKnobs = currentStep?.stage.exposedKnobs ?? [];
  const knobTargetId = resolveKnobTarget(currentStep, ids);
  const knobTargetInstance = knobTargetId ? liveInstances.find((inst) => inst.id === knobTargetId) : undefined;
  const showExposedControls = exposedKnobs.length > 0 && !!knobTargetInstance;
  const stageGridRows = showExposedControls
    ? "lg:grid-rows-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(160px,0.7fr)_minmax(160px,0.65fr)]"
    : "lg:grid-rows-[minmax(260px,1fr)_minmax(260px,1fr)_minmax(180px,0.7fr)]";
  const nextLabel = currentStep?.stage.challenge?.kind === "predict"
    ? (currentStep.stage.challenge.revealLabel ?? "Reveal")
    : "Next";

  useEffect(() => {
    controller.start();
    return () => controller.stop();
  }, [controller]);

  useEffect(() => {
    if (!liveInstances.length) return;
    const steadyTransitionIds = [...pendingSteadyTransitionIdsRef.current];
    pendingSteadyTransitionIdsRef.current.clear();
    controller.setInstances(liveInstances, steadyTransitionIds.length > 0 ? { steadyTransitionIds } : undefined);
    const resetIds = pendingResetIdsRef.current;
    if (resetIds.length > 0) {
      pendingResetIdsRef.current = [];
      controller.resetInstances(resetIds);
    }
  }, [controller, liveInstances]);

  useEffect(() => {
    const next = deriveStepInstances(baseInstances, currentStep);
    pendingResetIdsRef.current = computeStepResetIds(liveInstancesRef.current, next, dirtyIdsRef.current);
    dirtyIdsRef.current = new Set();
    liveInstancesRef.current = next;
    setLiveInstances(next);
  }, [baseInstances, currentStep?.id, stepIndex]);

  const setExposedKnob = (key: NumericKnobKey, value: number) => {
    const targetId = resolveKnobTarget(currentStep, ids);
    if (!targetId) return;
    dirtyIdsRef.current.add(targetId);
    setLiveInstances((current) => {
      const next = current.map((inst) => (
        inst.id === targetId ? applyExposedKnob(inst, key, value) : inst
      ));
      liveInstancesRef.current = next;
      pendingSteadyTransitionIdsRef.current.add(targetId);
      controller.setInstances(next, { steadyTransitionIds: [targetId] });
      const target = next.find((inst) => inst.id === targetId);
      if (target) controller.requestNextSteady(target);
      return next;
    });
  };

  if (!lesson || !caseDoc || baseInstances.length === 0) {
    return <LessonNotFound />;
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

        <section className={`min-h-[760px] lg:min-h-0 grid auto-rows-[minmax(180px,auto)] ${stageGridRows} gap-3`}>
          {showPanel("waveform") && (
            <StagePanel title="Waveforms">
              <WaveformPanel physicsRefs={physicsRefs} instances={liveInstances} timeWindow={5000} config={waveformConfig} />
            </StagePanel>
          )}
          {showPanel("pvloop") && (
            <StagePanel title="PV Loop">
              <PVLoopPanel physicsRefs={physicsRefs} instances={liveInstances} config={pvConfig} showGuides />
            </StagePanel>
          )}
          {showPanel("metrics") && (
            <StagePanel title="Metrics">
              <MetricsPanel physicsRefs={physicsRefs} instances={liveInstances} config={metricsConfig} />
            </StagePanel>
          )}
          {showExposedControls && knobTargetInstance && (
            <StagePanel title="Controls">
              <ExposedKnobs instance={knobTargetInstance} keys={exposedKnobs} onChange={setExposedKnob} />
            </StagePanel>
          )}
        </section>
      </div>
    </div>
  );
};
