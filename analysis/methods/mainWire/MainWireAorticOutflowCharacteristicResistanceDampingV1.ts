import {
  MAIN_WIRE_AORTIC_FLOW_DISTINCT_PEAK_MINIMUM_PROMINENCE_FRACTION_V1,
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireLocalMaximumProminencesV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_PLACEMENT_PROFILE_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_V1_ID,
  resolveMainWireAorticOutflowCharacteristicResistanceDampingContextV1,
  type MainWireAorticOutflowCharacteristicResistanceDampingContextIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowCharacteristicResistanceDampingV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV9";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireAorticCharacteristicResistancePlacementProfileV1,
  type MainWireAorticCharacteristicResistancePlacementProfileIdV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-characteristic-resistance-damping-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    matchedComparison:
      "placement-only-within-each-fixed-high-stiffness-context" as const,
    exchangeModeApproximation:
      "isolated-linearized-Ao-SA-RL-branch-between-local-Ao-and-SA-tangent-compliances" as const,
    exchangeModeNaturalFrequency:
      "one-over-two-pi-times-square-root-of-L-times-series-equivalent-compliance" as const,
    directSeriesDampingRatio:
      "R-Ao-SA-over-two-times-square-root-of-series-equivalent-compliance-over-L" as const,
    proxyOmitsDriverDistalNetworkAndNonlinearCoupling: true as const,
    observedPeakSeparation:
      "accepted-sample-separation-of-first-two-unsmoothed-local-maxima-above-five-percent" as const,
    distinctPeakThresholdFractionOfGlobalMaximum:
      MAIN_WIRE_AORTIC_FLOW_DISTINCT_PEAK_MINIMUM_PROMINENCE_FRACTION_V1,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireAorticOutflowCharacteristicResistanceDampingInputV1 =
  Readonly<{
    contextId: MainWireAorticOutflowCharacteristicResistanceDampingContextIdV1;
    placementProfileId:
      MainWireAorticCharacteristicResistancePlacementProfileIdV1;
    run:
      MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1;
  }>;

export type MainWireAorticOutflowCharacteristicResistanceDampingArmV1 =
  Readonly<{
    contextId: MainWireAorticOutflowCharacteristicResistanceDampingContextIdV1;
    placementProfileId:
      MainWireAorticCharacteristicResistancePlacementProfileIdV1;
    protocolIdentityHash: string;
    sourceAoSaResistanceMmHgSecPerMl: number;
    upstreamResistanceAdditionMmHgSecPerMl: number;
    directAoSaResistanceMmHgSecPerMl: number;
    totalRedistributedResistanceMmHgSecPerMl: number;
    resistanceConservationResidualMmHgSecPerMl: number;
    resolvedAoSaInertanceMmHgSec2PerMl: number;
    meanAorticRootPressureMmHg: number;
    meanSystemicArterialPressureMmHg: number;
    localAorticRootTangentComplianceMlPerMmHg: number;
    localSystemicArterialTangentComplianceMlPerMmHg: number;
    seriesEquivalentTangentComplianceMlPerMmHg: number;
    isolatedExchangeModeNaturalFrequencyHz: number;
    isolatedExchangeModePeriodSec: number;
    isolatedDirectSeriesDampingRatio: number;
    observedFirstTwoStrictPeakSeparationSec: number | null;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  }>;

export type MainWireAorticOutflowCharacteristicResistanceDampingPlacementSummaryV1 =
  Readonly<{
    placementProfileId:
      MainWireAorticCharacteristicResistancePlacementProfileIdV1;
    armCount: number;
    directAoSaResistanceMmHgSecPerMl: number;
    isolatedDirectSeriesDampingRatioRange: Readonly<{
      minimum: number;
      maximum: number;
    }>;
    isolatedExchangeModeNaturalFrequencyHzRange: Readonly<{
      minimum: number;
      maximum: number;
    }>;
    ejectionTimeSecRange: Readonly<{ minimum: number; maximum: number }>;
    strokeVolumeMlRange: Readonly<{ minimum: number; maximum: number }>;
    meanDopplerGradientMmHgRange:
      Readonly<{ minimum: number; maximum: number }>;
    maximumSecondaryPeakProminenceFractionOfGlobalMaximum: number;
    allStrictSinglePeak: boolean;
    allDistinctSinglePeak: boolean;
    allPeriod1Integrated: boolean;
  }>;

export type MainWireAorticOutflowCharacteristicResistanceDampingV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_ANALYSIS_V1_ID;
    experimentId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_V1_ID;
    arms: readonly MainWireAorticOutflowCharacteristicResistanceDampingArmV1[];
    placementSummaries:
      readonly MainWireAorticOutflowCharacteristicResistanceDampingPlacementSummaryV1[];
    allExpectedArmsPresent: true;
    allProtocolIdentitiesDistinct: boolean;
    allResistanceSumsPreservedWithinRoundoff: boolean;
    allUpstreamProfileExposesDistinctSecondaryPeak: boolean;
    land2017ProfileIsStrictSinglePeakAcrossLimitingContexts: boolean;
    land2017ProfileIsDistinctSinglePeakAcrossLimitingContexts: boolean;
    experimentClaim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CLAIM_V1;
    analysisClaim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_ANALYSIS_CLAIM_V1;
  }>;

