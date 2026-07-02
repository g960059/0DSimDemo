import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_LOBE_GENERATOR_CONTRACT_REPORT_ID_V1 =
  "atrial-lobe-generator-contract-report-v1" as const;

type VariantIdV1 =
  | "blood-volume-current-pressure"
  | "blood-volume-fiber-pressure"
  | "piston-display-volume-current-pressure-gain06"
  | "piston-display-volume-current-pressure-gain12"
  | "piston-display-volume-current-pressure-gain18"
  | "piston-display-volume-fiber-pressure-gain06"
  | "piston-display-volume-fiber-pressure-gain12"
  | "piston-display-volume-fiber-pressure-gain18"
  | "piston-display-volume-fiber-plus-kick-pressure-gain12-p2"
  | "piston-display-volume-fiber-plus-kick-pressure-gain18-p2"
  | "blood-volume-fiber-minus-reservoir-pressure-p1"
  | "blood-volume-fiber-minus-reservoir-pressure-p2"
  | "blood-volume-fiber-minus-reservoir-pressure-p3"
  | "piston-display-volume-fiber-minus-reservoir-pressure-g12-p2"
  | "piston-display-volume-fiber-minus-reservoir-pressure-g18-p2";

type PressureModeV1 = "current" | "fiber" | "fiber-plus-kick" | "fiber-minus-reservoir";
type VolumeModeV1 = "blood" | "phase-piston-display";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly volumeMode: VolumeModeV1;
  readonly pressureMode: PressureModeV1;
  readonly pistonGainMl: number;
  readonly pressureKickGainMmHg: number;
};

type LobeQualityV1 = {
  readonly lobeQualityPass: boolean;
  readonly selfIntersections: number;
  readonly aLoopArea: number;
  readonly vLoopArea: number;
  readonly aOverVLoopRatio: number;
  readonly signedALoopArea: number;
  readonly signedVLoopArea: number;
  readonly opposedSignedLobes: boolean;
  readonly volumeSeparationMl: number;
  readonly pressurePulseMmHg: number;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: VariantIdV1;
  readonly volumeMode: VolumeModeV1;
  readonly pressureMode: PressureModeV1;
  readonly pistonGainMl: number;
  readonly pressureKickGainMmHg: number;
  readonly maxDisplayVolumeDeltaMl: number;
  readonly hiddenBloodVolumeSourceMl: 0;
  readonly lobeQuality: LobeQualityV1;
  readonly displayVolumeBounded: boolean;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly pass: number;
  readonly lobeQualityPass: number;
  readonly selfIntersectionCount: number;
  readonly opposedLobeCount: number;
  readonly displayVolumeBoundedCount: number;
  readonly hiddenBloodVolumeCleanCount: 7;
  readonly meanMaxDisplayVolumeDeltaMl: number;
  readonly maxALoopArea: number;
  readonly maxVLoopArea: number;
  readonly maxVolumeSeparationMl: number;
};

export type AtrialLobeGeneratorContractReportV1 = {
  readonly reportId: typeof ATRIAL_LOBE_GENERATOR_CONTRACT_REPORT_ID_V1;
  readonly gateId: "atrialLobeGeneratorContractV1";
  readonly contractMode:
    "left-atrial-lobe-generator-oracle-no-runtime-no-blood-ledger-mutation";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: VariantIdV1;
    readonly bestPass: number;
    readonly bestLobeQualityPass: number;
    readonly bestOpposedLobeCount: number;
    readonly bestHiddenBloodVolumeCleanCount: 7;
  };
  readonly decision: {
    readonly atrialLobeGeneratorStatus:
      | "atrial-lobe-generator-contract-signal"
      | "atrial-lobe-generator-contract-mixed"
      | "atrial-lobe-generator-contract-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly aPrimePhysiologyClaim: false;
    readonly bloodLedgerMutation: false;
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
    variantId: "blood-volume-current-pressure",
    volumeMode: "blood",
    pressureMode: "current",
    pistonGainMl: 0,
    pressureKickGainMmHg: 0,
  },
  {
    variantId: "blood-volume-fiber-pressure",
    volumeMode: "blood",
    pressureMode: "fiber",
    pistonGainMl: 0,
    pressureKickGainMmHg: 0,
  },
  ...pistonVariants("current", 0),
  ...pistonVariants("fiber", 0),
  {
    variantId: "piston-display-volume-fiber-plus-kick-pressure-gain12-p2",
    volumeMode: "phase-piston-display",
    pressureMode: "fiber-plus-kick",
    pistonGainMl: 12,
    pressureKickGainMmHg: 2,
  },
  {
    variantId: "piston-display-volume-fiber-plus-kick-pressure-gain18-p2",
    volumeMode: "phase-piston-display",
    pressureMode: "fiber-plus-kick",
    pistonGainMl: 18,
    pressureKickGainMmHg: 2,
  },
  {
    variantId: "blood-volume-fiber-minus-reservoir-pressure-p1",
    volumeMode: "blood",
    pressureMode: "fiber-minus-reservoir",
    pistonGainMl: 0,
    pressureKickGainMmHg: 1,
  },
  {
    variantId: "blood-volume-fiber-minus-reservoir-pressure-p2",
    volumeMode: "blood",
    pressureMode: "fiber-minus-reservoir",
    pistonGainMl: 0,
    pressureKickGainMmHg: 2,
  },
  {
    variantId: "blood-volume-fiber-minus-reservoir-pressure-p3",
    volumeMode: "blood",
    pressureMode: "fiber-minus-reservoir",
    pistonGainMl: 0,
    pressureKickGainMmHg: 3,
  },
  {
    variantId: "piston-display-volume-fiber-minus-reservoir-pressure-g12-p2",
    volumeMode: "phase-piston-display",
    pressureMode: "fiber-minus-reservoir",
    pistonGainMl: 12,
    pressureKickGainMmHg: 2,
  },
  {
    variantId: "piston-display-volume-fiber-minus-reservoir-pressure-g18-p2",
    volumeMode: "phase-piston-display",
    pressureMode: "fiber-minus-reservoir",
    pistonGainMl: 18,
    pressureKickGainMmHg: 2,
  },
];

