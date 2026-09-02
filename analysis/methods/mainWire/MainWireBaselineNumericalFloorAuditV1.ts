import { sha256CanonicalJsonHex } from "@/engine/integrity";
import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import {
  evaluateMainWireBaselineCalibrationCandidateV1,
  type MainWireBaselineCalibrationAcceptedEvaluationV1,
  type MainWireBaselineCalibrationEvaluationV1,
} from "@/analysis/methods/mainWire/MainWireBaselineCalibrationEvaluatorV1";

export const MAIN_WIRE_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID =
  "main-wire-baseline-numerical-floor-audit-v1" as const;

export type MainWireBaselineNumericalFloorComparisonKindV1 =
  | "cold-repeat"
  | "cold-versus-compatible-checkpoint"
  | "dt-halving";

export type MainWireBaselineNumericalFloorMetricV1 = Readonly<{
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  unit: string;
  constructionMinimum: number;
  constructionMaximum: number;
  constructionCorridorWidth: number;
  coldRepeatAbsoluteDifference: number;
  coldCheckpointAbsoluteDifference: number;
  dtHalvingAbsoluteDifference: number;
  numericalFloorAbsolute: number;
  numericalFloorFractionOfCorridor: number | null;
}>;

type CompactEvaluationV1 = Readonly<{
  status: MainWireBaselineCalibrationEvaluationV1["status"];
  phase?: string;
  requestIdentitySha256: string | null;
  initializationKind: string | null;
  nominalDtSec: number | null;
  wallTimeMs: number;
  completedCycleCount: number | null;
  classificationStatus: string | null;
  constructionGateStatus: string | null;
  failedConstructionCheckIds: readonly string[];
  measurementSha256: string | null;
  checkpointSha256: string | null;
  message: string | null;
}>;

export type MainWireBaselineNumericalFloorAuditV1 = Readonly<{
  auditId: typeof MAIN_WIRE_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID;
  status: "completed" | "unresolved";
  coarseDtSec: number;
  fineDtSec: number;
  runs: Readonly<{
    coldA: CompactEvaluationV1;
    coldB: CompactEvaluationV1;
    compatibleCheckpoint: CompactEvaluationV1;
    fineCold: CompactEvaluationV1;
  }>;
  repeatDeterministic: boolean | null;
  metricFloors: readonly MainWireBaselineNumericalFloorMetricV1[];
  unresolvedRunLabels: readonly string[];
  claim: Readonly<{
    comparisonKind: "difference-audit-not-convergence-order";
    physiologicalPassThresholdApplied: false;
    optimizerApplied: false;
    fineGridUsedAsDifferenceReference: true;
  }>;
}>;

/**
 * Executes the minimum pre-fitting resolution audit. Results are deliberately
 * threshold-free: the caller must compare the measured floor with the frozen
 * study corridors before deciding whether a coordinate is resolvable.
 */
