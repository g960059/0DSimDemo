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

export const AV_PLANE_RESERVOIR_CAPACITY_TRANSACTION_REPORT_ID_V1 =
  "av-plane-reservoir-capacity-transaction-report-v1" as const;

export type AVPlaneReservoirCapacityTransactionVariantIdV1 =
  | "fiber-pressure-no-capacity-state"
  | "capacity-gain08-eject40-fast-release"
  | "capacity-gain12-eject40-fast-release"
  | "capacity-gain12-eject60-fast-release"
  | "capacity-gain16-eject60-fast-release"
  | "capacity-gain20-eject60-fast-release"
  | "capacity-gain16-eject80-fast-release"
  | "capacity-gain16-eject60-slow-release"
  | "capacity-gain16-wide-eject60-fast-release"
  | "stretch-gain08-eject40-fast-release"
  | "stretch-gain12-eject40-fast-release"
  | "stretch-gain12-eject60-fast-release"
  | "stretch-gain16-eject60-fast-release"
  | "stretch-gain20-eject60-fast-release"
  | "stretch-gain16-wide-eject60-fast-release"
  | "stretch-gain16-boost04-eject60-fast-release"
  | "stretch-gain16-boost08-eject60-fast-release"
  | "capacity-gain16-boost04-eject60-fast-release"
  | "capacity-gain16-boost08-eject60-fast-release"
  | "stretch-gain16-boost04-work1-eject60-fast-release"
  | "stretch-gain16-boost04-work2-eject60-fast-release"
  | "capacity-gain16-boost04-work1-eject60-fast-release"
  | "capacity-gain16-boost04-work2-eject60-fast-release";

export type AVPlaneReservoirCapacityTransactionVariantV1 = {
  readonly variantId: AVPlaneReservoirCapacityTransactionVariantIdV1;
  readonly reservoirCapacityGainMl: number;
  readonly boosterCompressionGainMl: number;
  readonly reservoirWorkPressureGainMmHg: number;
  readonly geometryEffect: "capacity" | "stretch";
  readonly ejectionRateStartMlPerSec: number;
  readonly ejectionRateEndMlPerSec: number;
  readonly reservoirStartTheta: number;
  readonly reservoirEndTheta: number;
  readonly riseTauSec: number;
  readonly fallTauSec: number;
  readonly releaseTauSec: number;
  readonly mvOpenReleaseThreshold01: number;
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
  readonly variantId: AVPlaneReservoirCapacityTransactionVariantIdV1;
  readonly sampleRateHz: number;
  readonly dtHalfSampleRateHz: number;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly maxCapacityState01: number;
  readonly maxCapacityGeometryDeltaMl: number;
  readonly maxVisibleLaVolumeDeltaMl: number;
  readonly maxNetGeometryDeltaAbsMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly aPrimeReadbackPresent: boolean;
  readonly maxAPrimePeakAbsCmPerSec: number;
  readonly maxSPrimePeakAbsCmPerSec: number;
  readonly lobeQuality: LobeQualityV1;
  readonly dominantLobeFailureClass: DominantLobeFailureClassV1;
  readonly dtHalf: {
    readonly sourceSurfaceStatus: "pass" | "fail";
    readonly lobeQualityPass: boolean;
    readonly contractStatus: "pass" | "fail";
    readonly mvForwardPeakCount: number;
    readonly mvC1ContinuityScore: number;
    readonly mvForwardVolumeRatio: number;
    readonly aovForwardVolumeRatio: number;
    readonly maxHiddenBloodVolumeSourceMl: number;
    readonly lobeQuality: LobeQualityV1;
    readonly failureReasons: readonly string[];
  };
  readonly sourceSurfaceStatus: "pass" | "fail";
  readonly contractStatus: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: AVPlaneReservoirCapacityTransactionVariantIdV1;
  readonly sourceSurfacePass: number;
  readonly contractPass: number;
  readonly laPvLobeQualityPass: number;
  readonly dtHalfSourceSurfacePass: number;
  readonly dtHalfContractPass: number;
  readonly dtHalfLobeQualityPass: number;
  readonly mvfCleanCount: number;
  readonly mvForwardVolumeParityCount: number;
  readonly aovOutputParityCount: number;
  readonly hiddenVolumeCleanCount: number;
  readonly aPrimeReadbackPresentCount: number;
  readonly opposedLobeCount: number;
  readonly dtHalfOpposedLobeCount: number;
  readonly maxAPrimePeakAbsCmPerSec: number;
  readonly maxSPrimePeakAbsCmPerSec: number;
  readonly maxCapacityState01: number;
  readonly maxCapacityGeometryDeltaMl: number;
  readonly maxVisibleLaVolumeDeltaMl: number;
  readonly maxNetGeometryDeltaAbsMl: number;
  readonly maxALoopArea: number;
  readonly maxVLoopArea: number;
  readonly maxVolumeSeparationMl: number;
};

