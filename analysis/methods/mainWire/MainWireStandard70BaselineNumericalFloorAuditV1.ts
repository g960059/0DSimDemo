import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
  type MainWireIntegratedModelBaselineValidationCheckIdV1,
  type MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_NOMINAL_DT_SEC_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  assertMainWireBaselineNumericalFloorMetricV1,
  buildMainWireBaselineNumericalFloorMetricV1,
  type MainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
  evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
  type MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
  type MainWireStandard70BaselineCalibrationEvaluationV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";

export const MAIN_WIRE_STANDARD70_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID =
  "main-wire-standard70-baseline-numerical-floor-audit-v1" as const;

type RunLabelV1 =
  | "coldA"
  | "coldB"
  | "compatibleCheckpoint"
  | "fineCold";

type CompactEvaluationV1 = Readonly<{
  evaluatorId:
    typeof MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
  status: MainWireStandard70BaselineCalibrationEvaluationV1["status"];
  phase: string | null;
  requestIdentitySha256: string | null;
  exactModelIdentitySha256: string | null;
  constructionPolicyRevisionId: string | null;
  constructionPolicyIdentitySha256: string | null;
  initializationKind: string | null;
  nominalDtSec: number | null;
  wallTimeMs: number;
  completedCycleCount: number | null;
  classificationStatus: string | null;
  constructionGateStatus: string | null;
  objectiveGateStatus: string | null;
  safetySentinelStatus: string | null;
  failedObjectiveCheckIds: readonly string[];
  failedSafetySentinelCheckIds: readonly string[];
  measurementSha256: string | null;
  checkpointSha256: string | null;
  message: string | null;
}>;

export type MainWireStandard70BaselineNumericalFloorAuditV1 = Readonly<{
  auditId: typeof MAIN_WIRE_STANDARD70_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID;
  target: Readonly<{
    exactModelIdentity: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1;
    exactModelIdentitySha256: string;
    objectiveAnalysisMethodId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID;
    safetyAnalysisMethodId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID;
    evaluatorId:
      typeof MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
    constructionPolicyRevisionId: string;
    constructionPolicyIdentitySha256: string;
  }>;
  status: "completed" | "unresolved";
  coarseDtSec: number;
  fineDtSec: number;
  runs: Readonly<Record<RunLabelV1, CompactEvaluationV1>>;
  repeatDeterministic: boolean | null;
  safetyAdmissionPassed: boolean | null;
  metricFloors: readonly MainWireBaselineNumericalFloorMetricV1[];
  unresolvedRunLabels: readonly RunLabelV1[];
  safetyRejectedRunLabels: readonly RunLabelV1[];
  claim: Readonly<{
    comparisonKind: "difference-audit-not-convergence-order";
    objectiveChecksFloored: true;
    objectivePhysiologicalThresholdApplied: false;
    safetySentinelAdmissionRequired: true;
    safetySentinelNumericalFloorsClaimed: false;
    optimizerApplied: false;
    fineGridUsedAsDifferenceReference: true;
  }>;
}>;