export async function runMainWireBaselineNumericalFloorAuditV1(
  coarseDtSec: number =
    MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1,
  onProgress?: (
    runLabel: "coldA" | "coldB" | "compatibleCheckpoint" | "fineCold",
    phase: "started" | "completed",
  ) => void,
): Promise<MainWireBaselineNumericalFloorAuditV1> {
  if (!(coarseDtSec > 0) || !Number.isFinite(coarseDtSec)) {
    throw new Error("numerical-floor coarseDtSec must be positive and finite");
  }
  const fineDtSec = coarseDtSec / 2;
  onProgress?.("coldA", "started");
  const coldA = await evaluateMainWireBaselineCalibrationCandidateV1({
    nominalDtSec: coarseDtSec,
  });
  onProgress?.("coldA", "completed");
  onProgress?.("coldB", "started");
  const coldB = await evaluateMainWireBaselineCalibrationCandidateV1({
    nominalDtSec: coarseDtSec,
  });
  onProgress?.("coldB", "completed");
  onProgress?.("compatibleCheckpoint", "started");
  const compatibleCheckpoint = coldA.status === "accepted"
    ? await evaluateMainWireBaselineCalibrationCandidateV1({
        nominalDtSec: coarseDtSec,
        initialization: Object.freeze({
          kind: "standard68-exact-checkpoint" as const,
          checkpoint: coldA.exactResult.checkpoint,
        }),
      })
    : syntheticUnresolvedV1(
        "compatible checkpoint was not attempted because coldA failed",
      );
  onProgress?.("compatibleCheckpoint", "completed");
  onProgress?.("fineCold", "started");
  const fineCold = await evaluateMainWireBaselineCalibrationCandidateV1({
    nominalDtSec: fineDtSec,
  });
  onProgress?.("fineCold", "completed");
  const evaluations = Object.freeze({
    coldA,
    coldB,
    compatibleCheckpoint,
    fineCold,
  });
  const unresolvedRunLabels = Object.entries(evaluations)
    .filter(([, evaluation]) => evaluation.status !== "accepted")
    .map(([label]) => label);
  const allAccepted = unresolvedRunLabels.length === 0;
  const metricFloors = allAccepted
    ? buildMetricFloorsV1(
        coldA as MainWireBaselineCalibrationAcceptedEvaluationV1,
        coldB as MainWireBaselineCalibrationAcceptedEvaluationV1,
        compatibleCheckpoint as MainWireBaselineCalibrationAcceptedEvaluationV1,
        fineCold as MainWireBaselineCalibrationAcceptedEvaluationV1,
      )
    : Object.freeze([]);
  const repeatDeterministic = coldA.status === "accepted"
      && coldB.status === "accepted"
    ? await acceptedResultDigestV1(coldA) === await acceptedResultDigestV1(coldB)
    : null;

  return Object.freeze({
    auditId: MAIN_WIRE_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID,
    status: allAccepted ? "completed" as const : "unresolved" as const,
    coarseDtSec,
    fineDtSec,
    runs: Object.freeze({
      coldA: await compactEvaluationV1(coldA),
      coldB: await compactEvaluationV1(coldB),
      compatibleCheckpoint: await compactEvaluationV1(compatibleCheckpoint),
      fineCold: await compactEvaluationV1(fineCold),
    }),
    repeatDeterministic,
    metricFloors,
    unresolvedRunLabels: Object.freeze(unresolvedRunLabels),
    claim: Object.freeze({
      comparisonKind: "difference-audit-not-convergence-order" as const,
      physiologicalPassThresholdApplied: false as const,
      optimizerApplied: false as const,
      fineGridUsedAsDifferenceReference: true as const,
    }),
  });
}

export function buildMainWireBaselineNumericalFloorMetricV1(
  coldA: MainWireIntegratedModelBaselineValidationCheckV1,
  coldB: MainWireIntegratedModelBaselineValidationCheckV1,
  compatibleCheckpoint: MainWireIntegratedModelBaselineValidationCheckV1,
  fineCold: MainWireIntegratedModelBaselineValidationCheckV1,
): MainWireBaselineNumericalFloorMetricV1 {
  if (
    coldA.checkId !== coldB.checkId
    || coldA.checkId !== compatibleCheckpoint.checkId
    || coldA.checkId !== fineCold.checkId
    || coldA.unit !== coldB.unit
    || coldA.unit !== compatibleCheckpoint.unit
    || coldA.unit !== fineCold.unit
    || coldA.minimum !== coldB.minimum
    || coldA.minimum !== compatibleCheckpoint.minimum
    || coldA.minimum !== fineCold.minimum
    || coldA.maximum !== coldB.maximum
    || coldA.maximum !== compatibleCheckpoint.maximum
    || coldA.maximum !== fineCold.maximum
  ) {
    throw new Error("numerical-floor metric comparison requires one frozen check");
  }
  const coldRepeatAbsoluteDifference = Math.abs(coldA.actual - coldB.actual);
  const coldCheckpointAbsoluteDifference = Math.abs(
    coldA.actual - compatibleCheckpoint.actual,
  );
  const dtHalvingAbsoluteDifference = Math.abs(
    coldA.actual - fineCold.actual,
  );
  const numericalFloorAbsolute = Math.max(
    coldRepeatAbsoluteDifference,
    coldCheckpointAbsoluteDifference,
    dtHalvingAbsoluteDifference,
  );
  const constructionCorridorWidth = coldA.maximum - coldA.minimum;
  return Object.freeze({
    checkId: coldA.checkId,
    unit: coldA.unit,
    constructionMinimum: coldA.minimum,
    constructionMaximum: coldA.maximum,
    constructionCorridorWidth,
    coldRepeatAbsoluteDifference,
    coldCheckpointAbsoluteDifference,
    dtHalvingAbsoluteDifference,
    numericalFloorAbsolute,
    numericalFloorFractionOfCorridor: constructionCorridorWidth > 0
      ? numericalFloorAbsolute / constructionCorridorWidth
      : null,
  });
}

