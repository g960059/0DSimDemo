import type { ModelInstancePath } from "@/engine/myocardium/contracts";
import type { LandSourceOutput } from "@/engine/myocardium/myofilament/land2017/types";

export type HomogenizationInput = {
  readonly source: LandSourceOutput;
  readonly instance: ModelInstancePath;
  readonly wallReferenceVolumeM3: number;
};

export type HomogenizedActiveOutput = {
  readonly wallActiveNominalStressPa: number;
  readonly wallStabilizationStiffnessPa: number;
  readonly wallAlgorithmicTangentPa?: number;
  readonly homogenizationModelId: string;
  readonly activeTissueFraction: number;
  readonly orientationRuleId: string;
};

export interface MyocardiumHomogenizationAdapter<Params> {
  readonly id: string;
  evaluate(input: HomogenizationInput, params: Params): HomogenizedActiveOutput;
}
