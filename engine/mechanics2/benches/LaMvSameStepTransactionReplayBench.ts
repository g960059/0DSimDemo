import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberOutputV1,
  type AtrialFiberChamberStateV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  runSelectedSmoothReservoirProfileV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirOwnershipBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import {
  initialFlowStateValveStateV1,
  stepFlowStateValveV1,
  type FlowStateValveOutputV1,
  type FlowStateValveStateV1,
} from "@/engine/mechanics2/valve/FlowStateValveV1";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const LA_MV_SAME_STEP_TRANSACTION_REPLAY_REPORT_ID_V1 =
  "la-mv-same-step-transaction-replay-report-v1" as const;

type VariantIdV1 = "fiber-total-pressure-local-transaction";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly description: string;
  readonly cycles: number;
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: VariantIdV1;
  readonly pressureOffsetMmHg: number;
  readonly baselineMvForwardPeakCount: number;
  readonly replayMvForwardPeakCount: number;
  readonly replayMvC1ContinuityScore: number;
  readonly baselineMvForwardVolumeMl: number;
  readonly replayMvForwardVolumeMl: number;
  readonly replayToBaselineMvForwardVolumeRatio: number;
  readonly baselineLapMeanMmHg: number;
  readonly replayLapMeanMmHg: number;
  readonly replayLapRmsDeltaMmHg: number;
  readonly finalLaVolumeDriftMl: number;
  readonly maxLaVolumeDriftMl: number;
  readonly laPvLobeQualityPass: boolean;
  readonly laPvFailureReasons: readonly string[];
  readonly massLedgerClean: boolean;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly pass: number;
  readonly mvfCleanCount: number;
  readonly forwardVolumeParityCount: number;
  readonly laPvLobeQualityPass: number;
  readonly massLedgerCleanCount: number;
  readonly meanMvForwardVolumeRatio: number;
  readonly meanLapRmsDeltaMmHg: number;
  readonly maxLaVolumeDriftMl: number;
};

