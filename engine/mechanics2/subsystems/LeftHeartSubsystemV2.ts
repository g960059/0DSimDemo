import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberOutputV1,
  type AtrialFiberChamberStateV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  initialOneFiberChamberStateV1,
  stepOneFiberChamberV1,
  type OneFiberChamberOutputV1,
  type OneFiberChamberParamsV1,
  type OneFiberChamberStateV1,
} from "@/engine/mechanics2/chamber/OneFiberChamberV1";
import {
  initialFlowStateValveStateV1,
  stepFlowStateValveV1,
  type FlowStateValveOutputV1,
  type FlowStateValveParamsV1,
  type FlowStateValveStateV1,
} from "@/engine/mechanics2/valve/FlowStateValveV1";
import {
  lerpV2,
  rootMeanSquareResidualV2,
  runMechanicsFixedPointTransactionV2,
  type MechanicsFixedPointIterationV2,
} from "@/engine/mechanics2/core/MechanicsTransactionV2";
import {
  disabledAVPlaneGeometryReadbackV1,
  enabledAVPlaneGeometryShadowReadbackV1,
  initialDisabledAVPlaneGeometryStateV1,
  type AVPlaneGeometryReadbackV1,
} from "@/engine/mechanics2/core/AVPlaneGeometryStateV1";
import {
  defaultLeftHeartSubsystemParamsV1,
  type LeftHeartSubsystemParamsV1,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV1";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type LeftHeartTransactionModeV2 = "explicit-single" | "fixed-point";
export type LeftHeartVolumeSafetyModeV2 = "hard-clamp" | "soft-pressure";
export type PulmonaryVenousBoundaryModeV2 = "fixed-pressure" | "compliance-node";
export type LeftAtrialEffectiveGeometryModeV2 =
  | "none"
  | "lv-shortening-stretch-volume-shadow"
  | "lv-shortening-capacity-volume-shadow"
  | "phase-reservoir-capacity-volume-shadow"
  | "lobe-state-capacity-volume-shadow"
  | "av-plane-reservoir-capacity-volume-shadow"
  | "av-plane-reservoir-capacity-transaction-v1"
  | "av-plane-reservoir-stretch-transaction-v1"
  | "av-plane-force-position-reservoir-transaction-v1";
export type LeftAtrialLobeGeneratorModeV2 =
  | "none"
  | "reservoir-suction-state-shadow"
  | "reservoir-booster-state-shadow"
  | "flow-reservoir-booster-state-shadow"
  | "av-plane-reservoir-booster-state-shadow"
  | "av-plane-reservoir-capacity-transaction-v1"
  | "av-plane-venous-reservoir-transaction-v1"
  | "av-plane-reservoir-strain-reference-transaction-v1"
  | "av-plane-pressure-capacity-reservoir-transaction-v1"
  | "av-plane-two-state-reservoir-transaction-v1"
  | "av-plane-traction-reservoir-transaction-v1"
  | "av-plane-stateful-traction-reservoir-transaction-v1"
  | "av-plane-force-position-reservoir-transaction-v1";
export type LeftAtrialPressureSourceModeV2 =
  | "empirical-a-wave"
  | "fiber-active-a-window-gated-shadow"
  | "fiber-chamber-total-pressure-shadow"
  | "fiber-active-pressure-additive-shadow";

export type LeftHeartSubsystemParamsV2 = LeftHeartSubsystemParamsV1 & {
  readonly transactionMode: LeftHeartTransactionModeV2;
  readonly transactionIterations: number;
  readonly transactionRelaxation: number;
  readonly transactionResidualToleranceMl: number;
  readonly volumeSafetyMode: LeftHeartVolumeSafetyModeV2;
  readonly absoluteMinLvVolumeMl: number;
  readonly absoluteMaxLvVolumeMl: number;
  readonly absoluteMinLaVolumeMl: number;
  readonly absoluteMaxLaVolumeMl: number;
  readonly lvSoftLimitGainMmHgPerMl: number;
  readonly laSoftLimitGainMmHgPerMl: number;
  readonly lvLowerSoftLimitGainMmHgPerMl: number;
  readonly laLowerSoftLimitGainMmHgPerMl: number;
  readonly pulmonaryVenousBoundaryMode: PulmonaryVenousBoundaryModeV2;
  readonly pulmonaryVenousInitialPressureMmHg: number;
  readonly pulmonaryVenousSourcePressureMmHg: number;
  readonly pulmonaryVenousSourceResistanceMmHgSecPerMl: number;
  readonly pulmonaryVenousComplianceMlPerMmHg: number;
  readonly rootOutflowHighPressureDriveStartMmHg: number;
  readonly rootOutflowHighPressureDriveEndMmHg: number;
  readonly rootOutflowHighPressureResistanceGain: number;
  readonly rootOutflowStatefulDriveStartMmHg: number;
  readonly rootOutflowStatefulDriveEndMmHg: number;
  readonly rootOutflowStatefulResistanceGain: number;
  readonly rootOutflowStatefulRiseTauSec: number;
  readonly rootOutflowStatefulFallTauSec: number;
  readonly mvSystolicClosureDriveGain01: number;
  readonly mvSystolicClosureDriveStartTheta: number;
  readonly mvSystolicClosureDriveEndTheta: number;
  readonly laPressureSourceMode: LeftAtrialPressureSourceModeV2;
  readonly laFiberActivePressureReferenceMmHg: number;
  readonly laFiberActivePressureGain: number;
  readonly laEffectiveGeometryMode: LeftAtrialEffectiveGeometryModeV2;
  readonly laEffectiveGeometryGainMl: number;
  readonly laEffectiveGeometryVelocityScaleCmPerSec: number;
  readonly laReservoirGeometryGainMl: number;
  readonly laBoosterGeometryGainMl: number;
  readonly laLobeGeneratorMode: LeftAtrialLobeGeneratorModeV2;
  readonly laReservoirSuctionPressureGainMmHg: number;
  readonly laReservoirSuctionRiseTauSec: number;
  readonly laReservoirSuctionFallTauSec: number;
  readonly laReservoirSuctionStartTheta: number;
  readonly laReservoirSuctionEndTheta: number;
  readonly laReservoirFillingRateStartMlPerSec: number;
  readonly laReservoirFillingRateEndMlPerSec: number;
  readonly laAVPlaneEjectionRateStartMlPerSec: number;
  readonly laAVPlaneEjectionRateEndMlPerSec: number;
  readonly laAVPlaneReservoirCapacityRiseTauSec: number;
  readonly laAVPlaneReservoirCapacityFallTauSec: number;
  readonly laAVPlaneReservoirCapacityReleaseTauSec: number;
  readonly laAVPlaneReservoirCapacityMvOpenReleaseThreshold01: number;
  readonly laAVPlaneVenousReservoirCouplingGain: number;
  readonly laAVPlaneVenousReservoirMaxFlowMlPerSec: number;
  readonly laAVPlaneVenousReservoirMvOpenReleaseThreshold01: number;
  readonly laAVPlaneReservoirReferenceGainMl: number;
  readonly laAVPlaneReservoirTractionGainMmHgPerNormPerSec: number;
  readonly laAVPlaneReservoirTractionPressureRiseTauSec: number;
  readonly laAVPlaneReservoirTractionPressureFallTauSec: number;
  readonly laAVPlaneReservoirTractionPressureReleaseTauSec: number;
  readonly laAVPlaneReservoirTractionPressureMaxRateMmHgPerSec: number;
  readonly laAVPlaneWorkCoordinateAnnularAreaCm2: number;
  readonly laAVPlaneWorkCoordinateDriveForceN: number;
  readonly laAVPlaneWorkCoordinateStiffnessNPerNorm: number;
  readonly laAVPlaneWorkCoordinateDampingNsecPerNorm: number;
  readonly laAVPlaneWorkCoordinateMassKg: number;
  readonly laAVPlaneWorkCoordinateMaxVelocityNormPerSec: number;
  readonly laAVPlaneReservoirRecoilPressureGainMmHg: number;
  readonly laAVPlaneReservoirRecoilRiseTauSec: number;
  readonly laAVPlaneReservoirRecoilFallTauSec: number;
  readonly laAVPlaneReservoirRecoilStartTheta: number;
  readonly laAVPlaneReservoirRecoilEndTheta: number;
  readonly laBoosterPressureGainMmHg: number;
  readonly laBoosterPressureRiseTauSec: number;
  readonly laBoosterPressureFallTauSec: number;
  readonly laBoosterPressureStartTheta: number;
  readonly laBoosterPressureEndTheta: number;
};

export type LeftHeartSubsystemStateV2 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly rootPressureMmHg: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly lv: OneFiberChamberStateV1;
  readonly laFiber: AtrialFiberChamberStateV1;
  readonly mv: FlowStateValveStateV1;
  readonly aov: FlowStateValveStateV1;
  readonly rootOutflowStatefulDrive01: number;
  readonly laReservoirSuctionDrive01: number;
  readonly laReservoirRecoilDrive01: number;
  readonly laAVPlaneReservoirTractionPressureStateMmHg: number;
  readonly laAVPlaneWorkCoordinateZNorm: number;
  readonly laAVPlaneWorkCoordinateZDotNormPerSec: number;
  readonly laAVPlaneWorkCoordinateDriveForceN: number;
  readonly laBoosterPressureDrive01: number;
  readonly clampCount: number;
};