/** Reject stale-model, incomplete, or safety-rejected Standard70 floor evidence. */
export function assertMainWireStandard70BaselineNumericalFloorAuditV1(
  value: unknown,
): asserts value is MainWireStandard70BaselineNumericalFloorAuditV1 {
  const audit = recordV1(value, "Standard70 numerical-floor artifact");
  if (
    audit.auditId !== MAIN_WIRE_STANDARD70_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID
    || audit.status !== "completed"
  ) {
    throw new Error(
      "Standard70 numerical-floor artifact is not completed V1 evidence",
    );
  }
  const target = recordV1(audit.target, "Standard70 numerical-floor target");
  if (
    canonicalJsonStringify(target.exactModelIdentity)
      !== canonicalJsonStringify(MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1)
    || target.objectiveAnalysisMethodId
      !== MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID
    || target.safetyAnalysisMethodId
      !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID
    || target.evaluatorId
      !== MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID
  ) {
    throw new Error("Standard70 numerical-floor target identity differs");
  }
  const exactModelIdentitySha256 = sha256StringV1(
    target.exactModelIdentitySha256,
    "Standard70 numerical-floor exact-model identity",
  );
  const expectedPolicyRevision = normalReferenceEvidenceV1.policyRevisions.at(-1)
    ?.revisionId;
  if (
    expectedPolicyRevision === undefined
    || target.constructionPolicyRevisionId !== expectedPolicyRevision
  ) {
    throw new Error("Standard70 numerical-floor construction policy differs");
  }
  const constructionPolicyIdentitySha256 = sha256StringV1(
    target.constructionPolicyIdentitySha256,
    "Standard70 numerical-floor construction-policy identity",
  );
  const coarseDtSec = positiveFiniteV1(
    audit.coarseDtSec,
    "Standard70 numerical-floor coarseDtSec",
  );
  const fineDtSec = positiveFiniteV1(
    audit.fineDtSec,
    "Standard70 numerical-floor fineDtSec",
  );
  if (fineDtSec !== coarseDtSec / 2) {
    throw new Error(
      "Standard70 numerical-floor fineDtSec must halve coarseDtSec",
    );
  }
  if (
    typeof audit.repeatDeterministic !== "boolean"
    || audit.safetyAdmissionPassed !== true
  ) {
    throw new Error(
      "completed Standard70 numerical-floor repeat and safety status must resolve",
    );
  }
  if (
    !emptyArrayV1(audit.unresolvedRunLabels)
    || !emptyArrayV1(audit.safetyRejectedRunLabels)
  ) {
    throw new Error(
      "completed Standard70 numerical-floor evidence has rejected runs",
    );
  }
  const runs = recordV1(audit.runs, "Standard70 numerical-floor runs");
  for (const [label, expectedDtSec, expectedInitialization] of [
    ["coldA", coarseDtSec, "cold"],
    ["coldB", coarseDtSec, "cold"],
    ["compatibleCheckpoint", coarseDtSec, "standard70-exact-checkpoint"],
    ["fineCold", fineDtSec, "cold"],
  ] as const) {
    const run = recordV1(runs[label], `Standard70 numerical-floor run ${label}`);
    if (
      run.evaluatorId !== MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID
      || run.status !== "accepted"
      || run.nominalDtSec !== expectedDtSec
      || run.initializationKind !== expectedInitialization
      || run.exactModelIdentitySha256 !== exactModelIdentitySha256
      || run.constructionPolicyRevisionId !== expectedPolicyRevision
      || run.constructionPolicyIdentitySha256
        !== constructionPolicyIdentitySha256
      || run.safetySentinelStatus !== "passed"
      || !emptyArrayV1(run.failedSafetySentinelCheckIds)
    ) {
      throw new Error(
        `Standard70 numerical-floor run ${label} differs from its declared contract`,
      );
    }
  }
  const claim = recordV1(audit.claim, "Standard70 numerical-floor claim");
  if (
    claim.comparisonKind !== "difference-audit-not-convergence-order"
    || claim.objectiveChecksFloored !== true
    || claim.objectivePhysiologicalThresholdApplied !== false
    || claim.safetySentinelAdmissionRequired !== true
    || claim.safetySentinelNumericalFloorsClaimed !== false
    || claim.optimizerApplied !== false
    || claim.fineGridUsedAsDifferenceReference !== true
  ) {
    throw new Error("Standard70 numerical-floor claim differs from V1");
  }
  if (!Array.isArray(audit.metricFloors)) {
    throw new Error("Standard70 numerical-floor metricFloors must be an array");
  }
  const expectedCheckIds = objectiveCheckIdsV1();
  if (
    new Set(expectedCheckIds).size !== expectedCheckIds.length
    || audit.metricFloors.length !== expectedCheckIds.length
  ) {
    throw new Error(
      "Standard70 numerical-floor metrics do not cover objective checks",
    );
  }
  const received = new Set<string>();
  audit.metricFloors.forEach((metric, index) => {
    assertMainWireBaselineNumericalFloorMetricV1(
      metric,
      `Standard70 numerical-floor metric ${index}`,
    );
    if (received.has(metric.checkId)) {
      throw new Error(
        `Standard70 numerical-floor metric is duplicated for ${metric.checkId}`,
      );
    }
    received.add(metric.checkId);
  });
  if (expectedCheckIds.some((checkId) => !received.has(checkId))) {
    throw new Error(
      "Standard70 numerical-floor metrics do not cover objective checks",
    );
  }
}

/** Recompute the asynchronous content identities after structural validation. */
export async function verifyMainWireStandard70BaselineNumericalFloorAuditV1(
  value: unknown,
): Promise<MainWireStandard70BaselineNumericalFloorAuditV1> {
  assertMainWireStandard70BaselineNumericalFloorAuditV1(value);
  const expectedModelIdentitySha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
  );
  const expectedPolicy =
    await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
  if (
    value.target.exactModelIdentitySha256 !== expectedModelIdentitySha256
    || value.target.constructionPolicyRevisionId
      !== expectedPolicy.constructionPolicyRevisionId
    || value.target.constructionPolicyIdentitySha256
      !== expectedPolicy.constructionPolicyIdentitySha256
  ) {
    throw new Error("Standard70 numerical-floor content identity differs");
  }
  return value;
}

