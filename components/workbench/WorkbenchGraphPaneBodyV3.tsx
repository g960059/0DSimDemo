import React from "react";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "@/appTheme";
import { ExperimentGraphPresentationV3 } from "@/components/workbench/ExperimentPanePresentationV3";
import {
  WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3,
  isWorkbenchGraphTraceExcludedV3,
  resolveWorkbenchGraphScenarioIdsV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  GuytonStarlingComparisonCanvasV3,
  PressureVolumeLoopCanvasV3,
  SweepingWaveformCanvasV3,
  WorkbenchScenarioPresentationSampleStoreV3,
  resolveWorkbenchGraphTraceStyleV3,
  structuralReturnOrientationFromPayloadV3,
  useWorkbenchSampledGraphPresentationSamplesV3,
  workbenchModelCyclePhaseOutputIdV3,
  type WorkbenchScenarioOrbitHistoryV3,
  type WorkbenchScenarioPresentationSamplesV3,
} from "@/components/workbench/presentation";
import {
  shouldAutoRequestStructuralReturnComparisonV3,
  structuralReturnComparisonRequestKeyV3,
  workbenchAnalysisHistoryKeyV3,
  workbenchBoundedGraphHistoryV3,
} from "@/components/workbench/WorkbenchAnalysisState";
import { workbenchScenarioRuntimeStatusV3 } from "@/components/workbench/WorkbenchSessionPolicy";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID } from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import type { MainWirePeriodicPvaV1 } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import type { MainWirePeriodicPvaDerivationV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import type {
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import type {
  ModelContractV2,
  StructuralReturnGraphDefinitionV2,
} from "@/studio/contracts/v2/model";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import type { StudioSimulationWorkerScenarioDescriptorV2 } from "@/studio/workers/StudioSimulationWorkerProtocolV2";

const EMPTY_WORKBENCH_SCENARIO_PRESENTATION_SAMPLES_V3 = Object.freeze(
  Object.create(null),
) as WorkbenchScenarioPresentationSamplesV3;
const EMPTY_WORKBENCH_SCENARIO_ORBIT_HISTORY_V3 = Object.freeze(
  Object.create(null),
) as WorkbenchScenarioOrbitHistoryV3;

export function workbenchPvGraphUsesPeriodicPvaAnalysisV3(
  renderer: ModelContractV2["graphCatalog"][number]["renderer"],
  displayedSeriesIds: readonly string[],
  periodicPvaDerivation: MainWirePeriodicPvaDerivationV1 | null,
): boolean {
  return (
    renderer === "pressure-volume" &&
    periodicPvaDerivation !== null &&
    displayedSeriesIds.some((seriesId) => seriesId === "LV" || seriesId === "RV")
  );
}

export function GraphPaneBodyV3({
  activeScenarioId,
  playbackRunning,
  analysisByKey,
  analysisHistoryByKey,
  analysisErrorByKey,
  contract,
  frame,
  onRequestAnalysis,
  operationPending,
  pane,
  pendingAnalysisKeys,
  periodicPvaDerivation,
  sampleStore,
  scenarios,
  surface,
  visibleScenarioIds,
}: Readonly<{
  activeScenarioId: string | null;
  playbackRunning: boolean;
  analysisByKey: Readonly<Record<string, StudioSimulationAnalysisV2>>;
  analysisHistoryByKey: Readonly<
    Record<string, readonly StudioSimulationAnalysisV2[]>
  >;
  analysisErrorByKey: Readonly<Record<string, string>>;
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  onRequestAnalysis: (
    analysisId: string,
    scenarioIds: readonly string[],
  ) => boolean;
  operationPending: boolean;
  pane: ExperimentSurfaceGraphPaneV2;
  pendingAnalysisKeys: readonly string[];
  periodicPvaDerivation: MainWirePeriodicPvaDerivationV1 | null;
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
  surface: ExperimentSurfaceV2;
  visibleScenarioIds: readonly string[];
}>) {
  const { t } = useTranslation();
  const { appTheme } = useAppTheme();
  const graph = contract.graphCatalog.find(
    ({ graphId }) => graphId === pane.graphId,
  );
  if (graph === undefined) {
    return (
      <div className="p-4 text-xs text-wb-danger">
        {t("workbench.live.unknownGraph")}
      </div>
    );
  }
  const scopedVisibleScenarioIds = resolveWorkbenchGraphScenarioIdsV3(
    pane,
    visibleScenarioIds,
  );
  if (graph.renderer === "structural-return") {
    const structuralAnalysisId =
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID;
    const pending = new Set(pendingAnalysisKeys);
    const traces = Object.freeze(
      scenarios.flatMap((scenario, scenarioIndex) => {
        if (
          !scopedVisibleScenarioIds.includes(scenario.scenarioId) ||
          isWorkbenchGraphTraceExcludedV3(pane, scenario.scenarioId, null)
        )
          return [];
        const key = workbenchAnalysisHistoryKeyV3(
          scenario.scenarioId,
          structuralAnalysisId,
        );
        const traceStyle = resolveWorkbenchGraphTraceStyleV3({
          pane,
          surface,
          renderer: graph.renderer,
          authoredScenarioCount: scenarios.length,
          scenarioId: scenario.scenarioId,
          scenarioIndex,
          seriesId: null,
          appTheme,
        });
        const analysisPending = pending.has(key);
        const configuredHistoryDepth = pane.historyDepth ?? 1;
        return [
          Object.freeze({
            scenarioId: scenario.scenarioId,
            scenarioLabel: scenario.label,
            color: traceStyle.color,
            analysis: analysisByKey[key],
            history: workbenchBoundedGraphHistoryV3(
              analysisHistoryByKey[key] ?? [],
              analysisPending
                ? Math.max(1, configuredHistoryDepth)
                : configuredHistoryDepth,
            ),
            error: analysisErrorByKey[key] ?? null,
            pending: analysisPending,
          }),
        ];
      }),
    );
    return (
      <StructuralReturnGraphPaneV3
        acceptedStepAvailable={(frame?.acceptedRevision ?? 0) > 0}
        analysisId={structuralAnalysisId}
        structuralSide={
          pane.structuralSide ?? (graph.side === "left" ? "left" : "right")
        }
        onRequestAnalysis={onRequestAnalysis}
        operationPending={operationPending}
        traces={traces}
      />
    );
  }
  return (
    <SampledGraphPaneBodyV3
      activeScenarioId={activeScenarioId}
      analysisByKey={analysisByKey}
      analysisErrorByKey={analysisErrorByKey}
      playbackRunning={playbackRunning}
      contract={contract}
      frame={frame}
      graph={graph}
      onRequestAnalysis={onRequestAnalysis}
      operationPending={operationPending}
      pane={pane}
      pendingAnalysisKeys={pendingAnalysisKeys}
      periodicPvaDerivation={periodicPvaDerivation}
      sampleStore={sampleStore}
      scenarios={scenarios}
      surface={surface}
      visibleScenarioIds={scopedVisibleScenarioIds}
    />
  );
}

function SampledGraphPaneBodyV3({
  activeScenarioId,
  analysisByKey,
  analysisErrorByKey,
  playbackRunning,
  contract,
  frame,
  graph,
  onRequestAnalysis,
  operationPending,
  pane,
  pendingAnalysisKeys,
  periodicPvaDerivation,
  sampleStore,
  scenarios,
  surface,
  visibleScenarioIds,
}: Readonly<{
  activeScenarioId: string | null;
  analysisByKey: Readonly<Record<string, StudioSimulationAnalysisV2>>;
  analysisErrorByKey: Readonly<Record<string, string>>;
  playbackRunning: boolean;
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  graph: Exclude<
    ModelContractV2["graphCatalog"][number],
    StructuralReturnGraphDefinitionV2
  >;
  onRequestAnalysis: (
    analysisId: string,
    scenarioIds: readonly string[],
  ) => boolean;
  operationPending: boolean;
  pane: ExperimentSurfaceGraphPaneV2;
  pendingAnalysisKeys: readonly string[];
  periodicPvaDerivation: MainWirePeriodicPvaDerivationV1 | null;
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
  surface: ExperimentSurfaceV2;
  visibleScenarioIds: readonly string[];
}>) {
  const { appTheme } = useAppTheme();
  const graphPresentation = useWorkbenchSampledGraphPresentationSamplesV3(
    sampleStore,
    graph.renderer,
  );
  const samplesByScenarioId =
    graphPresentation.renderer === "sweep"
      ? graphPresentation.samplesByScenarioId
      : EMPTY_WORKBENCH_SCENARIO_PRESENTATION_SAMPLES_V3;
  const exactOrbitSamplesByScenarioId =
    graphPresentation.renderer === "pressure-volume"
      ? graphPresentation.exactOrbitSamplesByScenarioId
      : EMPTY_WORKBENCH_SCENARIO_PRESENTATION_SAMPLES_V3;
  const orbitHistoryByScenarioId =
    graphPresentation.renderer === "pressure-volume"
      ? graphPresentation.orbitHistoryByScenarioId
      : EMPTY_WORKBENCH_SCENARIO_ORBIT_HISTORY_V3;
  const displayedSeries = React.useMemo(
    () =>
      Object.freeze(
        [...pane.series].sort((left, right) => left.order - right.order),
      ),
    [pane.series],
  );
  const authoredScenarioCount = scenarios.length;
  const cyclePhaseOutputId = workbenchModelCyclePhaseOutputIdV3(contract);
  const pendingAnalysisSet = new Set(pendingAnalysisKeys);
  // Workbench exposes one physiological PV relation owner. Legacy authored
  // `responsive-preview` values remain readable in portable content, but no
  // longer select the retired multi-load support envelope.
  const pressureVolumeAnalysisId =
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID;
  const pvaAnalysisScenarioIds =
    workbenchPvGraphUsesPeriodicPvaAnalysisV3(
      graph.renderer,
      displayedSeries.map(({ seriesId }) => seriesId),
      periodicPvaDerivation,
    )
      ? scenarios
          .filter(({ scenarioId }) => visibleScenarioIds.includes(scenarioId))
          .map(({ scenarioId }) => scenarioId)
      : [];
  const missingPvaAnalysisScenarioIds = pvaAnalysisScenarioIds.filter(
    (scenarioId) => {
      const key = workbenchAnalysisHistoryKeyV3(
        scenarioId,
        pressureVolumeAnalysisId,
      );
      return (
        analysisByKey[key] === undefined &&
        analysisErrorByKey[key] === undefined &&
        !pendingAnalysisSet.has(key)
      );
    },
  );
  const pvaAnalysisRequestKey = JSON.stringify([
    pressureVolumeAnalysisId,
    ...missingPvaAnalysisScenarioIds,
  ]);
  const lastPvaAnalysisRequestKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (missingPvaAnalysisScenarioIds.length === 0) {
      lastPvaAnalysisRequestKeyRef.current = null;
      return;
    }
    if (
      graph.renderer !== "pressure-volume" ||
      (frame?.acceptedRevision ?? 0) <= 0 ||
      operationPending ||
      lastPvaAnalysisRequestKeyRef.current === pvaAnalysisRequestKey
    )
      return;
    if (
      onRequestAnalysis(pressureVolumeAnalysisId, missingPvaAnalysisScenarioIds)
    ) {
      lastPvaAnalysisRequestKeyRef.current = pvaAnalysisRequestKey;
    }
  }, [
    frame?.acceptedRevision,
    graph.renderer,
    missingPvaAnalysisScenarioIds,
    onRequestAnalysis,
    operationPending,
    periodicPvaDerivation,
    pressureVolumeAnalysisId,
    pvaAnalysisRequestKey,
  ]);
  if (graph.renderer === "pressure-volume") {
    const bindings = displayedSeries.flatMap((series) => {
      const binding = graph.seriesCatalog.find(
        (candidate) => candidate.seriesId === series.seriesId,
      );
      return binding === undefined ? [] : [{ binding, series }];
    });
    const tracesForBindings = (selectedBindings: typeof bindings) =>
      scenarios.flatMap((scenario, scenarioStyleIndex) => {
        if (!visibleScenarioIds.includes(scenario.scenarioId)) return [];
        const samples =
          exactOrbitSamplesByScenarioId[scenario.scenarioId] ?? [];
        if (samples.length === 0) return [];
        return selectedBindings.flatMap(({ binding, series }) => {
          if (
            isWorkbenchGraphTraceExcludedV3(
              pane,
              scenario.scenarioId,
              series.seriesId,
            )
          )
            return [];
          const analysisKey = workbenchAnalysisHistoryKeyV3(
            scenario.scenarioId,
            pressureVolumeAnalysisId,
          );
          const relationSide = pressureVolumeRelationSideV3(binding.seriesId);
          const periodicPva =
            relationSide === null
              ? undefined
              : periodicPvaFromAnalysisV3(
                  analysisByKey[analysisKey],
                  relationSide,
                  periodicPvaDerivation,
                );
          const style = resolveWorkbenchGraphTraceStyleV3({
            pane,
            surface,
            renderer: graph.renderer,
            authoredScenarioCount,
            scenarioId: scenario.scenarioId,
            scenarioIndex: scenarioStyleIndex,
            seriesId: series.seriesId,
            seriesIndex: displayedSeries.findIndex(
              ({ seriesId }) => seriesId === series.seriesId,
            ),
            appTheme,
          });
          return [
            {
              scenarioId: scenario.scenarioId,
              scenarioLabel: scenario.label,
              scenarioStatus: workbenchScenarioRuntimeStatusV3(playbackRunning),
              scenarioStyleIndex,
              samples,
              historySampleSets: workbenchBoundedGraphHistoryV3(
                orbitHistoryByScenarioId[scenario.scenarioId] ?? [],
                pane.historyDepth ?? 1,
              ).map((entry) => entry.samples),
              volumeOutputId: binding.volumeOutputId,
              pressureOutputId: binding.pressureOutputId,
              pressureBasis: binding.pressureBasis,
              cyclePhaseOutputId: binding.cyclePhaseOutputId,
              chamberId: binding.seriesId,
              chamberLabel: series.label,
              chamberColor: style.color,
              ...(periodicPva === undefined ? {} : { periodicPva }),
              ...(analysisErrorByKey[analysisKey] === undefined
                ? {}
                : {
                    periodicPvaAnalysisError: analysisErrorByKey[analysisKey],
                  }),
              periodicPvaAnalysisPending: pendingAnalysisSet.has(analysisKey),
            },
          ];
        });
      });
    const traces = tracesForBindings(bindings);
    return (
      <ExperimentGraphPresentationV3
        variant="pane"
        canvasClassName="h-full min-h-0"
      >
        <PressureVolumeLoopCanvasV3
          traces={traces}
          showPressureEnvelope={pane.showPressureEnvelope}
        />
      </ExperimentGraphPresentationV3>
    );
  }
  const bindings = displayedSeries.flatMap((series) => {
    const binding = graph.seriesCatalog.find(
      (candidate) => candidate.seriesId === series.seriesId,
    );
    return binding === undefined ? [] : [{ binding, series }];
  });
  const outputs = bindings.flatMap(({ binding }) => {
    const definition = contract.outputCatalog.find(
      (candidate) => candidate.outputId === binding.outputId,
    );
    return definition === undefined ? [] : [definition];
  });
  const commonUnit =
    outputs.length > 0 && outputs.every(({ unit }) => unit === outputs[0]!.unit)
      ? outputs[0]!.unit
      : undefined;
  const tracesForScenarios = (
    selectedScenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[],
  ) =>
    selectedScenarios.flatMap((scenario) => {
      const scenarioStyleIndex = scenarios.findIndex(
        ({ scenarioId }) => scenarioId === scenario.scenarioId,
      );
      if (
        scenarioStyleIndex < 0 ||
        !visibleScenarioIds.includes(scenario.scenarioId)
      )
        return [];
      const samples = samplesByScenarioId[scenario.scenarioId] ?? [];
      if (samples.length === 0) return [];
      return bindings.flatMap(({ binding, series }) => {
        if (
          isWorkbenchGraphTraceExcludedV3(
            pane,
            scenario.scenarioId,
            series.seriesId,
          )
        )
          return [];
        const style = resolveWorkbenchGraphTraceStyleV3({
          pane,
          surface,
          renderer: graph.renderer,
          authoredScenarioCount,
          scenarioId: scenario.scenarioId,
          scenarioIndex: scenarioStyleIndex,
          seriesId: series.seriesId,
          seriesIndex: displayedSeries.findIndex(
            ({ seriesId }) => seriesId === series.seriesId,
          ),
          appTheme,
        });
        return [
          {
            scenarioId: scenario.scenarioId,
            scenarioLabel: scenario.label,
            scenarioStatus: workbenchScenarioRuntimeStatusV3(playbackRunning),
            scenarioStyleIndex,
            samples,
            outputId: binding.outputId,
            signalLabel: series.label,
            signalColor: style.color,
            ...(cyclePhaseOutputId === undefined ? {} : { cyclePhaseOutputId }),
          },
        ];
      });
    });
  const traces = tracesForScenarios(scenarios);
  return (
    <ExperimentGraphPresentationV3
      variant="pane"
      canvasClassName="h-full min-h-0"
    >
      <SweepingWaveformCanvasV3
        activeScenarioId={activeScenarioId}
        includeZero={outputs.every(
          ({ outputId }) =>
            outputId.includes(".flow.") || outputId.endsWith(".flow"),
        )}
        traces={traces}
        unitLabel={commonUnit}
        windowSec={pane.windowSec ?? WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3}
      />
    </ExperimentGraphPresentationV3>
  );
}

