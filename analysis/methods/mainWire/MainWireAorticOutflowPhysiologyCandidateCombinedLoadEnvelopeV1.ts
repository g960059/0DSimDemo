import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  evaluateMainWireAorticOutflowExternalReferenceCompatibilityV1,
  type MainWireAorticOutflowExternalReferenceCompatibilityV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowExternalReferenceCompatibilityV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
  type MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_AXES_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
  resolveMainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1,
  type MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1,
  type MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV1";
import type {
  MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-physiology-candidate-combined-load-envelope-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    factorialDecomposition:
      "complete-two-level-Walsh-Hadamard-orthogonal-contrasts" as const,
    factorialEffectDefinition:
      "two-times-mean-response-times-product-of-coded-axis-levels" as const,
    mainEffectMeaning: "mean-high-minus-mean-low" as const,
    higherOrderEffectMeaning:
      "standard-two-level-factorial-interaction-contrast" as const,
    factorialDecompositionIsExactAcrossEvaluatedCorners: true as const,
    externalIntervalsAreDescriptiveFalsificationScreens: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeInputV1 =
  Readonly<{
    contextId: string;
    run:
      MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1;
  }>;

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1 =
  Readonly<{
    ejectionTimeSec: number;
    accelerationTimeSec: number;
    aorticForwardVolumeMl: number;
    forwardFlowContinuityEquivalentEoaCm2: number;
    meanGradientEquivalentEoaCm2: number;
    peakVenaContractaVelocityMPerSec: number;
    meanDopplerGradientMmHg: number;
    peakDopplerGradientMmHg: number;
    meanAorticPressureMmHg: number;
    leftVentricularEjectionFraction01: number;
  }>;

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1 =
  Readonly<{
    isovolumicContractionTimeSec: number | null;
    ivrtLikeSec: number | null;
    relaxationTauSec: number | null;
    leftVentricularTeiIndex: number | null;
    maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec: number | null;
    maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec: number | null;
  }>;

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialEffectV1 =
  Readonly<{
    codedCoefficient: number;
    orthogonalEffect: number;
    orthogonalEffectFractionOfGrandMean: number;
  }>;

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialTermV1 =
  Readonly<{
    termId: string;
    order: number;
    axes:
      readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1[];
    metrics: Readonly<Record<
      keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1,
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialEffectV1
    >>;
    diastolicMetrics: Readonly<Record<
      keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1,
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialEffectV1
        | null
    >>;
  }>;

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadArmV1 =
  Readonly<{
    context:
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1;
    protocolIdentityHash: string;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    coreMetrics:
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1;
    diastolicMetrics:
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1;
    externalCompatibility:
      MainWireAorticOutflowExternalReferenceCompatibilityV1;
    diastolicFlow:
      MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1;
    strictExternalIntervalFailures: readonly (
      | "ejection-time"
      | "acceleration-time"
      | "peak-velocity"
      | "mean-gradient"
    )[];
  }>;

type NumericRange = Readonly<{ minimum: number; maximum: number }>;

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_V1_ID;
    candidateId: string;
    twitchRetentionCandidateId:
      MainWireVentricularLandSourceTwitchRetentionCandidateIdV1;
    arms:
      readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadArmV1[];
    ranges: Readonly<Record<
      keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1,
      NumericRange
    >>;
    diastolicRanges: Readonly<Record<
      keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1,
      NumericRange | null
    >>;
    grandMeans:
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1;
    diastolicGrandMeans:
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1;
    factorialTerms:
      readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialTermV1[];
    maximumAbsoluteFactorialReconstructionResidual:
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1;
    strictExternalIntervalMatchCounts: Readonly<{
      totalArmCount: number;
      ejectionTime: number;
      accelerationTime: number;
      peakVenaContractaVelocity: number;
      meanDopplerGradient: number;
      allPrimary: number;
    }>;
    strictFailureContextIds: readonly string[];
    allRunsPeriod1AndIntegrated: boolean;
    morphologyPreservedAcrossEnvelope: boolean;
    allDiastolicFlowReadbacksAvailable: boolean;
    allProtocolIdentitiesDistinct: boolean;
    allGradientAndVelocityIntervalsMatched: boolean;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1;
  }>;

