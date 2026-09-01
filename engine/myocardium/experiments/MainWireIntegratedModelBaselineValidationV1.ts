import type {
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID =
  "main-wire-integrated-model-baseline-validation-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1 =
  Object.freeze({
    pressureMorphology: Object.freeze({
      requiredForwardEpisodeCount: 1,
      requiredSignificantPeakCount: 1,
      maximumTotalVariationRatio: 2.2,
      minimumCentralRangeFraction: 0.08,
      maximumCentralRangeFraction: 0.35,
      minimumPeakPhase01: 0.2,
      maximumPeakPhase01: 0.8,
    }),
    aorticValveGradientMmHg: Object.freeze({
      mean: Object.freeze({ minimum: 0, maximum: 5 }),
      peak: Object.freeze({ minimum: 0, maximum: 10 }),
    }),
    aorticEjectionTimeSec: Object.freeze({ minimum: 0.24, maximum: 0.34 }),
    lvPressureRateMmHgPerSec: Object.freeze({
      maximum: Object.freeze({ minimum: 1_200, maximum: 2_500 }),
      minimum: Object.freeze({ minimum: -1_400, maximum: -700 }),
    }),
    mitralPeakEToA: Object.freeze({ minimum: 0.8, maximum: 2 }),
    ventricularTimingSec: Object.freeze({
      isovolumicContraction: Object.freeze({ minimum: 0.02, maximum: 0.06 }),
      isovolumicRelaxation: Object.freeze({ minimum: 0.059, maximum: 0.134 }),
      teiIndex: Object.freeze({ minimum: 0.29, maximum: 0.65 }),
    }),
  });

export type MainWireIntegratedModelBaselineValidationCheckIdV1 =
  | "settlement.period1"
  | "waveform.LVP.single-peak-no-ringing"
  | "waveform.LVP.rounded-not-plateau"
  | "waveform.RVP.single-peak-no-ringing"
  | "waveform.RVP.rounded-not-plateau"
  | "aortic-valve.mean-gradient"
  | "aortic-valve.peak-gradient"
  | "aortic-valve.ejection-time"
  | "left-ventricle.maximum-dpdt"
  | "left-ventricle.minimum-dpdt"
  | "mitral-flow.peak-e-to-a"
  | "timing.ict"
  | "timing.irt"
  | "timing.tei-index";

export type MainWireIntegratedModelBaselineValidationCheckV1 = Readonly<{
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  status: "passed" | "failed";
  actual: number;
  minimum: number;
  maximum: number;
  unit: string;
}>;

export type MainWireIntegratedModelBaselineValidationMeasurementsV1 =
  Readonly<{
    LVP: PressureMorphologyV1;
    RVP: PressureMorphologyV1;
    aorticValve: Readonly<{
      ejectionTimeSec: number;
      meanGradientMmHg: number;
      peakGradientMmHg: number;
    }>;
    leftVentricle: Readonly<{
      maximumDpDtMmHgPerSec: number;
      minimumDpDtMmHgPerSec: number;
    }>;
    mitralFlow: Readonly<{
      peakEMlPerSec: number;
      peakAMlPerSec: number;
      peakEToA: number;
    }>;
    timing: Readonly<{
      ictSec: number;
      irtSec: number;
      teiIndex: number;
    }>;
  }>;

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
type ValveId = keyof Sample["valveFlowMlPerSec"];
type VentricularPressureId = "LV" | "RV";

type ForwardEpisodeV1 = Readonly<{
  start: number;
  end: number;
  count: number;
}>;

export type MainWireIntegratedModelPressureMorphologyV1 = Readonly<{
  forwardEpisodeCount: number;
  significantPeakCount: number;
  totalVariationRatio: number;
  centralRangeFraction: number;
  peakPhase01: number;
}>;

type PressureMorphologyV1 = MainWireIntegratedModelPressureMorphologyV1;

export function measureMainWireIntegratedModelBaselineValidationV1(
  samples: readonly Sample[],
): MainWireIntegratedModelBaselineValidationMeasurementsV1 {
  if (samples.length < 12) {
    throw new Error("baseline validation requires a complete accepted-step cycle");
  }
  const cycleLengthSec = samples.reduce(
    (sum, sample) => sum + requirePositiveFiniteV1(
      sample.acceptedDtSec,
      "acceptedDtSec",
    ),
    0,
  );
  const aorticEpisode = primaryForwardEpisodeV1(samples, "AoV");
  const pulmonaryEpisode = primaryForwardEpisodeV1(samples, "PV");
  const aorticSamples = cyclicSliceV1(
    samples,
    aorticEpisode.start,
    aorticEpisode.end,
  );
  const gradients = aorticSamples.map((sample) =>
    sample.absolutePressureMmHg.LV - sample.absolutePressureMmHg.Ao);
  const pressureRate = pressureRateExtremaV1(samples, "LV");
  const timing = ventricularTimingV1(samples, aorticEpisode, cycleLengthSec);
  const mitral = mitralPeakEToAV1(samples, timing);

  return Object.freeze({
    LVP: pressureMorphologyV1(samples, aorticEpisode, "LV"),
    RVP: pressureMorphologyV1(samples, pulmonaryEpisode, "RV"),
    aorticValve: Object.freeze({
      ejectionTimeSec: aorticSamples.reduce(
        (sum, sample) => sum + sample.acceptedDtSec,
        0,
      ),
      meanGradientMmHg: timeWeightedMeanV1(aorticSamples, gradients),
      peakGradientMmHg: Math.max(...gradients),
    }),
    leftVentricle: Object.freeze({
      maximumDpDtMmHgPerSec: pressureRate.maximum,
      minimumDpDtMmHgPerSec: pressureRate.minimum,
    }),
    mitralFlow: Object.freeze({
      peakEMlPerSec: mitral.peakE,
      peakAMlPerSec: mitral.peakA,
      peakEToA: mitral.peakE / mitral.peakA,
    }),
    timing: Object.freeze({
      ictSec: timing.ictSec,
      irtSec: timing.irtSec,
      teiIndex:
        (timing.ictSec + timing.irtSec) /
        timing.ejectionTimeSec,
    }),
  });
}

export function buildMainWireIntegratedModelBaselineValidationChecksV1(
  measurements: MainWireIntegratedModelBaselineValidationMeasurementsV1,
  period1Established: boolean,
): readonly MainWireIntegratedModelBaselineValidationCheckV1[] {
  const policy = MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1;
  const checks = [
    exactCheckV1("settlement.period1", period1Established ? 1 : 0, 1, "bool"),
    boundedCheckV1(
      "waveform.LVP.single-peak-no-ringing",
      measurements.LVP.significantPeakCount ===
          policy.pressureMorphology.requiredSignificantPeakCount &&
        measurements.LVP.forwardEpisodeCount ===
          policy.pressureMorphology.requiredForwardEpisodeCount &&
        measurements.LVP.totalVariationRatio <=
          policy.pressureMorphology.maximumTotalVariationRatio
        ? 1
        : 0,
      1,
      1,
      "bool",
    ),
    morphologyRoundnessCheckV1("waveform.LVP.rounded-not-plateau", measurements.LVP),
    boundedCheckV1(
      "waveform.RVP.single-peak-no-ringing",
      measurements.RVP.significantPeakCount ===
          policy.pressureMorphology.requiredSignificantPeakCount &&
        measurements.RVP.forwardEpisodeCount ===
          policy.pressureMorphology.requiredForwardEpisodeCount &&
        measurements.RVP.totalVariationRatio <=
          policy.pressureMorphology.maximumTotalVariationRatio
        ? 1
        : 0,
      1,
      1,
      "bool",
    ),
    morphologyRoundnessCheckV1("waveform.RVP.rounded-not-plateau", measurements.RVP),
    rangeCheckV1(
      "aortic-valve.mean-gradient",
      measurements.aorticValve.meanGradientMmHg,
      policy.aorticValveGradientMmHg.mean,
      "mmHg",
    ),
    rangeCheckV1(
      "aortic-valve.peak-gradient",
      measurements.aorticValve.peakGradientMmHg,
      policy.aorticValveGradientMmHg.peak,
      "mmHg",
    ),
    rangeCheckV1(
      "aortic-valve.ejection-time",
      measurements.aorticValve.ejectionTimeSec,
      policy.aorticEjectionTimeSec,
      "s",
    ),
    rangeCheckV1(
      "left-ventricle.maximum-dpdt",
      measurements.leftVentricle.maximumDpDtMmHgPerSec,
      policy.lvPressureRateMmHgPerSec.maximum,
      "mmHg/s",
    ),
    rangeCheckV1(
      "left-ventricle.minimum-dpdt",
      measurements.leftVentricle.minimumDpDtMmHgPerSec,
      policy.lvPressureRateMmHgPerSec.minimum,
      "mmHg/s",
    ),
    rangeCheckV1(
      "mitral-flow.peak-e-to-a",
      measurements.mitralFlow.peakEToA,
      policy.mitralPeakEToA,
      "ratio",
    ),
    rangeCheckV1(
      "timing.ict",
      measurements.timing.ictSec,
      policy.ventricularTimingSec.isovolumicContraction,
      "s",
    ),
    rangeCheckV1(
      "timing.irt",
      measurements.timing.irtSec,
      policy.ventricularTimingSec.isovolumicRelaxation,
      "s",
    ),
    rangeCheckV1(
      "timing.tei-index",
      measurements.timing.teiIndex,
      policy.ventricularTimingSec.teiIndex,
      "ratio",
    ),
  ] satisfies MainWireIntegratedModelBaselineValidationCheckV1[];
  return Object.freeze(checks);
}

export function assertMainWireIntegratedModelBaselineValidationPassedV1(
  checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[],
): void {
  const failed = checks.filter(({ status }) => status !== "passed");
  if (failed.length > 0) {
    throw new Error(
      "baseline validation gate rejected: " + failed.map((check) =>
        `${check.checkId}=${check.actual} outside [${check.minimum}, ${check.maximum}]`,
      ).join("; "),
    );
  }
}

function pressureMorphologyV1(
  samples: readonly Sample[],
  episode: ForwardEpisodeV1,
  pressureId: VentricularPressureId,
): PressureMorphologyV1 {
  const values = cyclicSliceV1(samples, episode.start, episode.end).map(
    (sample) => sample.absolutePressureMmHg[pressureId],
  );
  const peakIndex = values.indexOf(Math.max(...values));
  const central = values.slice(
    Math.floor(0.25 * values.length),
    Math.ceil(0.75 * values.length),
  );
  const range = Math.max(...values) - Math.min(...values);
  return Object.freeze({
    forwardEpisodeCount: episode.count,
    significantPeakCount: significantPeakCountV1(values),
    totalVariationRatio: totalVariationRatioV1(values),
    centralRangeFraction: range > 0
      ? (Math.max(...central) - Math.min(...central)) / range
      : 0,
    peakPhase01: peakIndex / Math.max(1, values.length - 1),
  });
}

function primaryForwardEpisodeV1(
  samples: readonly Sample[],
  valveId: ValveId,
): ForwardEpisodeV1 {
  const flows = samples.map((sample) => sample.valveFlowMlPerSec[valveId]);
  const threshold = Math.max(1, 0.01 * Math.max(...flows));
  const open = flows.map((flow) => flow > threshold);
  const runs: Array<{ start: number; end: number }> = [];
  let start: number | null = null;
  for (let index = 0; index < open.length; index += 1) {
    if (open[index] && start === null) start = index;
    if (!open[index] && start !== null) {
      runs.push({ start, end: index - 1 });
      start = null;
    }
  }
  if (start !== null) runs.push({ start, end: open.length - 1 });
  if (
    runs.length > 1 && runs[0]!.start === 0 &&
    runs.at(-1)!.end === open.length - 1
  ) {
    const first = runs.shift()!;
    const last = runs.pop()!;
    runs.unshift({ start: last.start, end: first.end + open.length });
  }
  if (runs.length === 0) {
    throw new Error(`baseline validation found no ${valveId} forward episode`);
  }
  const primary = [...runs].sort((left, right) =>
    episodeForwardVolumeV1(flows, right) - episodeForwardVolumeV1(flows, left),
  )[0]!;
  return Object.freeze({
    start: primary.start,
    end: primary.end,
    count: runs.length,
  });
}

function episodeForwardVolumeV1(
  flows: readonly number[],
  run: Readonly<{ start: number; end: number }>,
): number {
  let total = 0;
  for (let index = run.start; index <= run.end; index += 1) {
    total += Math.max(0, flows[index % flows.length]!);
  }
  return total;
}

function ventricularTimingV1(
  samples: readonly Sample[],
  outlet: ForwardEpisodeV1,
  cycleLengthSec: number,
) {
  const inletPeak = Math.max(...samples.map((sample) =>
    sample.valveFlowMlPerSec.MV));
  const inletThreshold = Math.max(1, 0.01 * inletPeak);
  const inletOpen = samples.map((sample) =>
    sample.valveFlowMlPerSec.MV > inletThreshold);
  const outletStart = outlet.start % samples.length;
  const outletEnd = outlet.end % samples.length;
  const inletClosure = previousTransitionV1(
    inletOpen,
    outletStart,
    true,
    false,
  );
  const outletClosure = (outletEnd + 1) % samples.length;
  const inletOpening = nextTransitionV1(
    inletOpen,
    outletClosure,
    false,
    true,
  );
  return Object.freeze({
    inletClosure,
    inletOpening,
    ictSec: cyclicTimeDeltaV1(samples, inletClosure, outletStart, cycleLengthSec),
    irtSec: cyclicTimeDeltaV1(samples, outletClosure, inletOpening, cycleLengthSec),
    ejectionTimeSec: cyclicSliceV1(samples, outlet.start, outlet.end).reduce(
      (sum, sample) => sum + sample.acceptedDtSec,
      0,
    ),
  });
}

function mitralPeakEToAV1(
  samples: readonly Sample[],
  timing: Readonly<{ inletClosure: number; inletOpening: number }>,
) {
  const fillingIndices = cyclicHalfOpenIndicesV1(
    samples.length,
    timing.inletOpening,
    timing.inletClosure,
  );
  const filling = fillingIndices.map((index) =>
    samples[index]!.valveFlowMlPerSec.MV);
  const candidates = filling.flatMap((flow, index) =>
    index > 0 && index < filling.length - 1
      && flow > filling[index - 1]!
      && flow >= filling[index + 1]!
      && flow > 0
      ? [Object.freeze({ index, flow })]
      : []);
  const minimumSeparation = Math.max(2, Math.floor(0.15 * filling.length));
  let best: Readonly<{
    first: Readonly<{ index: number; flow: number }>;
    second: Readonly<{ index: number; flow: number }>;
    score: number;
  }> | null = null;
  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      const left = candidates[first]!;
      const right = candidates[second]!;
      if (right.index - left.index < minimumSeparation) continue;
      const score = left.flow + right.flow;
      if (best === null || score > best.score) {
        best = Object.freeze({ first: left, second: right, score });
      }
    }
  }
  const peakE = best?.first.flow ?? 0;
  const peakA = best?.second.flow ?? 0;
  if (!(peakE > 0) || !(peakA > 0)) {
    throw new Error(
      "baseline validation could not resolve two separated positive mitral E/A peaks",
    );
  }
  return Object.freeze({ peakE, peakA });
}

