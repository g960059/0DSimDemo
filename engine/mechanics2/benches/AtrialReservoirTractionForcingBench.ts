import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberStateV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";

export const ATRIAL_RESERVOIR_TRACTION_FORCING_REPORT_ID_V1 =
  "atrial-reservoir-traction-forcing-report-v1" as const;

export type AtrialReservoirTractionVariantIdV1 =
  | "no-traction"
  | "descent-traction-gain04"
  | "descent-traction-gain08"
  | "descent-traction-gain12"
  | "descent-traction-gain16"
  | "descent-traction-negative-gain08";

export type AtrialReservoirTractionProfileIdV1 =
  | "normal-hr75"
  | "normal-hr90"
  | "venous-low"
  | "venous-high"
  | "avplane-low"
  | "booster-high"
  | "stiff-atrial-wall";

type TractionVariantV1 = {
  readonly variantId: AtrialReservoirTractionVariantIdV1;
  readonly tractionGainMmHgPerNormPerSec: number;
};

type ForcingProfileV1 = {
  readonly profileId: AtrialReservoirTractionProfileIdV1;
  readonly hrBpm: number;
  readonly venousScale: number;
  readonly avPlaneScale: number;
  readonly boosterScale: number;
  readonly passiveStiffnessScale: number;
};

type LobeQualityV1 = {
  readonly lobeQualityPass: boolean;
  readonly selfIntersections: number;
  readonly aLoopArea: number;
  readonly vLoopArea: number;
  readonly signedALoopArea: number;
  readonly signedVLoopArea: number;
  readonly opposedSignedLobes: boolean;
  readonly volumeSeparationMl: number;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: AtrialReservoirTractionProfileIdV1;
  readonly variantId: AtrialReservoirTractionVariantIdV1;
  readonly lobeQuality: LobeQualityV1;
  readonly maxTractionPressureAbsMmHg: number;
  readonly maxZAvNorm: number;
  readonly maxZAvDotNormPerSec: number;
  readonly venousInflowVolumeMl: number;
  readonly mvOutflowVolumeMl: number;
  readonly cycleVolumeDriftMl: number;
  readonly pressureMinMmHg: number;
  readonly pressureMaxMmHg: number;
  readonly hiddenBloodVolumeSourceMl: 0;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type AtrialReservoirTractionForcingSeriesV1 = {
  readonly theta: readonly number[];
  readonly volumeMl: readonly number[];
  readonly pressureMmHg: readonly number[];
  readonly tractionPressureMmHg: readonly number[];
  readonly zAvNorm: readonly number[];
  readonly zAvDotNormPerSec: readonly number[];
};

type VariantSummaryV1 = {
  readonly variantId: AtrialReservoirTractionVariantIdV1;
  readonly passCount: number;
  readonly opposedLobeCount: number;
  readonly maxTractionPressureAbsMmHg: number;
  readonly maxZAvDotNormPerSec: number;
};

export type AtrialReservoirTractionForcingReportV1 = {
  readonly reportId: typeof ATRIAL_RESERVOIR_TRACTION_FORCING_REPORT_ID_V1;
  readonly gateId: "atrialReservoirTractionForcingV1";
  readonly mode: "isolated-prescribed-flow-avplane-rate-gated-traction-no-runtime";
  readonly variants: readonly TractionVariantV1[];
  readonly profiles: readonly ForcingProfileV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: AtrialReservoirTractionVariantIdV1;
    readonly bestPassCount: number;
    readonly bestOpposedLobeCount: number;
    readonly baselinePassCount: number;
    readonly passImprovementOverBaseline: number;
  };
  readonly decision: {
    readonly atrialReservoirTractionForcingStatus:
      | "rate-gated-traction-topology-signal"
      | "rate-gated-traction-mixed"
      | "rate-gated-traction-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly closedLoopClaim: false;
    readonly morphologyAcceptance: false;
    readonly pressureSubstitution: false;
    readonly hiddenBloodVolumeSource: false;
    readonly AVPlaneEnablement: false;
    readonly LandAtrialUnlock: false;
  };
};

const PRE_A_THETA = 0.74;
const SAMPLE_RATE_HZ = 500;

const PROFILES: readonly ForcingProfileV1[] = [
  profile("normal-hr75", 75, 1.0, 1.0, 1.0, 1.0),
  profile("normal-hr90", 90, 1.0, 1.0, 1.0, 1.0),
  profile("venous-low", 75, 0.72, 1.0, 1.0, 1.0),
  profile("venous-high", 75, 1.28, 1.0, 1.0, 1.0),
  profile("avplane-low", 75, 1.0, 0.65, 1.0, 1.0),
  profile("booster-high", 75, 1.0, 1.0, 1.35, 1.0),
  profile("stiff-atrial-wall", 75, 1.0, 1.0, 1.0, 1.45),
];

