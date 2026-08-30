import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
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
  MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ABLATION_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ABLATION_V1_ID,
  MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARM_IDS_V1,
  type MainWireAorticOutflowV9PressureRecoveryBaselineArmIdV1,
  type MainWireAorticOutflowV9PressureRecoveryBaselineArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV9PressureRecoveryBaselineAblationV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-v9-pressure-recovery-baseline-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_GEOMETRY_V1 =
  Object.freeze({
    geometryId: "fixed-lvot-d2p3cm-aa-d3p0cm-v1" as const,
    provenance: "fixed-research-bracket" as const,
    lvotDiameterCm: 2.3 as const,
    lvotAreaCm2: Math.PI * (2.3 / 2) ** 2,
    ascendingAorticDiameterCm: 3 as const,
    ascendingAorticAreaCm2: Math.PI * (3 / 2) ** 2,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    exactFrameMutation: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    proximalPortPressure:
      "accepted-Ao-reservoir-node-pressure-plus-moved-characteristic-resistance-times-AoV-flow" as const,
    rawNodeGradient:
      "accepted-LV-chamber-node-minus-Ao-reservoir-node-pressure" as const,
    exactValvePortGradient:
      "raw-node-gradient-minus-proximal-characteristic-pressure" as const,
    fullVenaContractaPortGradient:
      "source-valve-linear-loss-plus-full-EOA-kinetic-head" as const,
    recoveredStaticPortGradient:
      "source-valve-linear-loss-plus-ELCo-irreversible-loss-plus-AA-kinetic-flux" as const,
    simplifiedDopplerGradient:
      "four-times-vena-contracta-velocity-squared" as const,
    lvotCorrectedDopplerGradient:
      "four-times-vena-contracta-minus-LVOT-velocity-squared" as const,
    pressureKindsInterchangeable: false as const,
    characteristicPressureIsArterialNotValvular: true as const,
    characteristicPowerIsWaveLoadNotValveDissipation: true as const,
    recoveryOffFullVenaContractaPortWorkIsNotClaimedPureDissipation:
      true as const,
    recoveryOnEnergyLedgerSeparates:
      "source-valve-linear-dissipation-plus-ELCo-irreversible-dissipation-plus-AA-kinetic-transport-plus-characteristic-wave-load" as const,
    leafletOpeningDriveStillUsesRawNodeGradientIncludingCharacteristicPressure:
      true as const,
    comparisonRole: "combination-ablation-before-V10-constitutive-ownership" as const,
    geometryIsSubjectMeasured: false as const,
    gradientAggregation:
      "arithmetic-mean-of-strictly-positive-accepted-AoV-flow-samples" as const,
    exactBeatAccumulatorZeroCrossingInterpolationUsed: false as const,
    clinicalThresholdOrFitApplied: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    systemicRecalibrationApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowV9PressureRecoveryBaselineInputV1 = Readonly<{
  arm: MainWireAorticOutflowV9PressureRecoveryBaselineArmV1;
  run:
    MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1;
}>;

export type MainWireAorticOutflowV9PressureStationWaveformSampleV1 = Readonly<{
  timeSec: number;
  cyclePhase01: number;
  aorticValveFlowMlPerSec: number;
  leftVentricularChamberPressureMmHg: number;
  aorticReservoirNodePressureMmHg: number;
  proximalCharacteristicPressureMmHg: number;
  algebraicProximalPortPressureMmHg: number;
  rawLvMinusReservoirNodeGradientMmHg: number;
  exactLvMinusProximalPortGradientMmHg: number;
  geometryRecoveredStaticAorticPressureMmHg: number | null;
  venaContractaStaticPressureReadbackMmHg: number | null;
}>;

export type MainWireAorticOutflowV9ForwardStationSampleV1 = Readonly<{
  flowMlPerSec: number;
  activeEoaCm2: number;
  lvotVelocityMPerSec: number;
  venaContractaVelocityMPerSec: number;
  ascendingAorticVelocityMPerSec: number;
  rawNodeGradientMmHg: number;
  proximalCharacteristicPressureMmHg: number;
  exactValvePortGradientMmHg: number;
  sourceValveLinearPressureLossMmHg: number;
  fullVenaContractaConvectivePressureMmHg: number;
  fullVenaContractaPortGradientMmHg: number;
  irreversibleConvectivePressureLossMmHg: number;
  downstreamKineticPressureMmHg: number;
  recoveredStaticPortGradientMmHg: number;
  simplifiedDopplerGradientMmHg: number;
  lvotCorrectedDopplerGradientMmHg: number;
  exactPortReconstructionResidualMmHg: number;
  rawNodeReconstructionResidualMmHg: number;
  algebraicProximalPortPressureMmHg: number;
  geometryRecoveredStaticAorticPressureMmHg: number;
  venaContractaStaticPressureReadbackMmHg: number;
  rawNodePressurePowerMmHgMlPerSec: number;
  sourceValveLinearDissipativePowerMmHgMlPerSec: number;
  acceptedExactConvectivePortPowerMmHgMlPerSec: number;
  geometryIrreversibleConvectivePowerMmHgMlPerSec: number;
  geometryDownstreamKineticTransportPowerMmHgMlPerSec: number;
  arterialCharacteristicWaveLoadPowerMmHgMlPerSec: number;
  exactPowerReconstructionResidualMmHgMlPerSec: number;
}>;

type GradientSummaryV1 = Readonly<{
  rawLvMinusReservoirNode: number;
  proximalCharacteristic: number;
  exactLvMinusProximalPort: number;
  fullVenaContractaPort: number;
  geometryRecoveredStaticPort: number;
  simplifiedDoppler: number;
  lvotCorrectedDoppler: number;
}>;

export type MainWireAorticOutflowV9PressureStationSummaryV1 = Readonly<{
  sourceValveLinearResistanceMmHgSecPerMl: number;
  proximalCharacteristicResistanceMmHgSecPerMl: number;
  exactForwardPortMode:
    MainWireAorticOutflowV9PressureRecoveryBaselineArmV1["expectedExactForwardPort"];
  forwardSampleCount: number;
  forwardFlowTimeSec: number;
  forwardVolumeMl: number;
  peakFlowMlPerSec: number;
  peakLvotVelocityMPerSec: number;
  peakVenaContractaVelocityMPerSec: number;
  peakAscendingAorticVelocityMPerSec: number;
  timeMeanGradientMmHg: GradientSummaryV1;
  peakInstantaneousGradientMmHg: GradientSummaryV1;
  peakToPeakPressureDifferenceMmHg: Readonly<{
    lvPeakMinusReservoirNodePeak: number;
    lvPeakMinusAlgebraicProximalPortPeak: number;
  }>;
  absolutePressureMmHg: Readonly<{
    meanAorticReservoirNode: number;
    meanAlgebraicProximalPort: number;
    peakAorticReservoirNode: number;
    peakAlgebraicProximalPort: number;
    peakLeftVentricularChamber: number;
  }>;
  forwardWaveformSeparationMmHg: Readonly<{
    rmsLvMinusReservoirNode: number;
    rmsLvMinusAlgebraicProximalPort: number;
    rmsLvMinusGeometryRecoveredStatic: number;
  }>;
  cycleEnergyMmHgMl: Readonly<{
    rawNodePressureWork: number;
    sourceValveLinearDissipation: number;
    acceptedExactConvectivePortWork: number;
    geometryIrreversibleConvectiveDissipation: number;
    geometryDownstreamKineticTransport: number;
    arterialCharacteristicWaveLoad: number;
    exactPowerReconstructionResidual: number;
  }>;
  maximumAbsoluteResidualMmHg: Readonly<{
    exactPortReconstruction: number;
    rawNodeReconstruction: number;
  }>;
  waveform: readonly MainWireAorticOutflowV9PressureStationWaveformSampleV1[];
}>;

export type MainWireAorticOutflowV9PressureRecoveryBaselineMeasuredArmV1 =
  Readonly<{
    arm: MainWireAorticOutflowV9PressureRecoveryBaselineArmV1;
    protocolIdentityHash: string;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    valves: MainWireValveDiseaseCycleMetricsV1;
    diastolicFlow:
      MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1;
    summary: MainWireNormalAdultFiveWallPeriodicSummaryV1;
    pressureStations: MainWireAorticOutflowV9PressureStationSummaryV1;
  }>;

export type MainWireAorticOutflowV9PressureRecoveryBaselineContrastV1 =
  Readonly<{
    recoveryOnMinusOff: Readonly<{
      ejectionTimeSec: number;
      accelerationTimeSec: number;
      aorticForwardVolumeMl: number;
      aorticMaximumFlowMlPerSec: number;
      meanDopplerGradientMmHg: number;
      peakDopplerGradientMmHg: number;
      meanRawNodeGradientMmHg: number;
      peakRawNodeGradientMmHg: number;
      meanExactValvePortGradientMmHg: number;
      peakExactValvePortGradientMmHg: number;
      meanAlgebraicProximalPortPressureMmHg: number;
      peakAlgebraicProximalPortPressureMmHg: number;
      meanAorticReservoirNodePressureMmHg: number;
      leftVentricularEjectionFraction01: number;
      leftVentricularIsovolumicContractionTimeSec: number | null;
      leftVentricularIsovolumicRelaxationTimeSec: number | null;
      leftVentricularTeiIndex: number | null;
      maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec: number;
      maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec: number;
    }>;
  }>;

export type MainWireAorticOutflowV9PressureRecoveryBaselineComparisonV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_COMPARISON_V1_ID;
    experimentId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ABLATION_V1_ID;
    candidateId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9.candidateId;
    geometry: typeof MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_GEOMETRY_V1;
    arms:
      readonly MainWireAorticOutflowV9PressureRecoveryBaselineMeasuredArmV1[];
    contrast: MainWireAorticOutflowV9PressureRecoveryBaselineContrastV1;
    allExpectedArmsPresent: true;
    allProtocolIdentitiesDistinct: boolean;
    allRunsPeriod1AndIntegrated: boolean;
    allExactStationResidualsWithinTolerance: boolean;
    experimentClaim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ABLATION_CLAIM_V1;
    analysisClaim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_COMPARISON_CLAIM_V1;
  }>;

export function evaluateMainWireAorticOutflowV9ForwardStationSampleV1(
  input: Readonly<{
    flowMlPerSec: number;
    activeEoaCm2: number;
    leftVentricularPressureMmHg: number;
    aorticReservoirNodePressureMmHg: number;
    rawNodeGradientMmHg: number;
    sourceValveLinearResistanceMmHgSecPerMl: number;
    proximalCharacteristicResistanceMmHgSecPerMl: number;
    exactForwardPortMode:
      MainWireAorticOutflowV9PressureRecoveryBaselineArmV1["expectedExactForwardPort"];
  }>,
): MainWireAorticOutflowV9ForwardStationSampleV1 {
  positiveFinite(input.flowMlPerSec, "flowMlPerSec");
  positiveFinite(input.activeEoaCm2, "activeEoaCm2");
  finite(input.leftVentricularPressureMmHg, "leftVentricularPressureMmHg");
  finite(input.aorticReservoirNodePressureMmHg, "aorticReservoirNodePressureMmHg");
  finite(input.rawNodeGradientMmHg, "rawNodeGradientMmHg");
  nonnegativeFinite(
    input.sourceValveLinearResistanceMmHgSecPerMl,
    "sourceValveLinearResistanceMmHgSecPerMl",
  );
  nonnegativeFinite(
    input.proximalCharacteristicResistanceMmHgSecPerMl,
    "proximalCharacteristicResistanceMmHgSecPerMl",
  );
  const geometry = MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_GEOMETRY_V1;
  if (!(geometry.lvotAreaCm2 > input.activeEoaCm2)) {
    throw new Error("fixed LVOT area must exceed active AoV EOA");
  }
  if (!(geometry.ascendingAorticAreaCm2 > input.activeEoaCm2)) {
    throw new Error("fixed ascending-aortic area must exceed active AoV EOA");
  }
  const flow = input.flowMlPerSec;
  const pressure = (areaCm2: number): number =>
    idealBernoulliLossFromEffectiveOrificeAreaV2(areaCm2) * flow ** 2;
  const velocity = (areaCm2: number): number => flow / (100 * areaCm2);
  const energyLossCoefficientAreaCm2 = input.activeEoaCm2
    * geometry.ascendingAorticAreaCm2
    / (geometry.ascendingAorticAreaCm2 - input.activeEoaCm2);
  const sourceValveLinearPressureLossMmHg =
    input.sourceValveLinearResistanceMmHgSecPerMl * flow;
  const proximalCharacteristicPressureMmHg =
    input.proximalCharacteristicResistanceMmHgSecPerMl * flow;
  const fullVenaContractaConvectivePressureMmHg = pressure(
    input.activeEoaCm2,
  );
  const irreversibleConvectivePressureLossMmHg = pressure(
    energyLossCoefficientAreaCm2,
  );
  const downstreamKineticPressureMmHg = pressure(
    geometry.ascendingAorticAreaCm2,
  );
  const fullVenaContractaPortGradientMmHg =
    sourceValveLinearPressureLossMmHg
    + fullVenaContractaConvectivePressureMmHg;
  const recoveredStaticPortGradientMmHg =
    sourceValveLinearPressureLossMmHg
    + irreversibleConvectivePressureLossMmHg
    + downstreamKineticPressureMmHg;
  const expectedExactPortGradientMmHg = input.exactForwardPortMode
      === "full-vena-contracta-drop"
    ? fullVenaContractaPortGradientMmHg
    : recoveredStaticPortGradientMmHg;
  const exactValvePortGradientMmHg = input.rawNodeGradientMmHg
    - proximalCharacteristicPressureMmHg;
  const algebraicProximalPortPressureMmHg =
    input.aorticReservoirNodePressureMmHg
    + proximalCharacteristicPressureMmHg;
  const geometryRecoveredStaticAorticPressureMmHg =
    input.leftVentricularPressureMmHg - recoveredStaticPortGradientMmHg;
  const venaContractaStaticPressureReadbackMmHg =
    input.leftVentricularPressureMmHg - fullVenaContractaPortGradientMmHg;
  const acceptedExactConvectivePressureMmHg = expectedExactPortGradientMmHg
    - sourceValveLinearPressureLossMmHg;
  const rawNodeReconstructionResidualMmHg = input.rawNodeGradientMmHg
    - proximalCharacteristicPressureMmHg
    - expectedExactPortGradientMmHg;
  const exactPortReconstructionResidualMmHg = exactValvePortGradientMmHg
    - expectedExactPortGradientMmHg;
  const rawNodePressurePowerMmHgMlPerSec =
    input.rawNodeGradientMmHg * flow;
  const sourceValveLinearDissipativePowerMmHgMlPerSec =
    sourceValveLinearPressureLossMmHg * flow;
  const acceptedExactConvectivePortPowerMmHgMlPerSec =
    acceptedExactConvectivePressureMmHg * flow;
  const geometryIrreversibleConvectivePowerMmHgMlPerSec =
    irreversibleConvectivePressureLossMmHg * flow;
  const geometryDownstreamKineticTransportPowerMmHgMlPerSec =
    downstreamKineticPressureMmHg * flow;
  const arterialCharacteristicWaveLoadPowerMmHgMlPerSec =
    proximalCharacteristicPressureMmHg * flow;
  const exactPowerReconstructionResidualMmHgMlPerSec =
    rawNodePressurePowerMmHgMlPerSec
    - sourceValveLinearDissipativePowerMmHgMlPerSec
    - acceptedExactConvectivePortPowerMmHgMlPerSec
    - arterialCharacteristicWaveLoadPowerMmHgMlPerSec;
  const venaContractaVelocityMPerSec = velocity(input.activeEoaCm2);
  const lvotVelocityMPerSec = velocity(geometry.lvotAreaCm2);
  return Object.freeze({
    flowMlPerSec: flow,
    activeEoaCm2: input.activeEoaCm2,
    lvotVelocityMPerSec,
    venaContractaVelocityMPerSec,
    ascendingAorticVelocityMPerSec: velocity(
      geometry.ascendingAorticAreaCm2,
    ),
    rawNodeGradientMmHg: input.rawNodeGradientMmHg,
    proximalCharacteristicPressureMmHg,
    exactValvePortGradientMmHg,
    sourceValveLinearPressureLossMmHg,
    fullVenaContractaConvectivePressureMmHg,
    fullVenaContractaPortGradientMmHg,
    irreversibleConvectivePressureLossMmHg,
    downstreamKineticPressureMmHg,
    recoveredStaticPortGradientMmHg,
    simplifiedDopplerGradientMmHg:
      4 * venaContractaVelocityMPerSec ** 2,
    lvotCorrectedDopplerGradientMmHg: 4 * (
      venaContractaVelocityMPerSec ** 2 - lvotVelocityMPerSec ** 2
    ),
    exactPortReconstructionResidualMmHg,
    rawNodeReconstructionResidualMmHg,
    algebraicProximalPortPressureMmHg,
    geometryRecoveredStaticAorticPressureMmHg,
    venaContractaStaticPressureReadbackMmHg,
    rawNodePressurePowerMmHgMlPerSec,
    sourceValveLinearDissipativePowerMmHgMlPerSec,
    acceptedExactConvectivePortPowerMmHgMlPerSec,
    geometryIrreversibleConvectivePowerMmHgMlPerSec,
    geometryDownstreamKineticTransportPowerMmHgMlPerSec,
    arterialCharacteristicWaveLoadPowerMmHgMlPerSec,
    exactPowerReconstructionResidualMmHgMlPerSec,
  });
}

export function compareMainWireAorticOutflowV9PressureRecoveryBaselineV1(
  inputs: readonly MainWireAorticOutflowV9PressureRecoveryBaselineInputV1[],
): MainWireAorticOutflowV9PressureRecoveryBaselineComparisonV1 {
  const byArm = new Map(inputs.map((input) => [input.arm.armId, input]));
  if (
    inputs.length
      !== MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARM_IDS_V1.length
    || byArm.size !== inputs.length
  ) {
    throw new Error("V9 pressure-recovery comparison requires one input per arm");
  }
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARM_IDS_V1.map(
      (armId) => {
        const input = byArm.get(armId);
        if (input === undefined) {
          throw new Error(`missing V9 pressure-recovery arm: ${armId}`);
        }
        return measureArm(input);
      },
    ),
  );
  const off = requireMeasuredArm(arms, "v9-full-vena-contracta-port");
  const on = requireMeasuredArm(
    arms,
    "v9-garcia-recovered-static-port-aa-d3p0cm",
  );
  const contrast = Object.freeze({
    recoveryOnMinusOff: Object.freeze({
      ejectionTimeSec:
        on.cycle.aorticEjectionTimeProxySec
        - off.cycle.aorticEjectionTimeProxySec,
      accelerationTimeSec:
        on.cycle.timeFromAorticFlowOnsetToPeakSec
        - off.cycle.timeFromAorticFlowOnsetToPeakSec,
      aorticForwardVolumeMl:
        on.cycle.aorticForwardVolumeMl - off.cycle.aorticForwardVolumeMl,
      aorticMaximumFlowMlPerSec:
        on.cycle.aorticMaximumFlowMlPerSec
        - off.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg:
        on.cycle.meanDopplerGradientMmHg
        - off.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg:
        on.cycle.peakDopplerGradientMmHg
        - off.cycle.peakDopplerGradientMmHg,
      meanRawNodeGradientMmHg:
        on.pressureStations.timeMeanGradientMmHg.rawLvMinusReservoirNode
        - off.pressureStations.timeMeanGradientMmHg.rawLvMinusReservoirNode,
      peakRawNodeGradientMmHg:
        on.pressureStations.peakInstantaneousGradientMmHg
          .rawLvMinusReservoirNode
        - off.pressureStations.peakInstantaneousGradientMmHg
          .rawLvMinusReservoirNode,
      meanExactValvePortGradientMmHg:
        on.pressureStations.timeMeanGradientMmHg.exactLvMinusProximalPort
        - off.pressureStations.timeMeanGradientMmHg.exactLvMinusProximalPort,
      peakExactValvePortGradientMmHg:
        on.pressureStations.peakInstantaneousGradientMmHg
          .exactLvMinusProximalPort
        - off.pressureStations.peakInstantaneousGradientMmHg
          .exactLvMinusProximalPort,
      meanAlgebraicProximalPortPressureMmHg:
        on.pressureStations.absolutePressureMmHg.meanAlgebraicProximalPort
        - off.pressureStations.absolutePressureMmHg.meanAlgebraicProximalPort,
      peakAlgebraicProximalPortPressureMmHg:
        on.pressureStations.absolutePressureMmHg.peakAlgebraicProximalPort
        - off.pressureStations.absolutePressureMmHg.peakAlgebraicProximalPort,
      meanAorticReservoirNodePressureMmHg:
        on.pressureStations.absolutePressureMmHg.meanAorticReservoirNode
        - off.pressureStations.absolutePressureMmHg.meanAorticReservoirNode,
      leftVentricularEjectionFraction01:
        on.cycle.leftVentricularEjectionFraction01
        - off.cycle.leftVentricularEjectionFraction01,
      leftVentricularIsovolumicContractionTimeSec: nullableDifference(
        on.cycle.leftVentricularIsovolumicContractionTimeSec,
        off.cycle.leftVentricularIsovolumicContractionTimeSec,
      ),
      leftVentricularIsovolumicRelaxationTimeSec: nullableDifference(
        on.cycle.leftVentricularIsovolumicRelaxationTimeSec,
        off.cycle.leftVentricularIsovolumicRelaxationTimeSec,
      ),
      leftVentricularTeiIndex: nullableDifference(
        on.cycle.leftVentricularTeiIndex,
        off.cycle.leftVentricularTeiIndex,
      ),
      maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
        on.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec
        - off.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
      maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
        on.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec
        - off.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
    }),
  });
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_COMPARISON_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ABLATION_V1_ID,
    candidateId: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9.candidateId,
    geometry: MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_GEOMETRY_V1,
    arms,
    contrast,
    allExpectedArmsPresent: true as const,
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    allExactStationResidualsWithinTolerance: arms.every((arm) =>
      arm.pressureStations.maximumAbsoluteResidualMmHg
        .exactPortReconstruction <= 1e-9
      && arm.pressureStations.maximumAbsoluteResidualMmHg
        .rawNodeReconstruction <= 1e-9),
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ABLATION_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAorticOutflowV9PressureRecoveryBaselineInputV1,
): MainWireAorticOutflowV9PressureRecoveryBaselineMeasuredArmV1 {
  validateCandidateIdentity(input);
  const result = input.run.periodicResult;
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
    pressureStations: measureMainWireAorticOutflowV9PressureStationsV1(
      result,
      input.run,
      input.arm.expectedExactForwardPort,
    ),
  });
}