export type LeftHeartSubsystemSampleV2 = {
  readonly tSec: number;
  readonly beat: number;
  readonly theta: number;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly acceptedLaVolumeMl: number;
  readonly acceptedLvVolumeMl: number;
  readonly lvpMmHg: number;
  readonly lvpRawMmHg: number;
  readonly lvpSafetyMmHg: number;
  readonly lapMmHg: number;
  readonly lapRawMmHg: number;
  readonly lapSafetyMmHg: number;
  readonly lapEmpiricalAWaveMmHg: number;
  readonly lapFiberActivePressureMmHg: number;
  readonly lapFiberActivePulse01: number;
  readonly lapPressureSourceMode: LeftAtrialPressureSourceModeV2;
  readonly laEffectiveGeometryMode: LeftAtrialEffectiveGeometryModeV2;
  readonly laEffectiveGeometryDeltaMl: number;
  readonly laReservoirGeometryDeltaMl: number;
  readonly laReservoirReferenceVolumeShiftMl: number;
  readonly laAVPlaneReservoirTractionPressureMmHg: number;
  readonly laAVPlaneReservoirTractionPressureTargetMmHg: number;
  readonly laAVPlaneReservoirTractionPressureStateMmHg: number;
  readonly laAVPlaneWorkCoordinateZNorm: number;
  readonly laAVPlaneWorkCoordinateZDotNormPerSec: number;
  readonly laAVPlaneWorkCoordinateDriveForceN: number;
  readonly laAVPlaneWorkCoordinatePressureMmHg: number;
  readonly laBoosterGeometryDeltaMl: number;
  readonly laEffectiveGeometryHiddenBloodVolumeSourceMl: number;
  readonly laAPrimeProxyCmPerSec: number | null;
  readonly laLobeGeneratorMode: LeftAtrialLobeGeneratorModeV2;
  readonly laReservoirSuctionDrive01: number;
  readonly laReservoirSuctionPressureMmHg: number;
  readonly laReservoirRecoilDrive01: number;
  readonly laReservoirRecoilPressureMmHg: number;
  readonly laBoosterPressureDrive01: number;
  readonly laBoosterPressureMmHg: number;
  readonly rootPressureMmHg: number;
  readonly acceptedRootPressureMmHg: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly acceptedPulmonaryVenousPressureMmHg: number;
  readonly qMvMlPerSec: number;
  readonly qAovMlPerSec: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly qPulmonaryVenousSourceMlPerSec: number;
  readonly qAVPlaneReservoirKinematicMlPerSec: number;
  readonly rootOutResistanceEffectiveMmHgSecPerMl: number;
  readonly rootOutflowHighPressureDrive01: number;
  readonly rootOutflowStatefulDrive01: number;
  readonly mvOpen01: number;
  readonly aovOpen01: number;
  readonly lvChamber: OneFiberChamberOutputV1;
  readonly laFiberChamber: AtrialFiberChamberOutputV1;
  readonly mv: FlowStateValveOutputV1;
  readonly aov: FlowStateValveOutputV1;
  readonly avPlaneGeometryReadback: AVPlaneGeometryReadbackV1;
  readonly rootOutflowMlPerSec: number;
  readonly massResidualMl: number;
  readonly transactionResidualNormMl: number;
  readonly transactionConverged01: 0 | 1;
  readonly transactionIterationsUsed: number;
  readonly volumeClampHit01: 0 | 1;
  readonly laVolumeClampHit01: 0 | 1;
  readonly lvVolumeClampHit01: 0 | 1;
  readonly iterationLog: readonly MechanicsFixedPointIterationV2[];
};

export type LeftHeartSubsystemRunV2 = {
  readonly params: LeftHeartSubsystemParamsV2;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
  readonly finalBeatSamples: readonly LeftHeartSubsystemSampleV2[];
  readonly clampCount: number;
};

export type LeftHeartSubsystemParamsV2Overrides =
  Partial<Omit<LeftHeartSubsystemParamsV2, "lv" | "mv" | "aov">> & {
    readonly lv?: Partial<OneFiberChamberParamsV1>;
    readonly mv?: Partial<FlowStateValveParamsV1>;
    readonly aov?: Partial<FlowStateValveParamsV1>;
  };

type CandidateV2 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly rootPressureMmHg: number;
  readonly pulmonaryVenousPressureMmHg: number;
};

type AcceptedV2 = CandidateV2 & {
  readonly lvChamber: OneFiberChamberOutputV1;
  readonly laFiberChamber: AtrialFiberChamberOutputV1;
  readonly mv: FlowStateValveOutputV1;
  readonly aov: FlowStateValveOutputV1;
  readonly lapRawMmHg: number;
  readonly lapSafetyMmHg: number;
  readonly lvpRawMmHg: number;
  readonly lvpSafetyMmHg: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly qPulmonaryVenousSourceMlPerSec: number;
  readonly qAVPlaneReservoirKinematicMlPerSec: number;
  readonly rootOutResistanceEffectiveMmHgSecPerMl: number;
  readonly rootOutflowHighPressureDrive01: number;
  readonly rootOutflowStatefulDrive01: number;
  readonly rootOutflowMlPerSec: number;
  readonly lapEmpiricalAWaveMmHg: number;
  readonly lapFiberActivePressureMmHg: number;
  readonly lapFiberActivePulse01: number;
  readonly avPlaneGeometryReadback: AVPlaneGeometryReadbackV1;
  readonly laReservoirSuctionDrive01: number;
  readonly laReservoirSuctionPressureMmHg: number;
  readonly laReservoirRecoilDrive01: number;
  readonly laReservoirRecoilPressureMmHg: number;
  readonly laReservoirGeometryDeltaMl: number;
  readonly laReservoirReferenceVolumeShiftMl: number;
  readonly laAVPlaneReservoirTractionPressureMmHg: number;
  readonly laAVPlaneReservoirTractionPressureTargetMmHg: number;
  readonly laAVPlaneReservoirTractionPressureStateMmHg: number;
  readonly laAVPlaneWorkCoordinateZNorm: number;
  readonly laAVPlaneWorkCoordinateZDotNormPerSec: number;
  readonly laAVPlaneWorkCoordinateDriveForceN: number;
  readonly laAVPlaneWorkCoordinatePressureMmHg: number;
  readonly laBoosterPressureDrive01: number;
  readonly laBoosterPressureMmHg: number;
  readonly laBoosterGeometryDeltaMl: number;
  readonly volumeClampHit01: 0 | 1;
  readonly laVolumeClampHit01: 0 | 1;
  readonly lvVolumeClampHit01: 0 | 1;
};

