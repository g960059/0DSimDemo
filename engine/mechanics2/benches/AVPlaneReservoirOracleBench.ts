import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemRunV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const AV_PLANE_RESERVOIR_ORACLE_REPORT_ID_V1 =
  "av-plane-reservoir-oracle-report-v1" as const;

type VariantIdV1 =
  | "fiber-pressure-no-lobe-state"
  | "phase-reference-r12-b0-p1"
  | "flow-reference-r12-b0-p1"
  | "avplane-eject40-r12-b0-p1"
  | "avplane-eject60-r12-b0-p1"
  | "avplane-eject80-r12-b0-p1"
  | "avplane-wide-eject60-r12-b0-p1"
  | "avplane-eject60-r16-b0-p1"
  | "avplane-eject60-r12-b4-p1";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly reservoirPressureGainMmHg: number;
  readonly boosterPressureGainMmHg: number;
  readonly reservoirGeometryGainMl: number;
  readonly boosterGeometryGainMl: number;
  readonly reservoirDriveMode: "phase" | "flow" | "av-plane";
  readonly reservoirFillingRateStartMlPerSec: number;
  readonly reservoirFillingRateEndMlPerSec: number;
  readonly avPlaneEjectionRateStartMlPerSec: number;
  readonly avPlaneEjectionRateEndMlPerSec: number;
  readonly boosterStartTheta: number;
  readonly boosterEndTheta: number;
  readonly reservoirStartTheta: number;
  readonly reservoirEndTheta: number;
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

type DominantLobeFailureClassV1 =
  | "pass"
  | "missing-self-intersection"
  | "same-signed-lobes"
  | "small-a-loop"
  | "small-v-loop"
  | "volume-order-fail";

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: VariantIdV1;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly maxReservoirDrive01: number;
  readonly minReservoirPressureMmHg: number;
  readonly maxReservoirGeometryDeltaMl: number;
  readonly maxBoosterDrive01: number;
  readonly maxBoosterPressureMmHg: number;
  readonly maxBoosterGeometryDeltaMl: number;
  readonly maxNetGeometryDeltaAbsMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly aPrimeReadbackPresent: boolean;
  readonly maxAPrimePeakAbsCmPerSec: number;
  readonly maxSPrimePeakAbsCmPerSec: number;
  readonly lobeQuality: LobeQualityV1;
  readonly dominantLobeFailureClass: DominantLobeFailureClassV1;
  readonly sourceSurfaceStatus: "pass" | "fail";
  readonly contractStatus: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly sourceSurfacePass: number;
  readonly contractPass: number;
  readonly laPvLobeQualityPass: number;
  readonly mvfCleanCount: number;
  readonly mvForwardVolumeParityCount: number;
  readonly aovOutputParityCount: number;
  readonly hiddenVolumeCleanCount: number;
  readonly aPrimeReadbackPresentCount: number;
  readonly maxAPrimePeakAbsCmPerSec: number;
  readonly maxSPrimePeakAbsCmPerSec: number;
  readonly selfIntersectionCount: number;
  readonly opposedLobeCount: number;
  readonly maxReservoirDrive01: number;
  readonly minReservoirPressureMmHg: number;
  readonly maxReservoirGeometryDeltaMl: number;
  readonly maxBoosterDrive01: number;
  readonly maxBoosterPressureMmHg: number;
  readonly maxBoosterGeometryDeltaMl: number;
  readonly maxNetGeometryDeltaAbsMl: number;
  readonly maxALoopArea: number;
  readonly maxVLoopArea: number;
  readonly maxVolumeSeparationMl: number;
};

