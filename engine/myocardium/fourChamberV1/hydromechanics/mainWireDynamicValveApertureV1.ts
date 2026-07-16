import { defaultParams } from "@/engine/core/params";
import {
  buildEdges,
  type EdgeSpec,
  type ValveName,
} from "@/engine/core/topology";
import {
  evaluateSignedFlowMomentumV1,
  type SignedFlowMomentumOutputV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import {
  MAIN_WIRE_INERTANCE_SI_FACTOR_V1,
  MAIN_WIRE_PASCAL_PER_MMHG_V1,
  MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
  MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1";

export const MAIN_WIRE_DYNAMIC_VALVE_APERTURE_V1_ID =
  "main-wire-dynamic-valve-aperture-c2-condensed-be-v1" as const;

export const MAIN_WIRE_DYNAMIC_VALVE_FLOW_NAMES_V1 = Object.freeze([
  "Q_MV",
  "Q_AoV",
  "Q_TV",
  "Q_PuV",
] as const);

export type MainWireDynamicValveFlowNameV1 =
  (typeof MAIN_WIRE_DYNAMIC_VALVE_FLOW_NAMES_V1)[number];

export const MAIN_WIRE_DYNAMIC_VALVE_NUMERICAL_POLICY_V1 = Object.freeze({
  numericalAreaToMaximumAreaRatio: 0.003 as const,
  flowSmoothingM3PerSec: 1e-9 as const,
  pressureTransitionWidthDerivation:
    "wP=(1 mmHg in Pa)/core-kOpen" as const,
  openingRateDerivation: "ko=h(dP/wP)/tauOpen" as const,
  closingRateDerivation: "kc=h(-dP/wP)/tauClose" as const,
  apertureBackwardEulerDerivation:
    "xiNext=(xiPrev+dt*ko)/(1+dt*(ko+kc))" as const,
  apertureClampApplied: false as const,
  apertureProjectionApplied: false as const,
});

export type CompiledMainWireDynamicValveParametersV1 = Readonly<{
  modelId: typeof MAIN_WIRE_DYNAMIC_VALVE_APERTURE_V1_ID;
  flowName: MainWireDynamicValveFlowNameV1;
  coreValveName: ValveName;
  referenceAreaM2: number;
  maximumAreaM2: number;
  leakAreaM2: number;
  numericalAreaM2: number;
  kOpenPerMmHg: number;
  pressureTransitionWidthPa: number;
  tauOpenSec: number;
  tauCloseSec: number;
  baseLinearResistancePaSecPerM3: number;
  inertancePaSec2PerM3: number;
  baseQuadraticResistancePaSec2PerM6: number;
  flowSmoothingM3PerSec: number;
  initializationFlowScaleM3PerSec: number;
  parameterOwner: "engine/core/topology.ts+engine/core/params.ts";
  topologyAndDefaultValuesAgreeExactly: true;
}>;

export type MainWireDynamicValveApertureRateV1 = Readonly<{
  pressureGradientPa: number;
  positivePressureGate: number;
  negativePressureGate: number;
  openingRatePerSec: number;
  closingRatePerSec: number;
}>;

export type MainWireDynamicValveApertureStepV1 =
  MainWireDynamicValveApertureRateV1 & Readonly<{
    previousApertureState01: number;
    nextApertureState01: number;
    timeStepSec: number;
    exactBackwardEulerCondensation: true;
    clampApplied: false;
    projectionApplied: false;
  }>;

export type MainWireDynamicValveMomentumV1 =
  SignedFlowMomentumOutputV1 & Readonly<{
    modelId: typeof MAIN_WIRE_DYNAMIC_VALVE_APERTURE_V1_ID;
    flowName: MainWireDynamicValveFlowNameV1;
    coreValveName: ValveName;
    valveApertureState01: number;
    physicalAreaM2: number;
    numericalAreaM2: number;
    effectiveAreaM2: number;
    referenceAreaM2: number;
    areaLossScale: number;
    linearResistancePaSecPerM3: number;
    inertancePaSec2PerM3: number;
    quadraticResistancePaSec2PerM6: number;
    positivePressureGate: number;
    negativePressureGate: number;
    openingRatePerSec: number;
    closingRatePerSec: number;
    parameterOwner: "engine/core/topology.ts+engine/core/params.ts";
    apertureClampApplied: false;
    apertureProjectionApplied: false;
  }>;

export type MainWireDynamicValveInitializationV1 = Readonly<{
  flowName: MainWireDynamicValveFlowNameV1;
  pressureGradientPa: number;
  flowM3PerSec: number;
  pressureOpeningEvidence: number;
  pressureClosingEvidence: number;
  flowOpeningEvidence: number;
  flowClosingEvidence: number;
  apertureState01: number;
  derivation:
    "normalized forward pressure/flow evidence divided by total signed evidence; zero evidence initializes closed";
  topologyXi0Consumed: false;
  clampApplied: false;
  projectionApplied: false;
}>;

const CORE_VALVE_BY_FLOW_V1: Readonly<
  Record<MainWireDynamicValveFlowNameV1, ValveName>
> = Object.freeze({
  Q_MV: "MV",
  Q_AoV: "AoV",
  Q_TV: "TV",
  Q_PuV: "PV",
});

const SQUARE_CENTIMETER_TO_SQUARE_METER = 1e-4;

export function compileMainWireDynamicValveParametersByFlowV1(): Readonly<
  Record<MainWireDynamicValveFlowNameV1, CompiledMainWireDynamicValveParametersV1>
> {
  const defaults = defaultParams();
  const defaultByValve = Object.freeze({
    MV: Object.freeze({
      Aref: defaults.MV_Aref,
      Amax: defaults.MV_Amax,
      Aleak: defaults.MV_Aleak,
      kOpen: defaults.MV_kOpen,
      tauOpen: defaults.MV_tauOpen,
      tauClose: defaults.MV_tauClose,
      R: defaults.MV_R,
      L: defaults.MV_L,
      B: defaults.MV_B,
    }),
    AoV: Object.freeze({
      Aref: defaults.AoV_Aref,
      Amax: defaults.AoV_Amax,
      Aleak: defaults.AoV_Aleak,
      kOpen: defaults.AoV_kOpen,
      tauOpen: defaults.AoV_tauOpen,
      tauClose: defaults.AoV_tauClose,
      R: defaults.AoV_R,
      L: defaults.AoV_L,
      B: defaults.AoV_B,
    }),
    TV: Object.freeze({
      Aref: defaults.TV_Aref,
      Amax: defaults.TV_Amax,
      Aleak: defaults.TV_Aleak,
      kOpen: defaults.TV_kOpen,
      tauOpen: defaults.TV_tauOpen,
      tauClose: defaults.TV_tauClose,
      R: defaults.TV_R,
      L: defaults.TV_L,
      B: defaults.TV_B,
    }),
    PV: Object.freeze({
      Aref: defaults.PV_Aref,
      Amax: defaults.PV_Amax,
      Aleak: defaults.PV_Aleak,
      kOpen: defaults.PV_kOpen,
      tauOpen: defaults.PV_tauOpen,
      tauClose: defaults.PV_tauClose,
      R: defaults.PV_R,
      L: defaults.PV_L,
      B: defaults.PV_B,
    }),
  });
  const topologyByValve = Object.freeze(Object.fromEntries(buildEdges()
    .filter((edge) => edge.kind === "valve")
    .map((edge) => [edge.name, edge]))) as Readonly<Record<ValveName, EdgeSpec>>;

  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_DYNAMIC_VALVE_FLOW_NAMES_V1.map((flowName) => {
      const coreValveName = CORE_VALVE_BY_FLOW_V1[flowName];
      const source = defaultByValve[coreValveName];
      const topology = topologyByValve[coreValveName];
      if (topology === undefined) {
        throw new Error(`core topology is missing valve ${coreValveName}`);
      }
      assertTopologyAndDefaultsAgreeV1(coreValveName, topology, source);
      const referenceAreaM2 = requirePositiveFinite(
        source.Aref * SQUARE_CENTIMETER_TO_SQUARE_METER,
        `${coreValveName}.referenceAreaM2`,
      );
      const maximumAreaM2 = requirePositiveFinite(
        source.Amax * SQUARE_CENTIMETER_TO_SQUARE_METER,
        `${coreValveName}.maximumAreaM2`,
      );
      const leakAreaM2 = requireNonNegativeFinite(
        source.Aleak * SQUARE_CENTIMETER_TO_SQUARE_METER,
        `${coreValveName}.leakAreaM2`,
      );
      if (leakAreaM2 > maximumAreaM2) {
        throw new Error(`${coreValveName} leak area exceeds maximum area`);
      }
      const kOpenPerMmHg = requirePositiveFinite(
        source.kOpen,
        `${coreValveName}.kOpenPerMmHg`,
      );
      const q0MlPerSec = requirePositiveFinite(
        topology.q0,
        `${coreValveName}.q0`,
      );
      return [flowName, Object.freeze({
        modelId: MAIN_WIRE_DYNAMIC_VALVE_APERTURE_V1_ID,
        flowName,
        coreValveName,
        referenceAreaM2,
        maximumAreaM2,
        leakAreaM2,
        numericalAreaM2:
          MAIN_WIRE_DYNAMIC_VALVE_NUMERICAL_POLICY_V1
            .numericalAreaToMaximumAreaRatio * maximumAreaM2,
        kOpenPerMmHg,
        pressureTransitionWidthPa:
          MAIN_WIRE_PASCAL_PER_MMHG_V1 / kOpenPerMmHg,
        tauOpenSec: requirePositiveFinite(
          source.tauOpen,
          `${coreValveName}.tauOpenSec`,
        ),
        tauCloseSec: requirePositiveFinite(
          source.tauClose,
          `${coreValveName}.tauCloseSec`,
        ),
        baseLinearResistancePaSecPerM3: requirePositiveFinite(
          source.R * MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
          `${coreValveName}.baseLinearResistancePaSecPerM3`,
        ),
        inertancePaSec2PerM3: requirePositiveFinite(
          source.L * MAIN_WIRE_INERTANCE_SI_FACTOR_V1,
          `${coreValveName}.inertancePaSec2PerM3`,
        ),
        baseQuadraticResistancePaSec2PerM6: requireNonNegativeFinite(
          source.B * MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
          `${coreValveName}.baseQuadraticResistancePaSec2PerM6`,
        ),
        flowSmoothingM3PerSec:
          MAIN_WIRE_DYNAMIC_VALVE_NUMERICAL_POLICY_V1.flowSmoothingM3PerSec,
        initializationFlowScaleM3PerSec: q0MlPerSec * 1e-6,
        parameterOwner: "engine/core/topology.ts+engine/core/params.ts" as const,
        topologyAndDefaultValuesAgreeExactly: true as const,
      })];
    }),
  )) as Readonly<Record<
    MainWireDynamicValveFlowNameV1,
    CompiledMainWireDynamicValveParametersV1
  >>;
}

