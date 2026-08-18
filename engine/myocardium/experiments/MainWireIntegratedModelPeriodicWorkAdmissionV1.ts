import {
  pressureVolumePathIntegralIncrementV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1,
  type MainWireIntegratedModelPeriodicExternalWorkInputV1,
  type MainWireIntegratedModelPeriodicExternalWorkResultV1,
  type MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicExternalWorkV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
  type MainWireIntegratedModelPeriodicNumericalAccessV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_V1_ID =
  "main-wire-integrated-model-periodic-work-admission-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_V1_ID =
  "main-wire-integrated-model-periodic-pressure-basis-decomposition-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_ARM_SET_V1 =
  Object.freeze({
    "normal-default": Object.freeze({
      role: "required" as const,
      peepCmH2O: 0 as const,
      prescribedPericardialFluidVolumeMl: 0 as const,
    }),
    "peep-10-cmh2o": Object.freeze({
      role: "required" as const,
      peepCmH2O: 10 as const,
      prescribedPericardialFluidVolumeMl: 0 as const,
    }),
    "pericardial-effusion-200ml": Object.freeze({
      role: "characterization-only" as const,
      peepCmH2O: 0 as const,
      prescribedPericardialFluidVolumeMl: 200 as const,
    }),
  });

export type MainWireIntegratedModelPeriodicPressureBasisArmIdV1 =
  keyof typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_ARM_SET_V1;

/**
 * Frozen before executing the new 0.5 ms result. These are numerical and
 * semantic admission limits, not physiological normal ranges.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1 =
  Object.freeze({
    policyId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_V1_ID,
    declarationStatus: "declared-before-new-0.5ms-output" as const,
    coarseDtSec: 0.001 as const,
    fineDtSec: 0.0005 as const,
    grids: "independent-cold-start-canonical-p1-runs" as const,
    comparison:
      "absolute-coarse-minus-fine-divided-by-max-absolute-fine-or-fixed-near-zero-scale" as const,
    maximumScaledDifference: 0.01 as const,
    nearZeroAbsoluteWorkScaleMmHgMl: 1 as const,
    impliedMaximumNearZeroAbsoluteDifferenceMmHgMl: 0.01 as const,
    directionAgreementRequiredOutsideNearZero: true as const,
    requiredNumericalBases: Object.freeze([
      "cavity-absolute-pressure",
      "ventricular-transmural-pressure",
    ] as const),
    requiredChambers: Object.freeze(["LV", "RV"] as const),
    maximumPressureWorkDecompositionResidualMmHgMl: 1e-8 as const,
    pressureBasis: Object.freeze({
      conventionalPvLoopExternalWork: "cavity-absolute-pressure" as const,
      wallDistendingBoundaryWork:
        "ventricular-transmural-pressure" as const,
      externalConstraintExchange:
        "absolute-minus-transmural-pressure" as const,
      algebraicIdentity:
        "cavity-work-equals-transmural-work-plus-external-constraint-work" as const,
      conventionalPvaDiagramCoordinate:
        "cavity-absolute-pressure" as const,
      myocardialLoadingCoordinate:
        "ventricular-transmural-pressure" as const,
      futurePvaPrimaryBasis:
        "not-established-by-this-policy" as const,
      pvaEstablishedByThisPolicy: false as const,
    }),
    pressureBasisArmNominalDtSec: 0.001 as const,
    pressureBasisArms:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_ARM_SET_V1,
    predecessorCharacterizationKnownWhenDeclared: true as const,
    predecessorCharacterizationDtSec: Object.freeze([
      0.01,
      0.005,
      0.002,
      0.001,
    ] as const),
    newFineOutputAvailableWhenDeclared: false as const,
    newFineOutputUsedToChooseTolerance: false as const,
    toleranceRole:
      "one-percent-output-stability-requirement-not-biological-tolerance" as const,
    interpolationApplied: false as const,
    resamplingApplied: false as const,
    parameterFittingApplied: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicWorkBasisV1 =
  | "cavity-absolute-pressure"
  | "ventricular-transmural-pressure"
  | "external-constraint-pressure";

export type MainWireIntegratedModelPeriodicPressureWorkFailureReasonV1 =
  | "source-transmural-qualification-inconsistent"
  | "pressure-path-incomplete"
  | "cavity-pressure-volume-boundary-not-closed"
  | "pressure-work-decomposition-failed";

type PressureVolumeEndpointClosureV1 = Readonly<{
  start: Readonly<{ volumeMl: number; pressureMmHg: number }> | null;
  end: Readonly<{ volumeMl: number; pressureMmHg: number }> | null;
  absoluteVolumeDeltaMl: number | null;
  absolutePressureDeltaMmHg: number | null;
  normalizedVolumeDelta: number | null;
  normalizedPressureDelta: number | null;
  maximumNormalizedDelta: number | null;
  withinTolerance: boolean;
}>;

export type MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1 =
  Readonly<{
    chamber: "LV" | "RV";
    pathWorkMmHgMl: Readonly<Record<
      MainWireIntegratedModelPeriodicWorkBasisV1,
      number | null
    >>;
    qualifiedWorkMmHgMl: Readonly<Record<
      MainWireIntegratedModelPeriodicWorkBasisV1,
      number | null
    >>;
    cavityPressureVolumeClosure: PressureVolumeEndpointClosureV1;
    transmuralPressureVolumeClosure: PressureVolumeEndpointClosureV1;
    decompositionResidualMmHgMl: number | null;
    decompositionPassed: boolean;
    conventionalPvLoopExternalWorkMmHgMl: number | null;
    conventionalPvLoopExternalWorkEstablished: boolean;
    pvaEstablished: false;
    failureReasons:
      readonly MainWireIntegratedModelPeriodicPressureWorkFailureReasonV1[];
  }>;

export type MainWireIntegratedModelPeriodicPressureBasisWorkV1 = Readonly<{
  qualificationId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_V1_ID;
  status:
    | "qualified-biventricular"
    | "qualified-left-ventricular-only"
    | "qualified-right-ventricular-only"
    | "not-qualified";
  protocolIdentityHash: string;
  modelConditionIdentityHash: string;
  sourceCycleIndex: number;
  sourceTransmuralQualificationId:
    MainWireIntegratedModelPeriodicExternalWorkResultV1["qualificationId"];
  sourceTransmuralQualificationConsistent: boolean;
  leftVentricle: MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1;
  rightVentricle: MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1;
  conventionalPvLoopExternalWorkEstablishedBiventricular: boolean;
  pvaEstablished: false;
  physiologicalValidationEstablished: false;
  clinicalValidationClaimed: false;
  policy:
    typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1;
}>;

export function qualifyMainWireIntegratedModelPeriodicPressureBasisWorkV1(
  input: MainWireIntegratedModelPeriodicExternalWorkInputV1,
  source: MainWireIntegratedModelPeriodicExternalWorkResultV1,
): MainWireIntegratedModelPeriodicPressureBasisWorkV1 {
  const sourceTransmuralQualificationConsistent =
    source.protocolIdentityHash === input.protocolIdentityHash &&
    source.modelConditionIdentityHash === input.modelConditionIdentityHash &&
    source.sourceCycleIndex === input.terminalCycle.cycleIndex &&
    source.sourceStartTimeSec === input.terminalCycle.startTimeSec &&
    source.sourceEndTimeSec === input.terminalCycle.endTimeSec;
  const leftVentricle = chamberPressureWorkV1(
    "LV",
    input.startBoundary,
    input.terminalTrace.samples,
    source.leftVentricle,
    sourceTransmuralQualificationConsistent,
  );
  const rightVentricle = chamberPressureWorkV1(
    "RV",
    input.startBoundary,
    input.terminalTrace.samples,
    source.rightVentricle,
    sourceTransmuralQualificationConsistent,
  );
  const leftQualified =
    leftVentricle.conventionalPvLoopExternalWorkEstablished;
  const rightQualified =
    rightVentricle.conventionalPvLoopExternalWorkEstablished;
  const status = leftQualified && rightQualified
    ? ("qualified-biventricular" as const)
    : leftQualified
      ? ("qualified-left-ventricular-only" as const)
      : rightQualified
        ? ("qualified-right-ventricular-only" as const)
        : ("not-qualified" as const);
  return Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_V1_ID,
    status,
    protocolIdentityHash: input.protocolIdentityHash,
    modelConditionIdentityHash: input.modelConditionIdentityHash,
    sourceCycleIndex: input.terminalCycle.cycleIndex,
    sourceTransmuralQualificationId: source.qualificationId,
    sourceTransmuralQualificationConsistent,
    leftVentricle,
    rightVentricle,
    conventionalPvLoopExternalWorkEstablishedBiventricular:
      leftQualified && rightQualified,
    pvaEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1,
  });
}

type SourceChamberWorkV1 =
  MainWireIntegratedModelPeriodicExternalWorkResultV1["leftVentricle"];

function chamberPressureWorkV1(
  chamber: "LV" | "RV",
  startBoundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 | null,
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  source: SourceChamberWorkV1,
  sharedSourceConsistent: boolean,
): MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1 {
  const cavityPathWork = acceptedPathWorkForBasisV1(
    chamber,
    startBoundary,
    samples,
    "cavity-absolute-pressure",
  );
  const transmuralPathWork = acceptedPathWorkForBasisV1(
    chamber,
    startBoundary,
    samples,
    "ventricular-transmural-pressure",
  );
  const externalConstraintPathWork = acceptedPathWorkForBasisV1(
    chamber,
    startBoundary,
    samples,
    "external-constraint-pressure",
  );
  const last = samples.at(-1) ?? null;
  const cavityClosure = endpointClosureV1(
    startBoundary === null
      ? null
      : Object.freeze({
          volumeMl: startBoundary.chamberVolumeMl[chamber],
          pressureMmHg: startBoundary.absolutePressureMmHg[chamber],
        }),
    last === null
      ? null
      : Object.freeze({
          volumeMl: last.chamberVolumeMl[chamber],
          pressureMmHg: last.absolutePressureMmHg[chamber],
        }),
  );
  const sourceConsistent =
    sharedSourceConsistent &&
    transmuralPathWork !== null &&
    source.pathWorkMmHgMl === transmuralPathWork;
  const decompositionResidualMmHgMl =
    cavityPathWork === null ||
    transmuralPathWork === null ||
    externalConstraintPathWork === null
      ? null
      : cavityPathWork -
        (transmuralPathWork + externalConstraintPathWork);
  const decompositionPassed =
    decompositionResidualMmHgMl !== null &&
    Math.abs(decompositionResidualMmHgMl) <=
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1
        .maximumPressureWorkDecompositionResidualMmHgMl;
  const established =
    source.externalWorkEstablished &&
    sourceConsistent &&
    cavityPathWork !== null &&
    externalConstraintPathWork !== null &&
    cavityClosure.withinTolerance &&
    decompositionPassed;
  const failureReasons:
    MainWireIntegratedModelPeriodicPressureWorkFailureReasonV1[] = [];
  if (!sourceConsistent) {
    failureReasons.push("source-transmural-qualification-inconsistent");
  }
  if (
    cavityPathWork === null ||
    transmuralPathWork === null ||
    externalConstraintPathWork === null
  ) {
    failureReasons.push("pressure-path-incomplete");
  }
  if (!cavityClosure.withinTolerance) {
    failureReasons.push("cavity-pressure-volume-boundary-not-closed");
  }
  if (!decompositionPassed) {
    failureReasons.push("pressure-work-decomposition-failed");
  }
  const pathWorkMmHgMl = Object.freeze({
    "cavity-absolute-pressure": cavityPathWork,
    "ventricular-transmural-pressure": transmuralPathWork,
    "external-constraint-pressure": externalConstraintPathWork,
  });
  return Object.freeze({
    chamber,
    pathWorkMmHgMl,
    qualifiedWorkMmHgMl: Object.freeze({
      "cavity-absolute-pressure": established ? cavityPathWork : null,
      "ventricular-transmural-pressure": established
        ? transmuralPathWork
        : null,
      "external-constraint-pressure": established
        ? externalConstraintPathWork
        : null,
    }),
    cavityPressureVolumeClosure: cavityClosure,
    transmuralPressureVolumeClosure: source.endpointClosure,
    decompositionResidualMmHgMl,
    decompositionPassed,
    conventionalPvLoopExternalWorkMmHgMl: established
      ? cavityPathWork
      : null,
    conventionalPvLoopExternalWorkEstablished: established,
    pvaEstablished: false as const,
    failureReasons: Object.freeze(failureReasons),
  });
}

function acceptedPathWorkForBasisV1(
  chamber: "LV" | "RV",
  startBoundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 | null,
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  basis: MainWireIntegratedModelPeriodicWorkBasisV1,
): number | null {
  if (startBoundary === null || samples.length === 0) return null;
  let previousVolumeMl = startBoundary.chamberVolumeMl[chamber];
  let previousPressureMmHg = boundaryPressureV1(
    startBoundary,
    chamber,
    basis,
  );
  if (!Number.isFinite(previousVolumeMl) || !Number.isFinite(previousPressureMmHg)) {
    return null;
  }
  let pathIntegralMmHgMl = 0;
  for (const sample of samples) {
    const nextVolumeMl = sample.chamberVolumeMl[chamber];
    const nextPressureMmHg = samplePressureV1(sample, chamber, basis);
    if (!Number.isFinite(nextVolumeMl) || !Number.isFinite(nextPressureMmHg)) {
      return null;
    }
    pathIntegralMmHgMl += pressureVolumePathIntegralIncrementV3(
      previousVolumeMl,
      previousPressureMmHg,
      nextVolumeMl,
      nextPressureMmHg,
    );
    previousVolumeMl = nextVolumeMl;
    previousPressureMmHg = nextPressureMmHg;
  }
  const workMmHgMl = -pathIntegralMmHgMl;
  return Object.is(workMmHgMl, -0) ? 0 : workMmHgMl;
}

function boundaryPressureV1(
  boundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1,
  chamber: "LV" | "RV",
  basis: MainWireIntegratedModelPeriodicWorkBasisV1,
): number {
  if (basis === "cavity-absolute-pressure") {
    return boundary.absolutePressureMmHg[chamber];
  }
  if (basis === "ventricular-transmural-pressure") {
    return boundary.transmuralPressureMmHg[chamber];
  }
  return boundary.absolutePressureMmHg[chamber] -
    boundary.transmuralPressureMmHg[chamber];
}

function samplePressureV1(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  chamber: "LV" | "RV",
  basis: MainWireIntegratedModelPeriodicWorkBasisV1,
): number {
  if (basis === "cavity-absolute-pressure") {
    return sample.absolutePressureMmHg[chamber];
  }
  if (basis === "ventricular-transmural-pressure") {
    return sample.transmuralPressureMmHg[chamber];
  }
  return sample.absolutePressureMmHg[chamber] -
    sample.transmuralPressureMmHg[chamber];
}

function endpointClosureV1(
  start: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
  end: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
): PressureVolumeEndpointClosureV1 {
  if (start === null || end === null) {
    return Object.freeze({
      start,
      end,
      absoluteVolumeDeltaMl: null,
      absolutePressureDeltaMmHg: null,
      normalizedVolumeDelta: null,
      normalizedPressureDelta: null,
      maximumNormalizedDelta: null,
      withinTolerance: false,
    });
  }
  const absoluteVolumeDeltaMl = Math.abs(end.volumeMl - start.volumeMl);
  const absolutePressureDeltaMmHg = Math.abs(
    end.pressureMmHg - start.pressureMmHg,
  );
  const normalizedVolumeDelta = absoluteVolumeDeltaMl /
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1.closure
      .volumeReferenceScaleMl;
  const normalizedPressureDelta = absolutePressureDeltaMmHg /
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1.closure
      .pressureReferenceScaleMmHg;
  const maximumNormalizedDelta = Math.max(
    normalizedVolumeDelta,
    normalizedPressureDelta,
  );
  return Object.freeze({
    start,
    end,
    absoluteVolumeDeltaMl,
    absolutePressureDeltaMmHg,
    normalizedVolumeDelta,
    normalizedPressureDelta,
    maximumNormalizedDelta,
    withinTolerance:
      maximumNormalizedDelta <=
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1.closure
        .maximumNormalizedBoundaryDelta,
  });
}

export type MainWireIntegratedModelPeriodicWorkRefinementRunV1 = Readonly<{
  executionPurpose: "canonical-evidence";
  numericalAccess: MainWireIntegratedModelPeriodicNumericalAccessV3;
  nominalDtSec: number;
  modelConditionIdentityHash: string;
  protocolIdentityHash: string;
  numericalPeriod1Established: boolean;
  terminalCheckpointExactRoundTripVerified: boolean;
  terminalPressureBasisWork:
    MainWireIntegratedModelPeriodicPressureBasisWorkV1;
}>;

export type MainWireIntegratedModelPeriodicWorkRefinementMetricV1 = Readonly<{
  chamber: "LV" | "RV";
  basis:
    | "cavity-absolute-pressure"
    | "ventricular-transmural-pressure";
  coarseWorkMmHgMl: number | null;
  fineWorkMmHgMl: number | null;
  absoluteDifferenceMmHgMl: number | null;
  denominatorMmHgMl: number | null;
  fineIsNearZero: boolean | null;
  scaledDifference: number | null;
  maximumAllowedScaledDifference: 0.01;
  directionAgreementRequired: boolean | null;
  directionAgrees: boolean | null;
  passed: boolean;
}>;

export type MainWireIntegratedModelPeriodicWorkRefinementComparisonV1 =
  Readonly<{
    comparisonId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_V1_ID;
    gates: Readonly<{
      dtPairMatches: boolean;
      refinementAccessMatches: boolean;
      conditionIdentityMatches: boolean;
      protocolIdentitiesAreDistinct: boolean;
      bothCanonicalPeriod1: boolean;
      bothExactCheckpointRoundTrips: boolean;
      bothPressureBasisQualificationsPassed: boolean;
    }>;
    metrics: readonly MainWireIntegratedModelPeriodicWorkRefinementMetricV1[];
    numericalAdmissionPassed: boolean;
    physiologicalValidationEstablished: false;
    clinicalValidationClaimed: false;
    policy:
      typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1;
  }>;

export function compareMainWireIntegratedModelPeriodicWorkRefinementV1(
  coarse: MainWireIntegratedModelPeriodicWorkRefinementRunV1,
  fine: MainWireIntegratedModelPeriodicWorkRefinementRunV1,
): MainWireIntegratedModelPeriodicWorkRefinementComparisonV1 {
  const policy = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1;
  const dtPairMatches = coarse.nominalDtSec === policy.coarseDtSec &&
    fine.nominalDtSec === policy.fineDtSec;
  const refinementAccessMatches =
    coarse.numericalAccess.accessId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID &&
    fine.numericalAccess.accessId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID &&
    coarse.numericalAccess.refinementEvidenceOnly &&
    fine.numericalAccess.refinementEvidenceOnly;
  const conditionIdentityMatches = /^[0-9a-f]{64}$/.test(
    coarse.modelConditionIdentityHash,
  ) && coarse.modelConditionIdentityHash === fine.modelConditionIdentityHash;
  const protocolIdentitiesAreDistinct = /^[0-9a-f]{64}$/.test(
    coarse.protocolIdentityHash,
  ) && /^[0-9a-f]{64}$/.test(fine.protocolIdentityHash) &&
    coarse.protocolIdentityHash !== fine.protocolIdentityHash;
  const bothCanonicalPeriod1 = coarse.executionPurpose ===
      "canonical-evidence" &&
    fine.executionPurpose === "canonical-evidence" &&
    coarse.numericalPeriod1Established && fine.numericalPeriod1Established;
  const bothExactCheckpointRoundTrips =
    coarse.terminalCheckpointExactRoundTripVerified &&
    fine.terminalCheckpointExactRoundTripVerified;
  const bothPressureBasisQualificationsPassed =
    coarse.terminalPressureBasisWork.status === "qualified-biventricular" &&
    fine.terminalPressureBasisWork.status === "qualified-biventricular";
  const sharedGatesPassed = dtPairMatches && refinementAccessMatches &&
    conditionIdentityMatches && protocolIdentitiesAreDistinct &&
    bothCanonicalPeriod1 && bothExactCheckpointRoundTrips &&
    bothPressureBasisQualificationsPassed;
  const metrics = Object.freeze(
    (["LV", "RV"] as const).flatMap((chamber) =>
      ([
        "cavity-absolute-pressure",
        "ventricular-transmural-pressure",
      ] as const).map((basis) => refinementMetricV1(
        chamber,
        basis,
        chamber === "LV"
          ? coarse.terminalPressureBasisWork.leftVentricle
          : coarse.terminalPressureBasisWork.rightVentricle,
        chamber === "LV"
          ? fine.terminalPressureBasisWork.leftVentricle
          : fine.terminalPressureBasisWork.rightVentricle,
      )),
    ),
  );
  const numericalAdmissionPassed = sharedGatesPassed &&
    metrics.every((metric) => metric.passed);
  return Object.freeze({
    comparisonId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_V1_ID,
    gates: Object.freeze({
      dtPairMatches,
      refinementAccessMatches,
      conditionIdentityMatches,
      protocolIdentitiesAreDistinct,
      bothCanonicalPeriod1,
      bothExactCheckpointRoundTrips,
      bothPressureBasisQualificationsPassed,
    }),
    metrics,
    numericalAdmissionPassed,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy,
  });
}

export type MainWireIntegratedModelPeriodicPressureBasisArmRunV1 = Readonly<{
  armId: MainWireIntegratedModelPeriodicPressureBasisArmIdV1;
  peepCmH2O: number;
  prescribedPericardialFluidVolumeMl: number;
  executionPurpose: "canonical-evidence";
  numericalAccess: MainWireIntegratedModelPeriodicNumericalAccessV3;
  nominalDtSec: number;
  modelConditionIdentityHash: string;
  protocolIdentityHash: string;
  numericalPeriod1Established: boolean;
  terminalCheckpointExactRoundTripVerified: boolean;
  terminalPressureBasisWork:
    MainWireIntegratedModelPeriodicPressureBasisWorkV1;
}>;

export type MainWireIntegratedModelPeriodicPressureBasisArmAssessmentV1 =
  Readonly<{
    armId: MainWireIntegratedModelPeriodicPressureBasisArmIdV1;
    role: "required" | "characterization-only";
    runPresentExactlyOnce: boolean;
    declaredInputsMatch: boolean;
    protocolIdentityValid: boolean;
    modelConditionIdentityValid: boolean;
    canonicalOneMillisecondP1Established: boolean;
    exactCheckpointRoundTripVerified: boolean;
    biventricularPressureBasisQualified: boolean;
    decompositionPassedBiventricular: boolean;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicPressureBasisAdmissionV1 =
  Readonly<{
    qualificationId:
      "main-wire-integrated-model-periodic-pressure-basis-arm-admission-v1";
    arms:
      readonly MainWireIntegratedModelPeriodicPressureBasisArmAssessmentV1[];
    requiredConditionIdentitiesDistinct: boolean;
    requiredProtocolIdentitiesDistinct: boolean;
    requiredArmsPassed: boolean;
    pressureBasisAdmissionPassed: boolean;
    characterizationOnlyArmsGateAdmission: false;
    physiologicalValidationEstablished: false;
    clinicalValidationClaimed: false;
    policy:
      typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1;
  }>;

export function assessMainWireIntegratedModelPeriodicPressureBasisArmsV1(
  runs: readonly MainWireIntegratedModelPeriodicPressureBasisArmRunV1[],
): MainWireIntegratedModelPeriodicPressureBasisAdmissionV1 {
  const armEntries = Object.entries(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_ARM_SET_V1,
  ) as readonly [
    MainWireIntegratedModelPeriodicPressureBasisArmIdV1,
    (typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_ARM_SET_V1)[
      MainWireIntegratedModelPeriodicPressureBasisArmIdV1
    ],
  ][];
  const arms = Object.freeze(armEntries.map(([armId, declaration]) => {
    const matchingRuns = runs.filter((run) => run.armId === armId);
    const run = matchingRuns.length === 1 ? matchingRuns[0]! : null;
    const runPresentExactlyOnce = run !== null;
    const declaredInputsMatch = run !== null &&
      run.peepCmH2O === declaration.peepCmH2O &&
      run.prescribedPericardialFluidVolumeMl ===
        declaration.prescribedPericardialFluidVolumeMl;
    const protocolIdentityValid = run !== null &&
      /^[0-9a-f]{64}$/.test(run.protocolIdentityHash);
    const modelConditionIdentityValid = run !== null &&
      /^[0-9a-f]{64}$/.test(run.modelConditionIdentityHash);
    const canonicalOneMillisecondP1Established = run !== null &&
      run.executionPurpose === "canonical-evidence" &&
      run.nominalDtSec ===
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1
          .pressureBasisArmNominalDtSec &&
      run.numericalAccess.accessId ===
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID &&
      run.numericalAccess.refinementEvidenceOnly &&
      run.numericalPeriod1Established;
    const exactCheckpointRoundTripVerified = run !== null &&
      run.terminalCheckpointExactRoundTripVerified;
    const biventricularPressureBasisQualified = run !== null &&
      run.terminalPressureBasisWork.status === "qualified-biventricular";
    const decompositionPassedBiventricular = run !== null &&
      run.terminalPressureBasisWork.leftVentricle.decompositionPassed &&
      run.terminalPressureBasisWork.rightVentricle.decompositionPassed;
    return Object.freeze({
      armId,
      role: declaration.role,
      runPresentExactlyOnce,
      declaredInputsMatch,
      protocolIdentityValid,
      modelConditionIdentityValid,
      canonicalOneMillisecondP1Established,
      exactCheckpointRoundTripVerified,
      biventricularPressureBasisQualified,
      decompositionPassedBiventricular,
      passed: runPresentExactlyOnce && declaredInputsMatch &&
        protocolIdentityValid && modelConditionIdentityValid &&
        canonicalOneMillisecondP1Established &&
        exactCheckpointRoundTripVerified &&
        biventricularPressureBasisQualified &&
        decompositionPassedBiventricular,
    });
  }));
  const requiredRuns = runs.filter((run) =>
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_ARM_SET_V1[run.armId]
      .role === "required"
  );
  const requiredConditionIdentitiesDistinct =
    distinctValidSha256ValuesV1(
      requiredRuns.map((run) => run.modelConditionIdentityHash),
      2,
    );
  const requiredProtocolIdentitiesDistinct = distinctValidSha256ValuesV1(
    requiredRuns.map((run) => run.protocolIdentityHash),
    2,
  );
  const requiredArmsPassed = arms
    .filter((arm) => arm.role === "required")
    .every((arm) => arm.passed);
  const pressureBasisAdmissionPassed = requiredArmsPassed &&
    requiredConditionIdentitiesDistinct && requiredProtocolIdentitiesDistinct;
  return Object.freeze({
    qualificationId:
      "main-wire-integrated-model-periodic-pressure-basis-arm-admission-v1" as const,
    arms,
    requiredConditionIdentitiesDistinct,
    requiredProtocolIdentitiesDistinct,
    requiredArmsPassed,
    pressureBasisAdmissionPassed,
    characterizationOnlyArmsGateAdmission: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1,
  });
}

export type MainWireIntegratedModelPeriodicWorkAdmissionDecisionV1 =
  Readonly<{
    decisionId: "main-wire-integrated-model-periodic-work-admission-decision-v1";
    numericalRefinementAdmissionPassed: boolean;
    pressureBasisAdmissionPassed: boolean;
    officialExperimentOutputAdmissionEligible: boolean;
    publicLiveOutputCatalogAdmissionEstablished: false;
    pvaAdmissionEstablished: false;
    physiologicalValidationEstablished: false;
    clinicalValidationClaimed: false;
  }>;

export function decideMainWireIntegratedModelPeriodicWorkAdmissionV1(
  numerical:
    MainWireIntegratedModelPeriodicWorkRefinementComparisonV1,
  pressureBasis:
    MainWireIntegratedModelPeriodicPressureBasisAdmissionV1,
): MainWireIntegratedModelPeriodicWorkAdmissionDecisionV1 {
  return Object.freeze({
    decisionId:
      "main-wire-integrated-model-periodic-work-admission-decision-v1" as const,
    numericalRefinementAdmissionPassed: numerical.numericalAdmissionPassed,
    pressureBasisAdmissionPassed:
      pressureBasis.pressureBasisAdmissionPassed,
    officialExperimentOutputAdmissionEligible:
      numerical.numericalAdmissionPassed &&
      pressureBasis.pressureBasisAdmissionPassed,
    publicLiveOutputCatalogAdmissionEstablished: false as const,
    pvaAdmissionEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });
}

function distinctValidSha256ValuesV1(
  values: readonly string[],
  expectedCount: number,
): boolean {
  return values.length === expectedCount &&
    values.every((value) => /^[0-9a-f]{64}$/.test(value)) &&
    new Set(values).size === expectedCount;
}

function refinementMetricV1(
  chamber: "LV" | "RV",
  basis:
    | "cavity-absolute-pressure"
    | "ventricular-transmural-pressure",
  coarse: MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1,
  fine: MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1,
): MainWireIntegratedModelPeriodicWorkRefinementMetricV1 {
  const coarseWorkMmHgMl = coarse.qualifiedWorkMmHgMl[basis];
  const fineWorkMmHgMl = fine.qualifiedWorkMmHgMl[basis];
  if (coarseWorkMmHgMl === null || fineWorkMmHgMl === null) {
    return Object.freeze({
      chamber,
      basis,
      coarseWorkMmHgMl,
      fineWorkMmHgMl,
      absoluteDifferenceMmHgMl: null,
      denominatorMmHgMl: null,
      fineIsNearZero: null,
      scaledDifference: null,
      maximumAllowedScaledDifference: 0.01 as const,
      directionAgreementRequired: null,
      directionAgrees: null,
      passed: false,
    });
  }
  const nearZeroScale =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1
      .nearZeroAbsoluteWorkScaleMmHgMl;
  const absoluteDifferenceMmHgMl = Math.abs(
    coarseWorkMmHgMl - fineWorkMmHgMl,
  );
  const denominatorMmHgMl = Math.max(
    Math.abs(fineWorkMmHgMl),
    nearZeroScale,
  );
  const fineIsNearZero = Math.abs(fineWorkMmHgMl) < nearZeroScale;
  const scaledDifference = absoluteDifferenceMmHgMl / denominatorMmHgMl;
  const directionAgreementRequired = !fineIsNearZero;
  const directionAgrees = !directionAgreementRequired ||
    Math.sign(coarseWorkMmHgMl) === Math.sign(fineWorkMmHgMl);
  return Object.freeze({
    chamber,
    basis,
    coarseWorkMmHgMl,
    fineWorkMmHgMl,
    absoluteDifferenceMmHgMl,
    denominatorMmHgMl,
    fineIsNearZero,
    scaledDifference,
    maximumAllowedScaledDifference: 0.01 as const,
    directionAgreementRequired,
    directionAgrees,
    passed: Number.isFinite(scaledDifference) &&
      scaledDifference <=
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1
          .maximumScaledDifference &&
      directionAgrees,
  });
}