function pressureVolumeRelationSideV3(
  seriesId: string,
): "left" | "right" | null {
  if (seriesId === "LV") return "left";
  if (seriesId === "RV") return "right";
  return null;
}

const PERIODIC_PVA_CACHE_V3 = new WeakMap<
  StudioSimulationAnalysisV2,
  Map<string, MainWirePeriodicPvaV1 | null>
>();

export function periodicPvaFromAnalysisV3(
  analysis: StudioSimulationAnalysisV2 | undefined,
  side: "left" | "right",
  derivation: MainWirePeriodicPvaDerivationV1 | null,
): MainWirePeriodicPvaV1 | undefined {
  if (analysis === undefined || derivation === null) return undefined;
  const cacheKey = `${derivation.methodId}\u0000${side}`;
  const cached = PERIODIC_PVA_CACHE_V3.get(analysis)?.get(cacheKey);
  if (cached !== undefined) return cached ?? undefined;
  const orientation = structuralReturnOrientationFromPayloadV3(
    analysis.payload,
    side,
  );
  let pva: MainWirePeriodicPvaV1 | null = null;
  try {
    if (orientation !== null) {
      pva = derivation.build(
        orientation.starlingLocus,
        side === "left" ? "LV" : "RV",
      );
    }
  } catch {
    pva = null;
  }
  const analysisCache = PERIODIC_PVA_CACHE_V3.get(analysis) ?? new Map();
  analysisCache.set(cacheKey, pva);
  PERIODIC_PVA_CACHE_V3.set(analysis, analysisCache);
  return pva ?? undefined;
}