/** Unit-interval quintic smoothstep, extended as a one-sided C2 gate. */
export function evaluateMainWireOneSidedC2GateV1(value: number): number {
  const x = requireFinite(value, "one-sided C2 gate argument");
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * x * (10 + x * (-15 + 6 * x));
}

export function evaluateMainWireDynamicValveApertureRateV1(
  parameters: CompiledMainWireDynamicValveParametersV1,
  pressureGradientPa: number,
): MainWireDynamicValveApertureRateV1 {
  const pressureGradient = requireFinite(
    pressureGradientPa,
    `${parameters.flowName}.pressureGradientPa`,
  );
  const positivePressureGate = evaluateMainWireOneSidedC2GateV1(
    pressureGradient / parameters.pressureTransitionWidthPa,
  );
  const negativePressureGate = evaluateMainWireOneSidedC2GateV1(
    -pressureGradient / parameters.pressureTransitionWidthPa,
  );
  return Object.freeze({
    pressureGradientPa: pressureGradient,
    positivePressureGate,
    negativePressureGate,
    openingRatePerSec: positivePressureGate / parameters.tauOpenSec,
    closingRatePerSec: negativePressureGate / parameters.tauCloseSec,
  });
}

export function advanceMainWireDynamicValveApertureBackwardEulerV1(input: Readonly<{
  parameters: CompiledMainWireDynamicValveParametersV1;
  previousApertureState01: number;
  pressureGradientPa: number;
  timeStepSec: number;
}>): MainWireDynamicValveApertureStepV1 {
  const previousApertureState01 = requireUnitInterval(
    input.previousApertureState01,
    `${input.parameters.flowName}.previousApertureState01`,
  );
  const timeStepSec = requirePositiveFinite(input.timeStepSec, "timeStepSec");
  const rate = evaluateMainWireDynamicValveApertureRateV1(
    input.parameters,
    input.pressureGradientPa,
  );
  const denominator = 1 + timeStepSec * (
    rate.openingRatePerSec + rate.closingRatePerSec
  );
  const nextApertureState01 = requireUnitInterval(
    (previousApertureState01 + timeStepSec * rate.openingRatePerSec)
      / denominator,
    `${input.parameters.flowName}.nextApertureState01`,
  );
  return Object.freeze({
    ...rate,
    previousApertureState01,
    nextApertureState01,
    timeStepSec,
    exactBackwardEulerCondensation: true as const,
    clampApplied: false as const,
    projectionApplied: false as const,
  });
}

