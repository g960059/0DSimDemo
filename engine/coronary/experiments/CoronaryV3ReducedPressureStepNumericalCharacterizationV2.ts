import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1,
  runCoronaryV3ReducedPressureStepResponseV1,
  type CoronaryV3ReducedPressureCharacterizationArmV1,
  type CoronaryV3ReducedPressureStepProtocolV1,
  type CoronaryV3ReducedPressureStepResponseV1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepResponseV1";
import {
  describeCoronaryV3StepResponseMetricsV1,
  type CoronaryStepResponseBeatObservableV1,
  type CoronaryStepResponseCrossingBracketV1,
  type CoronaryStepResponseMetricsResultV1,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";

export const CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID =
  "coronary-v3-reduced-pressure-step-coarse-fine-numerical-characterization-v2" as const;

export const CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2 = Object.freeze([
  "80-to-100:tone-active",
  "80-to-100:tone-frozen",
  "100-to-80:tone-active",
  "100-to-80:tone-frozen",
] as const);

export type CoronaryV3ReducedPressureStepArmIdV2 =
  (typeof CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2)[number];

const FIXED_IMP_MM_HG_BY_TERRITORY_LAYER_V2 = Object.freeze({
  LAD: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
  LCx: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
  RCA: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
});

/**
 * V2 uses a new, prospectively fixed refinement pair. The 0.5 ms result must
 * not exist when this protocol and its numerical tolerances are declared.
 */
export const CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V2 =
  freezeProtocol({
    dtSec: 0.001,
    acceptedAutoregulationWindowSec: 1,
    baselineEquilibrationMaximumDurationSec: 400,
    equilibriumRequiredConsecutiveWindows: 3,
    equilibriumMaximumAbsoluteLogToneChangePerWindow: 8e-4,
    equilibriumMaximumAbsoluteLogQmTargetRatio: 0.02,
    baselineObservationDurationSec: 15,
    postStepObservationDurationSec: 85,
    baselineMetricsWindowDurationSec: 15,
    finalMetricsWindowDurationSec: 15,
    fixedAbsoluteRightAtrialPressureMmHg: 5,
    fixedPerivascularExternalPressureMmHg: 0,
    fixedIntramyocardialPressureMmHgByTerritoryLayer:
      FIXED_IMP_MM_HG_BY_TERRITORY_LAYER_V2,
    maximumAbsoluteInitializerContinuityResidualMlPerSec: 1e-8,
    maximumAbsoluteStepLedgerResidualMl: 1e-8,
    maximumAbsoluteNodeContinuityResidualMl: 1e-8,
  });

export const CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V2 =
  freezeProtocol({
    ...CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V2,
    dtSec: 0.0005,
  });

export const CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2 =
  Object.freeze({
    policyId:
      "coronary-v3-reduced-pressure-step-preregistered-numerical-qa-v2" as const,
    coarseDtSec: 0.001 as const,
    fineDtSec: 0.0005 as const,
    acceptedWindowDurationSec: 1 as const,
    comparisonTimeOrigin: "seconds-after-own-intervention" as const,
    crossingObservable:
      "surrogate-pressure-flow-baseline-final-half-response-fit-free-bracket" as const,
    crossingRequirement:
      "both-brackets-required-and-overlap-or-midpoints-within-one-window" as const,
    maximumCrossingMidpointDifferenceSec: 1 as const,
    finalNormalizedResponseDefinition:
      "(final-pressure-flow-minus-baseline-pressure-flow)/baseline-pressure-flow" as const,
    firstFiveAcceptedWindowTransientDefinition:
      "maximum-absolute-window-mean-pressure-flow-minus-duration-weighted-baseline-pressure-flow-within-first-five-accepted-windows" as const,
    firstFiveAcceptedWindowCount: 5 as const,
    transientDirectionRequirement: "direction-independent-absolute-deviation" as const,
    oppositeDirectionExcursionRequired: false as const,
    coarseFineRelativeDifferenceDefinition:
      "absolute-coarse-minus-fine-divided-by-absolute-fine" as const,
    maximumFinalNormalizedResponseRelativeDifference: 0.02 as const,
    maximumFirstFiveWindowAbsoluteTransientRelativeDifference: 0.05 as const,
    minimumAbsoluteBaselinePressureFlowMmHgSecPerMl: 1e-9 as const,
    minimumAbsoluteFineNormalizedResponse: 1e-9 as const,
    minimumAbsoluteFineFirstFiveWindowTransientMmHgSecPerMl: 1e-9 as const,
    timeComparisonToleranceSec: 1e-9 as const,
    missingCrossingPasses: false as const,
    incompleteFirstFiveWindowCoveragePasses: false as const,
    nearZeroDenominatorPasses: false as const,
    numericalQaOnly: true as const,
    biologicalTolerance: false as const,
    physiologicalThresholdsDefined: false as const,
    knownV1OutputUsedToChoosePhysiologicalThresholds: false as const,
    knownV1OutputUsedToChooseNumericalTolerance: false as const,
    originalPaperT50ComparisonApplied: false as const,
    policyDeclaredBeforeNewFineOutput: true as const,
  });

export const CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V2 =
  Object.freeze({
    purpose: "deterministic-coarse-fine-numerical-qa" as const,
    sourceHarnessClaim:
      CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1,
    predecessorV1ArtifactRetained: true as const,
    predecessorV1FailureReclassified: false as const,
    knownV1OutputMotivatedDirectionIndependentMetricDefinition: true as const,
    knownV1OutputUsedToChoosePhysiologicalThresholds: false as const,
    knownV1OutputUsedToChooseNumericalTolerance: false as const,
    policyDeclaredBeforeNewFineOutput: true as const,
    newFineDtSec: 0.0005 as const,
    newFineOutputAvailableWhenPolicyDeclared: false as const,
    newFineOutputUsedToChoosePolicy: false as const,
    allFourArmsCompared: true as const,
    firstFiveWindowMetricAppliedUniformlyToAllFourArms: true as const,
    directionDependentOppositeExcursionGateApplied: false as const,
    exactLeftMainCannulaRepresented: false as const,
    distalZeroFlowWedgeRepresented: false as const,
    constantFlowBoundaryRepresented: false as const,
    originalPaperT50Compared: false as const,
    dankelmanProtocolReproduced: false as const,
    parameterFittingApplied: false as const,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    clinicalValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  } as const);

export type CoronaryV3ReducedPressureStepArmNumericalSampleV2 = Readonly<{
  armId: CoronaryV3ReducedPressureStepArmIdV2;
  dtSec: number;
  interventionTimeSec: number;
  metrics: CoronaryStepResponseMetricsResultV1;
  allFinite: boolean;
  conservationToleranceSatisfied: boolean;
}>;

export type CoronaryV3RelativeCrossingBracketV2 = Readonly<{
  lowerSecAfterIntervention: number;
  upperSecAfterIntervention: number;
  midpointSecAfterIntervention: number;
}>;

export type CoronaryV3ReducedPressureCrossingComparisonV2 = Readonly<{
  coarse: CoronaryV3RelativeCrossingBracketV2 | null;
  fine: CoronaryV3RelativeCrossingBracketV2 | null;
  bothCrossingsPresent: boolean;
  bracketsOverlap: boolean | null;
  absoluteMidpointDifferenceSec: number | null;
  maximumAllowedMidpointDifferenceSec: 1;
  passed: boolean;
  failureReason: string | null;
}>;

export type CoronaryV3ReducedPressureFinalResponseComparisonV2 = Readonly<{
  coarseBaselinePressureFlowMmHgSecPerMl: number;
  fineBaselinePressureFlowMmHgSecPerMl: number;
  coarseFinalPressureFlowMmHgSecPerMl: number;
  fineFinalPressureFlowMmHgSecPerMl: number;
  coarseNormalizedResponse: number | null;
  fineNormalizedResponse: number | null;
  relativeDifference: number | null;
  maximumAllowedRelativeDifference: 0.02;
  denominatorGatePassed: boolean;
  passed: boolean;
  failureReason: string | null;
}>;

export type CoronaryV3ReducedPressureTransientExtremumV2 = Readonly<{
  beatIndex: number;
  startSecAfterIntervention: number;
  endSecAfterIntervention: number;
  pressureFlowMmHgSecPerMl: number;
  signedTransientFromBaselineMmHgSecPerMl: number;
  absoluteTransientFromBaselineMmHgSecPerMl: number;
}>;

export type CoronaryV3ReducedPressureFirstFiveWindowTransientComparisonV2 =
  Readonly<{
    definition:
      "direction-independent-maximum-absolute-transient-from-baseline";
    requiredAcceptedWindowCount: 5;
    coarseContributingAcceptedWindowCount: number;
    fineContributingAcceptedWindowCount: number;
    coarseCoveragePassed: boolean;
    fineCoveragePassed: boolean;
    coarseBaselinePressureFlowMmHgSecPerMl: number;
    fineBaselinePressureFlowMmHgSecPerMl: number;
    coarseExtremum: CoronaryV3ReducedPressureTransientExtremumV2 | null;
    fineExtremum: CoronaryV3ReducedPressureTransientExtremumV2 | null;
    coarseMaximumAbsoluteTransientMmHgSecPerMl: number | null;
    fineMaximumAbsoluteTransientMmHgSecPerMl: number | null;
    relativeDifference: number | null;
    maximumAllowedRelativeDifference: 0.05;
    denominatorGatePassed: boolean;
    oppositeDirectionExcursionRequired: false;
    passed: boolean;
    failureReason: string | null;
  }>;

export type CoronaryV3ReducedPressureIntegrityComparisonV2 = Readonly<{
  coarseAllFinite: boolean;
  fineAllFinite: boolean;
  coarseConservationToleranceSatisfied: boolean;
  fineConservationToleranceSatisfied: boolean;
  passed: boolean;
}>;

export type CoronaryV3ReducedPressureSurrogateBoundaryComparisonV2 = Readonly<{
  coarseUsesVenousBoundarySurrogate: boolean;
  fineUsesVenousBoundarySurrogate: boolean;
  coarseExactDankelmanStationEstablished: boolean;
  fineExactDankelmanStationEstablished: boolean;
  coarseEligibleForDirectOriginalPaperT50Claim: false;
  fineEligibleForDirectOriginalPaperT50Claim: false;
  passed: boolean;
}>;

export type CoronaryV3ReducedPressureStepArmNumericalComparisonV2 = Readonly<{
  armId: CoronaryV3ReducedPressureStepArmIdV2;
  coarseDtSec: number;
  fineDtSec: number;
  dtBindingPassed: boolean;
  integrity: CoronaryV3ReducedPressureIntegrityComparisonV2;
  surrogateBoundary: CoronaryV3ReducedPressureSurrogateBoundaryComparisonV2;
  crossing: CoronaryV3ReducedPressureCrossingComparisonV2;
  finalNormalizedResponse: CoronaryV3ReducedPressureFinalResponseComparisonV2;
  firstFiveWindowMaximumAbsoluteTransient:
    CoronaryV3ReducedPressureFirstFiveWindowTransientComparisonV2;
  numericalQaPassed: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3ReducedPressureStepAtDtResultV2 = Readonly<{
  role: "coarse" | "fine";
  dtSec: 0.001 | 0.0005;
  protocol: CoronaryV3ReducedPressureStepProtocolV1;
  harness: CoronaryV3ReducedPressureStepResponseV1;
  armSamples: Readonly<Record<
    CoronaryV3ReducedPressureStepArmIdV2,
    CoronaryV3ReducedPressureStepArmNumericalSampleV2
  >>;
  allFiniteAndConserved: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3ReducedPressureStepNumericalCharacterizationV2 =
  Readonly<{
    characterizationId:
      typeof CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID;
    policy:
      typeof CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2;
    claim: typeof CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V2;
    coarse: CoronaryV3ReducedPressureStepAtDtResultV2;
    fine: CoronaryV3ReducedPressureStepAtDtResultV2;
    comparisonByArm: Readonly<Record<
      CoronaryV3ReducedPressureStepArmIdV2,
      CoronaryV3ReducedPressureStepArmNumericalComparisonV2
    >>;
    allFourArmNumericalQaPassed: boolean;
    numericalQaPassed: boolean;
    biologicalValidationEstablished: false;
    physiologicalAcceptanceEstablished: false;
    releaseAcceptanceEstablished: false;
  }>;

/** Runs the preregistered 1 ms protocol before the preregistered 0.5 ms run. */
export function runCoronaryV3ReducedPressureStepNumericalCharacterizationV2():
CoronaryV3ReducedPressureStepNumericalCharacterizationV2 {
  const coarse = runAtDt(
    "coarse",
    CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V2,
  );
  const fine = runAtDt(
    "fine",
    CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V2,
  );
  const comparisonByArm = freezeArmRecord((armId) =>
    compareCoronaryV3ReducedPressureStepArmNumericsV2(
      coarse.armSamples[armId],
      fine.armSamples[armId],
    ));
  const allFourArmNumericalQaPassed =
    CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.every(
      (armId) => comparisonByArm[armId].numericalQaPassed,
    );
  const numericalQaPassed = coarse.allFiniteAndConserved
    && fine.allFiniteAndConserved
    && allFourArmNumericalQaPassed;
  return Object.freeze({
    characterizationId:
      CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID,
    policy: CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2,
    claim: CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V2,
    coarse,
    fine,
    comparisonByArm,
    allFourArmNumericalQaPassed,
    numericalQaPassed,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });
}

/** Pure fail-closed V2 comparator, independent of the expensive runners. */
export function compareCoronaryV3ReducedPressureStepArmNumericsV2(
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
): CoronaryV3ReducedPressureStepArmNumericalComparisonV2 {
  validateSample(coarse, "coarse");
  validateSample(fine, "fine");
  if (coarse.armId !== fine.armId) {
    throw new Error("coarse and fine coronary arm identities differ");
  }
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2;
  const dtBindingPassed = coarse.dtSec === policy.coarseDtSec
    && fine.dtSec === policy.fineDtSec;
  const integrity = compareIntegrity(coarse, fine);
  const surrogateBoundary = compareSurrogateBoundary(coarse, fine);
  const crossing = compareCrossing(coarse, fine);
  const finalNormalizedResponse = compareFinalNormalizedResponse(coarse, fine);
  const firstFiveWindowMaximumAbsoluteTransient =
    compareFirstFiveWindowMaximumAbsoluteTransient(coarse, fine);
  const numericalQaPassed = dtBindingPassed
    && integrity.passed
    && surrogateBoundary.passed
    && crossing.passed
    && finalNormalizedResponse.passed
    && firstFiveWindowMaximumAbsoluteTransient.passed;
  return Object.freeze({
    armId: coarse.armId,
    coarseDtSec: coarse.dtSec,
    fineDtSec: fine.dtSec,
    dtBindingPassed,
    integrity,
    surrogateBoundary,
    crossing,
    finalNormalizedResponse,
    firstFiveWindowMaximumAbsoluteTransient,
    numericalQaPassed,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  });
}

function runAtDt(
  role: "coarse" | "fine",
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
): CoronaryV3ReducedPressureStepAtDtResultV2 {
  const harness = runCoronaryV3ReducedPressureStepResponseV1(protocol);
  const armSamples = freezeArmRecord((armId) => {
    const arm = resolveHarnessArm(harness, armId);
    return Object.freeze({
      armId,
      dtSec: protocol.dtSec,
      interventionTimeSec: arm.interventionTimeSec,
      metrics: describeCoronaryV3StepResponseMetricsV1(arm.metricInput),
      allFinite: arm.allFinite,
      conservationToleranceSatisfied: arm.conservationToleranceSatisfied,
    });
  });
  const allFiniteAndConserved =
    CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.every((armId) =>
      armSamples[armId].allFinite
      && armSamples[armId].conservationToleranceSatisfied);
  const expectedDt: 0.001 | 0.0005 = role === "coarse" ? 0.001 : 0.0005;
  if (protocol.dtSec !== expectedDt) {
    throw new Error(`${role} coronary numerical protocol dt mismatch`);
  }
  return Object.freeze({
    role,
    dtSec: expectedDt,
    protocol,
    harness,
    armSamples,
    allFiniteAndConserved,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  });
}

function compareIntegrity(
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
): CoronaryV3ReducedPressureIntegrityComparisonV2 {
  const passed = coarse.allFinite
    && fine.allFinite
    && coarse.conservationToleranceSatisfied
    && fine.conservationToleranceSatisfied;
  return Object.freeze({
    coarseAllFinite: coarse.allFinite,
    fineAllFinite: fine.allFinite,
    coarseConservationToleranceSatisfied:
      coarse.conservationToleranceSatisfied,
    fineConservationToleranceSatisfied:
      fine.conservationToleranceSatisfied,
    passed,
  });
}

function compareSurrogateBoundary(
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
): CoronaryV3ReducedPressureSurrogateBoundaryComparisonV2 {
  const coarseSurrogate = coarse.metrics.measurementStation.kind
    === "venous-boundary-pressure-flow-surrogate";
  const fineSurrogate = fine.metrics.measurementStation.kind
    === "venous-boundary-pressure-flow-surrogate";
  const passed = coarseSurrogate
    && fineSurrogate
    && !coarse.metrics.exactDankelmanMeasurementStationEstablished
    && !fine.metrics.exactDankelmanMeasurementStationEstablished
    && !coarse.metrics.eligibleForDirectOriginalPaperT50ReproductionClaim
    && !fine.metrics.eligibleForDirectOriginalPaperT50ReproductionClaim;
  return Object.freeze({
    coarseUsesVenousBoundarySurrogate: coarseSurrogate,
    fineUsesVenousBoundarySurrogate: fineSurrogate,
    coarseExactDankelmanStationEstablished:
      coarse.metrics.exactDankelmanMeasurementStationEstablished,
    fineExactDankelmanStationEstablished:
      fine.metrics.exactDankelmanMeasurementStationEstablished,
    coarseEligibleForDirectOriginalPaperT50Claim: false as const,
    fineEligibleForDirectOriginalPaperT50Claim: false as const,
    passed,
  });
}

function compareCrossing(
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
): CoronaryV3ReducedPressureCrossingComparisonV2 {
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2;
  const coarseBracket = relativeBracket(
    coarse.metrics.fitFreeBaselineFinalHalfResponseBracket,
    coarse.interventionTimeSec,
  );
  const fineBracket = relativeBracket(
    fine.metrics.fitFreeBaselineFinalHalfResponseBracket,
    fine.interventionTimeSec,
  );
  if (coarseBracket === null || fineBracket === null) {
    return Object.freeze({
      coarse: coarseBracket,
      fine: fineBracket,
      bothCrossingsPresent: false,
      bracketsOverlap: null,
      absoluteMidpointDifferenceSec: null,
      maximumAllowedMidpointDifferenceSec:
        policy.maximumCrossingMidpointDifferenceSec,
      passed: false,
      failureReason:
        "coarse and fine surrogate half-response crossings are both required",
    });
  }
  const tolerance = policy.timeComparisonToleranceSec;
  const overlap = Math.max(
    coarseBracket.lowerSecAfterIntervention,
    fineBracket.lowerSecAfterIntervention,
  ) <= Math.min(
    coarseBracket.upperSecAfterIntervention,
    fineBracket.upperSecAfterIntervention,
  ) + tolerance;
  const midpointDifference = Math.abs(
    coarseBracket.midpointSecAfterIntervention
      - fineBracket.midpointSecAfterIntervention,
  );
  const passed = overlap || midpointDifference
    <= policy.maximumCrossingMidpointDifferenceSec + tolerance;
  return Object.freeze({
    coarse: coarseBracket,
    fine: fineBracket,
    bothCrossingsPresent: true,
    bracketsOverlap: overlap,
    absoluteMidpointDifferenceSec: midpointDifference,
    maximumAllowedMidpointDifferenceSec:
      policy.maximumCrossingMidpointDifferenceSec,
    passed,
    failureReason: passed
      ? null
      : "surrogate half-response brackets neither overlap nor have midpoints within one accepted window",
  });
}

function compareFinalNormalizedResponse(
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
): CoronaryV3ReducedPressureFinalResponseComparisonV2 {
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2;
  const coarseBaseline = coarse.metrics.baseline
    .meanPressureFlowMmHgSecPerMl;
  const fineBaseline = fine.metrics.baseline.meanPressureFlowMmHgSecPerMl;
  const coarseFinal = coarse.metrics.final.meanPressureFlowMmHgSecPerMl;
  const fineFinal = fine.metrics.final.meanPressureFlowMmHgSecPerMl;
  const baselinesUsable = Math.abs(coarseBaseline)
      > policy.minimumAbsoluteBaselinePressureFlowMmHgSecPerMl
    && Math.abs(fineBaseline)
      > policy.minimumAbsoluteBaselinePressureFlowMmHgSecPerMl;
  if (!baselinesUsable) {
    return finalResponseFailure(
      coarseBaseline,
      fineBaseline,
      coarseFinal,
      fineFinal,
      null,
      null,
      "baseline pressure-flow denominator is zero or below the declared floor",
    );
  }
  const coarseNormalized = (coarseFinal - coarseBaseline) / coarseBaseline;
  const fineNormalized = (fineFinal - fineBaseline) / fineBaseline;
  if (!Number.isFinite(coarseNormalized) || !Number.isFinite(fineNormalized)) {
    return finalResponseFailure(
      coarseBaseline,
      fineBaseline,
      coarseFinal,
      fineFinal,
      null,
      null,
      "normalized final response is nonfinite",
    );
  }
  if (Math.abs(fineNormalized)
      <= policy.minimumAbsoluteFineNormalizedResponse) {
    return finalResponseFailure(
      coarseBaseline,
      fineBaseline,
      coarseFinal,
      fineFinal,
      coarseNormalized,
      fineNormalized,
      "fine normalized response denominator is zero or below the declared floor",
    );
  }
  const relativeDifference = Math.abs(coarseNormalized - fineNormalized)
    / Math.abs(fineNormalized);
  const passed = Number.isFinite(relativeDifference)
    && relativeDifference
      <= policy.maximumFinalNormalizedResponseRelativeDifference;
  return Object.freeze({
    coarseBaselinePressureFlowMmHgSecPerMl: coarseBaseline,
    fineBaselinePressureFlowMmHgSecPerMl: fineBaseline,
    coarseFinalPressureFlowMmHgSecPerMl: coarseFinal,
    fineFinalPressureFlowMmHgSecPerMl: fineFinal,
    coarseNormalizedResponse: coarseNormalized,
    fineNormalizedResponse: fineNormalized,
    relativeDifference,
    maximumAllowedRelativeDifference:
      policy.maximumFinalNormalizedResponseRelativeDifference,
    denominatorGatePassed: true,
    passed,
    failureReason: passed
      ? null
      : "final normalized response relative difference exceeds two percent",
  });
}

function finalResponseFailure(
  coarseBaseline: number,
  fineBaseline: number,
  coarseFinal: number,
  fineFinal: number,
  coarseNormalized: number | null,
  fineNormalized: number | null,
  reason: string,
): CoronaryV3ReducedPressureFinalResponseComparisonV2 {
  return Object.freeze({
    coarseBaselinePressureFlowMmHgSecPerMl: coarseBaseline,
    fineBaselinePressureFlowMmHgSecPerMl: fineBaseline,
    coarseFinalPressureFlowMmHgSecPerMl: coarseFinal,
    fineFinalPressureFlowMmHgSecPerMl: fineFinal,
    coarseNormalizedResponse: coarseNormalized,
    fineNormalizedResponse: fineNormalized,
    relativeDifference: null,
    maximumAllowedRelativeDifference:
      CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2
        .maximumFinalNormalizedResponseRelativeDifference,
    denominatorGatePassed: false,
    passed: false,
    failureReason: reason,
  });
}

function compareFirstFiveWindowMaximumAbsoluteTransient(
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
): CoronaryV3ReducedPressureFirstFiveWindowTransientComparisonV2 {
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2;
  const coarseSummary = summarizeFirstFiveWindowTransient(coarse);
  const fineSummary = summarizeFirstFiveWindowTransient(fine);
  const shared = {
    definition:
      "direction-independent-maximum-absolute-transient-from-baseline" as const,
    requiredAcceptedWindowCount: policy.firstFiveAcceptedWindowCount,
    coarseContributingAcceptedWindowCount: coarseSummary.windowCount,
    fineContributingAcceptedWindowCount: fineSummary.windowCount,
    coarseCoveragePassed: coarseSummary.coveragePassed,
    fineCoveragePassed: fineSummary.coveragePassed,
    coarseBaselinePressureFlowMmHgSecPerMl: coarseSummary.baseline,
    fineBaselinePressureFlowMmHgSecPerMl: fineSummary.baseline,
    coarseExtremum: coarseSummary.extremum,
    fineExtremum: fineSummary.extremum,
    coarseMaximumAbsoluteTransientMmHgSecPerMl:
      coarseSummary.maximumAbsoluteTransient,
    fineMaximumAbsoluteTransientMmHgSecPerMl:
      fineSummary.maximumAbsoluteTransient,
    maximumAllowedRelativeDifference:
      policy.maximumFirstFiveWindowAbsoluteTransientRelativeDifference,
    oppositeDirectionExcursionRequired: false as const,
  };
  if (!coarseSummary.coveragePassed || !fineSummary.coveragePassed) {
    return Object.freeze({
      ...shared,
      relativeDifference: null,
      denominatorGatePassed: false,
      passed: false,
      failureReason:
        "coarse and fine observations must each cover exactly the first five consecutive accepted windows",
    });
  }
  const coarseAmplitude = coarseSummary.maximumAbsoluteTransient!;
  const fineAmplitude = fineSummary.maximumAbsoluteTransient!;
  const denominatorGatePassed = fineAmplitude
    > policy.minimumAbsoluteFineFirstFiveWindowTransientMmHgSecPerMl;
  if (!denominatorGatePassed) {
    return Object.freeze({
      ...shared,
      relativeDifference: null,
      denominatorGatePassed: false,
      passed: false,
      failureReason:
        "fine first-five-window maximum absolute transient is zero or below the declared floor",
    });
  }
  const relativeDifference = Math.abs(coarseAmplitude - fineAmplitude)
    / Math.abs(fineAmplitude);
  const passed = Number.isFinite(relativeDifference)
    && relativeDifference
      <= policy.maximumFirstFiveWindowAbsoluteTransientRelativeDifference;
  return Object.freeze({
    ...shared,
    relativeDifference,
    denominatorGatePassed: true,
    passed,
    failureReason: passed
      ? null
      : "first-five-window maximum absolute transient relative difference exceeds five percent",
  });
}

type FirstFiveWindowTransientSummaryV2 = Readonly<{
  baseline: number;
  windowCount: number;
  coveragePassed: boolean;
  extremum: CoronaryV3ReducedPressureTransientExtremumV2 | null;
  maximumAbsoluteTransient: number | null;
}>;

function summarizeFirstFiveWindowTransient(
  sample: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
): FirstFiveWindowTransientSummaryV2 {
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2;
  const tolerance = policy.timeComparisonToleranceSec;
  const searchStart = sample.interventionTimeSec;
  const searchEnd = searchStart
    + policy.firstFiveAcceptedWindowCount * policy.acceptedWindowDurationSec;
  const windows = sample.metrics.beatObservables.filter((beat) =>
    beat.endTimeSec > searchStart + tolerance
    && beat.startTimeSec < searchEnd - tolerance);
  const coveragePassed = firstFiveWindowCoveragePassed(
    windows,
    searchStart,
    searchEnd,
  );
  const baseline = sample.metrics.baseline.meanPressureFlowMmHgSecPerMl;
  if (!coveragePassed || !Number.isFinite(baseline)) {
    return Object.freeze({
      baseline,
      windowCount: windows.length,
      coveragePassed: false,
      extremum: null,
      maximumAbsoluteTransient: null,
    });
  }
  let selected = windows[0]!;
  let selectedSigned = selected.pressureFlowMmHgSecPerMl - baseline;
  for (const window of windows.slice(1)) {
    const signed = window.pressureFlowMmHgSecPerMl - baseline;
    if (Math.abs(signed) > Math.abs(selectedSigned)) {
      selected = window;
      selectedSigned = signed;
    }
  }
  const maximumAbsoluteTransient = Math.abs(selectedSigned);
  const extremum = Object.freeze({
    beatIndex: selected.beatIndex,
    startSecAfterIntervention: selected.startTimeSec - searchStart,
    endSecAfterIntervention: selected.endTimeSec - searchStart,
    pressureFlowMmHgSecPerMl: selected.pressureFlowMmHgSecPerMl,
    signedTransientFromBaselineMmHgSecPerMl: selectedSigned,
    absoluteTransientFromBaselineMmHgSecPerMl: maximumAbsoluteTransient,
  });
  if (!Object.values(extremum).every(Number.isFinite)) {
    return Object.freeze({
      baseline,
      windowCount: windows.length,
      coveragePassed: false,
      extremum: null,
      maximumAbsoluteTransient: null,
    });
  }
  return Object.freeze({
    baseline,
    windowCount: windows.length,
    coveragePassed: true,
    extremum,
    maximumAbsoluteTransient,
  });
}

function firstFiveWindowCoveragePassed(
  windows: readonly CoronaryStepResponseBeatObservableV1[],
  searchStart: number,
  searchEnd: number,
): boolean {
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2;
  const tolerance = policy.timeComparisonToleranceSec;
  if (windows.length !== policy.firstFiveAcceptedWindowCount) return false;
  if (Math.abs(windows[0]!.startTimeSec - searchStart) > tolerance) {
    return false;
  }
  if (Math.abs(windows.at(-1)!.endTimeSec - searchEnd) > tolerance) {
    return false;
  }
  return windows.every((window, index) => {
    const previous = windows[index - 1];
    return Number.isFinite(window.pressureFlowMmHgSecPerMl)
      && Math.abs(
        window.endTimeSec - window.startTimeSec
          - policy.acceptedWindowDurationSec,
      ) <= tolerance
      && (previous === undefined
        || Math.abs(window.startTimeSec - previous.endTimeSec) <= tolerance);
  });
}

function relativeBracket(
  bracket: CoronaryStepResponseCrossingBracketV1 | null,
  interventionTimeSec: number,
): CoronaryV3RelativeCrossingBracketV2 | null {
  if (bracket === null) return null;
  const lower = bracket.lowerTimeSec - interventionTimeSec;
  const upper = bracket.upperTimeSec - interventionTimeSec;
  if (!Number.isFinite(lower) || !Number.isFinite(upper)
    || lower < -CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2
      .timeComparisonToleranceSec
    || upper < lower) {
    return null;
  }
  return Object.freeze({
    lowerSecAfterIntervention: lower,
    upperSecAfterIntervention: upper,
    midpointSecAfterIntervention: (lower + upper) / 2,
  });
}

function resolveHarnessArm(
  harness: CoronaryV3ReducedPressureStepResponseV1,
  armId: CoronaryV3ReducedPressureStepArmIdV2,
): CoronaryV3ReducedPressureCharacterizationArmV1 {
  switch (armId) {
    case "80-to-100:tone-active": return harness.up.toneActive;
    case "80-to-100:tone-frozen": return harness.up.toneFrozen;
    case "100-to-80:tone-active": return harness.down.toneActive;
    case "100-to-80:tone-frozen": return harness.down.toneFrozen;
  }
}

function freezeArmRecord<T>(
  map: (armId: CoronaryV3ReducedPressureStepArmIdV2) => T,
): Readonly<Record<CoronaryV3ReducedPressureStepArmIdV2, T>> {
  return Object.freeze(Object.fromEntries(
    CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.map(
      (armId) => [armId, map(armId)],
    ),
  )) as Readonly<Record<CoronaryV3ReducedPressureStepArmIdV2, T>>;
}

function validateSample(
  sample: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  label: string,
): void {
  if (!CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.includes(sample.armId)) {
    throw new Error(`${label} coronary numerical sample arm is unsupported`);
  }
  if (!Number.isFinite(sample.dtSec) || sample.dtSec <= 0) {
    throw new Error(`${label} coronary numerical sample dt must be positive`);
  }
  if (!Number.isFinite(sample.interventionTimeSec)
    || sample.interventionTimeSec < 0) {
    throw new Error(`${label} intervention time must be finite and nonnegative`);
  }
  if (typeof sample.allFinite !== "boolean"
    || typeof sample.conservationToleranceSatisfied !== "boolean") {
    throw new Error(`${label} numerical integrity flags must be booleans`);
  }
}

function freezeProtocol(
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
): CoronaryV3ReducedPressureStepProtocolV1 {
  return Object.freeze({
    ...protocol,
    fixedIntramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
      LAD: Object.freeze({
        ...protocol.fixedIntramyocardialPressureMmHgByTerritoryLayer.LAD,
      }),
      LCx: Object.freeze({
        ...protocol.fixedIntramyocardialPressureMmHgByTerritoryLayer.LCx,
      }),
      RCA: Object.freeze({
        ...protocol.fixedIntramyocardialPressureMmHgByTerritoryLayer.RCA,
      }),
    }),
  });
}
