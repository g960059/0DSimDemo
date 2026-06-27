import { writeLand2017Rhs, type Land2017EquationParameters } from "@/engine/myocardium/myofilament/land2017/equations";
import { evaluateLand2017ContinuousOutput } from "@/engine/myocardium/myofilament/land2017/outputs";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  LAND2017_STATE_SIZE,
  assertLand2017StateVectorLength,
  type LandContinuousInput,
  type LandSourceOutput,
} from "@/engine/myocardium/myofilament/land2017/types";
import { requireFiniteNumber, requirePositiveFiniteSeconds } from "@/engine/myocardium/units";

export const LAND2017_SDIRK2_GAMMA = 1 - 1 / Math.sqrt(2);
export const LAND2017_SDIRK2_TABLEAU = Object.freeze({
  scheme: "SDIRK2",
  stageCount: 2,
  gamma: LAND2017_SDIRK2_GAMMA,
  a00: LAND2017_SDIRK2_GAMMA,
  a10: 1 - LAND2017_SDIRK2_GAMMA,
  a11: LAND2017_SDIRK2_GAMMA,
  c0: LAND2017_SDIRK2_GAMMA,
  c1: 1,
  finalStateSource: "Y1",
} as const);

export type Land2017Sdirk2Stage0Input = {
  readonly freeCalciumUM: number;
  readonly previousFiberEngineeringStrain: number;
  readonly stageFiberEngineeringStrain: number;
  readonly dtSec: number;
  readonly stage: {
    readonly scheme: "SDIRK2";
    readonly stageIndex: 0;
    readonly gamma: typeof LAND2017_SDIRK2_GAMMA;
  };
};

export type Land2017Sdirk2Stage0History = {
  readonly state: ArrayLike<number>;
  readonly fiberEngineeringStrain: number;
  readonly cavityVolumeM3: number;
  readonly freeCalciumUM: number;
};

export type Land2017Sdirk2Stage1Input = {
  readonly freeCalciumUM: number;
  readonly previousFiberEngineeringStrain: number;
  readonly stageFiberEngineeringStrain: number;
  readonly dtSec: number;
  readonly stage: {
    readonly scheme: "SDIRK2";
    readonly stageIndex: 1;
    readonly gamma: typeof LAND2017_SDIRK2_GAMMA;
  };
  readonly stage0: Land2017Sdirk2Stage0History;
};

export type Land2017Sdirk2StageInput =
  | Land2017Sdirk2Stage0Input
  | Land2017Sdirk2Stage1Input;

export type Land2017Sdirk2StageKinematics = {
  readonly stageFiberEngineeringStrainRatePerSec: number;
  readonly stage0FiberEngineeringStrainRatePerSec?: number;
};

export function deriveLand2017Sdirk2StageKinematics(
  input: Land2017Sdirk2StageInput,
): Land2017Sdirk2StageKinematics {
  rejectIndependentSdirk2Input(input);
  assertSdirk2Stage(input);
  const dtSec = requirePositiveFiniteSeconds(input.dtSec, "Land2017Sdirk2StageInput.dtSec");
  const previousFiberEngineeringStrain = requireFiniteNumber(
    input.previousFiberEngineeringStrain,
    "Land2017Sdirk2StageInput.previousFiberEngineeringStrain",
  );
  const stageFiberEngineeringStrain = requireFiniteNumber(
    input.stageFiberEngineeringStrain,
    "Land2017Sdirk2StageInput.stageFiberEngineeringStrain",
  );

  if (input.stage.stageIndex === 0) {
    return {
      stageFiberEngineeringStrainRatePerSec:
        (stageFiberEngineeringStrain - previousFiberEngineeringStrain)
        / (LAND2017_SDIRK2_GAMMA * dtSec),
    };
  }

  if (!("stage0" in input)) {
    throw new Error("Land 2017 SDIRK2 stage1 input requires stage0 history");
  }
  assertStage0History(input.stage0);
  const stage0FiberEngineeringStrain = requireFiniteNumber(
    input.stage0.fiberEngineeringStrain,
    "Land2017Sdirk2Stage1Input.stage0.fiberEngineeringStrain",
  );
  const stage0Rate =
    (stage0FiberEngineeringStrain - previousFiberEngineeringStrain)
    / (LAND2017_SDIRK2_GAMMA * dtSec);
  return {
    stageFiberEngineeringStrainRatePerSec:
      (
        stageFiberEngineeringStrain
        - previousFiberEngineeringStrain
        - dtSec * (1 - LAND2017_SDIRK2_GAMMA) * stage0Rate
      )
      / (LAND2017_SDIRK2_GAMMA * dtSec),
    stage0FiberEngineeringStrainRatePerSec: stage0Rate,
  };
}

export function land2017Sdirk2StageContinuousInput(
  input: Land2017Sdirk2StageInput,
): LandContinuousInput {
  const kinematics = deriveLand2017Sdirk2StageKinematics(input);
  return {
    freeCalciumUM: input.freeCalciumUM,
    fiberEngineeringStrain: input.stageFiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: kinematics.stageFiberEngineeringStrainRatePerSec,
  };
}

