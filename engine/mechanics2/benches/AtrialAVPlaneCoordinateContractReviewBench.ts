import {
  applyVelocityStatefulTractionVariantV1,
  ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneVelocityStatefulTractionReviewBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_AV_PLANE_COORDINATE_CONTRACT_REVIEW_REPORT_ID_V1 =
  "atrial-av-plane-coordinate-contract-review-report-v1" as const;

type VariantIdV1 =
  | "raw-traction-reference"
  | "capacity-coordinate-drive2-stiff2-damp06"
  | "capacity-coordinate-drive4-stiff2-damp06"
  | "capacity-coordinate-drive6-stiff3-damp10"
  | "capacity-coordinate-drive8-stiff4-damp12"
  | "capacity-coordinate-drive4-stiff1-damp04-fast"
  | "capacity-coordinate-drive6-stiff2-damp06-slow"
  | "force-balance-drive4-hyd004-stiff2-damp06"
  | "force-balance-drive5-hyd006-stiff2-damp08"
  | "force-balance-drive6-hyd008-stiff3-damp10"
  | "force-balance-drive8-hyd010-stiff4-damp12"
  | "force-balance-drive6-hyd004-stiff2-damp06-fast"
  | "force-balance-cap28-drive4-hyd002-stiff1-damp04-fast"
  | "force-balance-cap28-drive6-hyd004-stiff2-damp06-fast"
  | "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast"
  | "force-balance-cap28-drive8-hyd006-stiff3-damp08"
  | "force-balance-vel06-drive4-hyd002-cap28"
  | "force-balance-vel10-drive4-hyd002-cap28"
  | "force-balance-vel12-drive4-hyd002-cap28"
  | "force-balance-vel08-drive3-hyd001-cap32";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly mode: "raw-reference" | "capacity-work-coordinate" | "force-balance-coordinate";
  readonly capacityGainMl: number;
  readonly driveForceN: number;
  readonly hydraulicGain: number;
  readonly velocityTractionGainMmHgPerNormPerSec: number;
  readonly stiffnessNPerNorm: number;
  readonly dampingNsecPerNorm: number;
  readonly massKg: number;
  readonly maxVelocityNormPerSec: number;
  readonly reservoirStartTheta: number;
  readonly reservoirEndTheta: number;
  readonly riseTauSec: number;
  readonly fallTauSec: number;
  readonly releaseTauSec: number;
  readonly mvReleaseThreshold01: number;
};

type LobeQualityV1 = {
  readonly pass: boolean;
  readonly selfIntersections: number;
  readonly opposedSignedLobes: boolean;
  readonly aLoopArea: number;
  readonly vLoopArea: number;
  readonly volumeSeparationMl: number;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly variantId: VariantIdV1;
  readonly sourceSurfaceStatus: "pass" | "fail";
  readonly topologyStatus: "pass" | "fail";
  readonly mvfClean: boolean;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxZNorm: number;
  readonly maxZDotNormPerSec: number;
  readonly maxDriveForceN: number;
  readonly maxHydraulicForceN: number;
  readonly maxNetForceN: number;
  readonly maxWorkCoordinatePressureMmHg: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly lobeQuality: LobeQualityV1;
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly sourceSurfacePass: number;
  readonly topologyPass: number;
  readonly sourcePreservingTopologyPass: number;
  readonly mvfCleanCount: number;
  readonly hiddenVolumeCleanCount: number;
  readonly opposedLobeCount: number;
  readonly maxZNorm: number;
  readonly maxZDotNormPerSec: number;
  readonly maxDriveForceN: number;
  readonly maxHydraulicForceN: number;
  readonly maxNetForceN: number;
  readonly maxWorkCoordinatePressureMmHg: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxVLoopArea: number;
};