function validateCandidateIdentity(
  input: MainWireAorticOutflowV9PressureRecoveryBaselineInputV1,
): void {
  const run = input.run;
  const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9;
  const issues = [
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
      "aortic-valve-research-profile",
      run.aorticValveResearchProfile?.profileId ?? null,
      input.arm.pressureRecoveryProfileId,
    ),
    mismatch(
      "recovered-root-port-valve-profile",
      run.recoveredRootPortValveProfile?.profileId ?? null,
      null,
    ),
  ].filter((issue): issue is string => issue !== null);
  if (issues.length > 0) {
    throw new Error(
      `V9 pressure-recovery identity mismatch for ${input.arm.armId}: ${issues.join("; ")}`,
    );
  }
  if (
    input.arm.pressureRecoveryProfileId === null
      ? run.claim.aorticValveConstitutiveLawChanged
      : !run.claim.aorticValveConstitutiveLawChanged
  ) {
    throw new Error(`V9 pressure-recovery claim mismatch: ${input.arm.armId}`);
  }
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

export function measureMainWireAorticOutflowV9PressureStationsV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  run:
    MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
  exactForwardPortMode:
    MainWireAorticOutflowV9PressureRecoveryBaselineArmV1["expectedExactForwardPort"],
): MainWireAorticOutflowV9PressureStationSummaryV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error("V9 pressure stations require a retained complete beat");
  }
  const sourceValveLinearResistanceMmHgSecPerMl =
    result.valveResearchInput.valves.AoV
      .backgroundLinearResistanceMmHgSecPerMl;
  const proximalCharacteristicResistanceMmHgSecPerMl =
    run.placementProfile!
      .upstreamValveLinearResistanceAdditionMmHgSecPerMl;
  const forward = beat.samples.flatMap((sample) => {
    const valve = sample.valveHydraulics.AoV;
    if (!(valve.flowMlPerSec > 0)) return [];
    return [evaluateMainWireAorticOutflowV9ForwardStationSampleV1({
      flowMlPerSec: valve.flowMlPerSec,
      activeEoaCm2: valve.activeEoaCm2,
      leftVentricularPressureMmHg:
        sample.circulationNodeAbsolutePressureMmHg.LV,
      aorticReservoirNodePressureMmHg:
        sample.circulationNodeAbsolutePressureMmHg.Ao,
      rawNodeGradientMmHg: valve.pressureGradientMmHg,
      sourceValveLinearResistanceMmHgSecPerMl,
      proximalCharacteristicResistanceMmHgSecPerMl,
      exactForwardPortMode,
    })];
  });
  if (forward.length === 0) {
    throw new Error("V9 pressure stations require positive AoV flow");
  }
  const waveform = Object.freeze(beat.samples.map((sample) => {
    const flow = sample.circulationEdgeFlowMlPerSec.AoV;
    const lv = sample.circulationNodeAbsolutePressureMmHg.LV;
    const reservoir = sample.circulationNodeAbsolutePressureMmHg.Ao;
    const characteristic =
      proximalCharacteristicResistanceMmHgSecPerMl * flow;
    const port = reservoir + characteristic;
    const valve = sample.valveHydraulics.AoV;
    let recovered: number | null = null;
    let venaContracta: number | null = null;
    if (flow > 0) {
      const station = evaluateMainWireAorticOutflowV9ForwardStationSampleV1({
        flowMlPerSec: flow,
        activeEoaCm2: valve.activeEoaCm2,
        leftVentricularPressureMmHg: lv,
        aorticReservoirNodePressureMmHg: reservoir,
        rawNodeGradientMmHg: valve.pressureGradientMmHg,
        sourceValveLinearResistanceMmHgSecPerMl,
        proximalCharacteristicResistanceMmHgSecPerMl,
        exactForwardPortMode,
      });
      recovered = station.geometryRecoveredStaticAorticPressureMmHg;
      venaContracta = station.venaContractaStaticPressureReadbackMmHg;
    }
    return Object.freeze({
      timeSec: sample.timeSec,
      cyclePhase01: sample.cyclePhase01,
      aorticValveFlowMlPerSec: flow,
      leftVentricularChamberPressureMmHg: lv,
      aorticReservoirNodePressureMmHg: reservoir,
      proximalCharacteristicPressureMmHg: characteristic,
      algebraicProximalPortPressureMmHg: port,
      rawLvMinusReservoirNodeGradientMmHg: lv - reservoir,
      exactLvMinusProximalPortGradientMmHg: lv - port,
      geometryRecoveredStaticAorticPressureMmHg: recovered,
      venaContractaStaticPressureReadbackMmHg: venaContracta,
    });
  }));
  const meanField = (select: (
    sample: MainWireAorticOutflowV9ForwardStationSampleV1,
  ) => number): number => mean(forward.map(select));
  const maxField = (select: (
    sample: MainWireAorticOutflowV9ForwardStationSampleV1,
  ) => number): number => maximum(forward.map(select));
  const sumField = (select: (
    sample: MainWireAorticOutflowV9ForwardStationSampleV1,
  ) => number): number => sum(forward.map(select));
  const gradientSummary = (
    aggregate: (select: (
      sample: MainWireAorticOutflowV9ForwardStationSampleV1,
    ) => number) => number,
  ): GradientSummaryV1 => Object.freeze({
    rawLvMinusReservoirNode: aggregate((sample) => sample.rawNodeGradientMmHg),
    proximalCharacteristic: aggregate((sample) =>
      sample.proximalCharacteristicPressureMmHg),
    exactLvMinusProximalPort: aggregate((sample) =>
      sample.exactValvePortGradientMmHg),
    fullVenaContractaPort: aggregate((sample) =>
      sample.fullVenaContractaPortGradientMmHg),
    geometryRecoveredStaticPort: aggregate((sample) =>
      sample.recoveredStaticPortGradientMmHg),
    simplifiedDoppler: aggregate((sample) =>
      sample.simplifiedDopplerGradientMmHg),
    lvotCorrectedDoppler: aggregate((sample) =>
      sample.lvotCorrectedDopplerGradientMmHg),
  });
  const dtSec = result.dtSec;
  const peakLv = maximum(waveform.map((sample) =>
    sample.leftVentricularChamberPressureMmHg));
  const peakReservoir = maximum(waveform.map((sample) =>
    sample.aorticReservoirNodePressureMmHg));
  const peakPort = maximum(waveform.map((sample) =>
    sample.algebraicProximalPortPressureMmHg));
  return Object.freeze({
    sourceValveLinearResistanceMmHgSecPerMl,
    proximalCharacteristicResistanceMmHgSecPerMl,
    exactForwardPortMode,
    forwardSampleCount: forward.length,
    forwardFlowTimeSec: forward.length * dtSec,
    forwardVolumeMl: sumField((sample) => sample.flowMlPerSec) * dtSec,
    peakFlowMlPerSec: maxField((sample) => sample.flowMlPerSec),
    peakLvotVelocityMPerSec: maxField((sample) =>
      sample.lvotVelocityMPerSec),
    peakVenaContractaVelocityMPerSec: maxField((sample) =>
      sample.venaContractaVelocityMPerSec),
    peakAscendingAorticVelocityMPerSec: maxField((sample) =>
      sample.ascendingAorticVelocityMPerSec),
    timeMeanGradientMmHg: gradientSummary(meanField),
    peakInstantaneousGradientMmHg: gradientSummary(maxField),
    peakToPeakPressureDifferenceMmHg: Object.freeze({
      lvPeakMinusReservoirNodePeak: peakLv - peakReservoir,
      lvPeakMinusAlgebraicProximalPortPeak: peakLv - peakPort,
    }),
    absolutePressureMmHg: Object.freeze({
      meanAorticReservoirNode: mean(waveform.map((sample) =>
        sample.aorticReservoirNodePressureMmHg)),
      meanAlgebraicProximalPort: mean(waveform.map((sample) =>
        sample.algebraicProximalPortPressureMmHg)),
      peakAorticReservoirNode: peakReservoir,
      peakAlgebraicProximalPort: peakPort,
      peakLeftVentricularChamber: peakLv,
    }),
    forwardWaveformSeparationMmHg: Object.freeze({
      rmsLvMinusReservoirNode: rms(forward.map((sample) =>
        sample.rawNodeGradientMmHg)),
      rmsLvMinusAlgebraicProximalPort: rms(forward.map((sample) =>
        sample.exactValvePortGradientMmHg)),
      rmsLvMinusGeometryRecoveredStatic: rms(forward.map((sample) =>
        sample.recoveredStaticPortGradientMmHg)),
    }),
    cycleEnergyMmHgMl: Object.freeze({
      rawNodePressureWork: sumField((sample) =>
        sample.rawNodePressurePowerMmHgMlPerSec) * dtSec,
      sourceValveLinearDissipation: sumField((sample) =>
        sample.sourceValveLinearDissipativePowerMmHgMlPerSec) * dtSec,
      acceptedExactConvectivePortWork: sumField((sample) =>
        sample.acceptedExactConvectivePortPowerMmHgMlPerSec) * dtSec,
      geometryIrreversibleConvectiveDissipation: sumField((sample) =>
        sample.geometryIrreversibleConvectivePowerMmHgMlPerSec) * dtSec,
      geometryDownstreamKineticTransport: sumField((sample) =>
        sample.geometryDownstreamKineticTransportPowerMmHgMlPerSec) * dtSec,
      arterialCharacteristicWaveLoad: sumField((sample) =>
        sample.arterialCharacteristicWaveLoadPowerMmHgMlPerSec) * dtSec,
      exactPowerReconstructionResidual: sumField((sample) =>
        sample.exactPowerReconstructionResidualMmHgMlPerSec) * dtSec,
    }),
    maximumAbsoluteResidualMmHg: Object.freeze({
      exactPortReconstruction: maxField((sample) => Math.abs(
        sample.exactPortReconstructionResidualMmHg,
      )),
      rawNodeReconstruction: maxField((sample) => Math.abs(
        sample.rawNodeReconstructionResidualMmHg,
      )),
    }),
    waveform,
  });
}

function requireMeasuredArm(
  arms:
    readonly MainWireAorticOutflowV9PressureRecoveryBaselineMeasuredArmV1[],
  armId: MainWireAorticOutflowV9PressureRecoveryBaselineArmIdV1,
): MainWireAorticOutflowV9PressureRecoveryBaselineMeasuredArmV1 {
  const arm = arms.find((candidate) => candidate.arm.armId === armId);
  if (arm === undefined) throw new Error(`missing measured arm: ${armId}`);
  return arm;
}

function nullableDifference(
  left: number | null,
  right: number | null,
): number | null {
  return left === null || right === null ? null : left - right;
}

function positiveFinite(value: number, label: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${label} must be positive and finite`);
  }
}

function nonnegativeFinite(value: number, label: string): void {
  if (!(value >= 0) || !Number.isFinite(value)) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}

function maximum(values: readonly number[]): number {
  const value = Math.max(...values);
  if (!Number.isFinite(value)) throw new Error("maximum requires finite values");
  return value;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return sum(values) / values.length;
}

function rms(values: readonly number[]): number {
  return Math.sqrt(mean(values.map((value) => value ** 2)));
}

function sum(values: readonly number[]): number {
  return values.reduce((current, value) => current + value, 0);
}
