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
  MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1,
  resolveMainWireAorticOutflowSourceTwitchRetentionLoadContextV1,
  type MainWireAorticOutflowSourceTwitchRetentionLoadAxisV1,
  type MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1,
  type MainWireAorticOutflowSourceTwitchRetentionLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V3,
  type MainWireAorticOutflowCandidateProtocolV3,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV3";
import type {
  MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_ENVELOPE_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-source-twitch-retention-load-envelope-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    externalIntervalsAreDescriptiveFalsificationScreens: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeInputV1 =
  Readonly<{
    contextId:
      MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1;
    run:
      MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1;
  }>;

export type MainWireAorticOutflowSourceTwitchRetentionLoadArmV1 =
  Readonly<{
    context: MainWireAorticOutflowSourceTwitchRetentionLoadContextV1;
    protocolIdentityHash: string;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    externalCompatibility:
      MainWireAorticOutflowExternalReferenceCompatibilityV1;
    diastolicFlow:
      MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1;
    relativeChangeFromBaseline: Readonly<{
      ejectionTime: number;
      aorticForwardVolume: number;
      peakVenaContractaVelocity: number;
      meanDopplerGradient: number;
      peakDopplerGradient: number;
      meanAorticPressure: number;
    }>;
  }>;

type NumericRange = Readonly<{ minimum: number; maximum: number }>;

export type MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_ENVELOPE_ANALYSIS_V1_ID;
    candidateId: string;
    arms: readonly MainWireAorticOutflowSourceTwitchRetentionLoadArmV1[];
    ranges: Readonly<{
      ejectionTimeSec: NumericRange;
      accelerationTimeSec: NumericRange;
      aorticForwardVolumeMl: NumericRange;
      peakVenaContractaVelocityMPerSec: NumericRange;
      meanDopplerGradientMmHg: NumericRange;
      peakDopplerGradientMmHg: NumericRange;
      fullyOpenUniformFlowDopplerGradientLowerBoundMmHg: NumericRange;
      dynamicAreaDopplerPenaltyFactor: NumericRange;
      jetVelocityWaveformNonuniformityFactor: NumericRange;
      meanDopplerExcessOverFullyOpenUniformFlowFactor: NumericRange;
      meanAorticPressureMmHg: NumericRange;
      leftVentricularEjectionFraction01: NumericRange;
    }>;
    diastolicRanges: Readonly<{
      ivrtLikeSec: NumericRange | null;
      relaxationTauSec: NumericRange | null;
      mitralPeakEToARatio: NumericRange | null;
      mitralModeledVtiEToARatio: NumericRange | null;
      mitralEPeakToInterveningValleySec: NumericRange | null;
      pulmonaryVenousPeakSToDRatio: NumericRange | null;
      pulmonaryVenousVolumeSToDRatio: NumericRange | null;
      pulmonaryVenousAtrialReversalVolumeMl: NumericRange | null;
    }>;
    strictExternalIntervalMatchCounts: Readonly<{
      totalArmCount: number;
      ejectionTime: number;
      accelerationTime: number;
      peakVenaContractaVelocity: number;
      meanDopplerGradient: number;
      allPrimary: number;
    }>;
    maximumAbsoluteRelativeChangeFromBaseline: Readonly<{
      ejectionTime: number;
      aorticForwardVolume: number;
      peakVenaContractaVelocity: number;
      meanDopplerGradient: number;
      peakDopplerGradient: number;
      meanAorticPressure: number;
    }>;
    axisEndToEndResponses: readonly Readonly<{
      axis: Exclude<MainWireAorticOutflowSourceTwitchRetentionLoadAxisV1, "none">;
      lowContextId:
        MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1;
      highContextId:
        MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1;
      ejectionTimeHighOverLow: number;
      aorticForwardVolumeHighOverLow: number;
      peakVelocityHighOverLow: number;
      meanGradientHighOverLow: number;
      peakGradientHighOverLow: number;
    }>[];
    allRunsPeriod1AndIntegrated: boolean;
    morphologyPreservedAcrossEnvelope: boolean;
    allDiastolicFlowReadbacksAvailable: boolean;
    allProtocolIdentitiesDistinct: boolean;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1;
  }>;

const AXIS_CONTEXT_PAIRS = Object.freeze([
  Object.freeze({
    axis: "systemic-resistance" as const,
    low: "systemic-resistance-low" as const,
    high: "systemic-resistance-high" as const,
  }),
  Object.freeze({
    axis: "pulmonary-resistance" as const,
    low: "pulmonary-resistance-low" as const,
    high: "pulmonary-resistance-high" as const,
  }),
  Object.freeze({
    axis: "systemic-arterial-tangent-stiffness" as const,
    low: "systemic-arterial-stiffness-low" as const,
    high: "systemic-arterial-stiffness-high" as const,
  }),
  Object.freeze({
    axis: "stressed-venous-volume" as const,
    low: "stressed-venous-volume-low" as const,
    high: "stressed-venous-volume-high" as const,
  }),
  Object.freeze({
    axis: "ventricular-Tref-force-scale" as const,
    low: "tref-force-load-low" as const,
    high: "tref-force-load-high" as const,
  }),
]);