export type AVPlaneReservoirOracleReportV1 = {
  readonly reportId: typeof AV_PLANE_RESERVOIR_ORACLE_REPORT_ID_V1;
  readonly gateId: "avPlaneReservoirOracleV1";
  readonly mode: "left-heart-av-plane-reservoir-oracle-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: VariantIdV1;
    readonly bestSourceSurfacePass: number;
    readonly bestContractPass: number;
    readonly bestLaPvLobeQualityPass: number;
    readonly bestMvfCleanCount: number;
    readonly bestOpposedLobeCount: number;
    readonly maxSourceSurfacePass: number;
    readonly maxSourceSurfaceVariantId: VariantIdV1;
    readonly maxLobeQualityPass: number;
    readonly maxLobeQualityVariantId: VariantIdV1;
    readonly dominantLobeFailureCounts: Record<DominantLobeFailureClassV1, number>;
  };
  readonly decision: {
    readonly avPlaneReservoirOracleStatus:
      | "av-plane-reservoir-oracle-signal"
      | "av-plane-reservoir-oracle-mixed"
      | "av-plane-reservoir-oracle-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly pressureSubstitution: false;
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
  { variantId: "fiber-pressure-no-lobe-state", reservoirPressureGainMmHg: 0, boosterPressureGainMmHg: 0, reservoirGeometryGainMl: 0, boosterGeometryGainMl: 0, reservoirDriveMode: "phase", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 20, avPlaneEjectionRateEndMlPerSec: 80, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.08, reservoirEndTheta: 0.70 },
  { variantId: "phase-reference-r12-b0-p1", reservoirPressureGainMmHg: 1, boosterPressureGainMmHg: 1, reservoirGeometryGainMl: 12, boosterGeometryGainMl: 0, reservoirDriveMode: "phase", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 20, avPlaneEjectionRateEndMlPerSec: 80, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.08, reservoirEndTheta: 0.70 },
  { variantId: "flow-reference-r12-b0-p1", reservoirPressureGainMmHg: 1, boosterPressureGainMmHg: 1, reservoirGeometryGainMl: 12, boosterGeometryGainMl: 0, reservoirDriveMode: "flow", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 20, avPlaneEjectionRateEndMlPerSec: 80, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.08, reservoirEndTheta: 0.70 },
  { variantId: "avplane-eject40-r12-b0-p1", reservoirPressureGainMmHg: 1, boosterPressureGainMmHg: 1, reservoirGeometryGainMl: 12, boosterGeometryGainMl: 0, reservoirDriveMode: "av-plane", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 12, avPlaneEjectionRateEndMlPerSec: 40, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.06, reservoirEndTheta: 0.58 },
  { variantId: "avplane-eject60-r12-b0-p1", reservoirPressureGainMmHg: 1, boosterPressureGainMmHg: 1, reservoirGeometryGainMl: 12, boosterGeometryGainMl: 0, reservoirDriveMode: "av-plane", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 18, avPlaneEjectionRateEndMlPerSec: 60, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.06, reservoirEndTheta: 0.58 },
  { variantId: "avplane-eject80-r12-b0-p1", reservoirPressureGainMmHg: 1, boosterPressureGainMmHg: 1, reservoirGeometryGainMl: 12, boosterGeometryGainMl: 0, reservoirDriveMode: "av-plane", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 25, avPlaneEjectionRateEndMlPerSec: 80, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.06, reservoirEndTheta: 0.58 },
  { variantId: "avplane-wide-eject60-r12-b0-p1", reservoirPressureGainMmHg: 1, boosterPressureGainMmHg: 1, reservoirGeometryGainMl: 12, boosterGeometryGainMl: 0, reservoirDriveMode: "av-plane", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 18, avPlaneEjectionRateEndMlPerSec: 60, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.02, reservoirEndTheta: 0.70 },
  { variantId: "avplane-eject60-r16-b0-p1", reservoirPressureGainMmHg: 1, boosterPressureGainMmHg: 1, reservoirGeometryGainMl: 16, boosterGeometryGainMl: 0, reservoirDriveMode: "av-plane", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 18, avPlaneEjectionRateEndMlPerSec: 60, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.06, reservoirEndTheta: 0.58 },
  { variantId: "avplane-eject60-r12-b4-p1", reservoirPressureGainMmHg: 1, boosterPressureGainMmHg: 1, reservoirGeometryGainMl: 12, boosterGeometryGainMl: 4, reservoirDriveMode: "av-plane", reservoirFillingRateStartMlPerSec: 6, reservoirFillingRateEndMlPerSec: 70, avPlaneEjectionRateStartMlPerSec: 18, avPlaneEjectionRateEndMlPerSec: 60, boosterStartTheta: 0.76, boosterEndTheta: 0.98, reservoirStartTheta: 0.06, reservoirEndTheta: 0.58 },
];

