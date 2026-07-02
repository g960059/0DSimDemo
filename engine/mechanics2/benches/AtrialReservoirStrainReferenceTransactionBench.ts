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

export const ATRIAL_RESERVOIR_STRAIN_REFERENCE_TRANSACTION_REPORT_ID_V1 =
  "atrial-reservoir-strain-reference-transaction-report-v1" as const;

export type AtrialReservoirStrainReferenceTransactionVariantIdV1 =
  | "compliance-node-no-avplane"
  | "reference-stretch-gain10-flow020"
  | "reference-stretch-gain12-flow030"
  | "reference-stretch-gain16-flow030"
  | "reference-stretch-gain16-flow045"
  | "reference-stretch-gain20-flow045"
  | "reference-capacity-gain12-flow030"
  | "reference-capacity-gain16-flow045"
  | "reference-stretch-gain16-boost04-flow030"
  | "reference-stretch-gain16-work1-flow030"
  | "reference-stretch-gain16-suction1-flow030"
  | "reference-stretch-gain16-suction2-flow030"
  | "reference-capacity-gain16-suction1-flow030"
  | "reference-capacity-gain24-flow060"
  | "reference-capacity-gain32-flow060"
  | "reference-capacity-gain48-flow060"
  | "reference-capacity-gain64-flow060"
  | "reference-capacity-gain24-suction1-flow060"
  | "reference-capacity-gain32-suction2-flow060"
  | "reference-capacity-gain48-suction2-flow060";

type GeometryEffectV1 = "capacity" | "stretch";

export type AtrialReservoirStrainReferenceTransactionVariantV1 = {
  readonly variantId: AtrialReservoirStrainReferenceTransactionVariantIdV1;
  readonly reservoirCapacityGainMl: number;
  readonly boosterCompressionGainMl: number;
  readonly reservoirWorkPressureGainMmHg: number;
  readonly geometryEffect: GeometryEffectV1;
  readonly venousCouplingGain: number;
  readonly maxKinematicFlowMlPerSec: number;
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
  readonly variantId: AtrialReservoirStrainReferenceTransactionVariantIdV1;
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
  readonly variantId: AtrialReservoirStrainReferenceTransactionVariantIdV1;
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
  readonly maxPulmonaryVenousPressureMmHg: number;
  readonly minPulmonaryVenousPressureMmHg: number;
  readonly maxGeometryDeltaMl: number;
  readonly maxReferenceVolumeShiftMl: number;
  readonly maxVisibleLaVolumeDeltaMl: number;
  readonly maxALoopArea: number;
  readonly maxVLoopArea: number;
  readonly maxVolumeSeparationMl: number;
};

