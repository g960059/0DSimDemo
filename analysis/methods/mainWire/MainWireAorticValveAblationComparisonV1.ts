import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireAorticValveResearchProfileIdV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_VALVE_ABLATION_COMPARISON_V1_ID =
  "main-wire-aortic-valve-ablation-comparison-v1" as const;

export type MainWireAorticValveAblationArmIdV1 =
  | "canonical"
  | "historical-topology-local-inertance"
  | MainWireAorticValveResearchProfileIdV1;

export const MAIN_WIRE_AORTIC_VALVE_ABLATION_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    nodeGradient:
      "LV-chamber-node-minus-Ao-root-static-node-during-positive-AoV-flow" as const,
    venaContractaGradient:
      "simplified-Doppler-four-times-q-over-one-hundred-EOA-squared" as const,
    gradientKindsAreNotInterchangeable: true as const,
    flowPeakThreshold: "five-percent-of-positive-cycle-maximum" as const,
    flowPeakCounting: "strict-unsmoothed-local-maxima" as const,
    spectralBandHz: Object.freeze([10, 50] as const),
    spectralMethod:
      "unwindowed-periodic-beat-DFT-after-cycle-mean-removal" as const,
    smoothingApplied: false as const,
    clinicalThresholdOrFit: false as const,
  });

