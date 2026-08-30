import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowV9PressureStationsV1,
  type MainWireAorticOutflowV9PressureStationSummaryV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV9PressureRecoveryBaselineComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
  type MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
  type MainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV9";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ABLATION_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ABLATION_V1_ID,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1,
  type MainWireAorticOutflowV10ConstitutiveOwnershipArmIdV1,
  type MainWireAorticOutflowV10ConstitutiveOwnershipArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10ConstitutiveOwnershipAblationV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  evaluateMainWireValveOpeningTargetAndTangentV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-v10-constitutive-ownership-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    exactFrameMutation: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    comparisonAxes:
      "recovery-law-then-opening-pressure-station-and-energy-ownership" as const,
    proximalPortPressure:
      "Ao-compliance-node-pressure-plus-characteristic-impedance-times-signed-AoV-flow" as const,
    localOpeningDrive:
      "raw-LV-minus-Ao-node-gradient-minus-characteristic-impedance-pressure" as const,
    v10ValveDissipation:
      "source-linear-loss-plus-ELCo-irreversible-loss" as const,
    v10NonvalvularPortPower:
      "fixed-AA-kinetic-transport-plus-arterial-characteristic-wave-load" as const,
    openingTargetAuditedPointwiseAtOwnedPressureStation: true as const,
    compatibilityResistanceReadbackAuditedPointwise: true as const,
    exactPowerBalanceResidualAuditedPointwise: true as const,
    pressureStationGradientAggregation:
      "arithmetic-mean-of-strictly-positive-accepted-AoV-flow-samples" as const,
    exactBeatAccumulatorZeroCrossingInterpolationUsed: false as const,
    independentPeakComponentsAdditive: false as const,
    fixedAscendingAorticGeometryIsSubjectMeasured: false as const,
    systemicRecalibrationApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalThresholdOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowV10ConstitutiveOwnershipInputV1 = Readonly<{
  arm: MainWireAorticOutflowV10ConstitutiveOwnershipArmV1;
  run:
    MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1;
}>;

export type MainWireAorticOutflowV10ConstitutiveAuditV1 = Readonly<{
  openingTargetPressureStation:
    MainWireAorticOutflowV10ConstitutiveOwnershipArmV1["openingDrivePressureStation"];
  forwardSampleCount: number;
  maximumOpeningTargetStationResidual01: number;
  expectedForwardResistanceReadbackMmHgSecPerMl: number;
  maximumForwardResistanceReadbackResidualMmHgSecPerMl: number;
  maximumAbsolutePowerBalanceResidualMmHgMlPerSec: number;
  compatibilityDissipativeEnergyMmHgMl: number;
  reconstructedValveIrreversibleEnergyMmHgMl: number;
  reconstructedDownstreamKineticTransportMmHgMl: number;
  reconstructedCharacteristicWaveLoadMmHgMl: number;
  compatibilityMinusReconstructedValveEnergyMmHgMl: number;
}>;

export type MainWireAorticOutflowV10ConstitutiveOwnershipMeasuredArmV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10ConstitutiveOwnershipArmV1;
    protocolIdentityHash: string;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    valves: MainWireValveDiseaseCycleMetricsV1;
    diastolicFlow:
      MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1;
    summary: MainWireNormalAdultFiveWallPeriodicSummaryV1;
    pressureStations: MainWireAorticOutflowV9PressureStationSummaryV1;
    constitutiveAudit: MainWireAorticOutflowV10ConstitutiveAuditV1;
  }>;

export type MainWireAorticOutflowV10HemodynamicDeltaV1 = Readonly<{
  ejectionTimeSec: number;
  accelerationTimeSec: number;
  aorticForwardVolumeMl: number;
  aorticMaximumFlowMlPerSec: number;
  meanDopplerGradientMmHg: number;
  peakDopplerGradientMmHg: number;
  meanRawNodeGradientMmHg: number;
  peakRawNodeGradientMmHg: number;
  meanLocalPortGradientMmHg: number;
  peakLocalPortGradientMmHg: number;
  meanAorticComplianceNodePressureMmHg: number;
  meanProximalConstitutivePortPressureMmHg: number;
  leftVentricularEjectionFraction01: number;
  leftVentricularIsovolumicContractionTimeSec: number | null;
  leftVentricularIsovolumicRelaxationTimeSec: number | null;
  leftVentricularTeiIndex: number | null;
  maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec: number;
  maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec: number;
}>;

