import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";

export type AnalysisExecutionRequestV1 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  analysisId: string;
  expectedInputEpoch: number;
  expectedAcceptedRevision: number;
  expectedAcceptedTimeSec: number;
  analysisPartition?: string;
  onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
}>;

/**
 * Compatibility capability retained for already-admitted exact artifacts.
 * New analysis executors must not assume it is the permanent analysis API.
 */
export type LegacyExactAnalysisExecutionPortV1 = Readonly<{
  request(
    input: AnalysisExecutionRequestV1,
  ): Promise<StudioSimulationAnalysisV2>;
}>;

/** Read-only accepted boundary made available to one analysis executor. */
export type AnalysisExecutionSourceV1 = Readonly<{
  acceptedFrame: StudioSimulationFrameV2;
  legacyExact: LegacyExactAnalysisExecutionPortV1 | null;
}>;

/** Analysis-owned execution boundary selected independently of an exact model. */
export type AnalysisExecutorV1 = Readonly<{
  execute(input: Readonly<{
    source: AnalysisExecutionSourceV1;
    request: AnalysisExecutionRequestV1;
  }>): Promise<StudioSimulationAnalysisV2>;
}>;