export function runAtrialLobeGeneratorContractBenchV1():
AtrialLobeGeneratorContractReportV1 {
  const paramsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const runs = paramsByProfile.map((params) => runLeftHeartSubsystemV2({
    ...params,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
  }));
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const params = paramsByProfile[index]!;
    const run = runs[index]!;
    return VARIANTS.map((variant) => rowForVariant(profileId, params, run.finalBeatSamples, variant));
  });
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(
    variant.variantId,
    rows.filter((row) => row.variantId === variant.variantId),
  ));
  const bestVariant = [...variantSummaries].sort(compareSummaries)[0]!;
  const status = bestVariant.pass === PROFILE_IDS.length
    ? "atrial-lobe-generator-contract-signal"
    : bestVariant.lobeQualityPass > 1 || bestVariant.opposedLobeCount >= 4
      ? "atrial-lobe-generator-contract-mixed"
      : "atrial-lobe-generator-contract-blocked";
  return {
    reportId: ATRIAL_LOBE_GENERATOR_CONTRACT_REPORT_ID_V1,
    gateId: "atrialLobeGeneratorContractV1",
    contractMode: "left-atrial-lobe-generator-oracle-no-runtime-no-blood-ledger-mutation",
    variants: VARIANTS,
    rows,
    variantSummaries,
    bestVariant,
    summary: {
      totalProfiles: 7,
      bestVariantId: bestVariant.variantId,
      bestPass: bestVariant.pass,
      bestLobeQualityPass: bestVariant.lobeQualityPass,
      bestOpposedLobeCount: bestVariant.opposedLobeCount,
      bestHiddenBloodVolumeCleanCount: bestVariant.hiddenBloodVolumeCleanCount,
    },
    decision: {
      atrialLobeGeneratorStatus: status,
      nextAction: status === "atrial-lobe-generator-contract-signal"
        ? "Use this only as structural lobe-generator evidence. Promotion still needs a same-step chamber/valve/source transaction with real state ownership."
        : status === "atrial-lobe-generator-contract-mixed"
          ? "Use this bounded AtrialFiber pressure signal to design the next state-owned atrial chamber/valve lobe generator; simple display-piston and phase-pressure oracles are not enough."
          : "Keep atrial promotion blocked; these display-volume and pressure-source oracles still do not provide enough opposed-lobe quality.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-enable",
        "a-prime-physiology",
        "blood-ledger-mutation",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimePhysiologyClaim: false,
      bloodLedgerMutation: false,
      LandAtrialUnlock: false,
    },
  };
}

