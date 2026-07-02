import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberStateV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  enabledAVPlaneGeometryShadowReadbackV1,
  type AVPlaneGeometryReadbackV1,
} from "@/engine/mechanics2/core/AVPlaneGeometryStateV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_GEOMETRY_LOBE_SHADOW_REPORT_ID_V1 =
  "atrial-geometry-lobe-shadow-report-v1" as const;

type VariantIdV1 =
  | "geometry-gain00"
  | "geometry-gain06"
  | "geometry-gain12"
  | "geometry-gain18";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly atrialGeometryGainMl: number;
  readonly description: string;
};

type LobeQualityV1 = {
  readonly selfIntersections: number;
  readonly aLoopAreaProxyMmHgMl: number;
  readonly vLoopAreaProxyMmHgMl: number;
  readonly signedALoopAreaMmHgMl: number;
  readonly signedVLoopAreaMmHgMl: number;
  readonly opposedSignedLobes: boolean;
  readonly vMeanVolumeMinusAMeanVolumeMl: number;
  readonly lobeQualityPass: boolean;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: VariantIdV1;
  readonly atrialGeometryGainMl: number;
  readonly lobeQuality: LobeQualityV1;
  readonly maxAtrialGeometryDeltaMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly aPrimeReadbackPresent: boolean;
  readonly aPrimePeakAbsCmPerSec: number;
  readonly meanPressureDeltaFromSourceMmHg: number;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly lobeQualityPass: number;
  readonly aPrimeReadbackPresentCount: number;
  readonly hiddenVolumeCleanCount: number;
  readonly meanMaxAtrialGeometryDeltaMl: number;
  readonly maxAPrimePeakAbsCmPerSec: number;
};

export type AtrialGeometryLobeShadowReportV1 = {
  readonly reportId: typeof ATRIAL_GEOMETRY_LOBE_SHADOW_REPORT_ID_V1;
  readonly gateId: "atrialGeometryLobeShadowV1";
  readonly shadowMode:
    "readback-only-effective-geometry-no-hidden-blood-volume-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: VariantIdV1;
    readonly bestLobeQualityPass: number;
    readonly bestAPrimeReadbackPresentCount: number;
    readonly bestHiddenVolumeCleanCount: number;
    readonly baselineLobeQualityPass: number;
  };
  readonly decision: {
    readonly atrialGeometryLobeShadowStatus:
      | "atrial-geometry-lobe-shadow-signal"
      | "atrial-geometry-lobe-shadow-mixed"
      | "atrial-geometry-lobe-shadow-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly aPrimePhysiologyClaim: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const PRE_A_THETA = 0.74;

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

const VARIANTS: readonly VariantV1[] = [
  {
    variantId: "geometry-gain00",
    atrialGeometryGainMl: 0,
    description: "No effective AV-plane geometry delta; AtrialFiber pressure is replayed against blood volume only.",
  },
  {
    variantId: "geometry-gain06",
    atrialGeometryGainMl: 6,
    description: "Small readback-only atrial effective geometry delta from LV shortening.",
  },
  {
    variantId: "geometry-gain12",
    atrialGeometryGainMl: 12,
    description: "Moderate readback-only atrial effective geometry delta from LV shortening.",
  },
  {
    variantId: "geometry-gain18",
    atrialGeometryGainMl: 18,
    description: "Large readback-only atrial effective geometry delta from LV shortening.",
  },
];

export function runAtrialGeometryLobeShadowBenchV1():
AtrialGeometryLobeShadowReportV1 {
  const paramsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const params = sourceParams(paramsByProfile[index]!);
    const run = runLeftHeartSubsystemV2(params);
    return VARIANTS.map((variant) => rowForVariant(profileId, params.fixtureId, variant, params, run.finalBeatSamples));
  });
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(
    variant.variantId,
    rows.filter((row) => row.variantId === variant.variantId),
  ));
  const baseline = requiredVariant(variantSummaries, "geometry-gain00");
  const bestVariant = [...variantSummaries].sort(compareSummaries)[0]!;
  const status = bestVariant.lobeQualityPass === PROFILE_IDS.length
    ? "atrial-geometry-lobe-shadow-signal"
    : bestVariant.lobeQualityPass > baseline.lobeQualityPass
      ? "atrial-geometry-lobe-shadow-mixed"
      : "atrial-geometry-lobe-shadow-blocked";
  return {
    reportId: ATRIAL_GEOMETRY_LOBE_SHADOW_REPORT_ID_V1,
    gateId: "atrialGeometryLobeShadowV1",
    shadowMode: "readback-only-effective-geometry-no-hidden-blood-volume-no-runtime",
    variants: VARIANTS,
    rows,
    variantSummaries,
    bestVariant,
    summary: {
      totalProfiles: 7,
      bestVariantId: bestVariant.variantId,
      bestLobeQualityPass: bestVariant.lobeQualityPass,
      bestAPrimeReadbackPresentCount: bestVariant.aPrimeReadbackPresentCount,
      bestHiddenVolumeCleanCount: bestVariant.hiddenVolumeCleanCount,
      baselineLobeQualityPass: baseline.lobeQualityPass,
    },
    decision: {
      atrialGeometryLobeShadowStatus: status,
      nextAction: status === "atrial-geometry-lobe-shadow-signal"
        ? "Proceed only to a real stateful geometry transaction. This readback-only shadow is not runtime AV-plane enablement."
        : status === "atrial-geometry-lobe-shadow-mixed"
          ? "Use the lobe-quality improvement to design a stateful geometry transaction, while keeping runtime and physiology claims blocked."
          : "Keep AV-plane enablement blocked; readback-only geometry did not improve atrial lobe quality enough.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-enable",
        "a-prime-physiology",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimePhysiologyClaim: false,
      LandAtrialUnlock: false,
    },
  };
}

