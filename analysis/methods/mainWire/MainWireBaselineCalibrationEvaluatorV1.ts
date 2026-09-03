import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_IDENTITY_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
  type MainWireIntegratedModelBaselineValidationCheckIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  evaluateMainWireIntegratedModelRoundedEjectionCandidateV1,
  MainWireIntegratedModelRoundedEjectionInitializationRejectedErrorV1,
  MainWireIntegratedModelRoundedEjectionObservationUnavailableErrorV1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1,
  type MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
  type MainWireIntegratedModelRoundedEjectionCandidateInitializationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import {
  MAIN_WIRE_BASELINE_CALIBRATION_ALLOWED_HEART_RATES_BPM_V1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_BASELINE_CALIBRATION_EVALUATOR_V1_ID =
  "main-wire-baseline-calibration-evaluator-v1" as const;

export type MainWireBaselineCalibrationEvaluationRequestV1 = Readonly<{
  hemodynamicResearchInputs?:
    MainWireIntegratedModelHemodynamicResearchInputsV3;
  ventricularContractilityScale?: number;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
  nominalDtSec?: number;
  initialization?: MainWireIntegratedModelRoundedEjectionCandidateInitializationV1;
  abortSignal?: AbortSignal;
}>;

type FailureStatusV1 =
  | "invalid-or-physical"
  | "numerical-unresolved"
  | "nonsettled-or-event-change"
  | "operational-interrupted";

type FailurePhaseV1 =
  | "request-validation"
  | "initialization"
  | "exact-execution"
  | "observation"
  | "periodic-classification"
  | "interruption";

export type MainWireBaselineCalibrationAcceptedEvaluationV1 = Readonly<{
  evaluatorId: typeof MAIN_WIRE_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
  status: "accepted";
  requestIdentitySha256: string;
  exactModelIdentitySha256: string;
  analysisMethodId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID;
  constructionPolicyRevisionId: string;
  initializationKind:
    MainWireIntegratedModelRoundedEjectionCandidateInitializationV1["kind"];
  nominalDtSec: number;
  wallTimeMs: number;
  constructionGateStatus: "passed" | "failed";
  failedConstructionCheckIds:
    readonly MainWireIntegratedModelBaselineValidationCheckIdV1[];
  exactResult: MainWireIntegratedModelRoundedEjectionBaselineQualificationV1;
}>;

export type MainWireBaselineCalibrationFailedEvaluationV1 = Readonly<{
  evaluatorId: typeof MAIN_WIRE_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
  status: FailureStatusV1;
  phase: FailurePhaseV1;
  requestIdentitySha256: string | null;
  wallTimeMs: number;
  message: string;
  partial: Readonly<{
    completedCycleCount: number;
    classificationStatus: string;
  }> | null;
}>;

export type MainWireBaselineCalibrationEvaluationV1 =
  | MainWireBaselineCalibrationAcceptedEvaluationV1
  | MainWireBaselineCalibrationFailedEvaluationV1;

/**
 * Analysis-owned fail-closed adapter around the exact Standard68 candidate
 * runner. Construction-gate failure remains a valid accepted simulation;
 * invalid, unresolved, nonsettled, and interrupted outcomes remain distinct.
 */
export async function evaluateMainWireBaselineCalibrationCandidateV1(
  request: MainWireBaselineCalibrationEvaluationRequestV1 = {},
): Promise<MainWireBaselineCalibrationEvaluationV1> {
  const startedAt = nowMsV1();
  if (isAbortedV1(request.abortSignal)) {
    return failureV1(
      "operational-interrupted",
      "interruption",
      null,
      startedAt,
      "evaluation was interrupted before exact execution",
    );
  }

  let hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3;
  let mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
  let ventricularContractilityScale: number;
  let nominalDtSec: number;
  let initialization: MainWireIntegratedModelRoundedEjectionCandidateInitializationV1 =
    request.initialization
    ?? Object.freeze({ kind: "cold" as const });
  try {
    hemodynamicResearchInputs =
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
        request.hemodynamicResearchInputs
          ?? MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
      );
    if (!MAIN_WIRE_BASELINE_CALIBRATION_ALLOWED_HEART_RATES_BPM_V1.includes(
      hemodynamicResearchInputs.heartRateBpm as 60 | 70,
    )) {
      throw new Error("baseline calibration heartRateBpm must be 60 or 70");
    }
    mechanismResearchInputs =
      validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
        request.mechanismResearchInputs
          ?? MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
      );
    ventricularContractilityScale =
      request.ventricularContractilityScale ?? 1;
    if (
      !(ventricularContractilityScale > 0)
      || !Number.isFinite(ventricularContractilityScale)
    ) {
      throw new Error(
        "baseline calibration ventricularContractilityScale must be positive and finite",
      );
    }
    nominalDtSec = request.nominalDtSec
      ?? MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1;
    if (!(nominalDtSec > 0) || !Number.isFinite(nominalDtSec)) {
      throw new Error(
        "baseline calibration nominalDtSec must be positive and finite",
      );
    }
    if (initialization.kind === "standard68-parameter-continuation") {
      const sourceHemodynamicResearchInputs =
        validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
          initialization.sourceHemodynamicResearchInputs,
        );
      if (!MAIN_WIRE_BASELINE_CALIBRATION_ALLOWED_HEART_RATES_BPM_V1.includes(
        sourceHemodynamicResearchInputs.heartRateBpm as 60 | 70,
      )) {
        throw new Error(
          "baseline calibration continuation source heartRateBpm must be 60 or 70",
        );
      }
      if (
        !(initialization.sourceVentricularContractilityScale > 0)
        || !Number.isFinite(
          initialization.sourceVentricularContractilityScale,
        )
      ) {
        throw new Error(
          "baseline calibration continuation source contractility must be positive and finite",
        );
      }
      initialization = Object.freeze({
        kind: initialization.kind,
        sourceCheckpoint: initialization.sourceCheckpoint,
        sourceHemodynamicResearchInputs,
        sourceVentricularContractilityScale:
          initialization.sourceVentricularContractilityScale,
        sourceMechanismResearchInputs:
          validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
            initialization.sourceMechanismResearchInputs,
          ),
      });
    }
  } catch (error) {
    return failureV1(
      "invalid-or-physical",
      "request-validation",
      null,
      startedAt,
      errorMessageV1(error),
    );
  }

  const constructionPolicyRevisionId =
    normalReferenceEvidenceV1.policyRevisions.at(-1)?.revisionId;
  if (constructionPolicyRevisionId === undefined) {
    return failureV1(
      "invalid-or-physical",
      "request-validation",
      null,
      startedAt,
      "normal-reference evidence registry has no policy revision",
    );
  }
  const requestIdentitySha256 = await sha256CanonicalJsonHex({
    evaluatorId: MAIN_WIRE_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    exactModelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_IDENTITY_V1,
    analysisMethodId: MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
    constructionPolicyRevisionId,
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    mechanismResearchInputs,
    nominalDtSec,
    initialization: calibrationInitializationIdentityV1(initialization),
  });

  let exactResult: MainWireIntegratedModelRoundedEjectionBaselineQualificationV1;
  try {
    exactResult =
      await evaluateMainWireIntegratedModelRoundedEjectionCandidateV1({
        hemodynamicResearchInputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
        nominalDtSec,
        initialization,
      });
  } catch (error) {
    if (
      error
        instanceof MainWireIntegratedModelRoundedEjectionInitializationRejectedErrorV1
    ) {
      return failureV1(
        "invalid-or-physical",
        "initialization",
        requestIdentitySha256,
        startedAt,
        error.message,
      );
    }
    if (
      error
        instanceof MainWireIntegratedModelRoundedEjectionObservationUnavailableErrorV1
    ) {
      return failureV1(
        "nonsettled-or-event-change",
        "observation",
        requestIdentitySha256,
        startedAt,
        error.message,
      );
    }
    return failureV1(
      "numerical-unresolved",
      "exact-execution",
      requestIdentitySha256,
      startedAt,
      errorMessageV1(error),
    );
  }

  if (isAbortedV1(request.abortSignal)) {
    return failureV1(
      "operational-interrupted",
      "interruption",
      requestIdentitySha256,
      startedAt,
      "evaluation was interrupted after exact execution",
      exactResult,
    );
  }
  if (exactResult.classification.status !== "period1-converged") {
    return failureV1(
      "nonsettled-or-event-change",
      "periodic-classification",
      requestIdentitySha256,
      startedAt,
      `candidate ended with ${exactResult.classification.status}`,
      exactResult,
    );
  }

  const failedConstructionCheckIds = exactResult.checks
    .filter(({ status }) => status === "failed")
    .map(({ checkId }) => checkId);
  return Object.freeze({
    evaluatorId: MAIN_WIRE_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    status: "accepted" as const,
    requestIdentitySha256,
    exactModelIdentitySha256: await sha256CanonicalJsonHex(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_IDENTITY_V1,
    ),
    analysisMethodId: MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
    constructionPolicyRevisionId,
    initializationKind: initialization.kind,
    nominalDtSec,
    wallTimeMs: nowMsV1() - startedAt,
    constructionGateStatus: failedConstructionCheckIds.length === 0
      ? "passed" as const
      : "failed" as const,
    failedConstructionCheckIds: Object.freeze(failedConstructionCheckIds),
    exactResult,
  });
}

