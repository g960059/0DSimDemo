import {
  buildMechanics2InitialReplayFixturesV1,
  REQUIRED_FIBER_REPLAY_FIXTURE_IDS_V1,
  validateFiberReplayFixtureV1,
  type FiberReplayFixtureV1,
} from "@/engine/mechanics2/fixtures/TraceFixtureV1";
import {
  DEFAULT_HILL_SERIES_FIBER_PARAMS_V1,
  initialHillSeriesFiberStateV1,
  stepHillSeriesFiberV1,
  type HillSeriesFiberOutputV1,
  type HillSeriesFiberParamsV1,
} from "@/engine/mechanics2/fiber/HillSeriesFiberV1";

export const HILL_SERIES_FIBER_REPLAY_REPORT_ID_V1 =
  "hill-series-fiber-replay-report-v1" as const;

export type HillSeriesFiberReplayGateV1 = {
  readonly stressMorphology: {
    readonly maxDominantPeakCount: number;
    readonly maxSecondaryPeakProminenceRatio: number;
    readonly minStressFwhmFractionOfCycle: number;
    readonly maxStressFwhmFractionOfCycle: number;
    readonly maxC1SmoothnessPenalty: number;
  };
  readonly seriesElasticSafety: {
    readonly maxLSeRangeNormalized: number;
    readonly maxLSeAbsorptionRatio: number;
    readonly minLSiMotionRatio: number;
    readonly maxSeriesElasticEnergyFraction: number;
    readonly maxLSeRecoveryTimeFractionOfCycle: number;
  };
  readonly robustness: {
    readonly minFixturePassRate: number;
    readonly maxParameterCoverageFailRate: number;
  };
};

export const PRE_REGISTERED_HILL_SERIES_FIBER_REPLAY_GATE_V1: HillSeriesFiberReplayGateV1 = {
  stressMorphology: {
    maxDominantPeakCount: 1,
    maxSecondaryPeakProminenceRatio: 0.08,
    minStressFwhmFractionOfCycle: 0.08,
    maxStressFwhmFractionOfCycle: 0.35,
    maxC1SmoothnessPenalty: 0.20,
  },
  seriesElasticSafety: {
    maxLSeRangeNormalized: 0.20,
    maxLSeAbsorptionRatio: 0.70,
    minLSiMotionRatio: 0.15,
    maxSeriesElasticEnergyFraction: 0.60,
    maxLSeRecoveryTimeFractionOfCycle: 0.20,
  },
  robustness: {
    minFixturePassRate: 0.85,
    maxParameterCoverageFailRate: 0.10,
  },
};

export type FiberReplayFixtureResultV1 = {
  readonly fixtureId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly fixtureErrors: readonly string[];
  readonly dominantPeakCount: number;
  readonly secondaryPeakProminenceRatio: number | null;
  readonly stressFwhmFractionOfCycle: number | null;
  readonly c1SmoothnessPenalty: number;
  readonly lSeRangeNormalized: number;
  readonly lSeAbsorptionRatio: number | null;
  readonly lSiMotionRatio: number | null;
  readonly seriesElasticEnergyFraction: number | null;
  readonly lSeRecoveryTimeFractionOfCycle: number | null;
  readonly activationAWithinZeroOne: boolean;
  readonly noNaNOrInf: boolean;
  readonly failureReasons: readonly string[];
};

export type HillSeriesFiberReplayReportV1 = {
  readonly reportId: typeof HILL_SERIES_FIBER_REPLAY_REPORT_ID_V1;
  readonly gateId: "hillSeriesFiberReplayGateV1";
  readonly overallStatus: "go" | "no-go" | "inconclusive";
  readonly fixtureResults: readonly FiberReplayFixtureResultV1[];
  readonly parameterSweepSummary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
  };
  readonly decision: {
    readonly mayProceedToOneFiberChamber: boolean;
    readonly reason: string;
  };
};