function sourceParams(params: LeftHeartSubsystemParamsV2): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionMode: "fixed-point",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  };
}

function rowForVariant(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  variant: VariantV1,
  params: LeftHeartSubsystemParamsV2,
  samples: readonly LeftHeartSubsystemSampleV2[],
): RowV1 {
  const replay = replayGeometryShadow(params, samples, variant.atrialGeometryGainMl);
  const lobeQuality = lobeQualityFor(
    samples.map((sample) => sample.acceptedLaVolumeMl),
    replay.geometryAdjustedPressureMmHg,
    samples.map((sample) => sample.theta),
  );
  const maxHiddenBloodVolumeSourceMl = maxAbs(replay.readbacks.map((readback) => readback.hiddenBloodVolumeSourceMl));
  const aPrimeValues = replay.readbacks
    .map((readback) => readback.aPrimeProxyCmPerSec)
    .filter((value): value is number => value != null);
  const failureReasons = [
    ...(lobeQuality.lobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
    ...(maxHiddenBloodVolumeSourceMl === 0 ? [] : ["hidden-blood-volume-source"]),
    ...(aPrimeValues.length > 0 ? [] : ["missing-a-prime-shadow-readback"]),
  ];
  return {
    profileId,
    sourcePointId,
    variantId: variant.variantId,
    atrialGeometryGainMl: variant.atrialGeometryGainMl,
    lobeQuality,
    maxAtrialGeometryDeltaMl: round(Math.max(0, ...replay.readbacks.map((readback) => readback.atrialGeometryDeltaMl))),
    maxHiddenBloodVolumeSourceMl: round(maxHiddenBloodVolumeSourceMl),
    aPrimeReadbackPresent: aPrimeValues.length > 0,
    aPrimePeakAbsCmPerSec: round(maxAbs(aPrimeValues)),
    meanPressureDeltaFromSourceMmHg: round(meanAbs(replay.geometryAdjustedPressureMmHg.map((value, index) =>
      value - samples[index]!.lapMmHg
    ))),
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function replayGeometryShadow(
  params: LeftHeartSubsystemParamsV2,
  samples: readonly LeftHeartSubsystemSampleV2[],
  atrialGeometryGainMl: number,
): {
  readonly geometryAdjustedPressureMmHg: readonly number[];
  readonly readbacks: readonly AVPlaneGeometryReadbackV1[];
} {
  if (samples.length === 0) return { geometryAdjustedPressureMmHg: [], readbacks: [] };
  const lvVolumes = samples.map((sample) => sample.acceptedLvVolumeMl);
  const lvMax = Math.max(...lvVolumes);
  const lvMin = Math.min(...lvVolumes);
  const strokeRange = Math.max(lvMax - lvMin, 1e-9);
  const dtSec = samples.length >= 2
    ? Math.max(samples[1]!.tSec - samples[0]!.tSec, 1e-6)
    : 1 / Math.max(params.sampleRateHz, 1);
  const cycleLengthSec = 60 / Math.max(params.heartRateBpm, 1e-9);
  let state: AtrialFiberChamberStateV1 | null = null;
  let previousEffectiveVolume = samples[0]!.acceptedLaVolumeMl;
  let previousZ = 0;
  const pressures: number[] = [];
  const readbacks: AVPlaneGeometryReadbackV1[] = [];
  for (const sample of samples) {
    const shortening01 = clamp((lvMax - sample.acceptedLvVolumeMl) / strokeRange, 0, 1);
    const geometryDeltaMl = atrialGeometryGainMl * shortening01;
    const effectiveVolumeMl = sample.acceptedLaVolumeMl + geometryDeltaMl;
    const beatStartSec = sample.tSec - sample.theta * cycleLengthSec;
    const activationTimeSec = beatStartSec
      + positiveModulo(params.laAWaveStartTheta - 0.10, 1) * cycleLengthSec;
    if (state == null) {
      state = initialAtrialFiberChamberStateV1(effectiveVolumeMl, DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA);
      previousEffectiveVolume = effectiveVolumeMl;
    }
    const chamber = stepAtrialFiberChamberV1(state, {
      tSec: sample.tSec,
      dtSec,
      cycleLengthSec,
      activationTimeSec,
      cavityVolumeMl: effectiveVolumeMl,
      previousCavityVolumeMl: previousEffectiveVolume,
    }, DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA);
    const zDot = (shortening01 - previousZ) / Math.max(dtSec, 1e-9);
    readbacks.push(enabledAVPlaneGeometryShadowReadbackV1({
      side: "left",
      theta: sample.theta,
      zAvNorm: shortening01,
      zAvDotNormPerSec: zDot,
      atrialGeometryDeltaMl: geometryDeltaMl,
      velocityScaleCmPerSec: 1.5,
      atrialKickVelocityWindow: [params.laAWaveStartTheta, params.laAWaveEndTheta],
    }));
    pressures.push(chamber.pressureRawMmHg);
    state = chamber.state;
    previousEffectiveVolume = effectiveVolumeMl;
    previousZ = shortening01;
  }
  return { geometryAdjustedPressureMmHg: pressures, readbacks };
}

function lobeQualityFor(
  volumes: readonly number[],
  pressures: readonly number[],
  theta: readonly number[],
): LobeQualityV1 {
  const selfIntersections = countSelfIntersections(volumes, pressures);
  const aIndices = theta.map((value, index) => value >= PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const vIndices = theta.map((value, index) => value < PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const aLoop = sliceByIndices(volumes, pressures, aIndices);
  const vLoop = sliceByIndices(volumes, pressures, vIndices);
  const signedALoop = signedPolygonArea(aLoop.x, aLoop.y);
  const signedVLoop = signedPolygonArea(vLoop.x, vLoop.y);
  const aLoopArea = Math.abs(signedALoop);
  const vLoopArea = Math.abs(signedVLoop);
  const opposed = signedALoop * signedVLoop < 0;
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const failures: string[] = [];
  if (selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failures.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failures.push("v-loop-area-too-small");
  if (!opposed) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  return {
    selfIntersections,
    aLoopAreaProxyMmHgMl: round(aLoopArea),
    vLoopAreaProxyMmHgMl: round(vLoopArea),
    signedALoopAreaMmHgMl: round(signedALoop),
    signedVLoopAreaMmHgMl: round(signedVLoop),
    opposedSignedLobes: opposed,
    vMeanVolumeMinusAMeanVolumeMl: round(volumeSeparation),
    lobeQualityPass: failures.length === 0,
    failureReasons: failures,
  };
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    lobeQualityPass: rows.filter((row) => row.lobeQuality.lobeQualityPass).length,
    aPrimeReadbackPresentCount: rows.filter((row) => row.aPrimeReadbackPresent).length,
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    meanMaxAtrialGeometryDeltaMl: round(mean(rows.map((row) => row.maxAtrialGeometryDeltaMl))),
    maxAPrimePeakAbsCmPerSec: round(Math.max(0, ...rows.map((row) => row.aPrimePeakAbsCmPerSec))),
  };
}

function compareSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.lobeQualityPass - a.lobeQualityPass
    || b.aPrimeReadbackPresentCount - a.aPrimeReadbackPresentCount
    || a.meanMaxAtrialGeometryDeltaMl - b.meanMaxAtrialGeometryDeltaMl;
}

function requiredVariant(variants: readonly VariantSummaryV1[], variantId: VariantIdV1): VariantSummaryV1 {
  const variant = variants.find((candidate) => candidate.variantId === variantId);
  if (variant == null) throw new Error(`Missing atrial geometry lobe shadow variant: ${variantId}`);
  return variant;
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

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function meanAbs(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + Math.abs(value), 0) / values.length;
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
