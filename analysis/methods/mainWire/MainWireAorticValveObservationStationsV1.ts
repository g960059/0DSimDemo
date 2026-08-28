import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_VALVE_OBSERVATION_STATIONS_V1_ID =
  "main-wire-aortic-valve-observation-stations-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_OBSERVATION_STATIONS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    geometryRole: "versioned-analysis-input-not-fitted-hydraulic-state" as const,
    venaContractaVelocity:
      "positive-AoV-flow-divided-by-one-hundred-times-active-EOA" as const,
    proximalVelocity:
      "same-positive-AoV-flow-divided-by-one-hundred-times-fixed-LVOT-area" as const,
    simplifiedDopplerGradient:
      "four-times-vena-contracta-velocity-squared" as const,
    proximalVelocityCorrectedDopplerGradient:
      "four-times-vena-contracta-velocity-squared-minus-LVOT-velocity-squared" as const,
    nodeGradient:
      "accepted-LV-chamber-node-minus-Ao-root-node-static-pressure" as const,
    pressureRecoveryCounterfactual:
      "Garcia-ELCo-irreversible-loss-plus-ascending-aortic-kinetic-flux" as const,
    energyLossCoefficientArea:
      "EOA-times-AA-area-divided-by-AA-area-minus-EOA" as const,
    upstreamKineticFluxInRecoveredStaticCounterfactual:
      "LV-chamber-control-volume-velocity-neglected" as const,
    irreversibleEnergy:
      "positive-flow-integral-of-linear-plus-ELCo-pressure-loss-times-flow" as const,
    gradientKindsInterchangeable: false as const,
    pressureRecoveryChangesExactDynamics: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    clinicalThresholdOrFitApplied: false as const,
  });

export type MainWireAorticValveObservationGeometryV1 = Readonly<{
  geometryId: string;
  provenance:
    | "subject-measured"
    | "fixed-research-bracket";
  lvotCrossSectionalAreaCm2: number;
  ascendingAorticCrossSectionalAreaCm2: number;
}>;

export type MainWireAorticValveObservationSampleInputV1 = Readonly<{
  flowMlPerSec: number;
  activeEoaCm2: number;
  nodePressureGradientMmHg: number;
  backgroundLinearResistanceMmHgSecPerMl: number;
  modelDissipativePowerMmHgMlPerSec: number;
}>;

export type MainWireAorticValveObservationSampleV1 = Readonly<{
  flowMlPerSec: number;
  activeEoaCm2: number;
  lvotVelocityMPerSec: number;
  venaContractaVelocityMPerSec: number;
  ascendingAorticVelocityMPerSec: number;
  simplifiedDopplerGradientMmHg: number;
  proximalVelocityCorrectedDopplerGradientMmHg: number;
  exactKineticVenaContractaGradientMmHg: number;
  exactKineticLvotGradientMmHg: number;
  nodePressureGradientMmHg: number;
  energyLossCoefficientAreaCm2: number;
  irreversibleConvectivePressureLossMmHg: number;
  downstreamKineticPressureMmHg: number;
  recoveredStaticPortGradientMmHg: number;
  fullVenaContractaPortGradientMmHg: number;
  recoveredPressureFromVenaContractaMmHg: number;
  linearPressureLossMmHg: number;
  modelNodeMinusFullVenaContractaPortGradientMmHg: number;
  modelNodeMinusRecoveredStaticPortGradientMmHg: number;
  geometryIrreversibleDissipativePowerMmHgMlPerSec: number;
  downstreamKineticPowerMmHgMlPerSec: number;
  modelDissipativePowerMmHgMlPerSec: number;
}>;

