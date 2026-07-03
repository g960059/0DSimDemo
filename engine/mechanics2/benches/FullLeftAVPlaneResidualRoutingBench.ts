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
  | "v3-force-fixed8-pv36-mvloss"
  | "v4-force-veltarget-fixed8-pv36-mvsoft"
  | "v4-force-veltarget-fixed10-pv44-mvsoft"
  | "v4-force-veltarget-fixed8-pv36-mvloss"
  | "v4-wall-veltarget-fixed8-pv36-mvsoft"
  | "v5-force-phaseowned-fixed8-pv36-mvsoft"
  | "v5-force-phaseowned-fixed10-pv44-mvsoft"
  | "v5-force-phaseowned-fixed8-pv36-mvloss"
  | "v5-wall-phaseowned-fixed8-pv36-mvsoft"
  | "v6-force-refcap-fixed8-pv36-mvsoft"
  | "v6-force-refcap-fixed10-pv44-mvsoft"
  | "v6-force-refcap-fixed8-pv36-mvloss"
  | "v6-wall-refcap-fixed8-pv36-mvsoft"
  | "v6-force-refcap-vel06-fixed10-pv44-mvsoft"
  | "v6-refvol-refcap-vel06-fixed10-pv44-mvsoft"
  | "v7-force-refwall-fixed10-pv44-mvsoft"
  | "v7-force-refwall-vel06-fixed10-pv44-mvsoft"
  | "v8-force-refcap-venous-fixed8-pv36-mvsoft"
  | "v8-force-refcap-venous-fixed10-pv44-mvsoft"
  | "v8-force-refcap-venous-fixed8-pv36-mvloss"
  | "v8-wall-refcap-venous-fixed8-pv36-mvsoft"
  | "v8-force-refcap-venous-vel06-fixed10-pv44-mvsoft"
  | "v9-force-dynref-fixed8-pv36-mvsoft"
  | "v9-force-dynref-fixed10-pv44-mvsoft"
  | "v9-force-dynref-fixed8-pv36-mvloss"
  | "v9-wall-dynref-fixed8-pv36-mvsoft"
  | "v9-force-dynref-vel06-fixed10-pv44-mvsoft"
  | "v10-force-separated-fixed8-pv36-mvloss"
  | "v10-force-separated-fixed10-pv44-mvloss"
  | "v10-wall-separated-fixed8-pv36-mvloss"
  | "v10-force-separated-vel06-fixed10-pv44-mvsoft"
  | "v11-force-accepted-fixed10-pv44-mvsoft"
  | "v11-force-accepted-fixed12-pv48-mvsoft"
  | "v11-wall-accepted-fixed10-pv44-mvloss"
  | "v11-force-accepted-vel06-fixed12-pv48-mvsoft"
  | "v11-force-accepted-late12-fixed12-pv48-mvsoft"
  | "v11-force-accepted-late16-slowrel-fixed14-pv52-mvsoft"
  | "v11-wall-accepted-late12-slowrel-fixed12-pv48-mvloss"
  | "v11-force-accepted-fixed30-pv52-mvsoft"
  | "v11-force-accepted-mvsmooth-fixed14-pv52"
  | "v11-wall-accepted-mvsmooth-fixed14-pv52"
  | "v12-force-effcav-pr125-fixed8-pv36-mvloss"
  | "v12-force-effcav-pr150-fixed8-pv36-mvloss"
  | "v12-force-effcav-pr175-fixed8-pv36-mvloss"
  | "v12-force-effcav-pr150-fixed10-pv44-mvsoft"
  | "v12-force-effcav-pr150-fixed10-pv44-mvloss"
  | "v12-wall-effcav-pr150-fixed8-pv36-mvloss"
  | "v12-force-effcav-late12-pr150-fixed10-pv44-mvloss"
  | "v12-force-effcav-pr150-primevel04-fixed8-pv36-mvloss"
  | "v12-force-effcav-pr150-primevel08-fixed8-pv36-mvloss"
  | "v12-wall-effcav-pr150-primevel04-fixed8-pv36-mvloss"
  | "v12-wall-effcav-pr150-primevel08-fixed8-pv36-mvloss"
  | "v12-force-effcav-pr150-primevel16-fixed8-pv36-mvloss"
  | "v12-force-effcav-pr150-primevel24-fixed8-pv36-mvloss"
  | "v12-wall-effcav-pr150-primevel16-fixed8-pv36-mvloss"
  | "v12-wall-effcav-pr150-primevel24-fixed8-pv36-mvloss"
  | "v13-wall-effcav-c1accel04-pr150-fixed8-pv36-mvloss"
  | "v13-wall-effcav-c1accel08-pr150-fixed8-pv36-mvloss"
  | "v13-wall-effcav-c1accel12-pr150-fixed8-pv36-mvloss"
  | "v13-wall-effcav-c1accel16-pr150-fixed8-pv36-mvloss"
  | "v13-force-effcav-c1accel08-pr150-fixed8-pv36-mvloss"
  | "v13-force-effcav-c1accel12-pr150-fixed10-pv44-mvloss"
  | "v14-wall-effcav-traj06-pr150-fixed8-pv36-mvloss"
  | "v14-wall-effcav-traj10-pr150-fixed8-pv36-mvloss"
  | "v14-wall-effcav-traj14-pr150-fixed8-pv36-mvloss"
  | "v14-wall-effcav-traj20-pr150-fixed8-pv36-mvloss"
  | "v14-force-effcav-traj10-pr150-fixed8-pv36-mvloss"
  | "v14-force-effcav-traj14-pr175-fixed10-pv44-mvloss"
  | "v15-wall-effcav-traj20-mvtarget05-pr150-fixed8-pv36-mvloss"
  | "v15-wall-effcav-traj20-mvtarget10-pr150-fixed8-pv36-mvloss"
  | "v15-wall-effcav-traj20-mvtarget10-pr150-fixed10-pv44-mvsmooth"
  | "v15-force-effcav-traj14-mvtarget10-pr175-fixed10-pv44-mvloss"
  | "v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss"
  | "v16-wall-effcav-traj20-mvimplicit05-pr150-fixed8-pv36-mvloss"
  | "v16-wall-effcav-traj20-mvimplicit10-pr150-fixed8-pv36-mvloss"
  | "v16-force-effcav-traj14-mvimplicit02-pr175-fixed10-pv44-mvloss"
  | "v16-force-effcav-traj14-mvimplicit05-pr175-fixed10-pv44-mvloss"
  | "v16-force-effcav-traj14-mvimplicit10-pr175-fixed10-pv44-mvloss"
  | "v17-force-hyst-traj14-pr175-fixed10-pv52-mvloss"
  | "v17-force-hyst-traj20-pr175-fixed12-pv52-mvloss"
  | "v17-wall-hyst-traj20-pr150-fixed10-pv52-mvloss"
  | "v17-wall-hyst-slowrecoil-traj20-pr150-fixed12-pv56-mvsmooth"
  | "v17-force-hyst-strongcap-traj20-pr200-fixed12-pv56-mvloss"
  | "v17-wall-hyst-strongcap-traj20-pr175-fixed12-pv56-mvloss"
  | "v17-wall-hyst-strongcap-slowrecoil-traj20-pr175-fixed14-pv60-mvsmooth"
  | "v18-force-hyst2-retain-fixed12-pv56-mvsmooth"
  | "v18-wall-hyst2-retain-fixed12-pv56-mvsmooth"
  | "v18-force-hyst2-strongcap-fixed14-pv60-mvsmooth"
  | "v18-wall-hyst2-strongcap-fixed14-pv60-mvsmooth"
  | "v18-wall-hyst2-sourcebal-fixed14-pv64-mvsmooth";

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
  | "full-left-residual-v3"
  | "full-left-hybrid-velocity-residual-v4"
  | "full-left-phase-owned-residual-v5"
  | "full-left-reference-capacity-residual-v6"
  | "full-left-reference-wall-geometry-residual-v7"
  | "full-left-reference-capacity-venous-residual-v8"
  | "full-left-dynamic-reference-pressure-residual-v9"
  | "full-left-separated-capacity-residual-v10"
  | "full-left-accepted-state-residual-v11"
  | "full-left-effective-cavity-pressure-law-v12"
  | "full-left-c1-coordinate-pressure-law-v13"
  | "full-left-continuous-trajectory-law-v14"
  | "full-left-continuous-mv-coupled-law-v15"
  | "full-left-implicit-mv-state-trajectory-law-v16"
  | "full-left-reservoir-conduit-hysteresis-v17"
  | "full-left-reservoir-conduit-hysteresis-v18";

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
  readonly postOpeningInitialPressureRiseMmHg: number;
  readonly postOpeningEarlyPressureDropMmHg: number;
  readonly postOpeningEarlyVolumeDropMl: number;
  readonly xTroughVolumeRiseMl: number;
  readonly postXTroughVolumeRiseMl: number;
  readonly reservoirBelowChordFraction: number;
  readonly meanReservoirBelowChordMmHg: number;
  readonly conduitBelowReservoirChordFraction: number;
  readonly meanConduitBelowReservoirChordMmHg: number;
  readonly systolicXDescentPressureDropMmHg: number;
  readonly systolicReservoirVolumeRiseMl: number;
  readonly systolicVWavePressureRiseMmHg: number;
  readonly systolicReservoirPass: boolean;
  readonly bloodVLoopAreaPass: boolean;
  readonly reservoirBowPass: boolean;
  readonly mvOpeningTransitionPass: boolean;
  readonly mvOpeningDownstrokePass: boolean;
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
  readonly capacityAxisPhaseOrientedPvPass: boolean;
  readonly phaseC1Pass: boolean;
  readonly capacityAxisPhaseC1Pass: boolean;
  readonly mvfClean: boolean;
  readonly primeWaveformPass: boolean;
  readonly hiddenVolumeClean: boolean;
  readonly sourcePreservingPhasePv: boolean;
  readonly sourcePreservingCapacityAxisPhasePv: boolean;
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
  readonly maxReferenceCapacityShiftMl: number;
  readonly maxPressureReferenceCapacityMl: number;
  readonly maxEffectiveCavityCapacityMl: number;
  readonly maxCounterfactualFixedBloodPressureReliefMmHg: number;
  readonly maxAppliedFixedBloodPressureReliefMmHg: number;
  readonly maxBloodXDescentPressureDropMmHg: number;
  readonly phasePv: PhaseOrientedPvQualityV1;
  readonly capacityAxisPhasePv: PhaseOrientedPvQualityV1;
  readonly prime: PrimeWaveQualityV1;
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly family: VariantFamilyV1;
  readonly sourceSurfacePass: number;
  readonly phaseOrientedPvPass: number;
  readonly capacityAxisPhaseOrientedPvPass: number;
  readonly sourcePreservingPhasePv: number;
  readonly sourcePreservingCapacityAxisPhasePv: number;
  readonly mvfClean: number;
  readonly phaseC1Pass: number;
  readonly capacityAxisPhaseC1Pass: number;
  readonly primeWaveformPass: number;
  readonly hiddenVolumeClean: number;
  readonly maxVLoopArea: number;
  readonly maxCapacityAxisVLoopArea: number;
  readonly maxPostOpeningPressureDropMmHg: number;
  readonly maxCapacityAxisPostOpeningPressureDropMmHg: number;
  readonly maxPostOpeningVolumeDropMl: number;
  readonly maxCapacityAxisPostOpeningVolumeDropMl: number;
  readonly maxSystolicXDescentPressureDropMmHg: number;
  readonly maxSystolicReservoirVolumeRiseMl: number;
  readonly maxSystolicVWavePressureRiseMmHg: number;
  readonly maxConduitBelowReservoirChordFraction: number;
  readonly maxPvTangentAngleJumpDeg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxTransactionResidualNormMl: number;
  readonly maxPrimeC1ContinuityScore: number;
  readonly maxReferenceCapacityShiftMl: number;
  readonly maxPressureReferenceCapacityMl: number;
  readonly maxEffectiveCavityCapacityMl: number;
  readonly maxCounterfactualFixedBloodPressureReliefMmHg: number;
  readonly maxAppliedFixedBloodPressureReliefMmHg: number;
  readonly maxBloodXDescentPressureDropMmHg: number;
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
    readonly bestV4VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV4SourcePreservingPhasePv: number;
    readonly bestV4PhaseOrientedPvPass: number;
    readonly bestV4SourceSurfacePass: number;
    readonly bestV4MvfClean: number;
    readonly bestV4PrimeWaveformPass: number;
    readonly bestV5VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV5SourcePreservingPhasePv: number;
    readonly bestV5PhaseOrientedPvPass: number;
    readonly bestV5SourceSurfacePass: number;
    readonly bestV5MvfClean: number;
    readonly bestV5PrimeWaveformPass: number;
    readonly bestV6VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV6SourcePreservingPhasePv: number;
    readonly bestV6PhaseOrientedPvPass: number;
    readonly bestV6SourceSurfacePass: number;
    readonly bestV6MvfClean: number;
    readonly bestV6PrimeWaveformPass: number;
    readonly bestV8VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV8SourcePreservingPhasePv: number;
    readonly bestV8PhaseOrientedPvPass: number;
    readonly bestV8SourceSurfacePass: number;
    readonly bestV8MvfClean: number;
    readonly bestV8PrimeWaveformPass: number;
    readonly bestV8CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV8SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV9VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV9SourcePreservingPhasePv: number;
    readonly bestV9PhaseOrientedPvPass: number;
    readonly bestV9SourceSurfacePass: number;
    readonly bestV9MvfClean: number;
    readonly bestV9PrimeWaveformPass: number;
    readonly bestV9CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV9SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV9MaxReferenceCapacityShiftMl: number;
    readonly bestV9MaxPressureReferenceCapacityMl: number;
    readonly bestV9MaxEffectiveCavityCapacityMl: number;
    readonly bestV9MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV9MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV9MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV10VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV10SourcePreservingPhasePv: number;
    readonly bestV10PhaseOrientedPvPass: number;
    readonly bestV10SourceSurfacePass: number;
    readonly bestV10MvfClean: number;
    readonly bestV10PrimeWaveformPass: number;
    readonly bestV10CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV10SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV10MaxReferenceCapacityShiftMl: number;
    readonly bestV10MaxPressureReferenceCapacityMl: number;
    readonly bestV10MaxEffectiveCavityCapacityMl: number;
    readonly bestV10MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV10MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV10MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV11VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV11SourcePreservingPhasePv: number;
    readonly bestV11PhaseOrientedPvPass: number;
    readonly bestV11SourceSurfacePass: number;
    readonly bestV11MvfClean: number;
    readonly bestV11PrimeWaveformPass: number;
    readonly bestV11CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV11SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV11MaxReferenceCapacityShiftMl: number;
    readonly bestV11MaxPressureReferenceCapacityMl: number;
    readonly bestV11MaxEffectiveCavityCapacityMl: number;
    readonly bestV11MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV11MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV11MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV12VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV12SourcePreservingPhasePv: number;
    readonly bestV12PhaseOrientedPvPass: number;
    readonly bestV12SourceSurfacePass: number;
    readonly bestV12MvfClean: number;
    readonly bestV12PrimeWaveformPass: number;
    readonly bestV12CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV12SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV12MaxReferenceCapacityShiftMl: number;
    readonly bestV12MaxPressureReferenceCapacityMl: number;
    readonly bestV12MaxEffectiveCavityCapacityMl: number;
    readonly bestV12MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV12MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV12MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV13VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV13SourcePreservingPhasePv: number;
    readonly bestV13PhaseOrientedPvPass: number;
    readonly bestV13SourceSurfacePass: number;
    readonly bestV13MvfClean: number;
    readonly bestV13PrimeWaveformPass: number;
    readonly bestV13CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV13SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV13MaxReferenceCapacityShiftMl: number;
    readonly bestV13MaxPressureReferenceCapacityMl: number;
    readonly bestV13MaxEffectiveCavityCapacityMl: number;
    readonly bestV13MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV13MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV13MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV14VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV14SourcePreservingPhasePv: number;
    readonly bestV14PhaseOrientedPvPass: number;
    readonly bestV14SourceSurfacePass: number;
    readonly bestV14MvfClean: number;
    readonly bestV14PrimeWaveformPass: number;
    readonly bestV14CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV14SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV14MaxReferenceCapacityShiftMl: number;
    readonly bestV14MaxPressureReferenceCapacityMl: number;
    readonly bestV14MaxEffectiveCavityCapacityMl: number;
    readonly bestV14MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV14MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV14MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV15VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV15SourcePreservingPhasePv: number;
    readonly bestV15PhaseOrientedPvPass: number;
    readonly bestV15SourceSurfacePass: number;
    readonly bestV15MvfClean: number;
    readonly bestV15PrimeWaveformPass: number;
    readonly bestV15CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV15SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV15MaxReferenceCapacityShiftMl: number;
    readonly bestV15MaxPressureReferenceCapacityMl: number;
    readonly bestV15MaxEffectiveCavityCapacityMl: number;
    readonly bestV15MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV15MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV15MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV16VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV16SourcePreservingPhasePv: number;
    readonly bestV16PhaseOrientedPvPass: number;
    readonly bestV16SourceSurfacePass: number;
    readonly bestV16MvfClean: number;
    readonly bestV16PrimeWaveformPass: number;
    readonly bestV16CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV16SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV16MaxReferenceCapacityShiftMl: number;
    readonly bestV16MaxPressureReferenceCapacityMl: number;
    readonly bestV16MaxEffectiveCavityCapacityMl: number;
    readonly bestV16MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV16MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV16MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV17VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV17SourcePreservingPhasePv: number;
    readonly bestV17PhaseOrientedPvPass: number;
    readonly bestV17SourceSurfacePass: number;
    readonly bestV17MvfClean: number;
    readonly bestV17PrimeWaveformPass: number;
    readonly bestV17CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV17SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV17MaxReferenceCapacityShiftMl: number;
    readonly bestV17MaxPressureReferenceCapacityMl: number;
    readonly bestV17MaxEffectiveCavityCapacityMl: number;
    readonly bestV17MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV17MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV17MaxBloodXDescentPressureDropMmHg: number;
    readonly bestV18VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
    readonly bestV18SourcePreservingPhasePv: number;
    readonly bestV18PhaseOrientedPvPass: number;
    readonly bestV18SourceSurfacePass: number;
    readonly bestV18MvfClean: number;
    readonly bestV18PrimeWaveformPass: number;
    readonly bestV18CapacityAxisPhaseOrientedPvPass: number;
    readonly bestV18SourcePreservingCapacityAxisPhasePv: number;
    readonly bestV18MaxReferenceCapacityShiftMl: number;
    readonly bestV18MaxPressureReferenceCapacityMl: number;
    readonly bestV18MaxEffectiveCavityCapacityMl: number;
    readonly bestV18MaxCounterfactualFixedBloodPressureReliefMmHg: number;
    readonly bestV18MaxAppliedFixedBloodPressureReliefMmHg: number;
    readonly bestV18MaxBloodXDescentPressureDropMmHg: number;
    readonly variantsWithAnySourcePreservingPhasePv: number;
    readonly variantsWithAnySourcePreservingCapacityAxisPhasePv: number;
    readonly variantsWithAnyAppliedFixedBloodPressureRelief: number;
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
  readonly bestV4: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV5: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV6: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV8: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV9: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV10: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV11: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV12: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV13: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV14: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV15: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV16: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV17: readonly LeftHeartSubsystemSampleV2[];
  readonly bestV18: readonly LeftHeartSubsystemSampleV2[];
  readonly bestFullResidualVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestOverallVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestSmoothCoreVariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV2VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV3VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV4VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV5VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV6VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV8VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV9VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV10VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV11VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV12VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV13VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV14VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV15VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV16VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV17VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly bestV18VariantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const PRE_A_THETA = 0.74;
