import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberIdV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
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

export const ATRIAL_FIGURE_EIGHT_QUALITY_AUDIT_REPORT_ID_V1 =
  "atrial-figure-eight-quality-audit-report-v1" as const;

type PressureSourceV1 = "current-source-pressure" | "atrial-fiber-pressure";

type AtrialPvQualityV1 = {
  readonly pressureSource: PressureSourceV1;
  readonly selfIntersections: number;
  readonly totalLoopAreaMmHgMl: number;
  readonly aLoopAreaProxyMmHgMl: number;
  readonly vLoopAreaProxyMmHgMl: number;
  readonly aOverVLoopRatio: number;
  readonly signedALoopAreaMmHgMl: number;
  readonly signedVLoopAreaMmHgMl: number;
  readonly opposedSignedLobes: boolean;
  readonly vMeanVolumeMinusAMeanVolumeMl: number;
  readonly pressurePulseMmHg: number;
  readonly basicFigureEightPass: boolean;
  readonly lobeQualityPass: boolean;
  readonly failureReasons: readonly string[];
};

type AtrialFigureEightAuditRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly sourcePointId: string;
  readonly currentPv: AtrialPvQualityV1;
  readonly fiberPv: AtrialPvQualityV1;
  readonly totalEmptyingFraction: number;
  readonly passiveEmptyingFraction: number;
  readonly activeEmptyingFraction: number;
  readonly preAtrialContractionTheta: number;
  readonly avPlanePositionStatePresent: false;
  readonly avPlaneVelocityStatePresent: false;
  readonly aPrimeReadbackStatus: "missing-av-plane-velocity-state";
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type AtrialFigureEightQualityAuditReportV1 = {
  readonly reportId: typeof ATRIAL_FIGURE_EIGHT_QUALITY_AUDIT_REPORT_ID_V1;
  readonly gateId: "atrialFigureEightQualityAuditV1";
  readonly auditMode:
    "source-reservoir-conditioned-atrial-pv-quality-no-pressure-substitution-no-av-plane";
  readonly rows: readonly AtrialFigureEightAuditRowV1[];
  readonly summary: {
    readonly total: 14;
    readonly currentBasicFigureEightPass: number;
    readonly currentLobeQualityPass: number;
    readonly fiberBasicFigureEightPass: number;
    readonly fiberLobeQualityPass: number;
    readonly bothPressureSourcesLobeQualityPass: number;
    readonly avPlaneVelocityReadbackPresent: 0;
    readonly meanCurrentAOverVLoopRatio: number;
    readonly meanFiberAOverVLoopRatio: number;
  };
  readonly decision: {
    readonly atrialFigureEightQualityStatus:
      | "atrial-figure-eight-quality-audit-signal"
      | "atrial-figure-eight-quality-audit-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly pressureSubstitution: false;
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

export function runAtrialFigureEightQualityAuditBenchV1():
AtrialFigureEightQualityAuditReportV1 {
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
      auditLeft(profile.profileId, leftParams[index]!, leftRun.finalBeatSamples),
      auditRight(profile.profileId, rightParams[index]!, rightRun.finalBeatSamples),
    ];
  });
  const currentLobeQualityPass = rows.filter((row) => row.currentPv.lobeQualityPass).length;
  const fiberLobeQualityPass = rows.filter((row) => row.fiberPv.lobeQualityPass).length;
  const bothPressureSourcesLobeQualityPass = rows.filter((row) =>
    row.currentPv.lobeQualityPass && row.fiberPv.lobeQualityPass
  ).length;
  const status = bothPressureSourcesLobeQualityPass === rows.length
    ? "atrial-figure-eight-quality-audit-signal"
    : "atrial-figure-eight-quality-audit-blocked";
  return {
    reportId: ATRIAL_FIGURE_EIGHT_QUALITY_AUDIT_REPORT_ID_V1,
    gateId: "atrialFigureEightQualityAuditV1",
    auditMode: "source-reservoir-conditioned-atrial-pv-quality-no-pressure-substitution-no-av-plane",
    rows,
    summary: {
      total: 14,
      currentBasicFigureEightPass: rows.filter((row) => row.currentPv.basicFigureEightPass).length,
      currentLobeQualityPass,
      fiberBasicFigureEightPass: rows.filter((row) => row.fiberPv.basicFigureEightPass).length,
      fiberLobeQualityPass,
      bothPressureSourcesLobeQualityPass,
      avPlaneVelocityReadbackPresent: 0,
      meanCurrentAOverVLoopRatio: round(mean(rows.map((row) => row.currentPv.aOverVLoopRatio))),
      meanFiberAOverVLoopRatio: round(mean(rows.map((row) => row.fiberPv.aOverVLoopRatio))),
    },
    decision: {
      atrialFigureEightQualityStatus: status,
      nextAction: status === "atrial-figure-eight-quality-audit-signal"
        ? "Use this only as an atrial PV quality audit signal. A stateful LA/RA chamber contract still needs AV-plane position/velocity readbacks before a' or morphology acceptance."
        : "Do not optimize LA pressure parity or MVF alone. The next atrial model surface should co-evolve atrial pressure and volume in a stateful chamber contract and add explicit AV-plane position/velocity readbacks for a'.",
      blockedClaims: [
        "atrial-pressure-substitution",
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "a-prime-readback",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      pressureSubstitution: false,
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      aPrimeReadback: false,
      LandAtrialUnlock: false,
    },
  };
}