export type AtrialAVPlaneCoordinateContractReviewReportV1 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_COORDINATE_CONTRACT_REVIEW_REPORT_ID_V1;
  readonly gateId: "atrialAVPlaneCoordinateContractReviewV1";
  readonly mode: "left-heart-av-plane-coordinate-contract-review-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly rawReference: VariantSummaryV1;
  readonly bestCoordinateVariant: VariantSummaryV1;
  readonly bestForceBalanceVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly rawSourceSurfacePass: number;
    readonly rawTopologyPass: number;
    readonly rawMvfCleanCount: number;
    readonly bestCoordinateVariantId: VariantIdV1;
    readonly bestCoordinateSourceSurfacePass: number;
    readonly bestCoordinateTopologyPass: number;
    readonly bestCoordinateMvfCleanCount: number;
    readonly bestForceBalanceVariantId: VariantIdV1;
    readonly bestForceBalanceSourceSurfacePass: number;
    readonly bestForceBalanceTopologyPass: number;
    readonly bestForceBalanceSourcePreservingTopologyPass: number;
    readonly bestForceBalanceMvfCleanCount: number;
    readonly coordinateVariantsImprovingRawSourceAndKeepingTopology: number;
    readonly coordinateVariantsWithZeroTractionPressure: number;
    readonly forceBalanceVariantCount: number;
    readonly reviewStatus:
      | "coordinate-contract-transfer-signal"
      | "coordinate-contract-mixed"
      | "coordinate-contract-no-go";
  };
  readonly decision: {
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly hiddenBloodVolumeSource: false;
    readonly pressureSubstitution: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const RAW_TRACTION_VARIANT_ID = "raw-velocity-traction12-flow10-cap20" as const;
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

export const ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1: readonly VariantV1[] = [
  variant("raw-traction-reference", "raw-reference", 20, 0, 0, 0, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("capacity-coordinate-drive2-stiff2-damp06", "capacity-work-coordinate", 20, 2, 2, 0.6, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("capacity-coordinate-drive4-stiff2-damp06", "capacity-work-coordinate", 20, 4, 2, 0.6, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("capacity-coordinate-drive6-stiff3-damp10", "capacity-work-coordinate", 20, 6, 3, 1.0, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("capacity-coordinate-drive8-stiff4-damp12", "capacity-work-coordinate", 20, 8, 4, 1.2, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20),
  variant("capacity-coordinate-drive4-stiff1-damp04-fast", "capacity-work-coordinate", 20, 4, 1, 0.4, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12),
  variant("capacity-coordinate-drive6-stiff2-damp06-slow", "capacity-work-coordinate", 20, 6, 2, 0.6, 0.045, 1.2, 0.06, 0.62, 0.075, 0.34, 0.12, 0.25),
  variant("force-balance-drive4-hyd004-stiff2-damp06", "force-balance-coordinate", 20, 4, 2, 0.6, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.04),
  variant("force-balance-drive5-hyd006-stiff2-damp08", "force-balance-coordinate", 20, 5, 2, 0.8, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.06),
  variant("force-balance-drive6-hyd008-stiff3-damp10", "force-balance-coordinate", 20, 6, 3, 1.0, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.08),
  variant("force-balance-drive8-hyd010-stiff4-damp12", "force-balance-coordinate", 20, 8, 4, 1.2, 0.035, 1.8, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.10),
  variant("force-balance-drive6-hyd004-stiff2-damp06-fast", "force-balance-coordinate", 20, 6, 2, 0.6, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.04),
  variant("force-balance-cap28-drive4-hyd002-stiff1-damp04-fast", "force-balance-coordinate", 28, 4, 1, 0.4, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.02),
  variant("force-balance-cap28-drive6-hyd004-stiff2-damp06-fast", "force-balance-coordinate", 28, 6, 2, 0.6, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.04),
  variant("force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", "force-balance-coordinate", 32, 6, 2, 0.6, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.04),
  variant("force-balance-cap28-drive8-hyd006-stiff3-damp08", "force-balance-coordinate", 28, 8, 3, 0.8, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.06),
  variant("force-balance-vel06-drive4-hyd002-cap28", "force-balance-coordinate", 28, 4, 1, 0.4, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.02, 0.6),
  variant("force-balance-vel10-drive4-hyd002-cap28", "force-balance-coordinate", 28, 4, 1, 0.4, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.02, 1.0),
  variant("force-balance-vel12-drive4-hyd002-cap28", "force-balance-coordinate", 28, 4, 1, 0.4, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.02, 1.2),
  variant("force-balance-vel08-drive3-hyd001-cap32", "force-balance-coordinate", 32, 3, 1, 0.35, 0.030, 2.4, 0.06, 0.52, 0.040, 0.22, 0.055, 0.12, 0.01, 0.8),
];

export function runAtrialAVPlaneCoordinateContractReviewBenchV1():
AtrialAVPlaneCoordinateContractReviewReportV1 {
  const rawParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rawReferenceVariant = ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1[0]!;
  const baselineRuns = rawParams.map((params) =>
    runLeftHeartSubsystemV2(applyCoordinateContractVariant(params, rawReferenceVariant))
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) =>
    ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1.map((variantConfig) => {
      const run = runLeftHeartSubsystemV2(applyCoordinateContractVariant(rawParams[index]!, variantConfig));
      return rowForRun(profileId, variantConfig, baselineRuns[index]!, run);
    })
  );
  const variantSummaries = ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1.map((variantConfig) =>
    summarizeVariant(variantConfig.variantId, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const rawReference = variantSummaries.find((summary) => summary.variantId === "raw-traction-reference")!;
  const coordinateSummaries = variantSummaries.filter((summary) => summary.variantId !== rawReference.variantId);
  const bestCoordinateVariant = [...coordinateSummaries].sort((a, b) =>
    b.sourceSurfacePass - a.sourceSurfacePass
    || b.topologyPass - a.topologyPass
    || b.mvfCleanCount - a.mvfCleanCount
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const forceBalanceSummaries = variantSummaries.filter((summary) =>
    ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1.find((variantConfig) =>
      variantConfig.variantId === summary.variantId
    )?.mode === "force-balance-coordinate"
  );
  const bestForceBalanceVariant = [...forceBalanceSummaries].sort((a, b) =>
    b.sourcePreservingTopologyPass - a.sourcePreservingTopologyPass
    || b.topologyPass - a.topologyPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfCleanCount - a.mvfCleanCount
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const coordinateVariantsImprovingRawSourceAndKeepingTopology = coordinateSummaries.filter((summary) =>
    summary.sourceSurfacePass > rawReference.sourceSurfacePass
    && summary.topologyPass >= rawReference.topologyPass
  ).length;
  const coordinateVariantsWithZeroTractionPressure = coordinateSummaries.filter((summary) =>
    summary.maxTractionPressureMmHg === 0
  ).length;
  const forceBalanceVariantCount =
    ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1.filter((variantConfig) =>
      variantConfig.mode === "force-balance-coordinate"
    ).length;
  const reviewStatus =
    coordinateVariantsImprovingRawSourceAndKeepingTopology > 0
      ? "coordinate-contract-transfer-signal"
      : bestCoordinateVariant.sourceSurfacePass > 0 || bestCoordinateVariant.topologyPass > 0
        ? "coordinate-contract-mixed"
        : "coordinate-contract-no-go";
  return {
    reportId: ATRIAL_AV_PLANE_COORDINATE_CONTRACT_REVIEW_REPORT_ID_V1,
    gateId: "atrialAVPlaneCoordinateContractReviewV1",
    mode: "left-heart-av-plane-coordinate-contract-review-no-runtime",
    variants: ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1,
    rows,
    variantSummaries,
    rawReference,
    bestCoordinateVariant,
    bestForceBalanceVariant,
    summary: {
      totalProfiles: 7,
      rawSourceSurfacePass: rawReference.sourceSurfacePass,
      rawTopologyPass: rawReference.topologyPass,
      rawMvfCleanCount: rawReference.mvfCleanCount,
      bestCoordinateVariantId: bestCoordinateVariant.variantId,
      bestCoordinateSourceSurfacePass: bestCoordinateVariant.sourceSurfacePass,
      bestCoordinateTopologyPass: bestCoordinateVariant.topologyPass,
      bestCoordinateMvfCleanCount: bestCoordinateVariant.mvfCleanCount,
      bestForceBalanceVariantId: bestForceBalanceVariant.variantId,
      bestForceBalanceSourceSurfacePass: bestForceBalanceVariant.sourceSurfacePass,
      bestForceBalanceTopologyPass: bestForceBalanceVariant.topologyPass,
      bestForceBalanceSourcePreservingTopologyPass: bestForceBalanceVariant.sourcePreservingTopologyPass,
      bestForceBalanceMvfCleanCount: bestForceBalanceVariant.mvfCleanCount,
      coordinateVariantsImprovingRawSourceAndKeepingTopology,
      coordinateVariantsWithZeroTractionPressure,
      forceBalanceVariantCount,
      reviewStatus,
    },
    decision: {
      nextAction: reviewStatus === "coordinate-contract-transfer-signal"
        ? "Use the capacity/work coordinate signal as the next AV-plane traction contract candidate while keeping runtime AV-plane enablement blocked."
        : bestForceBalanceVariant.topologyPass > bestCoordinateVariant.topologyPass
          ? "Simple force-balance coordinate partially restores opposed lobes but does not preserve the raw source/MVF surface. Keep raw traction as the topology reference and move next to an implicit wall-work / LA-MV residual contract rather than more scalar coordinate sweeps."
          : "Capacity-only AV-plane coordinate is not sufficient. Next AV-plane contract needs a force-balance coordinate that couples capacity, pressure, valve flow, and work without hidden blood volume.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-enable",
        "hidden-blood-volume-source",
        "atrial-pressure-substitution",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      hiddenBloodVolumeSource: false,
      pressureSubstitution: false,
      LandAtrialUnlock: false,
    },
  };
}

export function applyCoordinateContractVariant(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: VariantV1,
): LeftHeartSubsystemParamsV2 {
  const rawTractionVariant = ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1.find((config) =>
    config.variantId === RAW_TRACTION_VARIANT_ID
  )!;
  const base = applyVelocityStatefulTractionVariantV1(params, rawTractionVariant);
  if (variantConfig.mode === "raw-reference") return base;
  const forceBalanceOverrides = variantConfig.mode === "force-balance-coordinate"
    ? {
      laLobeGeneratorMode: "av-plane-force-balance-coordinate-transaction-v1" as const,
      laEffectiveGeometryMode: "av-plane-force-balance-coordinate-transaction-v1" as const,
      laAVPlaneWorkCoordinateHydraulicGain: variantConfig.hydraulicGain,
    }
    : {
      laLobeGeneratorMode: "av-plane-capacity-work-coordinate-transaction-v1" as const,
      laEffectiveGeometryMode: "av-plane-force-position-reservoir-transaction-v1" as const,
      laAVPlaneWorkCoordinateHydraulicGain: 0,
    };
  return {
    ...base,
    ...forceBalanceOverrides,
    laReservoirGeometryGainMl: variantConfig.capacityGainMl,
    laAVPlaneReservoirTractionGainMmHgPerNormPerSec:
      variantConfig.mode === "force-balance-coordinate"
        ? variantConfig.velocityTractionGainMmHgPerNormPerSec
        : 0,
    laAVPlaneVenousReservoirCouplingGain:
      variantConfig.mode === "force-balance-coordinate" ? base.laAVPlaneVenousReservoirCouplingGain : 0,
    laAVPlaneVenousReservoirMaxFlowMlPerSec:
      variantConfig.mode === "force-balance-coordinate" ? base.laAVPlaneVenousReservoirMaxFlowMlPerSec : 0,
    laAVPlaneWorkCoordinateDriveForceN: variantConfig.driveForceN,
    laAVPlaneWorkCoordinateHydraulicGain: variantConfig.hydraulicGain,
    laAVPlaneWorkCoordinateStiffnessNPerNorm: variantConfig.stiffnessNPerNorm,
    laAVPlaneWorkCoordinateDampingNsecPerNorm: variantConfig.dampingNsecPerNorm,
    laAVPlaneWorkCoordinateMassKg: variantConfig.massKg,
    laAVPlaneWorkCoordinateMaxVelocityNormPerSec: variantConfig.maxVelocityNormPerSec,
    laReservoirSuctionStartTheta: variantConfig.reservoirStartTheta,
    laReservoirSuctionEndTheta: variantConfig.reservoirEndTheta,
    laAVPlaneReservoirCapacityRiseTauSec: variantConfig.riseTauSec,
    laAVPlaneReservoirCapacityFallTauSec: variantConfig.fallTauSec,
    laAVPlaneReservoirCapacityReleaseTauSec: variantConfig.releaseTauSec,
    laAVPlaneReservoirCapacityMvOpenReleaseThreshold01: variantConfig.mvReleaseThreshold01,
    laEffectiveGeometryVelocityScaleCmPerSec: 2.4,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  variantConfig: VariantV1,
  baseline: ReturnType<typeof runLeftHeartSubsystemV2>,
  run: ReturnType<typeof runLeftHeartSubsystemV2>,
): RowV1 {
  const beat = run.finalBeatSamples;
  const baselineBeat = baseline.finalBeatSamples;
  const dtSec = 1 / Math.max(run.params.sampleRateHz, 1e-9);
  const baselineDtSec = 1 / Math.max(baseline.params.sampleRateHz, 1e-9);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const mvForwardPeakCount = positivePeakCount(qMv);
  const mvForwardVolumeRatio = round(
    forwardFlowVolume(qMv, dtSec)
      / Math.max(forwardFlowVolume(baselineBeat.map((sample) => sample.qMvMlPerSec), baselineDtSec), 1e-9),
  );
  const aovForwardVolumeRatio = round(
    forwardFlowVolume(qAov, dtSec)
      / Math.max(forwardFlowVolume(baselineBeat.map((sample) => sample.qAovMlPerSec), baselineDtSec), 1e-9),
  );
  const lobeQuality = lobeQualityFor(beat);
  const maxHiddenBloodVolumeSourceMl =
    round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl)));
  const maxMassResidualAbsMl = round(maxAbs(beat.map((sample) => sample.massResidualMl)));
  const sourceFailures = sourceSurfaceFailureReasons({
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    maxMassResidualAbsMl,
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
  });
  const topologyFailures = lobeQuality.pass ? [] : ["la-pv-lobe-quality-fail"];
  const hiddenVolumeFailures = maxHiddenBloodVolumeSourceMl === 0 ? [] : ["hidden-blood-volume-source"];
  return {
    profileId,
    variantId: variantConfig.variantId,
    sourceSurfaceStatus: sourceFailures.length === 0 ? "pass" : "fail",
    topologyStatus: topologyFailures.length === 0 && hiddenVolumeFailures.length === 0 ? "pass" : "fail",
    mvfClean: mvForwardPeakCount === 2 && mvShape.c1ContinuityScore <= 0.42,
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    maxZNorm: round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinateZNorm))),
    maxZDotNormPerSec: round(maxAbs(beat.map((sample) => sample.laAVPlaneWorkCoordinateZDotNormPerSec))),
    maxDriveForceN: round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinateDriveForceN))),
    maxHydraulicForceN:
      round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinateHydraulicForceN))),
    maxNetForceN: round(maxAbs(beat.map((sample) => sample.laAVPlaneWorkCoordinateNetForceN))),
    maxWorkCoordinatePressureMmHg:
      round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinatePressureMmHg))),
    maxTractionPressureMmHg:
      round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneReservoirTractionPressureMmHg))),
    maxHiddenBloodVolumeSourceMl,
    maxMassResidualAbsMl,
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
    lobeQuality,
    failureReasons: [
      ...sourceFailures,
      ...topologyFailures,
      ...hiddenVolumeFailures,
    ],
  };
}

