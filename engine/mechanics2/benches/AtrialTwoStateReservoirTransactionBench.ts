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

export const ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_REPORT_ID_V1 =
  "atrial-two-state-reservoir-transaction-report-v1" as const;

export type AtrialTwoStateReservoirTransactionVariantIdV1 =
  | "compliance-node-no-avplane"
  | "two-state-cap12-suction1-recoil2"
  | "two-state-cap16-suction1-recoil2"
  | "two-state-cap20-suction1-recoil3"
  | "two-state-cap24-suction1-recoil3"
  | "two-state-cap24-suction2-recoil4"
  | "two-state-cap32-suction2-recoil4"
  | "two-state-cap24-suction3-recoil5"
  | "two-state-cap32-suction3-recoil5"
  | "two-state-cap32-suction2-recoil6"
  | "two-state-cap24-suction2-recoil10"
  | "two-state-cap32-suction2-recoil10"
  | "two-state-cap24-suction4-recoil16"
  | "two-state-cap32-suction4-recoil16"
  | "two-state-cap24-suction4-recoil24";

type GeometryEffectV1 = "capacity" | "stretch";

export type AtrialTwoStateReservoirTransactionVariantV1 = {
  readonly variantId: AtrialTwoStateReservoirTransactionVariantIdV1;
  readonly reservoirCapacityGainMl: number;
  readonly boosterCompressionGainMl: number;
  readonly suctionPressureGainMmHg: number;
  readonly recoilPressureGainMmHg: number;
  readonly geometryEffect: GeometryEffectV1;
  readonly pulmonarySourcePressureDeltaMmHg: number;
  readonly pulmonaryComplianceMlPerMmHg: number;
  readonly pulmonaryToLaResistanceMultiplier: number;
  readonly ejectionRateStartMlPerSec: number;
  readonly ejectionRateEndMlPerSec: number;
  readonly reservoirStartTheta: number;
  readonly reservoirEndTheta: number;
  readonly riseTauSec: number;
  readonly fallTauSec: number;
  readonly releaseTauSec: number;
  readonly mvOpenReleaseThreshold01: number;
  readonly recoilStartTheta: number;
  readonly recoilEndTheta: number;
  readonly recoilRiseTauSec: number;
  readonly recoilFallTauSec: number;
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

type RowCoreV1 = {
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly maxReservoirState01: number;
  readonly maxGeometryDeltaMl: number;
  readonly maxReferenceVolumeShiftMl: number;
  readonly maxVisibleLaVolumeDeltaMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly maxAVPlaneKinematicFlowMlPerSec: number;
  readonly avPlaneKinematicForwardVolumeMl: number;
  readonly maxAVPlaneReservoirTractionPressureMmHg: number;
  readonly maxReservoirRecoilDrive01: number;
  readonly maxReservoirRecoilPressureMmHg: number;
  readonly maxPulmonaryVenousPressureMmHg: number;
  readonly minPulmonaryVenousPressureMmHg: number;
  readonly aPrimeReadbackPresent: boolean;
  readonly maxAPrimePeakAbsCmPerSec: number;
  readonly maxSPrimePeakAbsCmPerSec: number;
  readonly lobeQuality: LobeQualityV1;
  readonly dominantLobeFailureClass: DominantLobeFailureClassV1;
};

type RowV1 = RowCoreV1 & {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: AtrialTwoStateReservoirTransactionVariantIdV1;
  readonly sampleRateHz: number;
  readonly dtHalfSampleRateHz: number;
  readonly dtHalf: RowCoreV1 & {
    readonly sourceSurfaceStatus: "pass" | "fail";
    readonly contractStatus: "pass" | "fail";
    readonly failureReasons: readonly string[];
  };
  readonly sourceSurfaceStatus: "pass" | "fail";
  readonly contractStatus: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: AtrialTwoStateReservoirTransactionVariantIdV1;
  readonly sourceSurfacePass: number;
  readonly contractPass: number;
  readonly laPvLobeQualityPass: number;
  readonly dtHalfSourceSurfacePass: number;
  readonly dtHalfContractPass: number;
  readonly dtHalfLobeQualityPass: number;
  readonly mvfCleanCount: number;
  readonly hiddenVolumeCleanCount: number;
  readonly aPrimeReadbackPresentCount: number;
  readonly opposedLobeCount: number;
  readonly dtHalfOpposedLobeCount: number;
  readonly maxAVPlaneKinematicFlowMlPerSec: number;
  readonly maxAVPlaneKinematicForwardVolumeMl: number;
  readonly maxAVPlaneReservoirTractionPressureMmHg: number;
  readonly maxReservoirRecoilPressureMmHg: number;
  readonly maxPulmonaryVenousPressureMmHg: number;
  readonly minPulmonaryVenousPressureMmHg: number;
  readonly maxGeometryDeltaMl: number;
  readonly maxReferenceVolumeShiftMl: number;
  readonly maxVisibleLaVolumeDeltaMl: number;
  readonly maxALoopArea: number;
  readonly maxVLoopArea: number;
  readonly maxVolumeSeparationMl: number;
};

export type AtrialTwoStateReservoirTransactionReportV1 = {
  readonly reportId: typeof ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_REPORT_ID_V1;
  readonly gateId: "atrialTwoStateReservoirTransactionV1";
  readonly mode: "left-heart-atrial-two-state-reservoir-transaction-no-runtime";
  readonly variants: readonly AtrialTwoStateReservoirTransactionVariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: AtrialTwoStateReservoirTransactionVariantIdV1;
    readonly bestSourceSurfacePass: number;
    readonly bestContractPass: number;
    readonly bestLaPvLobeQualityPass: number;
    readonly bestDtHalfContractPass: number;
    readonly bestMvfCleanCount: number;
    readonly bestOpposedLobeCount: number;
    readonly baselineSourceSurfacePass: number;
    readonly sourceSurfaceImprovementOverBaseline: number;
    readonly maxSourceSurfacePass: number;
    readonly maxSourceSurfaceVariantId: AtrialTwoStateReservoirTransactionVariantIdV1;
    readonly maxLobeQualityPass: number;
    readonly maxLobeQualityVariantId: AtrialTwoStateReservoirTransactionVariantIdV1;
    readonly maxDtHalfContractPass: number;
    readonly maxDtHalfContractVariantId: AtrialTwoStateReservoirTransactionVariantIdV1;
    readonly baselineMaxVLoopArea: number;
    readonly maxVLoopArea: number;
    readonly maxVLoopAreaVariantId: AtrialTwoStateReservoirTransactionVariantIdV1;
    readonly maxSourcePreservingVLoopArea: number;
    readonly maxSourcePreservingVLoopAreaVariantId: AtrialTwoStateReservoirTransactionVariantIdV1;
    readonly sourcePreservingVLoopAreaImprovementOverBaseline: number;
    readonly dominantLobeFailureCounts: Record<DominantLobeFailureClassV1, number>;
  };
  readonly decision: {
    readonly atrialTwoStateReservoirTransactionStatus:
      | "atrial-two-state-reservoir-transaction-signal"
      | "atrial-two-state-reservoir-transaction-mixed"
      | "atrial-two-state-reservoir-transaction-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly pressureSubstitution: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly aPrimePhysiologyClaim: false;
    readonly hiddenBloodVolumeSource: false;
    readonly explicitPulmonaryVenousReservoirFlow: false;
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

export const ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1:
readonly AtrialTwoStateReservoirTransactionVariantV1[] = [
  variant("compliance-node-no-avplane", 0, 0, 0, 0, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.30, 0.68, 0.08, 0.18),
  variant("two-state-cap12-suction1-recoil2", 12, 0, 1, 2, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.30, 0.68, 0.08, 0.18),
  variant("two-state-cap16-suction1-recoil2", 16, 0, 1, 2, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.30, 0.68, 0.08, 0.18),
  variant("two-state-cap20-suction1-recoil3", 20, 0, 1, 3, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.30, 0.68, 0.08, 0.18),
  variant("two-state-cap24-suction1-recoil3", 24, 0, 1, 3, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.30, 0.68, 0.08, 0.18),
  variant("two-state-cap24-suction2-recoil4", 24, 0, 2, 4, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.32, 0.70, 0.10, 0.20),
  variant("two-state-cap32-suction2-recoil4", 32, 0, 2, 4, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.32, 0.70, 0.10, 0.20),
  variant("two-state-cap24-suction3-recoil5", 24, 0, 3, 5, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.34, 0.72, 0.11, 0.22),
  variant("two-state-cap32-suction3-recoil5", 32, 0, 3, 5, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.34, 0.72, 0.11, 0.22),
  variant("two-state-cap32-suction2-recoil6", 32, 0, 2, 6, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.36, 0.74, 0.12, 0.24),
  variant("two-state-cap24-suction2-recoil10", 24, 0, 2, 10, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.36, 0.76, 0.12, 0.24),
  variant("two-state-cap32-suction2-recoil10", 32, 0, 2, 10, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.36, 0.76, 0.12, 0.24),
  variant("two-state-cap24-suction4-recoil16", 24, 0, 4, 16, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.38, 0.78, 0.14, 0.26),
  variant("two-state-cap32-suction4-recoil16", 32, 0, 4, 16, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.38, 0.78, 0.14, 0.26),
  variant("two-state-cap24-suction4-recoil24", 24, 0, 4, 24, "capacity", 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.40, 0.80, 0.16, 0.30),
];

export function runAtrialTwoStateReservoirTransactionBenchV1():
AtrialTwoStateReservoirTransactionReportV1 {
  const rawParamsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineVariant = ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1[0]!;
  const baselineParamsByProfile = rawParamsByProfile.map((params) =>
    applyAtrialTwoStateReservoirTransactionVariantV1(params, baselineVariant)
  );
  const baselineRuns = baselineParamsByProfile.map((params) => runLeftHeartSubsystemV2(params));
  const baselineDtHalfRuns = baselineParamsByProfile.map((params) =>
    runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 })
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baselineParams = baselineParamsByProfile[index]!;
    const baselineRun = baselineRuns[index]!;
    const baselineDtHalfRun = baselineDtHalfRuns[index]!;
    return ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1.map((variant) => {
      const params = variant.variantId === "compliance-node-no-avplane"
        ? baselineParams
        : applyAtrialTwoStateReservoirTransactionVariantV1(rawParamsByProfile[index]!, variant);
      const run = variant.variantId === "compliance-node-no-avplane"
        ? baselineRun
        : runLeftHeartSubsystemV2(params);
      const dtHalfRun = variant.variantId === "compliance-node-no-avplane"
        ? baselineDtHalfRun
        : runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 });
      return rowForRun(profileId, baselineParams.fixtureId, variant, baselineRun, baselineDtHalfRun, run, dtHalfRun);
    });
  });
  const variantSummaries = ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1.map((variant) =>
    summarizeVariant(variant.variantId, rows.filter((row) => row.variantId === variant.variantId))
  );
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
  const vLoopAreaBest = [...variantSummaries].sort((a, b) =>
    b.maxVLoopArea - a.maxVLoopArea
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfCleanCount - a.mvfCleanCount
  )[0]!;
  const baselineSummary = variantSummaries.find((summary) =>
    summary.variantId === "compliance-node-no-avplane"
  )!;
  const sourcePreservingVLoopAreaBest = [...variantSummaries]
    .filter((summary) =>
      summary.variantId !== "compliance-node-no-avplane"
      && summary.sourceSurfacePass >= baselineSummary.sourceSurfacePass
      && summary.mvfCleanCount >= baselineSummary.mvfCleanCount
      && summary.hiddenVolumeCleanCount === PROFILE_IDS.length
    )
    .sort((a, b) =>
      b.maxVLoopArea - a.maxVLoopArea
      || b.maxReservoirRecoilPressureMmHg - a.maxReservoirRecoilPressureMmHg
    )[0] ?? baselineSummary;
  const sourceSurfaceImprovementOverBaseline =
    sourceSurfaceBest.sourceSurfacePass - baselineSummary.sourceSurfacePass;
  const sourcePreservingVLoopAreaImprovementOverBaseline =
    sourcePreservingVLoopAreaBest.maxVLoopArea - baselineSummary.maxVLoopArea;
  const status = bestVariant.contractPass === PROFILE_IDS.length && bestVariant.dtHalfContractPass === PROFILE_IDS.length
    ? "atrial-two-state-reservoir-transaction-signal"
    : lobeBest.laPvLobeQualityPass > 2
      || lobeBest.opposedLobeCount > 2
      || sourceSurfaceImprovementOverBaseline > 0
      || sourceSurfaceBest.sourceSurfacePass >= 5
      || sourcePreservingVLoopAreaImprovementOverBaseline >= 20
      ? "atrial-two-state-reservoir-transaction-mixed"
      : "atrial-two-state-reservoir-transaction-blocked";
  return {
    reportId: ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_REPORT_ID_V1,
    gateId: "atrialTwoStateReservoirTransactionV1",
    mode: "left-heart-atrial-two-state-reservoir-transaction-no-runtime",
    variants: ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1,
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
      baselineMaxVLoopArea: baselineSummary.maxVLoopArea,
      maxVLoopArea: vLoopAreaBest.maxVLoopArea,
      maxVLoopAreaVariantId: vLoopAreaBest.variantId,
      maxSourcePreservingVLoopArea: sourcePreservingVLoopAreaBest.maxVLoopArea,
      maxSourcePreservingVLoopAreaVariantId: sourcePreservingVLoopAreaBest.variantId,
      sourcePreservingVLoopAreaImprovementOverBaseline: round(sourcePreservingVLoopAreaImprovementOverBaseline),
      dominantLobeFailureCounts: countDominantLobeFailures(rows),
    },
    decision: {
      atrialTwoStateReservoirTransactionStatus: status,
      nextAction: status === "atrial-two-state-reservoir-transaction-signal"
        ? "Treat as sidecar component evidence only; next review must check four-chamber source/reservoir transfer and owner visual lobe quality before any AV-plane enablement."
        : status === "atrial-two-state-reservoir-transaction-mixed"
        ? "Treat this as area-only V-loop signal: separated acquisition/recoil can enlarge the reservoir lobe while preserving source/MVF in bounded cases, but opposed-lobe orientation remains failed. Next work should target reservoir topology/orientation, not pressure substitution or scalar lobe sweeps."
          : "Keep atrial promotion blocked; two-state AV-plane reservoir transaction did not recover source-preserving opposed lobe quality.",
      blockedClaims: [
        "runtime-wiring",
        "atrial-pressure-substitution",
        "morphology-acceptance",
        "AV-plane-enable",
        "a-prime-physiology",
        "hidden-blood-volume-source",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      pressureSubstitution: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimePhysiologyClaim: false,
      hiddenBloodVolumeSource: false,
      explicitPulmonaryVenousReservoirFlow: false,
      LandAtrialUnlock: false,
    },
  };
}