export type MainWireAorticOutflowV10ConstitutiveOwnershipComparisonV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_COMPARISON_V1_ID;
    experimentId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ABLATION_V1_ID;
    predecessorCandidateId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9.candidateId;
    candidateId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId;
    arms:
      readonly MainWireAorticOutflowV10ConstitutiveOwnershipMeasuredArmV1[];
    contrasts: Readonly<{
      rawOpeningRecoveryMinusFullVenaContracta:
        MainWireAorticOutflowV10HemodynamicDeltaV1;
      localOpeningOwnershipMinusRawOpeningRecovery:
        MainWireAorticOutflowV10HemodynamicDeltaV1;
      v10MinusV9FullVenaContracta:
        MainWireAorticOutflowV10HemodynamicDeltaV1;
    }>;
    allExpectedArmsPresent: true;
    allProtocolIdentitiesDistinct: boolean;
    allRunsPeriod1AndIntegrated: boolean;
    allOwnedOpeningTargetsWithinTolerance: boolean;
    allResistanceReadbacksWithinTolerance: boolean;
    allExactPowerBalancesWithinTolerance: boolean;
    v10CompatibilityDissipationMatchesReconstructedValveIrreversibleEnergy:
      boolean;
    experimentClaim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ABLATION_CLAIM_V1;
    analysisClaim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_COMPARISON_CLAIM_V1;
  }>;

export function compareMainWireAorticOutflowV10ConstitutiveOwnershipV1(
  inputs: readonly MainWireAorticOutflowV10ConstitutiveOwnershipInputV1[],
): MainWireAorticOutflowV10ConstitutiveOwnershipComparisonV1 {
  const byArm = new Map(inputs.map((input) => [input.arm.armId, input]));
  if (
    inputs.length
      !== MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1.length
    || byArm.size !== inputs.length
  ) {
    throw new Error("V10 ownership comparison requires one input per arm");
  }
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1.map(
      (armId) => {
        const input = byArm.get(armId);
        if (input === undefined) throw new Error(`missing V10 arm: ${armId}`);
        return measureArm(input);
      },
    ),
  );
  const full = requireArm(arms, "v9-full-vena-contracta-raw-opening");
  const naiveRecovery = requireArm(arms, "v9-garcia-recovery-raw-opening");
  const v10 = requireArm(arms, "v10-garcia-recovery-local-port-opening");
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_COMPARISON_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ABLATION_V1_ID,
    predecessorCandidateId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9.candidateId,
    candidateId: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId,
    arms,
    contrasts: Object.freeze({
      rawOpeningRecoveryMinusFullVenaContracta: delta(naiveRecovery, full),
      localOpeningOwnershipMinusRawOpeningRecovery: delta(v10, naiveRecovery),
      v10MinusV9FullVenaContracta: delta(v10, full),
    }),
    allExpectedArmsPresent: true as const,
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    allOwnedOpeningTargetsWithinTolerance: arms.every((arm) =>
      arm.constitutiveAudit.maximumOpeningTargetStationResidual01 <= 1e-12),
    allResistanceReadbacksWithinTolerance: arms.every((arm) =>
      arm.constitutiveAudit
        .maximumForwardResistanceReadbackResidualMmHgSecPerMl <= 1e-12),
    allExactPowerBalancesWithinTolerance: arms.every((arm) =>
      arm.constitutiveAudit.maximumAbsolutePowerBalanceResidualMmHgMlPerSec
        <= 1e-7),
    v10CompatibilityDissipationMatchesReconstructedValveIrreversibleEnergy:
      Math.abs(
        v10.constitutiveAudit
          .compatibilityMinusReconstructedValveEnergyMmHgMl,
      ) <= 1e-6,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ABLATION_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAorticOutflowV10ConstitutiveOwnershipInputV1,
): MainWireAorticOutflowV10ConstitutiveOwnershipMeasuredArmV1 {
  validateIdentity(input);
  const result = input.run.periodicResult;
  const exactForwardPortMode = input.arm.exactForwardPortLaw
      === "full-vena-contracta-drop-plus-characteristic-load"
    ? "full-vena-contracta-drop" as const
    : "garcia-energy-loss-plus-downstream-kinetic-flux" as const;
  const pressureStations = measureMainWireAorticOutflowV9PressureStationsV1(
    result,
    input.run,
    exactForwardPortMode,
  );
  return Object.freeze({
    arm: input.arm,
    protocolIdentityHash: result.protocolIdentityHash,
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      result,
      input.run.calciumDriveParams,
      input.arm.armId,
    ),
    valves: measureMainWireValveDiseaseCycleMetricsV1(result),
    diastolicFlow:
      measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
        result,
        input.run.calciumDriveParams,
      ),
    summary: summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
      result,
      input.run.calciumDriveParams,
    ),
    pressureStations,
    constitutiveAudit: auditConstitutiveOwnership(input, pressureStations),
  });
}