function failureV1(
  status: FailureStatusV1,
  phase: FailurePhaseV1,
  requestIdentitySha256: string | null,
  startedAt: number,
  message: string,
  partialResult?: MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
): MainWireBaselineCalibrationFailedEvaluationV1 {
  return Object.freeze({
    evaluatorId: MAIN_WIRE_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    status,
    phase,
    requestIdentitySha256,
    wallTimeMs: nowMsV1() - startedAt,
    message,
    partial: partialResult === undefined
      ? null
      : Object.freeze({
          completedCycleCount: partialResult.completedCycleCount,
          classificationStatus: partialResult.classification.status,
        }),
  });
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function nowMsV1(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function isAbortedV1(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

function calibrationInitializationIdentityV1(
  initialization: MainWireIntegratedModelRoundedEjectionCandidateInitializationV1,
) {
  if (initialization.kind === "cold") return initialization;
  if (initialization.kind === "standard68-exact-checkpoint") {
    return Object.freeze({
      kind: initialization.kind,
      checkpointSha256: initialization.checkpoint.checkpointSha256,
    });
  }
  return Object.freeze({
    kind: initialization.kind,
    sourceCheckpointSha256:
      initialization.sourceCheckpoint.checkpointSha256,
    sourceHemodynamicResearchInputs:
      initialization.sourceHemodynamicResearchInputs,
    sourceVentricularContractilityScale:
      initialization.sourceVentricularContractilityScale,
    sourceMechanismResearchInputs:
      initialization.sourceMechanismResearchInputs,
  });
}