export function initializeMainWireDynamicValveApertureV1(input: Readonly<{
  parameters: CompiledMainWireDynamicValveParametersV1;
  pressureGradientPa: number;
  flowM3PerSec: number;
}>): MainWireDynamicValveInitializationV1 {
  const pressureGradientPa = requireFinite(
    input.pressureGradientPa,
    `${input.parameters.flowName}.initialPressureGradientPa`,
  );
  const flowM3PerSec = requireFinite(
    input.flowM3PerSec,
    `${input.parameters.flowName}.initialFlowM3PerSec`,
  );
  const pressureOpeningEvidence = evaluateMainWireOneSidedC2GateV1(
    pressureGradientPa / input.parameters.pressureTransitionWidthPa,
  );
  const pressureClosingEvidence = evaluateMainWireOneSidedC2GateV1(
    -pressureGradientPa / input.parameters.pressureTransitionWidthPa,
  );
  const flowOpeningEvidence = evaluateMainWireOneSidedC2GateV1(
    flowM3PerSec / input.parameters.initializationFlowScaleM3PerSec,
  );
  const flowClosingEvidence = evaluateMainWireOneSidedC2GateV1(
    -flowM3PerSec / input.parameters.initializationFlowScaleM3PerSec,
  );
  const openingEvidence = pressureOpeningEvidence + flowOpeningEvidence;
  const closingEvidence = pressureClosingEvidence + flowClosingEvidence;
  const totalEvidence = openingEvidence + closingEvidence;
  const apertureState01 = totalEvidence === 0
    ? 0
    : openingEvidence / totalEvidence;
  requireUnitInterval(apertureState01, `${input.parameters.flowName}.initialXi`);
  return Object.freeze({
    flowName: input.parameters.flowName,
    pressureGradientPa,
    flowM3PerSec,
    pressureOpeningEvidence,
    pressureClosingEvidence,
    flowOpeningEvidence,
    flowClosingEvidence,
    apertureState01,
    derivation:
      "normalized forward pressure/flow evidence divided by total signed evidence; zero evidence initializes closed" as const,
    topologyXi0Consumed: false as const,
    clampApplied: false as const,
    projectionApplied: false as const,
  });
}