function auditConstitutiveOwnership(
  input: MainWireAorticOutflowV10ConstitutiveOwnershipInputV1,
  pressureStations: MainWireAorticOutflowV9PressureStationSummaryV1,
): MainWireAorticOutflowV10ConstitutiveAuditV1 {
  const result = input.run.periodicResult;
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined) throw new Error("V10 audit requires a complete beat");
  const params = result.valveResearchInput.valves.AoV;
  const zc = input.run.placementProfile!
    .upstreamValveLinearResistanceAdditionMmHgSecPerMl;
  const expectedResistance = input.arm.recoveredRootPortValveProfileId === null
    ? params.backgroundLinearResistanceMmHgSecPerMl + zc
    : params.backgroundLinearResistanceMmHgSecPerMl;
  let forwardSampleCount = 0;
  let maximumOpeningTargetStationResidual01 = 0;
  let maximumForwardResistanceReadbackResidualMmHgSecPerMl = 0;
  let maximumAbsolutePowerBalanceResidualMmHgMlPerSec = 0;
  let compatibilityDissipativeEnergyMmHgMl = 0;
  for (const sample of beat.samples) {
    const valve = sample.valveHydraulics.AoV;
    const localGradient = valve.pressureGradientMmHg - zc * valve.flowMlPerSec;
    const openingGradient = input.arm.openingDrivePressureStation
        === "LV-minus-proximal-constitutive-port"
      ? localGradient
      : valve.pressureGradientMmHg;
    const expectedTarget = evaluateMainWireValveOpeningTargetAndTangentV2(
      openingGradient,
      params,
    ).openingTarget01;
    maximumOpeningTargetStationResidual01 = Math.max(
      maximumOpeningTargetStationResidual01,
      Math.abs(valve.openingTarget01 - expectedTarget),
    );
    maximumAbsolutePowerBalanceResidualMmHgMlPerSec = Math.max(
      maximumAbsolutePowerBalanceResidualMmHgMlPerSec,
      Math.abs(valve.powerBalanceResidualMmHgMlPerSec),
    );
    compatibilityDissipativeEnergyMmHgMl +=
      valve.dissipativePowerProxyMmHgMlPerSec * result.dtSec;
    if (valve.flowMlPerSec > 0) {
      forwardSampleCount += 1;
      maximumForwardResistanceReadbackResidualMmHgSecPerMl = Math.max(
        maximumForwardResistanceReadbackResidualMmHgSecPerMl,
        Math.abs(valve.resistanceMmHgSecPerMl - expectedResistance),
      );
    }
  }
  if (forwardSampleCount === 0) throw new Error("V10 audit requires forward flow");
  const energy = pressureStations.cycleEnergyMmHgMl;
  const reconstructedValveIrreversibleEnergyMmHgMl =
    energy.sourceValveLinearDissipation
    + energy.geometryIrreversibleConvectiveDissipation;
  return Object.freeze({
    openingTargetPressureStation: input.arm.openingDrivePressureStation,
    forwardSampleCount,
    maximumOpeningTargetStationResidual01,
    expectedForwardResistanceReadbackMmHgSecPerMl: expectedResistance,
    maximumForwardResistanceReadbackResidualMmHgSecPerMl,
    maximumAbsolutePowerBalanceResidualMmHgMlPerSec,
    compatibilityDissipativeEnergyMmHgMl,
    reconstructedValveIrreversibleEnergyMmHgMl,
    reconstructedDownstreamKineticTransportMmHgMl:
      energy.geometryDownstreamKineticTransport,
    reconstructedCharacteristicWaveLoadMmHgMl:
      energy.arterialCharacteristicWaveLoad,
    compatibilityMinusReconstructedValveEnergyMmHgMl:
      compatibilityDissipativeEnergyMmHgMl
      - reconstructedValveIrreversibleEnergyMmHgMl,
  });
}