function sourceSurfaceFailureReasons(row: {
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
}): readonly string[] {
  const failures: string[] = [];
  if (row.mvForwardPeakCount !== 2) failures.push("mv-forward-peak-count");
  if (row.mvC1ContinuityScore > 0.42) failures.push("mv-c1-kink");
  if (row.mvForwardVolumeRatio < 0.78 || row.mvForwardVolumeRatio > 1.22) {
    failures.push("mv-forward-volume-ratio-wide");
  }
  if (row.aovForwardVolumeRatio < 0.80 || row.aovForwardVolumeRatio > 1.20) {
    failures.push("aov-output-ratio-wide");
  }
  if (row.maxMassResidualAbsMl > 0.08) failures.push("mass-residual-wide");
  if (row.clampCount > row.baselineClampCount) failures.push("new-clamp-hit");
  return failures;
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    topologyPass: rows.filter((row) => row.topologyStatus === "pass").length,
    sourcePreservingTopologyPass:
      rows.filter((row) => row.sourceSurfaceStatus === "pass" && row.topologyStatus === "pass").length,
    mvfCleanCount: rows.filter((row) => row.mvfClean).length,
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    opposedLobeCount: rows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
    maxZNorm: round(Math.max(0, ...rows.map((row) => row.maxZNorm))),
    maxZDotNormPerSec: round(Math.max(0, ...rows.map((row) => row.maxZDotNormPerSec))),
    maxDriveForceN: round(Math.max(0, ...rows.map((row) => row.maxDriveForceN))),
    maxHydraulicForceN: round(Math.max(0, ...rows.map((row) => row.maxHydraulicForceN))),
    maxNetForceN: round(Math.max(0, ...rows.map((row) => row.maxNetForceN))),
    maxWorkCoordinatePressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxWorkCoordinatePressureMmHg))),
    maxTractionPressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureMmHg))),
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.vLoopArea))),
  };
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
    pass: failures.length === 0,
    selfIntersections,
    opposedSignedLobes,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    volumeSeparationMl: round(volumeSeparation),
    failureReasons: failures,
  };
}

function variant(
  variantId: VariantIdV1,
  mode: VariantV1["mode"],
  capacityGainMl: number,
  driveForceN: number,
  stiffnessNPerNorm: number,
  dampingNsecPerNorm: number,
  massKg: number,
  maxVelocityNormPerSec: number,
  reservoirStartTheta: number,
  reservoirEndTheta: number,
  riseTauSec: number,
  fallTauSec: number,
  releaseTauSec: number,
  mvReleaseThreshold01: number,
  hydraulicGain: number = 0,
  velocityTractionGainMmHgPerNormPerSec: number = 0,
): VariantV1 {
  return {
    variantId,
    mode,
    capacityGainMl,
    driveForceN,
    hydraulicGain,
    velocityTractionGainMmHgPerNormPerSec,
    stiffnessNPerNorm,
    dampingNsecPerNorm,
    massKg,
    maxVelocityNormPerSec,
    reservoirStartTheta,
    reservoirEndTheta,
    riseTauSec,
    fallTauSec,
    releaseTauSec,
    mvReleaseThreshold01,
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
  if (x.length < 3 || y.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < x.length; i++) {
    const j = (i + 1) % x.length;
    area += x[i]! * y[j]! - x[j]! * y[i]!;
  }
  return area / 2;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