/**
 * Runs cold repeat, exact-checkpoint repeat, and dt-halving comparisons against
 * the current Standard70 model. All inherited objective checks receive a
 * one-to-one floor record; zero-width event sentinels retain a null normalized
 * floor. The additional right-heart checks remain fail-closed admission gates
 * rather than being promoted into the current objective without evidence.
 */
export async function runMainWireStandard70BaselineNumericalFloorAuditV1(
  coarseDtSec: number =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_NOMINAL_DT_SEC_V1,
  onProgress?: (runLabel: RunLabelV1, phase: "started" | "completed") => void,
): Promise<MainWireStandard70BaselineNumericalFloorAuditV1> {
  if (!(coarseDtSec > 0) || !Number.isFinite(coarseDtSec)) {
    throw new Error(
      "Standard70 numerical-floor coarseDtSec must be positive and finite",
    );
  }
  const fineDtSec = coarseDtSec / 2;
  const constructionPolicy =
    await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();

  onProgress?.("coldA", "started");
  const coldA = await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
    nominalDtSec: coarseDtSec,
  });
  onProgress?.("coldA", "completed");
  onProgress?.("coldB", "started");
  const coldB = await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
    nominalDtSec: coarseDtSec,
  });
  onProgress?.("coldB", "completed");
  onProgress?.("compatibleCheckpoint", "started");
  const compatibleCheckpoint = coldA.status === "accepted"
    ? await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
        nominalDtSec: coarseDtSec,
        initialization: Object.freeze({
          kind: "standard70-exact-checkpoint" as const,
          checkpoint: coldA.exactResult.checkpoint,
        }),
      })
    : syntheticUnresolvedV1(
        "compatible checkpoint was not attempted because coldA failed",
      );
  onProgress?.("compatibleCheckpoint", "completed");
  onProgress?.("fineCold", "started");
  const fineCold =
    await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
      nominalDtSec: fineDtSec,
    });
  onProgress?.("fineCold", "completed");

  const evaluations = Object.freeze({
    coldA,
    coldB,
    compatibleCheckpoint,
    fineCold,
  });
  const entries = Object.entries(evaluations) as Array<[
    RunLabelV1,
    MainWireStandard70BaselineCalibrationEvaluationV1,
  ]>;
  const unresolvedRunLabels = entries
    .filter(([, evaluation]) => evaluation.status !== "accepted")
    .map(([label]) => label);
  const safetyRejectedRunLabels = entries
    .filter(([, evaluation]) =>
      evaluation.status === "accepted"
      && evaluation.safetySentinelStatus !== "passed")
    .map(([label]) => label);
  const allAccepted = unresolvedRunLabels.length === 0;
  const safetyAdmissionPassed = allAccepted
    ? safetyRejectedRunLabels.length === 0
    : null;
  const completed = allAccepted && safetyAdmissionPassed === true;
  const metricFloors = completed
    ? buildMetricFloorsV1(
        coldA as MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
        coldB as MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
        compatibleCheckpoint as
          MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
        fineCold as MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
      )
    : Object.freeze([]);
  const repeatDeterministic = coldA.status === "accepted"
      && coldB.status === "accepted"
    ? await acceptedResultDigestV1(coldA) === await acceptedResultDigestV1(coldB)
    : null;
  const exactModelIdentitySha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
  );
  const audit = Object.freeze({
    auditId: MAIN_WIRE_STANDARD70_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID,
    target: Object.freeze({
      exactModelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
      exactModelIdentitySha256,
      objectiveAnalysisMethodId:
        MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
      safetyAnalysisMethodId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
      evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
      constructionPolicyRevisionId:
        constructionPolicy.constructionPolicyRevisionId,
      constructionPolicyIdentitySha256:
        constructionPolicy.constructionPolicyIdentitySha256,
    }),
    status: completed ? "completed" as const : "unresolved" as const,
    coarseDtSec,
    fineDtSec,
    runs: Object.freeze({
      coldA: await compactEvaluationV1(coldA),
      coldB: await compactEvaluationV1(coldB),
      compatibleCheckpoint: await compactEvaluationV1(compatibleCheckpoint),
      fineCold: await compactEvaluationV1(fineCold),
    }),
    repeatDeterministic,
    safetyAdmissionPassed,
    metricFloors,
    unresolvedRunLabels: Object.freeze(unresolvedRunLabels),
    safetyRejectedRunLabels: Object.freeze(safetyRejectedRunLabels),
    claim: Object.freeze({
      comparisonKind: "difference-audit-not-convergence-order" as const,
      objectiveChecksFloored: true as const,
      objectivePhysiologicalThresholdApplied: false as const,
      safetySentinelAdmissionRequired: true as const,
      safetySentinelNumericalFloorsClaimed: false as const,
      optimizerApplied: false as const,
      fineGridUsedAsDifferenceReference: true as const,
    }),
  });
  if (audit.status === "completed") {
    await verifyMainWireStandard70BaselineNumericalFloorAuditV1(audit);
  }
  return audit;
}

