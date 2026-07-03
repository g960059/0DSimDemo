import {
  applyCoordinateContractVariant,
  ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneCoordinateContractReviewBench";
import {
  applyLaMvTransactionVariant,
  ATRIAL_AV_PLANE_LAMV_TRANSACTION_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneLaMvTransactionReviewBench";
import {
  applyAtrialAVPlaneTractionReservoirTransactionVariantV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneTractionReservoirTransactionBench";
import {
  applyVelocityStatefulTractionVariantV1,
  ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneVelocityStatefulTractionReviewBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemRunV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

export const FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1 =
  "full-left-av-plane-residual-routing-report-v1" as const;

export type FullLeftAVPlaneResidualRoutingVariantIdV1 =
  | "baseline-no-avp-compliance-node"
  | "raw-traction-reference"
  | "lamv-open-rate2600-threshold12"
  | "force-balance-cap32-drive6-hyd004-fast"
  | "wall-work-cap32-drive6-hyd004-fast"
  | "reference-volume-cap32-drive6-hyd004"
  | "full-residual-wallwork-fixed4-pv24-mvsoft"
  | "full-residual-wallwork-fixed6-pv36-mvsoft"
  | "full-residual-forcebalance-fixed6-pv36-mvsoft"
  | "state-velocity-force-fixed6-pv36-mvsoft"
  | "state-velocity-wall-fixed6-pv36-mvsoft"
  | "smooth-core-force-fixed6-pv36-mvsoft"
  | "smooth-core-wall-fixed6-pv36-mvsoft"
  | "smooth-core-wall-fixed8-pv40-mvsoft"
  | "v2-force-fixed8-pv36-mvsoft"
  | "v2-force-fixed10-pv44-mvsoft"
  | "v2-wall-cap32-fixed6-pv36-mvsoft"
  | "v2-wall-cap32-fixed8-pv36-mvsoft"
  | "v2-wall-fixed8-pv36-mvsoft"
  | "v2-wall-fixed10-pv44-mvsoft"
  | "v3-wall-fixed8-pv36-mvloss"
  | "v3-wall-fixed10-pv44-mvloss"
  | "v3-force-fixed8-pv36-mvloss";

type VariantFamilyV1 =
  | "baseline"
  | "raw-traction"
  | "lamv-open"
  | "force-balance"
  | "wall-work"
  | "reference-volume"
  | "full-left-residual"
  | "state-velocity-readback"
  | "smooth-full-left-core"
  | "full-left-residual-v2"
  | "full-left-residual-v3";

type VariantV1 = {
  readonly variantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly family: VariantFamilyV1;
  readonly sourceVariantId: string;
  readonly fixedPointIterations: number;
  readonly fixedPointRelaxation: number;
  readonly pvComplianceMlPerMmHg: number;
  readonly pvSourceResistanceMmHgSecPerMl: number;
  readonly mvInertanceMmHgSec2PerMl: number;
  readonly mvBernoulliMmHgSec2PerMl2: number;
};

type PhaseOrientedPvQualityV1 = {
  readonly pass: boolean;
  readonly selfIntersections: number;
  readonly opposedSignedLobes: boolean;
  readonly aLoopArea: number;
  readonly vLoopArea: number;
  readonly volumeSeparationMl: number;
  readonly mvOpeningIndex: number | null;
  readonly mvClosureIndex: number | null;
  readonly mvOpeningPressureMmHg: number | null;
  readonly mvClosurePressureMmHg: number | null;
  readonly postOpeningPressureDropMmHg: number;
  readonly postOpeningVolumeDropMl: number;
  readonly conduitBelowReservoirChordFraction: number;
  readonly meanConduitBelowReservoirChordMmHg: number;
  readonly phaseOrientationPass: boolean;
  readonly maxPvTangentAngleJumpDeg: number;
  readonly mvOpeningTangentAngleJumpDeg: number;
  readonly lowerVLoopTangentAngleJumpDeg: number;
  readonly phaseC1Pass: boolean;
  readonly failureReasons: readonly string[];
};

type PrimeWaveQualityV1 = {
  readonly pass: boolean;
  readonly sPrimePeakAbsCmPerSec: number;
  readonly ePrimePeakAbsCmPerSec: number;
  readonly aPrimePeakAbsCmPerSec: number;
  readonly maxC1ContinuityScore: number;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly variantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly family: VariantFamilyV1;
  readonly sourceSurfacePass: boolean;
  readonly phaseOrientedPvPass: boolean;
  readonly phaseC1Pass: boolean;
  readonly mvfClean: boolean;
  readonly primeWaveformPass: boolean;
  readonly hiddenVolumeClean: boolean;
  readonly sourcePreservingPhasePv: boolean;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly maxTransactionResidualNormMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxWorkCoordinatePressureMmHg: number;
  readonly maxZNorm: number;
  readonly maxZDotNormPerSec: number;
  readonly maxMvQDotAbsMlPerSec2: number;
  readonly maxMvPressureFlowResidualAbsMmHg: number;
  readonly maxMvReverseProjectionAbsMlPerSec: number;
  readonly pulmonaryVenousForwardVolumeRatio: number;
  readonly qAvPlaneKinematicForwardVolumeMl: number;
  readonly phasePv: PhaseOrientedPvQualityV1;
  readonly prime: PrimeWaveQualityV1;
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly family: VariantFamilyV1;
  readonly sourceSurfacePass: number;
  readonly phaseOrientedPvPass: number;
  readonly sourcePreservingPhasePv: number;
  readonly mvfClean: number;
  readonly phaseC1Pass: number;
  readonly primeWaveformPass: number;
  readonly hiddenVolumeClean: number;
  readonly maxVLoopArea: number;
  readonly maxPostOpeningPressureDropMmHg: number;
  readonly maxPostOpeningVolumeDropMl: number;
  readonly maxConduitBelowReservoirChordFraction: number;
  readonly maxPvTangentAngleJumpDeg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxTransactionResidualNormMl: number;
  readonly maxPrimeC1ContinuityScore: number;
};

export type FullLeftAVPlaneResidualRoutingReportV1 = {
  readonly reportId: typeof FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1;
  readonly gateId: "fullLeftAVPlaneResidualRoutingV1";
  readonly mode: "full-left-heart-la-avplane-mv-pv-routing-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestOverallVariant: VariantSummaryV1;
  readonly bestFullResidualVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestOverallVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestOverallSourcePreservingPhasePv: number;
    readonly bestOverallPhaseOrientedPvPass: number;
    readonly bestOverallSourceSurfacePass: number;
    readonly bestFullResidualVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestFullResidualSourcePreservingPhasePv: number;
    readonly bestFullResidualPhaseOrientedPvPass: number;
    readonly bestFullResidualSourceSurfacePass: number;
    readonly bestSmoothCoreVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestSmoothCoreSourcePreservingPhasePv: number;
    readonly bestSmoothCorePhaseOrientedPvPass: number;
    readonly bestSmoothCoreSourceSurfacePass: number;
    readonly bestSmoothCorePrimeWaveformPass: number;
    readonly bestV2VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV2SourcePreservingPhasePv: number;
    readonly bestV2PhaseOrientedPvPass: number;
    readonly bestV2SourceSurfacePass: number;
    readonly bestV2MvfClean: number;
    readonly bestV2PrimeWaveformPass: number;
    readonly bestV3VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV3SourcePreservingPhasePv: number;
    readonly bestV3PhaseOrientedPvPass: number;
    readonly bestV3SourceSurfacePass: number;
    readonly bestV3MvfClean: number;
    readonly bestV3PrimeWaveformPass: number;
    readonly variantsWithAnySourcePreservingPhasePv: number;
    readonly fullResidualVariantsWithAnyPhasePv: number;
    readonly reviewStatus:
      | "full-left-avp-residual-positive-signal"
      | "full-left-avp-residual-mixed"
      | "full-left-avp-residual-no-go";
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

export type FullLeftAVPlaneResidualRoutingTrajectoryPanelV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly baseline: readonly LeftHeartSubsystemSampleV2[];
  readonly rawTraction: readonly LeftHeartSubsystemSampleV2[];
  readonly bestFullResidual: readonly LeftHeartSubsystemSampleV2[];
  readonly bestOverall: readonly LeftHeartSubsystemSampleV2[];
  readonly bestSmoothCore: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV2: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV3: readonly LeftHeartSubsystemSampleV2[];
  readonly bestFullResidualVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestOverallVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestSmoothCoreVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV2VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV3VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
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

export const FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_VARIANTS_V1: readonly VariantV1[] = [
  variant("baseline-no-avp-compliance-node", "baseline", "compliance-node-no-avplane"),
  variant("raw-traction-reference", "raw-traction", "raw-velocity-traction12-flow10-cap20"),
  variant("lamv-open-rate2600-threshold12", "lamv-open", "lamv-open-release-rate2600-threshold12"),
  variant("force-balance-cap32-drive6-hyd004-fast", "force-balance", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast"),
  variant("wall-work-cap32-drive6-hyd004-fast", "wall-work", "wall-work-cap32-drive6-hyd004-stiff2-damp06-fast"),
  variant("reference-volume-cap32-drive6-hyd004", "reference-volume", "reference-volume-cap32-drive6-hyd004-stiff2-damp06-vel08"),
  variant("full-residual-wallwork-fixed4-pv24-mvsoft", "full-left-residual", "wall-work-cap32-drive6-hyd004-stiff2-damp06-fast", 4, 0.42, 24, 0.085, 0.00042, 5e-6),
  variant("full-residual-wallwork-fixed6-pv36-mvsoft", "full-left-residual", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 6, 0.36, 36, 0.070, 0.00038, 4e-6),
  variant("full-residual-forcebalance-fixed6-pv36-mvsoft", "full-left-residual", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 6, 0.36, 36, 0.070, 0.00038, 4e-6),
  variant("state-velocity-force-fixed6-pv36-mvsoft", "state-velocity-readback", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 6, 0.36, 36, 0.070, 0.00038, 4e-6),
  variant("state-velocity-wall-fixed6-pv36-mvsoft", "state-velocity-readback", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 6, 0.36, 36, 0.070, 0.00038, 4e-6),
  variant("smooth-core-force-fixed6-pv36-mvsoft", "smooth-full-left-core", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 6, 0.36, 36, 0.070, 0.00038, 4e-6),
  variant("smooth-core-wall-fixed6-pv36-mvsoft", "smooth-full-left-core", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 6, 0.36, 36, 0.070, 0.00038, 4e-6),
  variant("smooth-core-wall-fixed8-pv40-mvsoft", "smooth-full-left-core", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 8, 0.30, 40, 0.065, 0.00036, 4e-6),
  variant("v2-force-fixed8-pv36-mvsoft", "full-left-residual-v2", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v2-force-fixed10-pv44-mvsoft", "full-left-residual-v2", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v2-wall-cap32-fixed6-pv36-mvsoft", "full-left-residual-v2", "wall-work-cap32-drive6-hyd004-stiff2-damp06-fast", 6, 0.36, 36, 0.070, 0.00038, 4e-6),
  variant("v2-wall-cap32-fixed8-pv36-mvsoft", "full-left-residual-v2", "wall-work-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v2-wall-fixed8-pv36-mvsoft", "full-left-residual-v2", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v2-wall-fixed10-pv44-mvsoft", "full-left-residual-v2", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v3-wall-fixed8-pv36-mvloss", "full-left-residual-v3", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v3-wall-fixed10-pv44-mvloss", "full-left-residual-v3", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v3-force-fixed8-pv36-mvloss", "full-left-residual-v3", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
];

export function runFullLeftAVPlaneResidualRoutingBenchV1(): FullLeftAVPlaneResidualRoutingReportV1 {
  const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineVariant = getVariant("baseline-no-avp-compliance-node");
  const baselineRuns = baseParams.map((params) => runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, baselineVariant)));
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baselineRun = baselineRuns[index]!;
    return FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_VARIANTS_V1.map((variantConfig) => {
      const run = variantConfig.variantId === baselineVariant.variantId
        ? baselineRun
        : runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(baseParams[index]!, variantConfig));
      return rowForRun(profileId, variantConfig, baselineRun, run);
    });
  });
  const variantSummaries = FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_VARIANTS_V1.map((variantConfig) =>
    summarizeVariant(variantConfig, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const bestOverallVariant = [...variantSummaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.phaseC1Pass - a.phaseC1Pass
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const fullResidualSummaries = variantSummaries.filter((summary) => summary.family === "full-left-residual");
  const smoothCoreSummaries = variantSummaries.filter((summary) => summary.family === "smooth-full-left-core");
  const v2Summaries = variantSummaries.filter((summary) => summary.family === "full-left-residual-v2");
  const v3Summaries = variantSummaries.filter((summary) => summary.family === "full-left-residual-v3");
  const bestFullResidualVariant = [...fullResidualSummaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.phaseC1Pass - a.phaseC1Pass
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestSmoothCoreVariant = [...smoothCoreSummaries].sort((a, b) =>
    b.primeWaveformPass - a.primeWaveformPass
    || b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV2Variant = [...v2Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV3Variant = [...v3Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.mvfClean - a.mvfClean
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const variantsWithAnySourcePreservingPhasePv =
    variantSummaries.filter((summary) => summary.sourcePreservingPhasePv > 0).length;
  const fullResidualVariantsWithAnyPhasePv =
    fullResidualSummaries.filter((summary) => summary.phaseOrientedPvPass > 0).length;
  const reviewStatus =
    bestFullResidualVariant.sourcePreservingPhasePv >= 3
      ? "full-left-avp-residual-positive-signal"
      : bestFullResidualVariant.phaseOrientedPvPass > 0
        || bestFullResidualVariant.sourceSurfacePass > 0
        || bestOverallVariant.sourcePreservingPhasePv > 0
        ? "full-left-avp-residual-mixed"
        : "full-left-avp-residual-no-go";
  return {
    reportId: FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1,
    gateId: "fullLeftAVPlaneResidualRoutingV1",
    mode: "full-left-heart-la-avplane-mv-pv-routing-no-runtime",
    variants: FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_VARIANTS_V1,
    rows,
    variantSummaries,
    bestOverallVariant,
    bestFullResidualVariant,
    summary: {
      totalProfiles: 7,
      bestOverallVariantId: bestOverallVariant.variantId,
      bestOverallSourcePreservingPhasePv: bestOverallVariant.sourcePreservingPhasePv,
      bestOverallPhaseOrientedPvPass: bestOverallVariant.phaseOrientedPvPass,
      bestOverallSourceSurfacePass: bestOverallVariant.sourceSurfacePass,
      bestFullResidualVariantId: bestFullResidualVariant.variantId,
      bestFullResidualSourcePreservingPhasePv: bestFullResidualVariant.sourcePreservingPhasePv,
      bestFullResidualPhaseOrientedPvPass: bestFullResidualVariant.phaseOrientedPvPass,
      bestFullResidualSourceSurfacePass: bestFullResidualVariant.sourceSurfacePass,
      bestSmoothCoreVariantId: bestSmoothCoreVariant.variantId,
      bestSmoothCoreSourcePreservingPhasePv: bestSmoothCoreVariant.sourcePreservingPhasePv,
      bestSmoothCorePhaseOrientedPvPass: bestSmoothCoreVariant.phaseOrientedPvPass,
      bestSmoothCoreSourceSurfacePass: bestSmoothCoreVariant.sourceSurfacePass,
      bestSmoothCorePrimeWaveformPass: bestSmoothCoreVariant.primeWaveformPass,
      bestV2VariantId: bestV2Variant.variantId,
      bestV2SourcePreservingPhasePv: bestV2Variant.sourcePreservingPhasePv,
      bestV2PhaseOrientedPvPass: bestV2Variant.phaseOrientedPvPass,
      bestV2SourceSurfacePass: bestV2Variant.sourceSurfacePass,
      bestV2MvfClean: bestV2Variant.mvfClean,
      bestV2PrimeWaveformPass: bestV2Variant.primeWaveformPass,
      bestV3VariantId: bestV3Variant.variantId,
      bestV3SourcePreservingPhasePv: bestV3Variant.sourcePreservingPhasePv,
      bestV3PhaseOrientedPvPass: bestV3Variant.phaseOrientedPvPass,
      bestV3SourceSurfacePass: bestV3Variant.sourceSurfacePass,
      bestV3MvfClean: bestV3Variant.mvfClean,
      bestV3PrimeWaveformPass: bestV3Variant.primeWaveformPass,
      variantsWithAnySourcePreservingPhasePv,
      fullResidualVariantsWithAnyPhasePv,
      reviewStatus,
    },
    decision: {
      nextAction: reviewStatus === "full-left-avp-residual-positive-signal"
        ? "Promote the best full-left LA-AV-plane residual into an implementation PR that owns LA wall pressure, MV opening/loss, pulmonary venous inflow, and AV-plane work in the same accepted-state transaction."
        : reviewStatus === "full-left-avp-residual-mixed"
          ? "Keep AV-plane traction as the v-loop mechanism lead, but do not enable it. Use this routing evidence to decide whether the next architecture PR should deepen full-left residual ownership or replace the wall-pressure/coordinate law."
          : "The current full-left residual wrappers do not recover owner-required phase-oriented blood-volume v-loop morphology. Stop scalar wrappers and redesign the LA wall/AV-plane/MV/PV residual equations before more variants.",
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

export function runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1(
  bestFullResidualVariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestOverallVariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestSmoothCoreVariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV2VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV3VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
): readonly FullLeftAVPlaneResidualRoutingTrajectoryPanelV1[] {
  const report = runFullLeftAVPlaneResidualRoutingBenchV1();
  const selectedFullId = bestFullResidualVariantId ?? report.summary.bestFullResidualVariantId;
  const selectedOverallId = bestOverallVariantId ?? report.summary.bestOverallVariantId;
  const selectedSmoothCoreId = bestSmoothCoreVariantId ?? report.summary.bestSmoothCoreVariantId;
  const selectedV2Id = bestV2VariantId ?? report.summary.bestV2VariantId;
  const selectedV3Id = bestV3VariantId ?? report.summary.bestV3VariantId;
  const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineVariant = getVariant("baseline-no-avp-compliance-node");
  const rawVariant = getVariant("raw-traction-reference");
  const bestFullVariant = getVariant(selectedFullId);
  const bestOverallVariant = getVariant(selectedOverallId);
  const bestSmoothCoreVariant = getVariant(selectedSmoothCoreId);
  const bestV2Variant = getVariant(selectedV2Id);
  const bestV3Variant = getVariant(selectedV3Id);
  return PROFILE_IDS.map((profileId, index) => {
    const params = baseParams[index]!;
    return {
      profileId,
      baseline: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, baselineVariant)).finalBeatSamples,
      rawTraction: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, rawVariant)).finalBeatSamples,
      bestFullResidual: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestFullVariant)).finalBeatSamples,
      bestOverall: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestOverallVariant)).finalBeatSamples,
      bestSmoothCore: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestSmoothCoreVariant)).finalBeatSamples,
      bestV2: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV2Variant)).finalBeatSamples,
      bestV3: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV3Variant)).finalBeatSamples,
      bestFullResidualVariantId: selectedFullId,
      bestOverallVariantId: selectedOverallId,
      bestSmoothCoreVariantId: selectedSmoothCoreId,
      bestV2VariantId: selectedV2Id,
      bestV3VariantId: selectedV3Id,
    };
  });
}