function validateIdentity(
  input: MainWireAorticOutflowV10ConstitutiveOwnershipInputV1,
): void {
  const run = input.run;
  const candidate = input.arm.candidateId
      === MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId
    ? MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10
    : MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9;
  const issues = [
    mismatch("candidate", input.arm.candidateId, candidate.candidateId),
    mismatch("kuw", run.kuwProfile.profileId, candidate.kuwProfileId),
    mismatch(
      "sarcomere-reference",
      run.sarcomereReferenceProfile.profileId,
      candidate.sarcomereReferenceProfileId,
    ),
    mismatch(
      "calcium-sensitivity-length",
      run.calciumSensitivityLengthProfile.profileId,
      candidate.calciumSensitivityLengthProfileId,
    ),
    mismatch(
      "twitch-retention",
      run.sourceTwitchRetentionCandidate.candidateId,
      candidate.twitchRetentionCandidateId,
    ),
    mismatch(
      "Tref-force-load",
      run.trefForceLoadProfile.profileId,
      candidate.trefForceLoadProfileId,
    ),
    mismatch(
      "velocity-distortion",
      run.sourceVelocityDistortionProfile.profileId,
      candidate.sourceVelocityDistortionProfileId,
    ),
    mismatch(
      "strong-bridge-deactivation",
      run.strongBridgeDeactivationExitProfile.profileId,
      candidate.strongBridgeDeactivationExitProfileId,
    ),
    mismatch(
      "atrioventricular-delay",
      run.atrioventricularDelayProfile.profileId,
      candidate.atrioventricularDelayProfileId,
    ),
    mismatch(
      "arterial-compliance",
      run.complianceProfile.profileId,
      candidate.complianceProfileId,
    ),
    mismatch(
      "characteristic-resistance-placement",
      run.placementProfile?.profileId ?? null,
      candidate.characteristicResistancePlacementProfileId,
    ),
    mismatch(
      "root-inertance",
      run.rootInertanceProfile?.profileId ?? null,
      candidate.rootInertanceProfileId,
    ),
    mismatch("circulatory-load", run.circulatoryLoadPoint.pointId, "baseline"),
    mismatch(
      "stressed-venous-volume",
      run.stressedVenousVolumePoint.pointId,
      "baseline",
    ),
    mismatch(
      "AoV-maximum-EOA",
      run.periodicResult.valveResearchInput.valves.AoV.maximumForwardEoaCm2,
      candidate.aorticMaximumForwardEoaCm2,
    ),
    mismatch(
      "pressure-recovery-profile",
      run.aorticValveResearchProfile?.profileId ?? null,
      input.arm.pressureRecoveryProfileId,
    ),
    mismatch(
      "recovered-root-port-profile",
      run.recoveredRootPortValveProfile?.profileId ?? null,
      input.arm.recoveredRootPortValveProfileId,
    ),
  ].filter((issue): issue is string => issue !== null);
  if (issues.length > 0) {
    throw new Error(
      `V10 constitutive ownership identity mismatch for ${input.arm.armId}: ${issues.join("; ")}`,
    );
  }
  if (
    run.claim.aorticValvePressureStationOwnershipChanged
      !== (input.arm.recoveredRootPortValveProfileId !== null)
  ) {
    throw new Error(`V10 pressure-station claim mismatch: ${input.arm.armId}`);
  }
}

