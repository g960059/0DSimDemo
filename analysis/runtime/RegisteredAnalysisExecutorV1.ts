import type { AnalysisExecutorV1 } from "@/analysis/contracts/AnalysisExecutionV1";
import { LEGACY_EXACT_ANALYSIS_EXECUTOR_V1 } from "./LegacyExactAnalysisExecutorV1";
import { MAIN_WIRE_PRESSURE_CROSSING_PV_ANALYSIS_V1_ID } from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import { resolveRegisteredAnalysisMethodsV1 } from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import { analysisCapabilityV1 } from "@/studio/contracts/v2/modelSurface";

/** Numerical imports are lazy and only enter a dedicated analysis Worker. */
export const REGISTERED_ANALYSIS_EXECUTOR_V1: AnalysisExecutorV1 = Object.freeze({
  async execute(input) {
    if (input.request.analysisId !== MAIN_WIRE_PRESSURE_CROSSING_PV_ANALYSIS_V1_ID)
      return LEGACY_EXACT_ANALYSIS_EXECUTOR_V1.execute(input);
    if (!input.source.surfaceRelease || !resolveRegisteredAnalysisMethodsV1(input.source.surfaceRelease).capabilities
      .includes(analysisCapabilityV1(input.request.analysisId))) throw new Error("Analysis method is not pinned by the selected Surface");
    const { executeMainWirePressureCrossingPvV1 } = await import("@/analysis/methods/mainWire/MainWirePressureCrossingExecutionV1");
    return executeMainWirePressureCrossingPvV1(input);
  },
});
