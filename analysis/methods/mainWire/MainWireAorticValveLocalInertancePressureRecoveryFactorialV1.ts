import {
  evaluateMainWireAorticOutflowExternalReferenceCompatibilityV1,
  type MainWireAorticOutflowExternalReferenceCompatibilityV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowExternalReferenceCompatibilityV1";
import {
  measureMainWireAorticOutflowKinematicFloorV1,
  type MainWireAorticOutflowKinematicFloorV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowKinematicFloorV1";
import {
  evaluateMainWireAorticOutflowPreservedMacroFeasibilityV1,
  type MainWireAorticOutflowPreservedMacroFeasibilityV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowPreservedMacroFeasibilityV1";
import {
  measureMainWireAorticValveObservationStationsV1,
  type MainWireAorticValveObservationGeometryV1,
  type MainWireAorticValveObservationStationsV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  compareMainWireAorticValveAblationV1,
  type MainWireAorticValveAblationArmMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1,
  resolveMainWireAorticValveLocalInertancePressureRecoveryArmV1,
  type MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
  type MainWireAorticValveLocalInertancePressureRecoveryArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticValveLocalInertancePressureRecoveryFactorialV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireAorticValveLocalInertanceProfileV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_ANALYSIS_V1_ID =
  "main-wire-aortic-valve-local-inertance-pressure-recovery-factorial-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    pressureStationsSeparated: true as const,
    localMomentumLaw:
      "delta-p-equals-L-dqdt-plus-linear-loss-plus-irreversible-convective-loss-plus-downstream-kinetic-flux" as const,
    localInertanceEnergyLedger:
      "kinetic-storage-change-plus-backward-Euler-numerical-dissipation" as const,
    pressureRecoveryEnergyLedger:
      "irreversible-ELCo-dissipation-separated-from-downstream-kinetic-transport" as const,
    negativeGradientForwardFlow:
      "physically-allowed-inertial-carry-through-not-reverse-flow" as const,
    ejectionTimeProxy:
      "cyclic-run-containing-global-flow-peak-at-max-one-ml-per-sec-or-one-percent-threshold" as const,
    accelerationTimeProxy:
      "accepted-step-onset-to-global-flow-peak-within-same-threshold-run" as const,
    flowPeakCounting: "strict-unsmoothed-local-maxima-above-five-percent" as const,
    spectralBandHz: Object.freeze([10, 50] as const),
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticValveLocalInertancePressureRecoveryFactorialInputV1 =
  Readonly<{
    armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticValveLocalInertancePressureRecoveryMomentumEnergyV1 =
  Readonly<{
    localInertanceMmHgSec2PerMl: number;
    pressureRecoveryApplied: boolean;
    positiveFlowNegativeNodeGradientSampleCount: number;
    positiveFlowNegativeNodeGradientTimeSec: number;
    positiveFlowNegativeNodeGradientVolumeMl: number;
    fractionOfForwardVolumeUnderNegativeNodeGradient: number;
    minimumNodeGradientDuringPositiveFlowMmHg: number;
    maximumFlowDuringNegativeNodeGradientMlPerSec: number;
    positiveToNegativeNodeGradientCrossoverCountDuringContiguousForwardFlow:
      number;
    maximumAbsoluteOpenMomentumResidualMmHg: number;
    cycleHydraulicInputEnergyMmHgMl: number;
    cycleIrreversibleDissipationMmHgMl: number;
    cycleDownstreamKineticTransportMmHgMl: number;
    cycleLocalKineticStorageChangeMmHgMl: number;
    cycleBackwardEulerNumericalDissipationMmHgMl: number;
    cycleEnergyBalanceResidualMmHgMl: number;
    cycleEnergyBalanceRelativeResidual: number;
  }>;

export type MainWireAorticValveLocalInertancePressureRecoveryFlowTimingV1 =
  Readonly<{
    thresholdMlPerSec: number;
    thresholdEpisodeCount: number;
    ejectionTimeProxySec: number;
    accelerationTimeProxySec: number;
    onsetSampleIndex: number;
    peakSampleIndex: number;
    lastThresholdActiveSampleIndex: number;
  }>;

export type MainWireAorticValveLocalInertancePressureRecoveryMacroV1 =
  Readonly<{
    aorticForwardVolumeMl: number;
    meanAorticPressureMmHg: number;
    leftVentricularEjectionFraction01: number;
    rightVentricularEjectionFraction01: number;
    netAorticCardiacOutputLPerMin: number;
  }>;

export type MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1 =
  Readonly<{
    arm: MainWireAorticValveLocalInertancePressureRecoveryArmV1;
    protocolIdentityHash: string;
    ablation: MainWireAorticValveAblationArmMetricsV1;
    observationStations: MainWireAorticValveObservationStationsV1;
    flowTiming:
      MainWireAorticValveLocalInertancePressureRecoveryFlowTimingV1;
    flowPeaksAboveFivePercent: readonly Readonly<{
      sampleIndex: number;
      cyclePhase01: number;
      flowMlPerSec: number;
      nodeGradientMmHg: number;
      activeEoaCm2: number;
    }>[];
    momentumEnergy:
      MainWireAorticValveLocalInertancePressureRecoveryMomentumEnergyV1;
    macro: MainWireAorticValveLocalInertancePressureRecoveryMacroV1;
    externalReferenceCompatibility:
      MainWireAorticOutflowExternalReferenceCompatibilityV1;
    kinematicFloor: MainWireAorticOutflowKinematicFloorV1;
    preservedMacroFeasibility:
      MainWireAorticOutflowPreservedMacroFeasibilityV1;
  }>;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_METRIC_IDS_V1 =
  Object.freeze([
    "aortic-ejection-time-proxy",
    "aortic-acceleration-time-proxy",
    "aortic-maximum-flow",
    "mean-simplified-doppler-gradient",
    "peak-simplified-doppler-gradient",
    "mean-node-static-gradient",
    "peak-node-static-gradient",
    "aortic-forward-volume",
    "mean-aortic-pressure",
    "left-ventricular-ejection-fraction",
    "aortic-flow-ac-energy-fraction-10-to-50-hz",
    "negative-gradient-forward-volume",
  ] as const);

export type MainWireAorticValveLocalInertancePressureRecoveryFactorialMetricIdV1 =
  (typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_METRIC_IDS_V1)[number];

export type MainWireAorticValveLocalInertancePressureRecoveryFactorialContrastV1 =
  Readonly<{
    metricId:
      MainWireAorticValveLocalInertancePressureRecoveryFactorialMetricIdV1;
    canonicalValue: number;
    pressureRecoveryOnlyValue: number;
    localInertanceOnlyValue: number;
    combinedValue: number;
    localInertanceEffectAtRecoveryOff: number;
    pressureRecoveryEffectAtLocalInertanceOff: number;
    interactionDifferenceOfDifferences: number;
    localInertanceEffectAtRecoveryOn: number;
    pressureRecoveryEffectAtLocalInertanceOn: number;
  }>;

export type MainWireAorticValveLocalInertancePressureRecoveryFactorialV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_ANALYSIS_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    arms:
      readonly MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1[];
    factorialContrasts:
      readonly MainWireAorticValveLocalInertancePressureRecoveryFactorialContrastV1[];
    exactProtocolIdentitiesDistinct: boolean;
    numericalGate: Readonly<{
      allRunsIntegrated: boolean;
      allRunsPeriod1: boolean;
      noRunPeriod2Suspected: boolean;
      maximumOpenMomentumResidualMmHg: number;
      maximumCycleEnergyBalanceRelativeResidual: number;
      passed: boolean;
    }>;
    waveformGate: Readonly<{
      allRunsHaveOneThresholdEpisode: boolean;
      allRunsHaveOneFlowPeakAboveFivePercent: boolean;
      flowPeakCountAboveFivePercentByArm: Readonly<Record<
        MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
        number
      >>;
      acEnergyFraction10To50HzByArm: Readonly<Record<
        MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
        number
      >>;
      passed: boolean;
    }>;
    mechanismGate: Readonly<{
      localInertanceSmoothsAtRecoveryOff: boolean;
      localInertanceSmoothsAtRecoveryOn: boolean;
      combinedLowersMeanAndPeakDopplerVsCanonical: boolean;
      combinedExternalReferenceDistanceLowerThanCanonical: boolean;
      combinedMatchesAllPrimaryExternalReferenceIntervals: boolean;
      combinedMacroGuardrail: Readonly<{
        aorticForwardVolumeWithinFivePercent: boolean;
        meanAorticPressureWithinFivePercent: boolean;
        leftVentricularEjectionFractionWithinThreePoints: boolean;
        allPassed: boolean;
      }>;
      passedForDtRefinement: boolean;
    }>;
    nextStepDecision:
      | "numerically-inconclusive"
      | "stop-local-inertance-as-primary-av-remedy"
      | "proceed-to-dt-refinement-before-systemic-recalibration";
    interpretationEligible: boolean;
    claim:
      typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_ANALYSIS_CLAIM_V1;
  }>;

export function compareMainWireAorticValveLocalInertancePressureRecoveryFactorialV1(
  inputs:
    readonly MainWireAorticValveLocalInertancePressureRecoveryFactorialInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireAorticValveLocalInertancePressureRecoveryFactorialV1 {
  const byArm = new Map<
    MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
    MainWireAorticValveLocalInertancePressureRecoveryFactorialInputV1
  >();
  for (const input of inputs) {
    if (byArm.has(input.armId)) {
      throw new Error(`duplicate AoV L x recovery arm: ${input.armId}`);
    }
    byArm.set(input.armId, input);
  }
  if (byArm.size !==
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1.length) {
    throw new Error("AoV L x pressure-recovery factorial requires four arms");
  }
  const ablation = compareMainWireAorticValveAblationV1(
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1.map(
      (armId) => {
        const input = byArm.get(armId);
        if (input === undefined) throw new Error(`missing AoV factorial arm: ${armId}`);
        return Object.freeze({ armId, periodicResult: input.periodicResult });
      },
    ),
  );
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1.map(
      (armId) => {
        const input = byArm.get(armId)!;
        const arm =
          resolveMainWireAorticValveLocalInertancePressureRecoveryArmV1(armId);
        const measuredAblation = ablation.arms.find((value) =>
          value.armId === armId)!;
        return measureArm(
          arm,
          input.periodicResult,
          measuredAblation,
          geometry,
        );
      },
    ),
  );
  const canonical = requiredArm(arms, "canonical");
  const pressureRecovery = requiredArm(arms, "pressure-recovery-aa-d3p0cm");
  const localInertance = requiredArm(
    arms,
    "fixed-lvot-d2p3cm-column-l7cm-local-inertance",
  );
  const combined = requiredArm(
    arms,
    "fixed-lvot-d2p3cm-column-l7cm-local-inertance-plus-pressure-recovery-aa-d3p0cm",
  );
  const factorialContrasts = Object.freeze(
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_METRIC_IDS_V1
      .map((metricId) => contrast(
        metricId,
        canonical,
        pressureRecovery,
        localInertance,
        combined,
      )),
  );
  const maximumOpenMomentumResidualMmHg = maximum(arms.map((arm) =>
    arm.momentumEnergy.maximumAbsoluteOpenMomentumResidualMmHg));
  const maximumCycleEnergyBalanceRelativeResidual = maximum(arms.map((arm) =>
    arm.momentumEnergy.cycleEnergyBalanceRelativeResidual));
  const allRunsIntegrated = arms.every((arm) =>
    arm.ablation.integrationCompletedWithoutFailure);
  const allRunsPeriod1 = arms.every((arm) =>
    arm.ablation.periodicSteadyStateClaimed);
  const noRunPeriod2Suspected = arms.every((arm) =>
    !arm.ablation.period2OrbitSuspected);
  const allRunsHaveOneThresholdEpisode = arms.every((arm) =>
    arm.flowTiming.thresholdEpisodeCount === 1);
  const allRunsHaveOneFlowPeakAboveFivePercent = arms.every((arm) =>
    arm.ablation.aorticFlowPeakCountAboveFivePercent === 1);
  const numericalPassed = allRunsIntegrated
    && allRunsPeriod1
    && noRunPeriod2Suspected
    && maximumOpenMomentumResidualMmHg <= 1e-7
    && maximumCycleEnergyBalanceRelativeResidual <= 1e-7;
  const waveformPassed = allRunsHaveOneThresholdEpisode
    && allRunsHaveOneFlowPeakAboveFivePercent;
  const localInertanceSmoothsAtRecoveryOff = smoothsAndLengthens(
    localInertance,
    canonical,
  );
  const localInertanceSmoothsAtRecoveryOn = smoothsAndLengthens(
    combined,
    pressureRecovery,
  );
  const combinedLowersMeanAndPeakDopplerVsCanonical =
    combined.observationStations.timeMeanGradientMmHg.simplifiedDoppler
      < canonical.observationStations.timeMeanGradientMmHg.simplifiedDoppler
    && combined.observationStations.peakGradientMmHg.simplifiedDoppler
      < canonical.observationStations.peakGradientMmHg.simplifiedDoppler;
  const combinedExternalReferenceDistanceLowerThanCanonical =
    combined.externalReferenceCompatibility.primaryReferenceBandDistanceRms
      < canonical.externalReferenceCompatibility.primaryReferenceBandDistanceRms;
  const combinedMacroGuardrail = macroGuardrail(combined, canonical);
  const mechanismPassedForDtRefinement =
    waveformPassed
    && localInertanceSmoothsAtRecoveryOff
    && localInertanceSmoothsAtRecoveryOn
    && combinedExternalReferenceDistanceLowerThanCanonical;
  const nextStepDecision = !numericalPassed
    ? "numerically-inconclusive" as const
    : mechanismPassedForDtRefinement
      ? "proceed-to-dt-refinement-before-systemic-recalibration" as const
      : "stop-local-inertance-as-primary-av-remedy" as const;
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_ANALYSIS_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    arms,
    factorialContrasts,
    exactProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    numericalGate: Object.freeze({
      allRunsIntegrated,
      allRunsPeriod1,
      noRunPeriod2Suspected,
      maximumOpenMomentumResidualMmHg,
      maximumCycleEnergyBalanceRelativeResidual,
      passed: numericalPassed,
    }),
    waveformGate: Object.freeze({
      allRunsHaveOneThresholdEpisode,
      allRunsHaveOneFlowPeakAboveFivePercent,
      flowPeakCountAboveFivePercentByArm: Object.freeze(Object.fromEntries(
        arms.map((arm) => [
          arm.arm.armId,
          arm.ablation.aorticFlowPeakCountAboveFivePercent,
        ]),
      )) as Readonly<Record<
        MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
        number
      >>,
      acEnergyFraction10To50HzByArm: Object.freeze(Object.fromEntries(
        arms.map((arm) => [
          arm.arm.armId,
          arm.ablation.aorticFlowAcEnergyFraction10To50Hz,
        ]),
      )) as Readonly<Record<
        MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
        number
      >>,
      passed: waveformPassed,
    }),
    mechanismGate: Object.freeze({
      localInertanceSmoothsAtRecoveryOff,
      localInertanceSmoothsAtRecoveryOn,
      combinedLowersMeanAndPeakDopplerVsCanonical,
      combinedExternalReferenceDistanceLowerThanCanonical,
      combinedMatchesAllPrimaryExternalReferenceIntervals:
        combined.externalReferenceCompatibility
          .allPrimaryComparisonIntervalsMatched,
      combinedMacroGuardrail,
      passedForDtRefinement: mechanismPassedForDtRefinement,
    }),
    nextStepDecision,
    interpretationEligible: numericalPassed,
    claim:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_ANALYSIS_CLAIM_V1,
  });
}

function measureArm(
  arm: MainWireAorticValveLocalInertancePressureRecoveryArmV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  ablation: MainWireAorticValveAblationArmMetricsV1,
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1 {
  const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result);
  const valve = measureMainWireValveDiseaseCycleMetricsV1(result).valves.AoV;
  const flowTiming = measureFlowTiming(result);
  const observationStations =
    measureMainWireAorticValveObservationStationsV1(result, geometry);
  const macro = Object.freeze({
    aorticForwardVolumeMl: summary.hemodynamics.forwardAorticStrokeVolumeMl,
    meanAorticPressureMmHg:
      summary.hemodynamics.meanAorticAbsolutePressureMmHg,
    leftVentricularEjectionFraction01:
      summary.hemodynamics.leftVentricularEjectionFraction01,
    rightVentricularEjectionFraction01:
      summary.hemodynamics.rightVentricularEjectionFraction01,
    netAorticCardiacOutputLPerMin:
      summary.hemodynamics.netAorticCardiacOutputLPerMin,
  });
  const externalReferenceCompatibility =
    evaluateMainWireAorticOutflowExternalReferenceCompatibilityV1({
      aorticEjectionTimeProxySec: flowTiming.ejectionTimeProxySec,
      aorticAccelerationTimeProxySec: flowTiming.accelerationTimeProxySec,
      peakVenaContractaVelocityMPerSec:
        observationStations.forwardFlow.peakVenaContractaVelocityMPerSec,
      timeMeanSimplifiedDopplerGradientMmHg:
        observationStations.timeMeanGradientMmHg.simplifiedDoppler,
      configuredMaximumForwardEoaCm2: valve.configuredMaximumForwardEoaCm2,
    });
  const kinematicFloor = measureMainWireAorticOutflowKinematicFloorV1(result);
  const preservedMacroFeasibility =
    evaluateMainWireAorticOutflowPreservedMacroFeasibilityV1({
      forwardVolumeMl: kinematicFloor.source.forwardVolumeMl,
      forwardFlowTimeSec: kinematicFloor.source.forwardFlowTimeSec,
      maximumForwardFlowMlPerSec:
        kinematicFloor.source.maximumForwardFlowMlPerSec,
      configuredMaximumForwardEoaCm2:
        kinematicFloor.source.configuredMaximumForwardEoaCm2,
    });
  return Object.freeze({
    arm,
    protocolIdentityHash: result.protocolIdentityHash,
    ablation,
    observationStations,
    flowTiming,
    flowPeaksAboveFivePercent: measureFlowPeaks(result),
    momentumEnergy: measureMomentumEnergy(arm, result, geometry),
    macro,
    externalReferenceCompatibility,
    kinematicFloor,
    preservedMacroFeasibility,
  });
}

function measureFlowPeaks(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
) {
  const samples = result.retainedCompleteBeats.at(-1)?.samples;
  if (samples === undefined || samples.length === 0) {
    throw new Error("AoV factorial peak readback requires a retained beat");
  }
  const flows = samples.map((sample) =>
    Math.max(0, sample.circulationEdgeFlowMlPerSec.AoV));
  const threshold = 0.05 * maximum(flows);
  return Object.freeze(samples.flatMap((sample, index) => {
    if (index === 0 || index === samples.length - 1) return [];
    const flow = flows[index]!;
    if (!(flow >= threshold && flow > flows[index - 1]!
      && flow > flows[index + 1]!)) return [];
    return [Object.freeze({
      sampleIndex: index,
      cyclePhase01: sample.cyclePhase01,
      flowMlPerSec: flow,
      nodeGradientMmHg: sample.valveHydraulics.AoV.pressureGradientMmHg,
      activeEoaCm2: sample.valveHydraulics.AoV.activeEoaCm2,
    })];
  }));
}

function measureFlowTiming(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticValveLocalInertancePressureRecoveryFlowTimingV1 {
  const samples = result.retainedCompleteBeats.at(-1)?.samples;
  if (samples === undefined || samples.length === 0) {
    throw new Error("AoV factorial timing requires a retained beat");
  }
  const flows = samples.map((sample) =>
    Math.max(0, sample.circulationEdgeFlowMlPerSec.AoV));
  const peakSampleIndex = maximumIndex(flows);
  const thresholdMlPerSec = Math.max(1, 0.01 * flows[peakSampleIndex]!);
  const active = flows.map((flow) => flow >= thresholdMlPerSec);
  const thresholdEpisodeCount = active.reduce((count, value, index) =>
    count + (value && !active[(index - 1 + active.length) % active.length]! ? 1 : 0), 0);
  if (!active[peakSampleIndex]) {
    throw new Error("AoV factorial peak is below its timing threshold");
  }
  let onsetSampleIndex = peakSampleIndex;
  while (active[(onsetSampleIndex - 1 + active.length) % active.length]!) {
    onsetSampleIndex = (onsetSampleIndex - 1 + active.length) % active.length;
    if (onsetSampleIndex === peakSampleIndex) {
      throw new Error("AoV timing threshold is active for the whole cycle");
    }
  }
  let lastThresholdActiveSampleIndex = peakSampleIndex;
  while (active[(lastThresholdActiveSampleIndex + 1) % active.length]!) {
    lastThresholdActiveSampleIndex =
      (lastThresholdActiveSampleIndex + 1) % active.length;
    if (lastThresholdActiveSampleIndex === peakSampleIndex) {
      throw new Error("AoV timing threshold is active for the whole cycle");
    }
  }
  const activeCount = cyclicDistance(
    onsetSampleIndex,
    lastThresholdActiveSampleIndex,
    active.length,
  ) + 1;
  return Object.freeze({
    thresholdMlPerSec,
    thresholdEpisodeCount,
    ejectionTimeProxySec: activeCount * result.dtSec,
    accelerationTimeProxySec: cyclicDistance(
      onsetSampleIndex,
      peakSampleIndex,
      active.length,
    ) * result.dtSec,
    onsetSampleIndex,
    peakSampleIndex,
    lastThresholdActiveSampleIndex,
  });
}

function measureMomentumEnergy(
  arm: MainWireAorticValveLocalInertancePressureRecoveryArmV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireAorticValveLocalInertancePressureRecoveryMomentumEnergyV1 {
  const samples = result.retainedCompleteBeats.at(-1)?.samples;
  if (samples === undefined || samples.length === 0) {
    throw new Error("AoV factorial momentum ledger requires a retained beat");
  }
  const localInertanceMmHgSec2PerMl = arm.localInertanceProfileId === null
    ? 0
    : resolveMainWireAorticValveLocalInertanceProfileV1(
      arm.localInertanceProfileId,
    ).fixedLocalInertanceMmHgSec2PerMl!;
  const pressureRecoveryApplied = arm.pressureRecoveryProfileId !== null;
  const dt = result.dtSec;
  let negativeSampleCount = 0;
  let negativeVolume = 0;
  let forwardVolume = 0;
  let minimumForwardGradient = Number.POSITIVE_INFINITY;
  let maximumNegativeGradientFlow = 0;
  let positiveToNegativeCrossovers = 0;
  let maximumAbsoluteOpenMomentumResidualMmHg = 0;
  let hydraulicInputEnergy = 0;
  let irreversibleDissipation = 0;
  let downstreamKineticTransport = 0;
  let kineticStorageChange = 0;
  let backwardEulerDissipation = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]!;
    const previous = samples[(index - 1 + samples.length) % samples.length]!;
    const q = Math.max(0, sample.circulationEdgeFlowMlPerSec.AoV);
    const previousQ = Math.max(0, previous.circulationEdgeFlowMlPerSec.AoV);
    const valve = sample.valveHydraulics.AoV;
    const gradient = valve.pressureGradientMmHg;
    if (q > 0) {
      forwardVolume += q * dt;
      minimumForwardGradient = Math.min(minimumForwardGradient, gradient);
      if (gradient < 0) {
        negativeSampleCount += 1;
        negativeVolume += q * dt;
        maximumNegativeGradientFlow = Math.max(maximumNegativeGradientFlow, q);
      }
      const previousGradient = previous.valveHydraulics.AoV.pressureGradientMmHg;
      if (
        previous.circulationEdgeFlowMlPerSec.AoV > 0
        && previousGradient >= 0
        && gradient < 0
      ) positiveToNegativeCrossovers += 1;
    }
    if (!(q > 0)) continue;
    const activeEoa = valve.activeEoaCm2;
    const venaContractaCoefficient =
      idealBernoulliLossFromEffectiveOrificeAreaV2(activeEoa);
    const energyLossArea = pressureRecoveryApplied
      ? activeEoa * geometry.ascendingAorticCrossSectionalAreaCm2
        / (geometry.ascendingAorticCrossSectionalAreaCm2 - activeEoa)
      : activeEoa;
    const irreversibleCoefficient =
      idealBernoulliLossFromEffectiveOrificeAreaV2(energyLossArea);
    const downstreamCoefficient = pressureRecoveryApplied
      ? idealBernoulliLossFromEffectiveOrificeAreaV2(
        geometry.ascendingAorticCrossSectionalAreaCm2,
      )
      : 0;
    const expectedFullCoefficient = pressureRecoveryApplied
      ? irreversibleCoefficient + downstreamCoefficient
      : venaContractaCoefficient;
    const inertialPressure = localInertanceMmHgSec2PerMl
      * (q - previousQ) / dt;
    const linearPressure = valve.resistanceMmHgSecPerMl * q;
    const irreversiblePressure = irreversibleCoefficient * q * q;
    const downstreamPressure = downstreamCoefficient * q * q;
    const residual = gradient - inertialPressure - linearPressure
      - expectedFullCoefficient * q * q;
    maximumAbsoluteOpenMomentumResidualMmHg = Math.max(
      maximumAbsoluteOpenMomentumResidualMmHg,
      Math.abs(residual),
    );
    hydraulicInputEnergy += gradient * q * dt;
    irreversibleDissipation +=
      (linearPressure + irreversiblePressure) * q * dt;
    downstreamKineticTransport += downstreamPressure * q * dt;
    kineticStorageChange += 0.5 * localInertanceMmHgSec2PerMl
      * (q * q - previousQ * previousQ);
    backwardEulerDissipation += 0.5 * localInertanceMmHgSec2PerMl
      * (q - previousQ) ** 2;
  }
  const cycleEnergyBalanceResidualMmHgMl = hydraulicInputEnergy
    - irreversibleDissipation
    - downstreamKineticTransport
    - kineticStorageChange
    - backwardEulerDissipation;
  return Object.freeze({
    localInertanceMmHgSec2PerMl,
    pressureRecoveryApplied,
    positiveFlowNegativeNodeGradientSampleCount: negativeSampleCount,
    positiveFlowNegativeNodeGradientTimeSec: negativeSampleCount * dt,
    positiveFlowNegativeNodeGradientVolumeMl: negativeVolume,
    fractionOfForwardVolumeUnderNegativeNodeGradient: forwardVolume > 0
      ? negativeVolume / forwardVolume
      : 0,
    minimumNodeGradientDuringPositiveFlowMmHg:
      Number.isFinite(minimumForwardGradient) ? minimumForwardGradient : 0,
    maximumFlowDuringNegativeNodeGradientMlPerSec: maximumNegativeGradientFlow,
    positiveToNegativeNodeGradientCrossoverCountDuringContiguousForwardFlow:
      positiveToNegativeCrossovers,
    maximumAbsoluteOpenMomentumResidualMmHg,
    cycleHydraulicInputEnergyMmHgMl: hydraulicInputEnergy,
    cycleIrreversibleDissipationMmHgMl: irreversibleDissipation,
    cycleDownstreamKineticTransportMmHgMl: downstreamKineticTransport,
    cycleLocalKineticStorageChangeMmHgMl: kineticStorageChange,
    cycleBackwardEulerNumericalDissipationMmHgMl:
      backwardEulerDissipation,
    cycleEnergyBalanceResidualMmHgMl,
    cycleEnergyBalanceRelativeResidual: Math.abs(
      cycleEnergyBalanceResidualMmHgMl,
    ) / Math.max(1, Math.abs(hydraulicInputEnergy)),
  });
}

function contrast(
  metricId:
    MainWireAorticValveLocalInertancePressureRecoveryFactorialMetricIdV1,
  canonical: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
  pressureRecovery:
    MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
  localInertance:
    MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
  combined: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
): MainWireAorticValveLocalInertancePressureRecoveryFactorialContrastV1 {
  const c = metric(metricId, canonical);
  const p = metric(metricId, pressureRecovery);
  const l = metric(metricId, localInertance);
  const lp = metric(metricId, combined);
  return Object.freeze({
    metricId,
    canonicalValue: c,
    pressureRecoveryOnlyValue: p,
    localInertanceOnlyValue: l,
    combinedValue: lp,
    localInertanceEffectAtRecoveryOff: l - c,
    pressureRecoveryEffectAtLocalInertanceOff: p - c,
    interactionDifferenceOfDifferences: lp - l - p + c,
    localInertanceEffectAtRecoveryOn: lp - p,
    pressureRecoveryEffectAtLocalInertanceOn: lp - l,
  });
}

function metric(
  metricId:
    MainWireAorticValveLocalInertancePressureRecoveryFactorialMetricIdV1,
  arm: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
): number {
  switch (metricId) {
    case "aortic-ejection-time-proxy":
      return arm.flowTiming.ejectionTimeProxySec;
    case "aortic-acceleration-time-proxy":
      return arm.flowTiming.accelerationTimeProxySec;
    case "aortic-maximum-flow":
      return arm.ablation.aorticMaximumFlowMlPerSec;
    case "mean-simplified-doppler-gradient":
      return arm.observationStations.timeMeanGradientMmHg.simplifiedDoppler;
    case "peak-simplified-doppler-gradient":
      return arm.observationStations.peakGradientMmHg.simplifiedDoppler;
    case "mean-node-static-gradient":
      return arm.observationStations.timeMeanGradientMmHg.acceptedNodeStatic;
    case "peak-node-static-gradient":
      return arm.observationStations.peakGradientMmHg.acceptedNodeStatic;
    case "aortic-forward-volume":
      return arm.macro.aorticForwardVolumeMl;
    case "mean-aortic-pressure":
      return arm.macro.meanAorticPressureMmHg;
    case "left-ventricular-ejection-fraction":
      return arm.macro.leftVentricularEjectionFraction01;
    case "aortic-flow-ac-energy-fraction-10-to-50-hz":
      return arm.ablation.aorticFlowAcEnergyFraction10To50Hz;
    case "negative-gradient-forward-volume":
      return arm.momentumEnergy.positiveFlowNegativeNodeGradientVolumeMl;
  }
}

function smoothsAndLengthens(
  candidate: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
  comparator: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
): boolean {
  return candidate.ablation.aorticMaximumFlowMlPerSec
      < comparator.ablation.aorticMaximumFlowMlPerSec
    && candidate.observationStations.peakGradientMmHg.simplifiedDoppler
      < comparator.observationStations.peakGradientMmHg.simplifiedDoppler
    && candidate.flowTiming.ejectionTimeProxySec
      > comparator.flowTiming.ejectionTimeProxySec
    && candidate.momentumEnergy.positiveFlowNegativeNodeGradientVolumeMl > 0;
}

function macroGuardrail(
  candidate: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
  canonical: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
) {
  const aorticForwardVolumeWithinFivePercent = relativeDifference(
    candidate.macro.aorticForwardVolumeMl,
    canonical.macro.aorticForwardVolumeMl,
  ) <= 0.05;
  const meanAorticPressureWithinFivePercent = relativeDifference(
    candidate.macro.meanAorticPressureMmHg,
    canonical.macro.meanAorticPressureMmHg,
  ) <= 0.05;
  const leftVentricularEjectionFractionWithinThreePoints = Math.abs(
    candidate.macro.leftVentricularEjectionFraction01
      - canonical.macro.leftVentricularEjectionFraction01,
  ) <= 0.03;
  return Object.freeze({
    aorticForwardVolumeWithinFivePercent,
    meanAorticPressureWithinFivePercent,
    leftVentricularEjectionFractionWithinThreePoints,
    allPassed: aorticForwardVolumeWithinFivePercent
      && meanAorticPressureWithinFivePercent
      && leftVentricularEjectionFractionWithinThreePoints,
  });
}

function requiredArm(
  arms:
    readonly MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1[],
  armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
): MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1 {
  const arm = arms.find((candidate) => candidate.arm.armId === armId);
  if (arm === undefined) throw new Error(`missing measured AoV factorial arm: ${armId}`);
  return arm;
}

function maximumIndex(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum index requires values");
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function cyclicDistance(start: number, end: number, length: number): number {
  return (end - start + length) % length;
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}

function relativeDifference(value: number, reference: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(reference) || reference === 0) {
    throw new Error("relative difference requires finite values and nonzero reference");
  }
  return Math.abs(value / reference - 1);
}