function cyclicTimeDeltaV1(
  samples: readonly Sample[],
  from: number,
  to: number,
  cycleLengthSec: number,
): number {
  const direct = samples[to]!.acceptedTimeSec - samples[from]!.acceptedTimeSec;
  return direct >= 0 ? direct : cycleLengthSec + direct;
}

function cyclicHalfOpenIndicesV1(
  length: number,
  start: number,
  end: number,
): readonly number[] {
  const indices: number[] = [];
  for (let index = start; index !== end; index = (index + 1) % length) {
    indices.push(index);
    if (indices.length > length) {
      throw new Error("baseline validation cyclic window did not terminate");
    }
  }
  return indices;
}

function previousTransitionV1(
  values: readonly boolean[],
  before: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (before - offset + values.length) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("baseline validation prior valve transition is unresolved");
}

function nextTransitionV1(
  values: readonly boolean[],
  after: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (after + offset) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("baseline validation next valve transition is unresolved");
}

function cyclicSliceV1<T>(
  values: readonly T[],
  start: number,
  end: number,
): readonly T[] {
  const result: T[] = [];
  for (let index = start; index <= end; index += 1) {
    result.push(values[index % values.length]!);
  }
  return result;
}

function timeWeightedMeanV1(
  samples: readonly Sample[],
  values: readonly number[],
): number {
  const duration = samples.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  return values.reduce((sum, value, index) =>
    sum + value * samples[index]!.acceptedDtSec, 0) / duration;
}