export function land2017Sdirk2Stage0ContinuousInput(
  input: Land2017Sdirk2Stage1Input,
): LandContinuousInput {
  rejectIndependentSdirk2Input(input);
  assertSdirk2Stage(input);
  if (!("stage0" in input)) {
    throw new Error("Land 2017 SDIRK2 stage1 input requires stage0 history");
  }
  assertStage0History(input.stage0);
  const dtSec = requirePositiveFiniteSeconds(input.dtSec, "Land2017Sdirk2StageInput.dtSec");
  const previousFiberEngineeringStrain = requireFiniteNumber(
    input.previousFiberEngineeringStrain,
    "Land2017Sdirk2StageInput.previousFiberEngineeringStrain",
  );
  const stage0FiberEngineeringStrain = requireFiniteNumber(
    input.stage0.fiberEngineeringStrain,
    "Land2017Sdirk2Stage1Input.stage0.fiberEngineeringStrain",
  );
  return {
    freeCalciumUM: input.stage0.freeCalciumUM,
    fiberEngineeringStrain: stage0FiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec:
      (stage0FiberEngineeringStrain - previousFiberEngineeringStrain)
      / (LAND2017_SDIRK2_GAMMA * dtSec),
  };
}

export function writeLand2017Sdirk2StageResidual(
  stageState: ArrayLike<number>,
  previousState: ArrayLike<number>,
  input: Land2017Sdirk2StageInput,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  outResidual: Float64Array = new Float64Array(LAND2017_STATE_SIZE),
): Float64Array {
  assertLand2017StateVectorLength(stageState, "Land 2017 SDIRK2 residual stage state");
  assertLand2017StateVectorLength(previousState, "Land 2017 SDIRK2 residual previous state");
  assertLand2017StateVectorLength(outResidual, "Land 2017 SDIRK2 residual output");
  assertSdirk2Stage(input);
  const dtSec = requirePositiveFiniteSeconds(input.dtSec, "Land2017Sdirk2StageInput.dtSec");

  const rhsStage = writeLand2017Rhs(
    stageState,
    land2017Sdirk2StageContinuousInput(input),
    parameterSet,
  );

  if (input.stage.stageIndex === 0) {
    for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
      outResidual[index] =
        stageState[index]
        - previousState[index]
        - dtSec * LAND2017_SDIRK2_GAMMA * rhsStage[index];
    }
    return outResidual;
  }

  if (!("stage0" in input)) {
    throw new Error("Land 2017 SDIRK2 stage1 input requires stage0 history");
  }
  assertStage0History(input.stage0);
  const rhs0 = writeLand2017Rhs(
    input.stage0.state,
    land2017Sdirk2Stage0ContinuousInput(input),
    parameterSet,
  );
  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    outResidual[index] =
      stageState[index]
      - previousState[index]
      - dtSec
        * (
          (1 - LAND2017_SDIRK2_GAMMA) * rhs0[index]
          + LAND2017_SDIRK2_GAMMA * rhsStage[index]
        );
  }
  return outResidual;
}

export function evaluateLand2017Sdirk2StageOutput(
  state: ArrayLike<number>,
  input: Land2017Sdirk2StageInput,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): LandSourceOutput {
  return evaluateLand2017ContinuousOutput(
    state,
    land2017Sdirk2StageContinuousInput(input),
    parameterSet,
  );
}

function assertSdirk2Stage(input: Land2017Sdirk2StageInput): void {
  if (input.stage.scheme !== "SDIRK2") {
    throw new Error("Land 2017 SDIRK2 entrypoint requires stage.scheme SDIRK2");
  }
  if (input.stage.gamma !== LAND2017_SDIRK2_GAMMA) {
    throw new Error("Land 2017 SDIRK2 entrypoint requires the fixed gamma = 1 - 1 / sqrt(2)");
  }
  if (input.stage.stageIndex !== 0 && input.stage.stageIndex !== 1) {
    throw new Error("Land 2017 SDIRK2 entrypoint requires stageIndex 0 or 1");
  }
}

function assertStage0History(history: Land2017Sdirk2Stage0History): void {
  assertLand2017StateVectorLength(history.state, "Land 2017 SDIRK2 stage0 history state");
  requireFiniteNumber(
    history.fiberEngineeringStrain,
    "Land2017Sdirk2Stage0History.fiberEngineeringStrain",
  );
  requireFiniteNumber(history.cavityVolumeM3, "Land2017Sdirk2Stage0History.cavityVolumeM3");
  requireFiniteNumber(history.freeCalciumUM, "Land2017Sdirk2Stage0History.freeCalciumUM");
}

function rejectIndependentSdirk2Input(input: Land2017Sdirk2StageInput): void {
  rejectKeys(input, "Land2017Sdirk2StageInput");
  rejectKeys(input.stage, "Land2017Sdirk2StageInput.stage");
  if ("stage0" in input) rejectKeys(input.stage0, "Land2017Sdirk2StageInput.stage0");
}

function rejectKeys(value: object, label: string): void {
  const record = value as Record<string, unknown>;
  const forbiddenKeys = [
    "fiberEngineeringStrainRatePerSec",
    "stageFiberEngineeringStrainRatePerSec",
    "coordinateRateSI",
    "stageCoordinateRateSI",
    "rhs0",
    "stage0Rhs",
    "stage0RhsVector",
    "landRhs0",
    "stage0LandRhs",
    "f0",
  ];
  for (const key of forbiddenKeys) {
    if (key in record) {
      throw new Error(`Land 2017 SDIRK2 entrypoint derives stage rates and RHS internally; remove ${label}.${key}`);
    }
  }
}