type StructuralReturnScenarioTraceV3 = Readonly<{
  scenarioId: string;
  scenarioLabel: string;
  color: string;
  analysis: StudioSimulationAnalysisV2 | undefined;
  history: readonly StudioSimulationAnalysisV2[];
  error: string | null;
  pending: boolean;
}>;

function StructuralReturnGraphPaneV3({
  acceptedStepAvailable,
  analysisId,
  onRequestAnalysis,
  operationPending,
  structuralSide,
  traces,
}: Readonly<{
  acceptedStepAvailable: boolean;
  analysisId: string;
  onRequestAnalysis: (
    analysisId: string,
    scenarioIds: readonly string[],
  ) => boolean;
  operationPending: boolean;
  structuralSide: "left" | "right";
  traces: readonly StructuralReturnScenarioTraceV3[];
}>) {
  const { t } = useTranslation();
  const lastAutoRequestedKeyRef = React.useRef<string | null>(null);
  const retainedOrientationByScenarioRef = React.useRef(
    new Map<
      string,
      NonNullable<ReturnType<typeof structuralReturnOrientationFromPayloadV3>>
    >(),
  );
  const missingScenarioIds = React.useMemo(
    () =>
      Object.freeze(
        traces
          .filter(
            ({ analysis, error, pending }) =>
              analysis === undefined && error === null && !pending,
          )
          .map(({ scenarioId }) => scenarioId),
      ),
    [traces],
  );
  const currentRequestKey = structuralReturnComparisonRequestKeyV3(
    analysisId,
    missingScenarioIds,
  );
  React.useEffect(() => {
    if (currentRequestKey === null) lastAutoRequestedKeyRef.current = null;
  }, [currentRequestKey]);
  React.useEffect(() => {
    if (
      shouldAutoRequestStructuralReturnComparisonV3({
        acceptedStepAvailable,
        currentRequestKey,
        lastAutoRequestedKey: lastAutoRequestedKeyRef.current,
        operationPending,
      })
    ) {
      if (onRequestAnalysis(analysisId, missingScenarioIds)) {
        lastAutoRequestedKeyRef.current = currentRequestKey;
      }
    }
  }, [
    acceptedStepAvailable,
    currentRequestKey,
    analysisId,
    missingScenarioIds,
    onRequestAnalysis,
    operationPending,
  ]);
  React.useEffect(() => {
    const retained = retainedOrientationByScenarioRef.current;
    const activeKeys = new Set(
      traces.map(({ scenarioId }) => `${structuralSide}:${scenarioId}`),
    );
    for (const key of retained.keys()) {
      if (!activeKeys.has(key)) retained.delete(key);
    }
    for (const trace of traces) {
      const orientation = structuralReturnOrientationFromPayloadV3(
        trace.analysis?.payload,
        structuralSide,
      );
      if (orientation !== null) {
        retained.set(`${structuralSide}:${trace.scenarioId}`, orientation);
      }
    }
  }, [structuralSide, traces]);
  const comparisonTraces = React.useMemo(
    () =>
      Object.freeze(
        traces.flatMap((trace) => {
          const currentOrientation = structuralReturnOrientationFromPayloadV3(
            trace.analysis?.payload,
            structuralSide,
          );
          const historyOrientations = Object.freeze(
            trace.history.flatMap((historical) => {
              const candidate = structuralReturnOrientationFromPayloadV3(
                historical.payload,
                structuralSide,
              );
              return candidate === null ? [] : [candidate];
            }),
          );
          const retainedOrientation =
            trace.pending && currentOrientation === null
              ? (retainedOrientationByScenarioRef.current.get(
                  `${structuralSide}:${trace.scenarioId}`,
                ) ?? null)
              : null;
          const historyFallbackOrientation =
            trace.pending &&
            currentOrientation === null &&
            retainedOrientation === null
              ? (historyOrientations.at(-1) ?? null)
              : null;
          const orientation =
            currentOrientation ??
            retainedOrientation ??
            historyFallbackOrientation;
          if (orientation === null) return [];
          return [
            Object.freeze({
              scenarioId: trace.scenarioId,
              scenarioLabel: trace.scenarioLabel,
              color: trace.color,
              orientation,
              orientationAlpha: historyFallbackOrientation === null ? 1 : 0.34,
              pending: trace.pending,
              historyOrientations:
                historyFallbackOrientation === null
                  ? historyOrientations
                  : Object.freeze(historyOrientations.slice(0, -1)),
            }),
          ];
        }),
      ),
    [structuralSide, traces],
  );
  const pending = traces.some((trace) => trace.pending);
  const error = traces.find((trace) => trace.error !== null)?.error ?? null;
  return (
    <ExperimentGraphPresentationV3
      variant="pane"
      canvasClassName="relative h-full min-h-0 overflow-auto"
      data-analysis-error={error ?? undefined}
      data-analysis-pending={pending ? "true" : "false"}
    >
      <>
        {traces.length === 0 ? (
          <div className="flex h-full min-h-52 items-center justify-center text-xs text-wb-subtle">
            {t("workbench.live.scenarioHidden")}
          </div>
        ) : comparisonTraces.length === 0 ? (
          <div className="flex h-full min-h-52 items-center justify-center px-5 text-center text-xs text-wb-muted">
            {pending
              ? t("workbench.live.analysisRunning")
              : (error ??
                (acceptedStepAvailable
                  ? t("workbench.live.analysisUnavailable")
                  : t("workbench.live.firstAcceptedStep")))}
          </div>
        ) : (
          <GuytonStarlingComparisonCanvasV3
            recalculatingLabel={t("workbench.live.analysisRecalculating")}
            traces={comparisonTraces}
          />
        )}
        {traces.map(({ analysis, scenarioId }) =>
          analysis === undefined ? null : (
            <span
              key={scenarioId}
              className="sr-only"
              data-analysis-scenario-id={scenarioId}
              data-circulation-side={structuralSide}
              data-analysis-input-epoch={analysis.inputEpoch}
              data-analysis-boundary-status="current-input-epoch"
            >
              {analysis.sourceAcceptedRevision}@
              {analysis.sourceAcceptedTimeSec.toFixed(3)}
            </span>
          ),
        )}
      </>
    </ExperimentGraphPresentationV3>
  );
}