export type LaMvSameStepTransactionReplayReportV1 = {
  readonly reportId: typeof LA_MV_SAME_STEP_TRANSACTION_REPLAY_REPORT_ID_V1;
  readonly gateId: "laMvSameStepTransactionReplayV1";
  readonly replayMode:
    "local-LA-MV-same-step-transaction-replay-no-runtime-no-AV-plane";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: VariantIdV1;
    readonly bestPass: number;
    readonly bestMvfCleanCount: number;
    readonly bestForwardVolumeParityCount: number;
    readonly bestLaPvLobeQualityPass: number;
    readonly bestMassLedgerCleanCount: number;
  };
  readonly decision: {
    readonly laMvSameStepTransactionReplayStatus:
      | "la-mv-same-step-transaction-replay-signal"
      | "la-mv-same-step-transaction-replay-mixed"
      | "la-mv-same-step-transaction-replay-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly aPrimeReadback: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const PRE_A_THETA = 0.74;

const PROFILE_MAP: readonly {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
}[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

const VARIANTS: readonly VariantV1[] = [
  {
    variantId: "fiber-total-pressure-local-transaction",
    description: "Local same-step LA/MV transaction using AtrialFiber total pressure with no profile offset.",
    cycles: 8,
  },
];

export function runLaMvSameStepTransactionReplayBenchV1():
LaMvSameStepTransactionReplayReportV1 {
  const paramsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rows = PROFILE_MAP.flatMap((profile, index) => {
    const sourceRun = runSelectedSmoothReservoirProfileV1({
      scenarioId: "nominal",
      sampleRateMultiplier: 1,
      epochs: 14,
      ...profile,
    });
    const params = withLeftPulmonaryPressure(
      paramsByProfile[index]!,
      sourceRun.finalState.pulmonaryVenousPressureMmHg,
    );
    const baseline = runLeftHeartSubsystemV2(params);
    return [
      rowForReplay(
        profile.profileId,
        params.fixtureId,
        VARIANTS[0]!,
        baseline.finalBeatSamples,
        replayProfile(profile.profileId, params, baseline.finalBeatSamples, VARIANTS[0]!, 0),
        0,
      ),
    ];
  });
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(
    variant.variantId,
    rows.filter((row) => row.variantId === variant.variantId),
  ));
  const bestVariant = [...variantSummaries].sort(compareSummaries)[0]!;
  const status = bestVariant.pass === PROFILE_MAP.length
    ? "la-mv-same-step-transaction-replay-signal"
    : bestVariant.pass > 0 || bestVariant.laPvLobeQualityPass > 0 || bestVariant.mvfCleanCount >= 5
      ? "la-mv-same-step-transaction-replay-mixed"
      : "la-mv-same-step-transaction-replay-blocked";
  return {
    reportId: LA_MV_SAME_STEP_TRANSACTION_REPLAY_REPORT_ID_V1,
    gateId: "laMvSameStepTransactionReplayV1",
    replayMode: "local-LA-MV-same-step-transaction-replay-no-runtime-no-AV-plane",
    variants: VARIANTS,
    rows,
    variantSummaries,
    bestVariant,
    summary: {
      totalProfiles: 7,
      bestVariantId: bestVariant.variantId,
      bestPass: bestVariant.pass,
      bestMvfCleanCount: bestVariant.mvfCleanCount,
      bestForwardVolumeParityCount: bestVariant.forwardVolumeParityCount,
      bestLaPvLobeQualityPass: bestVariant.laPvLobeQualityPass,
      bestMassLedgerCleanCount: bestVariant.massLedgerCleanCount,
    },
    decision: {
      laMvSameStepTransactionReplayStatus: status,
      nextAction: status === "la-mv-same-step-transaction-replay-signal"
        ? "Proceed only to a full left-heart same-step transaction smoke with AV-plane still disabled."
        : status === "la-mv-same-step-transaction-replay-mixed"
          ? "Use this local transaction as attribution. Promotion still needs a full chamber/valve transaction that preserves MVF, LA PV lobe quality, and volume ledger without profile-oracle pressure offsets."
          : "Keep local LA/MV transaction promotion blocked and revisit the chamber/valve pressure-flow contract.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "a-prime-readback",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      aPrimeReadback: false,
      LandAtrialUnlock: false,
    },
  };
}

type ReplayResultV1 = {
  readonly qMv: readonly number[];
  readonly lap: readonly number[];
  readonly laVolume: readonly number[];
  readonly fiberPressure: readonly number[];
};

function replayProfile(
  profileId: FourChamberSubsystemProfileIdV1,
  params: LeftHeartSubsystemParamsV2,
  samples: readonly LeftHeartSubsystemSampleV2[],
  variant: VariantV1,
  pressureOffsetMmHg: number,
): ReplayResultV1 {
  let laVolumeMl = samples[0]?.acceptedLaVolumeMl ?? params.initialLaVolumeMl;
  let fiberState: AtrialFiberChamberStateV1 = initialAtrialFiberChamberStateV1(
    laVolumeMl,
    DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA,
  );
  let mvState: FlowStateValveStateV1 = initialFlowStateValveStateV1();
  let final: ReplayResultV1 = { qMv: [], lap: [], laVolume: [], fiberPressure: [] };
  for (let cycle = 0; cycle < variant.cycles; cycle++) {
    const qMv: number[] = [];
    const lap: number[] = [];
    const laVolume: number[] = [];
    const fiberPressure: number[] = [];
    for (const sample of samples) {
      const step = solveLocalStep({
        profileId,
        sample,
        params,
        previousLaVolumeMl: laVolumeMl,
        previousFiberState: fiberState,
        previousMvState: mvState,
        pressureOffsetMmHg,
      });
      laVolumeMl = step.laVolumeMl;
      fiberState = step.fiber.state;
      mvState = step.mv.state;
      qMv.push(step.mv.qMlPerSec);
      lap.push(step.lapMmHg);
      laVolume.push(laVolumeMl);
      fiberPressure.push(step.fiber.pressureRawMmHg);
    }
    final = { qMv, lap, laVolume, fiberPressure };
  }
  return final;
}

function solveLocalStep(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sample: LeftHeartSubsystemSampleV2;
  readonly params: LeftHeartSubsystemParamsV2;
  readonly previousLaVolumeMl: number;
  readonly previousFiberState: AtrialFiberChamberStateV1;
  readonly previousMvState: FlowStateValveStateV1;
  readonly pressureOffsetMmHg: number;
}): {
  readonly laVolumeMl: number;
  readonly lapMmHg: number;
  readonly fiber: AtrialFiberChamberOutputV1;
  readonly mv: FlowStateValveOutputV1;
} {
  const dtSec = 1 / input.params.sampleRateHz;
  let qCandidate = input.previousMvState.qMlPerSec;
  let lastFiber: AtrialFiberChamberOutputV1 | null = null;
  let lastMv: FlowStateValveOutputV1 | null = null;
  let lastLap = input.sample.lapMmHg;
  let lastLaVolume = input.previousLaVolumeMl;
  for (let iter = 0; iter < 4; iter++) {
    const candidateLaVolume = input.previousLaVolumeMl
      + dtSec * (input.sample.qPulmonaryVenousMlPerSec - qCandidate);
    const fiber = stepAtrialFiberChamberV1(input.previousFiberState, {
      tSec: input.sample.tSec,
      dtSec,
      cycleLengthSec: 60 / input.params.heartRateBpm,
      activationTimeSec: input.sample.tSec - input.sample.theta * (60 / input.params.heartRateBpm)
        + positiveModulo(input.params.laAWaveStartTheta - 0.10, 1) * (60 / input.params.heartRateBpm),
      cavityVolumeMl: candidateLaVolume,
      previousCavityVolumeMl: input.previousLaVolumeMl,
    }, DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA);
    const lapMmHg = fiber.pressureRawMmHg + input.pressureOffsetMmHg;
    const mv = stepFlowStateValveV1(input.previousMvState, {
      dtSec,
      upstreamPressureMmHg: lapMmHg,
      downstreamPressureMmHg: input.sample.lvpMmHg,
    }, input.params.mv);
    qCandidate = 0.45 * qCandidate + 0.55 * mv.qMlPerSec;
    lastFiber = fiber;
    lastMv = mv;
    lastLap = lapMmHg;
    lastLaVolume = candidateLaVolume;
  }
  return {
    laVolumeMl: lastLaVolume,
    lapMmHg: lastLap,
    fiber: lastFiber!,
    mv: lastMv!,
  };
}

