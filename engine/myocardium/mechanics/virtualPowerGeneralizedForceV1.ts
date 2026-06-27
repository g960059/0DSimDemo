import type { GeneralizedCoordinateUnit } from "@/engine/myocardium/kinematics/contracts";
import type {
  GeneralizedForceInput,
  GeneralizedForceMapper,
  GeneralizedForceOutput,
} from "@/engine/myocardium/mechanics/contracts";

export const VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID =
  "virtual-power-generalized-force-v1";

export type VirtualPowerGeneralizedForceV1Input = GeneralizedForceInput & {
  readonly coordinateRatesSI?: readonly number[] | Float64Array;
  readonly coordinateUnitsById?: Readonly<Record<string, GeneralizedCoordinateUnit>>;
};

export const VirtualPowerGeneralizedForceV1: GeneralizedForceMapper = Object.freeze({
  id: VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
  evaluate: evaluateVirtualPowerGeneralizedForceV1,
});

export function evaluateVirtualPowerGeneralizedForceV1(
  input: VirtualPowerGeneralizedForceV1Input,
): GeneralizedForceOutput {
  assertValidGeneralizedForceInput(input);

  const coordinateIds = [...input.kinematics.coordinateIds];
  const derivative = input.kinematics.dStrainDCoordinate;
  const wallReferenceVolumeM3 = input.kinematics.wallReferenceVolumeM3;
  const activeStressPa = input.active.wallActiveNominalStressPa;
  const passiveStressPa = input.passive.passiveNominalStressPa;
  const viscousStressPa = input.passive.viscousNominalStressPa;
  const totalStressPa = activeStressPa + passiveStressPa + viscousStressPa;

  const activeContributionsSI = new Float64Array(coordinateIds.length);
  const passiveContributionsSI = new Float64Array(coordinateIds.length);
  const viscousContributionsSI = new Float64Array(coordinateIds.length);
  const conjugateForcesSI = new Float64Array(coordinateIds.length);

  for (let index = 0; index < coordinateIds.length; index += 1) {
    const dStrainDCoordinate = derivative[index];
    if (dStrainDCoordinate === 0) {
      activeContributionsSI[index] = 0;
      passiveContributionsSI[index] = 0;
      viscousContributionsSI[index] = 0;
      conjugateForcesSI[index] = 0;
      continue;
    }
    activeContributionsSI[index] = wallReferenceVolumeM3 * activeStressPa * dStrainDCoordinate;
    passiveContributionsSI[index] = wallReferenceVolumeM3 * passiveStressPa * dStrainDCoordinate;
    viscousContributionsSI[index] = wallReferenceVolumeM3 * viscousStressPa * dStrainDCoordinate;
    conjugateForcesSI[index] =
      activeContributionsSI[index]
      + passiveContributionsSI[index]
      + viscousContributionsSI[index];
  }

  const virtualPowerResidualW =
    generalizedPowerW(input, conjugateForcesSI)
    - wallReferenceVolumeM3
      * totalStressPa
      * input.kinematics.fiberEngineeringStrainRatePerSec;

  const volumeCoordinatePressurePa = pressureMap(input, coordinateIds, conjugateForcesSI);

  return {
    coordinateIds,
    conjugateForcesSI,
    activeContributionsSI,
    passiveContributionsSI,
    viscousContributionsSI,
    virtualPowerResidualW,
    ...(Object.keys(volumeCoordinatePressurePa).length === 0
      ? {}
      : { volumeCoordinatePressurePa }),
  };
}