export type AVPlaneReservoirCapacityTransactionReportV1 = {
  readonly reportId: typeof AV_PLANE_RESERVOIR_CAPACITY_TRANSACTION_REPORT_ID_V1;
  readonly gateId: "avPlaneReservoirCapacityTransactionV1";
  readonly mode: "left-heart-av-plane-reservoir-capacity-transaction-no-runtime";
  readonly variants: readonly AVPlaneReservoirCapacityTransactionVariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: AVPlaneReservoirCapacityTransactionVariantIdV1;
    readonly bestSourceSurfacePass: number;
    readonly bestContractPass: number;
    readonly bestLaPvLobeQualityPass: number;
    readonly bestDtHalfContractPass: number;
    readonly bestMvfCleanCount: number;
    readonly bestOpposedLobeCount: number;
    readonly baselineSourceSurfacePass: number;
    readonly sourceSurfaceImprovementOverBaseline: number;
    readonly maxSourceSurfacePass: number;
    readonly maxSourceSurfaceVariantId: AVPlaneReservoirCapacityTransactionVariantIdV1;
    readonly maxLobeQualityPass: number;
    readonly maxLobeQualityVariantId: AVPlaneReservoirCapacityTransactionVariantIdV1;
    readonly maxDtHalfContractPass: number;
    readonly maxDtHalfContractVariantId: AVPlaneReservoirCapacityTransactionVariantIdV1;
    readonly dominantLobeFailureCounts: Record<DominantLobeFailureClassV1, number>;
  };
  readonly decision: {
    readonly avPlaneReservoirCapacityTransactionStatus:
      | "av-plane-reservoir-capacity-transaction-signal"
      | "av-plane-reservoir-capacity-transaction-mixed"
      | "av-plane-reservoir-capacity-transaction-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly pressureSubstitution: false;
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

export const AV_PLANE_RESERVOIR_CAPACITY_TRANSACTION_VARIANTS_V1:
readonly AVPlaneReservoirCapacityTransactionVariantV1[] = [
  variant("fiber-pressure-no-capacity-state", 0, 0, 0, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("capacity-gain08-eject40-fast-release", 8, 0, 0, "capacity", 12, 40, 0.06, 0.58, 0.050, 0.30, 0.070, 0.20),
  variant("capacity-gain12-eject40-fast-release", 12, 0, 0, "capacity", 12, 40, 0.06, 0.58, 0.050, 0.30, 0.070, 0.20),
  variant("capacity-gain12-eject60-fast-release", 12, 0, 0, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("capacity-gain16-eject60-fast-release", 16, 0, 0, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("capacity-gain20-eject60-fast-release", 20, 0, 0, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("capacity-gain16-eject80-fast-release", 16, 0, 0, "capacity", 25, 80, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("capacity-gain16-eject60-slow-release", 16, 0, 0, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.35, 0.16, 0.20),
  variant("capacity-gain16-wide-eject60-fast-release", 16, 0, 0, "capacity", 18, 60, 0.02, 0.70, 0.055, 0.34, 0.075, 0.20),
  variant("stretch-gain08-eject40-fast-release", 8, 0, 0, "stretch", 12, 40, 0.06, 0.58, 0.050, 0.30, 0.070, 0.20),
  variant("stretch-gain12-eject40-fast-release", 12, 0, 0, "stretch", 12, 40, 0.06, 0.58, 0.050, 0.30, 0.070, 0.20),
  variant("stretch-gain12-eject60-fast-release", 12, 0, 0, "stretch", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("stretch-gain16-eject60-fast-release", 16, 0, 0, "stretch", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("stretch-gain20-eject60-fast-release", 20, 0, 0, "stretch", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("stretch-gain16-wide-eject60-fast-release", 16, 0, 0, "stretch", 18, 60, 0.02, 0.70, 0.055, 0.34, 0.075, 0.20),
  variant("stretch-gain16-boost04-eject60-fast-release", 16, 4, 0, "stretch", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("stretch-gain16-boost08-eject60-fast-release", 16, 8, 0, "stretch", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("capacity-gain16-boost04-eject60-fast-release", 16, 4, 0, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("capacity-gain16-boost08-eject60-fast-release", 16, 8, 0, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("stretch-gain16-boost04-work1-eject60-fast-release", 16, 4, 1, "stretch", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("stretch-gain16-boost04-work2-eject60-fast-release", 16, 4, 2, "stretch", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("capacity-gain16-boost04-work1-eject60-fast-release", 16, 4, 1, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
  variant("capacity-gain16-boost04-work2-eject60-fast-release", 16, 4, 2, "capacity", 18, 60, 0.06, 0.58, 0.055, 0.30, 0.075, 0.20),
];

export function runAVPlaneReservoirCapacityTransactionBenchV1():
AVPlaneReservoirCapacityTransactionReportV1 {
  const baselineParamsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineRuns = baselineParamsByProfile.map((params) => runLeftHeartSubsystemV2({
    ...params,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
  }));
  const baselineDtHalfRuns = baselineParamsByProfile.map((params) => runLeftHeartSubsystemV2({
    ...params,
    sampleRateHz: params.sampleRateHz * 2,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
  }));
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baselineParams = baselineParamsByProfile[index]!;
    const baselineRun = baselineRuns[index]!;
    const baselineDtHalfRun = baselineDtHalfRuns[index]!;
    return AV_PLANE_RESERVOIR_CAPACITY_TRANSACTION_VARIANTS_V1.map((variant) => {
      const params = applyAVPlaneReservoirCapacityTransactionVariantV1(baselineParams, variant);
      const run = variant.reservoirCapacityGainMl > 0
        ? runLeftHeartSubsystemV2(params)
        : baselineRun;
      const dtHalfRun = runLeftHeartSubsystemV2({
        ...params,
        sampleRateHz: params.sampleRateHz * 2,
      });
      return rowForRun(profileId, baselineParams.fixtureId, variant, baselineRun, baselineDtHalfRun, run, dtHalfRun);
    });
  });
  const variantSummaries = AV_PLANE_RESERVOIR_CAPACITY_TRANSACTION_VARIANTS_V1.map((variant) => summarizeVariant(
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
  const dtHalfBest = [...variantSummaries].sort((a, b) =>
    b.dtHalfContractPass - a.dtHalfContractPass
    || b.dtHalfLobeQualityPass - a.dtHalfLobeQualityPass
    || b.dtHalfSourceSurfacePass - a.dtHalfSourceSurfacePass
  )[0]!;
  const baselineSummary = variantSummaries.find((summary) =>
    summary.variantId === "fiber-pressure-no-capacity-state"
  )!;
  const sourceSurfaceImprovementOverBaseline =
    sourceSurfaceBest.sourceSurfacePass - baselineSummary.sourceSurfacePass;
  const status = bestVariant.contractPass === PROFILE_IDS.length && bestVariant.dtHalfContractPass === PROFILE_IDS.length
    ? "av-plane-reservoir-capacity-transaction-signal"
    : lobeBest.laPvLobeQualityPass > 2
      || lobeBest.opposedLobeCount > 2
      || sourceSurfaceImprovementOverBaseline > 0
      || sourceSurfaceBest.sourceSurfacePass >= 5
      ? "av-plane-reservoir-capacity-transaction-mixed"
      : "av-plane-reservoir-capacity-transaction-blocked";
  return {
    reportId: AV_PLANE_RESERVOIR_CAPACITY_TRANSACTION_REPORT_ID_V1,
    gateId: "avPlaneReservoirCapacityTransactionV1",
    mode: "left-heart-av-plane-reservoir-capacity-transaction-no-runtime",
    variants: AV_PLANE_RESERVOIR_CAPACITY_TRANSACTION_VARIANTS_V1,
    rows,
    variantSummaries,
    bestVariant,
    summary: {
      totalProfiles: 7,
      bestVariantId: bestVariant.variantId,
      bestSourceSurfacePass: bestVariant.sourceSurfacePass,
      bestContractPass: bestVariant.contractPass,
      bestLaPvLobeQualityPass: bestVariant.laPvLobeQualityPass,
      bestDtHalfContractPass: bestVariant.dtHalfContractPass,
      bestMvfCleanCount: bestVariant.mvfCleanCount,
      bestOpposedLobeCount: bestVariant.opposedLobeCount,
      baselineSourceSurfacePass: baselineSummary.sourceSurfacePass,
      sourceSurfaceImprovementOverBaseline,
      maxSourceSurfacePass: sourceSurfaceBest.sourceSurfacePass,
      maxSourceSurfaceVariantId: sourceSurfaceBest.variantId,
      maxLobeQualityPass: lobeBest.laPvLobeQualityPass,
      maxLobeQualityVariantId: lobeBest.variantId,
      maxDtHalfContractPass: dtHalfBest.dtHalfContractPass,
      maxDtHalfContractVariantId: dtHalfBest.variantId,
      dominantLobeFailureCounts: countDominantLobeFailures(rows),
    },
    decision: {
      avPlaneReservoirCapacityTransactionStatus: status,
      nextAction: status === "av-plane-reservoir-capacity-transaction-signal"
        ? "Treat as sidecar component evidence only; next review must check four-chamber source/reservoir transfer and owner visual lobe quality before any AV-plane enablement."
        : status === "av-plane-reservoir-capacity-transaction-mixed"
          ? "Use this capacity-state result to decide whether AV-plane reservoir geometry can own the v-loop; do not tune pressure substitution or simple lobe generators."
          : "Keep atrial promotion blocked; reservoir capacity state did not recover source-preserving opposed lobe quality.",
      blockedClaims: [
        "runtime-wiring",
        "atrial-pressure-substitution",
        "morphology-acceptance",
        "AV-plane-enable",
        "a-prime-physiology",
        "blood-ledger-mutation",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      pressureSubstitution: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimePhysiologyClaim: false,
      bloodLedgerMutation: false,
      LandAtrialUnlock: false,
    },
  };
}

export function applyAVPlaneReservoirCapacityTransactionVariantV1(
  params: LeftHeartSubsystemParamsV2,
  variant: AVPlaneReservoirCapacityTransactionVariantV1,
): LeftHeartSubsystemParamsV2 {
  if (variant.reservoirCapacityGainMl <= 0) {
    return {
      ...params,
      laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
      laLobeGeneratorMode: "none",
      laEffectiveGeometryMode: "none",
      laReservoirSuctionPressureGainMmHg: 0,
      laBoosterPressureGainMmHg: 0,
      laReservoirGeometryGainMl: 0,
      laBoosterGeometryGainMl: 0,
    };
  }
  return {
    ...params,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
    laLobeGeneratorMode: "av-plane-reservoir-capacity-transaction-v1",
    laEffectiveGeometryMode: variant.geometryEffect === "stretch"
      ? "av-plane-reservoir-stretch-transaction-v1"
      : "av-plane-reservoir-capacity-transaction-v1",
    laReservoirSuctionPressureGainMmHg: -variant.reservoirWorkPressureGainMmHg,
    laBoosterPressureGainMmHg: 0,
    laReservoirGeometryGainMl: variant.reservoirCapacityGainMl,
    laBoosterGeometryGainMl: variant.boosterCompressionGainMl,
    laReservoirSuctionStartTheta: variant.reservoirStartTheta,
    laReservoirSuctionEndTheta: variant.reservoirEndTheta,
    laAVPlaneEjectionRateStartMlPerSec: variant.ejectionRateStartMlPerSec,
    laAVPlaneEjectionRateEndMlPerSec: variant.ejectionRateEndMlPerSec,
    laAVPlaneReservoirCapacityRiseTauSec: variant.riseTauSec,
    laAVPlaneReservoirCapacityFallTauSec: variant.fallTauSec,
    laAVPlaneReservoirCapacityReleaseTauSec: variant.releaseTauSec,
    laAVPlaneReservoirCapacityMvOpenReleaseThreshold01: variant.mvOpenReleaseThreshold01,
    laEffectiveGeometryVelocityScaleCmPerSec: 2.4,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  variant: AVPlaneReservoirCapacityTransactionVariantV1,
  baseline: LeftHeartSubsystemRunV2,
  baselineDtHalf: LeftHeartSubsystemRunV2,
  run: LeftHeartSubsystemRunV2,
  dtHalfRun: LeftHeartSubsystemRunV2,
): RowV1 {
  const nominalBase = rowCore(baseline.finalBeatSamples, baseline, run.finalBeatSamples, run);
  const dtHalfBase = rowCore(baselineDtHalf.finalBeatSamples, baselineDtHalf, dtHalfRun.finalBeatSamples, dtHalfRun);
  const sourceFailures = sourceSurfaceFailureReasons(nominalBase);
  const dtHalfSourceFailures = sourceSurfaceFailureReasons(dtHalfBase);
  const dtHalfContractFailures = [
    ...dtHalfSourceFailures,
    ...(dtHalfBase.lobeQuality.lobeQualityPass ? [] : ["dt-half-la-pv-lobe-quality-fail"]),
    ...(dtHalfBase.maxHiddenBloodVolumeSourceMl === 0 ? [] : ["dt-half-hidden-blood-volume-source"]),
  ];
  const contractFailures = [
    ...sourceFailures,
    ...(nominalBase.lobeQuality.lobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
    ...(nominalBase.maxHiddenBloodVolumeSourceMl === 0 ? [] : ["hidden-blood-volume-source"]),
    ...(dtHalfContractFailures.length === 0 ? [] : ["dt-half-contract-fail"]),
  ];
  return {
    profileId,
    sourcePointId,
    variantId: variant.variantId,
    sampleRateHz: run.params.sampleRateHz,
    dtHalfSampleRateHz: dtHalfRun.params.sampleRateHz,
    ...nominalBase,
    dtHalf: {
      sourceSurfaceStatus: dtHalfSourceFailures.length === 0 ? "pass" : "fail",
      lobeQualityPass: dtHalfBase.lobeQuality.lobeQualityPass,
      contractStatus: dtHalfContractFailures.length === 0 ? "pass" : "fail",
      mvForwardPeakCount: dtHalfBase.mvForwardPeakCount,
      mvC1ContinuityScore: dtHalfBase.mvC1ContinuityScore,
      mvForwardVolumeRatio: dtHalfBase.mvForwardVolumeRatio,
      aovForwardVolumeRatio: dtHalfBase.aovForwardVolumeRatio,
      maxHiddenBloodVolumeSourceMl: dtHalfBase.maxHiddenBloodVolumeSourceMl,
      lobeQuality: dtHalfBase.lobeQuality,
      failureReasons: dtHalfContractFailures,
    },
    sourceSurfaceStatus: sourceFailures.length === 0 ? "pass" : "fail",
    contractStatus: contractFailures.length === 0 ? "pass" : "fail",
    failureReasons: contractFailures,
  };
}

function rowCore(
  baselineBeat: readonly LeftHeartSubsystemSampleV2[],
  baselineRun: LeftHeartSubsystemRunV2,
  beat: readonly LeftHeartSubsystemSampleV2[],
  run: LeftHeartSubsystemRunV2,
): Omit<RowV1,
  | "profileId"
  | "sourcePointId"
  | "variantId"
  | "sampleRateHz"
  | "dtHalfSampleRateHz"
  | "dtHalf"
  | "sourceSurfaceStatus"
  | "contractStatus"
  | "failureReasons"
> {
  const dtSec = 1 / Math.max(run.params.sampleRateHz, 1e-9);
  const baselineDtSec = 1 / Math.max(baselineRun.params.sampleRateHz, 1e-9);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const baselineQmv = baselineBeat.map((sample) => sample.qMvMlPerSec);
  const baselineAov = baselineBeat.map((sample) => sample.qAovMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const lobeQuality = lobeQualityFor(beat);
  return {
    mvForwardPeakCount: positivePeakCount(qMv),
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio: round(
      forwardFlowVolume(qMv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, baselineDtSec), 1e-9),
    ),
    aovForwardVolumeRatio: round(
      forwardFlowVolume(qAov, dtSec) / Math.max(forwardFlowVolume(baselineAov, baselineDtSec), 1e-9),
    ),
    maxMassResidualAbsMl: round(maxAbs(beat.map((sample) => sample.massResidualMl))),
    clampCount: run.clampCount,
    baselineClampCount: baselineRun.clampCount,
    maxCapacityState01: round(Math.max(0, ...beat.map((sample) => sample.laReservoirSuctionDrive01))),
    maxCapacityGeometryDeltaMl: round(Math.max(0, ...beat.map((sample) => sample.laReservoirGeometryDeltaMl))),
    maxVisibleLaVolumeDeltaMl: round(maxAbs(beat.map((sample) => visibleLaVolumeMl(sample) - sample.acceptedLaVolumeMl))),
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
}

function sourceSurfaceFailureReasons(
  row: Pick<RowV1,
    | "mvForwardPeakCount"
    | "mvC1ContinuityScore"
    | "mvForwardVolumeRatio"
    | "aovForwardVolumeRatio"
    | "maxMassResidualAbsMl"
    | "clampCount"
    | "baselineClampCount"
  >,
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

function lobeQualityFor(samples: readonly LeftHeartSubsystemSampleV2[]): LobeQualityV1 {
  const volumes = samples.map(visibleLaVolumeMl);
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
    aOverVLoopRatio: round(aLoopArea / Math.max(vLoopArea, 1e-9)),
    signedALoopArea: round(signedALoop),
    signedVLoopArea: round(signedVLoop),
    opposedSignedLobes,
    volumeSeparationMl: round(volumeSeparation),
    failureReasons: failures,
  };
}

function visibleLaVolumeMl(sample: LeftHeartSubsystemSampleV2): number {
  return sample.acceptedLaVolumeMl + sample.laEffectiveGeometryDeltaMl;
}

function summarizeVariant(
  variantId: AVPlaneReservoirCapacityTransactionVariantIdV1,
  rows: readonly RowV1[],
): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    contractPass: rows.filter((row) => row.contractStatus === "pass").length,
    laPvLobeQualityPass: rows.filter((row) => row.lobeQuality.lobeQualityPass).length,
    dtHalfSourceSurfacePass: rows.filter((row) => row.dtHalf.sourceSurfaceStatus === "pass").length,
    dtHalfContractPass: rows.filter((row) => row.dtHalf.contractStatus === "pass").length,
    dtHalfLobeQualityPass: rows.filter((row) => row.dtHalf.lobeQualityPass).length,
    mvfCleanCount: rows.filter((row) => row.mvForwardPeakCount === 2 && row.mvC1ContinuityScore <= 0.42).length,
    mvForwardVolumeParityCount: rows.filter((row) =>
      row.mvForwardVolumeRatio >= 0.78 && row.mvForwardVolumeRatio <= 1.22).length,
    aovOutputParityCount: rows.filter((row) =>
      row.aovForwardVolumeRatio >= 0.80 && row.aovForwardVolumeRatio <= 1.20).length,
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    aPrimeReadbackPresentCount: rows.filter((row) => row.aPrimeReadbackPresent).length,
    opposedLobeCount: rows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
    dtHalfOpposedLobeCount: rows.filter((row) => row.dtHalf.lobeQuality.opposedSignedLobes).length,
    maxAPrimePeakAbsCmPerSec: round(Math.max(0, ...rows.map((row) => row.maxAPrimePeakAbsCmPerSec))),
    maxSPrimePeakAbsCmPerSec: round(Math.max(0, ...rows.map((row) => row.maxSPrimePeakAbsCmPerSec))),
    maxCapacityState01: round(Math.max(0, ...rows.map((row) => row.maxCapacityState01))),
    maxCapacityGeometryDeltaMl: round(Math.max(0, ...rows.map((row) => row.maxCapacityGeometryDeltaMl))),
    maxVisibleLaVolumeDeltaMl: round(Math.max(0, ...rows.map((row) => row.maxVisibleLaVolumeDeltaMl))),
    maxNetGeometryDeltaAbsMl: round(Math.max(0, ...rows.map((row) => row.maxNetGeometryDeltaAbsMl))),
    maxALoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.aLoopArea))),
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.vLoopArea))),
    maxVolumeSeparationMl: round(Math.max(0, ...rows.map((row) => row.lobeQuality.volumeSeparationMl))),
  };
}

function compareSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.contractPass - a.contractPass
    || b.laPvLobeQualityPass - a.laPvLobeQualityPass
    || b.dtHalfContractPass - a.dtHalfContractPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.opposedLobeCount - a.opposedLobeCount
    || b.mvfCleanCount - a.mvfCleanCount;
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

function variant(
  variantId: AVPlaneReservoirCapacityTransactionVariantIdV1,
  reservoirCapacityGainMl: number,
  boosterCompressionGainMl: number,
  reservoirWorkPressureGainMmHg: number,
  geometryEffect: "capacity" | "stretch",
  ejectionRateStartMlPerSec: number,
  ejectionRateEndMlPerSec: number,
  reservoirStartTheta: number,
  reservoirEndTheta: number,
  riseTauSec: number,
  fallTauSec: number,
  releaseTauSec: number,
  mvOpenReleaseThreshold01: number,
): AVPlaneReservoirCapacityTransactionVariantV1 {
  return {
    variantId,
    reservoirCapacityGainMl,
    boosterCompressionGainMl,
    reservoirWorkPressureGainMmHg,
    geometryEffect,
    ejectionRateStartMlPerSec,
    ejectionRateEndMlPerSec,
    reservoirStartTheta,
    reservoirEndTheta,
    riseTauSec,
    fallTauSec,
    releaseTauSec,
    mvOpenReleaseThreshold01,
  };
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
