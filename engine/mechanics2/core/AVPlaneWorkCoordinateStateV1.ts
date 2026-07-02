import type { AVPlaneSideV1 } from "@/engine/mechanics2/core/AVPlaneGeometryStateV1";

const MMHG_TO_PA = 133.322368;
const CM2_TO_M2 = 1e-4;
const ML_TO_M3 = 1e-6;

export type AVPlaneWorkCoordinateInputSampleV1 = {
  readonly theta: number;
  readonly zAvNorm: number;
  readonly atrialGeometryDeltaMl: number;
  readonly tractionPressureMmHg: number;
  readonly hiddenBloodVolumeSourceMl: number;
};

export type AVPlaneWorkCoordinateOptionsV1 = {
  readonly side: AVPlaneSideV1;
  readonly annularAreaCm2: number;
  readonly maxDisplacementMm: number;
};

export type AVPlaneWorkCoordinateSampleV1 = {
  readonly theta: number;
  readonly zAvNorm: number;
  readonly displacementMm: number;
  readonly nominalDisplacementMm: number;
  readonly velocityCmPerSec: number;
  readonly atrialGeometryDeltaMl: number;
  readonly coordinateVolumeMl: number;
  readonly coordinateVolumeErrorMl: number;
  readonly tractionPressureMmHg: number;
  readonly tractionForceN: number;
  readonly signedPowerW: number;
  readonly positivePowerW: number;
  readonly incrementalSignedWorkJ: number;
  readonly incrementalPositiveWorkJ: number;
  readonly cumulativeSignedWorkJ: number;
  readonly cumulativePositiveWorkJ: number;
  readonly pressureVolumeWorkJ: number;
  readonly forceDisplacementWorkJ: number;
  readonly workClosureErrorJ: number;
  readonly hiddenBloodVolumeSourceMl: number;
};

export type AVPlaneWorkCoordinateSeriesV1 = {
  readonly side: AVPlaneSideV1;
  readonly annularAreaCm2: number;
  readonly maxDisplacementMm: number;
  readonly samples: readonly AVPlaneWorkCoordinateSampleV1[];
};

export type AVPlaneWorkCoordinateSummaryV1 = {
  readonly side: AVPlaneSideV1;
  readonly annularAreaCm2: number;
  readonly maxDisplacementMm: number;
  readonly maxDisplacementObservedMm: number;
  readonly maxNominalDisplacementErrorMm: number;
  readonly maxVelocityAbsCmPerSec: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionForceN: number;
  readonly maxPositivePowerW: number;
  readonly totalPositiveWorkJ: number;
  readonly totalSignedWorkJ: number;
  readonly pressureVolumeWorkJ: number;
  readonly forceDisplacementWorkJ: number;
  readonly maxWorkClosureErrorJ: number;
  readonly maxCoordinateVolumeErrorMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
};