const CORE_METRIC_KEYS = Object.freeze([
  "ejectionTimeSec",
  "accelerationTimeSec",
  "aorticForwardVolumeMl",
  "forwardFlowContinuityEquivalentEoaCm2",
  "meanGradientEquivalentEoaCm2",
  "peakVenaContractaVelocityMPerSec",
  "meanDopplerGradientMmHg",
  "peakDopplerGradientMmHg",
  "meanAorticPressureMmHg",
  "leftVentricularEjectionFraction01",
] as const satisfies readonly (
  keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1
)[]);

const DIASTOLIC_METRIC_KEYS = Object.freeze([
  "isovolumicContractionTimeSec",
  "ivrtLikeSec",
  "relaxationTauSec",
  "leftVentricularTeiIndex",
  "maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec",
  "maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec",
] as const satisfies readonly (
  keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1
)[]);

export function measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1(
  inputs:
    readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeInputV1[],
  expectedTwitchRetentionCandidateId:
    MainWireVentricularLandSourceTwitchRetentionCandidateIdV1 =
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1
        .twitchRetentionCandidateId,
): MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1 {
  const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1;
  const byId = new Map<string,
    MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeInputV1>();
  for (const input of inputs) {
    if (byId.has(input.contextId)) {
      throw new Error("duplicate combined-load context: " + input.contextId);
    }
    assertRunMatchesContext(input, expectedTwitchRetentionCandidateId);
    byId.set(input.contextId, input);
  }
  for (const context of
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1) {
    if (!byId.has(context.contextId)) {
      throw new Error("missing combined-load context: " + context.contextId);
    }
  }
  if (
    byId.size
    !== MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
      .length
  ) {
    throw new Error("combined-load envelope has unexpected arms");
  }

  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
      .map((context) => {
        const input = byId.get(context.contextId)!;
        const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
          input.run.periodicResult,
          input.run.calciumDriveParams,
          context.contextId,
        );
        const diastolicFlow =
          measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
            input.run.periodicResult,
          );
        const externalCompatibility =
          evaluateMainWireAorticOutflowExternalReferenceCompatibilityV1({
            aorticEjectionTimeProxySec: cycle.aorticEjectionTimeProxySec,
            aorticAccelerationTimeProxySec:
              cycle.timeFromAorticFlowOnsetToPeakSec,
            peakVenaContractaVelocityMPerSec:
              cycle.peakVenaContractaVelocityMPerSec,
            timeMeanSimplifiedDopplerGradientMmHg:
              cycle.meanDopplerGradientMmHg,
            configuredMaximumForwardEoaCm2:
              candidate.aorticMaximumForwardEoaCm2,
          });
        const coreMetrics = coreMetricsFromCycle(cycle);
        const diastolicMetrics = Object.freeze({
          isovolumicContractionTimeSec:
            cycle.leftVentricularIsovolumicContractionTimeSec,
          ivrtLikeSec:
            diastolicFlow.value?.relaxation.ivrtLikeSec ?? null,
          relaxationTauSec:
            diastolicFlow.value?.relaxation.relaxationTauSec ?? null,
          leftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
          maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
            cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
          maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
            cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
        });
        const failures: (
          | "ejection-time"
          | "acceleration-time"
          | "peak-velocity"
          | "mean-gradient"
        )[] = [];
        if (!externalCompatibility.primary.aorticEjectionTimeProxySec
          .withinComparisonInterval) failures.push("ejection-time");
        if (!externalCompatibility.primary.aorticAccelerationTimeProxySec
          .withinComparisonInterval) failures.push("acceleration-time");
        if (!externalCompatibility.primary.peakVenaContractaVelocityMPerSec
          .withinComparisonInterval) failures.push("peak-velocity");
        if (!externalCompatibility.corroboratingNotScored
          .timeMeanSimplifiedDopplerGradientMmHg
          .withinComparisonInterval) failures.push("mean-gradient");
        return Object.freeze({
          context,
          protocolIdentityHash: input.run.periodicResult.protocolIdentityHash,
          cycle,
          coreMetrics,
          diastolicMetrics,
          externalCompatibility,
          diastolicFlow,
          strictExternalIntervalFailures: Object.freeze(failures),
        });
      }),
  );
  const grandMeans = mapCoreMetrics((key) =>
    mean(arms.map((arm) => arm.coreMetrics[key])));
  const diastolicGrandMeans = mapDiastolicMetrics((key) =>
    nullableMean(arms.map((arm) => arm.diastolicMetrics[key])));
  const factorialTerms = Object.freeze(factorialAxisSubsets().map((axes) =>
    Object.freeze({
      termId: axes.join("*"),
      order: axes.length,
      axes,
      metrics: mapCoreMetricEffects((key) => factorialEffect(
        arms,
        axes,
        (arm) => arm.coreMetrics[key],
        grandMeans[key],
      )),
      diastolicMetrics: mapDiastolicMetricEffects((key) =>
        factorialNullableEffect(
          arms,
          axes,
          (arm) => arm.diastolicMetrics[key],
          diastolicGrandMeans[key],
        )),
    })));

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_V1_ID,
    candidateId: candidate.candidateId,
    twitchRetentionCandidateId: expectedTwitchRetentionCandidateId,
    arms,
    ranges: mapCoreMetrics((key) =>
      range(arms.map((arm) => arm.coreMetrics[key]))),
    diastolicRanges: mapDiastolicMetrics((key) =>
      nullableRange(arms.map((arm) => arm.diastolicMetrics[key]))),
    grandMeans,
    diastolicGrandMeans,
    factorialTerms,
    maximumAbsoluteFactorialReconstructionResidual: mapCoreMetrics((key) =>
      Math.max(...arms.map((arm) => Math.abs(
        arm.coreMetrics[key]
        - reconstructCoreMetric(grandMeans[key], factorialTerms, arm, key),
      )))),
    strictExternalIntervalMatchCounts: Object.freeze({
      totalArmCount: arms.length,
      ejectionTime: arms.filter((arm) =>
        arm.externalCompatibility.primary.aorticEjectionTimeProxySec
          .withinComparisonInterval).length,
      accelerationTime: arms.filter((arm) =>
        arm.externalCompatibility.primary.aorticAccelerationTimeProxySec
          .withinComparisonInterval).length,
      peakVenaContractaVelocity: arms.filter((arm) =>
        arm.externalCompatibility.primary.peakVenaContractaVelocityMPerSec
          .withinComparisonInterval).length,
      meanDopplerGradient: arms.filter((arm) =>
        arm.externalCompatibility.corroboratingNotScored
          .timeMeanSimplifiedDopplerGradientMmHg
          .withinComparisonInterval).length,
      allPrimary: arms.filter((arm) =>
        arm.externalCompatibility.allPrimaryComparisonIntervalsMatched).length,
    }),
    strictFailureContextIds: Object.freeze(arms
      .filter((arm) => arm.strictExternalIntervalFailures.length > 0)
      .map((arm) => arm.context.contextId)),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossEnvelope: arms.every((arm) =>
      arm.cycle.aorticFlowPeakCountAboveFivePercent === 1),
    allDiastolicFlowReadbacksAvailable: arms.every((arm) =>
      arm.diastolicFlow.value !== null),
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    allGradientAndVelocityIntervalsMatched: arms.every((arm) =>
      arm.externalCompatibility.primary.peakVenaContractaVelocityMPerSec
        .withinComparisonInterval
      && arm.externalCompatibility.corroboratingNotScored
        .timeMeanSimplifiedDopplerGradientMmHg.withinComparisonInterval),
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  });
}