function rowForReplay(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  variant: VariantV1,
  baseline: readonly LeftHeartSubsystemSampleV2[],
  replay: ReplayResultV1,
  pressureOffsetMmHg: number,
): RowV1 {
  const dtSec = 1 / Math.max(baseline.length, 1);
  const baselineQmv = baseline.map((sample) => sample.qMvMlPerSec);
  const baselineLap = baseline.map((sample) => sample.lapMmHg);
  const baselineVolume = baseline.map((sample) => sample.acceptedLaVolumeMl);
  const baselineMvForwardVolume = forwardFlowVolume(baselineQmv, dtSec);
  const replayMvForwardVolume = forwardFlowVolume(replay.qMv, dtSec);
  const replayShape = computeShapeQualityMetricsV1(replay.qMv);
  const laPv = laPvQualityFor(replay.laVolume, replay.lap, baseline.map((sample) => sample.theta));
  const finalDrift = replay.laVolume[replay.laVolume.length - 1]! - baselineVolume[baselineVolume.length - 1]!;
  const volumeDrift = replay.laVolume.map((value, index) => value - baselineVolume[index]!);
  const base = {
    profileId,
    sourcePointId,
    variantId: variant.variantId,
    pressureOffsetMmHg: round(pressureOffsetMmHg),
    baselineMvForwardPeakCount: positivePeakCount(baselineQmv),
    replayMvForwardPeakCount: positivePeakCount(replay.qMv),
    replayMvC1ContinuityScore: round(replayShape.c1ContinuityScore),
    baselineMvForwardVolumeMl: round(baselineMvForwardVolume),
    replayMvForwardVolumeMl: round(replayMvForwardVolume),
    replayToBaselineMvForwardVolumeRatio: round(replayMvForwardVolume / Math.max(baselineMvForwardVolume, 1e-9)),
    baselineLapMeanMmHg: round(mean(baselineLap)),
    replayLapMeanMmHg: round(mean(replay.lap)),
    replayLapRmsDeltaMmHg: round(rmsDelta(baselineLap, replay.lap)),
    finalLaVolumeDriftMl: round(finalDrift),
    maxLaVolumeDriftMl: round(maxAbs(volumeDrift)),
    laPvLobeQualityPass: laPv.lobeQualityPass,
    laPvFailureReasons: laPv.failureReasons,
    massLedgerClean: Math.abs(finalDrift) <= 3.0 && maxAbs(volumeDrift) <= 12.0,
  };
  const failureReasons = failureReasonsFor(base);
  return {
    ...base,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function failureReasonsFor(row: Omit<RowV1, "status" | "failureReasons">): readonly string[] {
  const failures: string[] = [];
  if (row.replayMvForwardPeakCount !== 2) failures.push("mvf-not-biphasic");
  if (row.replayMvC1ContinuityScore > 0.42) failures.push("mvf-c1-kink");
  if (row.replayToBaselineMvForwardVolumeRatio < 0.78 || row.replayToBaselineMvForwardVolumeRatio > 1.22) {
    failures.push("mv-forward-volume-ratio-wide");
  }
  if (!row.laPvLobeQualityPass) failures.push("la-pv-lobe-quality-fail");
  if (!row.massLedgerClean) failures.push("local-la-volume-ledger-drift");
  return failures;
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    pass: rows.filter((row) => row.status === "pass").length,
    mvfCleanCount: rows.filter((row) =>
      row.replayMvForwardPeakCount === 2 && row.replayMvC1ContinuityScore <= 0.42).length,
    forwardVolumeParityCount: rows.filter((row) =>
      row.replayToBaselineMvForwardVolumeRatio >= 0.78 && row.replayToBaselineMvForwardVolumeRatio <= 1.22).length,
    laPvLobeQualityPass: rows.filter((row) => row.laPvLobeQualityPass).length,
    massLedgerCleanCount: rows.filter((row) => row.massLedgerClean).length,
    meanMvForwardVolumeRatio: round(mean(rows.map((row) => row.replayToBaselineMvForwardVolumeRatio))),
    meanLapRmsDeltaMmHg: round(mean(rows.map((row) => row.replayLapRmsDeltaMmHg))),
    maxLaVolumeDriftMl: round(Math.max(...rows.map((row) => row.maxLaVolumeDriftMl))),
  };
}

function compareSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.pass - a.pass
    || b.laPvLobeQualityPass - a.laPvLobeQualityPass
    || b.mvfCleanCount - a.mvfCleanCount
    || b.forwardVolumeParityCount - a.forwardVolumeParityCount
    || a.maxLaVolumeDriftMl - b.maxLaVolumeDriftMl;
}