function auditLeft(
  profileId: FourChamberSubsystemProfileIdV1,
  params: LeftHeartSubsystemParamsV2,
  samples: readonly LeftHeartSubsystemSampleV2[],
): AtrialFigureEightAuditRowV1 {
  return auditAtrial({
    profileId,
    chamberId: "LA",
    sourcePointId: params.fixtureId,
    sampleRateHz: params.sampleRateHz,
    cycleLengthSec: 60 / params.heartRateBpm,
    activationTheta: params.laAWaveStartTheta - 0.10,
    samples: samples.map((sample) => ({
      tSec: sample.tSec,
      theta: sample.theta,
      volumeMl: sample.acceptedLaVolumeMl,
      currentPressureMmHg: sample.lapMmHg,
    })),
  });
}

function auditRight(
  profileId: FourChamberSubsystemProfileIdV1,
  params: RightHeartSubsystemParamsV2,
  samples: readonly RightHeartSubsystemSampleV2[],
): AtrialFigureEightAuditRowV1 {
  return auditAtrial({
    profileId,
    chamberId: "RA",
    sourcePointId: params.fixtureId,
    sampleRateHz: params.sampleRateHz,
    cycleLengthSec: 60 / params.heartRateBpm,
    activationTheta: params.raAWaveStartTheta - 0.10,
    samples: samples.map((sample) => ({
      tSec: sample.tSec,
      theta: sample.theta,
      volumeMl: sample.acceptedRaVolumeMl,
      currentPressureMmHg: sample.rapMmHg,
    })),
  });
}