export type AtrialReservoirStrainReferenceTransactionReportV1 = {
  readonly reportId: typeof ATRIAL_RESERVOIR_STRAIN_REFERENCE_TRANSACTION_REPORT_ID_V1;
  readonly gateId: "atrialReservoirStrainReferenceTransactionV1";
  readonly mode: "left-heart-atrial-reservoir-strain-reference-transaction-no-runtime";
  readonly variants: readonly AtrialReservoirStrainReferenceTransactionVariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: AtrialReservoirStrainReferenceTransactionVariantIdV1;
    readonly bestSourceSurfacePass: number;
    readonly bestContractPass: number;
    readonly bestLaPvLobeQualityPass: number;
    readonly bestDtHalfContractPass: number;
    readonly bestMvfCleanCount: number;
    readonly bestOpposedLobeCount: number;
    readonly baselineSourceSurfacePass: number;
    readonly sourceSurfaceImprovementOverBaseline: number;
    readonly maxSourceSurfacePass: number;
    readonly maxSourceSurfaceVariantId: AtrialReservoirStrainReferenceTransactionVariantIdV1;
    readonly maxLobeQualityPass: number;
    readonly maxLobeQualityVariantId: AtrialReservoirStrainReferenceTransactionVariantIdV1;
    readonly maxDtHalfContractPass: number;
    readonly maxDtHalfContractVariantId: AtrialReservoirStrainReferenceTransactionVariantIdV1;
    readonly dominantLobeFailureCounts: Record<DominantLobeFailureClassV1, number>;
  };
  readonly decision: {
    readonly atrialReservoirStrainReferenceTransactionStatus:
      | "atrial-reservoir-strain-reference-transaction-signal"
      | "atrial-reservoir-strain-reference-transaction-mixed"
      | "atrial-reservoir-strain-reference-transaction-blocked";
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
    readonly explicitPulmonaryVenousReservoirFlow: true;
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

export const ATRIAL_RESERVOIR_STRAIN_REFERENCE_TRANSACTION_VARIANTS_V1:
readonly AtrialReservoirStrainReferenceTransactionVariantV1[] = [
  variant("compliance-node-no-avplane", 0, 0, 0, "stretch", 0, 0, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain10-flow020", 10, 0, 0, "stretch", 0.20, 80, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain12-flow030", 12, 0, 0, "stretch", 0.30, 120, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain16-flow030", 16, 0, 0, "stretch", 0.30, 140, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain16-flow045", 16, 0, 0, "stretch", 0.45, 170, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain20-flow045", 20, 0, 0, "stretch", 0.45, 190, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain12-flow030", 12, 0, 0, "capacity", 0.30, 120, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain16-flow045", 16, 0, 0, "capacity", 0.45, 170, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain16-boost04-flow030", 16, 4, 0, "stretch", 0.30, 140, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain16-work1-flow030", 16, 0, 1, "stretch", 0.30, 140, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain16-suction1-flow030", 16, 0, -1, "stretch", 0.30, 140, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-stretch-gain16-suction2-flow030", 16, 0, -2, "stretch", 0.30, 140, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain16-suction1-flow030", 16, 0, -1, "capacity", 0.30, 140, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain24-flow060", 24, 0, 0, "capacity", 0.60, 230, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain32-flow060", 32, 0, 0, "capacity", 0.60, 260, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain48-flow060", 48, 0, 0, "capacity", 0.60, 300, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain64-flow060", 64, 0, 0, "capacity", 0.60, 340, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain24-suction1-flow060", 24, 0, -1, "capacity", 0.60, 230, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain32-suction2-flow060", 32, 0, -2, "capacity", 0.60, 260, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("reference-capacity-gain48-suction2-flow060", 48, 0, -2, "capacity", 0.60, 300, 1.0, 30, 1.0, 18, 60, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
];

export function runAtrialReservoirStrainReferenceTransactionBenchV1():
AtrialReservoirStrainReferenceTransactionReportV1 {
  const rawParamsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineVariant = ATRIAL_RESERVOIR_STRAIN_REFERENCE_TRANSACTION_VARIANTS_V1[0]!;
  const baselineParamsByProfile = rawParamsByProfile.map((params) =>
    applyAtrialReservoirStrainReferenceTransactionVariantV1(params, baselineVariant)
  );
  const baselineRuns = baselineParamsByProfile.map((params) => runLeftHeartSubsystemV2(params));
  const baselineDtHalfRuns = baselineParamsByProfile.map((params) =>
    runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 })
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baselineParams = baselineParamsByProfile[index]!;
    const baselineRun = baselineRuns[index]!;
    const baselineDtHalfRun = baselineDtHalfRuns[index]!;
    return ATRIAL_RESERVOIR_STRAIN_REFERENCE_TRANSACTION_VARIANTS_V1.map((variant) => {
      const params = variant.variantId === "compliance-node-no-avplane"
        ? baselineParams
        : applyAtrialReservoirStrainReferenceTransactionVariantV1(rawParamsByProfile[index]!, variant);
      const run = variant.variantId === "compliance-node-no-avplane"
        ? baselineRun
        : runLeftHeartSubsystemV2(params);
      const dtHalfRun = variant.variantId === "compliance-node-no-avplane"
        ? baselineDtHalfRun
        : runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 });
      return rowForRun(profileId, baselineParams.fixtureId, variant, baselineRun, baselineDtHalfRun, run, dtHalfRun);
    });
  });
  const variantSummaries = ATRIAL_RESERVOIR_STRAIN_REFERENCE_TRANSACTION_VARIANTS_V1.map((variant) =>
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
  const baselineSummary = variantSummaries.find((summary) =>
    summary.variantId === "compliance-node-no-avplane"
  )!;
  const sourceSurfaceImprovementOverBaseline =
    sourceSurfaceBest.sourceSurfacePass - baselineSummary.sourceSurfacePass;
  const status = bestVariant.contractPass === PROFILE_IDS.length && bestVariant.dtHalfContractPass === PROFILE_IDS.length
    ? "atrial-reservoir-strain-reference-transaction-signal"
    : lobeBest.laPvLobeQualityPass > 2
      || lobeBest.opposedLobeCount > 2
      || sourceSurfaceImprovementOverBaseline > 0
      || sourceSurfaceBest.sourceSurfacePass >= 5
      ? "atrial-reservoir-strain-reference-transaction-mixed"
      : "atrial-reservoir-strain-reference-transaction-blocked";
  return {
    reportId: ATRIAL_RESERVOIR_STRAIN_REFERENCE_TRANSACTION_REPORT_ID_V1,
    gateId: "atrialReservoirStrainReferenceTransactionV1",
    mode: "left-heart-atrial-reservoir-strain-reference-transaction-no-runtime",
    variants: ATRIAL_RESERVOIR_STRAIN_REFERENCE_TRANSACTION_VARIANTS_V1,
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
      atrialReservoirStrainReferenceTransactionStatus: status,
      nextAction: status === "atrial-reservoir-strain-reference-transaction-signal"
        ? "Treat as sidecar component evidence only; next review must check four-chamber source/reservoir transfer and owner visual lobe quality before any AV-plane enablement."
        : status === "atrial-reservoir-strain-reference-transaction-mixed"
          ? "Use this reservoir strain/reference-state result to decide whether atrial wall reference mechanics can own the missing v-loop; do not tune pressure substitution or simple lobe generators."
          : "Keep atrial promotion blocked; explicit reservoir strain reference transaction did not recover source-preserving opposed lobe quality.",
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
      explicitPulmonaryVenousReservoirFlow: true,
      LandAtrialUnlock: false,
    },
  };
}