export function defaultLeftHeartSubsystemParamsV2(
  overrides: LeftHeartSubsystemParamsV2Overrides = {},
): LeftHeartSubsystemParamsV2 {
  const base = defaultLeftHeartSubsystemParamsV1(overrides);
  return {
    ...base,
    transactionMode: overrides.transactionMode ?? "explicit-single",
    transactionIterations: overrides.transactionIterations ?? 1,
    transactionRelaxation: overrides.transactionRelaxation ?? 0.5,
    transactionResidualToleranceMl: overrides.transactionResidualToleranceMl ?? 0.02,
    volumeSafetyMode: overrides.volumeSafetyMode ?? "hard-clamp",
    absoluteMinLvVolumeMl: overrides.absoluteMinLvVolumeMl ?? 35,
    absoluteMaxLvVolumeMl: overrides.absoluteMaxLvVolumeMl ?? 240,
    absoluteMinLaVolumeMl: overrides.absoluteMinLaVolumeMl ?? 12,
    absoluteMaxLaVolumeMl: overrides.absoluteMaxLaVolumeMl ?? 180,
    lvSoftLimitGainMmHgPerMl: overrides.lvSoftLimitGainMmHgPerMl ?? 0.65,
    laSoftLimitGainMmHgPerMl: overrides.laSoftLimitGainMmHgPerMl ?? 0.35,
    lvLowerSoftLimitGainMmHgPerMl: overrides.lvLowerSoftLimitGainMmHgPerMl
      ?? overrides.lvSoftLimitGainMmHgPerMl
      ?? 0.65,
    laLowerSoftLimitGainMmHgPerMl: overrides.laLowerSoftLimitGainMmHgPerMl
      ?? overrides.laSoftLimitGainMmHgPerMl
      ?? 0.35,
    pulmonaryVenousBoundaryMode: overrides.pulmonaryVenousBoundaryMode ?? "fixed-pressure",
    pulmonaryVenousInitialPressureMmHg: overrides.pulmonaryVenousInitialPressureMmHg
      ?? overrides.pulmonaryVenousPressureMmHg
      ?? base.pulmonaryVenousPressureMmHg,
    pulmonaryVenousSourcePressureMmHg: overrides.pulmonaryVenousSourcePressureMmHg
      ?? overrides.pulmonaryVenousPressureMmHg
      ?? base.pulmonaryVenousPressureMmHg,
    pulmonaryVenousSourceResistanceMmHgSecPerMl: overrides.pulmonaryVenousSourceResistanceMmHgSecPerMl ?? 0.11,
    pulmonaryVenousComplianceMlPerMmHg: overrides.pulmonaryVenousComplianceMlPerMmHg ?? 12,
    rootOutflowHighPressureDriveStartMmHg: overrides.rootOutflowHighPressureDriveStartMmHg ?? 0,
    rootOutflowHighPressureDriveEndMmHg: overrides.rootOutflowHighPressureDriveEndMmHg ?? 0,
    rootOutflowHighPressureResistanceGain: overrides.rootOutflowHighPressureResistanceGain ?? 0,
    rootOutflowStatefulDriveStartMmHg: overrides.rootOutflowStatefulDriveStartMmHg ?? 0,
    rootOutflowStatefulDriveEndMmHg: overrides.rootOutflowStatefulDriveEndMmHg ?? 0,
    rootOutflowStatefulResistanceGain: overrides.rootOutflowStatefulResistanceGain ?? 0,
    rootOutflowStatefulRiseTauSec: overrides.rootOutflowStatefulRiseTauSec ?? 0.035,
    rootOutflowStatefulFallTauSec: overrides.rootOutflowStatefulFallTauSec ?? 0.35,
    mvSystolicClosureDriveGain01: overrides.mvSystolicClosureDriveGain01 ?? 0,
    mvSystolicClosureDriveStartTheta: overrides.mvSystolicClosureDriveStartTheta ?? 0.02,
    mvSystolicClosureDriveEndTheta: overrides.mvSystolicClosureDriveEndTheta ?? 0.18,
    laPressureSourceMode: overrides.laPressureSourceMode ?? "empirical-a-wave",
    laFiberActivePressureReferenceMmHg: overrides.laFiberActivePressureReferenceMmHg ?? 11,
    laFiberActivePressureGain: overrides.laFiberActivePressureGain ?? 1,
    laEffectiveGeometryMode: overrides.laEffectiveGeometryMode ?? "none",
    laEffectiveGeometryGainMl: overrides.laEffectiveGeometryGainMl ?? 0,
    laEffectiveGeometryVelocityScaleCmPerSec: overrides.laEffectiveGeometryVelocityScaleCmPerSec ?? 1.5,
    laReservoirGeometryGainMl: overrides.laReservoirGeometryGainMl ?? 0,
    laBoosterGeometryGainMl: overrides.laBoosterGeometryGainMl ?? 0,
    laLobeGeneratorMode: overrides.laLobeGeneratorMode ?? "none",
    laReservoirSuctionPressureGainMmHg: overrides.laReservoirSuctionPressureGainMmHg ?? 0,
    laReservoirSuctionRiseTauSec: overrides.laReservoirSuctionRiseTauSec ?? 0.08,
    laReservoirSuctionFallTauSec: overrides.laReservoirSuctionFallTauSec ?? 0.16,
    laReservoirSuctionStartTheta: overrides.laReservoirSuctionStartTheta ?? 0.08,
    laReservoirSuctionEndTheta: overrides.laReservoirSuctionEndTheta ?? 0.70,
    laReservoirFillingRateStartMlPerSec: overrides.laReservoirFillingRateStartMlPerSec ?? 6,
    laReservoirFillingRateEndMlPerSec: overrides.laReservoirFillingRateEndMlPerSec ?? 70,
    laAVPlaneEjectionRateStartMlPerSec: overrides.laAVPlaneEjectionRateStartMlPerSec ?? 20,
    laAVPlaneEjectionRateEndMlPerSec: overrides.laAVPlaneEjectionRateEndMlPerSec ?? 80,
    laAVPlaneReservoirCapacityRiseTauSec: overrides.laAVPlaneReservoirCapacityRiseTauSec ?? 0.055,
    laAVPlaneReservoirCapacityFallTauSec: overrides.laAVPlaneReservoirCapacityFallTauSec ?? 0.30,
    laAVPlaneReservoirCapacityReleaseTauSec: overrides.laAVPlaneReservoirCapacityReleaseTauSec ?? 0.085,
    laAVPlaneReservoirCapacityMvOpenReleaseThreshold01:
      overrides.laAVPlaneReservoirCapacityMvOpenReleaseThreshold01 ?? 0.20,
    laAVPlaneVenousReservoirCouplingGain: overrides.laAVPlaneVenousReservoirCouplingGain ?? 0,
    laAVPlaneVenousReservoirMaxFlowMlPerSec: overrides.laAVPlaneVenousReservoirMaxFlowMlPerSec ?? 0,
    laAVPlaneVenousReservoirMvOpenReleaseThreshold01:
      overrides.laAVPlaneVenousReservoirMvOpenReleaseThreshold01 ?? 0.18,
    laAVPlaneReservoirReferenceGainMl: overrides.laAVPlaneReservoirReferenceGainMl ?? 0,
    laAVPlaneReservoirTractionGainMmHgPerNormPerSec:
      overrides.laAVPlaneReservoirTractionGainMmHgPerNormPerSec ?? 0,
    laAVPlaneReservoirTractionPressureRiseTauSec:
      overrides.laAVPlaneReservoirTractionPressureRiseTauSec ?? 0.050,
    laAVPlaneReservoirTractionPressureFallTauSec:
      overrides.laAVPlaneReservoirTractionPressureFallTauSec ?? 0.18,
    laAVPlaneReservoirTractionPressureReleaseTauSec:
      overrides.laAVPlaneReservoirTractionPressureReleaseTauSec ?? 0.045,
    laAVPlaneReservoirTractionPressureMaxRateMmHgPerSec:
      overrides.laAVPlaneReservoirTractionPressureMaxRateMmHgPerSec ?? 180,
    laAVPlaneWorkCoordinateAnnularAreaCm2:
      overrides.laAVPlaneWorkCoordinateAnnularAreaCm2 ?? 20 / 1.2,
    laAVPlaneWorkCoordinateDriveForceN:
      overrides.laAVPlaneWorkCoordinateDriveForceN ?? 0,
    laAVPlaneWorkCoordinateStiffnessNPerNorm:
      overrides.laAVPlaneWorkCoordinateStiffnessNPerNorm ?? 0,
    laAVPlaneWorkCoordinateDampingNsecPerNorm:
      overrides.laAVPlaneWorkCoordinateDampingNsecPerNorm ?? 0,
    laAVPlaneWorkCoordinateMassKg:
      overrides.laAVPlaneWorkCoordinateMassKg ?? 0.035,
    laAVPlaneWorkCoordinateMaxVelocityNormPerSec:
      overrides.laAVPlaneWorkCoordinateMaxVelocityNormPerSec ?? 1.8,
    laAVPlaneReservoirRecoilPressureGainMmHg:
      overrides.laAVPlaneReservoirRecoilPressureGainMmHg ?? 0,
    laAVPlaneReservoirRecoilRiseTauSec:
      overrides.laAVPlaneReservoirRecoilRiseTauSec ?? 0.08,
    laAVPlaneReservoirRecoilFallTauSec:
      overrides.laAVPlaneReservoirRecoilFallTauSec ?? 0.18,
    laAVPlaneReservoirRecoilStartTheta:
      overrides.laAVPlaneReservoirRecoilStartTheta ?? 0.34,
    laAVPlaneReservoirRecoilEndTheta:
      overrides.laAVPlaneReservoirRecoilEndTheta ?? 0.68,
    laBoosterPressureGainMmHg: overrides.laBoosterPressureGainMmHg ?? 0,
    laBoosterPressureRiseTauSec: overrides.laBoosterPressureRiseTauSec ?? 0.045,
    laBoosterPressureFallTauSec: overrides.laBoosterPressureFallTauSec ?? 0.12,
    laBoosterPressureStartTheta: overrides.laBoosterPressureStartTheta ?? 0.76,
    laBoosterPressureEndTheta: overrides.laBoosterPressureEndTheta ?? 0.98,
  };
}