function rowForVariant(
  profileId: FourChamberSubsystemProfileIdV1,
  params: LeftHeartSubsystemParamsV2,
  samples: readonly LeftHeartSubsystemSampleV2[],
  variant: VariantV1,
): RowV1 {
  const volumes = samples.map((sample) => displayVolume(sample, variant));
  const pressures = samples.map((sample) => displayPressure(sample, variant));
  const theta = samples.map((sample) => sample.theta);
  const maxDisplayVolumeDeltaMl = maxAbs(samples.map((sample, index) =>
    volumes[index]! - sample.acceptedLaVolumeMl
  ));
  const lobeQuality = lobeQualityFor(volumes, pressures, theta);
  const displayVolumeBounded = volumes.every((volume) => volume > 0 && volume < 250);
  const failureReasons = [
    ...(lobeQuality.lobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
    ...(displayVolumeBounded ? [] : ["display-volume-out-of-bounds"]),
  ];
  return {
    profileId,
    sourcePointId: params.fixtureId,
    variantId: variant.variantId,
    volumeMode: variant.volumeMode,
    pressureMode: variant.pressureMode,
    pistonGainMl: variant.pistonGainMl,
    pressureKickGainMmHg: variant.pressureKickGainMmHg,
    maxDisplayVolumeDeltaMl: round(maxDisplayVolumeDeltaMl),
    hiddenBloodVolumeSourceMl: 0,
    lobeQuality,
    displayVolumeBounded,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function displayVolume(sample: LeftHeartSubsystemSampleV2, variant: VariantV1): number {
  if (variant.volumeMode === "blood") return sample.acceptedLaVolumeMl;
  return sample.acceptedLaVolumeMl + variant.pistonGainMl * reservoirDescent01(sample.theta);
}

function displayPressure(sample: LeftHeartSubsystemSampleV2, variant: VariantV1): number {
  return reservoirAwarePressure(sample, variant);
}

function reservoirAwarePressure(sample: LeftHeartSubsystemSampleV2, variant: VariantV1): number {
  const base = variant.pressureMode === "current"
    ? sample.lapMmHg
    : sample.laFiberChamber.pressureRawMmHg;
  if (variant.pressureMode === "fiber-plus-kick") {
    return base + variant.pressureKickGainMmHg * aWave01(sample.theta);
  }
  if (variant.pressureMode === "fiber-minus-reservoir") {
    return Math.max(0, base - variant.pressureKickGainMmHg * reservoirDescent01(sample.theta));
  }
  return base;
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
  const opposedSignedLobes = signedALoop * signedVLoop < 0;
  const volumeSeparationMl = mean(vLoop.x) - mean(aLoop.x);
  const pressurePulseMmHg = Math.max(...pressures) - Math.min(...pressures);
  const failures: string[] = [];
  if (selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failures.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failures.push("v-loop-area-too-small");
  if (!opposedSignedLobes) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparationMl < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  return {
    lobeQualityPass: failures.length === 0,
    selfIntersections,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    aOverVLoopRatio: round(aLoopArea / Math.max(vLoopArea, 1e-9)),
    signedALoopArea: round(signedALoop),
    signedVLoopArea: round(signedVLoop),
    opposedSignedLobes,
    volumeSeparationMl: round(volumeSeparationMl),
    pressurePulseMmHg: round(pressurePulseMmHg),
    failureReasons: failures,
  };
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    pass: rows.filter((row) => row.status === "pass").length,
    lobeQualityPass: rows.filter((row) => row.lobeQuality.lobeQualityPass).length,
    selfIntersectionCount: rows.filter((row) => row.lobeQuality.selfIntersections >= 1).length,
    opposedLobeCount: rows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
    displayVolumeBoundedCount: rows.filter((row) => row.displayVolumeBounded).length,
    hiddenBloodVolumeCleanCount: 7,
    meanMaxDisplayVolumeDeltaMl: round(mean(rows.map((row) => row.maxDisplayVolumeDeltaMl))),
    maxALoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.aLoopArea))),
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.vLoopArea))),
    maxVolumeSeparationMl: round(Math.max(0, ...rows.map((row) => row.lobeQuality.volumeSeparationMl))),
  };
}

function compareSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.pass - a.pass
    || b.lobeQualityPass - a.lobeQualityPass
    || b.opposedLobeCount - a.opposedLobeCount
    || b.selfIntersectionCount - a.selfIntersectionCount
    || b.displayVolumeBoundedCount - a.displayVolumeBoundedCount;
}

function pistonVariants(
  pressureMode: "current" | "fiber",
  pressureKickGainMmHg: 0,
): readonly VariantV1[] {
  return ([6, 12, 18] as const).map((gain) => ({
    variantId: `piston-display-volume-${pressureMode}-pressure-gain${String(gain).padStart(2, "0")}` as VariantIdV1,
    volumeMode: "phase-piston-display",
    pressureMode,
    pistonGainMl: gain,
    pressureKickGainMmHg,
  }));
}

function reservoirDescent01(theta: number): number {
  return raisedCosineWindow(theta, 0.06, 0.82);
}

function aWave01(theta: number): number {
  return raisedCosineWindow(theta, 0.74, 0.98);
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  const value = positiveModulo(theta, 1);
  const normalized = start <= end
    ? (value - start) / Math.max(end - start, 1e-9)
    : (value >= start ? value - start : value + 1 - start) / Math.max(end + 1 - start, 1e-9);
  if (normalized < 0 || normalized > 1) return 0;
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * normalized);
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

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
