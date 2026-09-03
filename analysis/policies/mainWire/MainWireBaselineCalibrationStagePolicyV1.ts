import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  compileMainWireBaselineConditioningStudyV1,
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";

export const MAIN_WIRE_BASELINE_CALIBRATION_STAGE_POLICY_V1_ID =
  "main-wire-baseline-calibration-stage-policy-v1" as const;

export const MAIN_WIRE_BASELINE_CALIBRATION_STAGE_POLICY_V1 = Object.freeze({
  schemaVersion: 1 as const,
  policyId: MAIN_WIRE_BASELINE_CALIBRATION_STAGE_POLICY_V1_ID,
  sourceStudyId:
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.studyId,
  calibrationClaimScope: "systemic-and-left-heart-baseline" as const,
  stageOrder: Object.freeze([
    "model-form-qualification",
    "operating-point-identification-and-fit",
    "post-fit-envelope-requalification",
  ] as const),
  operatingPointIdentificationConditionIds: Object.freeze([
    "rest-hr60",
  ] as const),
  operatingPointIdentificationGroupIds: Object.freeze([
    "systemic-pressure",
    "pcwp-surrogate",
    "left-ventricular-indexed-size-function",
    "indexed-systemic-forward-flow",
  ] as const),
  qualificationOnlyGroupIds: Object.freeze([
    "settlement",
    "ventricular-pressure-morphology",
    "aortic-valve-gradient",
    "aortic-ejection-time",
    "left-ventricular-pressure-rate",
    "mitral-e-to-a",
    "left-ventricular-timing",
    "pulmonary-artery-pressure",
    "right-ventricular-indexed-size-function",
  ] as const),
  envelopeGateConditionIds: Object.freeze([
    "rest-hr60",
    "fixed-control-low-preload",
    "fixed-control-high-preload",
    "afterload-plus-10-percent",
    "rest-hr70",
  ] as const),
  localRankRowAdmission:
    "common-admitted-rest-operating-point-observations" as const,
  operatingPointConditionRationale:
    "Only the resting anchor has declared baseline target corridors; "
    + "load and rate perturbations retain condition-specific directional "
    + "or safety roles rather than becoming fitted target centres.",
  gateRetention:
    "all-source-gates-remain-mandatory-before-and-after-fit" as const,
  envelopeGateEvaluation:
    "condition-specific-source-constraint-role" as const,
  reportedToleranceCompositions: Object.freeze([
    "maximum-component-primary",
    "root-sum-square-components-stress-reference",
    "additive-components-stress-reference",
  ] as const),
  interpretation: Object.freeze({
    operatingPointGroupsArePermanentlyRobustOrSensitive: false as const,
    qualificationGroupsArePermanentlyNonfittable: false as const,
    localRankAutomaticallySelectsParameters: false as const,
    modelFormMismatchMayBeFitAway: false as const,
    rightHeartSafetySentinelsRemainMandatory: true as const,
  }),
});

export type MainWireBaselineCalibrationStagePolicyV1 =
  typeof MAIN_WIRE_BASELINE_CALIBRATION_STAGE_POLICY_V1;

export type CompiledMainWireBaselineCalibrationStagePolicyV1 = Readonly<{
  policyIdentitySha256: string;
  observationInventoryIdentitySha256: string;
  studyIdentitySha256: string;
  policy: MainWireBaselineCalibrationStagePolicyV1;
}>;

export async function compileMainWireBaselineCalibrationStagePolicyV1():
  Promise<CompiledMainWireBaselineCalibrationStagePolicyV1> {
  const study = await compileMainWireBaselineConditioningStudyV1();
  const policy = MAIN_WIRE_BASELINE_CALIBRATION_STAGE_POLICY_V1;
  const evidenceGroupIds = normalReferenceEvidenceV1.checkGroups.map(
    ({ groupId }) => groupId,
  );
  const observationInventory = Object.freeze(
    normalReferenceEvidenceV1.checkGroups.map(({ groupId, checkIds }) =>
      Object.freeze({
        groupId,
        checkIds: Object.freeze([...checkIds]),
      })),
  );
  const observationInventoryIdentitySha256 =
    await sha256CanonicalJsonHex(observationInventory);
  const roleGroupIds = [
    ...policy.operatingPointIdentificationGroupIds,
    ...policy.qualificationOnlyGroupIds,
  ];
  const roleGroupIdSet = new Set<string>(roleGroupIds);
  if (
    roleGroupIdSet.size !== roleGroupIds.length
    || roleGroupIds.length !== evidenceGroupIds.length
    || evidenceGroupIds.some((groupId) => !roleGroupIdSet.has(groupId))
  ) {
    throw new Error(
      "baseline calibration stage policy must partition evidence groups",
    );
  }
  const studyConditionIds = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .conditions.map(({ conditionId }) => conditionId);
  const envelopeGateConditionIds = new Set<string>(
    policy.envelopeGateConditionIds,
  );
  if (
    envelopeGateConditionIds.size
      !== policy.envelopeGateConditionIds.length
    || policy.envelopeGateConditionIds.length !== studyConditionIds.length
    || studyConditionIds.some((conditionId) =>
      !envelopeGateConditionIds.has(conditionId))
    || policy.operatingPointIdentificationConditionIds.some((conditionId) =>
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.conditions.find(
        (condition) => condition.conditionId === conditionId,
      )?.constraintRole !== "resting-construction-corridors")
  ) {
    throw new Error(
      "baseline calibration stage policy condition roles differ from study",
    );
  }
  return Object.freeze({
    policyIdentitySha256: await sha256CanonicalJsonHex(Object.freeze({
      studyIdentitySha256: study.studyIdentitySha256,
      observationInventoryIdentitySha256,
      policy,
    })),
    observationInventoryIdentitySha256,
    studyIdentitySha256: study.studyIdentitySha256,
    policy,
  });
}