export type MainWireAorticValveObservationStationsV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_VALVE_OBSERVATION_STATIONS_V1_ID;
  source: Readonly<{
    beatIndex: number;
    dtSec: number;
    sampleCount: number;
    protocolIdentityHash: string;
    periodicSteadyStateClaimed: boolean;
    integrationCompletedWithoutFailure: boolean;
  }>;
  geometry: MainWireAorticValveObservationGeometryV1;
  interpretationEligible: boolean;
  forwardFlow: Readonly<{
    sampleCount: number;
    timeSec: number;
    volumeMl: number;
    peakFlowMlPerSec: number;
    peakLvotVelocityMPerSec: number;
    peakVenaContractaVelocityMPerSec: number;
    peakAscendingAorticVelocityMPerSec: number;
  }>;
  timeMeanGradientMmHg: Readonly<{
    simplifiedDoppler: number;
    proximalVelocityCorrectedDoppler: number;
    acceptedNodeStatic: number;
    geometryRecoveredStaticCounterfactual: number;
    irreversibleConvectiveLoss: number;
  }>;
  peakGradientMmHg: Readonly<{
    simplifiedDoppler: number;
    proximalVelocityCorrectedDoppler: number;
    acceptedNodeStatic: number;
    geometryRecoveredStaticCounterfactual: number;
    irreversibleConvectiveLoss: number;
  }>;
  cycleEnergyMmHgMl: Readonly<{
    acceptedModelDissipation: number;
    geometryIrreversibleDissipationCounterfactual: number;
    downstreamKineticTransportCounterfactual: number;
  }>;
  stationResiduals: Readonly<{
    maximumAbsoluteNodeMinusFullVenaContractaPortGradientMmHg: number;
    maximumAbsoluteNodeMinusRecoveredStaticPortGradientMmHg: number;
  }>;
  claim: typeof MAIN_WIRE_AORTIC_VALVE_OBSERVATION_STATIONS_CLAIM_V1;
}>;

/**
 * Pure one-sample observation map. It deliberately does not decide which
 * pressure station is canonical; it exposes all station-dependent quantities.
 */