function buildMetricFloorsV1(
  coldA: MainWireBaselineCalibrationAcceptedEvaluationV1,
  coldB: MainWireBaselineCalibrationAcceptedEvaluationV1,
  compatibleCheckpoint: MainWireBaselineCalibrationAcceptedEvaluationV1,
  fineCold: MainWireBaselineCalibrationAcceptedEvaluationV1,
): readonly MainWireBaselineNumericalFloorMetricV1[] {
  const coldBById = checkMapV1(coldB);
  const checkpointById = checkMapV1(compatibleCheckpoint);
  const fineById = checkMapV1(fineCold);
  return Object.freeze(coldA.exactResult.checks.map((check) =>
    buildMainWireBaselineNumericalFloorMetricV1(
      check,
      requiredCheckV1(coldBById, check.checkId),
      requiredCheckV1(checkpointById, check.checkId),
      requiredCheckV1(fineById, check.checkId),
    )));
}

function checkMapV1(
  evaluation: MainWireBaselineCalibrationAcceptedEvaluationV1,
): ReadonlyMap<
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireIntegratedModelBaselineValidationCheckV1
> {
  return new Map(evaluation.exactResult.checks.map((check) =>
    [check.checkId, check] as const));
}

function requiredCheckV1(
  checks: ReadonlyMap<
    MainWireIntegratedModelBaselineValidationCheckIdV1,
    MainWireIntegratedModelBaselineValidationCheckV1
  >,
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  const check = checks.get(checkId);
  if (check === undefined) {
    throw new Error(`numerical-floor comparison is missing ${checkId}`);
  }
  return check;
}

async function acceptedResultDigestV1(
  evaluation: MainWireBaselineCalibrationAcceptedEvaluationV1,
): Promise<string> {
  return sha256CanonicalJsonHex({
    measurements: evaluation.exactResult.measurements,
    checks: evaluation.exactResult.checks,
    classification: evaluation.exactResult.classification,
    checkpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
  });
}

async function compactEvaluationV1(
  evaluation: MainWireBaselineCalibrationEvaluationV1,
): Promise<CompactEvaluationV1> {
  if (evaluation.status !== "accepted") {
    return Object.freeze({
      status: evaluation.status,
      phase: evaluation.phase,
      requestIdentitySha256: evaluation.requestIdentitySha256,
      initializationKind: null,
      nominalDtSec: null,
      wallTimeMs: evaluation.wallTimeMs,
      completedCycleCount: evaluation.partial?.completedCycleCount ?? null,
      classificationStatus: evaluation.partial?.classificationStatus ?? null,
      constructionGateStatus: null,
      failedConstructionCheckIds: Object.freeze([]),
      measurementSha256: null,
      checkpointSha256: null,
      message: evaluation.message,
    });
  }
  return Object.freeze({
    status: evaluation.status,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    initializationKind: evaluation.initializationKind,
    nominalDtSec: evaluation.nominalDtSec,
    wallTimeMs: evaluation.wallTimeMs,
    completedCycleCount: evaluation.exactResult.completedCycleCount,
    classificationStatus: evaluation.exactResult.classification.status,
    constructionGateStatus: evaluation.constructionGateStatus,
    failedConstructionCheckIds: evaluation.failedConstructionCheckIds,
    measurementSha256: await sha256CanonicalJsonHex(
      evaluation.exactResult.measurements,
    ),
    checkpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
    message: null,
  });
}

function syntheticUnresolvedV1(
  message: string,
): MainWireBaselineCalibrationEvaluationV1 {
  return Object.freeze({
    evaluatorId: "main-wire-baseline-calibration-evaluator-v1" as const,
    status: "operational-interrupted" as const,
    phase: "interruption" as const,
    requestIdentitySha256: null,
    wallTimeMs: 0,
    message,
    partial: null,
  });
}