const MIN_BLOOD_X_DESCENT_PRESSURE_DROP_MMHG = 2.0;
const MIN_BLOOD_RESERVOIR_VOLUME_RISE_ML = 12.0;
const MIN_BLOOD_V_WAVE_PRESSURE_RISE_MMHG = 3.0;
const MIN_BLOOD_V_LOOP_AREA = 55.0;
const MIN_BLOOD_V_LOOP_VOLUME_SEPARATION_ML = 5.0;
const MAX_GROSS_PV_FOLD_TANGENT_JUMP_DEG = 122.0;
const MAX_MV_OPENING_TANGENT_JUMP_DEG = 58.0;
const MAX_MV_OPENING_INITIAL_PRESSURE_RISE_MMHG = 0.25;
const MIN_MV_OPENING_EARLY_PRESSURE_DROP_MMHG = 0.55;
const MIN_MV_OPENING_EARLY_VOLUME_DROP_ML = 0.55;
const MV_OPENING_EARLY_CONDUIT_PHASE_WINDOW = 0.08;
const MIN_RESERVOIR_BELOW_CHORD_FRACTION = 0.35;
const MIN_MEAN_RESERVOIR_BELOW_CHORD_MMHG = 0.35;
const MIN_X_TROUGH_VOLUME_RISE_ML = 2.0;
const MIN_POST_X_TROUGH_VOLUME_RISE_ML = 4.0;

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
  variant("v4-force-veltarget-fixed8-pv36-mvsoft", "full-left-hybrid-velocity-residual-v4", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v4-force-veltarget-fixed10-pv44-mvsoft", "full-left-hybrid-velocity-residual-v4", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v4-force-veltarget-fixed8-pv36-mvloss", "full-left-hybrid-velocity-residual-v4", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v4-wall-veltarget-fixed8-pv36-mvsoft", "full-left-hybrid-velocity-residual-v4", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v5-force-phaseowned-fixed8-pv36-mvsoft", "full-left-phase-owned-residual-v5", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v5-force-phaseowned-fixed10-pv44-mvsoft", "full-left-phase-owned-residual-v5", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v5-force-phaseowned-fixed8-pv36-mvloss", "full-left-phase-owned-residual-v5", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v5-wall-phaseowned-fixed8-pv36-mvsoft", "full-left-phase-owned-residual-v5", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v6-force-refcap-fixed8-pv36-mvsoft", "full-left-reference-capacity-residual-v6", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v6-force-refcap-fixed10-pv44-mvsoft", "full-left-reference-capacity-residual-v6", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v6-force-refcap-fixed8-pv36-mvloss", "full-left-reference-capacity-residual-v6", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v6-wall-refcap-fixed8-pv36-mvsoft", "full-left-reference-capacity-residual-v6", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v6-force-refcap-vel06-fixed10-pv44-mvsoft", "full-left-reference-capacity-residual-v6", "force-balance-vel06-drive4-hyd002-cap28", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v6-refvol-refcap-vel06-fixed10-pv44-mvsoft", "full-left-reference-capacity-residual-v6", "reference-volume-cap36-drive6-hyd003-stiff2-damp06-vel06", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v7-force-refwall-fixed10-pv44-mvsoft", "full-left-reference-wall-geometry-residual-v7", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v7-force-refwall-vel06-fixed10-pv44-mvsoft", "full-left-reference-wall-geometry-residual-v7", "force-balance-vel06-drive4-hyd002-cap28", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v8-force-refcap-venous-fixed8-pv36-mvsoft", "full-left-reference-capacity-venous-residual-v8", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v8-force-refcap-venous-fixed10-pv44-mvsoft", "full-left-reference-capacity-venous-residual-v8", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v8-force-refcap-venous-fixed8-pv36-mvloss", "full-left-reference-capacity-venous-residual-v8", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v8-wall-refcap-venous-fixed8-pv36-mvsoft", "full-left-reference-capacity-venous-residual-v8", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v8-force-refcap-venous-vel06-fixed10-pv44-mvsoft", "full-left-reference-capacity-venous-residual-v8", "force-balance-vel06-drive4-hyd002-cap28", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v9-force-dynref-fixed8-pv36-mvsoft", "full-left-dynamic-reference-pressure-residual-v9", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v9-force-dynref-fixed10-pv44-mvsoft", "full-left-dynamic-reference-pressure-residual-v9", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v9-force-dynref-fixed8-pv36-mvloss", "full-left-dynamic-reference-pressure-residual-v9", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v9-wall-dynref-fixed8-pv36-mvsoft", "full-left-dynamic-reference-pressure-residual-v9", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.070, 0.00038, 4e-6),
  variant("v9-force-dynref-vel06-fixed10-pv44-mvsoft", "full-left-dynamic-reference-pressure-residual-v9", "force-balance-vel06-drive4-hyd002-cap28", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v10-force-separated-fixed8-pv36-mvloss", "full-left-separated-capacity-residual-v10", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v10-force-separated-fixed10-pv44-mvloss", "full-left-separated-capacity-residual-v10", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v10-wall-separated-fixed8-pv36-mvloss", "full-left-separated-capacity-residual-v10", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v10-force-separated-vel06-fixed10-pv44-mvsoft", "full-left-separated-capacity-residual-v10", "force-balance-vel06-drive4-hyd002-cap28", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v11-force-accepted-fixed10-pv44-mvsoft", "full-left-accepted-state-residual-v11", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.24, 44, 0.064, 0.00036, 4e-6),
  variant("v11-force-accepted-fixed12-pv48-mvsoft", "full-left-accepted-state-residual-v11", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 12, 0.22, 48, 0.060, 0.00034, 4e-6),
  variant("v11-wall-accepted-fixed10-pv44-mvloss", "full-left-accepted-state-residual-v11", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 10, 0.24, 44, 0.086, 0.00054, 8e-6),
  variant("v11-force-accepted-vel06-fixed12-pv48-mvsoft", "full-left-accepted-state-residual-v11", "force-balance-vel06-drive4-hyd002-cap28", 12, 0.22, 48, 0.060, 0.00034, 4e-6),
  variant("v11-force-accepted-late12-fixed12-pv48-mvsoft", "full-left-accepted-state-residual-v11", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 12, 0.22, 48, 0.060, 0.00034, 4e-6),
  variant("v11-force-accepted-late16-slowrel-fixed14-pv52-mvsoft", "full-left-accepted-state-residual-v11", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 14, 0.20, 52, 0.056, 0.00032, 4e-6),
  variant("v11-wall-accepted-late12-slowrel-fixed12-pv48-mvloss", "full-left-accepted-state-residual-v11", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 12, 0.22, 48, 0.082, 0.00050, 8e-6),
  variant("v11-force-accepted-fixed30-pv52-mvsoft", "full-left-accepted-state-residual-v11", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 30, 0.12, 52, 0.056, 0.00032, 4e-6),
  variant("v11-force-accepted-mvsmooth-fixed14-pv52", "full-left-accepted-state-residual-v11", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 14, 0.20, 52, 0.075, 0.00044, 6e-6),
  variant("v11-wall-accepted-mvsmooth-fixed14-pv52", "full-left-accepted-state-residual-v11", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 14, 0.20, 52, 0.075, 0.00044, 6e-6),
  variant("v12-force-effcav-pr125-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-force-effcav-pr150-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-force-effcav-pr175-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-force-effcav-pr150-fixed10-pv44-mvsoft", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v12-force-effcav-pr150-fixed10-pv44-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v12-wall-effcav-pr150-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-force-effcav-late12-pr150-fixed10-pv44-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v12-force-effcav-pr150-primevel04-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-force-effcav-pr150-primevel08-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-wall-effcav-pr150-primevel04-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-wall-effcav-pr150-primevel08-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-force-effcav-pr150-primevel16-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-force-effcav-pr150-primevel24-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-wall-effcav-pr150-primevel16-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v12-wall-effcav-pr150-primevel24-fixed8-pv36-mvloss", "full-left-effective-cavity-pressure-law-v12", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v13-wall-effcav-c1accel04-pr150-fixed8-pv36-mvloss", "full-left-c1-coordinate-pressure-law-v13", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v13-wall-effcav-c1accel08-pr150-fixed8-pv36-mvloss", "full-left-c1-coordinate-pressure-law-v13", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v13-wall-effcav-c1accel12-pr150-fixed8-pv36-mvloss", "full-left-c1-coordinate-pressure-law-v13", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v13-wall-effcav-c1accel16-pr150-fixed8-pv36-mvloss", "full-left-c1-coordinate-pressure-law-v13", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v13-force-effcav-c1accel08-pr150-fixed8-pv36-mvloss", "full-left-c1-coordinate-pressure-law-v13", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v13-force-effcav-c1accel12-pr150-fixed10-pv44-mvloss", "full-left-c1-coordinate-pressure-law-v13", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v14-wall-effcav-traj06-pr150-fixed8-pv36-mvloss", "full-left-continuous-trajectory-law-v14", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v14-wall-effcav-traj10-pr150-fixed8-pv36-mvloss", "full-left-continuous-trajectory-law-v14", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v14-wall-effcav-traj14-pr150-fixed8-pv36-mvloss", "full-left-continuous-trajectory-law-v14", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v14-wall-effcav-traj20-pr150-fixed8-pv36-mvloss", "full-left-continuous-trajectory-law-v14", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v14-force-effcav-traj10-pr150-fixed8-pv36-mvloss", "full-left-continuous-trajectory-law-v14", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v14-force-effcav-traj14-pr175-fixed10-pv44-mvloss", "full-left-continuous-trajectory-law-v14", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v15-wall-effcav-traj20-mvtarget05-pr150-fixed8-pv36-mvloss", "full-left-continuous-mv-coupled-law-v15", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v15-wall-effcav-traj20-mvtarget10-pr150-fixed8-pv36-mvloss", "full-left-continuous-mv-coupled-law-v15", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v15-wall-effcav-traj20-mvtarget10-pr150-fixed10-pv44-mvsmooth", "full-left-continuous-mv-coupled-law-v15", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 10, 0.26, 44, 0.064, 0.00036, 4e-6),
  variant("v15-force-effcav-traj14-mvtarget10-pr175-fixed10-pv44-mvloss", "full-left-continuous-mv-coupled-law-v15", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss", "full-left-implicit-mv-state-trajectory-law-v16", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v16-wall-effcav-traj20-mvimplicit05-pr150-fixed8-pv36-mvloss", "full-left-implicit-mv-state-trajectory-law-v16", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v16-wall-effcav-traj20-mvimplicit10-pr150-fixed8-pv36-mvloss", "full-left-implicit-mv-state-trajectory-law-v16", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 8, 0.30, 36, 0.090, 0.00058, 8e-6),
  variant("v16-force-effcav-traj14-mvimplicit02-pr175-fixed10-pv44-mvloss", "full-left-implicit-mv-state-trajectory-law-v16", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v16-force-effcav-traj14-mvimplicit05-pr175-fixed10-pv44-mvloss", "full-left-implicit-mv-state-trajectory-law-v16", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v16-force-effcav-traj14-mvimplicit10-pr175-fixed10-pv44-mvloss", "full-left-implicit-mv-state-trajectory-law-v16", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.26, 44, 0.086, 0.00054, 8e-6),
  variant("v17-force-hyst-traj14-pr175-fixed10-pv52-mvloss", "full-left-reservoir-conduit-hysteresis-v17", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 10, 0.24, 52, 0.086, 0.00054, 8e-6),
  variant("v17-force-hyst-traj20-pr175-fixed12-pv52-mvloss", "full-left-reservoir-conduit-hysteresis-v17", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 12, 0.22, 52, 0.086, 0.00054, 8e-6),
  variant("v17-wall-hyst-traj20-pr150-fixed10-pv52-mvloss", "full-left-reservoir-conduit-hysteresis-v17", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 10, 0.24, 52, 0.086, 0.00054, 8e-6),
  variant("v17-wall-hyst-slowrecoil-traj20-pr150-fixed12-pv56-mvsmooth", "full-left-reservoir-conduit-hysteresis-v17", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 12, 0.22, 56, 0.075, 0.00044, 6e-6),
  variant("v17-force-hyst-strongcap-traj20-pr200-fixed12-pv56-mvloss", "full-left-reservoir-conduit-hysteresis-v17", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 12, 0.22, 56, 0.086, 0.00054, 8e-6),
  variant("v17-wall-hyst-strongcap-traj20-pr175-fixed12-pv56-mvloss", "full-left-reservoir-conduit-hysteresis-v17", "wall-work-cap36-drive6-hyd003-stiff2-damp06-fast", 12, 0.22, 56, 0.086, 0.00054, 8e-6),
  variant("v17-wall-hyst-strongcap-slowrecoil-traj20-pr175-fixed14-pv60-mvsmooth", "full-left-reservoir-conduit-hysteresis-v17", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 14, 0.20, 60, 0.075, 0.00044, 6e-6),
  variant("v18-force-hyst2-retain-fixed12-pv56-mvsmooth", "full-left-reservoir-conduit-hysteresis-v18", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 12, 0.22, 56, 0.075, 0.00044, 6e-6),
  variant("v18-wall-hyst2-retain-fixed12-pv56-mvsmooth", "full-left-reservoir-conduit-hysteresis-v18", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 12, 0.22, 56, 0.075, 0.00044, 6e-6),
  variant("v18-force-hyst2-strongcap-fixed14-pv60-mvsmooth", "full-left-reservoir-conduit-hysteresis-v18", "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast", 14, 0.20, 60, 0.075, 0.00044, 6e-6),
  variant("v18-wall-hyst2-strongcap-fixed14-pv60-mvsmooth", "full-left-reservoir-conduit-hysteresis-v18", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 14, 0.20, 60, 0.075, 0.00044, 6e-6),
  variant("v18-wall-hyst2-sourcebal-fixed14-pv64-mvsmooth", "full-left-reservoir-conduit-hysteresis-v18", "wall-work-cap40-drive6-hyd002-stiff2-damp06-vel06", 14, 0.20, 64, 0.068, 0.00038, 4e-6),
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
  const v4Summaries = variantSummaries.filter((summary) => summary.family === "full-left-hybrid-velocity-residual-v4");
  const v5Summaries = variantSummaries.filter((summary) => summary.family === "full-left-phase-owned-residual-v5");
  const v6Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-reference-capacity-residual-v6"
  );
  const v8Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-reference-capacity-venous-residual-v8"
  );
  const v9Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-dynamic-reference-pressure-residual-v9"
  );
  const v10Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-separated-capacity-residual-v10"
  );
  const v11Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-accepted-state-residual-v11"
  );
  const v12Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-effective-cavity-pressure-law-v12"
  );
  const v13Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-c1-coordinate-pressure-law-v13"
  );
  const v14Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-continuous-trajectory-law-v14"
  );
  const v15Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-continuous-mv-coupled-law-v15"
  );
  const v16Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-implicit-mv-state-trajectory-law-v16"
  );
  const v17Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-reservoir-conduit-hysteresis-v17"
  );
  const v18Summaries = variantSummaries.filter((summary) =>
    summary.family === "full-left-reservoir-conduit-hysteresis-v18"
  );
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
  const bestV4Variant = [...v4Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.mvfClean - a.mvfClean
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV5Variant = [...v5Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV6Variant = [...v6Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV8Variant = [...v8Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV9Variant = [...v9Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourcePreservingCapacityAxisPhasePv - a.sourcePreservingCapacityAxisPhasePv
    || b.capacityAxisPhaseOrientedPvPass - a.capacityAxisPhaseOrientedPvPass
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV10Variant = [...v10Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourcePreservingCapacityAxisPhasePv - a.sourcePreservingCapacityAxisPhasePv
    || b.capacityAxisPhaseOrientedPvPass - a.capacityAxisPhaseOrientedPvPass
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV11Variant = [...v11Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.phaseC1Pass - a.phaseC1Pass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourcePreservingCapacityAxisPhasePv - a.sourcePreservingCapacityAxisPhasePv
    || b.capacityAxisPhaseOrientedPvPass - a.capacityAxisPhaseOrientedPvPass
    || b.maxBloodXDescentPressureDropMmHg - a.maxBloodXDescentPressureDropMmHg
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV12Variant = [...v12Summaries].sort((a, b) =>
    b.sourcePreservingCapacityAxisPhasePv - a.sourcePreservingCapacityAxisPhasePv
    || b.capacityAxisPhaseOrientedPvPass - a.capacityAxisPhaseOrientedPvPass
    || b.capacityAxisPhaseC1Pass - a.capacityAxisPhaseC1Pass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.maxAppliedFixedBloodPressureReliefMmHg - a.maxAppliedFixedBloodPressureReliefMmHg
    || b.maxCapacityAxisVLoopArea - a.maxCapacityAxisVLoopArea
  )[0]!;
  const bestV13Variant = [...v13Summaries].sort((a, b) =>
    b.sourcePreservingCapacityAxisPhasePv - a.sourcePreservingCapacityAxisPhasePv
    || b.capacityAxisPhaseOrientedPvPass - a.capacityAxisPhaseOrientedPvPass
    || b.capacityAxisPhaseC1Pass - a.capacityAxisPhaseC1Pass
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.maxAppliedFixedBloodPressureReliefMmHg - a.maxAppliedFixedBloodPressureReliefMmHg
    || b.maxCapacityAxisVLoopArea - a.maxCapacityAxisVLoopArea
  )[0]!;
  const bestV14Variant = [...v14Summaries].sort((a, b) =>
    b.sourcePreservingCapacityAxisPhasePv - a.sourcePreservingCapacityAxisPhasePv
    || b.capacityAxisPhaseOrientedPvPass - a.capacityAxisPhaseOrientedPvPass
    || b.capacityAxisPhaseC1Pass - a.capacityAxisPhaseC1Pass
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.maxAppliedFixedBloodPressureReliefMmHg - a.maxAppliedFixedBloodPressureReliefMmHg
    || b.maxCapacityAxisVLoopArea - a.maxCapacityAxisVLoopArea
  )[0]!;
  const bestV15Variant = [...v15Summaries].sort((a, b) =>
    b.sourcePreservingCapacityAxisPhasePv - a.sourcePreservingCapacityAxisPhasePv
    || b.capacityAxisPhaseOrientedPvPass - a.capacityAxisPhaseOrientedPvPass
    || b.capacityAxisPhaseC1Pass - a.capacityAxisPhaseC1Pass
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.maxAppliedFixedBloodPressureReliefMmHg - a.maxAppliedFixedBloodPressureReliefMmHg
    || b.maxCapacityAxisVLoopArea - a.maxCapacityAxisVLoopArea
  )[0]!;
  const bestV16Variant = [...v16Summaries].sort((a, b) =>
    b.sourcePreservingCapacityAxisPhasePv - a.sourcePreservingCapacityAxisPhasePv
    || b.capacityAxisPhaseOrientedPvPass - a.capacityAxisPhaseOrientedPvPass
    || b.capacityAxisPhaseC1Pass - a.capacityAxisPhaseC1Pass
    || b.primeWaveformPass - a.primeWaveformPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.maxAppliedFixedBloodPressureReliefMmHg - a.maxAppliedFixedBloodPressureReliefMmHg
    || b.maxCapacityAxisVLoopArea - a.maxCapacityAxisVLoopArea
  )[0]!;
  const bestV17Variant = [...v17Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.phaseC1Pass - a.phaseC1Pass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.maxBloodXDescentPressureDropMmHg - a.maxBloodXDescentPressureDropMmHg
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const bestV18Variant = [...v18Summaries].sort((a, b) =>
    b.sourcePreservingPhasePv - a.sourcePreservingPhasePv
    || b.phaseOrientedPvPass - a.phaseOrientedPvPass
    || b.phaseC1Pass - a.phaseC1Pass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.mvfClean - a.mvfClean
    || b.primeWaveformPass - a.primeWaveformPass
    || b.maxBloodXDescentPressureDropMmHg - a.maxBloodXDescentPressureDropMmHg
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const variantsWithAnySourcePreservingPhasePv =
    variantSummaries.filter((summary) => summary.sourcePreservingPhasePv > 0).length;
  const variantsWithAnySourcePreservingCapacityAxisPhasePv =
    variantSummaries.filter((summary) => summary.sourcePreservingCapacityAxisPhasePv > 0).length;
  const variantsWithAnyAppliedFixedBloodPressureRelief =
    variantSummaries.filter((summary) => summary.maxAppliedFixedBloodPressureReliefMmHg > 0.1).length;
  const fullResidualVariantsWithAnyPhasePv =
    fullResidualSummaries.filter((summary) => summary.phaseOrientedPvPass > 0).length;
  const reviewStatus =
    bestFullResidualVariant.sourcePreservingPhasePv >= 3
      || bestV11Variant.sourcePreservingPhasePv >= 3
      ? "full-left-avp-residual-positive-signal"
      : bestFullResidualVariant.phaseOrientedPvPass > 0
        || bestFullResidualVariant.sourceSurfacePass > 0
        || bestOverallVariant.sourcePreservingPhasePv > 0
        || bestV11Variant.phaseOrientedPvPass > 0
        || bestV11Variant.sourceSurfacePass > 0
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
      bestV4VariantId: bestV4Variant.variantId,
      bestV4SourcePreservingPhasePv: bestV4Variant.sourcePreservingPhasePv,
      bestV4PhaseOrientedPvPass: bestV4Variant.phaseOrientedPvPass,
      bestV4SourceSurfacePass: bestV4Variant.sourceSurfacePass,
      bestV4MvfClean: bestV4Variant.mvfClean,
      bestV4PrimeWaveformPass: bestV4Variant.primeWaveformPass,
      bestV5VariantId: bestV5Variant.variantId,
      bestV5SourcePreservingPhasePv: bestV5Variant.sourcePreservingPhasePv,
      bestV5PhaseOrientedPvPass: bestV5Variant.phaseOrientedPvPass,
      bestV5SourceSurfacePass: bestV5Variant.sourceSurfacePass,
      bestV5MvfClean: bestV5Variant.mvfClean,
      bestV5PrimeWaveformPass: bestV5Variant.primeWaveformPass,
      bestV6VariantId: bestV6Variant.variantId,
      bestV6SourcePreservingPhasePv: bestV6Variant.sourcePreservingPhasePv,
      bestV6PhaseOrientedPvPass: bestV6Variant.phaseOrientedPvPass,
      bestV6SourceSurfacePass: bestV6Variant.sourceSurfacePass,
      bestV6MvfClean: bestV6Variant.mvfClean,
      bestV6PrimeWaveformPass: bestV6Variant.primeWaveformPass,
      bestV8VariantId: bestV8Variant.variantId,
      bestV8SourcePreservingPhasePv: bestV8Variant.sourcePreservingPhasePv,
      bestV8PhaseOrientedPvPass: bestV8Variant.phaseOrientedPvPass,
      bestV8SourceSurfacePass: bestV8Variant.sourceSurfacePass,
      bestV8MvfClean: bestV8Variant.mvfClean,
      bestV8PrimeWaveformPass: bestV8Variant.primeWaveformPass,
      bestV8CapacityAxisPhaseOrientedPvPass: bestV8Variant.capacityAxisPhaseOrientedPvPass,
      bestV8SourcePreservingCapacityAxisPhasePv: bestV8Variant.sourcePreservingCapacityAxisPhasePv,
      bestV9VariantId: bestV9Variant.variantId,
      bestV9SourcePreservingPhasePv: bestV9Variant.sourcePreservingPhasePv,
      bestV9PhaseOrientedPvPass: bestV9Variant.phaseOrientedPvPass,
      bestV9SourceSurfacePass: bestV9Variant.sourceSurfacePass,
      bestV9MvfClean: bestV9Variant.mvfClean,
      bestV9PrimeWaveformPass: bestV9Variant.primeWaveformPass,
      bestV9CapacityAxisPhaseOrientedPvPass: bestV9Variant.capacityAxisPhaseOrientedPvPass,
      bestV9SourcePreservingCapacityAxisPhasePv: bestV9Variant.sourcePreservingCapacityAxisPhasePv,
      bestV9MaxReferenceCapacityShiftMl: bestV9Variant.maxReferenceCapacityShiftMl,
      bestV9MaxPressureReferenceCapacityMl: bestV9Variant.maxPressureReferenceCapacityMl,
      bestV9MaxEffectiveCavityCapacityMl: bestV9Variant.maxEffectiveCavityCapacityMl,
      bestV9MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV9Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV9MaxAppliedFixedBloodPressureReliefMmHg: bestV9Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV9MaxBloodXDescentPressureDropMmHg: bestV9Variant.maxBloodXDescentPressureDropMmHg,
      bestV10VariantId: bestV10Variant.variantId,
      bestV10SourcePreservingPhasePv: bestV10Variant.sourcePreservingPhasePv,
      bestV10PhaseOrientedPvPass: bestV10Variant.phaseOrientedPvPass,
      bestV10SourceSurfacePass: bestV10Variant.sourceSurfacePass,
      bestV10MvfClean: bestV10Variant.mvfClean,
      bestV10PrimeWaveformPass: bestV10Variant.primeWaveformPass,
      bestV10CapacityAxisPhaseOrientedPvPass: bestV10Variant.capacityAxisPhaseOrientedPvPass,
      bestV10SourcePreservingCapacityAxisPhasePv: bestV10Variant.sourcePreservingCapacityAxisPhasePv,
      bestV10MaxReferenceCapacityShiftMl: bestV10Variant.maxReferenceCapacityShiftMl,
      bestV10MaxPressureReferenceCapacityMl: bestV10Variant.maxPressureReferenceCapacityMl,
      bestV10MaxEffectiveCavityCapacityMl: bestV10Variant.maxEffectiveCavityCapacityMl,
      bestV10MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV10Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV10MaxAppliedFixedBloodPressureReliefMmHg: bestV10Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV10MaxBloodXDescentPressureDropMmHg: bestV10Variant.maxBloodXDescentPressureDropMmHg,
      bestV11VariantId: bestV11Variant.variantId,
      bestV11SourcePreservingPhasePv: bestV11Variant.sourcePreservingPhasePv,
      bestV11PhaseOrientedPvPass: bestV11Variant.phaseOrientedPvPass,
      bestV11SourceSurfacePass: bestV11Variant.sourceSurfacePass,
      bestV11MvfClean: bestV11Variant.mvfClean,
      bestV11PrimeWaveformPass: bestV11Variant.primeWaveformPass,
      bestV11CapacityAxisPhaseOrientedPvPass: bestV11Variant.capacityAxisPhaseOrientedPvPass,
      bestV11SourcePreservingCapacityAxisPhasePv: bestV11Variant.sourcePreservingCapacityAxisPhasePv,
      bestV11MaxReferenceCapacityShiftMl: bestV11Variant.maxReferenceCapacityShiftMl,
      bestV11MaxPressureReferenceCapacityMl: bestV11Variant.maxPressureReferenceCapacityMl,
      bestV11MaxEffectiveCavityCapacityMl: bestV11Variant.maxEffectiveCavityCapacityMl,
      bestV11MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV11Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV11MaxAppliedFixedBloodPressureReliefMmHg: bestV11Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV11MaxBloodXDescentPressureDropMmHg: bestV11Variant.maxBloodXDescentPressureDropMmHg,
      bestV12VariantId: bestV12Variant.variantId,
      bestV12SourcePreservingPhasePv: bestV12Variant.sourcePreservingPhasePv,
      bestV12PhaseOrientedPvPass: bestV12Variant.phaseOrientedPvPass,
      bestV12SourceSurfacePass: bestV12Variant.sourceSurfacePass,
      bestV12MvfClean: bestV12Variant.mvfClean,
      bestV12PrimeWaveformPass: bestV12Variant.primeWaveformPass,
      bestV12CapacityAxisPhaseOrientedPvPass: bestV12Variant.capacityAxisPhaseOrientedPvPass,
      bestV12SourcePreservingCapacityAxisPhasePv: bestV12Variant.sourcePreservingCapacityAxisPhasePv,
      bestV12MaxReferenceCapacityShiftMl: bestV12Variant.maxReferenceCapacityShiftMl,
      bestV12MaxPressureReferenceCapacityMl: bestV12Variant.maxPressureReferenceCapacityMl,
      bestV12MaxEffectiveCavityCapacityMl: bestV12Variant.maxEffectiveCavityCapacityMl,
      bestV12MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV12Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV12MaxAppliedFixedBloodPressureReliefMmHg: bestV12Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV12MaxBloodXDescentPressureDropMmHg: bestV12Variant.maxBloodXDescentPressureDropMmHg,
      bestV13VariantId: bestV13Variant.variantId,
      bestV13SourcePreservingPhasePv: bestV13Variant.sourcePreservingPhasePv,
      bestV13PhaseOrientedPvPass: bestV13Variant.phaseOrientedPvPass,
      bestV13SourceSurfacePass: bestV13Variant.sourceSurfacePass,
      bestV13MvfClean: bestV13Variant.mvfClean,
      bestV13PrimeWaveformPass: bestV13Variant.primeWaveformPass,
      bestV13CapacityAxisPhaseOrientedPvPass: bestV13Variant.capacityAxisPhaseOrientedPvPass,
      bestV13SourcePreservingCapacityAxisPhasePv: bestV13Variant.sourcePreservingCapacityAxisPhasePv,
      bestV13MaxReferenceCapacityShiftMl: bestV13Variant.maxReferenceCapacityShiftMl,
      bestV13MaxPressureReferenceCapacityMl: bestV13Variant.maxPressureReferenceCapacityMl,
      bestV13MaxEffectiveCavityCapacityMl: bestV13Variant.maxEffectiveCavityCapacityMl,
      bestV13MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV13Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV13MaxAppliedFixedBloodPressureReliefMmHg: bestV13Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV13MaxBloodXDescentPressureDropMmHg: bestV13Variant.maxBloodXDescentPressureDropMmHg,
      bestV14VariantId: bestV14Variant.variantId,
      bestV14SourcePreservingPhasePv: bestV14Variant.sourcePreservingPhasePv,
      bestV14PhaseOrientedPvPass: bestV14Variant.phaseOrientedPvPass,
      bestV14SourceSurfacePass: bestV14Variant.sourceSurfacePass,
      bestV14MvfClean: bestV14Variant.mvfClean,
      bestV14PrimeWaveformPass: bestV14Variant.primeWaveformPass,
      bestV14CapacityAxisPhaseOrientedPvPass: bestV14Variant.capacityAxisPhaseOrientedPvPass,
      bestV14SourcePreservingCapacityAxisPhasePv: bestV14Variant.sourcePreservingCapacityAxisPhasePv,
      bestV14MaxReferenceCapacityShiftMl: bestV14Variant.maxReferenceCapacityShiftMl,
      bestV14MaxPressureReferenceCapacityMl: bestV14Variant.maxPressureReferenceCapacityMl,
      bestV14MaxEffectiveCavityCapacityMl: bestV14Variant.maxEffectiveCavityCapacityMl,
      bestV14MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV14Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV14MaxAppliedFixedBloodPressureReliefMmHg: bestV14Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV14MaxBloodXDescentPressureDropMmHg: bestV14Variant.maxBloodXDescentPressureDropMmHg,
      bestV15VariantId: bestV15Variant.variantId,
      bestV15SourcePreservingPhasePv: bestV15Variant.sourcePreservingPhasePv,
      bestV15PhaseOrientedPvPass: bestV15Variant.phaseOrientedPvPass,
      bestV15SourceSurfacePass: bestV15Variant.sourceSurfacePass,
      bestV15MvfClean: bestV15Variant.mvfClean,
      bestV15PrimeWaveformPass: bestV15Variant.primeWaveformPass,
      bestV15CapacityAxisPhaseOrientedPvPass: bestV15Variant.capacityAxisPhaseOrientedPvPass,
      bestV15SourcePreservingCapacityAxisPhasePv: bestV15Variant.sourcePreservingCapacityAxisPhasePv,
      bestV15MaxReferenceCapacityShiftMl: bestV15Variant.maxReferenceCapacityShiftMl,
      bestV15MaxPressureReferenceCapacityMl: bestV15Variant.maxPressureReferenceCapacityMl,
      bestV15MaxEffectiveCavityCapacityMl: bestV15Variant.maxEffectiveCavityCapacityMl,
      bestV15MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV15Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV15MaxAppliedFixedBloodPressureReliefMmHg: bestV15Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV15MaxBloodXDescentPressureDropMmHg: bestV15Variant.maxBloodXDescentPressureDropMmHg,
      bestV16VariantId: bestV16Variant.variantId,
      bestV16SourcePreservingPhasePv: bestV16Variant.sourcePreservingPhasePv,
      bestV16PhaseOrientedPvPass: bestV16Variant.phaseOrientedPvPass,
      bestV16SourceSurfacePass: bestV16Variant.sourceSurfacePass,
      bestV16MvfClean: bestV16Variant.mvfClean,
      bestV16PrimeWaveformPass: bestV16Variant.primeWaveformPass,
      bestV16CapacityAxisPhaseOrientedPvPass: bestV16Variant.capacityAxisPhaseOrientedPvPass,
      bestV16SourcePreservingCapacityAxisPhasePv: bestV16Variant.sourcePreservingCapacityAxisPhasePv,
      bestV16MaxReferenceCapacityShiftMl: bestV16Variant.maxReferenceCapacityShiftMl,
      bestV16MaxPressureReferenceCapacityMl: bestV16Variant.maxPressureReferenceCapacityMl,
      bestV16MaxEffectiveCavityCapacityMl: bestV16Variant.maxEffectiveCavityCapacityMl,
      bestV16MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV16Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV16MaxAppliedFixedBloodPressureReliefMmHg: bestV16Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV16MaxBloodXDescentPressureDropMmHg: bestV16Variant.maxBloodXDescentPressureDropMmHg,
      bestV17VariantId: bestV17Variant.variantId,
      bestV17SourcePreservingPhasePv: bestV17Variant.sourcePreservingPhasePv,
      bestV17PhaseOrientedPvPass: bestV17Variant.phaseOrientedPvPass,
      bestV17SourceSurfacePass: bestV17Variant.sourceSurfacePass,
      bestV17MvfClean: bestV17Variant.mvfClean,
      bestV17PrimeWaveformPass: bestV17Variant.primeWaveformPass,
      bestV17CapacityAxisPhaseOrientedPvPass: bestV17Variant.capacityAxisPhaseOrientedPvPass,
      bestV17SourcePreservingCapacityAxisPhasePv: bestV17Variant.sourcePreservingCapacityAxisPhasePv,
      bestV17MaxReferenceCapacityShiftMl: bestV17Variant.maxReferenceCapacityShiftMl,
      bestV17MaxPressureReferenceCapacityMl: bestV17Variant.maxPressureReferenceCapacityMl,
      bestV17MaxEffectiveCavityCapacityMl: bestV17Variant.maxEffectiveCavityCapacityMl,
      bestV17MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV17Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV17MaxAppliedFixedBloodPressureReliefMmHg: bestV17Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV17MaxBloodXDescentPressureDropMmHg: bestV17Variant.maxBloodXDescentPressureDropMmHg,
      bestV18VariantId: bestV18Variant.variantId,
      bestV18SourcePreservingPhasePv: bestV18Variant.sourcePreservingPhasePv,
      bestV18PhaseOrientedPvPass: bestV18Variant.phaseOrientedPvPass,
      bestV18SourceSurfacePass: bestV18Variant.sourceSurfacePass,
      bestV18MvfClean: bestV18Variant.mvfClean,
      bestV18PrimeWaveformPass: bestV18Variant.primeWaveformPass,
      bestV18CapacityAxisPhaseOrientedPvPass: bestV18Variant.capacityAxisPhaseOrientedPvPass,
      bestV18SourcePreservingCapacityAxisPhasePv: bestV18Variant.sourcePreservingCapacityAxisPhasePv,
      bestV18MaxReferenceCapacityShiftMl: bestV18Variant.maxReferenceCapacityShiftMl,
      bestV18MaxPressureReferenceCapacityMl: bestV18Variant.maxPressureReferenceCapacityMl,
      bestV18MaxEffectiveCavityCapacityMl: bestV18Variant.maxEffectiveCavityCapacityMl,
      bestV18MaxCounterfactualFixedBloodPressureReliefMmHg:
        bestV18Variant.maxCounterfactualFixedBloodPressureReliefMmHg,
      bestV18MaxAppliedFixedBloodPressureReliefMmHg: bestV18Variant.maxAppliedFixedBloodPressureReliefMmHg,
      bestV18MaxBloodXDescentPressureDropMmHg: bestV18Variant.maxBloodXDescentPressureDropMmHg,
      variantsWithAnySourcePreservingPhasePv,
      variantsWithAnySourcePreservingCapacityAxisPhasePv,
      variantsWithAnyAppliedFixedBloodPressureRelief,
      fullResidualVariantsWithAnyPhasePv,
      reviewStatus,
    },
    decision: {
      nextAction: reviewStatus === "full-left-avp-residual-positive-signal"
        ? "Use the source-preserving blood-v-loop partial signal as mechanism evidence, but do not enable it. The next architecture PR should deepen the LA wall/AV-plane/MV/pulmonary-venous reservoir-conduit hysteresis residual and keep owner SVG promotion behind broad source/MVF-clean visual review."
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
  bestV4VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV5VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV6VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV8VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV9VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV10VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV11VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV12VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV13VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV14VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV15VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV16VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV17VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
  bestV18VariantId?: FullLeftAVPlaneResidualRoutingVariantIdV1,
): readonly FullLeftAVPlaneResidualRoutingTrajectoryPanelV1[] {
  const report = runFullLeftAVPlaneResidualRoutingBenchV1();
  const selectedFullId = bestFullResidualVariantId ?? report.summary.bestFullResidualVariantId;
  const selectedOverallId = bestOverallVariantId ?? report.summary.bestOverallVariantId;
  const selectedSmoothCoreId = bestSmoothCoreVariantId ?? report.summary.bestSmoothCoreVariantId;
  const selectedV2Id = bestV2VariantId ?? report.summary.bestV2VariantId;
  const selectedV3Id = bestV3VariantId ?? report.summary.bestV3VariantId;
  const selectedV4Id = bestV4VariantId ?? report.summary.bestV4VariantId;
  const selectedV5Id = bestV5VariantId ?? report.summary.bestV5VariantId;
  const selectedV6Id = bestV6VariantId ?? report.summary.bestV6VariantId;
  const selectedV8Id = bestV8VariantId ?? report.summary.bestV8VariantId;
  const selectedV9Id = bestV9VariantId ?? report.summary.bestV9VariantId;
  const selectedV10Id = bestV10VariantId ?? report.summary.bestV10VariantId;
  const selectedV11Id = bestV11VariantId ?? report.summary.bestV11VariantId;
  const selectedV12Id = bestV12VariantId ?? report.summary.bestV12VariantId;
  const selectedV13Id = bestV13VariantId ?? report.summary.bestV13VariantId;
  const selectedV14Id = bestV14VariantId ?? report.summary.bestV14VariantId;
  const selectedV15Id = bestV15VariantId ?? report.summary.bestV15VariantId;
  const selectedV16Id = bestV16VariantId ?? report.summary.bestV16VariantId;
  const selectedV17Id = bestV17VariantId ?? report.summary.bestV17VariantId;
  const selectedV18Id = bestV18VariantId ?? report.summary.bestV18VariantId;
  const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineVariant = getVariant("baseline-no-avp-compliance-node");
  const rawVariant = getVariant("raw-traction-reference");
  const bestFullVariant = getVariant(selectedFullId);
  const bestOverallVariant = getVariant(selectedOverallId);
  const bestSmoothCoreVariant = getVariant(selectedSmoothCoreId);
  const bestV2Variant = getVariant(selectedV2Id);
  const bestV3Variant = getVariant(selectedV3Id);
  const bestV4Variant = getVariant(selectedV4Id);
  const bestV5Variant = getVariant(selectedV5Id);
  const bestV6Variant = getVariant(selectedV6Id);
  const bestV8Variant = getVariant(selectedV8Id);
  const bestV9Variant = getVariant(selectedV9Id);
  const bestV10Variant = getVariant(selectedV10Id);
  const bestV11Variant = getVariant(selectedV11Id);
  const bestV12Variant = getVariant(selectedV12Id);
  const bestV13Variant = getVariant(selectedV13Id);
  const bestV14Variant = getVariant(selectedV14Id);
  const bestV15Variant = getVariant(selectedV15Id);
  const bestV16Variant = getVariant(selectedV16Id);
  const bestV17Variant = getVariant(selectedV17Id);
  const bestV18Variant = getVariant(selectedV18Id);
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
      bestV4: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV4Variant)).finalBeatSamples,
      bestV5: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV5Variant)).finalBeatSamples,
      bestV6: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV6Variant)).finalBeatSamples,
      bestV8: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV8Variant)).finalBeatSamples,
      bestV9: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV9Variant)).finalBeatSamples,
      bestV10: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV10Variant)).finalBeatSamples,
      bestV11: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV11Variant)).finalBeatSamples,
      bestV12: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV12Variant)).finalBeatSamples,
      bestV13: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV13Variant)).finalBeatSamples,
      bestV14: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV14Variant)).finalBeatSamples,
      bestV15: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV15Variant)).finalBeatSamples,
      bestV16: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV16Variant)).finalBeatSamples,
      bestV17: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV17Variant)).finalBeatSamples,
      bestV18: runLeftHeartSubsystemV2(applyFullLeftRoutingVariant(params, bestV18Variant)).finalBeatSamples,
      bestFullResidualVariantId: selectedFullId,
      bestOverallVariantId: selectedOverallId,
      bestSmoothCoreVariantId: selectedSmoothCoreId,
      bestV2VariantId: selectedV2Id,
      bestV3VariantId: selectedV3Id,
      bestV4VariantId: selectedV4Id,
      bestV5VariantId: selectedV5Id,
      bestV6VariantId: selectedV6Id,
      bestV8VariantId: selectedV8Id,
      bestV9VariantId: selectedV9Id,
      bestV10VariantId: selectedV10Id,
      bestV11VariantId: selectedV11Id,
      bestV12VariantId: selectedV12Id,
      bestV13VariantId: selectedV13Id,
      bestV14VariantId: selectedV14Id,
      bestV15VariantId: selectedV15Id,
      bestV16VariantId: selectedV16Id,
      bestV17VariantId: selectedV17Id,
      bestV18VariantId: selectedV18Id,
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
    && variantConfig.family !== "full-left-hybrid-velocity-residual-v4"
    && variantConfig.family !== "full-left-phase-owned-residual-v5"
    && variantConfig.family !== "full-left-reference-capacity-residual-v6"
    && variantConfig.family !== "full-left-reference-wall-geometry-residual-v7"
    && variantConfig.family !== "full-left-reference-capacity-venous-residual-v8"
    && variantConfig.family !== "full-left-dynamic-reference-pressure-residual-v9"
    && variantConfig.family !== "full-left-separated-capacity-residual-v10"
    && variantConfig.family !== "full-left-accepted-state-residual-v11"
    && variantConfig.family !== "full-left-effective-cavity-pressure-law-v12"
    && variantConfig.family !== "full-left-c1-coordinate-pressure-law-v13"
    && variantConfig.family !== "full-left-continuous-trajectory-law-v14"
    && variantConfig.family !== "full-left-continuous-mv-coupled-law-v15"
    && variantConfig.family !== "full-left-implicit-mv-state-trajectory-law-v16"
    && variantConfig.family !== "full-left-reservoir-conduit-hysteresis-v17"
    && variantConfig.family !== "full-left-reservoir-conduit-hysteresis-v18"
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
    : variantConfig.family === "full-left-hybrid-velocity-residual-v4"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-hybrid-velocity-residual-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-hybrid-velocity-residual-v1" as const,
      }
    : variantConfig.family === "full-left-phase-owned-residual-v5"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-phase-owned-residual-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-phase-owned-residual-v1" as const,
      }
    : variantConfig.family === "full-left-reference-capacity-residual-v6"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-reference-capacity-residual-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-reference-capacity-residual-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
      }
    : variantConfig.family === "full-left-reference-wall-geometry-residual-v7"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-reference-wall-geometry-residual-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-reference-wall-geometry-residual-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
      }
    : variantConfig.family === "full-left-reference-capacity-venous-residual-v8"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-reference-capacity-venous-residual-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-reference-capacity-venous-residual-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
      }
    : variantConfig.family === "full-left-dynamic-reference-pressure-residual-v9"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-dynamic-reference-pressure-residual-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-dynamic-reference-pressure-residual-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
      }
    : variantConfig.family === "full-left-separated-capacity-residual-v10"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-separated-capacity-residual-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-separated-capacity-residual-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
      }
    : variantConfig.family === "full-left-accepted-state-residual-v11"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-accepted-state-residual-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-accepted-state-residual-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
        laAVPlaneVenousReservoirCouplingGain: variantConfig.variantId.includes("slowrel") ? 0.35 : 0.45,
        laAVPlaneVenousReservoirMaxFlowMlPerSec: Math.max(
          60,
          Math.min(90, coordinateBase.laAVPlaneVenousReservoirMaxFlowMlPerSec),
        ),
        laReservoirSuctionStartTheta: variantConfig.variantId.includes("late16")
          ? 0.16
          : variantConfig.variantId.includes("late12")
            ? 0.12
            : coordinateBase.laReservoirSuctionStartTheta,
        laReservoirSuctionEndTheta: variantConfig.variantId.includes("late16")
          ? 0.64
          : variantConfig.variantId.includes("late12")
            ? 0.60
            : coordinateBase.laReservoirSuctionEndTheta,
        laAVPlaneReservoirCapacityReleaseTauSec: variantConfig.variantId.includes("slowrel")
          ? 0.18
          : coordinateBase.laAVPlaneReservoirCapacityReleaseTauSec,
        laAVPlaneWorkCoordinateMaxVelocityNormPerSec: variantConfig.variantId.includes("slowrel")
          ? Math.min(coordinateBase.laAVPlaneWorkCoordinateMaxVelocityNormPerSec, 0.42)
          : coordinateBase.laAVPlaneWorkCoordinateMaxVelocityNormPerSec,
      }
    : variantConfig.family === "full-left-effective-cavity-pressure-law-v12"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-effective-cavity-pressure-law-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-effective-cavity-pressure-law-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
        laAVPlanePressureReferenceMultiplier: pressureReferenceMultiplierForV12(variantConfig.variantId),
        laAVPlanePrimeVelocityReadbackTauSec: primeVelocityReadbackTauSecForV12(variantConfig.variantId),
        laAVPlaneVenousReservoirCouplingGain: coordinateBase.laAVPlaneVenousReservoirCouplingGain,
        laAVPlaneVenousReservoirMaxFlowMlPerSec: coordinateBase.laAVPlaneVenousReservoirMaxFlowMlPerSec,
        laReservoirSuctionStartTheta: variantConfig.variantId.includes("late12")
          ? 0.12
          : coordinateBase.laReservoirSuctionStartTheta,
        laReservoirSuctionEndTheta: variantConfig.variantId.includes("late12")
          ? 0.60
          : coordinateBase.laReservoirSuctionEndTheta,
      }
    : variantConfig.family === "full-left-c1-coordinate-pressure-law-v13"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-effective-cavity-pressure-law-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-effective-cavity-pressure-law-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
        laAVPlanePressureReferenceMultiplier: 1.50,
        laAVPlanePrimeVelocityReadbackTauSec: 0,
        laAVPlaneWorkCoordinateMaxAccelerationNormPerSec2: coordinateAccelerationForV13(variantConfig.variantId),
        laAVPlaneVenousReservoirCouplingGain: coordinateBase.laAVPlaneVenousReservoirCouplingGain,
        laAVPlaneVenousReservoirMaxFlowMlPerSec: coordinateBase.laAVPlaneVenousReservoirMaxFlowMlPerSec,
      }
    : variantConfig.family === "full-left-continuous-trajectory-law-v14"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-continuous-trajectory-law-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-continuous-trajectory-law-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
        laAVPlanePressureReferenceMultiplier: variantConfig.variantId.includes("pr175") ? 1.75 : 1.50,
        laAVPlanePrimeVelocityReadbackTauSec: 0,
        laAVPlaneWorkCoordinateMaxAccelerationNormPerSec2: coordinateAccelerationForV14(variantConfig.variantId),
        laAVPlaneVenousReservoirCouplingGain: coordinateBase.laAVPlaneVenousReservoirCouplingGain,
        laAVPlaneVenousReservoirMaxFlowMlPerSec: coordinateBase.laAVPlaneVenousReservoirMaxFlowMlPerSec,
      }
    : variantConfig.family === "full-left-continuous-mv-coupled-law-v15"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-continuous-trajectory-law-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-continuous-trajectory-law-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
        laAVPlanePressureReferenceMultiplier: variantConfig.variantId.includes("pr175") ? 1.75 : 1.50,
        laAVPlanePrimeVelocityReadbackTauSec: 0,
        laAVPlaneWorkCoordinateMaxAccelerationNormPerSec2: coordinateAccelerationForV14(variantConfig.variantId),
        laAVPlaneContinuousMvResidualGain: continuousMvResidualGainForV15(variantConfig.variantId),
        laAVPlaneVenousReservoirCouplingGain: coordinateBase.laAVPlaneVenousReservoirCouplingGain,
        laAVPlaneVenousReservoirMaxFlowMlPerSec: coordinateBase.laAVPlaneVenousReservoirMaxFlowMlPerSec,
      }
    : variantConfig.family === "full-left-implicit-mv-state-trajectory-law-v16"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-continuous-trajectory-law-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-continuous-trajectory-law-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl,
        laAVPlanePressureReferenceMultiplier: variantConfig.variantId.includes("pr175") ? 1.75 : 1.50,
        laAVPlanePrimeVelocityReadbackTauSec: 0,
        laAVPlaneWorkCoordinateMaxAccelerationNormPerSec2: coordinateAccelerationForV14(variantConfig.variantId),
        laAVPlaneImplicitMvStateGain: implicitMvStateGainForV16(variantConfig.variantId),
        laAVPlaneVenousReservoirCouplingGain: coordinateBase.laAVPlaneVenousReservoirCouplingGain,
        laAVPlaneVenousReservoirMaxFlowMlPerSec: coordinateBase.laAVPlaneVenousReservoirMaxFlowMlPerSec,
      }
    : variantConfig.family === "full-left-reservoir-conduit-hysteresis-v17"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-reservoir-conduit-hysteresis-v1" as const,
        laEffectiveGeometryMode: "av-plane-full-left-reservoir-conduit-hysteresis-v1" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl
          * (variantConfig.variantId.includes("strongcap") ? 1.28 : 1),
        laAVPlanePressureReferenceMultiplier: variantConfig.variantId.includes("pr200")
          ? 2.00
          : variantConfig.variantId.includes("pr175")
            ? 1.75
            : 1.50,
        laAVPlanePrimeVelocityReadbackTauSec: 0,
        laAVPlaneWorkCoordinateMaxAccelerationNormPerSec2: coordinateAccelerationForV14(variantConfig.variantId),
        laAVPlaneContinuousMvResidualGain: 0.8,
        laAVPlaneImplicitMvStateGain: variantConfig.variantId.includes("mvimplicit") ? 0.5 : 0,
        laAVPlaneReservoirCapacityRiseTauSec: variantConfig.variantId.includes("slowrecoil") ? 0.075 : 0.065,
        laAVPlaneReservoirCapacityFallTauSec: variantConfig.variantId.includes("slowrecoil") ? 0.24 : 0.18,
        laAVPlaneReservoirCapacityReleaseTauSec: variantConfig.variantId.includes("slowrecoil") ? 0.30 : 0.22,
        laAVPlaneVenousReservoirCouplingGain: Math.max(0.40, coordinateBase.laAVPlaneVenousReservoirCouplingGain),
        laAVPlaneVenousReservoirMaxFlowMlPerSec: Math.max(
          80,
          coordinateBase.laAVPlaneVenousReservoirMaxFlowMlPerSec,
        ),
      }
    : variantConfig.family === "full-left-reservoir-conduit-hysteresis-v18"
      ? {
        ...coordinateBase,
        laLobeGeneratorMode: "av-plane-full-left-reservoir-conduit-hysteresis-v2" as const,
        laEffectiveGeometryMode: "av-plane-full-left-reservoir-conduit-hysteresis-v2" as const,
        laAVPlaneReservoirReferenceGainMl: coordinateBase.laReservoirGeometryGainMl
          * (variantConfig.variantId.includes("strongcap") || variantConfig.variantId.includes("sourcebal")
            ? 1.34
            : 1.12),
        laAVPlanePressureReferenceMultiplier: variantConfig.variantId.includes("strongcap")
          || variantConfig.variantId.includes("sourcebal")
          ? 1.85
          : 1.60,
        laAVPlanePrimeVelocityReadbackTauSec: 0,
        laAVPlaneWorkCoordinateMaxAccelerationNormPerSec2: 18,
        laAVPlaneContinuousMvResidualGain: variantConfig.variantId.includes("sourcebal") ? 0.90 : 0.70,
        laAVPlaneReservoirCapacityRiseTauSec: 0.055,
        laAVPlaneReservoirCapacityFallTauSec: variantConfig.variantId.includes("sourcebal") ? 0.34 : 0.28,
        laAVPlaneReservoirCapacityReleaseTauSec: variantConfig.variantId.includes("sourcebal") ? 0.42 : 0.34,
        laAVPlaneVenousReservoirCouplingGain: Math.max(
          variantConfig.variantId.includes("sourcebal") ? 0.55 : 0.46,
          coordinateBase.laAVPlaneVenousReservoirCouplingGain,
        ),
        laAVPlaneVenousReservoirMaxFlowMlPerSec: Math.max(
          variantConfig.variantId.includes("sourcebal") ? 95 : 85,
          coordinateBase.laAVPlaneVenousReservoirMaxFlowMlPerSec,
        ),
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
      tauOpenSec: variantConfig.variantId.includes("mvsmooth") ? 0.052 : 0.030,
      tauCloseSec: variantConfig.variantId.includes("mvsmooth") ? 0.040 : 0.026,
      maxOpenStepPerStep: variantConfig.variantId.includes("mvsmooth") ? 0.075 : 0.12,
    },
  };
}