function getVariant(variantId: FullLeftAVPlaneResidualRoutingVariantIdV1): VariantV1 {
  const variantConfig = FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_VARIANTS_V1.find((candidate) =>
    candidate.variantId === variantId
  );
  if (variantConfig == null) throw new Error(`Unknown full-left AV-plane residual routing variant: ${variantId}`);
  return variantConfig;
}

function applyFullLeftRoutingVariant(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: VariantV1,
): LeftHeartSubsystemParamsV2 {
  if (variantConfig.family === "baseline") {
    return applyAtrialAVPlaneTractionReservoirTransactionVariantV1(
      params,
      {
        variantId: "compliance-node-no-avplane",
        reservoirCapacityGainMl: 0,
        venousCouplingGain: 0,
        maxKinematicFlowMlPerSec: 0,
        tractionGainMmHgPerNormPerSec: 0,
        pulmonarySourcePressureDeltaMmHg: 1.0,
        pulmonaryComplianceMlPerMmHg: 30,
        pulmonaryToLaResistanceMultiplier: 1.0,
        ejectionRateStartMlPerSec: 18,
        ejectionRateEndMlPerSec: 60,
        reservoirStartTheta: 0.06,
        reservoirEndTheta: 0.58,
        riseTauSec: 0.055,
        fallTauSec: 0.30,
        releaseTauSec: 0.085,
        mvClosedThreshold01: 0.20,
      } as Parameters<typeof applyAtrialAVPlaneTractionReservoirTransactionVariantV1>[1],
    );
  }
  if (variantConfig.family === "raw-traction") {
    return applyVelocityStatefulTractionVariantV1(params, findById(
      ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1,
      variantConfig.sourceVariantId,
    ));
  }
  if (variantConfig.family === "lamv-open") {
    return applyLaMvTransactionVariant(params, findById(
      ATRIAL_AV_PLANE_LAMV_TRANSACTION_VARIANTS_V1,
      variantConfig.sourceVariantId,
    ));
  }
  const coordinateBase = applyCoordinateContractVariant(params, findById(
    ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1,
    variantConfig.sourceVariantId,
  ));
  if (
    variantConfig.family !== "full-left-residual"
    && variantConfig.family !== "state-velocity-readback"
    && variantConfig.family !== "smooth-full-left-core"
    && variantConfig.family !== "full-left-residual-v2"
    && variantConfig.family !== "full-left-residual-v3"
  ) {
    return coordinateBase;
  }
  const residualBase = variantConfig.family === "smooth-full-left-core"
    ? {
      ...coordinateBase,
      laLobeGeneratorMode: "av-plane-smooth-full-left-residual-transaction-v1" as const,
      laEffectiveGeometryMode: "av-plane-smooth-full-left-residual-transaction-v1" as const,
    }
    : variantConfig.family === "state-velocity-readback"
      ? {
        ...coordinateBase,
        laEffectiveGeometryMode: "av-plane-state-velocity-readback-transaction-v1" as const,
      }
    : variantConfig.family === "full-left-residual-v2" || variantConfig.family === "full-left-residual-v3"
      ? {
        ...coordinateBase,
        laEffectiveGeometryMode: "av-plane-full-left-residual-v2-transaction-v1" as const,
      }
    : coordinateBase;
  return {
    ...residualBase,
    transactionMode: "fixed-point",
    transactionIterations: variantConfig.fixedPointIterations,
    transactionRelaxation: variantConfig.fixedPointRelaxation,
    transactionResidualToleranceMl: 0.004,
    pulmonaryVenousBoundaryMode: "compliance-node",
    pulmonaryVenousComplianceMlPerMmHg: variantConfig.pvComplianceMlPerMmHg,
    pulmonaryVenousSourceResistanceMmHgSecPerMl: variantConfig.pvSourceResistanceMmHgSecPerMl,
    mv: {
      ...residualBase.mv,
      inertanceMmHgSec2PerMl: variantConfig.mvInertanceMmHgSec2PerMl,
      bernoulliMmHgSec2PerMl2: variantConfig.mvBernoulliMmHgSec2PerMl2,
      tauOpenSec: 0.030,
      tauCloseSec: 0.026,
      maxOpenStepPerStep: 0.12,
    },
  };
}