function pressureRateExtremaV1(
  samples: readonly Sample[],
  chamber: VentricularPressureId,
) {
  const rates = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg[chamber] -
      samples[index]!.absolutePressureMmHg[chamber]) /
    sample.acceptedDtSec);
  return Object.freeze({
    maximum: Math.max(...rates),
    minimum: Math.min(...rates),
  });
}

function significantPeakCountV1(values: readonly number[]): number {
  const prominenceThreshold = Math.max(
    0.5,
    0.05 * (Math.max(...values) - Math.min(...values)),
  );
  const peaks: number[] = [];
  for (let index = 1; index < values.length - 1; index += 1) {
    if (
      values[index]! > values[index - 1]! &&
      values[index]! >= values[index + 1]!
    ) peaks.push(index);
  }
  return peaks.filter((index, ordinal) => {
    const left = ordinal === 0 ? 0 : peaks[ordinal - 1]!;
    const right = ordinal === peaks.length - 1
      ? values.length - 1
      : peaks[ordinal + 1]!;
    const prominence = values[index]! - Math.max(
      Math.min(...values.slice(left, index + 1)),
      Math.min(...values.slice(index, right + 1)),
    );
    return prominence >= prominenceThreshold;
  }).length;
}

function totalVariationRatioV1(values: readonly number[]): number {
  const range = Math.max(...values) - Math.min(...values);
  if (range <= 0) return Number.POSITIVE_INFINITY;
  return values.slice(1).reduce((sum, value, index) =>
    sum + Math.abs(value - values[index]!), 0) / range;
}