export function measureMainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1(
  inputs:
    readonly MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeInputV1[],
  candidate: MainWireAorticOutflowCandidateProtocolV3 =
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V3,
): MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1 {
  const byId = new Map<
    MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1,
    MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeInputV1
  >();
  for (const input of inputs) {
    if (byId.has(input.contextId)) {
      throw new Error(`duplicate source-twitch load context: ${input.contextId}`);
    }
    assertRunMatchesContext(input, candidate);
    byId.set(input.contextId, input);
  }
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1) {
    if (!byId.has(contextId)) {
      throw new Error(`missing source-twitch load context: ${contextId}`);
    }
  }
  if (
    byId.size
      !== MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1.length
  ) {
    throw new Error("source-twitch load envelope has unexpected arms");
  }
  const cycles = new Map<
    MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1,
    MainWireAorticOutflowCalciumWaveformCycleMetricsV1
  >();
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1) {
    const input = byId.get(contextId)!;
    cycles.set(contextId, measureMainWireAorticOutflowCalciumWaveformCycleV1(
      input.run.periodicResult,
      input.run.calciumDriveParams,
      contextId,
    ));
  }
  const baseline = cycles.get("baseline")!;
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1.map(
      (contextId) => {
        const input = byId.get(contextId)!;
        const cycle = cycles.get(contextId)!;
        const diastolicFlow =
          measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
            input.run.periodicResult,
          );
        return Object.freeze({
          context: resolveMainWireAorticOutflowSourceTwitchRetentionLoadContextV1(
            contextId,
          ),
          protocolIdentityHash: input.run.periodicResult.protocolIdentityHash,
          cycle,
          externalCompatibility:
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
            }),
          diastolicFlow,
          relativeChangeFromBaseline: Object.freeze({
            ejectionTime: relative(cycle.aorticEjectionTimeProxySec,
              baseline.aorticEjectionTimeProxySec),
            aorticForwardVolume: relative(cycle.aorticForwardVolumeMl,
              baseline.aorticForwardVolumeMl),
            peakVenaContractaVelocity: relative(
              cycle.peakVenaContractaVelocityMPerSec,
              baseline.peakVenaContractaVelocityMPerSec,
            ),
            meanDopplerGradient: relative(cycle.meanDopplerGradientMmHg,
              baseline.meanDopplerGradientMmHg),
            peakDopplerGradient: relative(cycle.peakDopplerGradientMmHg,
              baseline.peakDopplerGradientMmHg),
            meanAorticPressure: relative(cycle.meanAorticAbsolutePressureMmHg,
              baseline.meanAorticAbsolutePressureMmHg),
          }),
        });
      },
    ),
  );
  const absoluteRelative = (select: (
    arm: MainWireAorticOutflowSourceTwitchRetentionLoadArmV1,
  ) => number) => Math.max(...arms.map((arm) => Math.abs(select(arm))));
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_ENVELOPE_ANALYSIS_V1_ID,
    candidateId: candidate.candidateId,
    arms,
    ranges: Object.freeze({
      ejectionTimeSec: range(arms.map((arm) =>
        arm.cycle.aorticEjectionTimeProxySec)),
      accelerationTimeSec: range(arms.map((arm) =>
        arm.cycle.timeFromAorticFlowOnsetToPeakSec)),
      aorticForwardVolumeMl: range(arms.map((arm) =>
        arm.cycle.aorticForwardVolumeMl)),
      peakVenaContractaVelocityMPerSec: range(arms.map((arm) =>
        arm.cycle.peakVenaContractaVelocityMPerSec)),
      meanDopplerGradientMmHg: range(arms.map((arm) =>
        arm.cycle.meanDopplerGradientMmHg)),
      peakDopplerGradientMmHg: range(arms.map((arm) =>
        arm.cycle.peakDopplerGradientMmHg)),
      fullyOpenUniformFlowDopplerGradientLowerBoundMmHg:
        range(arms.map((arm) => arm.cycle
          .aorticFullyOpenUniformFlowDopplerGradientLowerBoundMmHg)),
      dynamicAreaDopplerPenaltyFactor: range(arms.map((arm) =>
        arm.cycle.aorticDynamicAreaDopplerPenaltyFactor)),
      jetVelocityWaveformNonuniformityFactor: range(arms.map((arm) =>
        arm.cycle.aorticJetVelocityWaveformNonuniformityFactor)),
      meanDopplerExcessOverFullyOpenUniformFlowFactor:
        range(arms.map((arm) => arm.cycle
          .aorticMeanDopplerExcessOverFullyOpenUniformFlowFactor)),
      meanAorticPressureMmHg: range(arms.map((arm) =>
        arm.cycle.meanAorticAbsolutePressureMmHg)),
      leftVentricularEjectionFraction01: range(arms.map((arm) =>
        arm.cycle.leftVentricularEjectionFraction01)),
    }),
    diastolicRanges: Object.freeze({
      ivrtLikeSec: nullableRange(arms.map((arm) =>
        arm.diastolicFlow.value?.relaxation.ivrtLikeSec ?? null)),
      relaxationTauSec: nullableRange(arms.map((arm) =>
        arm.diastolicFlow.value?.relaxation.relaxationTauSec ?? null)),
      mitralPeakEToARatio: nullableRange(arms.map((arm) =>
        arm.diastolicFlow.value?.mitral.peakEToARatio ?? null)),
      mitralModeledVtiEToARatio: nullableRange(arms.map((arm) =>
        arm.diastolicFlow.value?.mitral.modeledVtiEToARatio ?? null)),
      mitralEPeakToInterveningValleySec: nullableRange(arms.map((arm) =>
        arm.diastolicFlow.value?.mitral.ePeakToInterveningValleySec ?? null)),
      pulmonaryVenousPeakSToDRatio: nullableRange(arms.map((arm) =>
        arm.diastolicFlow.value?.pulmonaryVenous.sToDPeakForwardFlowRatio
          ?? null)),
      pulmonaryVenousVolumeSToDRatio: nullableRange(arms.map((arm) =>
        arm.diastolicFlow.value?.pulmonaryVenous.sToDForwardVolumeRatio
          ?? null)),
      pulmonaryVenousAtrialReversalVolumeMl: nullableRange(arms.map((arm) =>
        arm.diastolicFlow.value?.pulmonaryVenous.atrialReversalVolumeMl
          ?? null)),
    }),
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
          .timeMeanSimplifiedDopplerGradientMmHg.withinComparisonInterval).length,
      allPrimary: arms.filter((arm) =>
        arm.externalCompatibility.allPrimaryComparisonIntervalsMatched).length,
    }),
    maximumAbsoluteRelativeChangeFromBaseline: Object.freeze({
      ejectionTime: absoluteRelative((arm) =>
        arm.relativeChangeFromBaseline.ejectionTime),
      aorticForwardVolume: absoluteRelative((arm) =>
        arm.relativeChangeFromBaseline.aorticForwardVolume),
      peakVenaContractaVelocity: absoluteRelative((arm) =>
        arm.relativeChangeFromBaseline.peakVenaContractaVelocity),
      meanDopplerGradient: absoluteRelative((arm) =>
        arm.relativeChangeFromBaseline.meanDopplerGradient),
      peakDopplerGradient: absoluteRelative((arm) =>
        arm.relativeChangeFromBaseline.peakDopplerGradient),
      meanAorticPressure: absoluteRelative((arm) =>
        arm.relativeChangeFromBaseline.meanAorticPressure),
    }),
    axisEndToEndResponses: Object.freeze(AXIS_CONTEXT_PAIRS.map((pair) => {
      const low = cycles.get(pair.low)!;
      const high = cycles.get(pair.high)!;
      return Object.freeze({
        axis: pair.axis,
        lowContextId: pair.low,
        highContextId: pair.high,
        ejectionTimeHighOverLow:
          high.aorticEjectionTimeProxySec / low.aorticEjectionTimeProxySec,
        aorticForwardVolumeHighOverLow:
          high.aorticForwardVolumeMl / low.aorticForwardVolumeMl,
        peakVelocityHighOverLow:
          high.peakVenaContractaVelocityMPerSec
          / low.peakVenaContractaVelocityMPerSec,
        meanGradientHighOverLow:
          high.meanDopplerGradientMmHg / low.meanDopplerGradientMmHg,
        peakGradientHighOverLow:
          high.peakDopplerGradientMmHg / low.peakDopplerGradientMmHg,
      });
    })),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossEnvelope: arms.every((arm) =>
      arm.cycle.aorticFlowPeakCountAboveFivePercent === 1),
    allDiastolicFlowReadbacksAvailable: arms.every((arm) =>
      arm.diastolicFlow.value !== null),
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  });
}

function assertRunMatchesContext(
  input: MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeInputV1,
  candidate: MainWireAorticOutflowCandidateProtocolV3,
): void {
  const expected = resolveMainWireAorticOutflowSourceTwitchRetentionLoadContextV1(
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
      !== candidate.twitchRetentionCandidateId
    || run.sourceVelocityDistortionProfile.profileId
      !== candidate.sourceVelocityDistortionProfileId
    || run.strongBridgeDeactivationExitProfile.profileId
      !== candidate.strongBridgeDeactivationExitProfileId
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
    throw new Error(`${input.contextId} does not match the fixed envelope protocol`);
  }
}

function relative(value: number, baseline: number): number {
  return value / baseline - 1;
}

function range(values: readonly number[]): NumericRange {
  return Object.freeze({ minimum: Math.min(...values), maximum: Math.max(...values) });
}

function nullableRange(values: readonly (number | null)[]): NumericRange | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length === 0 ? null : range(available);
}