export function runHillSeriesFiberReplayBenchV1(
  fixtures: readonly FiberReplayFixtureV1[] = buildMechanics2InitialReplayFixturesV1(),
  gate: HillSeriesFiberReplayGateV1 = PRE_REGISTERED_HILL_SERIES_FIBER_REPLAY_GATE_V1,
): HillSeriesFiberReplayReportV1 {
  const requiredIds = new Set(REQUIRED_FIBER_REPLAY_FIXTURE_IDS_V1);
  const fixtureIdList = fixtures.map((fixture) => fixture.fixtureId);
  const fixtureIds = new Set(fixtureIdList);
  const duplicateIds = [...fixtureIds].filter((id) => fixtureIdList.filter((fixtureId) => fixtureId === id).length > 1);
  const missing = [...requiredIds].filter((id) => !fixtureIds.has(id));
  const fixtureResults = fixtures.map((fixture) => evaluateFixture(fixture, gate));
  const pass = fixtureResults.filter((result) => result.status === "pass").length;
  const fail = fixtureResults.filter((result) => result.status === "fail").length + missing.length + duplicateIds.length;
  const inconclusive = fixtureResults.filter((result) => result.status === "inconclusive").length;
  const total = fixtureResults.length + missing.length;
  const passRate = total > 0 ? pass / total : 0;
  const failRate = total > 0 ? fail / total : 1;
  const overallStatus = missing.length > 0 || duplicateIds.length > 0 || inconclusive > 0
    ? "no-go"
    : passRate >= gate.robustness.minFixturePassRate && failRate <= gate.robustness.maxParameterCoverageFailRate
      ? "go"
      : "no-go";
  return {
    reportId: HILL_SERIES_FIBER_REPLAY_REPORT_ID_V1,
    gateId: "hillSeriesFiberReplayGateV1",
    overallStatus,
    fixtureResults,
    parameterSweepSummary: { total, pass, fail, inconclusive },
    decision: {
      mayProceedToOneFiberChamber: overallStatus === "go",
      reason: duplicateIds.length > 0
        ? `Duplicate fixtures: ${duplicateIds.join(", ")}`
        : missing.length > 0
        ? `Missing required fixtures: ${missing.join(", ")}`
        : inconclusive > 0
          ? "At least one required replay fixture was inconclusive."
        : overallStatus === "go"
          ? "HillSeriesFiberV1 replay gate passed the pre-registered fixture set."
          : "HillSeriesFiberV1 replay gate failed or produced insufficient pass coverage.",
    },
  };
}

function evaluateFixture(
  fixture: FiberReplayFixtureV1,
  gate: HillSeriesFiberReplayGateV1,
): FiberReplayFixtureResultV1 {
  const fixtureErrors = validateFiberReplayFixtureV1(fixture);
  if (fixtureErrors.length > 0) {
    return emptyResult(fixture.fixtureId, "inconclusive", fixtureErrors);
  }
  const outputs = replayFixture(fixture);
  const stress = outputs.map((output) => output.sigmaTotalPa);
  const lSe = outputs.map((output) => output.lSe);
  const lSi = outputs.map((output) => output.lSi);
  const a = outputs.map((output) => output.state.a);
  const energies = outputs.map((output) => output.seriesElasticEnergyJPerM3);
  const peakInfo = peakSummary(stress);
  const stressFwhmFractionOfCycle = fwhmFraction(stress);
  const lSeAbsorptionRatio = variance(lSe) / Math.max(variance(fixture.lS), 1e-12);
  const lSiMotionRatio = variance(lSi) / Math.max(variance(fixture.lS), 1e-12);
  const seriesElasticEnergyFraction = Math.max(...energies) / Math.max(maxAbs(stress), 1e-9);
  const lSeRecoveryTimeFractionOfCycle = recoveryFraction(lSe);
  const result = {
    fixtureId: fixture.fixtureId,
    status: "pass" as const,
    fixtureErrors,
    dominantPeakCount: peakInfo.dominantPeakCount,
    secondaryPeakProminenceRatio: peakInfo.secondaryPeakProminenceRatio,
    stressFwhmFractionOfCycle,
    c1SmoothnessPenalty: c1SmoothnessPenalty(stress),
    lSeRangeNormalized: Math.max(...lSe) - Math.min(...lSe),
    lSeAbsorptionRatio,
    lSiMotionRatio,
    seriesElasticEnergyFraction,
    lSeRecoveryTimeFractionOfCycle,
    activationAWithinZeroOne: a.every((value) => value >= -1e-9 && value <= 1 + 1e-9),
    noNaNOrInf: outputs.every((output) => Object.values(output).every((value) =>
      typeof value !== "number" || Number.isFinite(value)
    )),
    failureReasons: [],
  };
  const failureReasons = failureReasonsFor(result, gate);
  return { ...result, status: failureReasons.length === 0 ? "pass" : "fail", failureReasons };
}

function replayFixture(
  fixture: FiberReplayFixtureV1,
  params: HillSeriesFiberParamsV1 = DEFAULT_HILL_SERIES_FIBER_PARAMS_V1,
): readonly HillSeriesFiberOutputV1[] {
  let state = initialHillSeriesFiberStateV1(fixture.lS[0] ?? 1);
  const outputs: HillSeriesFiberOutputV1[] = [];
  for (let i = 0; i < fixture.timeSec.length; i++) {
    const tSec = fixture.timeSec[i]!;
    const dtSec = i === 0 ? 1 / fixture.sampleRateHz : tSec - fixture.timeSec[i - 1]!;
    const lS = fixture.lS[i]!;
    const lSPrev = fixture.lS[Math.max(0, i - 1)] ?? lS;
    const output = stepHillSeriesFiberV1(state, {
      tSec,
      dtSec,
      cycleLengthSec: fixture.cycleLengthSec,
      activationTimeSec: fixture.activationTimeSec,
      lS,
      lSDot: (lS - lSPrev) / Math.max(dtSec, 1e-6),
    }, params);
    outputs.push(output);
    state = output.state;
  }
  return outputs;
}