function findById<T extends { readonly variantId: string }>(
  variants: readonly T[],
  variantId: string,
): T {
  const found = variants.find((candidate) => candidate.variantId === variantId);
  if (found == null) throw new Error(`Unknown variant id: ${variantId}`);
  return found;
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  variantConfig: VariantV1,
  baseline: LeftHeartSubsystemRunV2,
  run: LeftHeartSubsystemRunV2,
): RowV1 {
  const beat = run.finalBeatSamples;
  const baselineBeat = baseline.finalBeatSamples;
  const dtSec = 1 / Math.max(run.params.sampleRateHz, 1e-9);
  const baselineDtSec = 1 / Math.max(baseline.params.sampleRateHz, 1e-9);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const qPv = beat.map((sample) => sample.qPulmonaryVenousMlPerSec);
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
  const pulmonaryVenousForwardVolumeRatio = round(
    forwardFlowVolume(qPv, dtSec)
      / Math.max(
        forwardFlowVolume(baselineBeat.map((sample) => sample.qPulmonaryVenousMlPerSec), baselineDtSec),
        1e-9,
      ),
  );
  const phasePv = phaseOrientedPvQualityFor(beat);
  const prime = primeWaveQualityFor(beat);
  const maxMassResidualAbsMl = round(maxAbs(beat.map((sample) => sample.massResidualMl)));
  const maxTransactionResidualNormMl = round(maxAbs(beat.map((sample) => sample.transactionResidualNormMl)));
  const maxHiddenBloodVolumeSourceMl =
    round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl)));
  const mvfClean = mvForwardPeakCount === 2 && mvShape.c1ContinuityScore <= 0.42;
  const hiddenVolumeClean = maxHiddenBloodVolumeSourceMl === 0;
  const sourceFailures = sourceSurfaceFailureReasons({
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    maxMassResidualAbsMl,
    maxTransactionResidualNormMl,
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
  });
  const failureReasons = [
    ...sourceFailures,
    ...(phasePv.pass ? [] : ["phase-oriented-la-pv-fail"]),
    ...(mvfClean ? [] : ["mvf-not-clean"]),
    ...(prime.pass ? [] : ["prime-waveform-fail"]),
    ...(hiddenVolumeClean ? [] : ["hidden-blood-volume-source"]),
  ];
  const tractionPressure = beat.map((sample) => sample.laAVPlaneReservoirTractionPressureMmHg);
  const tractionSteps = tractionPressure.slice(1).map((value, index) => value - tractionPressure[index]!);
  return {
    profileId,
    variantId: variantConfig.variantId,
    family: variantConfig.family,
    sourceSurfacePass: sourceFailures.length === 0,
    phaseOrientedPvPass: phasePv.pass,
    phaseC1Pass: phasePv.phaseC1Pass,
    mvfClean,
    primeWaveformPass: prime.pass,
    hiddenVolumeClean,
    sourcePreservingPhasePv: sourceFailures.length === 0 && phasePv.pass && mvfClean && hiddenVolumeClean,
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    maxMassResidualAbsMl,
    maxTransactionResidualNormMl,
    maxHiddenBloodVolumeSourceMl,
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
    maxTractionPressureMmHg: round(Math.max(0, ...tractionPressure)),
    maxTractionPressureStepMmHg: round(maxAbs(tractionSteps)),
    maxWorkCoordinatePressureMmHg:
      round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinatePressureMmHg))),
    maxZNorm: round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinateZNorm))),
    maxZDotNormPerSec: round(maxAbs(beat.map((sample) => sample.laAVPlaneWorkCoordinateZDotNormPerSec))),
    maxMvQDotAbsMlPerSec2: round(maxAbs(beat.map((sample) => sample.mv.qDotMlPerSec2))),
    maxMvPressureFlowResidualAbsMmHg: round(maxAbs(beat.map((sample) => sample.mv.pressureFlowResidualMmHg))),
    maxMvReverseProjectionAbsMlPerSec: round(maxAbs(beat.map((sample) => sample.mv.reverseProjectionMlPerSec))),
    pulmonaryVenousForwardVolumeRatio,
    qAvPlaneKinematicForwardVolumeMl:
      round(forwardFlowVolume(beat.map((sample) => sample.qAVPlaneReservoirKinematicMlPerSec), dtSec)),
    phasePv,
    prime,
    failureReasons,
  };
}