function morphologyRoundnessCheckV1(
  checkId:
    | "waveform.LVP.rounded-not-plateau"
    | "waveform.RVP.rounded-not-plateau",
  measurement: PressureMorphologyV1,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  const policy =
    MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1
      .pressureMorphology;
  const passed =
    measurement.centralRangeFraction >= policy.minimumCentralRangeFraction &&
    measurement.centralRangeFraction <= policy.maximumCentralRangeFraction &&
    measurement.peakPhase01 >= policy.minimumPeakPhase01 &&
    measurement.peakPhase01 <= policy.maximumPeakPhase01;
  return Object.freeze({
    checkId,
    status: passed ? "passed" as const : "failed" as const,
    actual: measurement.centralRangeFraction,
    minimum: policy.minimumCentralRangeFraction,
    maximum: policy.maximumCentralRangeFraction,
    unit: "fraction",
  });
}

function exactCheckV1(
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
  actual: number,
  expected: number,
  unit: string,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  return boundedCheckV1(checkId, actual, expected, expected, unit);
}

function rangeCheckV1(
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
  actual: number,
  range: Readonly<{ minimum: number; maximum: number }>,
  unit: string,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  return boundedCheckV1(
    checkId,
    actual,
    range.minimum,
    range.maximum,
    unit,
  );
}

function boundedCheckV1(
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1,
  actual: number,
  minimum: number,
  maximum: number,
  unit: string,
): MainWireIntegratedModelBaselineValidationCheckV1 {
  const status = Number.isFinite(actual) && actual >= minimum && actual <= maximum
    ? "passed" as const
    : "failed" as const;
  return Object.freeze({ checkId, status, actual, minimum, maximum, unit });
}

function requirePositiveFiniteV1(value: number, label: string): number {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`baseline validation ${label} must be positive finite`);
  }
  return value;
}