function assertRunMatchesContext(
  input:
    MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeInputV1,
  expectedTwitchRetentionCandidateId:
    MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
): void {
  const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1;
  const expected =
    resolveMainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1(
      input.contextId,
    );
  const run = input.run;
  if (
    candidate.trefForceLoadProfileId !== "tref-force-load-baseline"
    || run.sourceTraceProfile.profileId !== candidate.calciumProfileId
    || run.kuwProfile.profileId !== candidate.kuwProfileId
    || run.sarcomereReferenceProfile.profileId
      !== candidate.sarcomereReferenceProfileId
    || run.sourceTwitchRetentionCandidate.candidateId
      !== expectedTwitchRetentionCandidateId
    || run.sourceVelocityDistortionProfile.profileId
      !== candidate.sourceVelocityDistortionProfileId
    || run.calciumSensitivityLengthProfile.profileId
      !== candidate.calciumSensitivityLengthProfileId
    || run.complianceProfile.profileId !== expected.complianceProfileId
    || run.placementProfile?.profileId
      !== candidate.characteristicResistancePlacementProfileId
    || run.rootInertanceProfile?.profileId
      !== candidate.rootInertanceProfileId
    || run.circulatoryLoadPoint.pointId !== expected.circulatoryLoadPointId
    || run.stressedVenousVolumePoint.pointId
      !== expected.stressedVenousVolumePointId
    || run.trefForceLoadProfile.profileId !== expected.trefForceLoadProfileId
  ) {
    throw new Error(input.contextId
      + " does not match the fixed combined-load protocol");
  }
}