function withLeftPulmonaryPressure(
  params: LeftHeartSubsystemParamsV2,
  pressureMmHg: number,
): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    pulmonaryVenousPressureMmHg: pressureMmHg,
    pulmonaryVenousInitialPressureMmHg: pressureMmHg,
    pulmonaryVenousSourcePressureMmHg: pressureMmHg,
  };
}

function laPvQualityFor(
  volumes: readonly number[],
  pressures: readonly number[],
  theta: readonly number[],
): { readonly lobeQualityPass: boolean; readonly failureReasons: readonly string[] } {
  const selfIntersections = countSelfIntersections(volumes, pressures);
  const aIndices = theta.map((value, index) => value >= PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const vIndices = theta.map((value, index) => value < PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const aLoop = sliceByIndices(volumes, pressures, aIndices);
  const vLoop = sliceByIndices(volumes, pressures, vIndices);
  const aLoopArea = Math.abs(signedPolygonArea(aLoop.x, aLoop.y));
  const vLoopArea = Math.abs(signedPolygonArea(vLoop.x, vLoop.y));
  const opposed = signedPolygonArea(aLoop.x, aLoop.y) * signedPolygonArea(vLoop.x, vLoop.y) < 0;
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const failures: string[] = [];
  if (selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failures.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failures.push("v-loop-area-too-small");
  if (!opposed) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  return { lobeQualityPass: failures.length === 0, failureReasons: failures };
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = 0.12 * Math.max(maxValue, 1e-9);
  let count = 0;
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur <= threshold) continue;
    if (cur > values[i - 1]! && cur >= values[i + 1]!) count++;
  }
  return count;
}

function forwardFlowVolume(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, value) => sum + Math.max(0, value) * dtSec, 0);
}

function countSelfIntersections(x: readonly number[], y: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < x.length - 1; i++) {
    for (let j = i + 2; j < x.length - 1; j++) {
      if (i === 0 && j === x.length - 2) continue;
      if (segmentsIntersect(
        x[i]!, y[i]!, x[i + 1]!, y[i + 1]!,
        x[j]!, y[j]!, x[j + 1]!, y[j + 1]!,
      )) count++;
    }
  }
  return count;
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function direction(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

function signedPolygonArea(x: readonly number[], y: readonly number[]): number {
  if (x.length < 3 || y.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    const next = (i + 1) % x.length;
    sum += x[i]! * y[next]! - x[next]! * y[i]!;
  }
  return 0.5 * sum;
}

function sliceByIndices(
  x: readonly number[],
  y: readonly number[],
  indices: readonly number[],
): { readonly x: readonly number[]; readonly y: readonly number[] } {
  return {
    x: indices.map((index) => x[index]!),
    y: indices.map((index) => y[index]!),
  };
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function rmsDelta(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return Number.NaN;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = a[i]! - b[i]!;
    sum += d * d;
  }
  return Math.sqrt(sum / n);
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