function failureReasonsFor(
  result: Omit<FiberReplayFixtureResultV1, "status" | "failureReasons">,
  gate: HillSeriesFiberReplayGateV1,
): readonly string[] {
  const failures: string[] = [];
  if (!result.noNaNOrInf) failures.push("non-finite-output");
  if (!result.activationAWithinZeroOne) failures.push("activation-a-out-of-bounds");
  if (result.dominantPeakCount > gate.stressMorphology.maxDominantPeakCount) failures.push("dominant-stress-multipeak");
  if ((result.secondaryPeakProminenceRatio ?? 0) > gate.stressMorphology.maxSecondaryPeakProminenceRatio) failures.push("secondary-stress-peak-prominent");
  if ((result.stressFwhmFractionOfCycle ?? 0) < gate.stressMorphology.minStressFwhmFractionOfCycle) failures.push("stress-too-narrow");
  if ((result.stressFwhmFractionOfCycle ?? 1) > gate.stressMorphology.maxStressFwhmFractionOfCycle) failures.push("stress-too-wide");
  if (result.c1SmoothnessPenalty > gate.stressMorphology.maxC1SmoothnessPenalty) failures.push("stress-c1-rough");
  if (result.lSeRangeNormalized > gate.seriesElasticSafety.maxLSeRangeNormalized) failures.push("lSe-range-too-large");
  if ((result.lSeAbsorptionRatio ?? 1) > gate.seriesElasticSafety.maxLSeAbsorptionRatio) failures.push("lSe-hidden-clamp");
  if ((result.lSiMotionRatio ?? 0) < gate.seriesElasticSafety.minLSiMotionRatio) failures.push("lSi-nearly-frozen");
  if ((result.seriesElasticEnergyFraction ?? 1) > gate.seriesElasticSafety.maxSeriesElasticEnergyFraction) failures.push("series-elastic-energy-dominant");
  if ((result.lSeRecoveryTimeFractionOfCycle ?? 1) > gate.seriesElasticSafety.maxLSeRecoveryTimeFractionOfCycle) failures.push("lSe-recovery-too-slow");
  return failures;
}

function emptyResult(
  fixtureId: string,
  status: FiberReplayFixtureResultV1["status"],
  fixtureErrors: readonly string[],
): FiberReplayFixtureResultV1 {
  return {
    fixtureId,
    status,
    fixtureErrors,
    dominantPeakCount: 0,
    secondaryPeakProminenceRatio: null,
    stressFwhmFractionOfCycle: null,
    c1SmoothnessPenalty: 0,
    lSeRangeNormalized: 0,
    lSeAbsorptionRatio: null,
    lSiMotionRatio: null,
    seriesElasticEnergyFraction: null,
    lSeRecoveryTimeFractionOfCycle: null,
    activationAWithinZeroOne: false,
    noNaNOrInf: false,
    failureReasons: fixtureErrors,
  };
}

function peakSummary(values: readonly number[]): { dominantPeakCount: number; secondaryPeakProminenceRatio: number | null } {
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = Math.max(maxValue - minValue, 1e-9);
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i]! > values[i - 1]! && values[i]! >= values[i + 1]!) {
      const prominence = (values[i]! - Math.max(values[i - 1]!, values[i + 1]!)) / range;
      if (prominence > 0.015) peaks.push(values[i]! - minValue);
    }
  }
  peaks.sort((a, b) => b - a);
  const dominantPeakCount = peaks.filter((peak) => peak / Math.max(peaks[0] ?? 1, 1e-9) > 0.25).length;
  const secondaryPeakProminenceRatio = peaks.length > 1 ? peaks[1]! / Math.max(peaks[0]!, 1e-9) : 0;
  return { dominantPeakCount, secondaryPeakProminenceRatio };
}

function fwhmFraction(values: readonly number[]): number | null {
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const half = minValue + 0.5 * (maxValue - minValue);
  const count = values.filter((value) => value >= half).length;
  return values.length > 0 ? count / values.length : null;
}

function c1SmoothnessPenalty(values: readonly number[]): number {
  const slopes: number[] = [];
  for (let i = 1; i < values.length; i++) slopes.push(values[i]! - values[i - 1]!);
  const maxSlope = maxAbs(slopes);
  if (maxSlope <= 1e-9) return 0;
  let maxJump = 0;
  for (let i = 1; i < slopes.length; i++) maxJump = Math.max(maxJump, Math.abs(slopes[i]! - slopes[i - 1]!));
  return round(maxJump / maxSlope);
}

function recoveryFraction(values: readonly number[]): number | null {
  const maxIndex = indexOfMaxAbs(values);
  const maxValue = Math.abs(values[maxIndex] ?? 0);
  if (maxValue <= 1e-9) return 0;
  for (let i = maxIndex; i < values.length; i++) {
    if (Math.abs(values[i]!) <= 0.2 * maxValue) return (i - maxIndex) / values.length;
  }
  return 1;
}

function variance(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function indexOfMaxAbs(values: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (Math.abs(values[i]!) > Math.abs(values[best]!)) best = i;
  }
  return best;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