export function runLeftHeartSubsystemV2(params: LeftHeartSubsystemParamsV2): LeftHeartSubsystemRunV2 {
  const cycleLengthSec = 60 / params.heartRateBpm;
  const dtSec = 1 / params.sampleRateHz;
  const sampleCount = Math.round(params.beats * cycleLengthSec * params.sampleRateHz);
  let state: LeftHeartSubsystemStateV2 = {
    laVolumeMl: params.initialLaVolumeMl,
    lvVolumeMl: params.initialLvVolumeMl,
    rootPressureMmHg: params.rootInitialPressureMmHg,
    pulmonaryVenousPressureMmHg: params.pulmonaryVenousInitialPressureMmHg,
    lv: initialOneFiberChamberStateV1(params.initialLvVolumeMl, params.lv),
    laFiber: initialAtrialFiberChamberStateV1(
      params.initialLaVolumeMl,
      DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA,
    ),
    mv: initialFlowStateValveStateV1(),
    aov: initialFlowStateValveStateV1(),
    rootOutflowStatefulDrive01: 0,
    laReservoirSuctionDrive01: 0,
    laReservoirRecoilDrive01: 0,
    laAVPlaneReservoirTractionPressureStateMmHg: 0,
    laAVPlaneWorkCoordinateZNorm: 0,
    laAVPlaneWorkCoordinateZDotNormPerSec: 0,
    laAVPlaneWorkCoordinateDriveForceN: 0,
    laBoosterPressureDrive01: 0,
    clampCount: 0,
  };
  const samples: LeftHeartSubsystemSampleV2[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const tSec = i * dtSec;
    const beat = Math.floor(tSec / cycleLengthSec);
    const theta = (tSec - beat * cycleLengthSec) / cycleLengthSec;
    const activationTimeSec = beat * cycleLengthSec + 0.13 * cycleLengthSec;
    const previousVolumes = {
      laVolumeMl: state.laVolumeMl,
      lvVolumeMl: state.lvVolumeMl,
      rootPressureMmHg: state.rootPressureMmHg,
      pulmonaryVenousPressureMmHg: state.pulmonaryVenousPressureMmHg,
    };
    const initialCandidate = previousVolumes;
    const result = runMechanicsFixedPointTransactionV2(
      initialCandidate,
      {
        iterations: params.transactionMode === "explicit-single" ? 1 : params.transactionIterations,
        relaxation: params.transactionRelaxation,
        residualTolerance: params.transactionResidualToleranceMl,
      },
      (candidate) => acceptLeftHeartCandidateV2({
        candidate,
        previous: previousVolumes,
        previousLvState: state.lv,
        previousLaFiberState: state.laFiber,
        previousMvState: state.mv,
        previousAovState: state.aov,
        previousRootOutflowStatefulDrive01: state.rootOutflowStatefulDrive01,
        previousLaReservoirSuctionDrive01: state.laReservoirSuctionDrive01,
        previousLaReservoirRecoilDrive01: state.laReservoirRecoilDrive01,
        previousLaAVPlaneReservoirTractionPressureStateMmHg: state.laAVPlaneReservoirTractionPressureStateMmHg,
        previousLaAVPlaneWorkCoordinateZNorm: state.laAVPlaneWorkCoordinateZNorm,
        previousLaAVPlaneWorkCoordinateZDotNormPerSec: state.laAVPlaneWorkCoordinateZDotNormPerSec,
        previousLaBoosterPressureDrive01: state.laBoosterPressureDrive01,
        tSec,
        dtSec,
        cycleLengthSec,
        activationTimeSec,
        theta,
        params,
      }),
      (candidate, accepted) => rootMeanSquareResidualV2([
        accepted.laVolumeMl - candidate.laVolumeMl,
        accepted.lvVolumeMl - candidate.lvVolumeMl,
        accepted.rootPressureMmHg - candidate.rootPressureMmHg,
        accepted.pulmonaryVenousPressureMmHg - candidate.pulmonaryVenousPressureMmHg,
      ]),
      (candidate, accepted, relaxation) => ({
        laVolumeMl: lerpV2(candidate.laVolumeMl, accepted.laVolumeMl, relaxation),
        lvVolumeMl: lerpV2(candidate.lvVolumeMl, accepted.lvVolumeMl, relaxation),
        rootPressureMmHg: lerpV2(candidate.rootPressureMmHg, accepted.rootPressureMmHg, relaxation),
        pulmonaryVenousPressureMmHg: lerpV2(
          candidate.pulmonaryVenousPressureMmHg,
          accepted.pulmonaryVenousPressureMmHg,
          relaxation,
        ),
      }),
    );
    const accepted = result.accepted;
    const massResidualMl =
      (accepted.lvVolumeMl - state.lvVolumeMl) - dtSec * (accepted.mv.qMlPerSec - accepted.aov.qMlPerSec)
      + (accepted.laVolumeMl - state.laVolumeMl) - dtSec * (accepted.qPulmonaryVenousMlPerSec - accepted.mv.qMlPerSec);
    samples.push({
      tSec,
      beat,
      theta,
      laVolumeMl: state.laVolumeMl,
      lvVolumeMl: state.lvVolumeMl,
      acceptedLaVolumeMl: accepted.laVolumeMl,
      acceptedLvVolumeMl: accepted.lvVolumeMl,
      lvpMmHg: accepted.lvpRawMmHg + accepted.lvpSafetyMmHg,
      lvpRawMmHg: accepted.lvpRawMmHg,
      lvpSafetyMmHg: accepted.lvpSafetyMmHg,
      lapMmHg: accepted.lapRawMmHg + accepted.lapSafetyMmHg,
      lapRawMmHg: accepted.lapRawMmHg,
      lapSafetyMmHg: accepted.lapSafetyMmHg,
      lapEmpiricalAWaveMmHg: accepted.lapEmpiricalAWaveMmHg,
      lapFiberActivePressureMmHg: accepted.lapFiberActivePressureMmHg,
      lapFiberActivePulse01: accepted.lapFiberActivePulse01,
      lapPressureSourceMode: params.laPressureSourceMode,
      laEffectiveGeometryMode: params.laEffectiveGeometryMode,
      laEffectiveGeometryDeltaMl: accepted.avPlaneGeometryReadback.atrialGeometryDeltaMl,
      laReservoirGeometryDeltaMl: accepted.laReservoirGeometryDeltaMl,
      laBoosterGeometryDeltaMl: accepted.laBoosterGeometryDeltaMl,
      laEffectiveGeometryHiddenBloodVolumeSourceMl: accepted.avPlaneGeometryReadback.hiddenBloodVolumeSourceMl,
      laAVPlaneReservoirTractionPressureMmHg: accepted.laAVPlaneReservoirTractionPressureMmHg,
      laAVPlaneReservoirTractionPressureTargetMmHg: accepted.laAVPlaneReservoirTractionPressureTargetMmHg,
      laAVPlaneReservoirTractionPressureStateMmHg: accepted.laAVPlaneReservoirTractionPressureStateMmHg,
      laAVPlaneWorkCoordinateZNorm: accepted.laAVPlaneWorkCoordinateZNorm,
      laAVPlaneWorkCoordinateZDotNormPerSec: accepted.laAVPlaneWorkCoordinateZDotNormPerSec,
      laAVPlaneWorkCoordinateDriveForceN: accepted.laAVPlaneWorkCoordinateDriveForceN,
      laAVPlaneWorkCoordinatePressureMmHg: accepted.laAVPlaneWorkCoordinatePressureMmHg,
      laAPrimeProxyCmPerSec: accepted.avPlaneGeometryReadback.aPrimeProxyCmPerSec,
      laLobeGeneratorMode: params.laLobeGeneratorMode,
      laReservoirSuctionDrive01: accepted.laReservoirSuctionDrive01,
      laReservoirSuctionPressureMmHg: accepted.laReservoirSuctionPressureMmHg,
      laReservoirRecoilDrive01: accepted.laReservoirRecoilDrive01,
      laReservoirRecoilPressureMmHg: accepted.laReservoirRecoilPressureMmHg,
      laReservoirReferenceVolumeShiftMl: accepted.laReservoirReferenceVolumeShiftMl,
      laBoosterPressureDrive01: accepted.laBoosterPressureDrive01,
      laBoosterPressureMmHg: accepted.laBoosterPressureMmHg,
      rootPressureMmHg: state.rootPressureMmHg,
      acceptedRootPressureMmHg: accepted.rootPressureMmHg,
      pulmonaryVenousPressureMmHg: state.pulmonaryVenousPressureMmHg,
      acceptedPulmonaryVenousPressureMmHg: accepted.pulmonaryVenousPressureMmHg,
      qMvMlPerSec: accepted.mv.qMlPerSec,
      qAovMlPerSec: accepted.aov.qMlPerSec,
      qPulmonaryVenousMlPerSec: accepted.qPulmonaryVenousMlPerSec,
      qPulmonaryVenousSourceMlPerSec: accepted.qPulmonaryVenousSourceMlPerSec,
      qAVPlaneReservoirKinematicMlPerSec: accepted.qAVPlaneReservoirKinematicMlPerSec,
      rootOutResistanceEffectiveMmHgSecPerMl: accepted.rootOutResistanceEffectiveMmHgSecPerMl,
      rootOutflowHighPressureDrive01: accepted.rootOutflowHighPressureDrive01,
      rootOutflowStatefulDrive01: accepted.rootOutflowStatefulDrive01,
      mvOpen01: accepted.mv.open01,
      aovOpen01: accepted.aov.open01,
      lvChamber: accepted.lvChamber,
      laFiberChamber: accepted.laFiberChamber,
      mv: accepted.mv,
      aov: accepted.aov,
      avPlaneGeometryReadback: accepted.avPlaneGeometryReadback,
      rootOutflowMlPerSec: accepted.rootOutflowMlPerSec,
      massResidualMl,
      transactionResidualNormMl: result.residualNorm,
      transactionConverged01: result.converged ? 1 : 0,
      transactionIterationsUsed: result.iterationsUsed,
      volumeClampHit01: accepted.volumeClampHit01,
      laVolumeClampHit01: accepted.laVolumeClampHit01,
      lvVolumeClampHit01: accepted.lvVolumeClampHit01,
      iterationLog: result.iterationLog,
    });
    state = {
      laVolumeMl: accepted.laVolumeMl,
      lvVolumeMl: accepted.lvVolumeMl,
      rootPressureMmHg: accepted.rootPressureMmHg,
      pulmonaryVenousPressureMmHg: accepted.pulmonaryVenousPressureMmHg,
      lv: accepted.lvChamber.state,
      laFiber: accepted.laFiberChamber.state,
      mv: accepted.mv.state,
      aov: accepted.aov.state,
      rootOutflowStatefulDrive01: accepted.rootOutflowStatefulDrive01,
      laReservoirSuctionDrive01: accepted.laReservoirSuctionDrive01,
      laReservoirRecoilDrive01: accepted.laReservoirRecoilDrive01,
      laAVPlaneReservoirTractionPressureStateMmHg: accepted.laAVPlaneReservoirTractionPressureStateMmHg,
      laAVPlaneWorkCoordinateZNorm: accepted.laAVPlaneWorkCoordinateZNorm,
      laAVPlaneWorkCoordinateZDotNormPerSec: accepted.laAVPlaneWorkCoordinateZDotNormPerSec,
      laAVPlaneWorkCoordinateDriveForceN: accepted.laAVPlaneWorkCoordinateDriveForceN,
      laBoosterPressureDrive01: accepted.laBoosterPressureDrive01,
      clampCount: state.clampCount + accepted.volumeClampHit01,
    };
  }
  const finalBeat = params.beats - 2;
  const finalBeatSamples = samples.filter((sample) => sample.beat === finalBeat);
  return { params, samples, finalBeatSamples, clampCount: state.clampCount };
}