const VARIANTS: readonly TractionVariantV1[] = [
  variant("no-traction", 0),
  variant("descent-traction-gain04", 0.4),
  variant("descent-traction-gain08", 0.8),
  variant("descent-traction-gain12", 1.2),
  variant("descent-traction-gain16", 1.6),
  variant("descent-traction-negative-gain08", -0.8),
];

export function runAtrialReservoirTractionForcingBenchV1(): AtrialReservoirTractionForcingReportV1 {
  const rows = PROFILES.flatMap((profileConfig) =>
    VARIANTS.map((variantConfig) => rowFor(profileConfig, variantConfig))
  );
  const variantSummaries = VARIANTS.map((variantConfig) => {
    const variantRows = rows.filter((row) => row.variantId === variantConfig.variantId);
    return {
      variantId: variantConfig.variantId,
      passCount: variantRows.filter((row) => row.status === "pass").length,
      opposedLobeCount: variantRows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
      maxTractionPressureAbsMmHg: round(Math.max(0, ...variantRows.map((row) => row.maxTractionPressureAbsMmHg))),
      maxZAvDotNormPerSec: round(Math.max(0, ...variantRows.map((row) => row.maxZAvDotNormPerSec))),
    };
  });
  const baseline = variantSummaries.find((summary) => summary.variantId === "no-traction")!;
  const bestVariant = [...variantSummaries].sort((a, b) =>
    b.passCount - a.passCount
    || b.opposedLobeCount - a.opposedLobeCount
    || a.maxTractionPressureAbsMmHg - b.maxTractionPressureAbsMmHg
  )[0]!;
  const status = bestVariant.passCount >= 6
    ? "rate-gated-traction-topology-signal"
    : bestVariant.opposedLobeCount > baseline.opposedLobeCount
      ? "rate-gated-traction-mixed"
      : "rate-gated-traction-blocked";
  return {
    reportId: ATRIAL_RESERVOIR_TRACTION_FORCING_REPORT_ID_V1,
    gateId: "atrialReservoirTractionForcingV1",
    mode: "isolated-prescribed-flow-avplane-rate-gated-traction-no-runtime",
    variants: VARIANTS,
    profiles: PROFILES,
    rows,
    variantSummaries,
    bestVariant,
    summary: {
      totalProfiles: 7,
      bestVariantId: bestVariant.variantId,
      bestPassCount: bestVariant.passCount,
      bestOpposedLobeCount: bestVariant.opposedLobeCount,
      baselinePassCount: baseline.passCount,
      passImprovementOverBaseline: bestVariant.passCount - baseline.passCount,
    },
    decision: {
      atrialReservoirTractionForcingStatus: status,
      nextAction: status === "rate-gated-traction-topology-signal"
        ? "Promote rate-gated AV-plane traction to the next closed-loop same-step atrial chamber experiment; keep runtime and morphology claims blocked."
        : status === "rate-gated-traction-mixed"
          ? "Use the isolated topology signal only to design a narrower closed-loop falsification; do not tune scalar reservoir gains."
          : "Do not promote rate-gated traction; reassess the atrial reservoir topology mechanism before closed-loop work.",
      blockedClaims: [
        "runtime-wiring",
        "closed-loop-success",
        "morphology-acceptance",
        "atrial-pressure-substitution",
        "hidden-blood-volume-source",
        "AV-plane-enable",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      closedLoopClaim: false,
      morphologyAcceptance: false,
      pressureSubstitution: false,
      hiddenBloodVolumeSource: false,
      AVPlaneEnablement: false,
      LandAtrialUnlock: false,
    },
  };
}

export function runAtrialReservoirTractionForcingSeriesV1(
  profileId: AtrialReservoirTractionProfileIdV1,
  variantId: AtrialReservoirTractionVariantIdV1,
): AtrialReservoirTractionForcingSeriesV1 {
  const profileConfig = PROFILES.find((candidate) => candidate.profileId === profileId);
  const variantConfig = VARIANTS.find((candidate) => candidate.variantId === variantId);
  if (!profileConfig) throw new Error(`Unknown profile: ${profileId}`);
  if (!variantConfig) throw new Error(`Unknown variant: ${variantId}`);
  return simulate(profileConfig, variantConfig);
}


function rowFor(profileConfig: ForcingProfileV1, variantConfig: TractionVariantV1): RowV1 {
  const series = simulate(profileConfig, variantConfig);
  const lobeQuality = lobeQualityFor(series.volumeMl, series.pressureMmHg, series.theta);
  const pressureMinMmHg = Math.min(...series.pressureMmHg);
  const pressureMaxMmHg = Math.max(...series.pressureMmHg);
  const failureReasons = [
    ...(lobeQuality.lobeQualityPass ? [] : ["lobe-quality-fail"]),
    ...(Math.abs(series.cycleVolumeDriftMl) <= 0.08 ? [] : ["cycle-volume-drift"]),
    ...(pressureMinMmHg >= 0 ? [] : ["negative-pressure"]),
    ...(pressureMaxMmHg <= 26 ? [] : ["pressure-too-high"]),
  ];
  return {
    profileId: profileConfig.profileId,
    variantId: variantConfig.variantId,
    lobeQuality,
    maxTractionPressureAbsMmHg: round(maxAbs(series.tractionPressureMmHg)),
    maxZAvNorm: round(Math.max(0, ...series.zAvNorm)),
    maxZAvDotNormPerSec: round(maxAbs(series.zAvDotNormPerSec)),
    venousInflowVolumeMl: round(series.venousInflowVolumeMl),
    mvOutflowVolumeMl: round(series.mvOutflowVolumeMl),
    cycleVolumeDriftMl: round(series.cycleVolumeDriftMl),
    pressureMinMmHg: round(pressureMinMmHg),
    pressureMaxMmHg: round(pressureMaxMmHg),
    hiddenBloodVolumeSourceMl: 0,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function simulate(profileConfig: ForcingProfileV1, variantConfig: TractionVariantV1): {
  readonly theta: readonly number[];
  readonly volumeMl: readonly number[];
  readonly pressureMmHg: readonly number[];
  readonly tractionPressureMmHg: readonly number[];
  readonly zAvNorm: readonly number[];
  readonly zAvDotNormPerSec: readonly number[];
  readonly venousInflowVolumeMl: number;
  readonly mvOutflowVolumeMl: number;
  readonly cycleVolumeDriftMl: number;
} {
  const cycleLengthSec = 60 / profileConfig.hrBpm;
  const dtSec = 1 / SAMPLE_RATE_HZ;
  const n = Math.round(cycleLengthSec * SAMPLE_RATE_HZ);
  const theta = Array.from({ length: n }, (_, i) => i / n);
  const zAv = theta.map((value) => zAvFor(value, profileConfig));
  const zAvDot = zAv.map((value, i) => i === 0 ? 0 : (value - zAv[i - 1]!) / dtSec);
  const qMvRaw = theta.map((value) => mvOutflowFor(value, profileConfig));
  const qVenousRaw = theta.map((value) => venousInflowFor(value, profileConfig));
  const qMvVolume = integratePositive(qMvRaw, dtSec);
  const qVenousVolume = integratePositive(qVenousRaw, dtSec);
  const venousScaleToCloseCycle = qMvVolume / Math.max(qVenousVolume, 1e-9);
  const qVenous = qVenousRaw.map((value) => value * venousScaleToCloseCycle);
  const volumes: number[] = [];
  const pressures: number[] = [];
  const tractions: number[] = [];
  let volumeMl = 48;
  let previousVolumeMl = volumeMl;
  let fiberState: AtrialFiberChamberStateV1 = initialAtrialFiberChamberStateV1(
    volumeMl,
    scaledAtrialParams(profileConfig),
  );
  for (let i = 0; i < n; i++) {
    const value = theta[i]!;
    const qMv = qMvRaw[i]!;
    const qVen = qVenous[i]!;
    volumeMl += (qVen - qMv) * dtSec;
    const chamber = stepAtrialFiberChamberV1(fiberState, {
      tSec: value * cycleLengthSec,
      dtSec,
      cycleLengthSec,
      activationTimeSec: 0.82 * cycleLengthSec,
      cavityVolumeMl: volumeMl,
      previousCavityVolumeMl: previousVolumeMl,
    }, scaledAtrialParams(profileConfig));
    fiberState = chamber.state;
    const traction = isReservoirClosedWindow(value)
      ? variantConfig.tractionGainMmHgPerNormPerSec * zAvDot[i]!
      : 0;
    volumes.push(volumeMl);
    pressures.push(Math.max(0, chamber.pressureRawMmHg + traction));
    tractions.push(traction);
    previousVolumeMl = volumeMl;
  }
  return {
    theta,
    volumeMl: volumes,
    pressureMmHg: pressures,
    tractionPressureMmHg: tractions,
    zAvNorm: zAv,
    zAvDotNormPerSec: zAvDot,
    venousInflowVolumeMl: integratePositive(qVenous, dtSec),
    mvOutflowVolumeMl: qMvVolume,
    cycleVolumeDriftMl: volumes[volumes.length - 1]! - volumes[0]!,
  };
}

function scaledAtrialParams(profileConfig: ForcingProfileV1) {
  return {
    ...DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA,
    fiber: {
      ...DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA.fiber,
      trefPa: DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA.fiber.trefPa * profileConfig.boosterScale,
      passiveStiffnessPa:
        DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA.fiber.passiveStiffnessPa * profileConfig.passiveStiffnessScale,
    },
  };
}

function venousInflowFor(theta: number, profileConfig: ForcingProfileV1): number {
  return profileConfig.venousScale * (
    36
    + 32 * raisedCosineWindow(theta, 0.08, 0.50)
    + 10 * raisedCosineWindow(theta, 0.56, 0.82)
  );
}

function mvOutflowFor(theta: number, profileConfig: ForcingProfileV1): number {
  return (
    128 * gaussianCircular(theta, 0.53, 0.08)
    + 82 * profileConfig.boosterScale * gaussianCircular(theta, 0.91, 0.045)
  );
}

function zAvFor(theta: number, profileConfig: ForcingProfileV1): number {
  const value = theta < 0.06
    ? 0
    : theta < 0.36
      ? smoothstep01((theta - 0.06) / 0.30)
      : theta < 0.43
        ? 1
        : theta < 0.65
          ? 1 - smoothstep01((theta - 0.43) / 0.22)
          : 0;
  return profileConfig.avPlaneScale * Math.max(0, Math.min(1, value));
}

function isReservoirClosedWindow(theta: number): boolean {
  return theta >= 0.06 && theta <= 0.42;
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
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const failureReasons: string[] = [];
  if (selfIntersections < 1) failureReasons.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failureReasons.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failureReasons.push("v-loop-area-too-small");
  if (!opposedSignedLobes) failureReasons.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failureReasons.push("v-loop-not-higher-volume-than-a-loop");
  return {
    lobeQualityPass: failureReasons.length === 0,
    selfIntersections,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    signedALoopArea: round(signedALoop),
    signedVLoopArea: round(signedVLoop),
    opposedSignedLobes,
    volumeSeparationMl: round(volumeSeparation),
    failureReasons,
  };
}

function countSelfIntersections(x: readonly number[], y: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < x.length - 1; i++) {
    for (let j = i + 2; j < x.length - 1; j++) {
      if (Math.abs(i - j) <= 1) continue;
      if (segmentsIntersect(x[i]!, y[i]!, x[i + 1]!, y[i + 1]!, x[j]!, y[j]!, x[j + 1]!, y[j + 1]!)) {
        count++;
      }
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
  const denominator = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(denominator) < 1e-12) return false;
  const ua = ((dx - cx) * (ay - cy) - (dy - cy) * (ax - cx)) / denominator;
  const ub = ((bx - ax) * (ay - cy) - (by - ay) * (ax - cx)) / denominator;
  return ua > 1e-6 && ua < 1 - 1e-6 && ub > 1e-6 && ub < 1 - 1e-6;
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

function signedPolygonArea(x: readonly number[], y: readonly number[]): number {
  if (x.length < 3 || y.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < x.length; i++) {
    const j = (i + 1) % x.length;
    area += x[i]! * y[j]! - x[j]! * y[i]!;
  }
  return 0.5 * area;
}

function integratePositive(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, value) => sum + Math.max(0, value) * dtSec, 0);
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  const value = positiveModulo(theta, 1);
  const inWindow = start <= end ? value >= start && value <= end : value >= start || value <= end;
  if (!inWindow) return 0;
  const width = positiveModulo(end - start, 1) || 1;
  const phase = positiveModulo(value - start, 1) / width;
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
}

function gaussianCircular(theta: number, center: number, width: number): number {
  const distance = Math.min(
    Math.abs(theta - center),
    Math.abs(theta - center + 1),
    Math.abs(theta - center - 1),
  );
  return Math.exp(-0.5 * (distance / Math.max(width, 1e-6)) ** 2);
}

function smoothstep01(value: number): number {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}

function profile(
  profileId: AtrialReservoirTractionProfileIdV1,
  hrBpm: number,
  venousScale: number,
  avPlaneScale: number,
  boosterScale: number,
  passiveStiffnessScale: number,
): ForcingProfileV1 {
  return { profileId, hrBpm, venousScale, avPlaneScale, boosterScale, passiveStiffnessScale };
}

function variant(
  variantId: AtrialReservoirTractionVariantIdV1,
  tractionGainMmHgPerNormPerSec: number,
): TractionVariantV1 {
  return { variantId, tractionGainMmHgPerNormPerSec };
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
