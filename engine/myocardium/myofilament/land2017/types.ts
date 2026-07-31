import { requireFiniteNumber, requirePositiveFiniteSeconds } from "@/engine/myocardium/units";

export const LAND2017_MYOFILAMENT_MODEL_ID = "land2017-myofilament-v1";
export const LAND2017_EQUATIONS_VERSION = "land2017-source-equations-appendix-a-v1";

export const LAND2017_STATE_LABELS = ["CaTRPN", "B", "W", "S", "zetaW", "zetaS"] as const;
export type Land2017StateLabel = (typeof LAND2017_STATE_LABELS)[number];

export const LAND2017_STATE_SIZE = LAND2017_STATE_LABELS.length;

export const LAND2017_STATE_INDEX = Object.freeze({
  CaTRPN: 0,
  B: 1,
  W: 2,
  S: 3,
  zetaW: 4,
  zetaS: 5,
} as const satisfies Record<Land2017StateLabel, number>);

export type LandContinuousInput = {
  freeCalciumUM: number;
  fiberEngineeringStrain: number;
  fiberEngineeringStrainRatePerSec: number;
  zetaDriveFiberEngineeringStrainRatePerSec?: number;
};

export type IntegrationStageDescriptor =
  | { scheme: "BE"; stageIndex: 0 }
  | { scheme: "SDIRK2"; stageIndex: 0 | 1; gamma: number };

export type LandStepInput = {
  freeCalciumUM: number;
  previousFiberEngineeringStrain: number;
  stageFiberEngineeringStrain: number;
  stageZetaDriveFiberEngineeringStrainRatePerSec?: number;
  dtSec: number;
  stage: IntegrationStageDescriptor;
};

export type LandStepKinematics = {
  stageFiberEngineeringStrainRatePerSec: number;
  stageZetaDriveFiberEngineeringStrainRatePerSec: number;
};

export type LandSourceOutput = {
  sourceActiveFiberStressPa: number;
  sourceStressConvention: "land2017-Ta";
  stabilizationStiffnessPa: number;
  algorithmicTangentPa?: number;
  frozenStateTangentPa?: number;
  sourceActivePowerDensityWPerM3: number;
  health: {
    finite: boolean;
    stateConservationResidual: number;
    minimumPopulation: number;
    projectionUsed: boolean;
  };
};

export function deriveLand2017StepKinematics(input: LandStepInput): LandStepKinematics {
  rejectIndependentRateInput(input);
  const dtSec = requirePositiveFiniteSeconds(input.dtSec, "LandStepInput.dtSec");
  const previousFiberEngineeringStrain = requireFiniteNumber(
    input.previousFiberEngineeringStrain,
    "LandStepInput.previousFiberEngineeringStrain",
  );
  const stageFiberEngineeringStrain = requireFiniteNumber(
    input.stageFiberEngineeringStrain,
    "LandStepInput.stageFiberEngineeringStrain",
  );

  if (input.stage.scheme !== "BE") {
    throw new Error("Land 2017 SDIRK2 step input is unsupported until stage history semantics are specified");
  }
  if (input.stage.stageIndex !== 0) {
    throw new Error("Land 2017 BE step input requires stageIndex 0");
  }

  return {
    stageFiberEngineeringStrainRatePerSec:
      (stageFiberEngineeringStrain - previousFiberEngineeringStrain) / dtSec,
    stageZetaDriveFiberEngineeringStrainRatePerSec:
      "stageZetaDriveFiberEngineeringStrainRatePerSec" in input
        ? requireFiniteNumber(
          input.stageZetaDriveFiberEngineeringStrainRatePerSec,
          "LandStepInput.stageZetaDriveFiberEngineeringStrainRatePerSec",
        )
        : (stageFiberEngineeringStrain - previousFiberEngineeringStrain) / dtSec,
  };
}

export function assertLand2017StateVectorLength(state: ArrayLike<number>, label: string): void {
  if (state.length !== LAND2017_STATE_SIZE) {
    throw new Error(`${label} must contain exactly ${LAND2017_STATE_SIZE} Land 2017 states`);
  }
}

function rejectIndependentRateInput(input: LandStepInput): void {
  const record = input as Record<string, unknown>;
  const forbiddenKeys = ["fiberEngineeringStrainRatePerSec"];
  for (const key of forbiddenKeys) {
    if (key in record) {
      throw new Error(`LandStepInput must derive strain rate from strain history; remove ${key}`);
    }
  }
}
