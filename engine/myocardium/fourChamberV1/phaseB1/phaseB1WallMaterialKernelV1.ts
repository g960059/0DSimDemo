import {
  evaluateLandLengthStateV1,
  type LandLengthStateOutputV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landLengthReferenceV1";
import {
  evaluateLandNominalToKirchhoffAtStateV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landNominalToKirchhoffV1";
import {
  rateFreeLand2017StateToSourceV1,
  writeRateFreeLand2017BackwardEulerResidualJacobianV1,
  writeRateFreeLand2017BackwardEulerResidualV1,
  type RateFreeLand2017StateV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  evaluateAbsoluteValueV1,
  evaluateLandGammaSuV1,
  evaluateLandLengthDependenceV1,
} from "@/engine/myocardium/fourChamberV1/land/exactSemismoothPolicyV1";
import {
  evaluateEquilibriumPassiveEnergyV1,
  type EquilibriumPassiveEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  assertPhaseB1WallRuntimeMaterialV1,
  type PhaseB1WallRuntimeMaterialV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  evaluateLand2017ContinuousOutput,
} from "@/engine/myocardium/myofilament/land2017/outputs";
import {
  LAND2017_STATE_INDEX,
  LAND2017_STATE_SIZE,
  type LandSourceOutput,
} from "@/engine/myocardium/myofilament/land2017/types";

export const PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID =
  "four-chamber-phase-b1-rate-free-Land-wall-material-kernel-v1" as const;

export type PhaseB1SlsModeV1 = "on" | "off";

export type PhaseB1WallMaterialStateInputV1 = Readonly<{
  wallMaterial: PhaseB1WallRuntimeMaterialV1;
  fiberLogStrain: number;
  freeCalciumUM: number;
  landState: RateFreeLand2017StateV1;
  slsMode: PhaseB1SlsModeV1;
  alphaV: number | null;
}>;

export type PhaseB1WallMaterialStateEvaluationV1 = Readonly<{
  kernelId: typeof PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID;
  wallId: PhaseB1WallRuntimeMaterialV1["wallId"];
  tissueClass: PhaseB1WallRuntimeMaterialV1["tissueClass"];
  fiberLogStrain: number;
  length: LandLengthStateOutputV1;
  reconstructedSourceLandState: readonly number[];
  sourceLandOutput: LandSourceOutput;
  sourceActiveStressPartialPaPerLandStretchAtFixedRateFreeState: number;
  wallActiveKirchhoffStressPa: number;
  wallActiveStressPartialPaPerFiberLogStrainAtFixedLandState: number;
  wallActiveStressPartialsPaByLandState: readonly [
    CaTRPN: number,
    B: number,
    W: number,
    S: number,
    xiW: number,
    xiS: number,
  ];
  passive: EquilibriumPassiveEvaluationV1;
  sls: Readonly<{
    mode: PhaseB1SlsModeV1;
    statePhysicallyPresent: boolean;
    alphaV: number | null;
    overstressPa: number;
    storedEnergyDensityJPerM3: number;
    stressPartialPaPerFiberLogStrainAtFixedAlpha: number;
    stressPartialPaPerAlphaV: number | null;
  }>;
  totalWallKirchhoffStressPa: number;
  totalStressPartialPaPerFiberLogStrainAtFixedInternalState: number;
  totalStressPartialsPaByLandState: readonly number[];
  totalStressPartialPaPerAlphaV: number | null;
  stabilizationStiffnessIncludedInStressOrTangent: false;
  productionStateResidualUsesStrainRate: false;
}>;

export type PhaseB1WallBackwardEulerInputV1 = Readonly<{
  wallMaterial: PhaseB1WallRuntimeMaterialV1;
  previousFiberLogStrain: number;
  nextFiberLogStrain: number;
  endpointFreeCalciumUM: number;
  previousLandState: RateFreeLand2017StateV1;
  nextLandState: RateFreeLand2017StateV1;
  slsMode: PhaseB1SlsModeV1;
  previousAlphaV: number | null;
  nextAlphaV: number | null;
  dtSec: number;
}>;

export type PhaseB1WallBackwardEulerEvaluationV1 = Readonly<{
  kernelId: typeof PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID;
  state: PhaseB1WallMaterialStateEvaluationV1;
  landResidual: readonly number[];
  landStateJacobianRowMajor: readonly number[];
  landResidualPartialByNextFiberLogStrain: readonly number[];
  slsResidual: number | null;
  slsResidualPartialByNextFiberLogStrain: number | null;
  slsResidualPartialByNextAlphaV: number | null;
  calciumResidualPresent: false;
  calciumIsKnownEndpointForcing: true;
  productionStateResidualUsesStrainRate: false;
}>;

export function evaluatePhaseB1WallMaterialStateV1(
  input: PhaseB1WallMaterialStateInputV1,
): PhaseB1WallMaterialStateEvaluationV1 {
  assertExactPlainRecordV1(input, [
    "wallMaterial",
    "fiberLogStrain",
    "freeCalciumUM",
    "landState",
    "slsMode",
    "alphaV",
  ], "phaseB1WallMaterialStateInput");
  const wallMaterial = assertPhaseB1WallRuntimeMaterialV1(input.wallMaterial);
  const fiberLogStrain = requireFinite(input.fiberLogStrain, "fiberLogStrain");
  const freeCalciumUM = requireNonNegativeFinite(
    input.freeCalciumUM,
    "freeCalciumUM",
  );
  validateSlsCoordinate(input.slsMode, input.alphaV, "alphaV");
  const length = evaluateLandLengthStateV1(
    wallMaterial.landWallAdapterContext,
    { fiberLogStrain },
  );
  const parameterSet = wallMaterial.landEquationParameters;
  const sourceState = rateFreeLand2017StateToSourceV1(
    input.landState,
    length.landStretch,
    parameterSet,
  );
  const sourceLandOutput = evaluateLand2017ContinuousOutput(
    sourceState,
    {
      freeCalciumUM,
      fiberEngineeringStrain: length.landEngineeringStrain,
      fiberEngineeringStrainRatePerSec: 0,
      zetaDriveFiberEngineeringStrainRatePerSec: 0,
    },
    parameterSet,
  );
  if (!sourceLandOutput.health.finite || sourceLandOutput.health.projectionUsed) {
    throw new Error("Phase B1 wall Land state must be finite and unprojected");
  }
  const p = parameterSet.values;
  const d = parameterSet.derived;
  const lengthDependence = evaluateLandLengthDependenceV1(
    length.landStretch,
    p.CaT50Ref,
    p.beta0,
    p.beta1,
  );
  const W = sourceState[LAND2017_STATE_INDEX.W];
  const S = sourceState[LAND2017_STATE_INDEX.S];
  const zetaW = sourceState[LAND2017_STATE_INDEX.zetaW];
  const zetaS = sourceState[LAND2017_STATE_INDEX.zetaS];
  const stressScalePa = p.Tref / p.rs;
  const distortionWeightedPopulation = S * (zetaS + 1) + W * zetaW;
  const sourceActiveStressPartialPaPerLandStretchAtFixedRateFreeState =
    stressScalePa * (
      lengthDependence.lengthFactorDerivativeByLandStretch
        * distortionWeightedPopulation
      + lengthDependence.lengthFactor * (S * d.As + W * d.Aw)
    );
  const activeTransform = evaluateLandNominalToKirchhoffAtStateV1(
    wallMaterial.landWallAdapterContext,
    {
      sourceStressConvention: "land2017-Ta",
      landActiveNominalStressPa:
        sourceLandOutput.sourceActiveFiberStressPa,
      landActiveNominalPartialPaPerLandStretch:
        sourceActiveStressPartialPaPerLandStretchAtFixedRateFreeState,
      length,
    },
  );
  const sourceStressPartials = Object.freeze([
    0,
    0,
    lengthDependence.lengthFactor * stressScalePa * zetaW,
    lengthDependence.lengthFactor * stressScalePa * (zetaS + 1),
    lengthDependence.lengthFactor * stressScalePa * W,
    lengthDependence.lengthFactor * stressScalePa * S,
  ] as const);
  const activeHomogenizationFactor = length.landStretch
    * wallMaterial.landWallAdapterContext.chiOrient
    * wallMaterial.landWallAdapterContext.fViable;
  const wallActiveStressPartialsPaByLandState = Object.freeze(
    sourceStressPartials.map((partial) => activeHomogenizationFactor * partial),
  ) as PhaseB1WallMaterialStateEvaluationV1[
    "wallActiveStressPartialsPaByLandState"
  ];
  const passive = evaluateEquilibriumPassiveEnergyV1(
    fiberLogStrain,
    wallMaterial.passiveSls.compiledPassive,
  );
  const sls = evaluateSlsAtState(
    input.slsMode,
    input.alphaV,
    fiberLogStrain,
    wallMaterial.passiveSls.compiledSls.EVPa,
  );
  const totalWallKirchhoffStressPa = passive.equilibriumKirchhoffStressPa
    + sls.overstressPa
    + activeTransform.wallActiveKirchhoffStressPa;
  const activeStrainPartial = requireFinite(
    activeTransform.wallActivePartialPaPerFiberLogStrain,
    "wallActivePartialPaPerFiberLogStrain",
  );
  const totalStressPartialPaPerFiberLogStrainAtFixedInternalState =
    passive.dStressDFiberLogStrainPa
    + sls.stressPartialPaPerFiberLogStrainAtFixedAlpha
    + activeStrainPartial;
  [
    sourceActiveStressPartialPaPerLandStretchAtFixedRateFreeState,
    totalWallKirchhoffStressPa,
    totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
    ...wallActiveStressPartialsPaByLandState,
  ].forEach((value, index) => requireFinite(value, `wallMaterialOutput[${index}]`));
  return Object.freeze({
    kernelId: PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
    wallId: wallMaterial.wallId,
    tissueClass: wallMaterial.tissueClass,
    fiberLogStrain,
    length,
    reconstructedSourceLandState: Object.freeze(Array.from(sourceState)),
    sourceLandOutput,
    sourceActiveStressPartialPaPerLandStretchAtFixedRateFreeState,
    wallActiveKirchhoffStressPa:
      activeTransform.wallActiveKirchhoffStressPa,
    wallActiveStressPartialPaPerFiberLogStrainAtFixedLandState:
      activeStrainPartial,
    wallActiveStressPartialsPaByLandState,
    passive,
    sls,
    totalWallKirchhoffStressPa,
    totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
    totalStressPartialsPaByLandState: wallActiveStressPartialsPaByLandState,
    totalStressPartialPaPerAlphaV: sls.stressPartialPaPerAlphaV,
    stabilizationStiffnessIncludedInStressOrTangent: false,
    productionStateResidualUsesStrainRate: false,
  });
}

export function evaluatePhaseB1WallBackwardEulerV1(
  input: PhaseB1WallBackwardEulerInputV1,
): PhaseB1WallBackwardEulerEvaluationV1 {
  assertExactPlainRecordV1(input, [
    "wallMaterial",
    "previousFiberLogStrain",
    "nextFiberLogStrain",
    "endpointFreeCalciumUM",
    "previousLandState",
    "nextLandState",
    "slsMode",
    "previousAlphaV",
    "nextAlphaV",
    "dtSec",
  ], "phaseB1WallBackwardEulerInput");
  const wallMaterial = assertPhaseB1WallRuntimeMaterialV1(input.wallMaterial);
  const previousFiberLogStrain = requireFinite(
    input.previousFiberLogStrain,
    "previousFiberLogStrain",
  );
  const nextFiberLogStrain = requireFinite(
    input.nextFiberLogStrain,
    "nextFiberLogStrain",
  );
  const endpointFreeCalciumUM = requireNonNegativeFinite(
    input.endpointFreeCalciumUM,
    "endpointFreeCalciumUM",
  );
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  validateSlsCoordinate(input.slsMode, input.previousAlphaV, "previousAlphaV");
  validateSlsCoordinate(input.slsMode, input.nextAlphaV, "nextAlphaV");
  const previousLength = evaluateLandLengthStateV1(
    wallMaterial.landWallAdapterContext,
    { fiberLogStrain: previousFiberLogStrain },
  );
  const nextLength = evaluateLandLengthStateV1(
    wallMaterial.landWallAdapterContext,
    { fiberLogStrain: nextFiberLogStrain },
  );
  const step = {
    freeCalciumUM: endpointFreeCalciumUM,
    previousLandStretch: previousLength.landStretch,
    stageLandStretch: nextLength.landStretch,
    dtSec,
  } as const;
  const parameterSet = wallMaterial.landEquationParameters;
  const landResidual = writeRateFreeLand2017BackwardEulerResidualV1(
    input.nextLandState,
    input.previousLandState,
    step,
    parameterSet,
  );
  const landStateJacobian = writeRateFreeLand2017BackwardEulerResidualJacobianV1(
    input.nextLandState,
    step,
    parameterSet,
  );
  const landResidualStrainPartial = evaluateLandResidualStrainPartial(
    input.nextLandState,
    nextLength.landStretch,
    endpointFreeCalciumUM,
    dtSec,
    parameterSet,
  );
  const state = evaluatePhaseB1WallMaterialStateV1({
    wallMaterial,
    fiberLogStrain: nextFiberLogStrain,
    freeCalciumUM: endpointFreeCalciumUM,
    landState: input.nextLandState,
    slsMode: input.slsMode,
    alphaV: input.nextAlphaV,
  });
  const slsOn = input.slsMode === "on";
  const tauSec = wallMaterial.passiveSls.compiledSls.tauSec;
  const slsResidual = slsOn
    ? requireFinite(input.nextAlphaV, "nextAlphaV")
      - requireFinite(input.previousAlphaV, "previousAlphaV")
      - dtSec * (
        nextFiberLogStrain - requireFinite(input.nextAlphaV, "nextAlphaV")
      ) / tauSec
    : null;
  return Object.freeze({
    kernelId: PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
    state,
    landResidual: Object.freeze(Array.from(landResidual)),
    landStateJacobianRowMajor: Object.freeze(Array.from(landStateJacobian)),
    landResidualPartialByNextFiberLogStrain: landResidualStrainPartial,
    slsResidual,
    slsResidualPartialByNextFiberLogStrain: slsOn ? -dtSec / tauSec : null,
    slsResidualPartialByNextAlphaV: slsOn ? 1 + dtSec / tauSec : null,
    calciumResidualPresent: false,
    calciumIsKnownEndpointForcing: true,
    productionStateResidualUsesStrainRate: false,
  });
}

function evaluateLandResidualStrainPartial(
  nextLandState: RateFreeLand2017StateV1,
  landStretch: number,
  freeCalciumUM: number,
  dtSec: number,
  parameterSet: PhaseB1WallRuntimeMaterialV1["landEquationParameters"],
): readonly number[] {
  const sourceState = rateFreeLand2017StateToSourceV1(
    nextLandState,
    landStretch,
    parameterSet,
  );
  const p = parameterSet.values;
  const d = parameterSet.derived;
  const lengthDependence = evaluateLandLengthDependenceV1(
    landStretch,
    p.CaT50Ref,
    p.beta0,
    p.beta1,
  );
  const caTrpn = nextLandState[LAND2017_STATE_INDEX.CaTRPN];
  const W = nextLandState[LAND2017_STATE_INDEX.W];
  const S = nextLandState[LAND2017_STATE_INDEX.S];
  const caDrive = Math.pow(freeCalciumUM / lengthDependence.caT50UM, p.nTRPN);
  const caDrivePartialByLandStretch = caDrive === 0
    ? 0
    : -p.nTRPN * caDrive
      * lengthDependence.caT50DerivativeByLandStretchUM
      / lengthDependence.caT50UM;
  const rhsPartialByLandStretch = new Float64Array(LAND2017_STATE_SIZE);
  rhsPartialByLandStretch[LAND2017_STATE_INDEX.CaTRPN] =
    p.kTRPN * caDrivePartialByLandStretch * (1 - caTrpn);
  rhsPartialByLandStretch[LAND2017_STATE_INDEX.B] = 0;
  rhsPartialByLandStretch[LAND2017_STATE_INDEX.W] = -W * p.gammaW
    * evaluateAbsoluteValueV1(
      sourceState[LAND2017_STATE_INDEX.zetaW],
    ).generalizedDerivative * d.Aw;
  rhsPartialByLandStretch[LAND2017_STATE_INDEX.S] = -S
    * evaluateLandGammaSuV1(
      sourceState[LAND2017_STATE_INDEX.zetaS],
      p.gammaS,
    ).generalizedDerivative * d.As;
  rhsPartialByLandStretch[LAND2017_STATE_INDEX.zetaW] = -d.cw * d.Aw;
  rhsPartialByLandStretch[LAND2017_STATE_INDEX.zetaS] = -d.cs * d.As;
  return Object.freeze(Array.from(
    rhsPartialByLandStretch,
    (partial) => -dtSec * partial * landStretch,
  ));
}

function evaluateSlsAtState(
  mode: PhaseB1SlsModeV1,
  alphaV: number | null,
  fiberLogStrain: number,
  EVPa: number,
): PhaseB1WallMaterialStateEvaluationV1["sls"] {
  if (mode === "off") {
    return Object.freeze({
      mode,
      statePhysicallyPresent: false,
      alphaV: null,
      overstressPa: 0,
      storedEnergyDensityJPerM3: 0,
      stressPartialPaPerFiberLogStrainAtFixedAlpha: 0,
      stressPartialPaPerAlphaV: null,
    });
  }
  const alpha = requireFinite(alphaV, "alphaV");
  const elasticStrain = fiberLogStrain - alpha;
  return Object.freeze({
    mode,
    statePhysicallyPresent: true,
    alphaV: alpha,
    overstressPa: EVPa * elasticStrain,
    storedEnergyDensityJPerM3: 0.5 * EVPa * elasticStrain * elasticStrain,
    stressPartialPaPerFiberLogStrainAtFixedAlpha: EVPa,
    stressPartialPaPerAlphaV: -EVPa,
  });
}

function validateSlsCoordinate(
  mode: PhaseB1SlsModeV1,
  alphaV: number | null,
  field: string,
): void {
  if (mode === "on") {
    requireFinite(alphaV, field);
    return;
  }
  if (mode === "off") {
    if (alphaV !== null) throw new Error(`${field} must be null in SLS-off topology`);
    return;
  }
  throw new Error("slsMode must be on or off");
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result <= 0) throw new Error(`${field} must be positive`);
  return result;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result < 0) throw new Error(`${field} must be nonnegative`);
  return result;
}