export function runAVPlaneReservoirOracleBenchV1():
AVPlaneReservoirOracleReportV1 {
  const baselineParamsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineRuns = baselineParamsByProfile.map((params) => runLeftHeartSubsystemV2({
    ...params,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
  }));
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baselineParams = baselineParamsByProfile[index]!;
    const baselineRun = baselineRuns[index]!;
    return VARIANTS.map((variant) => {
      const run = variant.variantId === "fiber-pressure-no-lobe-state"
        ? baselineRun
        : runLeftHeartSubsystemV2(applyVariant(baselineParams, variant));
      return rowForRun(profileId, baselineParams.fixtureId, variant, baselineRun, run);
    });
  });
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(
    variant.variantId,
    rows.filter((row) => row.variantId === variant.variantId),
  ));
  const bestVariant = [...variantSummaries].sort(compareSummaries)[0]!;
  const sourceSurfaceBest = [...variantSummaries].sort((a, b) =>
    b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfCleanCount - a.mvfCleanCount
    || b.laPvLobeQualityPass - a.laPvLobeQualityPass
  )[0]!;
  const lobeBest = [...variantSummaries].sort((a, b) =>
    b.laPvLobeQualityPass - a.laPvLobeQualityPass
    || b.opposedLobeCount - a.opposedLobeCount
    || b.sourceSurfacePass - a.sourceSurfacePass
  )[0]!;
  const status = bestVariant.contractPass === PROFILE_IDS.length
    ? "av-plane-reservoir-oracle-signal"
    : lobeBest.laPvLobeQualityPass > 2 || sourceSurfaceBest.sourceSurfacePass >= 5
      ? "av-plane-reservoir-oracle-mixed"
      : "av-plane-reservoir-oracle-blocked";
  return {
    reportId: AV_PLANE_RESERVOIR_ORACLE_REPORT_ID_V1,
    gateId: "avPlaneReservoirOracleV1",
    mode: "left-heart-av-plane-reservoir-oracle-no-runtime",
    variants: VARIANTS,
    rows,
    variantSummaries,
    bestVariant,
    summary: {
      totalProfiles: 7,
      bestVariantId: bestVariant.variantId,
      bestSourceSurfacePass: bestVariant.sourceSurfacePass,
      bestContractPass: bestVariant.contractPass,
      bestLaPvLobeQualityPass: bestVariant.laPvLobeQualityPass,
      bestMvfCleanCount: bestVariant.mvfCleanCount,
      bestOpposedLobeCount: bestVariant.opposedLobeCount,
      maxSourceSurfacePass: sourceSurfaceBest.sourceSurfacePass,
      maxSourceSurfaceVariantId: sourceSurfaceBest.variantId,
      maxLobeQualityPass: lobeBest.laPvLobeQualityPass,
      maxLobeQualityVariantId: lobeBest.variantId,
      dominantLobeFailureCounts: countDominantLobeFailures(rows),
    },
    decision: {
      avPlaneReservoirOracleStatus: status,
      nextAction: status === "av-plane-reservoir-oracle-signal"
        ? "Proceed only to source-aware four-chamber review. Runtime and physiology claims remain blocked."
        : status === "av-plane-reservoir-oracle-mixed"
          ? "Treat ejection-rate AV-plane reservoir drive as insufficient; next owner is pressure-volume orientation and MV/AV-plane phase co-evolution, not runtime AV-plane enablement."
          : "Keep atrial promotion blocked; AV-plane reservoir drive did not recover enough lobe quality or source-surface morphology.",
      blockedClaims: [
        "runtime-wiring",
        "atrial-pressure-substitution",
        "morphology-acceptance",
        "AV-plane-enable",
        "a-prime-physiology",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      pressureSubstitution: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimePhysiologyClaim: false,
      LandAtrialUnlock: false,
    },
  };
}

