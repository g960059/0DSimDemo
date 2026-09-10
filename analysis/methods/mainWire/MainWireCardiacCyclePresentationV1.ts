import type { StudioSimulationAnalysisV2, StudioSimulationFrameV2, StudioSimulationOutputValueV2 } from "@/studio/contracts/v2/simulation";
import { MAIN_WIRE_CARDIAC_CYCLE_ANALYSIS_OUTPUT_IDS_V1, MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID } from "./MainWireCardiacCycleMetricsV1";
import { MAIN_WIRE_FILLING_FLOW_ANALYSIS_OUTPUT_IDS_V1, MAIN_WIRE_FILLING_FLOW_METHOD_V1_ID } from "./MainWireFillingFlowMetricsV1";

const outputIds = new Set<string>(MAIN_WIRE_CARDIAC_CYCLE_ANALYSIS_OUTPUT_IDS_V1);
const fillingIds = new Set<string>(MAIN_WIRE_FILLING_FLOW_ANALYSIS_OUTPUT_IDS_V1);

/** Read an ephemeral analysis result, without inserting derived fields into an exact frame. */
export function mainWireCardiacCycleOutputValueV1(
  analyses: readonly StudioSimulationAnalysisV2[] | undefined,
  frame: StudioSimulationFrameV2 | null,
  outputId: string,
): StudioSimulationOutputValueV2 | undefined {
  if (!outputIds.has(outputId)) return undefined;
  return readOutput(analyses, frame, outputId, MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID);
}

export function mainWireFillingFlowOutputValueV1(
  analyses: readonly StudioSimulationAnalysisV2[] | undefined,
  frame: StudioSimulationFrameV2 | null,
  outputId: string,
): StudioSimulationOutputValueV2 | undefined {
  if (!fillingIds.has(outputId)) return undefined;
  return readOutput(analyses, frame, outputId, MAIN_WIRE_FILLING_FLOW_METHOD_V1_ID);
}

function readOutput(analyses: readonly StudioSimulationAnalysisV2[] | undefined,
  frame: StudioSimulationFrameV2 | null, outputId: string, methodId: string): StudioSimulationOutputValueV2 {
  const analysis = frame === null ? undefined : analyses?.find(candidate =>
    candidate.analysisId === methodId
    && candidate.modelId === frame.modelId && candidate.runtimeSessionId === frame.runtimeSessionId
    && candidate.scenarioId === frame.scenarioId && candidate.inputEpoch === frame.inputEpoch
    && candidate.sourceAcceptedRevision <= frame.acceptedRevision
    && candidate.sourceAcceptedTimeSec <= frame.acceptedTimeSec);
  const payload = analysis?.payload;
  const values = payload && typeof payload === "object" && !Array.isArray(payload)
    && "methodId" in payload && payload.methodId === methodId
    && "status" in payload && payload.status === "available" && "values" in payload ? payload.values : undefined;
  const candidate = values && typeof values === "object" && !Array.isArray(values)
    ? values[outputId] : null;
  const value = typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
  return Object.freeze({ outputId, value,
    availability: value === null ? "not-evaluated-at-accepted-state" : "available",
    quality: value === null ? "not-assessed" : "accepted-derived" });
}
