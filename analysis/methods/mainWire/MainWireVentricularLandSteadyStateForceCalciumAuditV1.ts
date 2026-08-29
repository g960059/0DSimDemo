import {
  LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_STATE_INDEX,
  LAND2017_STATE_SIZE,
  land2017CaT50,
  land2017CaTRPNUnblockingFactor,
  land2017LengthFactor,
  writeLand2017Rhs,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017";

export const MAIN_WIRE_VENTRICULAR_LAND_STEADY_STATE_FORCE_CALCIUM_AUDIT_V1_ID =
  "main-wire-ventricular-land-steady-state-force-calcium-audit-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_STEADY_STATE_FORCE_CALCIUM_AUDIT_CLAIM_V1 =
  Object.freeze({
    role: "closed-form-zero-velocity-Land-force-calcium-audit" as const,
    equilibriumIncludesEq48NumericalCap: true as const,
    forceNormalization: "active-stress-divided-by-h-times-Tref" as const,
    localSlopeDefinition:
      "d-log-force-odds-over-d-log-free-calcium-at-half-activation" as const,
    zeroFiberVelocity: true as const,
    zeroWeakAndStrongDistortion: true as const,
    exactModelStateOrCheckpointChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireVentricularLandSteadyStateForceCalciumSampleV1 =
  Readonly<{
    freeCalciumRatioToHalfActivation: number;
    freeCalciumUM: number;
    calciumTroponinFraction: number;
    eq48UnblockingFactor: number;
    eq48NumericalCapActive: boolean;
    blockedPopulationB: number;
    weakPopulationW: number;
    strongPopulationS: number;
    unboundPopulationU: number;
    normalizedActiveStress01: number;
    activeKirchhoffStressKPa: number;
    populationConservationResidual: number;
    maximumAbsoluteRhsResidualPerSec: number;
  }>;

export type MainWireVentricularLandSteadyStateForceCalciumAuditV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_VENTRICULAR_LAND_STEADY_STATE_FORCE_CALCIUM_AUDIT_V1_ID;
    identity: Readonly<{
      landEquationParameterSetId: string;
      landEquationParameterSetStableHash: string;
    }>;
    protocol: Readonly<{
      fixedLandStretch: number;
      fixedFiberEngineeringStrain: number;
      freeCalciumRatiosToHalfActivation: readonly number[];
    }>;
    parameters: Readonly<{
      nTRPN: number;
      nTm: number;
      TRPN50: number;
      CaT50UM: number;
      TrefKPa: number;
      lengthFactorH: number;
      eq48UnblockingFactorLimit: number;
    }>;
    halfActivation: Readonly<{
      calciumTroponinFraction: number;
      freeCalciumUM: number;
      eq48NumericalCapActive: boolean;
      normalizedActiveStress01: number;
      localForceOddsHillSlope: number;
    }>;
    curveSamples:
      readonly MainWireVentricularLandSteadyStateForceCalciumSampleV1[];
    numericalHealth: Readonly<{
      maximumPopulationConservationResidual: number;
      maximumAbsoluteRhsResidualPerSec: number;
      everyPopulationNonNegative: boolean;
      everyValueFinite: boolean;
    }>;
    claim:
      typeof MAIN_WIRE_VENTRICULAR_LAND_STEADY_STATE_FORCE_CALCIUM_AUDIT_CLAIM_V1;
  }>;

const DEFAULT_FREE_CALCIUM_RATIOS_TO_HALF = Object.freeze([
  0.25,
  0.5,
  1,
  2,
  4,
] as const);

export function measureMainWireVentricularLandSteadyStateForceCalciumAuditV1(
  parameterSet: Land2017SourceParameterSet =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  fixedLandStretch = 1,
  freeCalciumRatiosToHalfActivation:
    readonly number[] = DEFAULT_FREE_CALCIUM_RATIOS_TO_HALF,
): MainWireVentricularLandSteadyStateForceCalciumAuditV1 {
  if (!(fixedLandStretch > 0) || !Number.isFinite(fixedLandStretch)) {
    throw new Error("steady-state force-calcium Land stretch must be positive");
  }
  if (freeCalciumRatiosToHalfActivation.length === 0) {
    throw new Error("steady-state force-calcium audit requires curve samples");
  }
  for (const ratio of freeCalciumRatiosToHalfActivation) {
    if (!(ratio > 0) || !Number.isFinite(ratio)) {
      throw new Error("force-calcium sample ratios must be positive and finite");
    }
  }

  const p = parameterSet.values;
  const fixedFiberEngineeringStrain = fixedLandStretch - 1;
  const CaT50UM = land2017CaT50(fixedLandStretch, p);
  const lengthFactorH = land2017LengthFactor(fixedLandStretch, p);
  const half = halfActivation(parameterSet, CaT50UM);
  const curveSamples = Object.freeze(
    freeCalciumRatiosToHalfActivation.map((ratio) => equilibriumSample(
      ratio,
      half.freeCalciumUM * ratio,
      fixedFiberEngineeringStrain,
      lengthFactorH,
      parameterSet,
    )),
  );
  const halfSample = equilibriumSample(
    1,
    half.freeCalciumUM,
    fixedFiberEngineeringStrain,
    lengthFactorH,
    parameterSet,
  );
  const healthSamples = [...curveSamples, halfSample];

  return Object.freeze({
    methodId:
      MAIN_WIRE_VENTRICULAR_LAND_STEADY_STATE_FORCE_CALCIUM_AUDIT_V1_ID,
    identity: Object.freeze({
      landEquationParameterSetId: parameterSet.parameterSetId,
      landEquationParameterSetStableHash: parameterSet.parameterSetStableHash,
    }),
    protocol: Object.freeze({
      fixedLandStretch,
      fixedFiberEngineeringStrain,
      freeCalciumRatiosToHalfActivation: Object.freeze([
        ...freeCalciumRatiosToHalfActivation,
      ]),
    }),
    parameters: Object.freeze({
      nTRPN: p.nTRPN,
      nTm: p.nTm,
      TRPN50: p.TRPN50,
      CaT50UM,
      TrefKPa: p.Tref / 1000,
      lengthFactorH,
      eq48UnblockingFactorLimit:
        LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
    }),
    halfActivation: Object.freeze({
      calciumTroponinFraction: half.calciumTroponinFraction,
      freeCalciumUM: half.freeCalciumUM,
      eq48NumericalCapActive: half.eq48NumericalCapActive,
      normalizedActiveStress01: halfSample.normalizedActiveStress01,
      localForceOddsHillSlope: half.localForceOddsHillSlope,
    }),
    curveSamples,
    numericalHealth: Object.freeze({
      maximumPopulationConservationResidual: Math.max(
        ...healthSamples.map((sample) =>
          sample.populationConservationResidual),
      ),
      maximumAbsoluteRhsResidualPerSec: Math.max(
        ...healthSamples.map((sample) =>
          sample.maximumAbsoluteRhsResidualPerSec),
      ),
      everyPopulationNonNegative: healthSamples.every((sample) =>
        Math.min(
          sample.blockedPopulationB,
          sample.weakPopulationW,
          sample.strongPopulationS,
          sample.unboundPopulationU,
        ) >= 0),
      everyValueFinite: healthSamples.every((sample) =>
        Object.values(sample).filter((value): value is number =>
          typeof value === "number").every(Number.isFinite)),
    }),
    claim:
      MAIN_WIRE_VENTRICULAR_LAND_STEADY_STATE_FORCE_CALCIUM_AUDIT_CLAIM_V1,
  });
}

function halfActivation(
  parameterSet: Land2017SourceParameterSet,
  CaT50UM: number,
): Readonly<{
  calciumTroponinFraction: number;
  freeCalciumUM: number;
  eq48NumericalCapActive: boolean;
  localForceOddsHillSlope: number;
}> {
  const p = parameterSet.values;
  const capActivationThreshold = Math.pow(
    LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
    -2 / p.nTm,
  );
  const eq48NumericalCapActive = p.TRPN50 < capActivationThreshold;
  const calciumTroponinFraction = eq48NumericalCapActive
    ? Math.pow(
      LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
      2 / p.nTm,
    ) * p.TRPN50 * p.TRPN50
    : p.TRPN50;
  if (!(calciumTroponinFraction > 0 && calciumTroponinFraction < 1)) {
    throw new Error("Land half-activation CaTRPN must lie within (0, 1)");
  }
  const freeCalciumUM = CaT50UM * Math.pow(
    calciumTroponinFraction / (1 - calciumTroponinFraction),
    1 / p.nTRPN,
  );
  const unblockingExponent = eq48NumericalCapActive ? p.nTm / 2 : p.nTm;
  return Object.freeze({
    calciumTroponinFraction,
    freeCalciumUM,
    eq48NumericalCapActive,
    localForceOddsHillSlope:
      unblockingExponent * p.nTRPN * (1 - calciumTroponinFraction),
  });
}

function equilibriumSample(
  freeCalciumRatioToHalfActivation: number,
  freeCalciumUM: number,
  fixedFiberEngineeringStrain: number,
  lengthFactorH: number,
  parameterSet: Land2017SourceParameterSet,
): MainWireVentricularLandSteadyStateForceCalciumSampleV1 {
  const p = parameterSet.values;
  const d = parameterSet.derived;
  const CaT50UM = land2017CaT50(1 + fixedFiberEngineeringStrain, p);
  const calciumDrive = Math.pow(freeCalciumUM / CaT50UM, p.nTRPN);
  const calciumTroponinFraction = calciumDrive / (1 + calciumDrive);
  const rawUnblockingFactor = Math.pow(
    calciumTroponinFraction,
    -p.nTm / 2,
  );
  const eq48UnblockingFactor = land2017CaTRPNUnblockingFactor(
    calciumTroponinFraction,
    p,
  );
  const crossbridgeDenominator = (1 - p.rs) * (1 - p.rw);
  const blockedToUnboundRatio = d.kb / p.ku
    * eq48UnblockingFactor
    * Math.pow(calciumTroponinFraction, -p.nTm / 2);
  const unboundPopulationU = 1 /
    (1 / crossbridgeDenominator + blockedToUnboundRatio);
  const blockedPopulationB = unboundPopulationU * blockedToUnboundRatio;
  const weakPopulationW = unboundPopulationU * p.rw / (1 - p.rw);
  const strongPopulationS = unboundPopulationU * p.rs
    / crossbridgeDenominator;
  const state = new Float64Array(LAND2017_STATE_SIZE);
  state[LAND2017_STATE_INDEX.CaTRPN] = calciumTroponinFraction;
  state[LAND2017_STATE_INDEX.B] = blockedPopulationB;
  state[LAND2017_STATE_INDEX.W] = weakPopulationW;
  state[LAND2017_STATE_INDEX.S] = strongPopulationS;
  state[LAND2017_STATE_INDEX.zetaW] = 0;
  state[LAND2017_STATE_INDEX.zetaS] = 0;
  const rhs = writeLand2017Rhs(
    state,
    {
      freeCalciumUM,
      fiberEngineeringStrain: fixedFiberEngineeringStrain,
      fiberEngineeringStrainRatePerSec: 0,
    },
    parameterSet,
  );
  const normalizedActiveStress01 = strongPopulationS / p.rs;
  return Object.freeze({
    freeCalciumRatioToHalfActivation,
    freeCalciumUM,
    calciumTroponinFraction,
    eq48UnblockingFactor,
    eq48NumericalCapActive:
      rawUnblockingFactor
      > LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
    blockedPopulationB,
    weakPopulationW,
    strongPopulationS,
    unboundPopulationU,
    normalizedActiveStress01,
    activeKirchhoffStressKPa:
      lengthFactorH * p.Tref * normalizedActiveStress01 / 1000,
    populationConservationResidual: Math.abs(
      blockedPopulationB + weakPopulationW + strongPopulationS
      + unboundPopulationU - 1,
    ),
    maximumAbsoluteRhsResidualPerSec: Math.max(
      ...Array.from(rhs, Math.abs),
    ),
  });
}