function pressureReferenceMultiplierForV12(
  variantId: FullLeftAVPlaneResidualRoutingVariantIdV1,
): number {
  if (variantId.includes("pr125")) return 1.25;
  if (variantId.includes("pr150")) return 1.50;
  if (variantId.includes("pr175")) return 1.75;
  return 1;
}

function primeVelocityReadbackTauSecForV12(
  variantId: FullLeftAVPlaneResidualRoutingVariantIdV1,
): number {
  if (variantId.includes("primevel04")) return 0.04;
  if (variantId.includes("primevel08")) return 0.08;
  if (variantId.includes("primevel16")) return 0.16;
  if (variantId.includes("primevel24")) return 0.24;
  return 0;
}

function coordinateAccelerationForV13(
  variantId: FullLeftAVPlaneResidualRoutingVariantIdV1,
): number {
  if (variantId.includes("c1accel04")) return 4;
  if (variantId.includes("c1accel08")) return 8;
  if (variantId.includes("c1accel12")) return 12;
  if (variantId.includes("c1accel16")) return 16;
  return 0;
}

function coordinateAccelerationForV14(
  variantId: FullLeftAVPlaneResidualRoutingVariantIdV1,
): number {
  if (variantId.includes("traj06")) return 6;
  if (variantId.includes("traj10")) return 10;
  if (variantId.includes("traj14")) return 14;
  if (variantId.includes("traj20")) return 20;
  return 0;
}