function applyVariant(params: LeftHeartSubsystemParamsV2, variant: VariantV1): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
    laLobeGeneratorMode:
      variant.reservoirGeometryGainMl > 0
      || variant.boosterGeometryGainMl > 0
      || variant.reservoirPressureGainMmHg > 0
      || variant.boosterPressureGainMmHg > 0
      ? variant.reservoirDriveMode === "flow"
        ? "flow-reservoir-booster-state-shadow"
        : variant.reservoirDriveMode === "av-plane"
          ? "av-plane-reservoir-booster-state-shadow"
        : "reservoir-booster-state-shadow"
      : "none",
    laReservoirSuctionPressureGainMmHg: variant.reservoirPressureGainMmHg,
    laReservoirSuctionStartTheta: variant.reservoirStartTheta,
    laReservoirSuctionEndTheta: variant.reservoirEndTheta,
    laReservoirFillingRateStartMlPerSec: variant.reservoirFillingRateStartMlPerSec,
    laReservoirFillingRateEndMlPerSec: variant.reservoirFillingRateEndMlPerSec,
    laAVPlaneEjectionRateStartMlPerSec: variant.avPlaneEjectionRateStartMlPerSec,
    laAVPlaneEjectionRateEndMlPerSec: variant.avPlaneEjectionRateEndMlPerSec,
    laBoosterPressureGainMmHg: variant.boosterPressureGainMmHg,
    laBoosterPressureStartTheta: variant.boosterStartTheta,
    laBoosterPressureEndTheta: variant.boosterEndTheta,
    laEffectiveGeometryMode: variant.reservoirGeometryGainMl > 0 || variant.boosterGeometryGainMl > 0
      ? variant.reservoirDriveMode === "av-plane"
        ? "av-plane-reservoir-capacity-volume-shadow"
        : "lobe-state-capacity-volume-shadow"
      : "none",
    laEffectiveGeometryGainMl: 0,
    laReservoirGeometryGainMl: variant.reservoirGeometryGainMl,
    laBoosterGeometryGainMl: variant.boosterGeometryGainMl,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  variant: VariantV1,
  baseline: LeftHeartSubsystemRunV2,
  run: LeftHeartSubsystemRunV2,
): RowV1 {
  const baselineBeat = baseline.finalBeatSamples;
  const beat = run.finalBeatSamples;
  const dtSec = 1 / Math.max(beat.length, 1);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const baselineQmv = baselineBeat.map((sample) => sample.qMvMlPerSec);
  const baselineAov = baselineBeat.map((sample) => sample.qAovMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const lobeQuality = lobeQualityFor(beat);
  const base = {
    profileId,
    sourcePointId,
    variantId: variant.variantId,
    mvForwardPeakCount: positivePeakCount(qMv),
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio: round(forwardFlowVolume(qMv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, dtSec), 1e-9)),
    aovForwardVolumeRatio: round(forwardFlowVolume(qAov, dtSec) / Math.max(forwardFlowVolume(baselineAov, dtSec), 1e-9)),
    maxMassResidualAbsMl: round(maxAbs(beat.map((sample) => sample.massResidualMl))),
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
    maxReservoirDrive01: round(Math.max(0, ...beat.map((sample) => sample.laReservoirSuctionDrive01))),
    minReservoirPressureMmHg: round(Math.min(0, ...beat.map((sample) => sample.laReservoirSuctionPressureMmHg))),
    maxReservoirGeometryDeltaMl: round(Math.max(0, ...beat.map((sample) => sample.laReservoirGeometryDeltaMl))),
    maxBoosterDrive01: round(Math.max(0, ...beat.map((sample) => sample.laBoosterPressureDrive01))),
    maxBoosterPressureMmHg: round(Math.max(0, ...beat.map((sample) => sample.laBoosterPressureMmHg))),
    maxBoosterGeometryDeltaMl: round(Math.max(0, ...beat.map((sample) => sample.laBoosterGeometryDeltaMl))),
    maxNetGeometryDeltaAbsMl: round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryDeltaMl))),
    maxHiddenBloodVolumeSourceMl: round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl))),
    aPrimeReadbackPresent: beat.some((sample) => sample.laAPrimeProxyCmPerSec != null),
    maxAPrimePeakAbsCmPerSec: round(maxAbs(beat.map((sample) => sample.laAPrimeProxyCmPerSec ?? 0))),
    maxSPrimePeakAbsCmPerSec: round(maxAbs(beat.map((sample) =>
      sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec ?? 0
    ))),
    lobeQuality,
    dominantLobeFailureClass: dominantLobeFailureClass(lobeQuality),
  };
  const sourceFailures = sourceSurfaceFailureReasons(base);
  const contractFailures = [
    ...sourceFailures,
    ...(base.lobeQuality.lobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
    ...(base.maxHiddenBloodVolumeSourceMl === 0 ? [] : ["hidden-blood-volume-source"]),
  ];
  return {
    ...base,
    sourceSurfaceStatus: sourceFailures.length === 0 ? "pass" : "fail",
    contractStatus: contractFailures.length === 0 ? "pass" : "fail",
    failureReasons: contractFailures,
  };
}

