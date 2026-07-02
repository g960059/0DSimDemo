import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberIdV1,
  type AtrialFiberChamberOutputV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  runAtrialFiberPackPrescribedVolumeBenchV1,
} from "@/engine/mechanics2/benches/AtrialFiberPackPrescribedVolumeBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import { computeShapeQualityMetricsV1, type ShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import {
  runRightHeartSubsystemV2,
  type RightHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_FIBER_PACK_CLOSED_LOOP_REPLAY_REPORT_ID_V1 =
  "atrial-fiber-pack-closed-loop-replay-report-v1" as const;

type AtrialReplaySampleV1 = {
  readonly tSec: number;
  readonly beat: number;
  readonly theta: number;
  readonly cavityVolumeMl: number;
  readonly currentPressureMmHg: number;
};

type AtrialClosedLoopReplayResultV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly sourcePointId: string;
  readonly status: "pass" | "fail";
  readonly finalBeat: number;
  readonly volumeMinMl: number;
  readonly volumeMaxMl: number;
  readonly volumePulseMl: number;
  readonly fiberPressurePeakMmHg: number;
  readonly fiberPressureMinMmHg: number;
  readonly fiberPressurePulseMmHg: number;
  readonly currentPressurePeakMmHg: number;
  readonly currentPressureMinMmHg: number;
  readonly currentPressurePulseMmHg: number;
  readonly pressureMeanAbsDeltaMmHg: number;
  readonly pressureRmsDeltaMmHg: number;
  readonly activePressurePeakMmHg: number;
  readonly activePeakTheta: number;
  readonly currentPeakTheta: number;
  readonly currentLatePeakTheta: number;
  readonly activeToCurrentPeakDeltaTheta: number;
  readonly activeToCurrentLatePeakDeltaTheta: number;
  readonly maxAbsLSiVelocityNormPerSec: number;
  readonly pressureShape: ShapeQualityMetricsV1;
  readonly allFinite: boolean;
  readonly failureReasons: readonly string[];
  readonly advisoryResidualReasons: readonly string[];
};