function acceptLeftHeartCandidateV2(input: {
  readonly candidate: CandidateV2;
  readonly previous: CandidateV2;
  readonly previousLvState: OneFiberChamberStateV1;
  readonly previousLaFiberState: AtrialFiberChamberStateV1;
  readonly previousMvState: FlowStateValveStateV1;
  readonly previousAovState: FlowStateValveStateV1;
  readonly previousRootOutflowStatefulDrive01: number;
  readonly previousLaReservoirSuctionDrive01: number;
  readonly previousLaReservoirRecoilDrive01: number;
  readonly previousLaAVPlaneReservoirTractionPressureStateMmHg: number;
  readonly previousLaAVPlaneWorkCoordinateZNorm: number;
  readonly previousLaAVPlaneWorkCoordinateZDotNormPerSec: number;
  readonly previousLaBoosterPressureDrive01: number;
  readonly tSec: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly activationTimeSec: number;
  readonly theta: number;
  readonly params: LeftHeartSubsystemParamsV2;
}): AcceptedV2 {
  const lvChamber = stepOneFiberChamberV1(input.previousLvState, {
    tSec: input.tSec,
    dtSec: input.dtSec,
    cycleLengthSec: input.cycleLengthSec,
    activationTimeSec: input.activationTimeSec,
    cavityVolumeMl: input.candidate.lvVolumeMl,
    previousCavityVolumeMl: input.previous.lvVolumeMl,
  }, input.params.lv);
  const laReservoirSuctionDrive01 = nextLaReservoirSuctionDrive01(
    input.previousLaReservoirSuctionDrive01,
    input.theta,
    input.dtSec,
    input.params,
    input.candidate.laVolumeMl - input.previous.laVolumeMl,
    input.previous.lvVolumeMl - input.candidate.lvVolumeMl,
    input.previousMvState.open01,
  );
  const laBoosterPressureDrive01 = nextLaBoosterPressureDrive01(
    input.previousLaBoosterPressureDrive01,
    input.theta,
    input.dtSec,
    input.params,
  );
  const laReservoirRecoilDrive01 = nextLaReservoirRecoilDrive01(
    input.previousLaReservoirRecoilDrive01,
    laReservoirSuctionDrive01,
    input.previousMvState.open01,
    input.theta,
    input.dtSec,
    input.params,
  );
  const laAVPlaneWorkCoordinate = nextLeftAtrialAVPlaneWorkCoordinateV1({
    previousZNorm: input.previousLaAVPlaneWorkCoordinateZNorm,
    previousZDotNormPerSec: input.previousLaAVPlaneWorkCoordinateZDotNormPerSec,
    reservoirDrive01: laReservoirSuctionDrive01,
    previousMvOpen01: input.previousMvState.open01,
    dtSec: input.dtSec,
    params: input.params,
  });
  const avPlaneGeometryReadback = leftAtrialEffectiveGeometryReadback(input, {
    reservoirDrive01: laReservoirSuctionDrive01,
    boosterDrive01: laBoosterPressureDrive01,
    previousReservoirDrive01: input.previousLaReservoirSuctionDrive01,
    previousBoosterDrive01: input.previousLaBoosterPressureDrive01,
    workCoordinateZNorm: laAVPlaneWorkCoordinate.zNorm,
    previousWorkCoordinateZNorm: input.previousLaAVPlaneWorkCoordinateZNorm,
  });
  const previousAvPlaneGeometryReadback = leftAtrialEffectiveGeometryReadback({
    ...input,
    candidate: input.previous,
  }, {
    reservoirDrive01: input.previousLaReservoirSuctionDrive01,
    boosterDrive01: input.previousLaBoosterPressureDrive01,
    previousReservoirDrive01: input.previousLaReservoirSuctionDrive01,
    previousBoosterDrive01: input.previousLaBoosterPressureDrive01,
    workCoordinateZNorm: input.previousLaAVPlaneWorkCoordinateZNorm,
    previousWorkCoordinateZNorm: input.previousLaAVPlaneWorkCoordinateZNorm
      - input.previousLaAVPlaneWorkCoordinateZDotNormPerSec * input.dtSec,
  });
  const effectiveLaVolumeMl = leftAtrialEffectiveFiberVolumeMl(
    input.candidate.laVolumeMl,
    avPlaneGeometryReadback.atrialGeometryDeltaMl,
    input.params,
  );
  const previousEffectiveLaVolumeMl = leftAtrialEffectiveFiberVolumeMl(
    input.previous.laVolumeMl,
    previousAvPlaneGeometryReadback.atrialGeometryDeltaMl,
    input.params,
  );
  const laReservoirReferenceVolumeShiftMl = leftAtrialReferenceVolumeShiftMl(
    laReservoirSuctionDrive01,
    input.params,
  );
  const previousLaReservoirReferenceVolumeShiftMl = leftAtrialReferenceVolumeShiftMl(
    input.previousLaReservoirSuctionDrive01,
    input.params,
  );
  const laFiberChamber = stepAtrialFiberChamberV1(input.previousLaFiberState, {
    tSec: input.tSec,
    dtSec: input.dtSec,
    cycleLengthSec: input.cycleLengthSec,
    activationTimeSec: input.tSec - input.theta * input.cycleLengthSec
      + positiveModulo(input.params.laAWaveStartTheta - 0.10, 1) * input.cycleLengthSec,
    cavityVolumeMl: effectiveLaVolumeMl,
    previousCavityVolumeMl: previousEffectiveLaVolumeMl,
    referenceCavityVolumeShiftMl: laReservoirReferenceVolumeShiftMl,
    previousReferenceCavityVolumeShiftMl: previousLaReservoirReferenceVolumeShiftMl,
  }, DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA);
  const lapEmpiricalAWaveMmHg =
    input.params.laAWaveMmHg
    * raisedCosineWindow(input.theta, input.params.laAWaveStartTheta, input.params.laAWaveEndTheta);
  const lapFiberActivePulse01 = clamp(
    laFiberChamber.activePressureMmHg / Math.max(input.params.laFiberActivePressureReferenceMmHg, 1e-9),
    0,
    1.6,
  ) * raisedCosineWindow(input.theta, input.params.laAWaveStartTheta, input.params.laAWaveEndTheta);
  const laReservoirSuctionPressureMmHg =
    -input.params.laReservoirSuctionPressureGainMmHg * laReservoirSuctionDrive01;
  const laAVPlaneReservoirTractionPressureTargetMmHg = leftAtrialAVPlaneReservoirTractionPressureTargetMmHg(
    avPlaneGeometryReadback.zAvDotNormPerSec,
    laReservoirSuctionDrive01,
    input.previousMvState.open01,
    input.params,
  );
  const laAVPlaneReservoirTractionPressureMmHg =
    input.params.laLobeGeneratorMode === "av-plane-force-position-reservoir-transaction-v1"
      ? laAVPlaneWorkCoordinate.tractionPressureMmHg
      : nextLeftAtrialAVPlaneReservoirTractionPressureMmHg(
        input.previousLaAVPlaneReservoirTractionPressureStateMmHg,
        laAVPlaneReservoirTractionPressureTargetMmHg,
        input.previousMvState.open01,
        input.dtSec,
        input.params,
      );
  const laReservoirRecoilPressureMmHg =
    input.params.laAVPlaneReservoirRecoilPressureGainMmHg * laReservoirRecoilDrive01;
  const laBoosterPressureMmHg =
    input.params.laBoosterPressureGainMmHg * laBoosterPressureDrive01;
  const laReservoirGeometryDeltaMl =
    input.params.laEffectiveGeometryMode === "lobe-state-capacity-volume-shadow"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-volume-shadow"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-transaction-v1"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-stretch-transaction-v1"
    || input.params.laEffectiveGeometryMode === "av-plane-force-position-reservoir-transaction-v1"
    ? avPlaneGeometryReadback.atrialGeometryDeltaMl
    : 0;
  const laBoosterGeometryDeltaMl =
    input.params.laEffectiveGeometryMode === "lobe-state-capacity-volume-shadow"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-volume-shadow"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-transaction-v1"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-stretch-transaction-v1"
    ? input.params.laBoosterGeometryGainMl * laBoosterPressureDrive01
    : 0;
  const lapRawMmHg = Math.max(0, leftAtrialPressureRaw(
    input.theta,
    input.candidate.laVolumeMl,
    input.params,
    lapFiberActivePulse01,
    laFiberChamber.pressureRawMmHg,
    laFiberChamber.activePressureMmHg,
  ) + laReservoirSuctionPressureMmHg + laReservoirRecoilPressureMmHg
    + laAVPlaneReservoirTractionPressureMmHg + laBoosterPressureMmHg);
  const lapSafetyMmHg = safetyPressureMmHg(
    input.candidate.laVolumeMl,
    input.params.minLaVolumeMl,
    input.params.maxLaVolumeMl,
    input.params.laSoftLimitGainMmHgPerMl,
    input.params.laLowerSoftLimitGainMmHgPerMl,
    input.params.volumeSafetyMode,
  );
  const lvpSafetyMmHg = safetyPressureMmHg(
    input.candidate.lvVolumeMl,
    input.params.minLvVolumeMl,
    input.params.maxLvVolumeMl,
    input.params.lvSoftLimitGainMmHgPerMl,
    input.params.lvLowerSoftLimitGainMmHgPerMl,
    input.params.volumeSafetyMode,
  );
  const lapMmHg = lapRawMmHg + lapSafetyMmHg;
  const lvpMmHg = lvChamber.pressureRawMmHg + lvpSafetyMmHg;
  const mv = stepFlowStateValveV1(input.previousMvState, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: lapMmHg,
    downstreamPressureMmHg: lvpMmHg,
    closureDrive01: mvSystolicClosureDrive01(input.theta, input.params),
  }, input.params.mv);
  const aov = stepFlowStateValveV1(input.previousAovState, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: lvpMmHg,
    downstreamPressureMmHg: input.candidate.rootPressureMmHg,
  }, input.params.aov);
  const rootOutflowHighPressureDrive01 = rootOutflowHighPressureDrive(input.params, lvpMmHg);
  const rootOutflowStatefulTargetDrive01 = rootOutflowStatefulTargetDrive(input.params, lvpMmHg);
  const rootOutflowStatefulDrive01 = nextRootOutflowStatefulDrive(
    input.previousRootOutflowStatefulDrive01,
    rootOutflowStatefulTargetDrive01,
    input.dtSec,
    input.params,
  );
  const rootOutResistanceEffectiveMmHgSecPerMl =
    input.params.rootOutResistanceMmHgSecPerMl
    * (1 + input.params.rootOutflowHighPressureResistanceGain * rootOutflowHighPressureDrive01)
    * (1 + input.params.rootOutflowStatefulResistanceGain * rootOutflowStatefulDrive01);
  const rootOutflowMlPerSec = Math.max(
    0,
    (input.candidate.rootPressureMmHg - input.params.rootDownstreamPressureMmHg)
      / Math.max(rootOutResistanceEffectiveMmHgSecPerMl, 1e-9),
  );
  const qAVPlaneReservoirKinematicMlPerSec = avPlaneReservoirKinematicFlowMlPerSec(
    previousAvPlaneGeometryReadback.atrialGeometryDeltaMl,
    avPlaneGeometryReadback.atrialGeometryDeltaMl,
    input.previousMvState.open01,
    input.dtSec,
    input.params,
  );
  const pulmonaryBoundary = pulmonaryVenousBoundaryV2(
    input.previous,
    input.candidate,
    lapMmHg,
    input.dtSec,
    input.params,
    qAVPlaneReservoirKinematicMlPerSec,
  );
  const qPulmonaryVenousMlPerSec = pulmonaryBoundary.qPulmonaryVenousMlPerSec;
  const rawNextLvVolumeMl = input.previous.lvVolumeMl + input.dtSec * (mv.qMlPerSec - aov.qMlPerSec);
  const rawNextLaVolumeMl = input.previous.laVolumeMl + input.dtSec * (qPulmonaryVenousMlPerSec - mv.qMlPerSec);
  const rootPressureMmHg = Math.max(
    0,
    input.previous.rootPressureMmHg
      + input.dtSec * (aov.qMlPerSec - rootOutflowMlPerSec) / Math.max(input.params.rootComplianceMlPerMmHg, 1e-9),
  );
  const bounded = boundVolumesV2(rawNextLaVolumeMl, rawNextLvVolumeMl, input.params);
  return {
    ...bounded,
    rootPressureMmHg,
    pulmonaryVenousPressureMmHg: pulmonaryBoundary.pulmonaryVenousPressureMmHg,
    lvChamber,
    laFiberChamber,
    mv,
    aov,
    lapRawMmHg,
    lapSafetyMmHg,
    lvpRawMmHg: lvChamber.pressureRawMmHg,
    lvpSafetyMmHg,
    qPulmonaryVenousMlPerSec,
    qPulmonaryVenousSourceMlPerSec: pulmonaryBoundary.qPulmonaryVenousSourceMlPerSec,
    qAVPlaneReservoirKinematicMlPerSec,
    rootOutResistanceEffectiveMmHgSecPerMl,
    rootOutflowHighPressureDrive01,
    rootOutflowStatefulDrive01,
    rootOutflowMlPerSec,
    lapEmpiricalAWaveMmHg,
    lapFiberActivePressureMmHg: laFiberChamber.activePressureMmHg,
    lapFiberActivePulse01,
    avPlaneGeometryReadback,
    laReservoirSuctionDrive01,
    laReservoirSuctionPressureMmHg,
    laReservoirRecoilDrive01,
    laReservoirRecoilPressureMmHg,
    laAVPlaneReservoirTractionPressureMmHg,
    laAVPlaneReservoirTractionPressureTargetMmHg,
    laAVPlaneReservoirTractionPressureStateMmHg: laAVPlaneReservoirTractionPressureMmHg,
    laAVPlaneWorkCoordinateZNorm: laAVPlaneWorkCoordinate.zNorm,
    laAVPlaneWorkCoordinateZDotNormPerSec: laAVPlaneWorkCoordinate.zDotNormPerSec,
    laAVPlaneWorkCoordinateDriveForceN: laAVPlaneWorkCoordinate.driveForceN,
    laAVPlaneWorkCoordinatePressureMmHg: laAVPlaneWorkCoordinate.tractionPressureMmHg,
    laReservoirGeometryDeltaMl,
    laReservoirReferenceVolumeShiftMl,
    laBoosterPressureDrive01,
    laBoosterPressureMmHg,
    laBoosterGeometryDeltaMl,
  };
}