export function evaluateMainWireAorticValveObservationSampleV1(
  input: MainWireAorticValveObservationSampleInputV1,
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireAorticValveObservationSampleV1 {
  validateGeometry(geometry, input.activeEoaCm2);
  nonnegativeFinite(input.flowMlPerSec, "flowMlPerSec");
  finite(input.nodePressureGradientMmHg, "nodePressureGradientMmHg");
  nonnegativeFinite(
    input.backgroundLinearResistanceMmHgSecPerMl,
    "backgroundLinearResistanceMmHgSecPerMl",
  );
  nonnegativeFinite(
    input.modelDissipativePowerMmHgMlPerSec,
    "modelDissipativePowerMmHgMlPerSec",
  );

  const flow = input.flowMlPerSec;
  const velocity = (areaCm2: number): number => flow / (100 * areaCm2);
  const pressure = (areaCm2: number): number =>
    idealBernoulliLossFromEffectiveOrificeAreaV2(areaCm2) * flow * flow;
  const venaContractaVelocityMPerSec = velocity(input.activeEoaCm2);
  const lvotVelocityMPerSec = velocity(geometry.lvotCrossSectionalAreaCm2);
  const ascendingAorticVelocityMPerSec = velocity(
    geometry.ascendingAorticCrossSectionalAreaCm2,
  );
  const simplifiedDopplerGradientMmHg =
    4 * venaContractaVelocityMPerSec ** 2;
  const proximalVelocityCorrectedDopplerGradientMmHg = 4 * (
    venaContractaVelocityMPerSec ** 2 - lvotVelocityMPerSec ** 2
  );
  const exactKineticVenaContractaGradientMmHg = pressure(
    input.activeEoaCm2,
  );
  const exactKineticLvotGradientMmHg = pressure(
    geometry.lvotCrossSectionalAreaCm2,
  );
  const energyLossCoefficientAreaCm2 = input.activeEoaCm2
    * geometry.ascendingAorticCrossSectionalAreaCm2
    / (
      geometry.ascendingAorticCrossSectionalAreaCm2 - input.activeEoaCm2
    );
  const irreversibleConvectivePressureLossMmHg = pressure(
    energyLossCoefficientAreaCm2,
  );
  const downstreamKineticPressureMmHg = pressure(
    geometry.ascendingAorticCrossSectionalAreaCm2,
  );
  const linearPressureLossMmHg =
    input.backgroundLinearResistanceMmHgSecPerMl * flow;
  const fullVenaContractaPortGradientMmHg =
    linearPressureLossMmHg + exactKineticVenaContractaGradientMmHg;
  const recoveredStaticPortGradientMmHg = linearPressureLossMmHg
    + irreversibleConvectivePressureLossMmHg
    + downstreamKineticPressureMmHg;
  const recoveredPressureFromVenaContractaMmHg =
    exactKineticVenaContractaGradientMmHg
    - irreversibleConvectivePressureLossMmHg
    - downstreamKineticPressureMmHg;
  const geometryIrreversibleDissipativePowerMmHgMlPerSec = (
    linearPressureLossMmHg + irreversibleConvectivePressureLossMmHg
  ) * flow;
  const downstreamKineticPowerMmHgMlPerSec =
    downstreamKineticPressureMmHg * flow;
  const result = Object.freeze({
    flowMlPerSec: flow,
    activeEoaCm2: input.activeEoaCm2,
    lvotVelocityMPerSec,
    venaContractaVelocityMPerSec,
    ascendingAorticVelocityMPerSec,
    simplifiedDopplerGradientMmHg,
    proximalVelocityCorrectedDopplerGradientMmHg,
    exactKineticVenaContractaGradientMmHg,
    exactKineticLvotGradientMmHg,
    nodePressureGradientMmHg: input.nodePressureGradientMmHg,
    energyLossCoefficientAreaCm2,
    irreversibleConvectivePressureLossMmHg,
    downstreamKineticPressureMmHg,
    recoveredStaticPortGradientMmHg,
    fullVenaContractaPortGradientMmHg,
    recoveredPressureFromVenaContractaMmHg,
    linearPressureLossMmHg,
    modelNodeMinusFullVenaContractaPortGradientMmHg:
      input.nodePressureGradientMmHg - fullVenaContractaPortGradientMmHg,
    modelNodeMinusRecoveredStaticPortGradientMmHg:
      input.nodePressureGradientMmHg - recoveredStaticPortGradientMmHg,
    geometryIrreversibleDissipativePowerMmHgMlPerSec,
    downstreamKineticPowerMmHgMlPerSec,
    modelDissipativePowerMmHgMlPerSec:
      input.modelDissipativePowerMmHgMlPerSec,
  } satisfies MainWireAorticValveObservationSampleV1);
  if (!Object.values(result).every(Number.isFinite)) {
    throw new Error("aortic-valve observation sample must be finite");
  }
  return result;
}

export function measureMainWireAorticValveObservationStationsV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireAorticValveObservationStationsV1 {
  if (!(result.dtSec > 0) || !Number.isFinite(result.dtSec)) {
    throw new Error("periodic result dtSec must be finite and positive");
  }
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error("a retained complete beat is required for AoV observations");
  }
  const maximumActiveEoaCm2 = maximum(beat.samples.map((sample) =>
    sample.valveHydraulics.AoV.activeEoaCm2));
  validateGeometry(geometry, maximumActiveEoaCm2);
  const forward = beat.samples.flatMap((sample) => {
    const valve = sample.valveHydraulics.AoV;
    if (!(valve.flowMlPerSec > 0)) return [];
    return [evaluateMainWireAorticValveObservationSampleV1({
      flowMlPerSec: valve.flowMlPerSec,
      activeEoaCm2: valve.activeEoaCm2,
      nodePressureGradientMmHg: valve.pressureGradientMmHg,
      backgroundLinearResistanceMmHgSecPerMl:
        valve.resistanceMmHgSecPerMl,
      modelDissipativePowerMmHgMlPerSec:
        valve.dissipativePowerProxyMmHgMlPerSec,
    }, geometry)];
  });
  if (forward.length === 0) {
    throw new Error("AoV observation stations require positive forward flow");
  }
  const sumField = (
    select: (sample: MainWireAorticValveObservationSampleV1) => number,
  ): number => sum(forward.map(select));
  const meanField = (
    select: (sample: MainWireAorticValveObservationSampleV1) => number,
  ): number => sumField(select) / forward.length;
  const maxField = (
    select: (sample: MainWireAorticValveObservationSampleV1) => number,
  ): number => maximum(forward.map(select));
  const dtSec = result.dtSec;
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_VALVE_OBSERVATION_STATIONS_V1_ID,
    source: Object.freeze({
      beatIndex: beat.beatIndex,
      dtSec,
      sampleCount: beat.samples.length,
      protocolIdentityHash: result.protocolIdentityHash,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      integrationCompletedWithoutFailure:
        result.integrationCompletedWithoutFailure,
    }),
    geometry: Object.freeze({ ...geometry }),
    interpretationEligible:
      result.periodicSteadyStateClaimed
      && result.integrationCompletedWithoutFailure,
    forwardFlow: Object.freeze({
      sampleCount: forward.length,
      timeSec: forward.length * dtSec,
      volumeMl: sumField((sample) => sample.flowMlPerSec) * dtSec,
      peakFlowMlPerSec: maxField((sample) => sample.flowMlPerSec),
      peakLvotVelocityMPerSec: maxField((sample) =>
        sample.lvotVelocityMPerSec),
      peakVenaContractaVelocityMPerSec: maxField((sample) =>
        sample.venaContractaVelocityMPerSec),
      peakAscendingAorticVelocityMPerSec: maxField((sample) =>
        sample.ascendingAorticVelocityMPerSec),
    }),
    timeMeanGradientMmHg: Object.freeze({
      simplifiedDoppler: meanField((sample) =>
        sample.simplifiedDopplerGradientMmHg),
      proximalVelocityCorrectedDoppler: meanField((sample) =>
        sample.proximalVelocityCorrectedDopplerGradientMmHg),
      acceptedNodeStatic: meanField((sample) =>
        sample.nodePressureGradientMmHg),
      geometryRecoveredStaticCounterfactual: meanField((sample) =>
        sample.recoveredStaticPortGradientMmHg),
      irreversibleConvectiveLoss: meanField((sample) =>
        sample.irreversibleConvectivePressureLossMmHg),
    }),
    peakGradientMmHg: Object.freeze({
      simplifiedDoppler: maxField((sample) =>
        sample.simplifiedDopplerGradientMmHg),
      proximalVelocityCorrectedDoppler: maxField((sample) =>
        sample.proximalVelocityCorrectedDopplerGradientMmHg),
      acceptedNodeStatic: maxField((sample) =>
        sample.nodePressureGradientMmHg),
      geometryRecoveredStaticCounterfactual: maxField((sample) =>
        sample.recoveredStaticPortGradientMmHg),
      irreversibleConvectiveLoss: maxField((sample) =>
        sample.irreversibleConvectivePressureLossMmHg),
    }),
    cycleEnergyMmHgMl: Object.freeze({
      acceptedModelDissipation: sumField((sample) =>
        sample.modelDissipativePowerMmHgMlPerSec) * dtSec,
      geometryIrreversibleDissipationCounterfactual: sumField((sample) =>
        sample.geometryIrreversibleDissipativePowerMmHgMlPerSec) * dtSec,
      downstreamKineticTransportCounterfactual: sumField((sample) =>
        sample.downstreamKineticPowerMmHgMlPerSec) * dtSec,
    }),
    stationResiduals: Object.freeze({
      maximumAbsoluteNodeMinusFullVenaContractaPortGradientMmHg:
        maxField((sample) => Math.abs(
          sample.modelNodeMinusFullVenaContractaPortGradientMmHg,
        )),
      maximumAbsoluteNodeMinusRecoveredStaticPortGradientMmHg:
        maxField((sample) => Math.abs(
          sample.modelNodeMinusRecoveredStaticPortGradientMmHg,
        )),
    }),
    claim: MAIN_WIRE_AORTIC_VALVE_OBSERVATION_STATIONS_CLAIM_V1,
  });
}