export type AtrialFiberPackClosedLoopReplayReportV1 = {
  readonly reportId: typeof ATRIAL_FIBER_PACK_CLOSED_LOOP_REPLAY_REPORT_ID_V1;
  readonly gateId: "atrialFiberPackClosedLoopReplayV1";
  readonly upstreamAtrialFiberPack: {
    readonly requiredStatus: "atrial-fiber-pack-prescribed-volume-signal";
    readonly observedStatus: ReturnType<
      typeof runAtrialFiberPackPrescribedVolumeBenchV1
    >["decision"]["atrialFiberPackStatus"];
    readonly mayProceedObserved: boolean;
  };
  readonly replayMode: "closed-loop-volume-replay-no-pressure-substitution";
  readonly resultRows: readonly AtrialClosedLoopReplayResultV1[];
  readonly summary: {
    readonly total: 14;
    readonly pass: number;
    readonly fail: number;
    readonly laPass: number;
    readonly raPass: number;
    readonly finiteCount: number;
    readonly lateActivePeakCount: number;
    readonly pressureParityCount: number;
  };
  readonly decision: {
    readonly atrialFiberClosedLoopReplayStatus:
      | "atrial-fiber-closed-loop-replay-signal"
      | "atrial-fiber-closed-loop-replay-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly pressureSubstitution: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly pistonVolumeMode: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

export function runAtrialFiberPackClosedLoopReplayBenchV1(): AtrialFiberPackClosedLoopReplayReportV1 {
  const upstream = runAtrialFiberPackPrescribedVolumeBenchV1();
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rightParams = buildRightHeartStrategicEnvelopeV1();
  const leftResults = PROFILE_IDS.map((profileId, index) =>
    replayLeftProfile(profileId, leftParams[index]!)
  );
  const rightResults = PROFILE_IDS.map((profileId, index) =>
    replayRightProfile(profileId, rightParams[index]!)
  );
  const resultRows = interleave(leftResults, rightResults);
  const pass = resultRows.filter((row) => row.status === "pass").length;
  const upstreamOk =
    upstream.decision.atrialFiberPackStatus === "atrial-fiber-pack-prescribed-volume-signal";
  const hasSignal = upstreamOk && pass === resultRows.length;
  return {
    reportId: ATRIAL_FIBER_PACK_CLOSED_LOOP_REPLAY_REPORT_ID_V1,
    gateId: "atrialFiberPackClosedLoopReplayV1",
    upstreamAtrialFiberPack: {
      requiredStatus: "atrial-fiber-pack-prescribed-volume-signal",
      observedStatus: upstream.decision.atrialFiberPackStatus,
      mayProceedObserved: upstreamOk,
    },
    replayMode: "closed-loop-volume-replay-no-pressure-substitution",
    resultRows,
    summary: {
      total: 14,
      pass,
      fail: resultRows.length - pass,
      laPass: resultRows.filter((row) => row.chamberId === "LA" && row.status === "pass").length,
      raPass: resultRows.filter((row) => row.chamberId === "RA" && row.status === "pass").length,
      finiteCount: resultRows.filter((row) => row.allFinite).length,
      lateActivePeakCount: resultRows.filter((row) => isLateActive(row)).length,
      pressureParityCount: resultRows.filter((row) => pressureParityOk(row)).length,
    },
    decision: {
      atrialFiberClosedLoopReplayStatus: hasSignal
        ? "atrial-fiber-closed-loop-replay-signal"
        : "atrial-fiber-closed-loop-replay-blocked",
      nextAction: hasSignal
        ? "Classify the LA pressure-parity residual before any atrial pressure-substitution smoke. Keep runtime wiring, AV-plane geometry, piston-volume mode, morphology acceptance, and LandAtrial locked."
        : "Do not substitute atrial pressure into the closed loop. Classify the replay pressure, timing, or smoothness residual first.",
      blockedClaims: [
        "runtime-wiring",
        "atrial-pressure-substitution",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      pressureSubstitution: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      pistonVolumeMode: false,
      LandAtrialUnlock: false,
    },
  };
}

function replayLeftProfile(
  profileId: FourChamberSubsystemProfileIdV1,
  params: Parameters<typeof runLeftHeartSubsystemV2>[0],
): AtrialClosedLoopReplayResultV1 {
  const run = runLeftHeartSubsystemV2(params);
  const samples = run.samples.map((sample): AtrialReplaySampleV1 => ({
    tSec: sample.tSec,
    beat: sample.beat,
    theta: sample.theta,
    cavityVolumeMl: sample.acceptedLaVolumeMl,
    currentPressureMmHg: sample.lapMmHg,
  }));
  return replayAtrialProfile({
    profileId,
    chamberId: "LA",
    sourcePointId: params.fixtureId,
    cycleLengthSec: 60 / params.heartRateBpm,
    sampleRateHz: params.sampleRateHz,
    activationTheta: activationThetaForWindow(params.laAWaveStartTheta),
    finalBeat: params.beats - 2,
    samples,
  });
}

function replayRightProfile(
  profileId: FourChamberSubsystemProfileIdV1,
  params: Parameters<typeof runRightHeartSubsystemV2>[0],
): AtrialClosedLoopReplayResultV1 {
  const run = runRightHeartSubsystemV2(params);
  const samples = run.samples.map((sample): AtrialReplaySampleV1 => ({
    tSec: sample.tSec,
    beat: sample.beat,
    theta: sample.theta,
    cavityVolumeMl: sample.acceptedRaVolumeMl,
    currentPressureMmHg: sample.rapMmHg,
  }));
  return replayAtrialProfile({
    profileId,
    chamberId: "RA",
    sourcePointId: params.fixtureId,
    cycleLengthSec: 60 / params.heartRateBpm,
    sampleRateHz: params.sampleRateHz,
    activationTheta: activationThetaForWindow(params.raAWaveStartTheta),
    finalBeat: params.beats - 2,
    samples,
  });
}

function replayAtrialProfile(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly sourcePointId: string;
  readonly cycleLengthSec: number;
  readonly sampleRateHz: number;
  readonly activationTheta: number;
  readonly finalBeat: number;
  readonly samples: readonly AtrialReplaySampleV1[];
}): AtrialClosedLoopReplayResultV1 {
  const params = DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1[input.chamberId];
  let state = initialAtrialFiberChamberStateV1(input.samples[0]?.cavityVolumeMl ?? params.referenceCavityVolumeMl, params);
  const outputs: AtrialFiberChamberOutputV1[] = [];
  for (let i = 0; i < input.samples.length; i++) {
    const sample = input.samples[i]!;
    const previousVolume = input.samples[Math.max(0, i - 1)]?.cavityVolumeMl ?? sample.cavityVolumeMl;
    const activationTimeSec = sample.beat * input.cycleLengthSec + input.activationTheta * input.cycleLengthSec;
    const output = stepAtrialFiberChamberV1(state, {
      tSec: sample.tSec,
      dtSec: 1 / input.sampleRateHz,
      cycleLengthSec: input.cycleLengthSec,
      activationTimeSec,
      cavityVolumeMl: sample.cavityVolumeMl,
      previousCavityVolumeMl: previousVolume,
    }, params);
    outputs.push(output);
    state = output.state;
  }
  const finalSamples = input.samples.filter((sample) => sample.beat === input.finalBeat);
  const finalOutputs = outputs.filter((_, index) => input.samples[index]?.beat === input.finalBeat);
  const fiberPressure = finalOutputs.map((output) => output.pressureRawMmHg);
  const currentPressure = finalSamples.map((sample) => sample.currentPressureMmHg);
  const activePressure = finalOutputs.map((output) => output.activePressureMmHg);
  const volumes = finalSamples.map((sample) => sample.cavityVolumeMl);
  const activePeakIndex = maxIndex(activePressure);
  const currentPeakIndex = maxIndex(currentPressure);
  const currentLatePeakIndex = maxIndexByMask(currentPressure, finalSamples.map((sample) => sample.theta >= 0.74));
  const pressureShape = computeShapeQualityMetricsV1(fiberPressure);
  const result = {
    profileId: input.profileId,
    chamberId: input.chamberId,
    sourcePointId: input.sourcePointId,
    status: "pass" as const,
    finalBeat: input.finalBeat,
    volumeMinMl: round(Math.min(...volumes)),
    volumeMaxMl: round(Math.max(...volumes)),
    volumePulseMl: round(Math.max(...volumes) - Math.min(...volumes)),
    fiberPressurePeakMmHg: round(Math.max(...fiberPressure)),
    fiberPressureMinMmHg: round(Math.min(...fiberPressure)),
    fiberPressurePulseMmHg: round(Math.max(...fiberPressure) - Math.min(...fiberPressure)),
    currentPressurePeakMmHg: round(Math.max(...currentPressure)),
    currentPressureMinMmHg: round(Math.min(...currentPressure)),
    currentPressurePulseMmHg: round(Math.max(...currentPressure) - Math.min(...currentPressure)),
    pressureMeanAbsDeltaMmHg: round(meanAbsDelta(fiberPressure, currentPressure)),
    pressureRmsDeltaMmHg: round(rmsDelta(fiberPressure, currentPressure)),
    activePressurePeakMmHg: round(Math.max(...activePressure)),
    activePeakTheta: round(finalSamples[activePeakIndex]?.theta ?? Number.NaN),
    currentPeakTheta: round(finalSamples[currentPeakIndex]?.theta ?? Number.NaN),
    currentLatePeakTheta: round(finalSamples[currentLatePeakIndex]?.theta ?? Number.NaN),
    activeToCurrentPeakDeltaTheta: round(circularDelta(
      finalSamples[activePeakIndex]?.theta ?? Number.NaN,
      finalSamples[currentPeakIndex]?.theta ?? Number.NaN,
    )),
    activeToCurrentLatePeakDeltaTheta: round(circularDelta(
      finalSamples[activePeakIndex]?.theta ?? Number.NaN,
      finalSamples[currentLatePeakIndex]?.theta ?? Number.NaN,
    )),
    maxAbsLSiVelocityNormPerSec: round(Math.max(...finalOutputs.map((output) => Math.abs(output.fiber.lSiDot)))),
    pressureShape,
    allFinite: finalOutputs.every((output) => allNumericFieldsFinite(output))
      && finalSamples.every((sample) => allNumericFieldsFinite(sample)),
    failureReasons: [] as readonly string[],
    advisoryResidualReasons: [] as readonly string[],
  };
  const failureReasons = failureReasonsFor(result);
  const advisoryResidualReasons = advisoryResidualReasonsFor(result);
  return {
    ...result,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
    advisoryResidualReasons,
  };
}

function failureReasonsFor(
  row: Omit<AtrialClosedLoopReplayResultV1, "status" | "failureReasons" | "advisoryResidualReasons">,
): readonly string[] {
  const failures: string[] = [];
  const pressurePeakUpper = row.chamberId === "LA" ? 24 : 18;
  const pressurePulseLower = row.chamberId === "LA" ? 1.2 : 0.8;
  if (!row.allFinite) failures.push("non-finite-output");
  if (row.fiberPressurePeakMmHg <= 0) failures.push("fiber-pressure-not-positive");
  if (row.fiberPressurePeakMmHg > pressurePeakUpper) failures.push("fiber-pressure-peak-too-high");
  if (row.fiberPressurePulseMmHg < pressurePulseLower) failures.push("fiber-pressure-pulse-too-low");
  if (row.activePressurePeakMmHg < 0.5) failures.push("active-pressure-too-low");
  if (!isLateActive(row)) failures.push("active-peak-not-late-diastolic");
  if (row.pressureShape.c1ContinuityScore > 0.45) failures.push("fiber-pressure-c1-rough");
  if (row.pressureShape.dYdtSpikeRatio > 28) failures.push("fiber-pressure-derivative-spiky");
  if (row.maxAbsLSiVelocityNormPerSec > 1.6) failures.push("intrinsic-length-velocity-too-high");
  return failures;
}

function advisoryResidualReasonsFor(
  row: Omit<AtrialClosedLoopReplayResultV1, "status" | "failureReasons" | "advisoryResidualReasons">,
): readonly string[] {
  const residuals: string[] = [];
  const pressureDeltaUpper = row.chamberId === "LA" ? 9 : 7;
  if (!pressureParityOk(row) || row.pressureRmsDeltaMmHg > pressureDeltaUpper * 1.35) {
    residuals.push("fiber-current-pressure-parity-wide");
  }
  if (row.activeToCurrentLatePeakDeltaTheta > 0.22) {
    residuals.push("active-current-late-peak-phase-offset");
  }
  return residuals;
}

function activationThetaForWindow(aWaveStartTheta: number): number {
  return positiveModulo(aWaveStartTheta - 0.10, 1);
}

function isLateActive(row: Pick<AtrialClosedLoopReplayResultV1, "activePeakTheta">): boolean {
  return row.activePeakTheta >= 0.74 && row.activePeakTheta <= 0.99;
}

function pressureParityOk(
  row: Pick<AtrialClosedLoopReplayResultV1, "chamberId" | "pressureMeanAbsDeltaMmHg">,
): boolean {
  return row.pressureMeanAbsDeltaMmHg <= (row.chamberId === "LA" ? 9 : 7);
}

function interleave<T>(left: readonly T[], right: readonly T[]): readonly T[] {
  const out: T[] = [];
  const count = Math.max(left.length, right.length);
  for (let i = 0; i < count; i++) {
    if (left[i] != null) out.push(left[i]!);
    if (right[i] != null) out.push(right[i]!);
  }
  return out;
}

function meanAbsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += Math.abs(a[i]! - b[i]!);
  return sum / count;
}

function rmsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(sum / count);
}

function circularDelta(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  const raw = Math.abs(a - b);
  return Math.min(raw, 1 - raw);
}

function maxIndex(values: readonly number[]): number {
  let bestIndex = 0;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    if (values[i]! > bestValue) {
      bestIndex = i;
      bestValue = values[i]!;
    }
  }
  return bestIndex;
}

function maxIndexByMask(values: readonly number[], mask: readonly boolean[]): number {
  let bestIndex = -1;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    if (!mask[i]) continue;
    if (values[i]! > bestValue) {
      bestIndex = i;
      bestValue = values[i]!;
    }
  }
  return bestIndex >= 0 ? bestIndex : maxIndex(values);
}

function allNumericFieldsFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (value == null || typeof value !== "object") return true;
  return Object.values(value).every(allNumericFieldsFinite);
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