export type MainWireAorticValveAblationArmInputV1 = Readonly<{
  armId: MainWireAorticValveAblationArmIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticValveAblationArmMetricsV1 = Readonly<{
  armId: MainWireAorticValveAblationArmIdV1;
  protocolIdentityHash: string;
  terminationReason:
    MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
  periodicSteadyStateClaimed: boolean;
  period2OrbitSuspected: boolean;
  integrationCompletedWithoutFailure: boolean;
  completedBeatCount: number;
  beatIndex: number;
  dtSec: number;
  sampleCount: number;
  aorticForwardVolumeMl: number;
  aorticNetStrokeVolumeMl: number;
  aorticMaximumFlowMlPerSec: number;
  aorticForwardFlowTimeSec: number;
  aorticForwardEpisodeCount: number;
  aorticFlowPeakThresholdMlPerSec: number;
  aorticFlowPeakCountAboveFivePercent: number;
  aorticFlowAcEnergyFraction10To50Hz: number;
  forwardFlowTimeMeanActiveEoaCm2: number;
  maximumForwardActiveEoaCm2: number;
  activeEoaAtMaximumFlowCm2: number;
  leafletOpeningAtMaximumFlow01: number;
  maximumLeafletOpening01: number;
  forwardFlowTimeMeanNodeGradientMmHg: number;
  peakNodeGradientMmHg: number;
  peakVenaContractaVelocityMPerSec: number;
  forwardFlowTimeMeanVenaContractaGradientMmHg: number;
  peakVenaContractaGradientMmHg: number;
  meanVenaContractaMinusNodeGradientMmHg: number;
  peakVenaContractaMinusNodeGradientMmHg: number;
  aorticDissipatedCycleEnergyMmHgMl: number;
  aorticOpeningTargetEpisodeCount: number;
  aorticLeafletOpeningEpisodeCount: number;
  maximumAbsoluteOpeningConstraintResidual01: number;
  maximumAbsolutePowerBalanceResidualMmHgMlPerSec: number;
}>;

export type MainWireAorticValveAblationComparisonV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_VALVE_ABLATION_COMPARISON_V1_ID;
  arms: readonly MainWireAorticValveAblationArmMetricsV1[];
  claim: typeof MAIN_WIRE_AORTIC_VALVE_ABLATION_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireAorticValveAblationV1(
  inputs: readonly MainWireAorticValveAblationArmInputV1[],
): MainWireAorticValveAblationComparisonV1 {
  if (inputs.length === 0) throw new Error("at least one AoV ablation arm is required");
  const seen = new Set<MainWireAorticValveAblationArmIdV1>();
  const arms = inputs.map(({ armId, periodicResult }) => {
    if (seen.has(armId)) throw new Error(`duplicate AoV ablation arm: ${armId}`);
    seen.add(armId);
    return measureArm(armId, periodicResult);
  });
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_VALVE_ABLATION_COMPARISON_V1_ID,
    arms: Object.freeze(arms),
    claim: MAIN_WIRE_AORTIC_VALVE_ABLATION_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticValveAblationArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticValveAblationArmMetricsV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${armId} requires a retained complete beat`);
  }
  const cycleMetrics = measureMainWireValveDiseaseCycleMetricsV1(result);
  const aortic = cycleMetrics.valves.AoV;
  const forwardFlows = beat.samples.map((sample) =>
    Math.max(0, sample.valveHydraulics.AoV.flowMlPerSec));
  const aorticMaximumFlowMlPerSec = maximum(forwardFlows);
  const maximumFlowSampleIndex = indexOfMaximum(forwardFlows);
  const forwardSamples = beat.samples.filter((sample) =>
    sample.valveHydraulics.AoV.flowMlPerSec > 0);
  const forwardActiveAreasCm2 = forwardSamples.map((sample) =>
    sample.valveHydraulics.AoV.activeEoaCm2);
  const openingFractions01 = beat.samples.map((sample) =>
    sample.valveOpeningFraction01.AoV);
  const aorticFlowPeakThresholdMlPerSec =
    0.05 * aorticMaximumFlowMlPerSec;
  const meanNode = aortic.forwardFlowTimeMeanGradientMmHg;
  const meanVenaContracta =
    aortic.forwardFlowTimeMeanSimplifiedDopplerGradientMmHg;
  const peakNode = aortic.peakForwardGradientMmHg;
  const peakVenaContracta = aortic.peakSimplifiedDopplerGradientMmHg;
  return Object.freeze({
    armId,
    protocolIdentityHash: result.protocolIdentityHash,
    terminationReason: result.terminationReason,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    period2OrbitSuspected: result.period2OrbitSuspected,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    completedBeatCount: result.completedBeatCount,
    beatIndex: beat.beatIndex,
    dtSec: result.dtSec,
    sampleCount: beat.samples.length,
    aorticForwardVolumeMl: aortic.forwardVolumeMl,
    aorticNetStrokeVolumeMl: aortic.netVolumeMl,
    aorticMaximumFlowMlPerSec,
    aorticForwardFlowTimeSec: aortic.forwardFlowTimeSec,
    aorticForwardEpisodeCount: aortic.forwardEpisodeCount,
    aorticFlowPeakThresholdMlPerSec,
    aorticFlowPeakCountAboveFivePercent: countMainWireStrictLocalMaximaV1(
      forwardFlows,
      aorticFlowPeakThresholdMlPerSec,
    ),
    aorticFlowAcEnergyFraction10To50Hz:
      mainWirePeriodicSpectralEnergyFractionV1(
      forwardFlows,
      result.dtSec,
      10,
      50,
    ),
    forwardFlowTimeMeanActiveEoaCm2: mean(forwardActiveAreasCm2),
    maximumForwardActiveEoaCm2: maximum(forwardActiveAreasCm2),
    activeEoaAtMaximumFlowCm2: beat.samples[maximumFlowSampleIndex]!
      .valveHydraulics.AoV.activeEoaCm2,
    leafletOpeningAtMaximumFlow01:
      openingFractions01[maximumFlowSampleIndex]!,
    maximumLeafletOpening01: maximum(openingFractions01),
    forwardFlowTimeMeanNodeGradientMmHg: meanNode,
    peakNodeGradientMmHg: peakNode,
    peakVenaContractaVelocityMPerSec: aortic.peakForwardJetVelocityMPerSec,
    forwardFlowTimeMeanVenaContractaGradientMmHg: meanVenaContracta,
    peakVenaContractaGradientMmHg: peakVenaContracta,
    meanVenaContractaMinusNodeGradientMmHg:
      meanVenaContracta - meanNode,
    peakVenaContractaMinusNodeGradientMmHg:
      peakVenaContracta - peakNode,
    aorticDissipatedCycleEnergyMmHgMl:
      aortic.dissipatedCycleEnergyMmHgMl,
    aorticOpeningTargetEpisodeCount: aortic.openingTargetEpisodeCount,
    aorticLeafletOpeningEpisodeCount: aortic.leafletOpeningEpisodeCount,
    maximumAbsoluteOpeningConstraintResidual01:
      aortic.maximumAbsoluteOpeningEquationResidual01,
    maximumAbsolutePowerBalanceResidualMmHgMlPerSec:
      aortic.maximumAbsolutePowerResidualMmHgMlPerSec,
  });
}

export function countMainWireStrictLocalMaximaV1(
  values: readonly number[],
  threshold: number,
): number {
  if (values.length < 3 || !(threshold >= 0) || !Number.isFinite(threshold)) {
    return 0;
  }
  let count = 0;
  for (let index = 1; index < values.length - 1; index += 1) {
    const previous = values[index - 1]!;
    const current = values[index]!;
    const next = values[index + 1]!;
    if (current >= threshold && current > previous && current > next) count += 1;
  }
  return count;
}

export function mainWirePeriodicSpectralEnergyFractionV1(
  values: readonly number[],
  dtSec: number,
  lowerHz: number,
  upperHz: number,
): number {
  if (!(dtSec > 0) || !Number.isFinite(dtSec) || values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const centered = values.map((value) => value - mean);
  const totalEnergy = centered.reduce((sum, value) => sum + value ** 2, 0);
  if (!(totalEnergy > 0)) return 0;
  const n = centered.length;
  const nyquistIndex = Math.floor(n / 2);
  let bandEnergy = 0;
  for (let k = 1; k <= nyquistIndex; k += 1) {
    const frequencyHz = k / (n * dtSec);
    if (frequencyHz < lowerHz || frequencyHz > upperHz) continue;
    let real = 0;
    let imaginary = 0;
    for (let sampleIndex = 0; sampleIndex < n; sampleIndex += 1) {
      const angle = -2 * Math.PI * k * sampleIndex / n;
      real += centered[sampleIndex]! * Math.cos(angle);
      imaginary += centered[sampleIndex]! * Math.sin(angle);
    }
    const oneSidedFactor = n % 2 === 0 && k === n / 2 ? 1 : 2;
    bandEnergy += oneSidedFactor * (real ** 2 + imaginary ** 2) / n;
  }
  return Math.min(1, Math.max(0, bandEnergy / totalEnergy));
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result === Number.NEGATIVE_INFINITY ? 0 : result;
}

function indexOfMaximum(values: readonly number[]): number {
  let maximumIndex = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! > values[maximumIndex]!) maximumIndex = index;
  }
  return maximumIndex;
}

function mean(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}