function sourceSurfaceFailureReasons(row: {
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly maxTransactionResidualNormMl: number;
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
  if (row.maxTransactionResidualNormMl > 0.40) failures.push("transaction-residual-wide");
  if (row.clampCount > row.baselineClampCount) failures.push("new-clamp-hit");
  return failures;
}

function summarizeVariant(variantConfig: VariantV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId: variantConfig.variantId,
    family: variantConfig.family,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfacePass).length,
    phaseOrientedPvPass: rows.filter((row) => row.phaseOrientedPvPass).length,
    sourcePreservingPhasePv: rows.filter((row) => row.sourcePreservingPhasePv).length,
    mvfClean: rows.filter((row) => row.mvfClean).length,
    phaseC1Pass: rows.filter((row) => row.phaseC1Pass).length,
    primeWaveformPass: rows.filter((row) => row.primeWaveformPass).length,
    hiddenVolumeClean: rows.filter((row) => row.hiddenVolumeClean).length,
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.phasePv.vLoopArea))),
    maxPostOpeningPressureDropMmHg:
      round(Math.max(0, ...rows.map((row) => row.phasePv.postOpeningPressureDropMmHg))),
    maxPostOpeningVolumeDropMl:
      round(Math.max(0, ...rows.map((row) => row.phasePv.postOpeningVolumeDropMl))),
    maxConduitBelowReservoirChordFraction:
      round(Math.max(0, ...rows.map((row) => row.phasePv.conduitBelowReservoirChordFraction))),
    maxPvTangentAngleJumpDeg: round(Math.max(0, ...rows.map((row) => row.phasePv.maxPvTangentAngleJumpDeg))),
    maxTractionPressureStepMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureStepMmHg))),
    maxTransactionResidualNormMl: round(Math.max(0, ...rows.map((row) => row.maxTransactionResidualNormMl))),
    maxPrimeC1ContinuityScore: round(Math.max(0, ...rows.map((row) => row.prime.maxC1ContinuityScore))),
  };
}

