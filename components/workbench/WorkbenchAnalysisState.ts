import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID } from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import { structuralReturnOrientationFromPayloadV3 } from "@/components/workbench/v3/GuytonStarlingOrientationCanvasV3";

const EMPTY_WORKBENCH_GRAPH_HISTORY_V3 = Object.freeze([] as never[]);

export function shouldAutoRequestStructuralReturnComparisonV3({
  acceptedStepAvailable,
  currentRequestKey,
  lastAutoRequestedKey,
  operationPending,
}: Readonly<{
  acceptedStepAvailable: boolean;
  currentRequestKey: string | null;
  lastAutoRequestedKey: string | null;
  operationPending: boolean;
}>): boolean {
  return (
    acceptedStepAvailable &&
    currentRequestKey !== null &&
    lastAutoRequestedKey !== currentRequestKey &&
    !operationPending
  );
}

export function structuralReturnComparisonRequestKeyV3(
  analysisId: string,
  scenarioIds: readonly string[],
): string | null {
  return scenarioIds.length === 0
    ? null
    : JSON.stringify([analysisId, ...scenarioIds]);
}

export function workbenchAnalysisHistoryKeyV3(
  scenarioId: string,
  analysisId: string,
): string {
  return JSON.stringify([scenarioId, analysisId]);
}

/**
 * Rebinds immutable analysis payloads when an exact Scenario is duplicated.
 * The result remains runtime-only presentation/analysis state; it never enters
 * a Snapshot qualification decision or a durable Experiment capture.
 */
export function cloneWorkbenchScenarioAnalysesV3(
  current: Readonly<Record<string, StudioSimulationAnalysisV2>>,
  sourceScenarioId: string,
  targetFrame: StudioSimulationFrameV2,
): Readonly<Record<string, StudioSimulationAnalysisV2>> {
  const sourceAnalyses = Object.values(current).filter(
    ({ scenarioId }) => scenarioId === sourceScenarioId,
  );
  if (sourceAnalyses.length === 0) return current;
  const cloned = sourceAnalyses.map((analysis) => {
    const targetAnalysis = cloneWorkbenchAnalysisForScenarioV3(
      analysis,
      targetFrame,
    );
    return Object.freeze([
      workbenchAnalysisHistoryKeyV3(
        targetFrame.scenarioId,
        analysis.analysisId,
      ),
      targetAnalysis,
    ] as const);
  });
  return Object.freeze({
    ...current,
    ...Object.fromEntries(cloned),
  });
}

export function cloneWorkbenchAnalysisForScenarioV3(
  analysis: StudioSimulationAnalysisV2,
  targetFrame: StudioSimulationFrameV2,
): StudioSimulationAnalysisV2 {
  return Object.freeze({
    ...analysis,
    modelId: targetFrame.modelId,
    runtimeSessionId: targetFrame.runtimeSessionId,
    scenarioId: targetFrame.scenarioId,
    inputEpoch: targetFrame.inputEpoch,
    // Preserve the original analysis source clock: the relation was already
    // accepted for this unchanged parameter target, but was not recomputed at
    // the duplicate's current accepted revision. The presentation contract
    // treats validated payloads as immutable, so sharing one does not share
    // mutable numerical Scenario state.
    payload: analysis.payload,
  }) satisfies StudioSimulationAnalysisV2;
}

export function invalidateWorkbenchScenarioAnalysisEquivalenceV3(
  sourceByTarget: Map<string, string>,
  changedScenarioIds: ReadonlySet<string>,
): void {
  for (const [targetScenarioId, sourceScenarioId] of sourceByTarget) {
    if (
      changedScenarioIds.has(targetScenarioId) ||
      changedScenarioIds.has(sourceScenarioId)
    ) {
      sourceByTarget.delete(targetScenarioId);
    }
  }
}

export function workbenchAnalysisMatchesFrameEpochV3(
  analysis: StudioSimulationAnalysisV2,
  frame: StudioSimulationFrameV2 | null,
): boolean {
  return (
    frame !== null &&
    analysis.modelId === frame.modelId &&
    analysis.runtimeSessionId === frame.runtimeSessionId &&
    analysis.scenarioId === frame.scenarioId &&
    analysis.inputEpoch === frame.inputEpoch
  );
}

export function workbenchStructuralAnalysisRenderableV3(
  analysis: StudioSimulationAnalysisV2,
): boolean {
  return (["right", "left"] as const).every(
    (side) =>
      structuralReturnOrientationFromPayloadV3(analysis.payload, side) !== null,
  );
}

export function workbenchStructuralHistoryAnalysisIdsV3(
  surface: ExperimentSurfaceV2 | null,
  contract: ModelContractV2 | null,
): readonly string[] {
  if (surface === null || contract === null) return Object.freeze([]);
  const analysisIds = new Set<string>();
  for (const pane of surface.graphPanes) {
    if ((pane.historyDepth ?? 0) <= 0) continue;
    const graph = contract.graphCatalog.find(
      ({ graphId }) => graphId === pane.graphId,
    );
    if (
      graph?.renderer === "structural-return" ||
      graph?.renderer === "pressure-volume"
    ) {
      analysisIds.add(
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
      );
    }
  }
  return Object.freeze([...analysisIds]);
}