export function measureMainWireAorticOutflowCharacteristicResistanceDampingV1(
  inputs:
    readonly MainWireAorticOutflowCharacteristicResistanceDampingInputV1[],
): MainWireAorticOutflowCharacteristicResistanceDampingV1 {
  const expectedCount =
    MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1
      .length
    * MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_PLACEMENT_PROFILE_IDS_V1
      .length;
  if (inputs.length !== expectedCount) {
    throw new Error(
      `characteristic-resistance damping requires exactly ${expectedCount} arms`,
    );
  }
  const byKey = new Map<string,
    MainWireAorticOutflowCharacteristicResistanceDampingInputV1>();
  for (const input of inputs) {
    const key = armKey(input.contextId, input.placementProfileId);
    if (byKey.has(key)) {
      throw new Error(`duplicate characteristic-resistance damping arm: ${key}`);
    }
    byKey.set(key, input);
  }
  const orderedInputs =
    MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_PLACEMENT_PROFILE_IDS_V1
      .flatMap((placementProfileId) =>
        MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1
          .map((contextId) => {
            const key = armKey(contextId, placementProfileId);
            const input = byKey.get(key);
            if (input === undefined) {
              throw new Error(`missing characteristic-resistance damping arm: ${key}`);
            }
            return input;
          }));
  const arms = Object.freeze(orderedInputs.map(measureArm));
  const placementSummaries = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_PLACEMENT_PROFILE_IDS_V1
      .map((placementProfileId) => summarizePlacement(
        placementProfileId,
        arms.filter((arm) => arm.placementProfileId === placementProfileId),
      )),
  );
  const summaryByPlacement = new Map(placementSummaries.map((summary) =>
    [summary.placementProfileId, summary]));
  const allUpstream = summaryByPlacement.get(
    "all-Ao-SA-resistance-upstream-of-root-compliance",
  )!;
  const land2017 = summaryByPlacement.get(
    "Land2017-characteristic-impedance-matched",
  )!;
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_ANALYSIS_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_V1_ID,
    arms,
    placementSummaries,
    allExpectedArmsPresent: true as const,
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    allResistanceSumsPreservedWithinRoundoff: arms.every((arm) =>
      Math.abs(arm.resistanceConservationResidualMmHgSecPerMl) <= 1e-12),
    allUpstreamProfileExposesDistinctSecondaryPeak:
      !allUpstream.allDistinctSinglePeak,
    land2017ProfileIsStrictSinglePeakAcrossLimitingContexts:
      land2017.allStrictSinglePeak,
    land2017ProfileIsDistinctSinglePeakAcrossLimitingContexts:
      land2017.allDistinctSinglePeak,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_ANALYSIS_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAorticOutflowCharacteristicResistanceDampingInputV1,
): MainWireAorticOutflowCharacteristicResistanceDampingArmV1 {
  const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9;
  const context =
    resolveMainWireAorticOutflowCharacteristicResistanceDampingContextV1(
      input.contextId,
    );
  const placement =
    resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      input.placementProfileId,
    );
  const run = input.run;
  if (
    run.placementProfile?.profileId !== input.placementProfileId
    || run.complianceProfile.profileId !== context.complianceProfileId
    || run.circulatoryLoadPoint.pointId !== context.circulatoryLoadPointId
    || run.stressedVenousVolumePoint.pointId
      !== context.stressedVenousVolumePointId
    || run.trefForceLoadProfile.profileId !== context.trefForceLoadProfileId
    || run.kuwProfile.profileId !== candidate.kuwProfileId
    || run.sarcomereReferenceProfile.profileId
      !== candidate.sarcomereReferenceProfileId
    || run.calciumSensitivityLengthProfile.profileId
      !== candidate.calciumSensitivityLengthProfileId
    || run.sourceTwitchRetentionCandidate.candidateId
      !== candidate.twitchRetentionCandidateId
    || run.sourceVelocityDistortionProfile.profileId
      !== candidate.sourceVelocityDistortionProfileId
    || run.strongBridgeDeactivationExitProfile.profileId
      !== candidate.strongBridgeDeactivationExitProfileId
    || run.atrioventricularDelayProfile.profileId
      !== candidate.atrioventricularDelayProfileId
    || run.rootInertanceProfile?.profileId !== candidate.rootInertanceProfileId
  ) {
    throw new Error(
      `characteristic-resistance damping exact identity mismatch: ${armKey(input.contextId, input.placementProfileId)}`,
    );
  }
  const result = run.periodicResult;
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error("characteristic-resistance damping requires a complete beat");
  }
  const sourceAoSa = result.protocolIdentity.circulation.topologyGraphSnapshot
    .edges.find((edge) => edge.name === "Ao_SA");
  const sourceAo = result.protocolIdentity.circulation.topologyGraphSnapshot
    .nodes.find((node) => node.name === "Ao");
  const sourceSa = result.protocolIdentity.circulation.topologyGraphSnapshot
    .nodes.find((node) => node.name === "SA");
  if (
    sourceAoSa === undefined
    || sourceAoSa.kind !== "dynamic"
    || !(sourceAoSa.R > 0)
    || !(sourceAoSa.L! > 0)
    || sourceAo?.kind !== "arterial"
    || sourceSa?.kind !== "arterial"
  ) throw new Error("characteristic-resistance damping source topology mismatch");
  const sourceAoSaResistanceMmHgSecPerMl = sourceAoSa.R;
  if (
    sourceAoSaResistanceMmHgSecPerMl
      !== placement.sourceTopologyResistanceMmHgSecPerMl
  ) throw new Error("characteristic-resistance damping source R mismatch");
  const directAoSaResistanceMmHgSecPerMl =
    sourceAoSaResistanceMmHgSecPerMl
    * placement.downstreamDynamicEdgeResistanceScaleFromTopology;
  const totalRedistributedResistanceMmHgSecPerMl =
    placement.upstreamValveLinearResistanceAdditionMmHgSecPerMl
    + directAoSaResistanceMmHgSecPerMl;
  const resolvedAoSaInertanceMmHgSec2PerMl = sourceAoSa.L!
    * run.rootInertanceProfile!.inertanceScaleFromTopology;
  const meanAorticRootPressureMmHg = mean(beat.samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.Ao));
  const meanSystemicArterialPressureMmHg = mean(beat.samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.SA));
  const baselineArterialStiffness = normalAdultMainWireRuntimeV1()
    .vascular.arterialStiffness;
  const stiffnessScale = baselineArterialStiffness
    * run.circulatoryLoadPoint.arterialStiffnessScaleFromBaseline
    * run.complianceProfile.arterialStiffnessScaleFromBaseline;
  const localAorticRootTangentComplianceMlPerMmHg =
    sourceAo.Vs! / stiffnessScale
    / (sourceAo.P0! + meanAorticRootPressureMmHg);
  const localSystemicArterialTangentComplianceMlPerMmHg =
    sourceSa.Vs! / stiffnessScale
    / (sourceSa.P0! + meanSystemicArterialPressureMmHg);
  const seriesEquivalentTangentComplianceMlPerMmHg = 1 / (
    1 / localAorticRootTangentComplianceMlPerMmHg
    + 1 / localSystemicArterialTangentComplianceMlPerMmHg
  );
  const isolatedExchangeModeNaturalFrequencyHz = 1 / (
    2 * Math.PI * Math.sqrt(
      resolvedAoSaInertanceMmHgSec2PerMl
      * seriesEquivalentTangentComplianceMlPerMmHg,
    )
  );
  const isolatedDirectSeriesDampingRatio =
    directAoSaResistanceMmHgSecPerMl / 2
    * Math.sqrt(
      seriesEquivalentTangentComplianceMlPerMmHg
      / resolvedAoSaInertanceMmHgSec2PerMl,
    );
  const flows = beat.samples.map((sample) => sample.flowMlPerSec.AoV);
  const peaks = measureMainWireLocalMaximumProminencesV1(
    flows,
    0.05 * Math.max(...flows),
  );
  const observedFirstTwoStrictPeakSeparationSec = peaks.length < 2
    ? null
    : (peaks[1]!.sampleIndex - peaks[0]!.sampleIndex) * result.dtSec;
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    run.calciumDriveParams,
    armKey(input.contextId, input.placementProfileId),
  );
  return Object.freeze({
    contextId: input.contextId,
    placementProfileId: input.placementProfileId,
    protocolIdentityHash: result.protocolIdentityHash,
    sourceAoSaResistanceMmHgSecPerMl,
    upstreamResistanceAdditionMmHgSecPerMl:
      placement.upstreamValveLinearResistanceAdditionMmHgSecPerMl,
    directAoSaResistanceMmHgSecPerMl,
    totalRedistributedResistanceMmHgSecPerMl,
    resistanceConservationResidualMmHgSecPerMl:
      totalRedistributedResistanceMmHgSecPerMl
      - sourceAoSaResistanceMmHgSecPerMl,
    resolvedAoSaInertanceMmHgSec2PerMl,
    meanAorticRootPressureMmHg,
    meanSystemicArterialPressureMmHg,
    localAorticRootTangentComplianceMlPerMmHg,
    localSystemicArterialTangentComplianceMlPerMmHg,
    seriesEquivalentTangentComplianceMlPerMmHg,
    isolatedExchangeModeNaturalFrequencyHz,
    isolatedExchangeModePeriodSec: 1 / isolatedExchangeModeNaturalFrequencyHz,
    isolatedDirectSeriesDampingRatio,
    observedFirstTwoStrictPeakSeparationSec,
    cycle,
  });
}

