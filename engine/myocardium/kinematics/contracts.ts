import type { ModelInstancePath } from "@/engine/myocardium/contracts";

export type GeneralizedCoordinateUnit = "m3" | "m";

export type GeneralizedCoordinateState = {
  id: string;
  valueSI: number;
  previousValueSI: number;
  rateSI: number;
  unit: GeneralizedCoordinateUnit;
};

export type MyocardialKinematicsInput = {
  coordinates: readonly GeneralizedCoordinateState[];
  instance: ModelInstancePath;
};

export type MyocardialKinematicsOutput = {
  sarcomereLengthM: number;
  fiberStretchRatio: number;
  fiberEngineeringStrain: number;
  fiberEngineeringStrainRatePerSec: number;
  coordinateIds: readonly string[];
  dStrainDCoordinate: Float64Array;
  wallReferenceVolumeM3: number;
  geometryHealth: {
    finite: boolean;
    inCalibrationDomain: boolean;
  };
};

export interface MyocardialKinematicsModel<Params> {
  readonly id: string;
  evaluate(input: MyocardialKinematicsInput, params: Params): MyocardialKinematicsOutput;
}