export function workbenchBoundedGraphHistoryV3<T>(
  history: readonly T[],
  depth: number,
): readonly T[] {
  if (!Number.isSafeInteger(depth) || depth <= 0) {
    return EMPTY_WORKBENCH_GRAPH_HISTORY_V3;
  }
  const boundedDepth = Math.min(3, depth);
  return history.length <= boundedDepth
    ? history
    : Object.freeze(history.slice(-boundedDepth));
}

export function archiveWorkbenchAnalysesV3(
  current: Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>>,
  analyses: readonly StudioSimulationAnalysisV2[],
): Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>> {
  if (analyses.length === 0) return current;
  const next: Record<string, readonly StudioSimulationAnalysisV2[]> = {
    ...current,
  };
  for (const analysis of analyses) {
    const key = workbenchAnalysisHistoryKeyV3(
      analysis.scenarioId,
      analysis.analysisId,
    );
    const previous = next[key] ?? [];
    const withoutSameEpoch = previous.filter(
      (candidate) => candidate.inputEpoch !== analysis.inputEpoch,
    );
    next[key] = Object.freeze([...withoutSameEpoch, analysis].slice(-3));
  }
  return Object.freeze(next);
}

export function withoutWorkbenchScenarioAnalysisHistoryV3(
  current: Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>>,
  scenarioId: string,
): Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>> {
  let changed = false;
  const retained: Record<string, readonly StudioSimulationAnalysisV2[]> = {};
  for (const [key, history] of Object.entries(current)) {
    if (history.some((analysis) => analysis.scenarioId === scenarioId)) {
      changed = true;
    } else {
      retained[key] = history;
    }
  }
  return changed ? Object.freeze(retained) : current;
}

export function withoutWorkbenchScenarioAnalysesV3(
  current: Readonly<Record<string, StudioSimulationAnalysisV2>>,
  scenarioId: string,
): Readonly<Record<string, StudioSimulationAnalysisV2>> {
  return filterWorkbenchAnalysesByScenarioIdsV3(
    current,
    new Set(
      Object.values(current)
        .map((analysis) => analysis.scenarioId)
        .filter((candidate) => candidate !== scenarioId),
    ),
  );
}

export function filterWorkbenchAnalysesByScenarioIdsV3(
  current: Readonly<Record<string, StudioSimulationAnalysisV2>>,
  retainedScenarioIds: ReadonlySet<string>,
): Readonly<Record<string, StudioSimulationAnalysisV2>> {
  const retained = Object.fromEntries(
    Object.entries(current).filter(([, analysis]) =>
      retainedScenarioIds.has(analysis.scenarioId),
    ),
  );
  return Object.keys(retained).length === Object.keys(current).length
    ? current
    : Object.freeze(retained);
}

export function filterWorkbenchAnalysisHistoryByScenarioIdsV3(
  current: Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>>,
  retainedScenarioIds: ReadonlySet<string>,
): Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>> {
  const retained = Object.fromEntries(
    Object.entries(current).filter(
      ([, history]) =>
        history.length === 0 || retainedScenarioIds.has(history[0]!.scenarioId),
    ),
  );
  return Object.keys(retained).length === Object.keys(current).length
    ? current
    : Object.freeze(retained);
}

export function withoutWorkbenchScenarioAnalysisErrorsV3(
  current: Readonly<Record<string, string>>,
  scenarioId: string,
): Readonly<Record<string, string>> {
  return filterWorkbenchAnalysisErrorsByScenarioIdsV3(
    current,
    new Set(
      Object.keys(current)
        .map(workbenchScenarioIdFromAnalysisKeyV3)
        .filter(
          (candidate): candidate is string =>
            candidate !== null && candidate !== scenarioId,
        ),
    ),
  );
}

export function filterWorkbenchAnalysisErrorsByScenarioIdsV3(
  current: Readonly<Record<string, string>>,
  retainedScenarioIds: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  const retained = Object.fromEntries(
    Object.entries(current).filter(([key]) => {
      const scenarioId = workbenchScenarioIdFromAnalysisKeyV3(key);
      return scenarioId !== null && retainedScenarioIds.has(scenarioId);
    }),
  );
  return Object.keys(retained).length === Object.keys(current).length
    ? current
    : Object.freeze(retained);
}

export function workbenchScenarioIdFromAnalysisKeyV3(
  key: string,
): string | null {
  try {
    const parsed: unknown = JSON.parse(key);
    return Array.isArray(parsed) && typeof parsed[0] === "string"
      ? parsed[0]
      : null;
  } catch {
    return null;
  }
}