function summarizePlacement(
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1,
  arms: readonly MainWireAorticOutflowCharacteristicResistanceDampingArmV1[],
): MainWireAorticOutflowCharacteristicResistanceDampingPlacementSummaryV1 {
  if (
    arms.length
      !== MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1
        .length
  ) throw new Error("characteristic-resistance damping placement arm mismatch");
  return Object.freeze({
    placementProfileId,
    armCount: arms.length,
    directAoSaResistanceMmHgSecPerMl:
      arms[0]!.directAoSaResistanceMmHgSecPerMl,
    isolatedDirectSeriesDampingRatioRange: range(arms.map((arm) =>
      arm.isolatedDirectSeriesDampingRatio)),
    isolatedExchangeModeNaturalFrequencyHzRange: range(arms.map((arm) =>
      arm.isolatedExchangeModeNaturalFrequencyHz)),
    ejectionTimeSecRange: range(arms.map((arm) =>
      arm.cycle.aorticEjectionTimeProxySec)),
    strokeVolumeMlRange: range(arms.map((arm) =>
      arm.cycle.aorticForwardVolumeMl)),
    meanDopplerGradientMmHgRange: range(arms.map((arm) =>
      arm.cycle.meanDopplerGradientMmHg)),
    maximumSecondaryPeakProminenceFractionOfGlobalMaximum:
      Math.max(...arms.map((arm) =>
        arm.cycle.maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum)),
    allStrictSinglePeak: arms.every((arm) =>
      arm.cycle.aorticFlowPeakCountAboveFivePercent === 1),
    allDistinctSinglePeak: arms.every((arm) =>
      arm.cycle.aorticFlowDistinctPeakCountAboveFivePercent === 1),
    allPeriod1Integrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
  });
}

function armKey(
  contextId: MainWireAorticOutflowCharacteristicResistanceDampingContextIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1,
): string {
  return `${placementProfileId}:${contextId}`;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function range(values: readonly number[]): Readonly<{
  minimum: number;
  maximum: number;
}> {
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}