export function assertValidGeneralizedForceInput(
  input: VirtualPowerGeneralizedForceV1Input,
): void {
  const coordinateIds = input.kinematics.coordinateIds;
  const derivatives = input.kinematics.dStrainDCoordinate;
  if (coordinateIds.length === 0) {
    throw new Error("virtual-power-generalized-force-v1 requires at least one generalized coordinate");
  }
  if (coordinateIds.length !== derivatives.length) {
    throw new Error("virtual-power-generalized-force-v1 coordinateIds and dStrainDCoordinate lengths must match");
  }
  const seen = new Set<string>();
  for (let index = 0; index < coordinateIds.length; index += 1) {
    const coordinateId = coordinateIds[index];
    if (coordinateId.length === 0) {
      throw new Error(`virtual-power-generalized-force-v1 coordinateIds[${index}] must be nonempty`);
    }
    if (seen.has(coordinateId)) {
      throw new Error(`virtual-power-generalized-force-v1 duplicate coordinate id ${coordinateId}`);
    }
    seen.add(coordinateId);
    requireFinite(derivatives[index], `kinematics.dStrainDCoordinate[${index}]`);
  }
  if (
    !input.kinematics.geometryHealth.finite
    || !input.kinematics.geometryHealth.inCalibrationDomain
  ) {
    throw new Error("virtual-power-generalized-force-v1 requires finite in-domain kinematics");
  }
  requirePositiveFinite(input.kinematics.wallReferenceVolumeM3, "kinematics.wallReferenceVolumeM3");
  requireFinite(input.kinematics.fiberEngineeringStrainRatePerSec, "kinematics.fiberEngineeringStrainRatePerSec");
  requireFinite(input.active.wallActiveNominalStressPa, "active.wallActiveNominalStressPa");
  requireFinite(input.active.wallStabilizationStiffnessPa, "active.wallStabilizationStiffnessPa");
  requireFinite(input.passive.passiveNominalStressPa, "passive.passiveNominalStressPa");
  requireFinite(input.passive.viscousNominalStressPa, "passive.viscousNominalStressPa");
  requireFinite(input.passive.dPassiveStressDStrainPa, "passive.dPassiveStressDStrainPa");
  requireFinite(input.passive.storedEnergyDensityJPerM3, "passive.storedEnergyDensityJPerM3");
  requireFinite(input.passive.dissipationDensityWPerM3, "passive.dissipationDensityWPerM3");

  if (input.coordinateRatesSI !== undefined) {
    if (input.coordinateRatesSI.length !== coordinateIds.length) {
      throw new Error("virtual-power-generalized-force-v1 coordinateRatesSI length must match coordinateIds");
    }
    for (let index = 0; index < input.coordinateRatesSI.length; index += 1) {
      requireFinite(input.coordinateRatesSI[index], `coordinateRatesSI[${index}]`);
    }
  } else {
    const nonzeroDerivativeCount = Array.from(derivatives).filter((value) => value !== 0).length;
    if (nonzeroDerivativeCount !== 1) {
      throw new Error(
        "virtual-power-generalized-force-v1 requires coordinateRatesSI unless exactly one derivative coordinate is nonzero",
      );
    }
  }

  if (coordinateIds.length > 1 && input.coordinateUnitsById === undefined) {
    throw new Error("virtual-power-generalized-force-v1 requires coordinateUnitsById for multi-coordinate pressure mapping");
  }
  if (input.coordinateUnitsById !== undefined) {
    for (const coordinateId of coordinateIds) {
      const unit = input.coordinateUnitsById[coordinateId];
      if (unit !== "m3" && unit !== "m") {
        throw new Error(`virtual-power-generalized-force-v1 requires unit m3 or m for coordinate ${coordinateId}`);
      }
    }
  }
}

function generalizedPowerW(
  input: VirtualPowerGeneralizedForceV1Input,
  conjugateForcesSI: Float64Array,
): number {
  if (input.coordinateRatesSI !== undefined) {
    let powerW = 0;
    for (let index = 0; index < conjugateForcesSI.length; index += 1) {
      powerW += conjugateForcesSI[index] * input.coordinateRatesSI[index];
    }
    return powerW;
  }

  const derivatives = input.kinematics.dStrainDCoordinate;
  const nonzeroDerivativeIndex = Array.from(derivatives).findIndex((value) => value !== 0);
  const coordinateRateSI =
    input.kinematics.fiberEngineeringStrainRatePerSec
    / derivatives[nonzeroDerivativeIndex];
  return conjugateForcesSI[nonzeroDerivativeIndex] * coordinateRateSI;
}

function pressureMap(
  input: VirtualPowerGeneralizedForceV1Input,
  coordinateIds: readonly string[],
  conjugateForcesSI: Float64Array,
): Readonly<Record<string, number>> {
  const map: Record<string, number> = {};
  for (let index = 0; index < coordinateIds.length; index += 1) {
    const coordinateId = coordinateIds[index];
    const unit = input.coordinateUnitsById?.[coordinateId] ?? (
      coordinateIds.length === 1 && coordinateId === "cavity-volume" ? "m3" : undefined
    );
    if (unit === "m3") {
      map[coordinateId] = conjugateForcesSI[index];
    }
  }
  return map;
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
}

function requirePositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}
