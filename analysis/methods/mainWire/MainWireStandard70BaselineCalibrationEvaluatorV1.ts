import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
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
  type MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  evaluateMainWireIntegratedModelStandard70CandidateV1,
  MainWireIntegratedModelStandard70InitializationRejectedErrorV1,
  MainWireIntegratedModelStandard70ObservationUnavailableErrorV1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_NOMINAL_DT_SEC_V1,
  type MainWireIntegratedModelStandard70BaselineQualificationV1,
  type MainWireIntegratedModelStandard70CandidateInitializationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_POLICY_V1,
  type MainWireIntegratedModelStandard70RightHeartCheckIdV1,
  type MainWireIntegratedModelStandard70RightHeartCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  MAIN_WIRE_BASELINE_CALIBRATION_ALLOWED_HEART_RATES_BPM_V1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID =
  "main-wire-standard70-baseline-calibration-evaluator-v1" as const;

export type MainWireStandard70BaselineCalibrationEvaluationRequestV1 =
  Readonly<{
    hemodynamicResearchInputs?:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
    ventricularContractilityScale?: number;
    mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
    nominalDtSec?: number;
    initialization?: MainWireIntegratedModelStandard70CandidateInitializationV1;
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

export type MainWireStandard70BaselineCalibrationAcceptedEvaluationV1 =
  Readonly<{
    evaluatorId:
      typeof MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
    status: "accepted";
    requestIdentitySha256: string;
    exactModelIdentitySha256: string;
    objectiveAnalysisMethodId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID;
    safetyAnalysisMethodId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID;
    constructionPolicyRevisionId: string;
    constructionPolicyIdentitySha256: string;
    initializationKind:
      MainWireIntegratedModelStandard70CandidateInitializationV1["kind"];
    nominalDtSec: number;
    wallTimeMs: number;
    constructionGateStatus: "passed" | "failed";
    objectiveGateStatus: "passed" | "failed";
    safetySentinelStatus: "passed" | "failed";
    failedConstructionCheckIds: readonly (
      | MainWireIntegratedModelBaselineValidationCheckIdV1
      | MainWireIntegratedModelStandard70RightHeartCheckIdV1
    )[];
    failedObjectiveCheckIds:
      readonly MainWireIntegratedModelBaselineValidationCheckIdV1[];
    failedSafetySentinelCheckIds:
      readonly MainWireIntegratedModelStandard70RightHeartCheckIdV1[];
    objectiveChecks: readonly MainWireIntegratedModelBaselineValidationCheckV1[];
    safetySentinelChecks:
      readonly MainWireIntegratedModelStandard70RightHeartCheckV1[];
    exactResult: MainWireIntegratedModelStandard70BaselineQualificationV1;
  }>;

export type MainWireStandard70BaselineCalibrationFailedEvaluationV1 =
  Readonly<{
    evaluatorId:
      typeof MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
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

export type MainWireStandard70BaselineCalibrationEvaluationV1 =
  | MainWireStandard70BaselineCalibrationAcceptedEvaluationV1
  | MainWireStandard70BaselineCalibrationFailedEvaluationV1;

export type MainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1 =
  Readonly<{
    constructionPolicyRevisionId: string;
    constructionPolicyIdentitySha256: string;
  }>;

export async function buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1():
  Promise<MainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1> {
  const constructionPolicyRevisionId =
    normalReferenceEvidenceV1.policyRevisions.at(-1)?.revisionId;
  if (constructionPolicyRevisionId === undefined) {
    throw new Error("normal-reference evidence registry has no policy revision");
  }
  return Object.freeze({
    constructionPolicyRevisionId,
    constructionPolicyIdentitySha256: await sha256CanonicalJsonHex({
      constructionPolicyRevisionId,
      objectiveCheckGroups: normalReferenceEvidenceV1.checkGroups,
      standard70SafetyAnalysisMethodId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
      standard70RightHeartCheckIds:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1,
      standard70RightHeartPolicy:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_POLICY_V1,
    }),
  });
}

/**
 * Analysis-owned fail-closed adapter for the current Standard70 exact model.
 * The historical normal-reference checks remain objective observations while
 * the Standard70 right-heart checks remain mandatory safety sentinels. A
 * valid simulation may fail either gate set; such a result is still returned
 * as accepted so search cannot confuse a rejected construction with a solver
 * or settlement failure.
 */
export async function evaluateMainWireStandard70BaselineCalibrationCandidateV1(
  request: MainWireStandard70BaselineCalibrationEvaluationRequestV1 = {},
): Promise<MainWireStandard70BaselineCalibrationEvaluationV1> {
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
  let ventricularContractilityScale: number;
  let mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
  let nominalDtSec: number;
  let initialization = request.initialization
    ?? Object.freeze({ kind: "cold" as const });
  try {
    hemodynamicResearchInputs = validatedHemodynamicsV1(
      request.hemodynamicResearchInputs
        ?? MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
      "candidate",
    );
    ventricularContractilityScale = validatedContractilityV1(
      request.ventricularContractilityScale ?? 1,
      "candidate",
    );
    mechanismResearchInputs =
      validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
        request.mechanismResearchInputs
          ?? MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
      );
    nominalDtSec = request.nominalDtSec
      ?? MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_NOMINAL_DT_SEC_V1;
    if (!(nominalDtSec > 0) || !Number.isFinite(nominalDtSec)) {
      throw new Error("Standard70 baseline calibration dt must be positive finite");
    }
    if (
      initialization.kind === "standard68-construction-continuation"
      || initialization.kind === "standard70-parameter-continuation"
    ) {
      initialization = Object.freeze({
        ...initialization,
        sourceHemodynamicResearchInputs: validatedHemodynamicsV1(
          initialization.sourceHemodynamicResearchInputs,
          "continuation source",
        ),
        sourceVentricularContractilityScale: validatedContractilityV1(
          initialization.sourceVentricularContractilityScale,
          "continuation source",
        ),
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

  let constructionPolicy:
    MainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1;
  try {
    constructionPolicy =
      await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
  } catch (error) {
    return failureV1(
      "invalid-or-physical",
      "request-validation",
      null,
      startedAt,
      errorMessageV1(error),
    );
  }
  const requestIdentitySha256 = await sha256CanonicalJsonHex({
    evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    exactModelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
    objectiveAnalysisMethodId:
      MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
    safetyAnalysisMethodId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
    constructionPolicyIdentitySha256:
      constructionPolicy.constructionPolicyIdentitySha256,
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    mechanismResearchInputs,
    nominalDtSec,
    initialization: initializationIdentityV1(initialization),
  });

  let exactResult: MainWireIntegratedModelStandard70BaselineQualificationV1;
  try {
    exactResult = await evaluateMainWireIntegratedModelStandard70CandidateV1({
      hemodynamicResearchInputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
      nominalDtSec,
      initialization,
    });
  } catch (error) {
    if (
      error instanceof
        MainWireIntegratedModelStandard70InitializationRejectedErrorV1
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
      error instanceof
        MainWireIntegratedModelStandard70ObservationUnavailableErrorV1
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

  let partition: ReturnType<typeof partitionChecksV1>;
  try {
    partition = partitionChecksV1(exactResult.checks);
  } catch (error) {
    return failureV1(
      "nonsettled-or-event-change",
      "observation",
      requestIdentitySha256,
      startedAt,
      errorMessageV1(error),
      exactResult,
    );
  }
  const failedObjectiveCheckIds = partition.objectiveChecks
    .filter(({ status }) => status === "failed")
    .map(({ checkId }) => checkId);
  const failedSafetySentinelCheckIds = partition.safetySentinelChecks
    .filter(({ status }) => status === "failed")
    .map(({ checkId }) => checkId);
  const failedConstructionCheckIds = Object.freeze([
    ...failedObjectiveCheckIds,
    ...failedSafetySentinelCheckIds,
  ]);
  return Object.freeze({
    evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    status: "accepted" as const,
    requestIdentitySha256,
    exactModelIdentitySha256: await sha256CanonicalJsonHex(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
    ),
    objectiveAnalysisMethodId:
      MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
    safetyAnalysisMethodId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
    constructionPolicyRevisionId:
      constructionPolicy.constructionPolicyRevisionId,
    constructionPolicyIdentitySha256:
      constructionPolicy.constructionPolicyIdentitySha256,
    initializationKind: initialization.kind,
    nominalDtSec,
    wallTimeMs: nowMsV1() - startedAt,
    constructionGateStatus: failedConstructionCheckIds.length === 0
      ? "passed" as const
      : "failed" as const,
    objectiveGateStatus: failedObjectiveCheckIds.length === 0
      ? "passed" as const
      : "failed" as const,
    safetySentinelStatus: failedSafetySentinelCheckIds.length === 0
      ? "passed" as const
      : "failed" as const,
    failedConstructionCheckIds,
    failedObjectiveCheckIds: Object.freeze(failedObjectiveCheckIds),
    failedSafetySentinelCheckIds:
      Object.freeze(failedSafetySentinelCheckIds),
    objectiveChecks: partition.objectiveChecks,
    safetySentinelChecks: partition.safetySentinelChecks,
    exactResult,
  });
}

function partitionChecksV1(
  checks: MainWireIntegratedModelStandard70BaselineQualificationV1["checks"],
): Readonly<{
  objectiveChecks: readonly MainWireIntegratedModelBaselineValidationCheckV1[];
  safetySentinelChecks:
    readonly MainWireIntegratedModelStandard70RightHeartCheckV1[];
}> {
  const objectiveIds = normalReferenceEvidenceV1.checkGroups.flatMap(
    ({ checkIds }) => checkIds,
  );
  const safetyIds = [
    ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1,
  ];
  const allIds = [...objectiveIds, ...safetyIds];
  const receivedIds = checks.map(({ checkId }) => checkId);
  const receivedIdSet = new Set<string>(receivedIds);
  if (
    new Set(allIds).size !== allIds.length
    || new Set(receivedIds).size !== receivedIds.length
    || receivedIds.length !== allIds.length
    || allIds.some((checkId) => !receivedIdSet.has(checkId))
  ) {
    throw new Error("Standard70 calibration check coverage differs");
  }
  const objectiveSet = new Set<string>(objectiveIds);
  const safetySet = new Set<string>(safetyIds);
  return Object.freeze({
    objectiveChecks: Object.freeze(checks.filter(({ checkId }) =>
      objectiveSet.has(checkId)) as MainWireIntegratedModelBaselineValidationCheckV1[]),
    safetySentinelChecks: Object.freeze(checks.filter(({ checkId }) =>
      safetySet.has(checkId)) as MainWireIntegratedModelStandard70RightHeartCheckV1[]),
  });
}

function validatedHemodynamicsV1(
  value: MainWireIntegratedModelHemodynamicResearchInputsV3,
  label: string,
): MainWireIntegratedModelHemodynamicResearchInputsV3 {
  const validated =
    validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(value);
  if (!MAIN_WIRE_BASELINE_CALIBRATION_ALLOWED_HEART_RATES_BPM_V1.includes(
    validated.heartRateBpm as 60 | 70,
  )) {
    throw new Error(`${label} heartRateBpm must be 60 or 70`);
  }
  return validated;
}

function validatedContractilityV1(value: number, label: string): number {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${label} contractility must be positive finite`);
  }
  return value;
}

function failureV1(
  status: FailureStatusV1,
  phase: FailurePhaseV1,
  requestIdentitySha256: string | null,
  startedAt: number,
  message: string,
  partialResult?: MainWireIntegratedModelStandard70BaselineQualificationV1,
): MainWireStandard70BaselineCalibrationFailedEvaluationV1 {
  return Object.freeze({
    evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
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

function initializationIdentityV1(
  initialization: MainWireIntegratedModelStandard70CandidateInitializationV1,
) {
  if (initialization.kind === "cold") return initialization;
  if (initialization.kind === "standard70-exact-checkpoint") {
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

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isAbortedV1(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

function nowMsV1(): number {
  return globalThis.performance?.now() ?? Date.now();
}
