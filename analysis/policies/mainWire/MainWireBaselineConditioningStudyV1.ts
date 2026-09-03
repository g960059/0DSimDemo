import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import {
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonValue,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_IDENTITY_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_POLICY_V1_ID,
  MAIN_WIRE_BASELINE_CALIBRATION_PARAMETERS_V1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_BASELINE_CONDITIONING_STUDY_V1_ID =
  "main-wire-baseline-conditioning-study-v1" as const;
export const MAIN_WIRE_BASELINE_CONDITIONING_STUDY_COMPILER_V1_ID =
  "main-wire-baseline-conditioning-study-compiler-v1" as const;

export type MainWireBaselineConditioningConditionV1 = Readonly<{
  conditionId: string;
  heartRateBpm: 60 | 70;
  totalBloodVolumeMultiplier: number;
  systemicResistanceMultiplier: number;
  role:
    | "rest-anchor"
    | "preload-identification"
    | "afterload-identification"
    | "rate-safety";
  constraintRole:
    | "resting-construction-corridors"
    | "fixed-control-directional-response"
    | "perturbation-safety-only";
}>;

export type MainWireBaselineConditioningPositiveControlV1 = Readonly<{
  controlId: string;
  coordinateId: MainWireBaselineCalibrationParameterIdV1;
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  expectedCentralSensitivitySign: -1 | 1;
  rationale: string;
}>;

export type MainWireBaselineConditioningStudySourceV1 = Readonly<{
  schemaVersion: 1;
  studyId: typeof MAIN_WIRE_BASELINE_CONDITIONING_STUDY_V1_ID;
  studyMode: "practical-conditioning";
  exactModelIdentity: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_IDENTITY_V1;
  evidenceRegistryId: string;
  constructionPolicyRevisionId: string;
  parameterPolicyId:
    typeof MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_POLICY_V1_ID;
  primaryCoordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
  negativeControlCoordinateIds:
    readonly MainWireBaselineCalibrationParameterIdV1[];
  diagnosticCoordinateIds:
    readonly MainWireBaselineCalibrationParameterIdV1[];
  sourceLockedFamilies: readonly string[];
  conditions: readonly MainWireBaselineConditioningConditionV1[];
  observationGroupIds: readonly string[];
  positiveControls: readonly MainWireBaselineConditioningPositiveControlV1[];
  numericalPolicy: Readonly<{
    explorationNominalDtSec: number;
    finalistRefinedDtSec: number;
    derivativeInitialization: "common-verified-anchor-continuation";
    searchInitialization: "common-verified-stage-center-continuation";
    rateConditionInitialization:
      "cold-center-then-common-center-continuation";
    finalistInitializationChecks:
      readonly ["cold", "alternate-compatible", "refined-dt"];
    finalistComparisonCorridorFraction: 0.02;
    finalistComparisonToleranceComposition:
      "additive-numerical-floor-and-corridor";
    maximumParallelEvaluations: number;
    recordWallTimeAndCycleCount: true;
  }>;
  conditioningPolicy: Readonly<{
    finiteDifferenceScheme: "central-transformed-step-with-halving";
    nearestNeighbourContinuationForDerivatives: false;
    spectrumRowAdmission: "complete-and-step-sign-stable";
    practicalRankToleranceComposition:
      "maximum-of-machine-and-observed-step-halving-frobenius";
    reportSingularSpectrum: true;
    reportAlternativeSubsets: true;
    maximumAdmittedCoordinateCount: 5;
  }>;
  objectivePolicy: Readonly<{
    baselineConditionId: "rest-hr60";
    preloadResponseConditionIds:
      readonly ["fixed-control-low-preload", "fixed-control-high-preload"];
    safetyConditionIds:
      readonly ["afterload-plus-10-percent", "rest-hr70"];
    safetyCheckIds:
      readonly MainWireIntegratedModelBaselineValidationCheckIdV1[];
    primaryInteriorGroupIds: readonly string[];
    intervalObjective: "maximize-worst-normalized-interior-margin";
    numericalFloorRole: "separate-scale-and-finalist-dt-check";
  }>;
  searchPolicy: Readonly<{
    coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
    initialDesign: "deterministic-halton-in-transformed-trust-region";
    initialCandidateCountIncludingReference: 24;
    haltonSkip: 13;
    transformedDomainHalfSpanFraction: 0.1;
    refinementCandidateCountIncludingCenter: 16;
    refinementContraction: 0.5;
    finalistCount: 4;
    equivalentPrimaryMarginEpsilon: 0.02;
    equivalentWorstMarginEpsilon: 0.02;
    numericalFloorBufferMultiples: 1;
    paretoSegmentFractions: readonly [0, 0.25, 0.5, 0.75, 1];
    coordinateProfileStepMultipliers: readonly [0, 1, 2, 3, 4];
    releaseLatticeNeighbourDirections: readonly [-1, 1];
    preloadReserveRecovery: Readonly<{
      maximumOperatingTotalBloodVolumeMl: number;
      refinementContraction: 0.125;
      minimumSeedPrimaryBufferedInteriorMargin: 0;
      allowedSeedFailureGroupIds: readonly [
        "systemic-pressure",
        "indexed-systemic-forward-flow",
      ];
    }>;
  }>;
  claimPolicy: Readonly<{
    evidenceRole: "construction";
    primaryScope: "systemic-and-left-heart-baseline";
    rightHeartRole: "safety-sentinel";
    pulmonaryWaveformValidationClaimed: false;
    finalConfirmationStatus: "unavailable";
    uniqueParameterVectorClaimed: false;
  }>;
  protocolRevision: Readonly<{
    revision: 14;
    changeReason: string;
  }>;
}>;

const currentPolicyRevision = normalReferenceEvidenceV1.policyRevisions.at(-1);
if (currentPolicyRevision === undefined) {
  throw new Error("baseline conditioning requires a construction-policy revision");
}

export const MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1:
  MainWireBaselineConditioningStudySourceV1 = Object.freeze({
    schemaVersion: 1 as const,
    studyId: MAIN_WIRE_BASELINE_CONDITIONING_STUDY_V1_ID,
    studyMode: "practical-conditioning" as const,
    exactModelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_IDENTITY_V1,
    evidenceRegistryId: normalReferenceEvidenceV1.registryId,
    constructionPolicyRevisionId: currentPolicyRevision.revisionId,
    parameterPolicyId:
      MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_POLICY_V1_ID,
    primaryCoordinateIds: Object.freeze([
      "hemodynamics.total-blood-volume-ml",
      "hemodynamics.systemic-resistance",
      "hemodynamics.arterial-stiffness",
      "myocardium.common-ventricular-active-tension-scale",
      "myocardium.common-ventricular-passive-stiffness-scale",
    ] as const),
    negativeControlCoordinateIds: Object.freeze([
      "hemodynamics.total-blood-volume-ml",
      "hemodynamics.venous-tone",
    ] as const),
    diagnosticCoordinateIds: Object.freeze([]),
    sourceLockedFamilies: Object.freeze([
      "matched-alpha-calcium-source",
      "rounded-ejection-land-kinetic-family",
    ]),
    conditions: Object.freeze([
      conditionV1(
        "rest-hr60",
        60,
        1,
        1,
        "rest-anchor",
        "resting-construction-corridors",
      ),
      conditionV1(
        "fixed-control-low-preload",
        60,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1
          .hypovolemicGlobalTbvScale,
        1,
        "preload-identification",
        "fixed-control-directional-response",
      ),
      conditionV1(
        "fixed-control-high-preload",
        60,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1
          .hypervolemicGlobalTbvScale,
        1,
        "preload-identification",
        "fixed-control-directional-response",
      ),
      conditionV1(
        "afterload-plus-10-percent",
        60,
        1,
        1.1,
        "afterload-identification",
        "perturbation-safety-only",
      ),
      conditionV1(
        "rest-hr70",
        70,
        1,
        1,
        "rate-safety",
        "perturbation-safety-only",
      ),
    ]),
    observationGroupIds: Object.freeze(
      normalReferenceEvidenceV1.checkGroups.map(({ groupId }) => groupId),
    ),
    positiveControls: Object.freeze([
      Object.freeze({
        controlId: "common-active-tension-increases-lv-maximum-dpdt",
        coordinateId:
          "myocardium.common-ventricular-active-tension-scale" as const,
        checkId: "left-ventricle.maximum-dpdt" as const,
        expectedCentralSensitivitySign: 1 as const,
        rationale:
          "A common ventricular active-tension increase must retain a positive local LV pressure-rise-rate response at the resting anchor.",
      }),
    ]),
    numericalPolicy: Object.freeze({
      explorationNominalDtSec: 0.002,
      finalistRefinedDtSec: 0.001,
      derivativeInitialization:
        "common-verified-anchor-continuation" as const,
      searchInitialization:
        "common-verified-stage-center-continuation" as const,
      rateConditionInitialization:
        "cold-center-then-common-center-continuation" as const,
      finalistInitializationChecks: Object.freeze([
        "cold",
        "alternate-compatible",
        "refined-dt",
      ] as const),
      finalistComparisonCorridorFraction: 0.02 as const,
      finalistComparisonToleranceComposition:
        "additive-numerical-floor-and-corridor" as const,
      maximumParallelEvaluations: 8,
      recordWallTimeAndCycleCount: true as const,
    }),
    conditioningPolicy: Object.freeze({
      finiteDifferenceScheme: "central-transformed-step-with-halving" as const,
      nearestNeighbourContinuationForDerivatives: false as const,
      spectrumRowAdmission: "complete-and-step-sign-stable" as const,
      practicalRankToleranceComposition:
        "maximum-of-machine-and-observed-step-halving-frobenius" as const,
      reportSingularSpectrum: true as const,
      reportAlternativeSubsets: true as const,
      maximumAdmittedCoordinateCount: 5 as const,
    }),
    objectivePolicy: Object.freeze({
      baselineConditionId: "rest-hr60" as const,
      preloadResponseConditionIds: Object.freeze([
        "fixed-control-low-preload",
        "fixed-control-high-preload",
      ] as const),
      safetyConditionIds: Object.freeze([
        "afterload-plus-10-percent",
        "rest-hr70",
      ] as const),
      safetyCheckIds: Object.freeze([
        "settlement.period1",
        "waveform.LVP.single-peak-no-ringing",
        "waveform.LVP.rounded-not-plateau",
        "waveform.RVP.single-peak-no-ringing",
        "waveform.RVP.rounded-not-plateau",
      ] as const),
      primaryInteriorGroupIds: Object.freeze([
        "ventricular-pressure-morphology",
        "aortic-valve-gradient",
        "aortic-ejection-time",
        "left-ventricular-pressure-rate",
        "mitral-e-to-a",
        "left-ventricular-timing",
      ] as const),
      intervalObjective:
        "maximize-worst-normalized-interior-margin" as const,
      numericalFloorRole: "separate-scale-and-finalist-dt-check" as const,
    }),
    searchPolicy: Object.freeze({
      coordinateIds: Object.freeze([
        "hemodynamics.total-blood-volume-ml",
        "hemodynamics.systemic-resistance",
        "hemodynamics.arterial-stiffness",
        "myocardium.common-ventricular-active-tension-scale",
        "myocardium.common-ventricular-passive-stiffness-scale",
      ] as const),
      initialDesign:
        "deterministic-halton-in-transformed-trust-region" as const,
      initialCandidateCountIncludingReference: 24 as const,
      haltonSkip: 13 as const,
      transformedDomainHalfSpanFraction: 0.1 as const,
      refinementCandidateCountIncludingCenter: 16 as const,
      refinementContraction: 0.5 as const,
      finalistCount: 4 as const,
      equivalentPrimaryMarginEpsilon: 0.02 as const,
      equivalentWorstMarginEpsilon: 0.02 as const,
      numericalFloorBufferMultiples: 1 as const,
      paretoSegmentFractions: Object.freeze([
        0,
        0.25,
        0.5,
        0.75,
        1,
      ] as const),
      coordinateProfileStepMultipliers: Object.freeze([
        0,
        1,
        2,
        3,
        4,
      ] as const),
      releaseLatticeNeighbourDirections: Object.freeze([-1, 1] as const),
      preloadReserveRecovery: Object.freeze({
        maximumOperatingTotalBloodVolumeMl:
          MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1
            .totalBloodVolumeMl,
        refinementContraction: 0.125 as const,
        minimumSeedPrimaryBufferedInteriorMargin: 0 as const,
        allowedSeedFailureGroupIds: Object.freeze([
          "systemic-pressure",
          "indexed-systemic-forward-flow",
        ] as const),
      }),
    }),
    claimPolicy: Object.freeze({
      evidenceRole: "construction" as const,
      primaryScope: "systemic-and-left-heart-baseline" as const,
      rightHeartRole: "safety-sentinel" as const,
      pulmonaryWaveformValidationClaimed: false as const,
      finalConfirmationStatus: "unavailable" as const,
      uniqueParameterVectorClaimed: false as const,
    }),
    protocolRevision: Object.freeze({
      revision: 14 as const,
      changeReason:
        "Exclude incomplete or step-sign-unstable Jacobian rows and separate machine rank from an observed step-halving practical rank diagnostic.",
    }),
  });

export type MainWireBaselineConditioningStudyLintIssueV1 = Readonly<{
  code:
    | "unregistered-parameter"
    | "duplicate-coordinate"
    | "primary-role-mismatch"
    | "diagnostic-role-mismatch"
    | "confounded-primary-coordinates"
    | "preload-owner-count"
    | "condition-invalid"
    | "condition-duplicate"
    | "observation-group-unresolved"
    | "positive-control-invalid"
    | "objective-policy-invalid"
    | "search-policy-invalid"
    | "policy-revision-stale"
    | "numerical-policy-invalid"
    | "claim-scope-invalid"
    | "source-lock-missing";
  path: string;
  message: string;
}>;

export type CompiledMainWireBaselineConditioningStudyV1 = Readonly<{
  compilerId: typeof MAIN_WIRE_BASELINE_CONDITIONING_STUDY_COMPILER_V1_ID;
  studyIdentitySha256: string;
  canonicalStudy: Readonly<CanonicalJsonValue>;
}>;

export function lintMainWireBaselineConditioningStudyV1(
  source: MainWireBaselineConditioningStudySourceV1,
): readonly MainWireBaselineConditioningStudyLintIssueV1[] {
  const issues: MainWireBaselineConditioningStudyLintIssueV1[] = [];
  const parameterById = new Map(MAIN_WIRE_BASELINE_CALIBRATION_PARAMETERS_V1
    .map((parameter) => [parameter.parameterId, parameter] as const));
  const totalBloodVolumeParameter = parameterById.get(
    "hemodynamics.total-blood-volume-ml",
  );
  const coordinateGroups = [
    ["primaryCoordinateIds", source.primaryCoordinateIds],
    ["negativeControlCoordinateIds", source.negativeControlCoordinateIds],
    ["diagnosticCoordinateIds", source.diagnosticCoordinateIds],
  ] as const;
  for (const [path, ids] of coordinateGroups) {
    const seen = new Set<string>();
    for (const parameterId of ids) {
      if (seen.has(parameterId)) {
        issues.push(issueV1(
          "duplicate-coordinate",
          path,
          `${parameterId} is duplicated`,
        ));
      }
      seen.add(parameterId);
      if (!parameterById.has(parameterId)) {
        issues.push(issueV1(
          "unregistered-parameter",
          path,
          `${parameterId} is not in the parameter policy`,
        ));
      }
    }
  }
  for (const parameterId of source.primaryCoordinateIds) {
    const parameter = parameterById.get(parameterId);
    if (parameter !== undefined
        && parameter.role !== "candidate-shared-phenotype") {
      issues.push(issueV1(
        "primary-role-mismatch",
        "primaryCoordinateIds",
        `${parameterId} is ${parameter.role}`,
      ));
    }
  }
  for (const parameterId of source.diagnosticCoordinateIds) {
    const parameter = parameterById.get(parameterId);
    if (parameter !== undefined && parameter.role !== "diagnostic-only") {
      issues.push(issueV1(
        "diagnostic-role-mismatch",
        "diagnosticCoordinateIds",
        `${parameterId} is ${parameter.role}`,
      ));
    }
  }
  const primaryConfounds = new Map<string, string>();
  for (const parameterId of source.primaryCoordinateIds) {
    for (const confoundGroupId of
      parameterById.get(parameterId)?.confoundGroupIds ?? []) {
      const previous = primaryConfounds.get(confoundGroupId);
      if (previous !== undefined) {
        issues.push(issueV1(
          "confounded-primary-coordinates",
          "primaryCoordinateIds",
          `${previous} and ${parameterId} share ${confoundGroupId}`,
        ));
      } else {
        primaryConfounds.set(confoundGroupId, parameterId);
      }
    }
  }
  const preloadOwners = source.primaryCoordinateIds.filter((parameterId) =>
    parameterById.get(parameterId)?.confoundGroupIds
      .includes("preload-volume-tone") === true);
  if (preloadOwners.length !== 1) {
    issues.push(issueV1(
      "preload-owner-count",
      "primaryCoordinateIds",
      `expected one preload owner, found ${preloadOwners.length}`,
    ));
  }

  const conditionIds = new Set<string>();
  for (const [index, condition] of source.conditions.entries()) {
    if (conditionIds.has(condition.conditionId)) {
      issues.push(issueV1(
        "condition-duplicate",
        `conditions[${index}]`,
        `${condition.conditionId} is duplicated`,
      ));
    }
    conditionIds.add(condition.conditionId);
    if (
      (condition.heartRateBpm !== 60 && condition.heartRateBpm !== 70)
      || !(condition.totalBloodVolumeMultiplier > 0)
      || !Number.isFinite(condition.totalBloodVolumeMultiplier)
      || !(condition.systemicResistanceMultiplier > 0)
      || !Number.isFinite(condition.systemicResistanceMultiplier)
    ) {
      issues.push(issueV1(
        "condition-invalid",
        `conditions[${index}]`,
        "HR and load multipliers are outside the conditioning contract",
      ));
    }
  }
  const evidenceGroupIds = new Set(normalReferenceEvidenceV1.checkGroups
    .map(({ groupId }) => groupId));
  for (const [index, groupId] of source.observationGroupIds.entries()) {
    if (!evidenceGroupIds.has(groupId)) {
      issues.push(issueV1(
        "observation-group-unresolved",
        `observationGroupIds[${index}]`,
        `${groupId} does not resolve in the evidence registry`,
      ));
    }
  }
  const observedCheckIds = new Set(normalReferenceEvidenceV1.checkGroups
    .filter(({ groupId }) => source.observationGroupIds.includes(groupId))
    .flatMap(({ checkIds }) => checkIds));
  const conditionById = new Map(source.conditions.map((condition) =>
    [condition.conditionId, condition] as const));
  const objectiveConditionBindings = [
    [
      source.objectivePolicy.baselineConditionId,
      "resting-construction-corridors",
    ],
    ...source.objectivePolicy.preloadResponseConditionIds.map((conditionId) =>
      [conditionId, "fixed-control-directional-response"] as const),
    ...source.objectivePolicy.safetyConditionIds.map((conditionId) =>
      [conditionId, "perturbation-safety-only"] as const),
  ] as const;
  if (
    objectiveConditionBindings.some(([conditionId, expectedRole]) =>
      conditionById.get(conditionId)?.constraintRole !== expectedRole)
    || source.objectivePolicy.safetyCheckIds.length < 1
    || source.objectivePolicy.safetyCheckIds.some((checkId) =>
      !observedCheckIds.has(checkId))
    || source.objectivePolicy.primaryInteriorGroupIds.length < 1
    || source.objectivePolicy.primaryInteriorGroupIds.some((groupId) =>
      !evidenceGroupIds.has(groupId))
  ) {
    issues.push(issueV1(
      "objective-policy-invalid",
      "objectivePolicy",
      "rest, preload-response, and perturbation-safety bindings must resolve without sharing one corridor policy",
    ));
  }
  if (
    source.searchPolicy.coordinateIds.length < 1
    || source.searchPolicy.coordinateIds.length
      > source.conditioningPolicy.maximumAdmittedCoordinateCount
    || source.searchPolicy.coordinateIds.some((coordinateId) =>
      !source.primaryCoordinateIds.includes(coordinateId))
    || new Set(source.searchPolicy.coordinateIds).size
      !== source.searchPolicy.coordinateIds.length
    || source.searchPolicy.initialCandidateCountIncludingReference < 2
    || source.searchPolicy.refinementCandidateCountIncludingCenter < 2
    || !(source.searchPolicy.transformedDomainHalfSpanFraction > 0)
    || !(source.searchPolicy.transformedDomainHalfSpanFraction <= 0.5)
    || !(source.searchPolicy.refinementContraction > 0)
    || !(source.searchPolicy.refinementContraction < 1)
    || source.searchPolicy.finalistCount < 1
    || source.searchPolicy.finalistCount
      > source.searchPolicy.refinementCandidateCountIncludingCenter
    || !(source.searchPolicy.equivalentPrimaryMarginEpsilon >= 0)
    || !(source.searchPolicy.equivalentWorstMarginEpsilon >= 0)
    || !(source.searchPolicy.numericalFloorBufferMultiples >= 0)
    || source.searchPolicy.paretoSegmentFractions.length !== 5
    || source.searchPolicy.paretoSegmentFractions.some((fraction, index) =>
      !Number.isFinite(fraction)
      || fraction < 0
      || fraction > 1
      || (index > 0
        && fraction <= source.searchPolicy.paretoSegmentFractions[index - 1]!))
    || source.searchPolicy.paretoSegmentFractions[0] !== 0
    || source.searchPolicy.paretoSegmentFractions.at(-1) !== 1
    || source.searchPolicy.coordinateProfileStepMultipliers.length !== 5
    || source.searchPolicy.coordinateProfileStepMultipliers.some(
      (multiplier, index) =>
        !Number.isFinite(multiplier)
        || multiplier < 0
        || (index > 0
          && multiplier
            <= source.searchPolicy.coordinateProfileStepMultipliers[index - 1]!),
    )
    || source.searchPolicy.coordinateProfileStepMultipliers[0] !== 0
    || source.searchPolicy.releaseLatticeNeighbourDirections.length !== 2
    || source.searchPolicy.releaseLatticeNeighbourDirections[0] !== -1
    || source.searchPolicy.releaseLatticeNeighbourDirections[1] !== 1
    || !(source.searchPolicy.preloadReserveRecovery.refinementContraction > 0)
    || !(source.searchPolicy.preloadReserveRecovery.refinementContraction
      < source.searchPolicy.refinementContraction)
    || totalBloodVolumeParameter === undefined
    || !(source.searchPolicy.preloadReserveRecovery
      .maximumOperatingTotalBloodVolumeMl
        >= (totalBloodVolumeParameter?.minimum ?? Number.POSITIVE_INFINITY))
    || !(source.searchPolicy.preloadReserveRecovery
      .maximumOperatingTotalBloodVolumeMl
        <= (totalBloodVolumeParameter?.maximum ?? Number.NEGATIVE_INFINITY))
    || source.searchPolicy.preloadReserveRecovery.allowedSeedFailureGroupIds
      .some((groupId) => !evidenceGroupIds.has(groupId))
    || !(source.searchPolicy.preloadReserveRecovery
      .minimumSeedPrimaryBufferedInteriorMargin >= 0)
  ) {
    issues.push(issueV1(
      "search-policy-invalid",
      "searchPolicy",
      "search coordinates and deterministic bounded budget are invalid",
    ));
  }
  if (source.positiveControls.length < 1) {
    issues.push(issueV1(
      "positive-control-invalid",
      "positiveControls",
      "at least one preregistered positive control is required",
    ));
  }
  for (const [index, control] of source.positiveControls.entries()) {
    if (
      !source.primaryCoordinateIds.includes(control.coordinateId)
      || !observedCheckIds.has(control.checkId)
      || (control.expectedCentralSensitivitySign !== -1
        && control.expectedCentralSensitivitySign !== 1)
      || control.rationale.trim().length === 0
    ) {
      issues.push(issueV1(
        "positive-control-invalid",
        `positiveControls[${index}]`,
        `${control.controlId} is not bound to an admitted coordinate and observation`,
      ));
    }
  }
  if (source.constructionPolicyRevisionId !== currentPolicyRevision.revisionId) {
    issues.push(issueV1(
      "policy-revision-stale",
      "constructionPolicyRevisionId",
      "study does not bind the current construction policy revision",
    ));
  }
  if (
    source.numericalPolicy.explorationNominalDtSec
      < MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.minimumNominalDtSec
    || source.numericalPolicy.explorationNominalDtSec
      > MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.maximumNominalDtSec
    || source.numericalPolicy.finalistRefinedDtSec
      !== source.numericalPolicy.explorationNominalDtSec / 2
    || source.numericalPolicy.maximumParallelEvaluations < 1
    || source.numericalPolicy.maximumParallelEvaluations > 8
    || !Number.isSafeInteger(
      source.numericalPolicy.maximumParallelEvaluations,
    )
    || source.conditioningPolicy.nearestNeighbourContinuationForDerivatives
      !== false
    || source.conditioningPolicy.spectrumRowAdmission
      !== "complete-and-step-sign-stable"
    || source.conditioningPolicy.practicalRankToleranceComposition
      !== "maximum-of-machine-and-observed-step-halving-frobenius"
    || source.numericalPolicy.rateConditionInitialization
      !== "cold-center-then-common-center-continuation"
    || !(source.numericalPolicy.finalistComparisonCorridorFraction > 0)
    || source.numericalPolicy.finalistComparisonCorridorFraction
      > source.searchPolicy.equivalentPrimaryMarginEpsilon
    || source.numericalPolicy.finalistComparisonToleranceComposition
      !== "additive-numerical-floor-and-corridor"
  ) {
    issues.push(issueV1(
      "numerical-policy-invalid",
      "numericalPolicy",
      "dt refinement, derivative conditioning, or parallel bound is invalid",
    ));
  }
  if (
    source.claimPolicy.evidenceRole !== "construction"
    || source.claimPolicy.finalConfirmationStatus !== "unavailable"
    || source.claimPolicy.pulmonaryWaveformValidationClaimed
    || source.claimPolicy.uniqueParameterVectorClaimed
  ) {
    issues.push(issueV1(
      "claim-scope-invalid",
      "claimPolicy",
      "current study may make construction-only systemic/left-heart claims",
    ));
  }
  for (const required of [
    "matched-alpha-calcium-source",
    "rounded-ejection-land-kinetic-family",
  ]) {
    if (!source.sourceLockedFamilies.includes(required)) {
      issues.push(issueV1(
        "source-lock-missing",
        "sourceLockedFamilies",
        `${required} must remain locked`,
      ));
    }
  }
  return Object.freeze(issues);
}

export async function compileMainWireBaselineConditioningStudyV1(
  source: MainWireBaselineConditioningStudySourceV1 =
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
): Promise<CompiledMainWireBaselineConditioningStudyV1> {
  const issues = lintMainWireBaselineConditioningStudyV1(source);
  if (issues.length > 0) {
    throw new Error(
      "baseline conditioning study rejected: "
        + issues.map(({ code, path }) => `${code}@${path}`).join(", "),
    );
  }
  const canonicalStudy = cloneAndFreezeCanonicalJson<CanonicalJsonValue>(source);
  return Object.freeze({
    compilerId: MAIN_WIRE_BASELINE_CONDITIONING_STUDY_COMPILER_V1_ID,
    studyIdentitySha256: await sha256CanonicalJsonHex(canonicalStudy),
    canonicalStudy,
  });
}

function conditionV1(
  conditionId: string,
  heartRateBpm: 60 | 70,
  totalBloodVolumeMultiplier: number,
  systemicResistanceMultiplier: number,
  role: MainWireBaselineConditioningConditionV1["role"],
  constraintRole: MainWireBaselineConditioningConditionV1["constraintRole"],
): MainWireBaselineConditioningConditionV1 {
  return Object.freeze({
    conditionId,
    heartRateBpm,
    totalBloodVolumeMultiplier,
    systemicResistanceMultiplier,
    role,
    constraintRole,
  });
}

function issueV1(
  code: MainWireBaselineConditioningStudyLintIssueV1["code"],
  path: string,
  message: string,
): MainWireBaselineConditioningStudyLintIssueV1 {
  return Object.freeze({ code, path, message });
}
