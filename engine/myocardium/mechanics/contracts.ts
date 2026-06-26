import type { HomogenizedActiveOutput } from "@/engine/myocardium/homogenization/contracts";
import type { MyocardialKinematicsOutput } from "@/engine/myocardium/kinematics/contracts";

export type PassiveMaterialOutput = {
  readonly passiveNominalStressPa: number;
  readonly viscousNominalStressPa: number;
  readonly dPassiveStressDStrainPa: number;
  readonly storedEnergyDensityJPerM3: number;
  readonly dissipationDensityWPerM3: number;
};

export type GeneralizedForceInput = {
  readonly kinematics: MyocardialKinematicsOutput;
  readonly active: HomogenizedActiveOutput;
  readonly passive: PassiveMaterialOutput;
};

export type GeneralizedForceOutput = {
  readonly coordinateIds: readonly string[];
  readonly conjugateForcesSI: Float64Array;
  readonly activeContributionsSI: Float64Array;
  readonly passiveContributionsSI: Float64Array;
  readonly viscousContributionsSI: Float64Array;
  readonly virtualPowerResidualW: number;
  readonly volumeCoordinatePressurePa?: Readonly<Record<string, number>>;
};

export interface GeneralizedForceMapper {
  readonly id: "virtual-power-nominal-engineering-v1" | string;
  evaluate(input: GeneralizedForceInput): GeneralizedForceOutput;
}