export function buildAVPlaneWorkCoordinateSeriesV1(
  inputSamples: readonly AVPlaneWorkCoordinateInputSampleV1[],
  dtSec: number,
  options: AVPlaneWorkCoordinateOptionsV1,
): AVPlaneWorkCoordinateSeriesV1 {
  const annularAreaCm2 = Math.max(options.annularAreaCm2, 1e-9);
  const maxDisplacementMm = Math.max(options.maxDisplacementMm, 1e-9);
  let cumulativeSignedWorkJ = 0;
  let cumulativePositiveWorkJ = 0;
  let previousDisplacementMm = inputSamples.length > 0
    ? displacementFromGeometryMl(inputSamples[0]!.atrialGeometryDeltaMl, annularAreaCm2)
    : 0;
  const samples = inputSamples.map((sample, index) => {
    const displacementMm = displacementFromGeometryMl(sample.atrialGeometryDeltaMl, annularAreaCm2);
    const nominalDisplacementMm = clamp01(sample.zAvNorm) * maxDisplacementMm;
    const dDisplacementMm = index === 0 ? 0 : displacementMm - previousDisplacementMm;
    const velocityCmPerSec = index === 0 ? 0 : (dDisplacementMm / 10) / Math.max(dtSec, 1e-9);
    const coordinateVolumeMl = annularAreaCm2 * displacementMm / 10;
    const pressurePa = Math.max(0, sample.tractionPressureMmHg) * MMHG_TO_PA;
    const areaM2 = annularAreaCm2 * CM2_TO_M2;
    const tractionForceN = pressurePa * areaM2;
    const signedPowerW = tractionForceN * (velocityCmPerSec / 100);
    const positivePowerW = Math.max(0, signedPowerW);
    const pressureVolumeWorkJ = pressurePa * (sample.atrialGeometryDeltaMl - (
      index === 0 ? sample.atrialGeometryDeltaMl : inputSamples[index - 1]!.atrialGeometryDeltaMl
    )) * ML_TO_M3;
    const forceDisplacementWorkJ = tractionForceN * (dDisplacementMm / 1000);
    const incrementalSignedWorkJ = forceDisplacementWorkJ;
    const incrementalPositiveWorkJ = Math.max(0, forceDisplacementWorkJ);
    cumulativeSignedWorkJ += incrementalSignedWorkJ;
    cumulativePositiveWorkJ += incrementalPositiveWorkJ;
    previousDisplacementMm = displacementMm;
    return {
      theta: sample.theta,
      zAvNorm: sample.zAvNorm,
      displacementMm,
      nominalDisplacementMm,
      velocityCmPerSec,
      atrialGeometryDeltaMl: sample.atrialGeometryDeltaMl,
      coordinateVolumeMl,
      coordinateVolumeErrorMl: coordinateVolumeMl - sample.atrialGeometryDeltaMl,
      tractionPressureMmHg: sample.tractionPressureMmHg,
      tractionForceN,
      signedPowerW,
      positivePowerW,
      incrementalSignedWorkJ,
      incrementalPositiveWorkJ,
      cumulativeSignedWorkJ,
      cumulativePositiveWorkJ,
      pressureVolumeWorkJ,
      forceDisplacementWorkJ,
      workClosureErrorJ: forceDisplacementWorkJ - pressureVolumeWorkJ,
      hiddenBloodVolumeSourceMl: sample.hiddenBloodVolumeSourceMl,
    };
  });
  return {
    side: options.side,
    annularAreaCm2,
    maxDisplacementMm,
    samples,
  };
}

export function summarizeAVPlaneWorkCoordinateSeriesV1(
  series: AVPlaneWorkCoordinateSeriesV1,
): AVPlaneWorkCoordinateSummaryV1 {
  const samples = series.samples;
  const last = samples[samples.length - 1];
  return {
    side: series.side,
    annularAreaCm2: round(series.annularAreaCm2),
    maxDisplacementMm: round(series.maxDisplacementMm),
    maxDisplacementObservedMm: round(Math.max(0, ...samples.map((sample) => sample.displacementMm))),
    maxNominalDisplacementErrorMm:
      round(maxAbs(samples.map((sample) => sample.displacementMm - sample.nominalDisplacementMm))),
    maxVelocityAbsCmPerSec: round(maxAbs(samples.map((sample) => sample.velocityCmPerSec))),
    maxTractionPressureMmHg: round(Math.max(0, ...samples.map((sample) => sample.tractionPressureMmHg))),
    maxTractionForceN: round(Math.max(0, ...samples.map((sample) => sample.tractionForceN))),
    maxPositivePowerW: round(Math.max(0, ...samples.map((sample) => sample.positivePowerW))),
    totalPositiveWorkJ: round(last?.cumulativePositiveWorkJ ?? 0),
    totalSignedWorkJ: round(last?.cumulativeSignedWorkJ ?? 0),
    pressureVolumeWorkJ: round(samples.reduce((sum, sample) => sum + sample.pressureVolumeWorkJ, 0)),
    forceDisplacementWorkJ: round(samples.reduce((sum, sample) => sum + sample.forceDisplacementWorkJ, 0)),
    maxWorkClosureErrorJ: round(maxAbs(samples.map((sample) => sample.workClosureErrorJ))),
    maxCoordinateVolumeErrorMl: round(maxAbs(samples.map((sample) => sample.coordinateVolumeErrorMl))),
    maxHiddenBloodVolumeSourceMl: round(maxAbs(samples.map((sample) => sample.hiddenBloodVolumeSourceMl))),
  };
}

function displacementFromGeometryMl(geometryDeltaMl: number, annularAreaCm2: number): number {
  return 10 * geometryDeltaMl / Math.max(annularAreaCm2, 1e-9);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