function auditAtrial(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly sourcePointId: string;
  readonly sampleRateHz: number;
  readonly cycleLengthSec: number;
  readonly activationTheta: number;
  readonly samples: readonly {
    readonly tSec: number;
    readonly theta: number;
    readonly volumeMl: number;
    readonly currentPressureMmHg: number;
  }[];
}): AtrialFigureEightAuditRowV1 {
  const params = DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1[input.chamberId];
  let state = initialAtrialFiberChamberStateV1(input.samples[0]?.volumeMl ?? params.referenceCavityVolumeMl, params);
  let previousVolume = input.samples[0]?.volumeMl ?? params.referenceCavityVolumeMl;
  const fiberPressure: number[] = [];
  const currentPressure: number[] = [];
  const volumes: number[] = [];
  const theta: number[] = [];
  for (const sample of input.samples) {
    const output = stepAtrialFiberChamberV1(state, {
      tSec: sample.tSec,
      dtSec: 1 / input.sampleRateHz,
      cycleLengthSec: input.cycleLengthSec,
      activationTimeSec: sample.tSec - sample.theta * input.cycleLengthSec
        + positiveModulo(input.activationTheta, 1) * input.cycleLengthSec,
      cavityVolumeMl: sample.volumeMl,
      previousCavityVolumeMl: previousVolume,
    }, params);
    state = output.state;
    previousVolume = sample.volumeMl;
    volumes.push(sample.volumeMl);
    currentPressure.push(sample.currentPressureMmHg);
    fiberPressure.push(output.pressureRawMmHg);
    theta.push(sample.theta);
  }
  const currentPv = qualityFor("current-source-pressure", volumes, currentPressure, theta, input.chamberId);
  const fiberPv = qualityFor("atrial-fiber-pressure", volumes, fiberPressure, theta, input.chamberId);
  const preAtrialContractionVolume = nearestVolumeAtTheta(volumes, theta, PRE_A_THETA);
  const maxVolume = Math.max(...volumes);
  const minVolume = Math.min(...volumes);
  const base = {
    profileId: input.profileId,
    chamberId: input.chamberId,
    sourcePointId: input.sourcePointId,
    currentPv,
    fiberPv,
    totalEmptyingFraction: round((maxVolume - minVolume) / Math.max(maxVolume, 1e-9)),
    passiveEmptyingFraction: round((maxVolume - preAtrialContractionVolume) / Math.max(maxVolume, 1e-9)),
    activeEmptyingFraction: round((preAtrialContractionVolume - minVolume) / Math.max(preAtrialContractionVolume, 1e-9)),
    preAtrialContractionTheta: PRE_A_THETA,
    avPlanePositionStatePresent: false as const,
    avPlaneVelocityStatePresent: false as const,
    aPrimeReadbackStatus: "missing-av-plane-velocity-state" as const,
  };
  const failureReasons = failureReasonsFor(base);
  return {
    ...base,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function qualityFor(
  pressureSource: PressureSourceV1,
  volumes: readonly number[],
  pressures: readonly number[],
  theta: readonly number[],
  chamberId: AtrialFiberChamberIdV1,
): AtrialPvQualityV1 {
  const selfIntersections = countSelfIntersections(volumes, pressures);
  const aIndices = theta.map((value, index) => value >= PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const vIndices = theta.map((value, index) => value < PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const aLoop = sliceByIndices(volumes, pressures, aIndices);
  const vLoop = sliceByIndices(volumes, pressures, vIndices);
  const signedALoop = signedPolygonArea(aLoop.x, aLoop.y);
  const signedVLoop = signedPolygonArea(vLoop.x, vLoop.y);
  const aLoopArea = Math.abs(signedALoop);
  const vLoopArea = Math.abs(signedVLoop);
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const pressurePulse = Math.max(...pressures) - Math.min(...pressures);
  const minLobeArea = chamberId === "LA" ? 1.8 : 0.45;
  const minVolumeSeparation = chamberId === "LA" ? 1.2 : 0.6;
  const basicFigureEightPass = selfIntersections >= 1 && pressurePulse >= (chamberId === "LA" ? 1.2 : 0.7);
  const opposedSignedLobes = signedALoop * signedVLoop < 0;
  const lobeQualityPass = basicFigureEightPass
    && aLoopArea >= minLobeArea
    && vLoopArea >= minLobeArea
    && volumeSeparation >= minVolumeSeparation
    && opposedSignedLobes;
  const base = {
    pressureSource,
    selfIntersections,
    totalLoopAreaMmHgMl: round(Math.abs(signedPolygonArea(volumes, pressures))),
    aLoopAreaProxyMmHgMl: round(aLoopArea),
    vLoopAreaProxyMmHgMl: round(vLoopArea),
    aOverVLoopRatio: round(aLoopArea / Math.max(vLoopArea, 1e-9)),
    signedALoopAreaMmHgMl: round(signedALoop),
    signedVLoopAreaMmHgMl: round(signedVLoop),
    opposedSignedLobes,
    vMeanVolumeMinusAMeanVolumeMl: round(volumeSeparation),
    pressurePulseMmHg: round(pressurePulse),
    basicFigureEightPass,
    lobeQualityPass,
  };
  return {
    ...base,
    failureReasons: qualityFailureReasons(base, minLobeArea, minVolumeSeparation),
  };
}

function qualityFailureReasons(
  quality: Omit<AtrialPvQualityV1, "failureReasons">,
  minLobeArea: number,
  minVolumeSeparation: number,
): readonly string[] {
  const failures: string[] = [];
  if (quality.selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (quality.aLoopAreaProxyMmHgMl < minLobeArea) failures.push("a-loop-area-too-small");
  if (quality.vLoopAreaProxyMmHgMl < minLobeArea) failures.push("v-loop-area-too-small");
  if (!quality.opposedSignedLobes) failures.push("a-v-lobes-not-opposed");
  if (quality.vMeanVolumeMinusAMeanVolumeMl < minVolumeSeparation) {
    failures.push("v-loop-not-higher-volume-than-a-loop");
  }
  return failures;
}

function failureReasonsFor(
  row: Omit<AtrialFigureEightAuditRowV1, "status" | "failureReasons">,
): readonly string[] {
  const failures: string[] = [];
  if (!row.currentPv.lobeQualityPass) failures.push("current-pressure-pv-lobe-quality-fail");
  if (!row.fiberPv.lobeQualityPass) failures.push("fiber-pressure-pv-lobe-quality-fail");
  if (!row.avPlaneVelocityStatePresent) failures.push("a-prime-readback-missing-av-plane-velocity");
  return failures;
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

function nearestVolumeAtTheta(volumes: readonly number[], theta: readonly number[], targetTheta: number): number {
  let bestIndex = 0;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 0; i < theta.length; i++) {
    const delta = circularDelta(theta[i]!, targetTheta);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = i;
    }
  }
  return volumes[bestIndex] ?? volumes[0] ?? Number.NaN;
}

function circularDelta(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 1 - raw);
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