function sourceSurfaceFailureReasons(
  row: Omit<RowV1, "sourceSurfaceStatus" | "contractStatus" | "failureReasons">,
): readonly string[] {
  const failures: string[] = [];
  if (row.mvForwardPeakCount !== 2) failures.push("mvf-not-biphasic");
  if (row.mvC1ContinuityScore > 0.42) failures.push("mvf-c1-kink");
  if (row.mvForwardVolumeRatio < 0.78 || row.mvForwardVolumeRatio > 1.22) failures.push("mv-forward-volume-ratio-wide");
  if (row.aovForwardVolumeRatio < 0.80 || row.aovForwardVolumeRatio > 1.20) failures.push("aov-output-ratio-wide");
  if (row.maxMassResidualAbsMl > 0.08) failures.push("mass-residual-wide");
  if (row.clampCount > row.baselineClampCount) failures.push("new-clamp-hit");
  return failures;
}

function dominantLobeFailureClass(quality: LobeQualityV1): DominantLobeFailureClassV1 {
  if (quality.lobeQualityPass) return "pass";
  if (quality.failureReasons.includes("missing-pv-self-intersection")) return "missing-self-intersection";
  if (quality.failureReasons.includes("a-v-lobes-not-opposed")) return "same-signed-lobes";
  if (quality.failureReasons.includes("a-loop-area-too-small")) return "small-a-loop";
  if (quality.failureReasons.includes("v-loop-area-too-small")) return "small-v-loop";
  return "volume-order-fail";
}

function countDominantLobeFailures(rows: readonly RowV1[]): Record<DominantLobeFailureClassV1, number> {
  const counts: Record<DominantLobeFailureClassV1, number> = {
    pass: 0,
    "missing-self-intersection": 0,
    "same-signed-lobes": 0,
    "small-a-loop": 0,
    "small-v-loop": 0,
    "volume-order-fail": 0,
  };
  for (const row of rows) counts[row.dominantLobeFailureClass]++;
  return counts;
}