export function applyAtrialReservoirStrainReferenceTransactionVariantV1(
  params: LeftHeartSubsystemParamsV2,
  variant: AtrialReservoirStrainReferenceTransactionVariantV1,
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
    };
  }
  return {
    ...base,
    laLobeGeneratorMode: "av-plane-reservoir-strain-reference-transaction-v1",
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
    laAVPlaneVenousReservoirCouplingGain: variant.venousCouplingGain,
    laAVPlaneVenousReservoirMaxFlowMlPerSec: variant.maxKinematicFlowMlPerSec,
    laAVPlaneVenousReservoirMvOpenReleaseThreshold01: variant.mvOpenReleaseThreshold01,
    laAVPlaneReservoirReferenceGainMl: variant.reservoirCapacityGainMl,
    laEffectiveGeometryVelocityScaleCmPerSec: 2.4,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  variant: AtrialReservoirStrainReferenceTransactionVariantV1,
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
  variantId: AtrialReservoirStrainReferenceTransactionVariantIdV1,
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
  variantId: AtrialReservoirStrainReferenceTransactionVariantIdV1,
  reservoirCapacityGainMl: number,
  boosterCompressionGainMl: number,
  reservoirWorkPressureGainMmHg: number,
  geometryEffect: GeometryEffectV1,
  venousCouplingGain: number,
  maxKinematicFlowMlPerSec: number,
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
): AtrialReservoirStrainReferenceTransactionVariantV1 {
  return {
    variantId,
    reservoirCapacityGainMl,
    boosterCompressionGainMl,
    reservoirWorkPressureGainMmHg,
    geometryEffect,
    venousCouplingGain,
    maxKinematicFlowMlPerSec,
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