function continuousMvResidualGainForV15(
  variantId: FullLeftAVPlaneResidualRoutingVariantIdV1,
): number {
  if (variantId.includes("mvtarget05")) return 0.5;
  if (variantId.includes("mvtarget10")) return 1.0;
  return 0;
}

function implicitMvStateGainForV16(
  variantId: FullLeftAVPlaneResidualRoutingVariantIdV1,
): number {
  if (variantId.includes("mvimplicit02")) return 0.2;
  if (variantId.includes("mvimplicit05")) return 0.5;
  if (variantId.includes("mvimplicit10")) return 1.0;
  return 0;
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
  const phasePv = phaseOrientedPvQualityFor(beat, (sample) => sample.acceptedLaVolumeMl);
  const capacityAxisPhasePv = phaseOrientedPvQualityFor(beat, capacityAxisVolumeMl);
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
  const counterfactualFixedBloodPressureRelief = beat.map((sample) =>
    fixedBloodReferencePressureReliefMmHgFor(sample.laReservoirReferenceVolumeShiftMl, run.params)
  );
  const appliedFixedBloodPressureRelief = beat.map((sample) =>
    isDynamicReferencePressureMode(run.params)
      ? fixedBloodReferencePressureReliefMmHgFor(
        sample.laVolumeCoordinateReadback.pressureReferenceCapacityMl,
        run.params,
      )
      : 0
  );
  return {
    profileId,
    variantId: variantConfig.variantId,
    family: variantConfig.family,
    sourceSurfacePass: sourceFailures.length === 0,
    phaseOrientedPvPass: phasePv.pass,
    capacityAxisPhaseOrientedPvPass: capacityAxisPhasePv.pass,
    phaseC1Pass: phasePv.phaseC1Pass,
    capacityAxisPhaseC1Pass: capacityAxisPhasePv.phaseC1Pass,
    mvfClean,
    primeWaveformPass: prime.pass,
    hiddenVolumeClean,
    sourcePreservingPhasePv: sourceFailures.length === 0 && phasePv.pass && mvfClean && hiddenVolumeClean,
    sourcePreservingCapacityAxisPhasePv:
      sourceFailures.length === 0 && capacityAxisPhasePv.pass && mvfClean && hiddenVolumeClean,
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
    maxReferenceCapacityShiftMl:
      round(Math.max(0, ...beat.map((sample) => sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl))),
    maxPressureReferenceCapacityMl:
      round(Math.max(0, ...beat.map((sample) => sample.laVolumeCoordinateReadback.pressureReferenceCapacityMl))),
    maxEffectiveCavityCapacityMl:
      round(Math.max(0, ...beat.map((sample) =>
        sample.laVolumeCoordinateReadback.effectiveCavityVolumeMl
        - sample.laVolumeCoordinateReadback.bloodVolumeMl
      ))),
    maxCounterfactualFixedBloodPressureReliefMmHg:
      round(Math.max(0, ...counterfactualFixedBloodPressureRelief)),
    maxAppliedFixedBloodPressureReliefMmHg:
      round(Math.max(0, ...appliedFixedBloodPressureRelief)),
    maxBloodXDescentPressureDropMmHg: phasePv.systolicXDescentPressureDropMmHg,
    phasePv,
    capacityAxisPhasePv,
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
    capacityAxisPhaseOrientedPvPass: rows.filter((row) => row.capacityAxisPhaseOrientedPvPass).length,
    sourcePreservingPhasePv: rows.filter((row) => row.sourcePreservingPhasePv).length,
    sourcePreservingCapacityAxisPhasePv:
      rows.filter((row) => row.sourcePreservingCapacityAxisPhasePv).length,
    mvfClean: rows.filter((row) => row.mvfClean).length,
    phaseC1Pass: rows.filter((row) => row.phaseC1Pass).length,
    capacityAxisPhaseC1Pass: rows.filter((row) => row.capacityAxisPhaseC1Pass).length,
    primeWaveformPass: rows.filter((row) => row.primeWaveformPass).length,
    hiddenVolumeClean: rows.filter((row) => row.hiddenVolumeClean).length,
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.phasePv.vLoopArea))),
    maxCapacityAxisVLoopArea: round(Math.max(0, ...rows.map((row) => row.capacityAxisPhasePv.vLoopArea))),
    maxPostOpeningPressureDropMmHg:
      round(Math.max(0, ...rows.map((row) => row.phasePv.postOpeningPressureDropMmHg))),
    maxCapacityAxisPostOpeningPressureDropMmHg:
      round(Math.max(0, ...rows.map((row) => row.capacityAxisPhasePv.postOpeningPressureDropMmHg))),
    maxPostOpeningVolumeDropMl:
      round(Math.max(0, ...rows.map((row) => row.phasePv.postOpeningVolumeDropMl))),
    maxCapacityAxisPostOpeningVolumeDropMl:
      round(Math.max(0, ...rows.map((row) => row.capacityAxisPhasePv.postOpeningVolumeDropMl))),
    maxSystolicXDescentPressureDropMmHg:
      round(Math.max(0, ...rows.map((row) => row.phasePv.systolicXDescentPressureDropMmHg))),
    maxSystolicReservoirVolumeRiseMl:
      round(Math.max(0, ...rows.map((row) => row.phasePv.systolicReservoirVolumeRiseMl))),
    maxSystolicVWavePressureRiseMmHg:
      round(Math.max(0, ...rows.map((row) => row.phasePv.systolicVWavePressureRiseMmHg))),
    maxConduitBelowReservoirChordFraction:
      round(Math.max(0, ...rows.map((row) => row.phasePv.conduitBelowReservoirChordFraction))),
    maxPvTangentAngleJumpDeg: round(Math.max(0, ...rows.map((row) => row.phasePv.maxPvTangentAngleJumpDeg))),
    maxTractionPressureStepMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureStepMmHg))),
    maxTransactionResidualNormMl: round(Math.max(0, ...rows.map((row) => row.maxTransactionResidualNormMl))),
    maxPrimeC1ContinuityScore: round(Math.max(0, ...rows.map((row) => row.prime.maxC1ContinuityScore))),
    maxReferenceCapacityShiftMl: round(Math.max(0, ...rows.map((row) => row.maxReferenceCapacityShiftMl))),
    maxPressureReferenceCapacityMl: round(Math.max(0, ...rows.map((row) => row.maxPressureReferenceCapacityMl))),
    maxEffectiveCavityCapacityMl: round(Math.max(0, ...rows.map((row) => row.maxEffectiveCavityCapacityMl))),
    maxCounterfactualFixedBloodPressureReliefMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxCounterfactualFixedBloodPressureReliefMmHg))),
    maxAppliedFixedBloodPressureReliefMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxAppliedFixedBloodPressureReliefMmHg))),
    maxBloodXDescentPressureDropMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxBloodXDescentPressureDropMmHg))),
  };
}