function leftAtrialEffectiveGeometryReadback(input: {
  readonly candidate: CandidateV2;
  readonly previous: CandidateV2;
  readonly theta: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly params: LeftHeartSubsystemParamsV2;
}, lobeState: {
  readonly reservoirDrive01: number;
  readonly boosterDrive01: number;
  readonly previousReservoirDrive01: number;
  readonly previousBoosterDrive01: number;
  readonly workCoordinateZNorm?: number;
  readonly previousWorkCoordinateZNorm?: number;
} = {
  reservoirDrive01: 0,
  boosterDrive01: 0,
  previousReservoirDrive01: 0,
  previousBoosterDrive01: 0,
}): AVPlaneGeometryReadbackV1 {
  if (input.params.laEffectiveGeometryMode === "none") {
    return disabledAVPlaneGeometryReadbackV1(initialDisabledAVPlaneGeometryStateV1("left"));
  }
  const lvRange = Math.max(input.params.maxLvVolumeMl - input.params.minLvVolumeMl, 1e-9);
  const previousTheta = positiveModulo(input.theta - input.dtSec / Math.max(input.cycleLengthSec, 1e-9), 1);
  const lobeGeometryDeltaMl =
    input.params.laReservoirGeometryGainMl * lobeState.reservoirDrive01
    - input.params.laBoosterGeometryGainMl * lobeState.boosterDrive01;
  const previousLobeGeometryDeltaMl =
    input.params.laReservoirGeometryGainMl * lobeState.previousReservoirDrive01
    - input.params.laBoosterGeometryGainMl * lobeState.previousBoosterDrive01;
  const lobeGeometryScaleMl = Math.max(
    input.params.laReservoirGeometryGainMl + input.params.laBoosterGeometryGainMl,
    1e-9,
  );
  const zAvNorm = input.params.laEffectiveGeometryMode === "phase-reservoir-capacity-volume-shadow"
      ? raisedCosineWindow(input.theta, 0.06, 0.82)
    : input.params.laEffectiveGeometryMode === "lobe-state-capacity-volume-shadow"
      || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-volume-shadow"
      || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-transaction-v1"
      || input.params.laEffectiveGeometryMode === "av-plane-reservoir-stretch-transaction-v1"
      || input.params.laEffectiveGeometryMode === "av-plane-force-position-reservoir-transaction-v1"
      ? input.params.laEffectiveGeometryMode === "av-plane-force-position-reservoir-transaction-v1"
        ? clamp(lobeState.workCoordinateZNorm ?? 0, 0, 1)
        : clamp((lobeGeometryDeltaMl + input.params.laBoosterGeometryGainMl) / lobeGeometryScaleMl, 0, 1)
      : clamp((input.params.maxLvVolumeMl - input.candidate.lvVolumeMl) / lvRange, 0, 1);
  const previousZAvNorm = input.params.laEffectiveGeometryMode === "phase-reservoir-capacity-volume-shadow"
    ? raisedCosineWindow(previousTheta, 0.06, 0.82)
    : input.params.laEffectiveGeometryMode === "lobe-state-capacity-volume-shadow"
      || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-volume-shadow"
      || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-transaction-v1"
      || input.params.laEffectiveGeometryMode === "av-plane-reservoir-stretch-transaction-v1"
      || input.params.laEffectiveGeometryMode === "av-plane-force-position-reservoir-transaction-v1"
      ? input.params.laEffectiveGeometryMode === "av-plane-force-position-reservoir-transaction-v1"
        ? clamp(lobeState.previousWorkCoordinateZNorm ?? 0, 0, 1)
        : clamp((previousLobeGeometryDeltaMl + input.params.laBoosterGeometryGainMl) / lobeGeometryScaleMl, 0, 1)
      : clamp((input.params.maxLvVolumeMl - input.previous.lvVolumeMl) / lvRange, 0, 1);
  const atrialGeometryDeltaMl = input.params.laEffectiveGeometryMode === "lobe-state-capacity-volume-shadow"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-volume-shadow"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-transaction-v1"
    || input.params.laEffectiveGeometryMode === "av-plane-reservoir-stretch-transaction-v1"
    || input.params.laEffectiveGeometryMode === "av-plane-force-position-reservoir-transaction-v1"
    ? input.params.laEffectiveGeometryMode === "av-plane-force-position-reservoir-transaction-v1"
      ? input.params.laReservoirGeometryGainMl * zAvNorm
      : lobeGeometryDeltaMl
    : input.params.laEffectiveGeometryGainMl * zAvNorm;
  return enabledAVPlaneGeometryShadowReadbackV1({
    side: "left",
    theta: input.theta,
    zAvNorm,
    zAvDotNormPerSec: (zAvNorm - previousZAvNorm) / Math.max(input.dtSec, 1e-9),
    atrialGeometryDeltaMl,
    velocityScaleCmPerSec: input.params.laEffectiveGeometryVelocityScaleCmPerSec,
    atrialKickVelocityWindow: [input.params.laAWaveStartTheta, input.params.laAWaveEndTheta],
  });
}

function leftAtrialEffectiveFiberVolumeMl(
  bloodVolumeMl: number,
  atrialGeometryDeltaMl: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  if (params.laEffectiveGeometryMode === "lv-shortening-capacity-volume-shadow") {
    return Math.max(1e-6, bloodVolumeMl - atrialGeometryDeltaMl);
  }
  if (params.laEffectiveGeometryMode === "phase-reservoir-capacity-volume-shadow") {
    return Math.max(1e-6, bloodVolumeMl - atrialGeometryDeltaMl);
  }
  if (params.laEffectiveGeometryMode === "lobe-state-capacity-volume-shadow") {
    return Math.max(1e-6, bloodVolumeMl - atrialGeometryDeltaMl);
  }
  if (params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-volume-shadow") {
    return Math.max(1e-6, bloodVolumeMl - atrialGeometryDeltaMl);
  }
  if (params.laEffectiveGeometryMode === "av-plane-reservoir-capacity-transaction-v1") {
    return Math.max(1e-6, bloodVolumeMl - atrialGeometryDeltaMl);
  }
  if (params.laEffectiveGeometryMode === "av-plane-force-position-reservoir-transaction-v1") {
    return Math.max(1e-6, bloodVolumeMl - atrialGeometryDeltaMl);
  }
  if (params.laEffectiveGeometryMode === "av-plane-reservoir-stretch-transaction-v1") {
    return Math.max(1e-6, bloodVolumeMl + atrialGeometryDeltaMl);
  }
  return Math.max(1e-6, bloodVolumeMl + atrialGeometryDeltaMl);
}

function mvSystolicClosureDrive01(theta: number, params: LeftHeartSubsystemParamsV2): number {
  if (params.mvSystolicClosureDriveGain01 <= 0) return 0;
  return clamp(
    params.mvSystolicClosureDriveGain01
      * raisedCosineWindow(theta, params.mvSystolicClosureDriveStartTheta, params.mvSystolicClosureDriveEndTheta),
    0,
    1,
  );
}

function rootOutflowHighPressureDrive(params: LeftHeartSubsystemParamsV2, lvpMmHg: number): number {
  if (params.rootOutflowHighPressureResistanceGain <= 0) return 0;
  const start = params.rootOutflowHighPressureDriveStartMmHg;
  const end = params.rootOutflowHighPressureDriveEndMmHg;
  if (end <= start) return 0;
  return smoothstep01((lvpMmHg - start) / Math.max(end - start, 1e-9));
}

function rootOutflowStatefulTargetDrive(params: LeftHeartSubsystemParamsV2, lvpMmHg: number): number {
  if (params.rootOutflowStatefulResistanceGain <= 0) return 0;
  const start = params.rootOutflowStatefulDriveStartMmHg;
  const end = params.rootOutflowStatefulDriveEndMmHg;
  if (end <= start) return 0;
  return smoothstep01((lvpMmHg - start) / Math.max(end - start, 1e-9));
}