export function applyAtrialTwoStateReservoirTransactionVariantV1(
  params: LeftHeartSubsystemParamsV2,
  variant: AtrialTwoStateReservoirTransactionVariantV1,
): LeftHeartSubsystemParamsV2 {
  const base = {
    ...params,
    pulmonaryVenousBoundaryMode: "compliance-node" as const,
    pulmonaryVenousInitialPressureMmHg:
      params.pulmonaryVenousPressureMmHg + variant.pulmonarySourcePressureDeltaMmHg,
    pulmonaryVenousSourcePressureMmHg:
      params.pulmonaryVenousPressureMmHg + variant.pulmonarySourcePressureDeltaMmHg,
    pulmonaryVenousComplianceMlPerMmHg: variant.pulmonaryComplianceMlPerMmHg,
    pulmonaryVenousResistanceMmHgSecPerMl:
      params.pulmonaryVenousResistanceMmHgSecPerMl * variant.pulmonaryToLaResistanceMultiplier,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow" as const,
  };
  if (variant.reservoirCapacityGainMl <= 0) {
    return {
      ...base,
      laLobeGeneratorMode: "none",
      laEffectiveGeometryMode: "none",
      laReservoirSuctionPressureGainMmHg: 0,
      laBoosterPressureGainMmHg: 0,
      laReservoirGeometryGainMl: 0,
      laBoosterGeometryGainMl: 0,
      laAVPlaneVenousReservoirCouplingGain: 0,
      laAVPlaneVenousReservoirMaxFlowMlPerSec: 0,
      laAVPlaneReservoirReferenceGainMl: 0,
      laAVPlaneReservoirTractionGainMmHgPerNormPerSec: 0,
      laAVPlaneReservoirRecoilPressureGainMmHg: 0,
    };
  }
  return {
    ...base,
    laLobeGeneratorMode: "av-plane-two-state-reservoir-transaction-v1",
    laEffectiveGeometryMode: variant.geometryEffect === "stretch"
      ? "av-plane-reservoir-stretch-transaction-v1"
      : "av-plane-reservoir-capacity-transaction-v1",
    laReservoirSuctionPressureGainMmHg: variant.suctionPressureGainMmHg,
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
    laAVPlaneVenousReservoirCouplingGain: 0,
    laAVPlaneVenousReservoirMaxFlowMlPerSec: 0,
    laAVPlaneVenousReservoirMvOpenReleaseThreshold01: variant.mvOpenReleaseThreshold01,
    laAVPlaneReservoirReferenceGainMl: 0,
    laAVPlaneReservoirTractionGainMmHgPerNormPerSec: 0,
    laAVPlaneReservoirRecoilPressureGainMmHg: variant.recoilPressureGainMmHg,
    laAVPlaneReservoirRecoilStartTheta: variant.recoilStartTheta,
    laAVPlaneReservoirRecoilEndTheta: variant.recoilEndTheta,
    laAVPlaneReservoirRecoilRiseTauSec: variant.recoilRiseTauSec,
    laAVPlaneReservoirRecoilFallTauSec: variant.recoilFallTauSec,
    laEffectiveGeometryVelocityScaleCmPerSec: 2.4,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  variant: AtrialTwoStateReservoirTransactionVariantV1,
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
    ...(dtHalfBase.maxPulmonaryVenousPressureMmHg <= 30 ? [] : ["dt-half-pulmonary-venous-pressure-high"]),
  ];
  const contractFailures = [
    ...sourceFailures,
    ...(nominalBase.lobeQuality.lobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
    ...(nominalBase.maxHiddenBloodVolumeSourceMl === 0 ? [] : ["hidden-blood-volume-source"]),
    ...(nominalBase.maxPulmonaryVenousPressureMmHg <= 30 ? [] : ["pulmonary-venous-pressure-high"]),
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
      ...dtHalfBase,
      sourceSurfaceStatus: dtHalfSourceFailures.length === 0 ? "pass" : "fail",
      contractStatus: dtHalfContractFailures.length === 0 ? "pass" : "fail",
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
): RowCoreV1 {
  const dtSec = 1 / Math.max(run.params.sampleRateHz, 1e-9);
  const baselineDtSec = 1 / Math.max(baselineRun.params.sampleRateHz, 1e-9);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const qKinematic = beat.map((sample) => sample.qAVPlaneReservoirKinematicMlPerSec);
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
    maxReservoirState01: round(Math.max(0, ...beat.map((sample) => sample.laReservoirSuctionDrive01))),
    maxGeometryDeltaMl: round(Math.max(0, ...beat.map((sample) => sample.laReservoirGeometryDeltaMl))),
    maxReferenceVolumeShiftMl: round(Math.max(0, ...beat.map((sample) =>
      sample.laReservoirReferenceVolumeShiftMl
    ))),
    maxVisibleLaVolumeDeltaMl: round(maxAbs(beat.map((sample) => visibleLaVolumeMl(sample) - sample.acceptedLaVolumeMl))),
    maxHiddenBloodVolumeSourceMl: round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl))),
    maxAVPlaneKinematicFlowMlPerSec: round(Math.max(0, ...qKinematic)),
    avPlaneKinematicForwardVolumeMl: round(forwardFlowVolume(qKinematic, dtSec)),
    maxAVPlaneReservoirTractionPressureMmHg: round(Math.max(0, ...beat.map((sample) =>
      sample.laAVPlaneReservoirTractionPressureMmHg
    ))),
    maxReservoirRecoilDrive01: round(Math.max(0, ...beat.map((sample) => sample.laReservoirRecoilDrive01))),
    maxReservoirRecoilPressureMmHg: round(Math.max(0, ...beat.map((sample) =>
      sample.laReservoirRecoilPressureMmHg
    ))),
    maxPulmonaryVenousPressureMmHg: round(Math.max(0, ...beat.map((sample) =>
      sample.acceptedPulmonaryVenousPressureMmHg
    ))),
    minPulmonaryVenousPressureMmHg: round(Math.min(...beat.map((sample) =>
      sample.acceptedPulmonaryVenousPressureMmHg
    ))),
    aPrimeReadbackPresent: beat.some((sample) => sample.laAPrimeProxyCmPerSec != null),
    maxAPrimePeakAbsCmPerSec: round(maxAbs(beat.map((sample) => sample.laAPrimeProxyCmPerSec ?? 0))),
    maxSPrimePeakAbsCmPerSec: round(maxAbs(beat.map((sample) =>
      sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec ?? 0
    ))),
    lobeQuality,
    dominantLobeFailureClass: dominantLobeFailureClass(lobeQuality),
  };
}