function buildMetricFloorsV1(
  coldA: MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
  coldB: MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
  compatibleCheckpoint:
    MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
  fineCold: MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
): readonly MainWireBaselineNumericalFloorMetricV1[] {
  const coldBById = checkMapV1(coldB.objectiveChecks);
  const checkpointById = checkMapV1(compatibleCheckpoint.objectiveChecks);
  const fineById = checkMapV1(fineCold.objectiveChecks);
  return Object.freeze(coldA.objectiveChecks.map((check) =>
    buildMainWireBaselineNumericalFloorMetricV1(
      check,
      requiredCheckV1(coldBById, check.checkId),
      requiredCheckV1(checkpointById, check.checkId),
      requiredCheckV1(fineById, check.checkId),
    )));
}

function checkMapV1(
  checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[],
): ReadonlyMap<
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireIntegratedModelBaselineValidationCheckV1
> {
  return new Map(checks.map((check) => [check.checkId, check] as const));
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
    throw new Error(`Standard70 numerical-floor comparison is missing ${checkId}`);
  }
  return check;
}

async function acceptedResultDigestV1(
  evaluation: MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
): Promise<string> {
  return sha256CanonicalJsonHex({
    measurements: evaluation.exactResult.measurements,
    checks: evaluation.exactResult.checks,
    classification: evaluation.exactResult.classification,
    checkpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
  });
}

async function compactEvaluationV1(
  evaluation: MainWireStandard70BaselineCalibrationEvaluationV1,
): Promise<CompactEvaluationV1> {
  if (evaluation.status !== "accepted") {
    return Object.freeze({
      evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
      status: evaluation.status,
      phase: evaluation.phase,
      requestIdentitySha256: evaluation.requestIdentitySha256,
      exactModelIdentitySha256: null,
      constructionPolicyRevisionId: null,
      constructionPolicyIdentitySha256: null,
      initializationKind: null,
      nominalDtSec: null,
      wallTimeMs: evaluation.wallTimeMs,
      completedCycleCount: evaluation.partial?.completedCycleCount ?? null,
      classificationStatus: evaluation.partial?.classificationStatus ?? null,
      constructionGateStatus: null,
      objectiveGateStatus: null,
      safetySentinelStatus: null,
      failedObjectiveCheckIds: Object.freeze([]),
      failedSafetySentinelCheckIds: Object.freeze([]),
      measurementSha256: null,
      checkpointSha256: null,
      message: evaluation.message,
    });
  }
  return Object.freeze({
    evaluatorId: evaluation.evaluatorId,
    status: evaluation.status,
    phase: null,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    exactModelIdentitySha256: evaluation.exactModelIdentitySha256,
    constructionPolicyRevisionId: evaluation.constructionPolicyRevisionId,
    constructionPolicyIdentitySha256:
      evaluation.constructionPolicyIdentitySha256,
    initializationKind: evaluation.initializationKind,
    nominalDtSec: evaluation.nominalDtSec,
    wallTimeMs: evaluation.wallTimeMs,
    completedCycleCount: evaluation.exactResult.completedCycleCount,
    classificationStatus: evaluation.exactResult.classification.status,
    constructionGateStatus: evaluation.constructionGateStatus,
    objectiveGateStatus: evaluation.objectiveGateStatus,
    safetySentinelStatus: evaluation.safetySentinelStatus,
    failedObjectiveCheckIds: evaluation.failedObjectiveCheckIds,
    failedSafetySentinelCheckIds: evaluation.failedSafetySentinelCheckIds,
    measurementSha256: await sha256CanonicalJsonHex(
      evaluation.exactResult.measurements,
    ),
    checkpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
    message: null,
  });
}

function syntheticUnresolvedV1(
  message: string,
): MainWireStandard70BaselineCalibrationEvaluationV1 {
  return Object.freeze({
    evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    status: "operational-interrupted" as const,
    phase: "interruption" as const,
    requestIdentitySha256: null,
    wallTimeMs: 0,
    message,
    partial: null,
  });
}

function objectiveCheckIdsV1():
  readonly MainWireIntegratedModelBaselineValidationCheckIdV1[] {
  return normalReferenceEvidenceV1.checkGroups.flatMap(({ checkIds }) =>
    checkIds) as MainWireIntegratedModelBaselineValidationCheckIdV1[];
}

function recordV1(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function positiveFiniteV1(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}

function sha256StringV1(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a SHA-256 hex digest`);
  }
  return value;
}

function emptyArrayV1(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