function phaseOrientedPvQualityFor(samples: readonly LeftHeartSubsystemSampleV2[]): PhaseOrientedPvQualityV1 {
  const volumes = samples.map((sample) => sample.acceptedLaVolumeMl);
  const pressures = samples.map((sample) => sample.lapMmHg);
  const theta = samples.map((sample) => sample.theta);
  const mvOpen = samples.map((sample) => sample.mvOpen01);
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
  const phase = phaseOrientationFor(volumes, pressures, theta, mvOpen);
  const tangent = pvTangentContinuityFor(volumes, pressures, theta, phase.mvOpeningIndex);
  const failures: string[] = [];
  if (selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failures.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failures.push("v-loop-area-too-small");
  if (!opposedSignedLobes) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  failures.push(...phase.failureReasons);
  failures.push(...tangent.failureReasons);
  return {
    pass: failures.length === 0,
    selfIntersections,
    opposedSignedLobes,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    volumeSeparationMl: round(volumeSeparation),
    mvOpeningIndex: phase.mvOpeningIndex,
    mvClosureIndex: phase.mvClosureIndex,
    mvOpeningPressureMmHg: phase.mvOpeningPressureMmHg == null ? null : round(phase.mvOpeningPressureMmHg),
    mvClosurePressureMmHg: phase.mvClosurePressureMmHg == null ? null : round(phase.mvClosurePressureMmHg),
    postOpeningPressureDropMmHg: round(phase.postOpeningPressureDropMmHg),
    postOpeningVolumeDropMl: round(phase.postOpeningVolumeDropMl),
    conduitBelowReservoirChordFraction: round(phase.conduitBelowReservoirChordFraction),
    meanConduitBelowReservoirChordMmHg: round(phase.meanConduitBelowReservoirChordMmHg),
    phaseOrientationPass: phase.failureReasons.length === 0,
    maxPvTangentAngleJumpDeg: round(tangent.maxPvTangentAngleJumpDeg),
    mvOpeningTangentAngleJumpDeg: round(tangent.mvOpeningTangentAngleJumpDeg),
    lowerVLoopTangentAngleJumpDeg: round(tangent.lowerVLoopTangentAngleJumpDeg),
    phaseC1Pass: tangent.failureReasons.length === 0,
    failureReasons: failures,
  };
}

function phaseOrientationFor(
  volumes: readonly number[],
  pressures: readonly number[],
  theta: readonly number[],
  mvOpen: readonly number[],
): {
  readonly mvOpeningIndex: number | null;
  readonly mvClosureIndex: number | null;
  readonly mvOpeningPressureMmHg: number | null;
  readonly mvClosurePressureMmHg: number | null;
  readonly postOpeningPressureDropMmHg: number;
  readonly postOpeningVolumeDropMl: number;
  readonly conduitBelowReservoirChordFraction: number;
  readonly meanConduitBelowReservoirChordMmHg: number;
  readonly failureReasons: readonly string[];
} {
  const failures: string[] = [];
  const mvOpeningIndex = findMvOpeningIndex(mvOpen);
  const mvClosureIndex = mvOpeningIndex == null ? null : findMvClosureIndexAfter(mvOpen, mvOpeningIndex);
  if (mvOpeningIndex == null) failures.push("missing-mv-opening-point");
  if (mvClosureIndex == null) failures.push("missing-mv-closure-point");
  if (mvOpeningIndex == null || mvClosureIndex == null) {
    return {
      mvOpeningIndex,
      mvClosureIndex,
      mvOpeningPressureMmHg: mvOpeningIndex == null ? null : pressures[mvOpeningIndex]!,
      mvClosurePressureMmHg: mvClosureIndex == null ? null : pressures[mvClosureIndex]!,
      postOpeningPressureDropMmHg: 0,
      postOpeningVolumeDropMl: 0,
      conduitBelowReservoirChordFraction: 0,
      meanConduitBelowReservoirChordMmHg: 0,
      failureReasons: failures,
    };
  }
  const conduitIndices = conduitIndicesAfterOpening(theta, mvOpeningIndex);
  const openingPressure = pressures[mvOpeningIndex]!;
  const openingVolume = volumes[mvOpeningIndex]!;
  const conduitPressures = conduitIndices.map((index) => pressures[index]!);
  const conduitVolumes = conduitIndices.map((index) => volumes[index]!);
  const postOpeningPressureDrop = openingPressure - Math.min(openingPressure, ...conduitPressures);
  const postOpeningVolumeDrop = openingVolume - Math.min(openingVolume, ...conduitVolumes);
  const belowChordMargins = conduitIndices
    .filter((index) => index !== mvOpeningIndex)
    .map((index) =>
      reservoirChordPressureAtVolume(
        volumes[index]!,
        volumes[mvClosureIndex]!,
        pressures[mvClosureIndex]!,
        openingVolume,
        openingPressure,
      ) - pressures[index]!
    );
  const belowChordCount = belowChordMargins.filter((margin) => margin >= 0.2).length;
  const conduitBelowReservoirChordFraction =
    belowChordMargins.length === 0 ? 0 : belowChordCount / belowChordMargins.length;
  const meanConduitBelowReservoirChord = mean(belowChordMargins);
  if (conduitIndices.length < 6) failures.push("conduit-window-too-short");
  if (postOpeningPressureDrop < 0.8) failures.push("mv-opening-conduit-not-pressure-downward");
  if (postOpeningVolumeDrop < 0.8) failures.push("mv-opening-conduit-not-volume-leftward");
  if (conduitBelowReservoirChordFraction < 0.55) failures.push("conduit-not-below-reservoir-chord");
  if (meanConduitBelowReservoirChord < 0.25) failures.push("conduit-mean-not-below-reservoir-chord");
  return {
    mvOpeningIndex,
    mvClosureIndex,
    mvOpeningPressureMmHg: openingPressure,
    mvClosurePressureMmHg: pressures[mvClosureIndex]!,
    postOpeningPressureDropMmHg: postOpeningPressureDrop,
    postOpeningVolumeDropMl: postOpeningVolumeDrop,
    conduitBelowReservoirChordFraction,
    meanConduitBelowReservoirChordMmHg: meanConduitBelowReservoirChord,
    failureReasons: failures,
  };
}

function primeWaveQualityFor(samples: readonly LeftHeartSubsystemSampleV2[]): PrimeWaveQualityV1 {
  const sPrime = samples.map((sample) => sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec);
  const ePrime = samples.map((sample) => sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec);
  const aPrime = samples.map((sample) => sample.avPlaneGeometryReadback.aPrimeProxyCmPerSec);
  const sFinite = finitePrimeValues(sPrime);
  const eFinite = finitePrimeValues(ePrime);
  const aFinite = finitePrimeValues(aPrime);
  const maxPrimeC1 = Math.max(
    c1ContinuityForNullableTrace(sPrime),
    c1ContinuityForNullableTrace(ePrime),
    c1ContinuityForNullableTrace(aPrime),
  );
  const failures: string[] = [];
  if (sFinite.length === 0) failures.push("missing-s-prime-window");
  if (eFinite.length === 0) failures.push("missing-e-prime-window");
  if (aFinite.length === 0) failures.push("missing-a-prime-window");
  if (maxAbs(sFinite) < 0.5) failures.push("s-prime-too-small");
  if (maxAbs(eFinite) < 0.5) failures.push("e-prime-too-small");
  if (maxAbs(aFinite) < 0.5) failures.push("a-prime-too-small");
  if (maxPrimeC1 > 0.72) failures.push("prime-waveform-c1-kink");
  return {
    pass: failures.length === 0,
    sPrimePeakAbsCmPerSec: round(maxAbs(sFinite)),
    ePrimePeakAbsCmPerSec: round(maxAbs(eFinite)),
    aPrimePeakAbsCmPerSec: round(maxAbs(aFinite)),
    maxC1ContinuityScore: round(maxPrimeC1),
    failureReasons: failures,
  };
}

function pvTangentContinuityFor(
  volumes: readonly number[],
  pressures: readonly number[],
  theta: readonly number[],
  mvOpeningIndex: number | null,
): {
  readonly maxPvTangentAngleJumpDeg: number;
  readonly mvOpeningTangentAngleJumpDeg: number;
  readonly lowerVLoopTangentAngleJumpDeg: number;
  readonly failureReasons: readonly string[];
} {
  const angleJumps = tangentAngleJumpsDeg(volumes, pressures);
  const maxPvTangentAngleJumpDeg = Math.max(0, ...angleJumps.map((entry) => entry.angleJumpDeg));
  const mvOpeningTangentAngleJumpDeg = mvOpeningIndex == null ? 0 : localAngleJumpAt(angleJumps, mvOpeningIndex);
  const lowerVLoopIndex = mvOpeningIndex == null ? null : lowerConduitPressureIndex(pressures, theta, mvOpeningIndex);
  const lowerVLoopTangentAngleJumpDeg =
    lowerVLoopIndex == null ? 0 : localAngleJumpAt(angleJumps, lowerVLoopIndex);
  const failures: string[] = [];
  if (mvOpeningTangentAngleJumpDeg > 58) failures.push("mv-opening-pv-c1-kink");
  if (lowerVLoopTangentAngleJumpDeg > 58) failures.push("lower-v-loop-pv-c1-kink");
  if (maxPvTangentAngleJumpDeg > 122) failures.push("pv-global-c1-kink");
  return {
    maxPvTangentAngleJumpDeg,
    mvOpeningTangentAngleJumpDeg,
    lowerVLoopTangentAngleJumpDeg,
    failureReasons: failures,
  };
}

function variant(
  variantId: FullLeftAVPlaneResidualRoutingVariantIdV1,
  family: VariantFamilyV1,
  sourceVariantId: string,
  fixedPointIterations = 1,
  fixedPointRelaxation = 1,
  pvComplianceMlPerMmHg = 30,
  pvSourceResistanceMmHgSecPerMl = 0.11,
  mvInertanceMmHgSec2PerMl = 0.00065,
  mvBernoulliMmHgSec2PerMl2 = 8e-6,
): VariantV1 {
  return {
    variantId,
    family,
    sourceVariantId,
    fixedPointIterations,
    fixedPointRelaxation,
    pvComplianceMlPerMmHg,
    pvSourceResistanceMmHgSecPerMl,
    mvInertanceMmHgSec2PerMl,
    mvBernoulliMmHgSec2PerMl2,
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

function findMvOpeningIndex(mvOpen: readonly number[]): number | null {
  const threshold = 0.45;
  const candidates: number[] = [];
  for (let i = 0; i < mvOpen.length; i++) {
    const previous = mvOpen[(i + mvOpen.length - 1) % mvOpen.length]!;
    const current = mvOpen[i]!;
    if (previous < threshold && current >= threshold) candidates.push(i);
  }
  if (candidates.length > 0) return candidates[0]!;
  let maxDelta = 0;
  let maxIndex: number | null = null;
  for (let i = 1; i < mvOpen.length; i++) {
    const delta = mvOpen[i]! - mvOpen[i - 1]!;
    if (delta > maxDelta) {
      maxDelta = delta;
      maxIndex = i;
    }
  }
  return maxDelta > 0.08 ? maxIndex : null;
}

function findMvClosureIndexAfter(mvOpen: readonly number[], openingIndex: number): number | null {
  const threshold = 0.45;
  for (let step = 1; step <= mvOpen.length; step++) {
    const index = (openingIndex + step) % mvOpen.length;
    const previous = mvOpen[(index + mvOpen.length - 1) % mvOpen.length]!;
    const current = mvOpen[index]!;
    if (previous >= threshold && current < threshold) return index;
  }
  let minDelta = 0;
  let minIndex: number | null = null;
  for (let step = 1; step < mvOpen.length; step++) {
    const index = (openingIndex + step) % mvOpen.length;
    const previous = mvOpen[(index + mvOpen.length - 1) % mvOpen.length]!;
    const delta = mvOpen[index]! - previous;
    if (delta < minDelta) {
      minDelta = delta;
      minIndex = index;
    }
  }
  return minDelta < -0.08 ? minIndex : null;
}

function conduitIndicesAfterOpening(theta: readonly number[], openingIndex: number): readonly number[] {
  const indices: number[] = [];
  for (let step = 0; step < theta.length; step++) {
    const index = (openingIndex + step) % theta.length;
    indices.push(index);
    if (step > 0 && theta[index]! >= PRE_A_THETA) break;
  }
  return indices;
}

function reservoirChordPressureAtVolume(
  volume: number,
  closureVolume: number,
  closurePressure: number,
  openingVolume: number,
  openingPressure: number,
): number {
  const denom = openingVolume - closureVolume;
  if (Math.abs(denom) < 1e-9) return Math.max(closurePressure, openingPressure);
  const t = Math.max(0, Math.min(1, (volume - closureVolume) / denom));
  return closurePressure + t * (openingPressure - closurePressure);
}

function lowerConduitPressureIndex(
  pressures: readonly number[],
  theta: readonly number[],
  openingIndex: number,
): number | null {
  const indices = conduitIndicesAfterOpening(theta, openingIndex);
  let selected: number | null = null;
  let minPressure = Number.POSITIVE_INFINITY;
  for (const index of indices) {
    if (pressures[index]! < minPressure) {
      minPressure = pressures[index]!;
      selected = index;
    }
  }
  return selected;
}

function tangentAngleJumpsDeg(
  x: readonly number[],
  y: readonly number[],
): readonly { readonly index: number; readonly angleJumpDeg: number }[] {
  const out: { index: number; angleJumpDeg: number }[] = [];
  if (x.length < 5 || y.length < 5) return out;
  const xScale = Math.max(Math.max(...x) - Math.min(...x), 1e-9);
  const yScale = Math.max(Math.max(...y) - Math.min(...y), 1e-9);
  for (let i = 1; i < x.length - 1; i++) {
    const prevAngle = Math.atan2((y[i]! - y[i - 1]!) / yScale, (x[i]! - x[i - 1]!) / xScale);
    const nextAngle = Math.atan2((y[i + 1]! - y[i]!) / yScale, (x[i + 1]! - x[i]!) / xScale);
    out.push({ index: i, angleJumpDeg: Math.abs(wrapAngleRad(nextAngle - prevAngle)) * 180 / Math.PI });
  }
  return out;
}

function localAngleJumpAt(
  angleJumps: readonly { readonly index: number; readonly angleJumpDeg: number }[],
  index: number,
): number {
  return Math.max(0, ...angleJumps
    .filter((entry) => Math.abs(entry.index - index) <= 1)
    .map((entry) => entry.angleJumpDeg));
}

function finitePrimeValues(values: readonly (number | null)[]): readonly number[] {
  return values.filter((value): value is number => value != null && Number.isFinite(value));
}

function c1ContinuityForNullableTrace(values: readonly (number | null)[]): number {
  const finite = finitePrimeValues(values);
  if (finite.length < 4) return Number.POSITIVE_INFINITY;
  return c1ContinuityForTrace(finite);
}

function c1ContinuityForTrace(values: readonly number[]): number {
  const slopes: number[] = [];
  for (let i = 1; i < values.length; i++) slopes.push(values[i]! - values[i - 1]!);
  const maxSlope = maxAbs(slopes);
  if (maxSlope <= 1e-12) return 0;
  let maxJump = 0;
  for (let i = 1; i < slopes.length; i++) maxJump = Math.max(maxJump, Math.abs(slopes[i]! - slopes[i - 1]!));
  return maxJump / maxSlope;
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

function wrapAngleRad(value: number): number {
  let out = value;
  while (out > Math.PI) out -= 2 * Math.PI;
  while (out < -Math.PI) out += 2 * Math.PI;
  return out;
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
