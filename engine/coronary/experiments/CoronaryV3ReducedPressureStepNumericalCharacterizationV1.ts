import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1,
  runCoronaryV3ReducedPressureStepResponseV1,
  type CoronaryV3ReducedPressureCharacterizationArmV1,
  type CoronaryV3ReducedPressureStepProtocolV1,
  type CoronaryV3ReducedPressureStepResponseV1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepResponseV1";
import {
  describeCoronaryV3StepResponseMetricsV1,
  type CoronaryStepResponseCrossingBracketV1,
  type CoronaryStepResponseMetricsResultV1,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";

export const CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID =
  "coronary-v3-reduced-pressure-step-coarse-fine-numerical-characterization-v1" as const;

export const CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V1 = Object.freeze([
  "80-to-100:tone-active",
  "80-to-100:tone-frozen",
  "100-to-80:tone-active",
  "100-to-80:tone-frozen",
] as const);

export type CoronaryV3ReducedPressureStepArmIdV1 =
  (typeof CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V1)[number];

const FIXED_IMP_MM_HG_BY_TERRITORY_LAYER_V1 = Object.freeze({
  LAD: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
  LCx: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
  RCA: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
});

/** Declared protocol inputs; neither fine output nor paper t50 selects them. */
export const CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V1 =
  freezeProtocol({
    dtSec: 0.002,
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
      FIXED_IMP_MM_HG_BY_TERRITORY_LAYER_V1,
    maximumAbsoluteInitializerContinuityResidualMlPerSec: 1e-8,
    maximumAbsoluteStepLedgerResidualMl: 1e-8,
    maximumAbsoluteNodeContinuityResidualMl: 1e-8,
  });

export const CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V1 =
  freezeProtocol({
    ...CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V1,
    dtSec: 0.001,
  });

export const CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1 =
  Object.freeze({
    policyId:
      "coronary-v3-reduced-pressure-step-preregistered-numerical-qa-v1" as const,
    coarseDtSec: 0.002 as const,
    fineDtSec: 0.001 as const,
    acceptedWindowDurationSec: 1 as const,
    comparisonTimeOrigin: "seconds-after-own-intervention" as const,
    crossingObservable:
      "surrogate-pressure-flow-baseline-final-half-response-fit-free-bracket" as const,
    crossingRequirement:
      "both-brackets-required-and-overlap-or-midpoints-within-one-window" as const,
    maximumCrossingMidpointDifferenceSec: 1 as const,
    finalNormalizedResponseDefinition:
      "(final-pressure-flow-minus-baseline-pressure-flow)/baseline-pressure-flow" as const,
    coarseFineRelativeDifferenceDefinition:
      "absolute-coarse-minus-fine-divided-by-absolute-fine" as const,
    maximumFinalNormalizedResponseRelativeDifference: 0.02 as const,
    maximumPassiveOppositeAmplitudeRelativeDifference: 0.05 as const,
    minimumAbsoluteBaselinePressureFlowMmHgSecPerMl: 1e-9 as const,
    minimumAbsoluteFineNormalizedResponse: 1e-9 as const,
    minimumAbsolutePassiveOppositeAmplitudeMmHgSecPerMl: 1e-9 as const,
    timeComparisonToleranceSec: 1e-9 as const,
    missingCrossingPasses: false as const,
    missingOppositeExcursionPasses: false as const,
    nearZeroDenominatorPasses: false as const,
    numericalQaOnly: true as const,
    biologicalTolerance: false as const,
    originalPaperT50ComparisonApplied: false as const,
    policyDeclaredBeforeFineOutput: true as const,
  });

export const CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V1 =
  Object.freeze({
    purpose: "deterministic-coarse-fine-numerical-qa" as const,
    sourceHarnessClaim:
      CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1,
    allFourArmsCompared: true as const,
    exactLeftMainCannulaRepresented: false as const,
    distalZeroFlowWedgeRepresented: false as const,
    constantFlowBoundaryRepresented: false as const,
    originalPaperT50Compared: false as const,
    dankelmanProtocolReproduced: false as const,
    parameterFittingApplied: false as const,
    fineOutputUsedToChoosePolicy: false as const,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    clinicalValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  } as const);

export type CoronaryV3ReducedPressureStepArmNumericalSampleV1 = Readonly<{
  armId: CoronaryV3ReducedPressureStepArmIdV1;
  dtSec: number;
  interventionTimeSec: number;
  metrics: CoronaryStepResponseMetricsResultV1;
  allFinite: boolean;
  conservationToleranceSatisfied: boolean;
}>;

export type CoronaryV3RelativeCrossingBracketV1 = Readonly<{
  lowerSecAfterIntervention: number;
  upperSecAfterIntervention: number;
  midpointSecAfterIntervention: number;
}>;

export type CoronaryV3ReducedPressureCrossingComparisonV1 = Readonly<{
  coarse: CoronaryV3RelativeCrossingBracketV1 | null;
  fine: CoronaryV3RelativeCrossingBracketV1 | null;
  bothCrossingsPresent: boolean;
  bracketsOverlap: boolean | null;
  absoluteMidpointDifferenceSec: number | null;
  maximumAllowedMidpointDifferenceSec: 1;
  passed: boolean;
  failureReason: string | null;
}>;

export type CoronaryV3ReducedPressureFinalResponseComparisonV1 = Readonly<{
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

export type CoronaryV3ReducedPressurePassiveAmplitudeComparisonV1 = Readonly<{
  coarseOppositeDirectionObserved: boolean;
  fineOppositeDirectionObserved: boolean;
  coarseAbsoluteOppositeAmplitudeMmHgSecPerMl: number;
  fineAbsoluteOppositeAmplitudeMmHgSecPerMl: number;
  relativeDifference: number | null;
  maximumAllowedRelativeDifference: 0.05;
  denominatorGatePassed: boolean;
  passed: boolean;
  failureReason: string | null;
}>;

export type CoronaryV3ReducedPressureIntegrityComparisonV1 = Readonly<{
  coarseAllFinite: boolean;
  fineAllFinite: boolean;
  coarseConservationToleranceSatisfied: boolean;
  fineConservationToleranceSatisfied: boolean;
  passed: boolean;
}>;

export type CoronaryV3ReducedPressureSurrogateBoundaryComparisonV1 = Readonly<{
  coarseUsesVenousBoundarySurrogate: boolean;
  fineUsesVenousBoundarySurrogate: boolean;
  coarseExactDankelmanStationEstablished: boolean;
  fineExactDankelmanStationEstablished: boolean;
  coarseEligibleForDirectOriginalPaperT50Claim: false;
  fineEligibleForDirectOriginalPaperT50Claim: false;
  passed: boolean;
}>;

export type CoronaryV3ReducedPressureStepArmNumericalComparisonV1 = Readonly<{
  armId: CoronaryV3ReducedPressureStepArmIdV1;
  coarseDtSec: number;
  fineDtSec: number;
  dtBindingPassed: boolean;
  integrity: CoronaryV3ReducedPressureIntegrityComparisonV1;
  surrogateBoundary: CoronaryV3ReducedPressureSurrogateBoundaryComparisonV1;
  crossing: CoronaryV3ReducedPressureCrossingComparisonV1;
  finalNormalizedResponse: CoronaryV3ReducedPressureFinalResponseComparisonV1;
  passiveOppositeAmplitude: CoronaryV3ReducedPressurePassiveAmplitudeComparisonV1;
  numericalQaPassed: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3ReducedPressureStepAtDtResultV1 = Readonly<{
  role: "coarse" | "fine";
  dtSec: 0.002 | 0.001;
  protocol: CoronaryV3ReducedPressureStepProtocolV1;
  harness: CoronaryV3ReducedPressureStepResponseV1;
  armSamples: Readonly<Record<
    CoronaryV3ReducedPressureStepArmIdV1,
    CoronaryV3ReducedPressureStepArmNumericalSampleV1
  >>;
  allFiniteAndConserved: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3ReducedPressureStepNumericalCharacterizationV1 =
  Readonly<{
    characterizationId:
      typeof CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID;
    policy:
      typeof CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1;
    claim: typeof CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V1;
    coarse: CoronaryV3ReducedPressureStepAtDtResultV1;
    fine: CoronaryV3ReducedPressureStepAtDtResultV1;
    comparisonByArm: Readonly<Record<
      CoronaryV3ReducedPressureStepArmIdV1,
      CoronaryV3ReducedPressureStepArmNumericalComparisonV1
    >>;
    allFourArmNumericalQaPassed: boolean;
    numericalQaPassed: boolean;
    biologicalValidationEstablished: false;
    physiologicalAcceptanceEstablished: false;
    releaseAcceptanceEstablished: false;
  }>;

/** Runs the fixed coarse protocol before the fixed fine protocol. */
export function runCoronaryV3ReducedPressureStepNumericalCharacterizationV1():
CoronaryV3ReducedPressureStepNumericalCharacterizationV1 {
  const coarse = runAtDt(
    "coarse",
    CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V1,
  );
  const fine = runAtDt(
    "fine",
    CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V1,
  );
  const comparisonByArm = freezeArmRecord((armId) =>
    compareCoronaryV3ReducedPressureStepArmNumericsV1(
      coarse.armSamples[armId],
      fine.armSamples[armId],
    ));
  const allFourArmNumericalQaPassed =
    CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V1.every(
      (armId) => comparisonByArm[armId].numericalQaPassed,
    );
  const numericalQaPassed = coarse.allFiniteAndConserved
    && fine.allFiniteAndConserved
    && allFourArmNumericalQaPassed;
  return Object.freeze({
    characterizationId:
      CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID,
    policy: CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1,
    claim: CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V1,
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

/** Pure fail-closed comparator used independently of the expensive runners. */
export function compareCoronaryV3ReducedPressureStepArmNumericsV1(
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
): CoronaryV3ReducedPressureStepArmNumericalComparisonV1 {
  validateSample(coarse, "coarse");
  validateSample(fine, "fine");
  if (coarse.armId !== fine.armId) {
    throw new Error("coarse and fine coronary arm identities differ");
  }
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1;
  const dtBindingPassed = coarse.dtSec === policy.coarseDtSec
    && fine.dtSec === policy.fineDtSec;
  const integrity = compareIntegrity(coarse, fine);
  const surrogateBoundary = compareSurrogateBoundary(coarse, fine);
  const crossing = compareCrossing(coarse, fine);
  const finalNormalizedResponse = compareFinalNormalizedResponse(
    coarse,
    fine,
  );
  const passiveOppositeAmplitude = comparePassiveAmplitude(coarse, fine);
  const numericalQaPassed = dtBindingPassed
    && integrity.passed
    && surrogateBoundary.passed
    && crossing.passed
    && finalNormalizedResponse.passed
    && passiveOppositeAmplitude.passed;
  return Object.freeze({
    armId: coarse.armId,
    coarseDtSec: coarse.dtSec,
    fineDtSec: fine.dtSec,
    dtBindingPassed,
    integrity,
    surrogateBoundary,
    crossing,
    finalNormalizedResponse,
    passiveOppositeAmplitude,
    numericalQaPassed,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  });
}

function runAtDt(
  role: "coarse" | "fine",
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
): CoronaryV3ReducedPressureStepAtDtResultV1 {
  const harness = runCoronaryV3ReducedPressureStepResponseV1(protocol);
  const armSamples = freezeArmRecord((armId) => {
    const arm = resolveHarnessArm(harness, armId);
    return Object.freeze({
      armId,
      dtSec: protocol.dtSec,
      interventionTimeSec: arm.interventionTimeSec,
      metrics: describeCoronaryV3StepResponseMetricsV1(arm.metricInput),
      allFinite: arm.allFinite,
      conservationToleranceSatisfied:
        arm.conservationToleranceSatisfied,
    });
  });
  const allFiniteAndConserved =
    CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V1.every((armId) =>
      armSamples[armId].allFinite
      && armSamples[armId].conservationToleranceSatisfied);
  const expectedDt = role === "coarse" ? 0.002 : 0.001;
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
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
): CoronaryV3ReducedPressureIntegrityComparisonV1 {
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
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
): CoronaryV3ReducedPressureSurrogateBoundaryComparisonV1 {
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
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
): CoronaryV3ReducedPressureCrossingComparisonV1 {
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1;
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
      failureReason: "coarse and fine surrogate half-response crossings are both required",
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
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
): CoronaryV3ReducedPressureFinalResponseComparisonV1 {
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1;
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
): CoronaryV3ReducedPressureFinalResponseComparisonV1 {
  return Object.freeze({
    coarseBaselinePressureFlowMmHgSecPerMl: coarseBaseline,
    fineBaselinePressureFlowMmHgSecPerMl: fineBaseline,
    coarseFinalPressureFlowMmHgSecPerMl: coarseFinal,
    fineFinalPressureFlowMmHgSecPerMl: fineFinal,
    coarseNormalizedResponse: coarseNormalized,
    fineNormalizedResponse: fineNormalized,
    relativeDifference: null,
    maximumAllowedRelativeDifference:
      CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1
        .maximumFinalNormalizedResponseRelativeDifference,
    denominatorGatePassed: false,
    passed: false,
    failureReason: reason,
  });
}

function comparePassiveAmplitude(
  coarse: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
  fine: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
): CoronaryV3ReducedPressurePassiveAmplitudeComparisonV1 {
  const policy = CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1;
  const coarsePassive = coarse.metrics.passiveExtremum;
  const finePassive = fine.metrics.passiveExtremum;
  const coarseAmplitude =
    coarsePassive.absoluteOppositeAmplitudeFromBaselineMmHgSecPerMl;
  const fineAmplitude =
    finePassive.absoluteOppositeAmplitudeFromBaselineMmHgSecPerMl;
  const excursionsPresent = coarsePassive.oppositeDirectionObserved
    && finePassive.oppositeDirectionObserved;
  const denominatorsUsable = coarseAmplitude
      > policy.minimumAbsolutePassiveOppositeAmplitudeMmHgSecPerMl
    && fineAmplitude
      > policy.minimumAbsolutePassiveOppositeAmplitudeMmHgSecPerMl;
  if (!excursionsPresent || !denominatorsUsable) {
    return Object.freeze({
      coarseOppositeDirectionObserved:
        coarsePassive.oppositeDirectionObserved,
      fineOppositeDirectionObserved: finePassive.oppositeDirectionObserved,
      coarseAbsoluteOppositeAmplitudeMmHgSecPerMl: coarseAmplitude,
      fineAbsoluteOppositeAmplitudeMmHgSecPerMl: fineAmplitude,
      relativeDifference: null,
      maximumAllowedRelativeDifference:
        policy.maximumPassiveOppositeAmplitudeRelativeDifference,
      denominatorGatePassed: denominatorsUsable,
      passed: false,
      failureReason: !excursionsPresent
        ? "coarse and fine opposite-direction passive excursions are both required"
        : "passive opposite amplitude is zero or below the declared floor",
    });
  }
  const relativeDifference = Math.abs(coarseAmplitude - fineAmplitude)
    / Math.abs(fineAmplitude);
  const passed = Number.isFinite(relativeDifference)
    && relativeDifference
      <= policy.maximumPassiveOppositeAmplitudeRelativeDifference;
  return Object.freeze({
    coarseOppositeDirectionObserved:
      coarsePassive.oppositeDirectionObserved,
    fineOppositeDirectionObserved: finePassive.oppositeDirectionObserved,
    coarseAbsoluteOppositeAmplitudeMmHgSecPerMl: coarseAmplitude,
    fineAbsoluteOppositeAmplitudeMmHgSecPerMl: fineAmplitude,
    relativeDifference,
    maximumAllowedRelativeDifference:
      policy.maximumPassiveOppositeAmplitudeRelativeDifference,
    denominatorGatePassed: true,
    passed,
    failureReason: passed
      ? null
      : "passive opposite-amplitude relative difference exceeds five percent",
  });
}

function relativeBracket(
  bracket: CoronaryStepResponseCrossingBracketV1 | null,
  interventionTimeSec: number,
): CoronaryV3RelativeCrossingBracketV1 | null {
  if (bracket === null) return null;
  const lower = bracket.lowerTimeSec - interventionTimeSec;
  const upper = bracket.upperTimeSec - interventionTimeSec;
  if (!Number.isFinite(lower) || !Number.isFinite(upper)
    || lower < -CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1
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
  armId: CoronaryV3ReducedPressureStepArmIdV1,
): CoronaryV3ReducedPressureCharacterizationArmV1 {
  switch (armId) {
    case "80-to-100:tone-active": return harness.up.toneActive;
    case "80-to-100:tone-frozen": return harness.up.toneFrozen;
    case "100-to-80:tone-active": return harness.down.toneActive;
    case "100-to-80:tone-frozen": return harness.down.toneFrozen;
  }
}

function freezeArmRecord<T>(
  map: (armId: CoronaryV3ReducedPressureStepArmIdV1) => T,
): Readonly<Record<CoronaryV3ReducedPressureStepArmIdV1, T>> {
  return Object.freeze(Object.fromEntries(
    CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V1.map(
      (armId) => [armId, map(armId)],
    ),
  )) as Readonly<Record<CoronaryV3ReducedPressureStepArmIdV1, T>>;
}

function validateSample(
  sample: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
  label: string,
): void {
  if (!CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V1.includes(sample.armId)) {
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
