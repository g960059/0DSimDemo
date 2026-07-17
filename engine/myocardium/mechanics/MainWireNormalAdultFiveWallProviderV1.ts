import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  evaluateEquilibriumOneFiberPassiveV1,
  type CompiledEquilibriumOneFiberPassiveV1,
} from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import {
  cloneLandSlsWallMaterialStateV1,
  evaluateAcceptedLandSlsWallStateV1,
  initializeLandSlsWallAtFixedInputV1,
  trialLandSlsWallMaterialV1,
  type LandSlsWallEquilibriumPassiveInputV1,
  type LandSlsWallMaterialParamsV1,
  type LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  createMainWireFiveWallLandTriSegProviderV1,
  type MainWireFiveWallFreeCalciumDriveV1,
  type MainWireFiveWallIdV1,
  type MainWireFiveWallLandSlsMaterialKernelV1,
  type MainWireFiveWallLandTriSegProviderV1,
  type MainWireFiveWallMaterialEvaluationV1,
  type MainWireFiveWallRecordV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  evaluateMoyer2015AtrialEquibiaxialPassiveV1,
  type CompiledMoyer2015AtrialEquibiaxialPassiveV1,
} from "@/engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
  assertNormalAdultFiveWallPriorV1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import type {
  WholeHeartMechanicsSerializableValueV1,
  WholeHeartMechanicsStateCodecV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID =
  "main-wire-normal-adult-five-wall-material-adapter-v1" as const;

/** Fixed canonical control, exposed so accepted-step diagnostics can audit it. */
export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1 =
  2e-5 as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM = Object.freeze({
  priorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.priorId,
  atrialEquilibriumPassiveOwner: "Moyer-2015-exact-equibiaxial-reduction" as const,
  ventricularEquilibriumPassiveOwner: "Klotz-normal-center-one-fiber" as const,
  activeOwner: "Land-2017-active-only" as const,
  fullLandKernelOnAllFiveWalls: true as const,
  landStateCountPerWall: 6 as const,
  atrialPopulationOnlyReductionApplied: false as const,
  externalSeriesElementApplied: false as const,
  viscousOwner: "one-state-parallel-SLS" as const,
  passiveStoredEnergyReported: true as const,
  slsStoredEnergyAndDissipationReported: true as const,
  landThermodynamicStoredEnergyClaimed: false as const,
  totalThermodynamicPotentialIncludingLandClaimed: false as const,
  providerTopology: "fixed-two-coordinate-TriSeg" as const,
  parameterFittingIncluded: false as const,
});

/** Mechanics-only fixture; not a circulation cold-state or periodic solution. */
export const MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1 = Object.freeze({
  LA: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria.LA
    .cavityBloodVolumeMl.minimum,
  LV: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg
    .leftVentricularEndDiastolicVolumeMl,
  RA: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria.RA
    .cavityBloodVolumeMl.minimum,
  RV: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg
    .rightVentricularEndDiastolicVolumeMl,
});

export type MainWireNormalAdultWallEnergyLedgerV1 = Readonly<{
  equilibriumPassiveStoredEnergyDensityJPerM3: number;
  slsPreviousStoredEnergyDensityJPerM3: number;
  slsNextStoredEnergyDensityJPerM3: number;
  slsPhysicalDissipationIncrementDensityJPerM3: number;
  slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: number;
  slsDiscreteEnergyBalanceResidualJPerM3: number;
  slsPassive: boolean;
  landThermodynamicStoredEnergyClaimed: false;
  totalThermodynamicPotentialIncludingLandClaimed: false;
}>;

export type MainWireNormalAdultWallMaterialReadbackV1 = Readonly<{
  adapterId: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID;
  wallId: MainWireFiveWallIdV1;
  passiveModelId:
    | "moyer-2015-atrial-equibiaxial-passive-v1"
    | "equilibrium-one-fiber-passive-log-strain-v1";
  passiveParameterIdentityHash: string;
  landParameterSetStableHash: string;
  landActiveKirchhoffStressPa: number;
  slsOverstressPa: number;
  totalKirchhoffStressPa: number;
  energyLedger: MainWireNormalAdultWallEnergyLedgerV1;
  coldFixedInputIterations: number | null;
  coldLandMaximumStateUpdate: number | null;
  claim: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM;
}>;

export type MainWireNormalAdultFiveWallProviderV1 =
  MainWireFiveWallLandTriSegProviderV1<LandSlsWallMaterialStateV1>;

export type MainWireNormalAdultLaSlsModeV1 = "on" | "exact-off";

type PassiveEvaluationV1 = Readonly<{
  modelId: MainWireNormalAdultWallMaterialReadbackV1["passiveModelId"];
  parameterIdentityHash: string;
  input: LandSlsWallEquilibriumPassiveInputV1;
}>;

type PassiveEvaluatorV1 = (fiberLogStrain: number) => PassiveEvaluationV1;

const LAND_SLS_STATE_CODEC: WholeHeartMechanicsStateCodecV1<
  LandSlsWallMaterialStateV1
> = Object.freeze({
  clone: cloneLandSlsWallMaterialStateV1,
  encode: encodeLandSlsState,
  decode: decodeLandSlsState,
});

export function createCanonicalMainWireNormalAdultFiveWallProviderV1(
  laSlsMode: MainWireNormalAdultLaSlsModeV1 = "on",
):
MainWireNormalAdultFiveWallProviderV1 {
  return createNormalAdultProvider(laSlsMode);
}

export function createMainWireNormalAdultFiveWallMaterialKernelsV1(
  laSlsMode: MainWireNormalAdultLaSlsModeV1 = "on",
):
MainWireFiveWallRecordV1<
  MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
> {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  assertNormalAdultFiveWallPriorV1(prior);
  return fiveWallRecord((wallId) => {
    const isAtrium = wallId === "LA" || wallId === "RA";
    const passive = isAtrium
      ? createMoyerPassiveEvaluator(prior.passive.atrial.compiled)
      : createKlotzPassiveEvaluator(prior.passive.ventricular.compiled);
    const baseParams = prior.active.wallMaterialByWall[wallId];
    const materialParams = wallId === "LA" && laSlsMode === "exact-off"
      ? exactLaSlsOffParams(baseParams)
      : baseParams;
    return createWallKernel(
      wallId,
      materialParams,
      passive,
      prior.parameterIdentityHash,
    );
  });
}

function createNormalAdultProvider(
  laSlsMode: MainWireNormalAdultLaSlsModeV1,
): MainWireNormalAdultFiveWallProviderV1 {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  assertNormalAdultFiveWallPriorV1(prior);
  return createMainWireFiveWallLandTriSegProviderV1(Object.freeze({
    parameterSetId:
      `${prior.priorId}-${laSlsMode === "on" ? "canonical" : "la-sls-exact-off"}`,
    materialByWall: createMainWireNormalAdultFiveWallMaterialKernelsV1(laSlsMode),
    atria: Object.freeze({
      LA: atrialGeometry("LA"),
      RA: atrialGeometry("RA"),
    }),
    trisegWalls: prior.anatomy.triSeg.wallGeometryParameters,
    initialTriSegCoordinates: prior.anatomy.triSeg.loadedCoordinates,
    internalCoordinateScales: Object.freeze({
      septalMidwallCapVolumeM3:
        Math.abs(prior.anatomy.triSeg.loadedCoordinates.septalMidwallCapVolumeM3),
      junctionRadiusM: prior.anatomy.triSeg.loadedCoordinates.junctionRadiusM,
    }),
    solver: Object.freeze({
      finiteDifferenceScaledStep:
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1,
    }),
  }));
}

function exactLaSlsOffParams(
  base: LandSlsWallMaterialParamsV1,
): LandSlsWallMaterialParamsV1 {
  return Object.freeze({
    ...base,
    parameterSetId: `${base.parameterSetId}-la-sls-exact-off`,
    sls: Object.freeze({
      ...base.sls,
      parameterSetId: `${base.sls.parameterSetId}-la-exact-off`,
      branchModulusPa: 0,
    }),
  });
}

function atrialGeometry(atriumId: "LA" | "RA") {
  const anatomy = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria[atriumId];
  return Object.freeze({
    wallMaterialVolumeM3: anatomy.wallMaterialVolumeMl * 1e-6,
    referenceCavityBloodVolumeM3:
      anatomy.inverseUnloadedReferenceCavityVolumeMl * 1e-6,
  });
}

function createWallKernel(
  wallId: MainWireFiveWallIdV1,
  params: LandSlsWallMaterialParamsV1,
  evaluatePassive: PassiveEvaluatorV1,
  priorIdentityHash: string,
): MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1> {
  const passiveAtZero = evaluatePassive(0);
  const parameterIdentityHash = stableHash(sanitizeForStableHash({
    adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
    priorIdentityHash,
    wallId,
    passiveModelId: passiveAtZero.modelId,
    passiveParameterIdentityHash: passiveAtZero.parameterIdentityHash,
    landSls: landSlsParameterHashInput(params),
  }));
  return Object.freeze({
    modelId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
    parameterSetId: `${params.parameterSetId}-${wallId}`,
    parameterIdentityHash,
    topology:
      "Land-active-plus-equilibrium-passive-plus-parallel-one-state-SLS" as const,
    stateCodec: LAND_SLS_STATE_CODEC,
    initializeColdAtFixedInput: ({ fiberLogStrain, freeCalciumUM }) => {
      const passive = evaluatePassive(fiberLogStrain);
      const cold = initializeLandSlsWallAtFixedInputV1(
        fiberLogStrain,
        freeCalciumUM,
        params,
      );
      const accepted = evaluateAcceptedLandSlsWallStateV1(
        cold.state,
        passive.input,
        params,
      );
      const errors = [
        ...(cold.converged ? [] : ["Land fixed-input cold iteration did not converge"]),
        ...accepted.issues,
      ];
      return materialEvaluation({
        wallId,
        state: cold.state,
        fiberLogStrain,
        stressPa: accepted.totalKirchhoffStressPa,
        iterationCount: cold.fixedInputIterations,
        residualNorm: cold.maximumStateUpdate,
        finite: accepted.finite && Number.isFinite(cold.maximumStateUpdate),
        valid: cold.converged && accepted.valid,
        errors,
        readback: wallReadback({
          wallId,
          passive,
          params,
          landActiveKirchhoffStressPa: accepted.activeKirchhoffStressPa,
          slsOverstressPa: accepted.slsOverstressPa,
          totalKirchhoffStressPa: accepted.totalKirchhoffStressPa,
          energyLedger: zeroSlsEnergyLedger(passive.input),
          coldFixedInputIterations: cold.fixedInputIterations,
          coldLandMaximumStateUpdate: cold.maximumStateUpdate,
        }),
      });
    },
    evaluateTrialFromAccepted: ({
      previousAcceptedState,
      candidateFiberLogStrain,
      candidateFreeCalciumUM,
      stepDtSec,
    }) => {
      const passive = evaluatePassive(candidateFiberLogStrain);
      const trial = trialLandSlsWallMaterialV1(
        previousAcceptedState,
        {
          nextFiberLogStrain: candidateFiberLogStrain,
          nextFreeCalciumUM: candidateFreeCalciumUM,
          dtSec: stepDtSec,
          equilibriumPassive: passive.input,
        },
        params,
      );
      const residualNorm = Math.max(
        Math.abs(trial.landSolverResidualNorm),
        Math.abs(trial.sls.stateResidual),
      );
      return materialEvaluation({
        wallId,
        state: trial.state,
        fiberLogStrain: candidateFiberLogStrain,
        stressPa: trial.totalKirchhoffStressPa,
        iterationCount: trial.landSolverIterations,
        residualNorm,
        finite: trial.finite,
        valid: trial.valid,
        errors: trial.issues,
        readback: wallReadback({
          wallId,
          passive,
          params,
          landActiveKirchhoffStressPa: trial.activeKirchhoffStressPa,
          slsOverstressPa: trial.sls.nextOverstressPa,
          totalKirchhoffStressPa: trial.totalKirchhoffStressPa,
          energyLedger: Object.freeze({
            equilibriumPassiveStoredEnergyDensityJPerM3:
              passive.input.storedEnergyDensityJPerM3,
            slsPreviousStoredEnergyDensityJPerM3:
              trial.sls.previousStoredEnergyDensityJPerM3,
            slsNextStoredEnergyDensityJPerM3:
              trial.sls.nextStoredEnergyDensityJPerM3,
            slsPhysicalDissipationIncrementDensityJPerM3:
              trial.sls.physicalDissipationIncrementDensityJPerM3,
            slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
              trial.sls.backwardEulerNumericalDissipationIncrementDensityJPerM3,
            slsDiscreteEnergyBalanceResidualJPerM3:
              trial.sls.discreteEnergyBalanceResidualJPerM3,
            slsPassive: trial.sls.passive,
            landThermodynamicStoredEnergyClaimed: false as const,
            totalThermodynamicPotentialIncludingLandClaimed: false as const,
          }),
          coldFixedInputIterations: null,
          coldLandMaximumStateUpdate: null,
        }),
      });
    },
  });
}

function createMoyerPassiveEvaluator(
  compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV1,
): PassiveEvaluatorV1 {
  return (fiberLogStrain) => {
    const evaluated = evaluateMoyer2015AtrialEquibiaxialPassiveV1(
      fiberLogStrain,
      compiled,
    );
    return Object.freeze({
      modelId: evaluated.modelId,
      parameterIdentityHash: evaluated.parameterIdentityHash,
      input: Object.freeze({
        stressPa: evaluated.equilibriumKirchhoffStressPa,
        tangentPa: evaluated.dStressDFiberLogStrainPa,
        storedEnergyDensityJPerM3: evaluated.storedEnergyDensityJPerM3,
      }),
    });
  };
}

function createKlotzPassiveEvaluator(
  compiled: CompiledEquilibriumOneFiberPassiveV1,
): PassiveEvaluatorV1 {
  return (fiberLogStrain) => {
    const evaluated = evaluateEquilibriumOneFiberPassiveV1(
      fiberLogStrain,
      compiled,
    );
    return Object.freeze({
      modelId: evaluated.modelId,
      parameterIdentityHash: evaluated.parameterIdentityHash,
      input: Object.freeze({
        stressPa: evaluated.equilibriumKirchhoffStressPa,
        tangentPa: evaluated.dStressDFiberLogStrainPa,
        storedEnergyDensityJPerM3: evaluated.storedEnergyDensityJPerM3,
      }),
    });
  };
}

function materialEvaluation(input: Readonly<{
  wallId: MainWireFiveWallIdV1;
  state: LandSlsWallMaterialStateV1;
  fiberLogStrain: number;
  stressPa: number;
  iterationCount: number;
  residualNorm: number;
  finite: boolean;
  valid: boolean;
  errors: readonly string[];
  readback: MainWireNormalAdultWallMaterialReadbackV1;
}>): MainWireFiveWallMaterialEvaluationV1<LandSlsWallMaterialStateV1> {
  const finite = input.finite && [
    input.fiberLogStrain,
    input.stressPa,
    input.residualNorm,
  ].every(Number.isFinite);
  return Object.freeze({
    state: cloneLandSlsWallMaterialStateV1(input.state),
    fiberLogStrain: input.fiberLogStrain,
    fiberKirchhoffStressPa: input.stressPa,
    iterationCount: input.iterationCount,
    residualNorm: input.residualNorm,
    finite,
    valid: finite && input.valid && input.errors.length === 0,
    errors: Object.freeze([...input.errors]),
    warnings: Object.freeze([]),
    readback: input.readback,
  });
}

function wallReadback(input: Readonly<{
  wallId: MainWireFiveWallIdV1;
  passive: PassiveEvaluationV1;
  params: LandSlsWallMaterialParamsV1;
  landActiveKirchhoffStressPa: number;
  slsOverstressPa: number;
  totalKirchhoffStressPa: number;
  energyLedger: MainWireNormalAdultWallEnergyLedgerV1;
  coldFixedInputIterations: number | null;
  coldLandMaximumStateUpdate: number | null;
}>): MainWireNormalAdultWallMaterialReadbackV1 {
  return Object.freeze({
    adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
    wallId: input.wallId,
    passiveModelId: input.passive.modelId,
    passiveParameterIdentityHash: input.passive.parameterIdentityHash,
    landParameterSetStableHash:
      input.params.landEquationParameters.parameterSetStableHash,
    landActiveKirchhoffStressPa: input.landActiveKirchhoffStressPa,
    slsOverstressPa: input.slsOverstressPa,
    totalKirchhoffStressPa: input.totalKirchhoffStressPa,
    energyLedger: input.energyLedger,
    coldFixedInputIterations: input.coldFixedInputIterations,
    coldLandMaximumStateUpdate: input.coldLandMaximumStateUpdate,
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
  });
}

function zeroSlsEnergyLedger(
  passive: LandSlsWallEquilibriumPassiveInputV1,
): MainWireNormalAdultWallEnergyLedgerV1 {
  return Object.freeze({
    equilibriumPassiveStoredEnergyDensityJPerM3:
      passive.storedEnergyDensityJPerM3,
    slsPreviousStoredEnergyDensityJPerM3: 0,
    slsNextStoredEnergyDensityJPerM3: 0,
    slsPhysicalDissipationIncrementDensityJPerM3: 0,
    slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: 0,
    slsDiscreteEnergyBalanceResidualJPerM3: 0,
    slsPassive: true,
    landThermodynamicStoredEnergyClaimed: false,
    totalThermodynamicPotentialIncludingLandClaimed: false,
  });
}

function landSlsParameterHashInput(params: LandSlsWallMaterialParamsV1) {
  return {
    parameterSetId: params.parameterSetId,
    landParameterSetStableHash:
      params.landEquationParameters.parameterSetStableHash,
    landSlackStretch: params.landSlackStretch,
    orientationFraction01: params.orientationFraction01,
    viableActiveFraction01: params.viableActiveFraction01,
    sls: params.sls,
  };
}

function encodeLandSlsState(
  state: LandSlsWallMaterialStateV1,
): WholeHeartMechanicsSerializableValueV1 {
  const cloned = cloneLandSlsWallMaterialStateV1(state);
  return Object.freeze({
    landState: Object.freeze(Array.from(cloned.landState)),
    slsState: Object.freeze({ ...cloned.slsState }),
    previousFiberLogStrain: cloned.previousFiberLogStrain,
    previousFreeCalciumUM: cloned.previousFreeCalciumUM,
  });
}

function decodeLandSlsState(
  encoded: WholeHeartMechanicsSerializableValueV1,
): LandSlsWallMaterialStateV1 {
  if (encoded === null || Array.isArray(encoded) || typeof encoded !== "object") {
    throw new Error("encoded Land/SLS wall state must be a record");
  }
  const record = encoded as Record<string, WholeHeartMechanicsSerializableValueV1>;
  assertExactKeys(
    record,
    [
      "landState",
      "slsState",
      "previousFiberLogStrain",
      "previousFreeCalciumUM",
    ],
    "encoded Land/SLS wall state",
  );
  const landState = record.landState;
  const slsState = record.slsState;
  if (
    !Array.isArray(landState)
    || landState.length !== 6
    || !landState.every((value) => typeof value === "number" && Number.isFinite(value))
  ) throw new Error("encoded Land state must contain six finite numbers");
  if (slsState === null || Array.isArray(slsState) || typeof slsState !== "object") {
    throw new Error("encoded SLS state must be a record");
  }
  const slsRecord = slsState as Record<
    string,
    WholeHeartMechanicsSerializableValueV1
  >;
  assertExactKeys(slsRecord, ["viscousLogStrain"], "encoded SLS state");
  const viscous = slsRecord.viscousLogStrain;
  const previousFiberLogStrain = record.previousFiberLogStrain;
  const previousFreeCalciumUM = record.previousFreeCalciumUM;
  for (const [label, value] of Object.entries({
    viscousLogStrain: viscous,
    previousFiberLogStrain,
    previousFreeCalciumUM,
  })) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`encoded ${label} must be finite`);
    }
  }
  if ((previousFreeCalciumUM as number) < 0) {
    throw new Error("encoded previousFreeCalciumUM must be nonnegative");
  }
  return cloneLandSlsWallMaterialStateV1({
    landState: Float64Array.from(landState as number[]),
    slsState: Object.freeze({ viscousLogStrain: viscous as number }),
    previousFiberLogStrain: previousFiberLogStrain as number,
    previousFreeCalciumUM: previousFreeCalciumUM as number,
  });
}

function fiveWallRecord<T>(
  build: (wallId: MainWireFiveWallIdV1) => T,
): MainWireFiveWallRecordV1<T> {
  const wallIds: readonly MainWireFiveWallIdV1[] = [
    "LA",
    "LVFW",
    "SEP",
    "RVFW",
    "RA",
  ];
  return Object.freeze(Object.fromEntries(
    wallIds.map((wallId) => [wallId, build(wallId)]),
  )) as MainWireFiveWallRecordV1<T>;
}

export function asMainWireFiveWallFreeCalciumDriveV1(
  values: Readonly<Record<MainWireFiveWallIdV1, number>>,
): MainWireFiveWallFreeCalciumDriveV1 {
  return Object.freeze({
    freeCalciumUMByWall: Object.freeze({ ...values }),
  });
}

function assertExactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) throw new Error(`${label} has an unexpected schema`);
}