function nextRootOutflowStatefulDrive(
  previousDrive01: number,
  targetDrive01: number,
  dtSec: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  if (params.rootOutflowStatefulResistanceGain <= 0) return 0;
  const tau = targetDrive01 > previousDrive01
    ? params.rootOutflowStatefulRiseTauSec
    : params.rootOutflowStatefulFallTauSec;
  const step = (targetDrive01 - previousDrive01) * dtSec / Math.max(tau, 1e-6);
  return clamp(previousDrive01 + step, 0, 1);
}

function nextLaReservoirSuctionDrive01(
  previousDrive01: number,
  theta: number,
  dtSec: number,
  params: LeftHeartSubsystemParamsV2,
  laVolumeDeltaMl: number,
  lvEjectionVolumeDeltaMl: number,
  previousMvOpen01: number,
): number {
  if (
    params.laLobeGeneratorMode !== "reservoir-suction-state-shadow"
    && params.laLobeGeneratorMode !== "reservoir-booster-state-shadow"
    && params.laLobeGeneratorMode !== "flow-reservoir-booster-state-shadow"
    && params.laLobeGeneratorMode !== "av-plane-reservoir-booster-state-shadow"
    && params.laLobeGeneratorMode !== "av-plane-reservoir-capacity-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-venous-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-reservoir-strain-reference-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-pressure-capacity-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-two-state-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-traction-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-stateful-traction-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-force-position-reservoir-transaction-v1"
  ) return 0;
  const phaseDrive01 = raisedCosineWindow(
    theta,
    params.laReservoirSuctionStartTheta,
    params.laReservoirSuctionEndTheta,
  );
  const fillingRateMlPerSec = Math.max(0, laVolumeDeltaMl / Math.max(dtSec, 1e-9));
  const fillingDrive01 = smoothstep01(
    (fillingRateMlPerSec - params.laReservoirFillingRateStartMlPerSec)
      / Math.max(
        params.laReservoirFillingRateEndMlPerSec - params.laReservoirFillingRateStartMlPerSec,
        1e-9,
      ),
  );
  const targetDrive01 = params.laLobeGeneratorMode === "flow-reservoir-booster-state-shadow"
    ? phaseDrive01 * fillingDrive01
    : params.laLobeGeneratorMode === "av-plane-reservoir-booster-state-shadow"
      || params.laLobeGeneratorMode === "av-plane-reservoir-capacity-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-venous-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-reservoir-strain-reference-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-pressure-capacity-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-two-state-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-traction-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-stateful-traction-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-force-position-reservoir-transaction-v1"
      ? phaseDrive01 * smoothstep01(
        (Math.max(0, lvEjectionVolumeDeltaMl / Math.max(dtSec, 1e-9))
          - params.laAVPlaneEjectionRateStartMlPerSec)
          / Math.max(
            params.laAVPlaneEjectionRateEndMlPerSec - params.laAVPlaneEjectionRateStartMlPerSec,
            1e-9,
          ),
      )
    : phaseDrive01;
  const mvOpenRelease01 = params.laLobeGeneratorMode === "av-plane-reservoir-capacity-transaction-v1"
    || params.laLobeGeneratorMode === "av-plane-venous-reservoir-transaction-v1"
    || params.laLobeGeneratorMode === "av-plane-reservoir-strain-reference-transaction-v1"
    || params.laLobeGeneratorMode === "av-plane-pressure-capacity-reservoir-transaction-v1"
    || params.laLobeGeneratorMode === "av-plane-two-state-reservoir-transaction-v1"
    || params.laLobeGeneratorMode === "av-plane-traction-reservoir-transaction-v1"
    || params.laLobeGeneratorMode === "av-plane-stateful-traction-reservoir-transaction-v1"
    || params.laLobeGeneratorMode === "av-plane-force-position-reservoir-transaction-v1"
    ? smoothstep01(
      previousMvOpen01
        / Math.max(params.laAVPlaneReservoirCapacityMvOpenReleaseThreshold01, 1e-9),
    )
    : 0;
  const acceptedTargetDrive01 = targetDrive01 * (1 - mvOpenRelease01);
  const tau = acceptedTargetDrive01 > previousDrive01
    ? params.laLobeGeneratorMode === "av-plane-reservoir-capacity-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-venous-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-reservoir-strain-reference-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-pressure-capacity-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-two-state-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-traction-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-stateful-traction-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-force-position-reservoir-transaction-v1"
      ? params.laAVPlaneReservoirCapacityRiseTauSec
      : params.laReservoirSuctionRiseTauSec
    : (params.laLobeGeneratorMode === "av-plane-reservoir-capacity-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-venous-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-reservoir-strain-reference-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-pressure-capacity-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-two-state-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-traction-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-stateful-traction-reservoir-transaction-v1"
      || params.laLobeGeneratorMode === "av-plane-force-position-reservoir-transaction-v1") && mvOpenRelease01 > 0.5
      ? params.laAVPlaneReservoirCapacityReleaseTauSec
      : params.laLobeGeneratorMode === "av-plane-reservoir-capacity-transaction-v1"
        || params.laLobeGeneratorMode === "av-plane-venous-reservoir-transaction-v1"
        || params.laLobeGeneratorMode === "av-plane-reservoir-strain-reference-transaction-v1"
        || params.laLobeGeneratorMode === "av-plane-pressure-capacity-reservoir-transaction-v1"
        || params.laLobeGeneratorMode === "av-plane-two-state-reservoir-transaction-v1"
        || params.laLobeGeneratorMode === "av-plane-traction-reservoir-transaction-v1"
        || params.laLobeGeneratorMode === "av-plane-stateful-traction-reservoir-transaction-v1"
        || params.laLobeGeneratorMode === "av-plane-force-position-reservoir-transaction-v1"
        ? params.laAVPlaneReservoirCapacityFallTauSec
        : params.laReservoirSuctionFallTauSec;
  const step = (acceptedTargetDrive01 - previousDrive01) * dtSec / Math.max(tau, 1e-6);
  return clamp(previousDrive01 + step, 0, 1);
}

function nextLaReservoirRecoilDrive01(
  previousDrive01: number,
  reservoirDrive01: number,
  previousMvOpen01: number,
  theta: number,
  dtSec: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  if (params.laLobeGeneratorMode !== "av-plane-two-state-reservoir-transaction-v1") return 0;
  if (params.laAVPlaneReservoirRecoilPressureGainMmHg <= 0) return 0;
  const lateReservoirWindow01 = raisedCosineWindow(
    theta,
    params.laAVPlaneReservoirRecoilStartTheta,
    params.laAVPlaneReservoirRecoilEndTheta,
  );
  const mvClosedGate01 = 1 - smoothstep01(
    previousMvOpen01 / Math.max(params.laAVPlaneReservoirCapacityMvOpenReleaseThreshold01, 1e-9),
  );
  const targetDrive01 = reservoirDrive01 * lateReservoirWindow01 * mvClosedGate01;
  const tau = targetDrive01 > previousDrive01
    ? params.laAVPlaneReservoirRecoilRiseTauSec
    : params.laAVPlaneReservoirRecoilFallTauSec;
  const step = (targetDrive01 - previousDrive01) * dtSec / Math.max(tau, 1e-6);
  return clamp(previousDrive01 + step, 0, 1);
}

function nextLaBoosterPressureDrive01(
  previousDrive01: number,
  theta: number,
  dtSec: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  if (
    params.laLobeGeneratorMode !== "reservoir-booster-state-shadow"
    && params.laLobeGeneratorMode !== "flow-reservoir-booster-state-shadow"
    && params.laLobeGeneratorMode !== "av-plane-reservoir-booster-state-shadow"
    && params.laLobeGeneratorMode !== "av-plane-reservoir-capacity-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-venous-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-reservoir-strain-reference-transaction-v1"
  ) return 0;
  const targetDrive01 = raisedCosineWindow(
    theta,
    params.laBoosterPressureStartTheta,
    params.laBoosterPressureEndTheta,
  );
  const tau = targetDrive01 > previousDrive01
    ? params.laBoosterPressureRiseTauSec
    : params.laBoosterPressureFallTauSec;
  const step = (targetDrive01 - previousDrive01) * dtSec / Math.max(tau, 1e-6);
  return clamp(previousDrive01 + step, 0, 1);
}

