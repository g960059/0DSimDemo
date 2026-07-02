import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberIdV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  runFourChamberSourceReservoirContractReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSourceReservoirContractReviewBench";
import {
  runSelectedSmoothReservoirProfileV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirOwnershipBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import {
  runRightHeartSubsystemV2,
  type RightHeartSubsystemParamsV2,
  type RightHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_FIBER_SOURCE_RESERVOIR_SHADOW_REPLAY_REPORT_ID_V1 =
  "atrial-fiber-source-reservoir-shadow-replay-report-v1" as const;

type ShadowClassV1 =
  | "finite-bounded-shadow"
  | "late-active-peak"
  | "source-reservoir-pressure-conditioned"
  | "pressure-substitution-disabled";

type AtrialShadowRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly sourcePointId: string;
  readonly sourceReservoirStatus: "pass" | "fail" | "inconclusive";
  readonly sourceReservoirPressureMmHg: number;
  readonly volumeMinMl: number;
  readonly volumeMaxMl: number;
  readonly volumePulseMl: number;
  readonly activePressurePeakMmHg: number;
  readonly activePeakTheta: number;
  readonly passivePressurePeakMmHg: number;
  readonly rawPressurePeakMmHg: number;
  readonly rawPressureMinMmHg: number;
  readonly rawPressurePulseMmHg: number;
  readonly maxAbsLSiVelocityNormPerSec: number;
  readonly allFinite: boolean;
  readonly status: "pass" | "fail";
  readonly classes: readonly ShadowClassV1[];
  readonly failureReasons: readonly string[];
};

export type AtrialFiberSourceReservoirShadowReplayReportV1 = {
  readonly reportId: typeof ATRIAL_FIBER_SOURCE_RESERVOIR_SHADOW_REPLAY_REPORT_ID_V1;
  readonly gateId: "atrialFiberSourceReservoirShadowReplayV1";
  readonly upstreamSourceReservoirContract: {
    readonly requiredStatus: "source-reservoir-contract-review-signal";
    readonly observedStatus: ReturnType<
      typeof runFourChamberSourceReservoirContractReviewBenchV1
    >["decision"]["sourceReservoirContractStatus"];
    readonly effectiveEnvelopePassCount: number;
    readonly dtHalfReservoirParityPassCount: number;
  };
  readonly replayMode:
    "source-reservoir-pressure-conditioned-volume-replay-no-pressure-substitution";
  readonly rows: readonly AtrialShadowRowV1[];
  readonly summary: {
    readonly total: 14;
    readonly pass: number;
    readonly fail: number;
    readonly laPass: number;
    readonly raPass: number;
    readonly finiteBoundedCount: number;
    readonly lateActivePeakCount: number;
    readonly sourceReservoirConditionedCount: number;
    readonly meanLaActivePressurePeakMmHg: number;
    readonly meanRaActivePressurePeakMmHg: number;
  };
  readonly decision: {
    readonly atrialFiberSourceReservoirShadowReplayStatus:
      | "atrial-fiber-source-reservoir-shadow-replay-signal"
      | "atrial-fiber-source-reservoir-shadow-replay-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly pressureSubstitution: false;
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly pistonVolumeMode: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;

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

export function runAtrialFiberSourceReservoirShadowReplayBenchV1():
AtrialFiberSourceReservoirShadowReplayReportV1 {
  const upstream = runFourChamberSourceReservoirContractReviewBenchV1();
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rightParams = buildRightHeartStrategicEnvelopeV1();
  const rows = PROFILE_MAP.flatMap((profile, index) => {
    const sourceRun = runSelectedSmoothReservoirProfileV1({
      scenarioId: "nominal",
      sampleRateMultiplier: 1,
      epochs: 14,
      ...profile,
    });
    const leftRun = runLeftHeartSubsystemV2(withLeftPulmonaryPressure(
      leftParams[index]!,
      sourceRun.finalState.pulmonaryVenousPressureMmHg,
    ));
    const rightRun = runRightHeartSubsystemV2(withRightSystemicVenousPressure(
      rightParams[index]!,
      sourceRun.finalState.systemicVenousPressureMmHg,
    ));
    return [
      replayLeft(profile.profileId, leftParams[index]!.fixtureId, sourceRun.status, sourceRun.finalState.pulmonaryVenousPressureMmHg, leftRun.finalBeatSamples),
      replayRight(profile.profileId, rightParams[index]!.fixtureId, sourceRun.status, sourceRun.finalState.systemicVenousPressureMmHg, rightRun.finalBeatSamples),
    ];
  });
  const pass = rows.filter((row) => row.status === "pass").length;
  const upstreamOk =
    upstream.decision.sourceReservoirContractStatus === "source-reservoir-contract-review-signal";
  const signal = upstreamOk && pass === rows.length;
  return {
    reportId: ATRIAL_FIBER_SOURCE_RESERVOIR_SHADOW_REPLAY_REPORT_ID_V1,
    gateId: "atrialFiberSourceReservoirShadowReplayV1",
    upstreamSourceReservoirContract: {
      requiredStatus: "source-reservoir-contract-review-signal",
      observedStatus: upstream.decision.sourceReservoirContractStatus,
      effectiveEnvelopePassCount: upstream.summary.effectiveEnvelopePassCount,
      dtHalfReservoirParityPassCount: upstream.summary.dtHalfReservoirParityPassCount,
    },
    replayMode: "source-reservoir-pressure-conditioned-volume-replay-no-pressure-substitution",
    rows,
    summary: {
      total: 14,
      pass,
      fail: rows.length - pass,
      laPass: rows.filter((row) => row.chamberId === "LA" && row.status === "pass").length,
      raPass: rows.filter((row) => row.chamberId === "RA" && row.status === "pass").length,
      finiteBoundedCount: rows.filter((row) => row.classes.includes("finite-bounded-shadow")).length,
      lateActivePeakCount: rows.filter((row) => row.classes.includes("late-active-peak")).length,
      sourceReservoirConditionedCount: rows.filter((row) =>
        row.classes.includes("source-reservoir-pressure-conditioned")).length,
      meanLaActivePressurePeakMmHg: round(mean(rows
        .filter((row) => row.chamberId === "LA")
        .map((row) => row.activePressurePeakMmHg))),
      meanRaActivePressurePeakMmHg: round(mean(rows
        .filter((row) => row.chamberId === "RA")
        .map((row) => row.activePressurePeakMmHg))),
    },
    decision: {
      atrialFiberSourceReservoirShadowReplayStatus: signal
        ? "atrial-fiber-source-reservoir-shadow-replay-signal"
        : "atrial-fiber-source-reservoir-shadow-replay-blocked",
      nextAction: signal
        ? "Atrial fiber may remain a source/reservoir-conditioned shadow readback. Do not substitute pressure or unlock AV-plane/LandAtrial until a valve/source co-owned gradient contract exists."
        : "Keep atrial fiber shadow replay blocked and classify the failed source/reservoir-conditioned replay rows before any pressure substitution.",
      blockedClaims: [
        "atrial-pressure-substitution",
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      pressureSubstitution: false,
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      pistonVolumeMode: false,
      LandAtrialUnlock: false,
    },
  };
}

function replayLeft(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  sourceReservoirStatus: "pass" | "fail" | "inconclusive",
  sourceReservoirPressureMmHg: number,
  samples: readonly LeftHeartSubsystemSampleV2[],
): AtrialShadowRowV1 {
  return replayAtrial({
    profileId,
    chamberId: "LA",
    sourcePointId,
    sourceReservoirStatus,
    sourceReservoirPressureMmHg,
    sampleRateHz: 1 / Math.max((samples[1]?.tSec ?? 1) - (samples[0]?.tSec ?? 0), 1e-9),
    cycleLengthSec: cycleLength(samples),
    activationTheta: 0.76,
    volumeSamples: samples.map((sample) => ({
      tSec: sample.tSec,
      theta: sample.theta,
      volumeMl: sample.acceptedLaVolumeMl,
    })),
  });
}

function replayRight(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  sourceReservoirStatus: "pass" | "fail" | "inconclusive",
  sourceReservoirPressureMmHg: number,
  samples: readonly RightHeartSubsystemSampleV2[],
): AtrialShadowRowV1 {
  return replayAtrial({
    profileId,
    chamberId: "RA",
    sourcePointId,
    sourceReservoirStatus,
    sourceReservoirPressureMmHg,
    sampleRateHz: 1 / Math.max((samples[1]?.tSec ?? 1) - (samples[0]?.tSec ?? 0), 1e-9),
    cycleLengthSec: cycleLength(samples),
    activationTheta: 0.74,
    volumeSamples: samples.map((sample) => ({
      tSec: sample.tSec,
      theta: sample.theta,
      volumeMl: sample.acceptedRaVolumeMl,
    })),
  });
}

function replayAtrial(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly sourcePointId: string;
  readonly sourceReservoirStatus: "pass" | "fail" | "inconclusive";
  readonly sourceReservoirPressureMmHg: number;
  readonly sampleRateHz: number;
  readonly cycleLengthSec: number;
  readonly activationTheta: number;
  readonly volumeSamples: readonly {
    readonly tSec: number;
    readonly theta: number;
    readonly volumeMl: number;
  }[];
}): AtrialShadowRowV1 {
  const params = DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1[input.chamberId];
  let state = initialAtrialFiberChamberStateV1(input.volumeSamples[0]?.volumeMl ?? params.referenceCavityVolumeMl, params);
  const outputs = [];
  let previousVolume = input.volumeSamples[0]?.volumeMl ?? params.referenceCavityVolumeMl;
  for (const sample of input.volumeSamples) {
    const output = stepAtrialFiberChamberV1(state, {
      tSec: sample.tSec,
      dtSec: 1 / Math.max(input.sampleRateHz, 1e-9),
      cycleLengthSec: input.cycleLengthSec,
      activationTimeSec: sample.tSec - sample.theta * input.cycleLengthSec + input.activationTheta * input.cycleLengthSec,
      cavityVolumeMl: sample.volumeMl,
      previousCavityVolumeMl: previousVolume,
    }, params);
    outputs.push({ theta: sample.theta, output });
    state = output.state;
    previousVolume = sample.volumeMl;
  }
  const volume = outputs.map((sample) => sample.output.cavityVolumeMl);
  const rawPressure = outputs.map((sample) => sample.output.pressureRawMmHg);
  const activePressure = outputs.map((sample) => sample.output.activePressureMmHg);
  const activePeakIndex = maxIndex(activePressure);
  const allFinite = outputs.every((sample) =>
    Number.isFinite(sample.output.pressureRawMmHg)
    && Number.isFinite(sample.output.activePressureMmHg)
    && Number.isFinite(sample.output.fiber.lSiDot)
  );
  const base = {
    profileId: input.profileId,
    chamberId: input.chamberId,
    sourcePointId: input.sourcePointId,
    sourceReservoirStatus: input.sourceReservoirStatus,
    sourceReservoirPressureMmHg: round(input.sourceReservoirPressureMmHg),
    volumeMinMl: round(Math.min(...volume)),
    volumeMaxMl: round(Math.max(...volume)),
    volumePulseMl: round(Math.max(...volume) - Math.min(...volume)),
    activePressurePeakMmHg: round(Math.max(...activePressure)),
    activePeakTheta: round(outputs[activePeakIndex]?.theta ?? 0),
    passivePressurePeakMmHg: round(Math.max(...outputs.map((sample) => sample.output.passivePressureMmHg))),
    rawPressurePeakMmHg: round(Math.max(...rawPressure)),
    rawPressureMinMmHg: round(Math.min(...rawPressure)),
    rawPressurePulseMmHg: round(Math.max(...rawPressure) - Math.min(...rawPressure)),
    maxAbsLSiVelocityNormPerSec: round(Math.max(...outputs.map((sample) =>
      Math.abs(sample.output.fiber.lSiDot)
    ))),
    allFinite,
  };
  const failureReasons = failureReasonsFor(base);
  return {
    ...base,
    status: failureReasons.length === 0 ? "pass" : "fail",
    classes: classesFor(base),
    failureReasons,
  };
}

function failureReasonsFor(row: Omit<AtrialShadowRowV1, "status" | "classes" | "failureReasons">): readonly string[] {
  const failures: string[] = [];
  if (!row.allFinite) failures.push("nonfinite-shadow-readback");
  if (row.sourceReservoirStatus !== "pass") failures.push("source-reservoir-run-not-pass");
  if (row.volumePulseMl <= 1) failures.push("atrial-volume-pulse-too-small");
  if (!activePressureBounded(row.chamberId, row.activePressurePeakMmHg)) {
    failures.push("active-pressure-peak-out-of-shadow-bounds");
  }
  if (row.activePeakTheta < 0.78 || row.activePeakTheta > 0.98) failures.push("active-peak-not-late-diastolic");
  if (row.maxAbsLSiVelocityNormPerSec > 1.65) failures.push("fiber-velocity-bound-hit");
  return failures;
}

function classesFor(row: Omit<AtrialShadowRowV1, "status" | "classes" | "failureReasons">): readonly ShadowClassV1[] {
  const classes: ShadowClassV1[] = ["pressure-substitution-disabled"];
  if (row.sourceReservoirStatus === "pass") classes.push("source-reservoir-pressure-conditioned");
  if (row.allFinite && activePressureBounded(row.chamberId, row.activePressurePeakMmHg)) {
    classes.push("finite-bounded-shadow");
  }
  if (row.activePeakTheta >= 0.78 && row.activePeakTheta <= 0.98) classes.push("late-active-peak");
  return classes;
}

function activePressureBounded(chamberId: AtrialFiberChamberIdV1, peakMmHg: number): boolean {
  if (chamberId === "LA") return peakMmHg >= 5 && peakMmHg <= 18;
  return peakMmHg >= 1 && peakMmHg <= 8;
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

function withRightSystemicVenousPressure(
  params: RightHeartSubsystemParamsV2,
  pressureMmHg: number,
): RightHeartSubsystemParamsV2 {
  return { ...params, systemicVenousPressureMmHg: pressureMmHg };
}

function cycleLength(samples: readonly { readonly tSec: number; readonly theta: number }[]): number {
  const first = samples.find((sample) => sample.theta < 0.02);
  const next = samples.find((sample) => first != null && sample.tSec > first.tSec && sample.theta < 0.02);
  if (first != null && next != null) return Math.max(next.tSec - first.tSec, 1e-9);
  return Math.max((samples.at(-1)?.tSec ?? 1) - (samples[0]?.tSec ?? 0), 1e-9);
}

function maxIndex(values: readonly number[]): number {
  let index = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > values[index]!) index = i;
  }
  return index;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
