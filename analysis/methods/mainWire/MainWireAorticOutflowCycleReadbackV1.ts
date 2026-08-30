import type { MainWireNormalAdultFiveWallPeriodicResultV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EXACT_READBACK_AUDIT_TOLERANCE_V1 =
  1e-9 as const;

type MeanAndPeakV1 = Readonly<{ timeMean: number; peak: number }>;

type CyclicEpisodeV1 = Readonly<{
  openingIndex: number;
  closingIndex: number;
  activeSampleCount: number;
  episodeCount: number;
  totalActiveSampleCount: number;
}>;

export type MainWireAorticOutflowOnePercentFlowEjectionTimeV1 = Readonly<{
  peakFraction01: 0.01;
  thresholdMlPerSec: number;
  cyclicEpisodeCount: number;
  primaryEpisodeActiveSampleCount: number;
  extraActiveSampleCountOutsidePrimaryEpisode: number;
  primaryOpeningSampleIndex: number;
  primaryClosingSampleIndex: number;
  primaryContainsGlobalPositiveFlowPeak: true;
  openingInterpolationFractionFromPreviousToFirstActive01: number;
  closingInterpolationFractionFromLastActiveToNext01: number;
  interpolatedEjectionTimeSec: number;
}>;

export type MainWireAorticOutflowExactPressureStationsV1 = Readonly<{
  averagingDomain: "strictly-positive-forward-AoV-flow-samples";
  positiveForwardFlowSampleCount: number;
  rawLvMinusAorticComplianceNodeGradientMmHg: MeanAndPeakV1;
  exactLvMinusProximalConstitutivePortGradientMmHg: MeanAndPeakV1;
  characteristicImpedancePressureMmHg: MeanAndPeakV1;
}>;

export type MainWireAorticOutflowExactReadbackAuditV1 = Readonly<{
  requiredSelectedBeatSampleCount: number;
  availableSelectedBeatSampleCount: number;
  allSelectedBeatSamplesAvailable: true;
  allOpeningDriveStationsExact: boolean;
  maximumAbsoluteValveFlowReadbackResidualMlPerSec: number;
  maximumAbsoluteRawNodeGradientResidualMmHg: number;
  maximumAbsoluteAorticNodeReadbackResidualMmHg: number;
  maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg: number;
  maximumAbsoluteProximalPortReconstructionResidualMmHg: number;
  maximumAbsoluteLocalGradientReconstructionResidualMmHg: number;
  maximumAbsoluteStationAdditivityResidualMmHg: number;
  maximumAbsoluteCyclePhaseResidual01: number;
  stationEquationsWithinTolerance: boolean;
}>;

export type MainWireAorticOutflowCycleReadbackV1 = Readonly<{
  onePercentFlowEjectionTime: MainWireAorticOutflowOnePercentFlowEjectionTimeV1;
  exactPressureStations: MainWireAorticOutflowExactPressureStationsV1;
  exactReadbackAudit: MainWireAorticOutflowExactReadbackAuditV1;
}>;

/**
 * Shared derived readback for accepted AoV-flow endpoints. This method owns
 * the one-percent flow episode and exact proximal-port station equations; it
 * does not mutate or feed results back into the exact model.
 */
export function measureMainWireAorticOutflowCycleReadbackV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  cycleLengthSec: number,
  sourceLabel = "aortic outflow cycle",
): MainWireAorticOutflowCycleReadbackV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${sourceLabel} requires a retained complete beat`);
  }
  const flows = beat.samples.map((sample, index) => {
    const flow = sample.valveHydraulics.AoV.flowMlPerSec;
    finite(flow, `${sourceLabel} sample ${index} AoV flow`);
    return flow;
  });
  const positivePeakFlow = maximum(flows);
  if (!(positivePeakFlow > 0)) {
    throw new Error(`${sourceLabel} requires positive AoV peak flow`);
  }
  const peakIndex = flows.indexOf(positivePeakFlow);
  return Object.freeze({
    onePercentFlowEjectionTime: measureOnePercentEt(
      flows,
      peakIndex,
      result.dtSec,
    ),
    ...measureExactStationsAndAudit(result, cycleLengthSec),
  });
}

function measureOnePercentEt(
  flows: readonly number[],
  peakIndex: number,
  dtSec: number,
): MainWireAorticOutflowOnePercentFlowEjectionTimeV1 {
  const threshold = flows[peakIndex]! * 0.01;
  const shifted = flows.map((flow) => flow - threshold);
  const episode = primaryCyclicPositiveEpisode(shifted, peakIndex);
  const interpolation = interpolatedEpisodeDuration(shifted, episode, dtSec);
  return Object.freeze({
    peakFraction01: 0.01 as const,
    thresholdMlPerSec: threshold,
    cyclicEpisodeCount: episode.episodeCount,
    primaryEpisodeActiveSampleCount: episode.activeSampleCount,
    extraActiveSampleCountOutsidePrimaryEpisode:
      episode.totalActiveSampleCount - episode.activeSampleCount,
    primaryOpeningSampleIndex: episode.openingIndex,
    primaryClosingSampleIndex: episode.closingIndex,
    primaryContainsGlobalPositiveFlowPeak: true as const,
    openingInterpolationFractionFromPreviousToFirstActive01:
      interpolation.openingInterpolationFractionFromPreviousToFirstActive01,
    closingInterpolationFractionFromLastActiveToNext01:
      interpolation.closingInterpolationFractionFromLastActiveToNext01,
    interpolatedEjectionTimeSec: interpolation.interpolatedDurationSec,
  });
}

function measureExactStationsAndAudit(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  cycleLengthSec: number,
): Readonly<{
  exactPressureStations: MainWireAorticOutflowExactPressureStationsV1;
  exactReadbackAudit: MainWireAorticOutflowExactReadbackAuditV1;
}> {
  const beat = result.retainedCompleteBeats.at(-1)!;
  const rawGradients: number[] = [];
  const localGradients: number[] = [];
  const characteristicPressures: number[] = [];
  let exactReadbackCount = 0;
  let allOpeningDriveStationsExact = true;
  let maximumAbsoluteValveFlowReadbackResidualMlPerSec = 0;
  let maximumAbsoluteRawNodeGradientResidualMmHg = 0;
  let maximumAbsoluteAorticNodeReadbackResidualMmHg = 0;
  let maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg = 0;
  let maximumAbsoluteProximalPortReconstructionResidualMmHg = 0;
  let maximumAbsoluteLocalGradientReconstructionResidualMmHg = 0;
  let maximumAbsoluteStationAdditivityResidualMmHg = 0;
  let maximumAbsoluteCyclePhaseResidual01 = 0;

  for (let index = 0; index < beat.samples.length; index += 1) {
    const sample = beat.samples[index]!;
    const valve = sample.valveHydraulics.AoV;
    const exact = valve.recoveredRootPortExactReadback;
    if (exact === undefined) {
      throw new Error(
        `exact proximal-port readback missing at sample ${index}`,
      );
    }
    exactReadbackCount += 1;
    const lv = sample.circulationNodeAbsolutePressureMmHg.LV;
    const ao = sample.circulationNodeAbsolutePressureMmHg.Ao;
    const flow = valve.flowMlPerSec;
    const rawGradient = lv - ao;
    const reconstructedCharacteristic =
      exact.algebraicProximalConstitutivePortPressureMmHg - ao;
    const reconstructedPort = ao + exact.characteristicImpedancePressureMmHg;
    const reconstructedLocal =
      lv - exact.algebraicProximalConstitutivePortPressureMmHg;
    const stationAdditivityResidual =
      rawGradient -
      exact.localValvePressureGradientMmHg -
      exact.characteristicImpedancePressureMmHg;
    const expectedPhase =
      positiveModulo(sample.timeSec, cycleLengthSec) / cycleLengthSec;
    const phaseResidual = Math.abs(
      signedShortestPhaseDifference01(sample.cyclePhase01 - expectedPhase),
    );
    maximumAbsoluteValveFlowReadbackResidualMlPerSec = Math.max(
      maximumAbsoluteValveFlowReadbackResidualMlPerSec,
      Math.abs(flow - sample.circulationEdgeFlowMlPerSec.AoV),
    );
    maximumAbsoluteRawNodeGradientResidualMmHg = Math.max(
      maximumAbsoluteRawNodeGradientResidualMmHg,
      Math.abs(valve.pressureGradientMmHg - rawGradient),
    );
    maximumAbsoluteAorticNodeReadbackResidualMmHg = Math.max(
      maximumAbsoluteAorticNodeReadbackResidualMmHg,
      Math.abs(exact.aorticComplianceNodePressureMmHg - ao),
    );
    maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg = Math.max(
      maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg,
      Math.abs(
        exact.characteristicImpedancePressureMmHg - reconstructedCharacteristic,
      ),
    );
    maximumAbsoluteProximalPortReconstructionResidualMmHg = Math.max(
      maximumAbsoluteProximalPortReconstructionResidualMmHg,
      Math.abs(
        exact.algebraicProximalConstitutivePortPressureMmHg - reconstructedPort,
      ),
    );
    maximumAbsoluteLocalGradientReconstructionResidualMmHg = Math.max(
      maximumAbsoluteLocalGradientReconstructionResidualMmHg,
      Math.abs(exact.localValvePressureGradientMmHg - reconstructedLocal),
    );
    maximumAbsoluteStationAdditivityResidualMmHg = Math.max(
      maximumAbsoluteStationAdditivityResidualMmHg,
      Math.abs(stationAdditivityResidual),
    );
    maximumAbsoluteCyclePhaseResidual01 = Math.max(
      maximumAbsoluteCyclePhaseResidual01,
      phaseResidual,
    );
    allOpeningDriveStationsExact &&=
      exact.openingDrivePressureStation ===
      "LV-minus-proximal-constitutive-port";
    if (flow > 0) {
      rawGradients.push(rawGradient);
      localGradients.push(exact.localValvePressureGradientMmHg);
      characteristicPressures.push(exact.characteristicImpedancePressureMmHg);
    }
  }
  if (rawGradients.length === 0) {
    throw new Error("exact station analysis requires positive forward flow");
  }
  const tolerance = MAIN_WIRE_AORTIC_OUTFLOW_EXACT_READBACK_AUDIT_TOLERANCE_V1;
  const stationEquationsWithinTolerance =
    allOpeningDriveStationsExact &&
    maximumAbsoluteValveFlowReadbackResidualMlPerSec <= tolerance &&
    maximumAbsoluteRawNodeGradientResidualMmHg <= tolerance &&
    maximumAbsoluteAorticNodeReadbackResidualMmHg <= tolerance &&
    maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg <=
      tolerance &&
    maximumAbsoluteProximalPortReconstructionResidualMmHg <= tolerance &&
    maximumAbsoluteLocalGradientReconstructionResidualMmHg <= tolerance &&
    maximumAbsoluteStationAdditivityResidualMmHg <= tolerance &&
    maximumAbsoluteCyclePhaseResidual01 <= tolerance;

  return Object.freeze({
    exactPressureStations: Object.freeze({
      averagingDomain: "strictly-positive-forward-AoV-flow-samples" as const,
      positiveForwardFlowSampleCount: rawGradients.length,
      rawLvMinusAorticComplianceNodeGradientMmHg: meanAndPeak(rawGradients),
      exactLvMinusProximalConstitutivePortGradientMmHg:
        meanAndPeak(localGradients),
      characteristicImpedancePressureMmHg: meanAndPeak(characteristicPressures),
    }),
    exactReadbackAudit: Object.freeze({
      requiredSelectedBeatSampleCount: beat.samples.length,
      availableSelectedBeatSampleCount: exactReadbackCount,
      allSelectedBeatSamplesAvailable: true as const,
      allOpeningDriveStationsExact,
      maximumAbsoluteValveFlowReadbackResidualMlPerSec,
      maximumAbsoluteRawNodeGradientResidualMmHg,
      maximumAbsoluteAorticNodeReadbackResidualMmHg,
      maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg,
      maximumAbsoluteProximalPortReconstructionResidualMmHg,
      maximumAbsoluteLocalGradientReconstructionResidualMmHg,
      maximumAbsoluteStationAdditivityResidualMmHg,
      maximumAbsoluteCyclePhaseResidual01,
      stationEquationsWithinTolerance,
    }),
  });
}

function primaryCyclicPositiveEpisode(
  values: readonly number[],
  requiredIndex: number,
): CyclicEpisodeV1 {
  if (values.length < 3) {
    throw new Error(
      "cyclic episode measurement requires at least three samples",
    );
  }
  if (!(requiredIndex >= 0 && requiredIndex < values.length)) {
    throw new Error("required cyclic episode index is out of range");
  }
  const active = values.map((value, index) => {
    finite(value, `cyclic episode sample ${index}`);
    return value > 0;
  });
  if (!active[requiredIndex]) {
    throw new Error("primary cyclic episode does not contain required peak");
  }
  const totalActiveSampleCount = active.filter(Boolean).length;
  if (totalActiveSampleCount === values.length) {
    throw new Error("cyclic episode has no bracketing inactive samples");
  }
  const episodeCount = active.reduce((count, current, index) => {
    const previous = active[(index - 1 + active.length) % active.length]!;
    return count + (current && !previous ? 1 : 0);
  }, 0);
  let openingIndex = requiredIndex;
  while (active[(openingIndex - 1 + active.length) % active.length]) {
    openingIndex = (openingIndex - 1 + active.length) % active.length;
  }
  let closingIndex = requiredIndex;
  while (active[(closingIndex + 1) % active.length]) {
    closingIndex = (closingIndex + 1) % active.length;
  }
  const activeSampleCount =
    ((closingIndex - openingIndex + active.length) % active.length) + 1;
  return Object.freeze({
    openingIndex,
    closingIndex,
    activeSampleCount,
    episodeCount,
    totalActiveSampleCount,
  });
}

function interpolatedEpisodeDuration(
  shiftedValues: readonly number[],
  episode: CyclicEpisodeV1,
  dtSec: number,
): Readonly<{
  openingInterpolationFractionFromPreviousToFirstActive01: number;
  closingInterpolationFractionFromLastActiveToNext01: number;
  interpolatedDurationSec: number;
}> {
  const previousIndex =
    (episode.openingIndex - 1 + shiftedValues.length) % shiftedValues.length;
  const nextIndex = (episode.closingIndex + 1) % shiftedValues.length;
  const previous = shiftedValues[previousIndex]!;
  const first = shiftedValues[episode.openingIndex]!;
  const last = shiftedValues[episode.closingIndex]!;
  const next = shiftedValues[nextIndex]!;
  if (!(previous <= 0 && first > 0 && last > 0 && next <= 0)) {
    throw new Error("cyclic episode boundaries do not bracket zero");
  }
  const openingFraction = zeroCrossingFraction(previous, first);
  const closingFraction = zeroCrossingFraction(last, next);
  const interpolatedDurationSec =
    (episode.activeSampleCount + closingFraction - openingFraction) * dtSec;
  if (
    !(interpolatedDurationSec > 0) ||
    interpolatedDurationSec > shiftedValues.length * dtSec ||
    !Number.isFinite(interpolatedDurationSec)
  ) {
    throw new Error("interpolated cyclic episode duration is invalid");
  }
  return Object.freeze({
    openingInterpolationFractionFromPreviousToFirstActive01: openingFraction,
    closingInterpolationFractionFromLastActiveToNext01: closingFraction,
    interpolatedDurationSec,
  });
}

function meanAndPeak(values: readonly number[]): MeanAndPeakV1 {
  if (values.length === 0) throw new Error("mean and peak require values");
  return Object.freeze({
    timeMean: values.reduce((sum, value) => sum + value, 0) / values.length,
    peak: maximum(values),
  });
}

function zeroCrossingFraction(left: number, right: number): number {
  const denominator = right - left;
  if (denominator === 0) {
    throw new Error("zero crossing requires distinct bracketing values");
  }
  const fraction = -left / denominator;
  if (!(fraction >= 0 && fraction <= 1) || !Number.isFinite(fraction)) {
    throw new Error("zero crossing interpolation fraction is invalid");
  }
  return fraction;
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function signedShortestPhaseDifference01(value: number): number {
  return positiveModulo(value + 0.5, 1) - 0.5;
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