function phaseOrientedPvQualityFor(
  samples: readonly LeftHeartSubsystemSampleV2[],
  volumeAxisMl: (sample: LeftHeartSubsystemSampleV2) => number,
): PhaseOrientedPvQualityV1 {
  const volumes = samples.map(volumeAxisMl);
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
  const bloodVLoopAreaPass = vLoopArea >= MIN_BLOOD_V_LOOP_AREA;
  const reservoirBowPass = phase.reservoirBowPass;
  const mvOpeningTransitionPass = tangent.mvOpeningTangentAngleJumpDeg <= MAX_MV_OPENING_TANGENT_JUMP_DEG;
  const mvOpeningDownstrokePass = phase.mvOpeningDownstrokePass;
  const grossFoldPass = tangent.maxPvTangentAngleJumpDeg <= MAX_GROSS_PV_FOLD_TANGENT_JUMP_DEG;
  if (!bloodVLoopAreaPass) failures.push("v-loop-area-too-small");
  if (!mvOpeningTransitionPass) failures.push("mv-opening-transition-not-clean");
  if (!mvOpeningDownstrokePass) failures.push("mv-opening-conduit-start-not-downstroke");
  if (!opposedSignedLobes) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparation < MIN_BLOOD_V_LOOP_VOLUME_SEPARATION_ML) {
    failures.push("v-loop-not-higher-volume-than-a-loop");
  }
  failures.push(...phase.failureReasons);
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
    postOpeningInitialPressureRiseMmHg: round(phase.postOpeningInitialPressureRiseMmHg),
    postOpeningEarlyPressureDropMmHg: round(phase.postOpeningEarlyPressureDropMmHg),
    postOpeningEarlyVolumeDropMl: round(phase.postOpeningEarlyVolumeDropMl),
    xTroughVolumeRiseMl: round(phase.xTroughVolumeRiseMl),
    postXTroughVolumeRiseMl: round(phase.postXTroughVolumeRiseMl),
    reservoirBelowChordFraction: round(phase.reservoirBelowChordFraction),
    meanReservoirBelowChordMmHg: round(phase.meanReservoirBelowChordMmHg),
    conduitBelowReservoirChordFraction: round(phase.conduitBelowReservoirChordFraction),
    meanConduitBelowReservoirChordMmHg: round(phase.meanConduitBelowReservoirChordMmHg),
    systolicXDescentPressureDropMmHg: round(phase.systolicXDescentPressureDropMmHg),
    systolicReservoirVolumeRiseMl: round(phase.systolicReservoirVolumeRiseMl),
    systolicVWavePressureRiseMmHg: round(phase.systolicVWavePressureRiseMmHg),
    systolicReservoirPass: phase.systolicReservoirPass,
    bloodVLoopAreaPass,
    reservoirBowPass,
    mvOpeningTransitionPass,
    mvOpeningDownstrokePass,
    phaseOrientationPass: phase.failureReasons.length === 0,
    maxPvTangentAngleJumpDeg: round(tangent.maxPvTangentAngleJumpDeg),
    mvOpeningTangentAngleJumpDeg: round(tangent.mvOpeningTangentAngleJumpDeg),
    lowerVLoopTangentAngleJumpDeg: round(tangent.lowerVLoopTangentAngleJumpDeg),
    phaseC1Pass: mvOpeningTransitionPass,
    failureReasons: failures,
  };
}