function smoothstep01(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function pulmonaryVenousBoundaryV2(
  previous: CandidateV2,
  candidate: CandidateV2,
  lapMmHg: number,
  dtSec: number,
  params: LeftHeartSubsystemParamsV2,
  qAVPlaneReservoirKinematicMlPerSec: number = 0,
): {
  readonly pulmonaryVenousPressureMmHg: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly qPulmonaryVenousSourceMlPerSec: number;
} {
  if (params.pulmonaryVenousBoundaryMode === "fixed-pressure") {
    const pressure = params.pulmonaryVenousPressureMmHg;
    return {
      pulmonaryVenousPressureMmHg: pressure,
      qPulmonaryVenousMlPerSec: Math.max(
        0,
        (pressure - lapMmHg) / Math.max(params.pulmonaryVenousResistanceMmHgSecPerMl, 1e-9),
      ) + qAVPlaneReservoirKinematicMlPerSec,
      qPulmonaryVenousSourceMlPerSec: 0,
    };
  }
  const candidatePressure = Math.max(0, candidate.pulmonaryVenousPressureMmHg);
  const qPulmonaryVenousSourceMlPerSec = Math.max(
    0,
    (params.pulmonaryVenousSourcePressureMmHg - candidatePressure)
      / Math.max(params.pulmonaryVenousSourceResistanceMmHgSecPerMl, 1e-9),
  );
  const qPulmonaryVenousMlPerSec = Math.max(
    0,
    (candidatePressure - lapMmHg) / Math.max(params.pulmonaryVenousResistanceMmHgSecPerMl, 1e-9),
  ) + qAVPlaneReservoirKinematicMlPerSec;
  const pulmonaryVenousPressureMmHg = Math.max(
    0,
    previous.pulmonaryVenousPressureMmHg
      + dtSec * (qPulmonaryVenousSourceMlPerSec - qPulmonaryVenousMlPerSec)
      / Math.max(params.pulmonaryVenousComplianceMlPerMmHg, 1e-9),
  );
  return {
    pulmonaryVenousPressureMmHg,
    qPulmonaryVenousMlPerSec,
    qPulmonaryVenousSourceMlPerSec,
  };
}

function avPlaneReservoirKinematicFlowMlPerSec(
  previousAtrialGeometryDeltaMl: number,
  atrialGeometryDeltaMl: number,
  previousMvOpen01: number,
  dtSec: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  if (
    params.laLobeGeneratorMode !== "av-plane-venous-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-reservoir-strain-reference-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-traction-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-stateful-traction-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-force-position-reservoir-transaction-v1"
  ) return 0;
  if (params.laAVPlaneVenousReservoirCouplingGain <= 0) return 0;
  if (params.laAVPlaneVenousReservoirMaxFlowMlPerSec <= 0) return 0;
  const geometryExpansionRateMlPerSec = Math.max(
    0,
    (atrialGeometryDeltaMl - previousAtrialGeometryDeltaMl) / Math.max(dtSec, 1e-9),
  );
  const mvClosedGate01 = 1 - smoothstep01(
    previousMvOpen01 / Math.max(params.laAVPlaneVenousReservoirMvOpenReleaseThreshold01, 1e-9),
  );
  return clamp(
    params.laAVPlaneVenousReservoirCouplingGain * geometryExpansionRateMlPerSec * mvClosedGate01,
    0,
    params.laAVPlaneVenousReservoirMaxFlowMlPerSec,
  );
}

function leftAtrialReferenceVolumeShiftMl(
  reservoirDrive01: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  if (params.laLobeGeneratorMode !== "av-plane-reservoir-strain-reference-transaction-v1") return 0;
  return Math.max(0, params.laAVPlaneReservoirReferenceGainMl * reservoirDrive01);
}

function leftAtrialAVPlaneReservoirTractionPressureTargetMmHg(
  zAvDotNormPerSec: number,
  reservoirDrive01: number,
  previousMvOpen01: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  if (
    params.laLobeGeneratorMode !== "av-plane-pressure-capacity-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-traction-reservoir-transaction-v1"
    && params.laLobeGeneratorMode !== "av-plane-stateful-traction-reservoir-transaction-v1"
  ) return 0;
  if (params.laAVPlaneReservoirTractionGainMmHgPerNormPerSec === 0) return 0;
  const mvClosedGate01 = 1 - smoothstep01(
    previousMvOpen01 / Math.max(params.laAVPlaneReservoirCapacityMvOpenReleaseThreshold01, 1e-9),
  );
  if (params.laLobeGeneratorMode === "av-plane-stateful-traction-reservoir-transaction-v1") {
    return params.laAVPlaneReservoirTractionGainMmHgPerNormPerSec
      * reservoirDrive01
      * mvClosedGate01;
  }
  return params.laAVPlaneReservoirTractionGainMmHgPerNormPerSec
    * Math.max(0, zAvDotNormPerSec)
    * mvClosedGate01;
}

function nextLeftAtrialAVPlaneReservoirTractionPressureMmHg(
  previousPressureMmHg: number,
  targetPressureMmHg: number,
  previousMvOpen01: number,
  dtSec: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  if (params.laLobeGeneratorMode !== "av-plane-stateful-traction-reservoir-transaction-v1") {
    return targetPressureMmHg;
  }
  const mvOpenRelease01 = smoothstep01(
    previousMvOpen01 / Math.max(params.laAVPlaneReservoirCapacityMvOpenReleaseThreshold01, 1e-9),
  );
  const acceptedTargetMmHg = targetPressureMmHg * (1 - mvOpenRelease01);
  const tau = acceptedTargetMmHg > previousPressureMmHg
    ? params.laAVPlaneReservoirTractionPressureRiseTauSec
    : mvOpenRelease01 > 0.35
      ? params.laAVPlaneReservoirTractionPressureReleaseTauSec
      : params.laAVPlaneReservoirTractionPressureFallTauSec;
  const unconstrainedStepMmHg =
    (acceptedTargetMmHg - previousPressureMmHg) * dtSec / Math.max(tau, 1e-6);
  const maxStepMmHg =
    Math.max(0, params.laAVPlaneReservoirTractionPressureMaxRateMmHgPerSec) * dtSec;
  const stepMmHg = clamp(unconstrainedStepMmHg, -maxStepMmHg, maxStepMmHg);
  return Math.max(0, previousPressureMmHg + stepMmHg);
}

function nextLeftAtrialAVPlaneWorkCoordinateV1(input: {
  readonly previousZNorm: number;
  readonly previousZDotNormPerSec: number;
  readonly reservoirDrive01: number;
  readonly previousMvOpen01: number;
  readonly dtSec: number;
  readonly params: LeftHeartSubsystemParamsV2;
}): {
  readonly zNorm: number;
  readonly zDotNormPerSec: number;
  readonly driveForceN: number;
  readonly tractionPressureMmHg: number;
} {
  if (input.params.laLobeGeneratorMode !== "av-plane-force-position-reservoir-transaction-v1") {
    return {
      zNorm: 0,
      zDotNormPerSec: 0,
      driveForceN: 0,
      tractionPressureMmHg: 0,
    };
  }
  const mvClosedGate01 = 1 - smoothstep01(
    input.previousMvOpen01 / Math.max(input.params.laAVPlaneReservoirCapacityMvOpenReleaseThreshold01, 1e-9),
  );
  const driveForceN = Math.max(0,
    input.params.laAVPlaneWorkCoordinateDriveForceN * input.reservoirDrive01 * mvClosedGate01,
  );
  const springForceN =
    Math.max(0, input.params.laAVPlaneWorkCoordinateStiffnessNPerNorm) * input.previousZNorm;
  const dampingForceN =
    Math.max(0, input.params.laAVPlaneWorkCoordinateDampingNsecPerNorm) * input.previousZDotNormPerSec;
  const massKg = Math.max(input.params.laAVPlaneWorkCoordinateMassKg, 1e-6);
  const accelerationNormPerSec2 = (driveForceN - springForceN - dampingForceN) / massKg;
  const maxVelocityNormPerSec = Math.max(0.01, input.params.laAVPlaneWorkCoordinateMaxVelocityNormPerSec);
  let zDotNormPerSec = clamp(
    input.previousZDotNormPerSec + accelerationNormPerSec2 * input.dtSec,
    -maxVelocityNormPerSec,
    maxVelocityNormPerSec,
  );
  let zNorm = clamp(input.previousZNorm + zDotNormPerSec * input.dtSec, 0, 1);
  if ((zNorm <= 0 && zDotNormPerSec < 0) || (zNorm >= 1 && zDotNormPerSec > 0)) {
    zDotNormPerSec = 0;
  }
  const areaM2 = Math.max(input.params.laAVPlaneWorkCoordinateAnnularAreaCm2, 1e-9) * 1e-4;
  const tractionPressureMmHg = driveForceN / areaM2 / 133.322368;
  return {
    zNorm,
    zDotNormPerSec,
    driveForceN,
    tractionPressureMmHg,
  };
}

function boundVolumesV2(
  laVolumeMl: number,
  lvVolumeMl: number,
  params: LeftHeartSubsystemParamsV2,
): {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly volumeClampHit01: 0 | 1;
  readonly laVolumeClampHit01: 0 | 1;
  readonly lvVolumeClampHit01: 0 | 1;
} {
  const laMin = params.volumeSafetyMode === "hard-clamp" ? params.minLaVolumeMl : params.absoluteMinLaVolumeMl;
  const laMax = params.volumeSafetyMode === "hard-clamp" ? params.maxLaVolumeMl : params.absoluteMaxLaVolumeMl;
  const lvMin = params.volumeSafetyMode === "hard-clamp" ? params.minLvVolumeMl : params.absoluteMinLvVolumeMl;
  const lvMax = params.volumeSafetyMode === "hard-clamp" ? params.maxLvVolumeMl : params.absoluteMaxLvVolumeMl;
  const boundedLa = clamp(laVolumeMl, laMin, laMax);
  const boundedLv = clamp(lvVolumeMl, lvMin, lvMax);
  const laVolumeClampHit01 = boundedLa === laVolumeMl ? 0 : 1;
  const lvVolumeClampHit01 = boundedLv === lvVolumeMl ? 0 : 1;
  return {
    laVolumeMl: boundedLa,
    lvVolumeMl: boundedLv,
    volumeClampHit01: laVolumeClampHit01 || lvVolumeClampHit01 ? 1 : 0,
    laVolumeClampHit01,
    lvVolumeClampHit01,
  };
}

function safetyPressureMmHg(
  volumeMl: number,
  minVolumeMl: number,
  maxVolumeMl: number,
  upperGainMmHgPerMl: number,
  lowerGainMmHgPerMl: number,
  mode: LeftHeartVolumeSafetyModeV2,
): number {
  if (mode !== "soft-pressure") return 0;
  if (volumeMl > maxVolumeMl) return upperGainMmHgPerMl * (volumeMl - maxVolumeMl);
  if (volumeMl < minVolumeMl) return -lowerGainMmHgPerMl * (minVolumeMl - volumeMl);
  return 0;
}

function leftAtrialPressureRaw(
  theta: number,
  laVolumeMl: number,
  params: LeftHeartSubsystemParamsV2,
  fiberActivePulse01: number,
  fiberChamberPressureMmHg: number,
  fiberActivePressureMmHg: number,
): number {
  if (params.laPressureSourceMode === "fiber-chamber-total-pressure-shadow") {
    return fiberChamberPressureMmHg;
  }
  const complianceBaseline =
    params.laPressureBaselineMmHg
    + (laVolumeMl - params.laReferenceVolumeMl) / Math.max(params.laComplianceMlPerMmHg, 1e-9);
  if (params.laPressureSourceMode === "fiber-active-pressure-additive-shadow") {
    return complianceBaseline + params.laFiberActivePressureGain * fiberActivePressureMmHg;
  }
  const activePulse01 = params.laPressureSourceMode === "fiber-active-a-window-gated-shadow"
    ? fiberActivePulse01
    : raisedCosineWindow(theta, params.laAWaveStartTheta, params.laAWaveEndTheta);
  return complianceBaseline + params.laAWaveMmHg * activePulse01;
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (theta < start || theta > end) return 0;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}