function lobeQualityFor(samples: readonly LeftHeartSubsystemSampleV2[]): LobeQualityV1 {
  const volumes = samples.map((sample) => sample.acceptedLaVolumeMl);
  const pressures = samples.map((sample) => sample.lapMmHg);
  const theta = samples.map((sample) => sample.theta);
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
  const failures: string[] = [];
  if (selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failures.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failures.push("v-loop-area-too-small");
  if (!opposedSignedLobes) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  return {
    lobeQualityPass: failures.length === 0,
    selfIntersections,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    signedALoopArea: round(signedALoop),
    signedVLoopArea: round(signedVLoop),
    opposedSignedLobes,
    volumeSeparationMl: round(volumeSeparation),
    failureReasons: failures,
  };
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    contractPass: rows.filter((row) => row.contractStatus === "pass").length,
    laPvLobeQualityPass: rows.filter((row) => row.lobeQuality.lobeQualityPass).length,
    mvfCleanCount: rows.filter((row) => row.mvForwardPeakCount === 2 && row.mvC1ContinuityScore <= 0.42).length,
    mvForwardVolumeParityCount: rows.filter((row) =>
      row.mvForwardVolumeRatio >= 0.78 && row.mvForwardVolumeRatio <= 1.22).length,
    aovOutputParityCount: rows.filter((row) =>
      row.aovForwardVolumeRatio >= 0.80 && row.aovForwardVolumeRatio <= 1.20).length,
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    aPrimeReadbackPresentCount: rows.filter((row) => row.aPrimeReadbackPresent).length,
    maxAPrimePeakAbsCmPerSec: round(Math.max(0, ...rows.map((row) => row.maxAPrimePeakAbsCmPerSec))),
    maxSPrimePeakAbsCmPerSec: round(Math.max(0, ...rows.map((row) => row.maxSPrimePeakAbsCmPerSec))),
    selfIntersectionCount: rows.filter((row) => row.lobeQuality.selfIntersections >= 1).length,
    opposedLobeCount: rows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
    maxReservoirDrive01: round(Math.max(0, ...rows.map((row) => row.maxReservoirDrive01))),
    minReservoirPressureMmHg: round(Math.min(0, ...rows.map((row) => row.minReservoirPressureMmHg))),
    maxReservoirGeometryDeltaMl: round(Math.max(0, ...rows.map((row) => row.maxReservoirGeometryDeltaMl))),
    maxBoosterDrive01: round(Math.max(0, ...rows.map((row) => row.maxBoosterDrive01))),
    maxBoosterPressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxBoosterPressureMmHg))),
    maxBoosterGeometryDeltaMl: round(Math.max(0, ...rows.map((row) => row.maxBoosterGeometryDeltaMl))),
    maxNetGeometryDeltaAbsMl: round(Math.max(0, ...rows.map((row) => row.maxNetGeometryDeltaAbsMl))),
    maxALoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.aLoopArea))),
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.vLoopArea))),
    maxVolumeSeparationMl: round(Math.max(0, ...rows.map((row) => row.lobeQuality.volumeSeparationMl))),
  };
}

function compareSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.contractPass - a.contractPass
    || b.laPvLobeQualityPass - a.laPvLobeQualityPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.opposedLobeCount - a.opposedLobeCount
    || b.mvfCleanCount - a.mvfCleanCount;
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
  const segments = closedSegments(x, y);
  let count = 0;
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (segmentsAreAdjacent(i, j, segments.length)) continue;
      const first = segments[i]!;
      const second = segments[j]!;
      if (segmentsIntersect(
        first.ax, first.ay, first.bx, first.by,
        second.ax, second.ay, second.bx, second.by,
      )) count++;
    }
  }
  return count;
}

function closedSegments(
  x: readonly number[],
  y: readonly number[],
): readonly {
  readonly ax: number;
  readonly ay: number;
  readonly bx: number;
  readonly by: number;
}[] {
  const segments: {
    readonly ax: number;
    readonly ay: number;
    readonly bx: number;
    readonly by: number;
  }[] = [];
  if (x.length < 2 || y.length < 2) return segments;
  for (let i = 0; i < x.length; i++) {
    const next = (i + 1) % x.length;
    segments.push({
      ax: x[i]!,
      ay: y[i]!,
      bx: x[next]!,
      by: y[next]!,
    });
  }
  return segments;
}

function segmentsAreAdjacent(first: number, second: number, total: number): boolean {
  if (Math.abs(first - second) <= 1) return true;
  return first === 0 && second === total - 1;
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

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