function coreMetricsFromCycle(
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1 {
  return Object.freeze({
    ejectionTimeSec: cycle.aorticEjectionTimeProxySec,
    accelerationTimeSec: cycle.timeFromAorticFlowOnsetToPeakSec,
    aorticForwardVolumeMl: cycle.aorticForwardVolumeMl,
    forwardFlowContinuityEquivalentEoaCm2:
      cycle.aorticForwardFlowContinuityEquivalentEoaCm2,
    meanGradientEquivalentEoaCm2:
      cycle.aorticMeanGradientEquivalentEoaCm2,
    peakVenaContractaVelocityMPerSec:
      cycle.peakVenaContractaVelocityMPerSec,
    meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
    meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
    leftVentricularEjectionFraction01:
      cycle.leftVentricularEjectionFraction01,
  });
}

function factorialAxisSubsets():
  readonly (readonly
    MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1[])[] {
  const axes =
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_AXES_V1;
  return Object.freeze(Array.from(
    { length: (1 << axes.length) - 1 },
    (_, zeroBasedMask) => Object.freeze(axes.filter(
      (_, index) => ((zeroBasedMask + 1) & (1 << index)) !== 0,
    )),
  ));
}

function factorialEffect(
  arms: readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadArmV1[],
  axes: readonly
    MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1[],
  read: (
    arm: MainWireAorticOutflowPhysiologyCandidateCombinedLoadArmV1,
  ) => number,
  grandMean: number,
): MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialEffectV1 {
  const codedCoefficient = mean(arms.map((arm) =>
    read(arm) * axes.reduce(
      (product, axis) => product * arm.context.codes[axis],
      1,
    )));
  const orthogonalEffect = 2 * codedCoefficient;
  return Object.freeze({
    codedCoefficient,
    orthogonalEffect,
    orthogonalEffectFractionOfGrandMean:
      orthogonalEffect / Math.max(Math.abs(grandMean), 1e-12),
  });
}

function factorialNullableEffect(
  arms: readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadArmV1[],
  axes: readonly
    MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1[],
  read: (
    arm: MainWireAorticOutflowPhysiologyCandidateCombinedLoadArmV1,
  ) => number | null,
  grandMean: number | null,
): MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialEffectV1
  | null {
  if (grandMean === null || arms.some((arm) => read(arm) === null)) return null;
  return factorialEffect(arms, axes, (arm) => read(arm)!, grandMean);
}

function reconstructCoreMetric(
  grandMean: number,
  terms:
    readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialTermV1[],
  arm: MainWireAorticOutflowPhysiologyCandidateCombinedLoadArmV1,
  key:
    keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1,
): number {
  return grandMean + terms.reduce((sum, term) =>
    sum + term.metrics[key].codedCoefficient * term.axes.reduce(
      (product, axis) => product * arm.context.codes[axis],
      1,
    ), 0);
}

function mapCoreMetrics<T>(
  read: (
    key:
      keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1,
  ) => T,
): Readonly<Record<
  keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1,
  T
>> {
  return Object.freeze(Object.fromEntries(
    CORE_METRIC_KEYS.map((key) => [key, read(key)]),
  )) as Readonly<Record<
    keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1,
    T
  >>;
}

function mapDiastolicMetrics<T>(
  read: (
    key:
      keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1,
  ) => T,
): Readonly<Record<
  keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1,
  T
>> {
  return Object.freeze(Object.fromEntries(
    DIASTOLIC_METRIC_KEYS.map((key) => [key, read(key)]),
  )) as Readonly<Record<
    keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1,
    T
  >>;
}

function mapCoreMetricEffects(
  read: (
    key:
      keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadCoreMetricsV1,
  ) => MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialEffectV1,
): MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialTermV1[
  "metrics"
] {
  return mapCoreMetrics(read);
}

function mapDiastolicMetricEffects(
  read: (
    key:
      keyof MainWireAorticOutflowPhysiologyCandidateCombinedLoadDiastolicMetricsV1,
  ) => MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialEffectV1
    | null,
): MainWireAorticOutflowPhysiologyCandidateCombinedLoadFactorialTermV1[
  "diastolicMetrics"
] {
  return mapDiastolicMetrics(read);
}

function range(values: readonly number[]): NumericRange {
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}

function nullableRange(values: readonly (number | null)[]): NumericRange | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length === 0 ? null : range(available);
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nullableMean(values: readonly (number | null)[]): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length === values.length ? mean(available) : null;
}