function capacityAxisVolumeMl(sample: LeftHeartSubsystemSampleV2): number {
  return sample.laVolumeCoordinateReadback.effectiveCavityVolumeMl;
}

function fixedBloodReferencePressureReliefMmHgFor(
  referenceShiftMl: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  return Math.max(0, referenceShiftMl) / Math.max(params.laComplianceMlPerMmHg, 1e-9);
}

function isDynamicReferencePressureMode(params: LeftHeartSubsystemParamsV2): boolean {
  return params.laLobeGeneratorMode === "av-plane-full-left-dynamic-reference-pressure-residual-v1"
    || params.laEffectiveGeometryMode === "av-plane-full-left-dynamic-reference-pressure-residual-v1"
    || params.laLobeGeneratorMode === "av-plane-full-left-separated-capacity-residual-v1"
    || params.laEffectiveGeometryMode === "av-plane-full-left-separated-capacity-residual-v1"
    || params.laLobeGeneratorMode === "av-plane-full-left-accepted-state-residual-v1"
    || params.laEffectiveGeometryMode === "av-plane-full-left-accepted-state-residual-v1"
    || params.laLobeGeneratorMode === "av-plane-full-left-effective-cavity-pressure-law-v1"
    || params.laEffectiveGeometryMode === "av-plane-full-left-effective-cavity-pressure-law-v1"
    || params.laLobeGeneratorMode === "av-plane-full-left-continuous-trajectory-law-v1"
    || params.laEffectiveGeometryMode === "av-plane-full-left-continuous-trajectory-law-v1"
    || params.laLobeGeneratorMode === "av-plane-full-left-reservoir-conduit-hysteresis-v1"
    || params.laEffectiveGeometryMode === "av-plane-full-left-reservoir-conduit-hysteresis-v1"
    || params.laLobeGeneratorMode === "av-plane-full-left-reservoir-conduit-hysteresis-v2"
    || params.laEffectiveGeometryMode === "av-plane-full-left-reservoir-conduit-hysteresis-v2";
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
  readonly postOpeningInitialPressureRiseMmHg: number;
  readonly postOpeningEarlyPressureDropMmHg: number;
  readonly postOpeningEarlyVolumeDropMl: number;
  readonly xTroughVolumeRiseMl: number;
  readonly postXTroughVolumeRiseMl: number;
  readonly reservoirBelowChordFraction: number;
  readonly meanReservoirBelowChordMmHg: number;
  readonly conduitBelowReservoirChordFraction: number;
  readonly meanConduitBelowReservoirChordMmHg: number;
  readonly systolicXDescentPressureDropMmHg: number;
  readonly systolicReservoirVolumeRiseMl: number;
  readonly systolicVWavePressureRiseMmHg: number;
  readonly systolicReservoirPass: boolean;
  readonly reservoirBowPass: boolean;
  readonly mvOpeningDownstrokePass: boolean;
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
      postOpeningInitialPressureRiseMmHg: 0,
      postOpeningEarlyPressureDropMmHg: 0,
      postOpeningEarlyVolumeDropMl: 0,
      xTroughVolumeRiseMl: 0,
      postXTroughVolumeRiseMl: 0,
      reservoirBelowChordFraction: 0,
      meanReservoirBelowChordMmHg: 0,
      conduitBelowReservoirChordFraction: 0,
      meanConduitBelowReservoirChordMmHg: 0,
      systolicXDescentPressureDropMmHg: 0,
      systolicReservoirVolumeRiseMl: 0,
      systolicVWavePressureRiseMmHg: 0,
      systolicReservoirPass: false,
      reservoirBowPass: false,
      mvOpeningDownstrokePass: false,
      failureReasons: failures,
    };
  }
  const reservoirIndices = circularIndexRange(mvClosureIndex, mvOpeningIndex, theta.length);
  const closurePressure = pressures[mvClosureIndex]!;
  const closureVolume = volumes[mvClosureIndex]!;
  const reservoirPressures = reservoirIndices.map((index) => pressures[index]!);
  const minReservoirPressure = Math.min(closurePressure, ...reservoirPressures);
  const minReservoirIndex = reservoirIndices.reduce(
    (selected, index) => pressures[index]! < pressures[selected]! ? index : selected,
    mvClosureIndex,
  );
  const xTroughVolumeRise = volumes[minReservoirIndex]! - closureVolume;
  const postXTroughVolumeRise = volumes[mvOpeningIndex]! - volumes[minReservoirIndex]!;
  const reservoirBelowChordMargins = reservoirIndices
    .filter((index) => index !== mvClosureIndex && index !== mvOpeningIndex)
    .map((index) =>
      reservoirChordPressureAtVolume(
        volumes[index]!,
        closureVolume,
        closurePressure,
        volumes[mvOpeningIndex]!,
        pressures[mvOpeningIndex]!,
      ) - pressures[index]!
    );
  const reservoirBelowChordCount = reservoirBelowChordMargins.filter((margin) => margin >= 0.2).length;
  const reservoirBelowChordFraction =
    reservoirBelowChordMargins.length === 0 ? 0 : reservoirBelowChordCount / reservoirBelowChordMargins.length;
  const meanReservoirBelowChord = mean(reservoirBelowChordMargins);
  const systolicXDescentPressureDrop = closurePressure - minReservoirPressure;
  const systolicReservoirVolumeRise = volumes[mvOpeningIndex]! - closureVolume;
  const systolicVWavePressureRise = pressures[mvOpeningIndex]! - minReservoirPressure;
  const systolicReservoirPass =
    systolicXDescentPressureDrop >= MIN_BLOOD_X_DESCENT_PRESSURE_DROP_MMHG
    && systolicReservoirVolumeRise >= MIN_BLOOD_RESERVOIR_VOLUME_RISE_ML
    && systolicVWavePressureRise >= MIN_BLOOD_V_WAVE_PRESSURE_RISE_MMHG;
  const reservoirBowPass =
    reservoirBelowChordFraction >= MIN_RESERVOIR_BELOW_CHORD_FRACTION
    && meanReservoirBelowChord >= MIN_MEAN_RESERVOIR_BELOW_CHORD_MMHG
    && xTroughVolumeRise >= MIN_X_TROUGH_VOLUME_RISE_ML
    && postXTroughVolumeRise >= MIN_POST_X_TROUGH_VOLUME_RISE_ML;
  const conduitIndices = conduitIndicesAfterOpening(theta, mvOpeningIndex);
  const openingPressure = pressures[mvOpeningIndex]!;
  const openingVolume = volumes[mvOpeningIndex]!;
  const conduitPressures = conduitIndices.map((index) => pressures[index]!);
  const conduitVolumes = conduitIndices.map((index) => volumes[index]!);
  const postOpeningPressureDrop = openingPressure - Math.min(openingPressure, ...conduitPressures);
  const postOpeningVolumeDrop = openingVolume - Math.min(openingVolume, ...conduitVolumes);
  const earlyConduitIndices = earlyConduitIndicesAfterOpening(theta, mvOpeningIndex);
  const earlyConduitPressures = earlyConduitIndices.map((index) => pressures[index]!);
  const earlyConduitVolumes = earlyConduitIndices.map((index) => volumes[index]!);
  const postOpeningInitialPressureRise = Math.max(
    0,
    ...earlyConduitPressures.map((pressure) => pressure - openingPressure),
  );
  const postOpeningEarlyPressureDrop =
    openingPressure - Math.min(openingPressure, ...earlyConduitPressures);
  const postOpeningEarlyVolumeDrop =
    openingVolume - Math.min(openingVolume, ...earlyConduitVolumes);
  const mvOpeningDownstrokePass =
    earlyConduitIndices.length >= 3
    && postOpeningInitialPressureRise <= MAX_MV_OPENING_INITIAL_PRESSURE_RISE_MMHG
    && postOpeningEarlyPressureDrop >= MIN_MV_OPENING_EARLY_PRESSURE_DROP_MMHG
    && postOpeningEarlyVolumeDrop >= MIN_MV_OPENING_EARLY_VOLUME_DROP_ML;
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
  if (earlyConduitIndices.length < 3) failures.push("mv-opening-early-conduit-window-too-short");
  if (postOpeningInitialPressureRise > MAX_MV_OPENING_INITIAL_PRESSURE_RISE_MMHG) {
    failures.push("mv-opening-starts-upward");
  }
  if (postOpeningEarlyPressureDrop < MIN_MV_OPENING_EARLY_PRESSURE_DROP_MMHG) {
    failures.push("mv-opening-early-conduit-not-pressure-downward");
  }
  if (postOpeningEarlyVolumeDrop < MIN_MV_OPENING_EARLY_VOLUME_DROP_ML) {
    failures.push("mv-opening-early-conduit-not-volume-leftward");
  }
  if (postOpeningPressureDrop < 0.8) failures.push("mv-opening-conduit-not-pressure-downward");
  if (postOpeningVolumeDrop < 0.8) failures.push("mv-opening-conduit-not-volume-leftward");
  // Reference atrial PV loops can cross the closure-opening chord and can have a sharp or shallow
  // x-descent; keep reservoir timing/depth as readbacks, not hard acceptance failures.
  return {
    mvOpeningIndex,
    mvClosureIndex,
    mvOpeningPressureMmHg: openingPressure,
    mvClosurePressureMmHg: pressures[mvClosureIndex]!,
    postOpeningPressureDropMmHg: postOpeningPressureDrop,
    postOpeningVolumeDropMl: postOpeningVolumeDrop,
    postOpeningInitialPressureRiseMmHg: postOpeningInitialPressureRise,
    postOpeningEarlyPressureDropMmHg: postOpeningEarlyPressureDrop,
    postOpeningEarlyVolumeDropMl: postOpeningEarlyVolumeDrop,
    xTroughVolumeRiseMl: xTroughVolumeRise,
    postXTroughVolumeRiseMl: postXTroughVolumeRise,
    reservoirBelowChordFraction,
    meanReservoirBelowChordMmHg: meanReservoirBelowChord,
    conduitBelowReservoirChordFraction,
    meanConduitBelowReservoirChordMmHg: meanConduitBelowReservoirChord,
    systolicXDescentPressureDropMmHg: systolicXDescentPressureDrop,
    systolicReservoirVolumeRiseMl: systolicReservoirVolumeRise,
    systolicVWavePressureRiseMmHg: systolicVWavePressureRise,
    systolicReservoirPass,
    reservoirBowPass,
    mvOpeningDownstrokePass,
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

function earlyConduitIndicesAfterOpening(theta: readonly number[], openingIndex: number): readonly number[] {
  const indices: number[] = [];
  const openingTheta = theta[openingIndex]!;
  for (let step = 1; step < theta.length; step++) {
    const index = (openingIndex + step) % theta.length;
    if (forwardPhaseDistance(theta[index]!, openingTheta) > MV_OPENING_EARLY_CONDUIT_PHASE_WINDOW) break;
    if (theta[index]! >= PRE_A_THETA) break;
    indices.push(index);
  }
  return indices;
}

function forwardPhaseDistance(value: number, from: number): number {
  return value >= from ? value - from : value + 1 - from;
}

function circularIndexRange(startIndex: number, endIndex: number, length: number): readonly number[] {
  const indices: number[] = [];
  for (let step = 0; step <= length; step++) {
    const index = (startIndex + step) % length;
    indices.push(index);
    if (step > 0 && index === endIndex) break;
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