export function evaluateMainWireDynamicValveMomentumV1(input: Readonly<{
  parameters: CompiledMainWireDynamicValveParametersV1;
  valveApertureState01: number;
  pressureGradientPa: number;
  flowM3PerSec: number;
}>): MainWireDynamicValveMomentumV1 {
  const xi = requireUnitInterval(
    input.valveApertureState01,
    `${input.parameters.flowName}.valveApertureState01`,
  );
  const physicalAreaM2 = input.parameters.leakAreaM2
    + xi * (input.parameters.maximumAreaM2 - input.parameters.leakAreaM2);
  const effectiveAreaM2 = Math.hypot(
    physicalAreaM2,
    input.parameters.numericalAreaM2,
  );
  const areaLossScale = Math.pow(
    input.parameters.referenceAreaM2 / effectiveAreaM2,
    2,
  );
  const linearResistancePaSecPerM3 =
    input.parameters.baseLinearResistancePaSecPerM3 * areaLossScale;
  const quadraticResistancePaSec2PerM6 =
    input.parameters.baseQuadraticResistancePaSec2PerM6 * areaLossScale;
  const rate = evaluateMainWireDynamicValveApertureRateV1(
    input.parameters,
    input.pressureGradientPa,
  );
  const momentum = evaluateSignedFlowMomentumV1({
    inertancePaSec2PerM3: input.parameters.inertancePaSec2PerM3,
    linearResistancePaSecPerM3,
    quadraticResistancePaSec2PerM6,
    flowSmoothingM3PerSec: input.parameters.flowSmoothingM3PerSec,
  }, input.pressureGradientPa, input.flowM3PerSec);
  return Object.freeze({
    modelId: MAIN_WIRE_DYNAMIC_VALVE_APERTURE_V1_ID,
    flowName: input.parameters.flowName,
    coreValveName: input.parameters.coreValveName,
    valveApertureState01: xi,
    physicalAreaM2,
    numericalAreaM2: input.parameters.numericalAreaM2,
    effectiveAreaM2,
    referenceAreaM2: input.parameters.referenceAreaM2,
    areaLossScale,
    linearResistancePaSecPerM3,
    inertancePaSec2PerM3: input.parameters.inertancePaSec2PerM3,
    quadraticResistancePaSec2PerM6,
    positivePressureGate: rate.positivePressureGate,
    negativePressureGate: rate.negativePressureGate,
    openingRatePerSec: rate.openingRatePerSec,
    closingRatePerSec: rate.closingRatePerSec,
    parameterOwner: input.parameters.parameterOwner,
    apertureClampApplied: false as const,
    apertureProjectionApplied: false as const,
    ...momentum,
  });
}

function assertTopologyAndDefaultsAgreeV1(
  valveName: ValveName,
  topology: EdgeSpec,
  defaults: Readonly<{
    Aref: number;
    Amax: number;
    Aleak: number;
    kOpen: number;
    tauOpen: number;
    tauClose: number;
    R: number;
    L: number;
    B: number;
  }>,
): void {
  const compared = {
    Aref: topology.Aref,
    Amax: topology.Amax,
    Aleak: topology.Aleak,
    kOpen: topology.kOpen,
    tauOpen: topology.tauOpen,
    tauClose: topology.tauClose,
    R: topology.R,
    L: topology.L,
    B: topology.B,
  };
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
    if (!Object.is(compared[key], defaults[key])) {
      throw new Error(
        `core topology/default valve parameter drift at ${valveName}.${key}`,
      );
    }
  }
}

function requireUnitInterval(value: number, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0 || finite > 1) {
    throw new Error(`${field} must lie in [0,1] without clamp or projection`);
  }
  return finite;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return finite;
}

function requirePositiveFinite(value: number | undefined, field: string): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}
