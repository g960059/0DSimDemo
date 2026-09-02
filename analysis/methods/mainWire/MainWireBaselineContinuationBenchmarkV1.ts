import type {
  MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import type {
  MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type {
  MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import {
  evaluateMainWireBaselineCalibrationCandidateV1,
  type MainWireBaselineCalibrationAcceptedEvaluationV1,
  type MainWireBaselineCalibrationEvaluationV1,
} from "@/analysis/methods/mainWire/MainWireBaselineCalibrationEvaluatorV1";

export const MAIN_WIRE_BASELINE_CONTINUATION_BENCHMARK_V1_ID =
  "main-wire-baseline-continuation-benchmark-v1" as const;

export type MainWireBaselineContinuationDifferenceV1 = Readonly<{
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  unit: string;
  absoluteDifference: number;
  constructionCorridorWidth: number;
  fractionOfConstructionCorridor: number | null;
}>;

export type MainWireBaselineContinuationEvaluationSummaryV1 = Readonly<{
  status: MainWireBaselineCalibrationEvaluationV1["status"];
  phase: string | null;
  requestIdentitySha256: string | null;
  wallTimeMs: number;
  completedCycleCount: number | null;
  constructionGateStatus: string | null;
  failedConstructionCheckIds: readonly string[];
  message: string | null;
}>;

export type MainWireBaselineContinuationBenchmarkV1 = Readonly<{
  benchmarkId: typeof MAIN_WIRE_BASELINE_CONTINUATION_BENCHMARK_V1_ID;
  status: "completed" | "unresolved";
  sourceCheckpointSha256: string;
  targetHemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3;
  continuation: MainWireBaselineContinuationEvaluationSummaryV1;
  cold: MainWireBaselineContinuationEvaluationSummaryV1;
  speedupRatio: number | null;
  completedCycleReduction: number | null;
  differences: readonly MainWireBaselineContinuationDifferenceV1[];
  maximumFractionOfConstructionCorridor: number | null;
  claim: Readonly<{
    benchmarkOnly: true;
    equivalenceThresholdApplied: false;
    physiologicalPassThresholdApplied: false;
  }>;
}>;

/** One measured neighbor comparison admits continuation performance; it does
 * not establish global equivalence or authorize parameter-distance reuse. */
export async function benchmarkMainWireBaselineContinuationV1(input: Readonly<{
  sourceCheckpoint: MainWireIntegratedModelStandard68CheckpointV1;
  targetHemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3;
  targetVentricularContractilityScale?: number;
  targetMechanismResearchInputs?:
    MainWireIntegratedModelMechanismResearchInputsV3;
  nominalDtSec?: number;
  onProgress?: (
    runLabel: "continuation" | "cold",
    phase: "started" | "completed",
  ) => void;
}>): Promise<MainWireBaselineContinuationBenchmarkV1> {
  const targetVentricularContractilityScale =
    input.targetVentricularContractilityScale ?? 1;
  const targetMechanismResearchInputs = input.targetMechanismResearchInputs
    ?? MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1;
  input.onProgress?.("continuation", "started");
  const continuation = await evaluateMainWireBaselineCalibrationCandidateV1({
    hemodynamicResearchInputs: input.targetHemodynamicResearchInputs,
    ventricularContractilityScale: targetVentricularContractilityScale,
    mechanismResearchInputs: targetMechanismResearchInputs,
    nominalDtSec: input.nominalDtSec,
    initialization: Object.freeze({
      kind: "standard68-parameter-continuation" as const,
      sourceCheckpoint: input.sourceCheckpoint,
      sourceHemodynamicResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
      sourceVentricularContractilityScale: 1,
      sourceMechanismResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
    }),
  });
  input.onProgress?.("continuation", "completed");
  input.onProgress?.("cold", "started");
  const cold = await evaluateMainWireBaselineCalibrationCandidateV1({
    hemodynamicResearchInputs: input.targetHemodynamicResearchInputs,
    ventricularContractilityScale: targetVentricularContractilityScale,
    mechanismResearchInputs: targetMechanismResearchInputs,
    nominalDtSec: input.nominalDtSec,
  });
  input.onProgress?.("cold", "completed");
  const completed = continuation.status === "accepted"
    && cold.status === "accepted";
  const differences = completed
    ? compareChecksV1(continuation, cold)
    : Object.freeze([]);
  const finiteFractions = differences
    .map(({ fractionOfConstructionCorridor }) =>
      fractionOfConstructionCorridor)
    .filter((value): value is number => value !== null);
  return Object.freeze({
    benchmarkId: MAIN_WIRE_BASELINE_CONTINUATION_BENCHMARK_V1_ID,
    status: completed ? "completed" as const : "unresolved" as const,
    sourceCheckpointSha256: input.sourceCheckpoint.checkpointSha256,
    targetHemodynamicResearchInputs: input.targetHemodynamicResearchInputs,
    continuation: summarizeEvaluationV1(continuation),
    cold: summarizeEvaluationV1(cold),
    speedupRatio: completed
      ? cold.wallTimeMs / continuation.wallTimeMs
      : null,
    completedCycleReduction: completed
      ? cold.exactResult.completedCycleCount
        - continuation.exactResult.completedCycleCount
      : null,
    differences,
    maximumFractionOfConstructionCorridor: finiteFractions.length === 0
      ? null
      : Math.max(...finiteFractions),
    claim: Object.freeze({
      benchmarkOnly: true as const,
      equivalenceThresholdApplied: false as const,
      physiologicalPassThresholdApplied: false as const,
    }),
  });
}

function compareChecksV1(
  continuation: MainWireBaselineCalibrationAcceptedEvaluationV1,
  cold: MainWireBaselineCalibrationAcceptedEvaluationV1,
): readonly MainWireBaselineContinuationDifferenceV1[] {
  const continuationById = new Map(continuation.exactResult.checks.map(
    (check) => [check.checkId, check] as const,
  ));
  return Object.freeze(cold.exactResult.checks.map((coldCheck) => {
    const continuationCheck = continuationById.get(coldCheck.checkId);
    if (continuationCheck === undefined) {
      throw new Error(`continuation benchmark is missing ${coldCheck.checkId}`);
    }
    assertSameCheckContractV1(continuationCheck, coldCheck);
    const absoluteDifference = Math.abs(
      continuationCheck.actual - coldCheck.actual,
    );
    const constructionCorridorWidth = coldCheck.maximum - coldCheck.minimum;
    return Object.freeze({
      checkId: coldCheck.checkId,
      unit: coldCheck.unit,
      absoluteDifference,
      constructionCorridorWidth,
      fractionOfConstructionCorridor: constructionCorridorWidth > 0
        ? absoluteDifference / constructionCorridorWidth
        : null,
    });
  }));
}

function assertSameCheckContractV1(
  left: MainWireIntegratedModelBaselineValidationCheckV1,
  right: MainWireIntegratedModelBaselineValidationCheckV1,
): void {
  if (
    left.checkId !== right.checkId
    || left.unit !== right.unit
    || left.minimum !== right.minimum
    || left.maximum !== right.maximum
  ) {
    throw new Error("continuation benchmark requires one frozen check contract");
  }
}

function summarizeEvaluationV1(
  evaluation: MainWireBaselineCalibrationEvaluationV1,
): MainWireBaselineContinuationEvaluationSummaryV1 {
  if (evaluation.status !== "accepted") {
    return Object.freeze({
      status: evaluation.status,
      phase: evaluation.phase,
      requestIdentitySha256: evaluation.requestIdentitySha256,
      wallTimeMs: evaluation.wallTimeMs,
      completedCycleCount: evaluation.partial?.completedCycleCount ?? null,
      constructionGateStatus: null,
      failedConstructionCheckIds: Object.freeze([]),
      message: evaluation.message,
    });
  }
  return Object.freeze({
    status: evaluation.status,
    phase: null,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    wallTimeMs: evaluation.wallTimeMs,
    completedCycleCount: evaluation.exactResult.completedCycleCount,
    constructionGateStatus: evaluation.constructionGateStatus,
    failedConstructionCheckIds: evaluation.failedConstructionCheckIds,
    message: null,
  });
}