function sourceSurfaceFailureReasons(row: Pick<RowCoreV1,
  | "mvForwardPeakCount"
  | "mvC1ContinuityScore"
  | "mvForwardVolumeRatio"
  | "aovForwardVolumeRatio"
  | "maxMassResidualAbsMl"
  | "clampCount"
  | "baselineClampCount"
>): readonly string[] {
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
  return sample.acceptedLaVolumeMl;
}

function summarizeVariant(
  variantId: AtrialTwoStateReservoirTransactionVariantIdV1,
  rows: readonly RowV1[],
): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    contractPass: rows.filter((row) => row.contractStatus === "pass").length,
    laPvLobeQualityPass: rows.filter((row) => row.lobeQuality.lobeQualityPass).length,
    dtHalfSourceSurfacePass: rows.filter((row) => row.dtHalf.sourceSurfaceStatus === "pass").length,
    dtHalfContractPass: rows.filter((row) => row.dtHalf.contractStatus === "pass").length,
    dtHalfLobeQualityPass: rows.filter((row) => row.dtHalf.lobeQuality.lobeQualityPass).length,
    mvfCleanCount: rows.filter((row) => row.mvForwardPeakCount === 2 && row.mvC1ContinuityScore <= 0.42).length,
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    aPrimeReadbackPresentCount: rows.filter((row) => row.aPrimeReadbackPresent).length,
    opposedLobeCount: rows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
    dtHalfOpposedLobeCount: rows.filter((row) => row.dtHalf.lobeQuality.opposedSignedLobes).length,
    maxAVPlaneKinematicFlowMlPerSec: round(Math.max(0, ...rows.map((row) => row.maxAVPlaneKinematicFlowMlPerSec))),
    maxAVPlaneKinematicForwardVolumeMl: round(Math.max(0, ...rows.map((row) => row.avPlaneKinematicForwardVolumeMl))),
    maxAVPlaneReservoirTractionPressureMmHg: round(Math.max(0, ...rows.map((row) =>
      row.maxAVPlaneReservoirTractionPressureMmHg
    ))),
    maxReservoirRecoilPressureMmHg: round(Math.max(0, ...rows.map((row) =>
      row.maxReservoirRecoilPressureMmHg
    ))),
    maxPulmonaryVenousPressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxPulmonaryVenousPressureMmHg))),
    minPulmonaryVenousPressureMmHg: round(Math.min(...rows.map((row) => row.minPulmonaryVenousPressureMmHg))),
    maxGeometryDeltaMl: round(Math.max(0, ...rows.map((row) => row.maxGeometryDeltaMl))),
    maxReferenceVolumeShiftMl: round(Math.max(0, ...rows.map((row) => row.maxReferenceVolumeShiftMl))),
    maxVisibleLaVolumeDeltaMl: round(Math.max(0, ...rows.map((row) => row.maxVisibleLaVolumeDeltaMl))),
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
  variantId: AtrialTwoStateReservoirTransactionVariantIdV1,
  reservoirCapacityGainMl: number,
  boosterCompressionGainMl: number,
  suctionPressureGainMmHg: number,
  recoilPressureGainMmHg: number,
  geometryEffect: GeometryEffectV1,
  pulmonarySourcePressureDeltaMmHg: number,
  pulmonaryComplianceMlPerMmHg: number,
  pulmonaryToLaResistanceMultiplier: number,
  ejectionRateStartMlPerSec: number,
  ejectionRateEndMlPerSec: number,
  reservoirStartTheta: number,
  reservoirEndTheta: number,
  riseTauSec: number,
  fallTauSec: number,
  releaseTauSec: number,
  mvOpenReleaseThreshold01: number,
  recoilStartTheta: number,
  recoilEndTheta: number,
  recoilRiseTauSec: number,
  recoilFallTauSec: number,
): AtrialTwoStateReservoirTransactionVariantV1 {
  return {
    variantId,
    reservoirCapacityGainMl,
    boosterCompressionGainMl,
    suctionPressureGainMmHg,
    recoilPressureGainMmHg,
    geometryEffect,
    pulmonarySourcePressureDeltaMmHg,
    pulmonaryComplianceMlPerMmHg,
    pulmonaryToLaResistanceMultiplier,
    ejectionRateStartMlPerSec,
    ejectionRateEndMlPerSec,
    reservoirStartTheta,
    reservoirEndTheta,
    riseTauSec,
    fallTauSec,
    releaseTauSec,
    mvOpenReleaseThreshold01,
    recoilStartTheta,
    recoilEndTheta,
    recoilRiseTauSec,
    recoilFallTauSec,
  };
}

function positivePeakCount(values: readonly number[]): number {
  let count = 0;
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(maxValue * 0.18, 1e-6);
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i]! > threshold && values[i]! >= values[i - 1]! && values[i]! > values[i + 1]!) count++;
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
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === x.length - 2) continue;
      if (segmentsIntersect(x[i]!, y[i]!, x[i + 1]!, y[i + 1]!, x[j]!, y[j]!, x[j + 1]!, y[j + 1]!)) count++;
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
  const d1 = orientation(ax, ay, bx, by, cx, cy);
  const d2 = orientation(ax, ay, bx, by, dx, dy);
  const d3 = orientation(cx, cy, dx, dy, ax, ay);
  const d4 = orientation(cx, cy, dx, dy, bx, by);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function orientation(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
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
  if (x.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < x.length; i++) {
    const j = (i + 1) % x.length;
    area += x[i]! * y[j]! - x[j]! * y[i]!;
  }
  return 0.5 * area;
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