function validateGeometry(
  geometry: MainWireAorticValveObservationGeometryV1,
  maximumActiveEoaCm2: number,
): void {
  if (geometry.geometryId.trim() === "") {
    throw new Error("aortic observation geometryId must be non-empty");
  }
  if (
    geometry.provenance !== "subject-measured"
    && geometry.provenance !== "fixed-research-bracket"
  ) {
    throw new Error("aortic observation geometry provenance is unsupported");
  }
  positiveFinite(maximumActiveEoaCm2, "maximumActiveEoaCm2");
  positiveFinite(
    geometry.lvotCrossSectionalAreaCm2,
    "lvotCrossSectionalAreaCm2",
  );
  positiveFinite(
    geometry.ascendingAorticCrossSectionalAreaCm2,
    "ascendingAorticCrossSectionalAreaCm2",
  );
  if (!(geometry.lvotCrossSectionalAreaCm2 > maximumActiveEoaCm2)) {
    throw new Error("LVOT area must exceed every active AoV EOA in this observation map");
  }
  if (!(geometry.ascendingAorticCrossSectionalAreaCm2 > maximumActiveEoaCm2)) {
    throw new Error("ascending-aortic area must exceed every active AoV EOA for ELCo");
  }
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
  let current = Number.NEGATIVE_INFINITY;
  for (const value of values) current = Math.max(current, value);
  if (!Number.isFinite(current)) throw new Error("maximum requires values");
  return current;
}

function sum(values: readonly number[]): number {
  return values.reduce((current, value) => current + value, 0);
}