function delta(
  left: MainWireAorticOutflowV10ConstitutiveOwnershipMeasuredArmV1,
  right: MainWireAorticOutflowV10ConstitutiveOwnershipMeasuredArmV1,
): MainWireAorticOutflowV10HemodynamicDeltaV1 {
  return Object.freeze({
    ejectionTimeSec:
      left.cycle.aorticEjectionTimeProxySec
      - right.cycle.aorticEjectionTimeProxySec,
    accelerationTimeSec:
      left.cycle.timeFromAorticFlowOnsetToPeakSec
      - right.cycle.timeFromAorticFlowOnsetToPeakSec,
    aorticForwardVolumeMl:
      left.cycle.aorticForwardVolumeMl - right.cycle.aorticForwardVolumeMl,
    aorticMaximumFlowMlPerSec:
      left.cycle.aorticMaximumFlowMlPerSec
      - right.cycle.aorticMaximumFlowMlPerSec,
    meanDopplerGradientMmHg:
      left.cycle.meanDopplerGradientMmHg
      - right.cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg:
      left.cycle.peakDopplerGradientMmHg
      - right.cycle.peakDopplerGradientMmHg,
    meanRawNodeGradientMmHg:
      left.pressureStations.timeMeanGradientMmHg.rawLvMinusReservoirNode
      - right.pressureStations.timeMeanGradientMmHg.rawLvMinusReservoirNode,
    peakRawNodeGradientMmHg:
      left.pressureStations.peakInstantaneousGradientMmHg
        .rawLvMinusReservoirNode
      - right.pressureStations.peakInstantaneousGradientMmHg
        .rawLvMinusReservoirNode,
    meanLocalPortGradientMmHg:
      left.pressureStations.timeMeanGradientMmHg.exactLvMinusProximalPort
      - right.pressureStations.timeMeanGradientMmHg.exactLvMinusProximalPort,
    peakLocalPortGradientMmHg:
      left.pressureStations.peakInstantaneousGradientMmHg
        .exactLvMinusProximalPort
      - right.pressureStations.peakInstantaneousGradientMmHg
        .exactLvMinusProximalPort,
    meanAorticComplianceNodePressureMmHg:
      left.pressureStations.absolutePressureMmHg.meanAorticReservoirNode
      - right.pressureStations.absolutePressureMmHg.meanAorticReservoirNode,
    meanProximalConstitutivePortPressureMmHg:
      left.pressureStations.absolutePressureMmHg.meanAlgebraicProximalPort
      - right.pressureStations.absolutePressureMmHg.meanAlgebraicProximalPort,
    leftVentricularEjectionFraction01:
      left.cycle.leftVentricularEjectionFraction01
      - right.cycle.leftVentricularEjectionFraction01,
    leftVentricularIsovolumicContractionTimeSec: nullableDifference(
      left.cycle.leftVentricularIsovolumicContractionTimeSec,
      right.cycle.leftVentricularIsovolumicContractionTimeSec,
    ),
    leftVentricularIsovolumicRelaxationTimeSec: nullableDifference(
      left.cycle.leftVentricularIsovolumicRelaxationTimeSec,
      right.cycle.leftVentricularIsovolumicRelaxationTimeSec,
    ),
    leftVentricularTeiIndex: nullableDifference(
      left.cycle.leftVentricularTeiIndex,
      right.cycle.leftVentricularTeiIndex,
    ),
    maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
      left.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec
      - right.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
      left.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec
      - right.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
  });
}

function requireArm(
  arms:
    readonly MainWireAorticOutflowV10ConstitutiveOwnershipMeasuredArmV1[],
  armId: MainWireAorticOutflowV10ConstitutiveOwnershipArmIdV1,
): MainWireAorticOutflowV10ConstitutiveOwnershipMeasuredArmV1 {
  const arm = arms.find((candidate) => candidate.arm.armId === armId);
  if (arm === undefined) throw new Error(`missing measured V10 arm: ${armId}`);
  return arm;
}

function mismatch(
  label: string,
  actual: string | number | null,
  expected: string | number | null,
): string | null {
  return actual === expected
    ? null
    : `${label} expected ${String(expected)}, received ${String(actual)}`;
}

function nullableDifference(
  left: number | null,
  right: number | null,
): number | null {
  return left === null || right === null ? null : left - right;
}
