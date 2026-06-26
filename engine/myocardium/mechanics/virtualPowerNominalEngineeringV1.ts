import type {
  GeneralizedForceInput,
  GeneralizedForceMapper,
  GeneralizedForceOutput,
  PassiveMaterialOutput,
} from "@/engine/myocardium/mechanics/contracts";

export const VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID = "virtual-power-nominal-engineering-v1";
export const ZERO_PASSIVE_MATERIAL_FIXTURE_ID = "zero-passive-viscous-phase3b-fixture-v1";

export const ZERO_PASSIVE_MATERIAL_PHASE3B_FIXTURE: PassiveMaterialOutput = Object.freeze({
  passiveNominalStressPa: 0,
  viscousNominalStressPa: 0,
  dPassiveStressDStrainPa: 0,
  storedEnergyDensityJPerM3: 0,
  dissipationDensityWPerM3: 0,
});

export const VirtualPowerNominalEngineeringV1: GeneralizedForceMapper = Object.freeze({
  id: VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
  evaluate: evaluateVirtualPowerNominalEngineeringV1,
});

export function evaluateVirtualPowerNominalEngineeringV1(
  input: GeneralizedForceInput,
): GeneralizedForceOutput {
  assertValidSingleCoordinateForceInput(input);
  const coordinateId = input.kinematics.coordinateIds[0];
  const dStrainDCoordinate = input.kinematics.dStrainDCoordinate[0];
  const wallReferenceVolumeM3 = input.kinematics.wallReferenceVolumeM3;
  const activeStressPa = input.active.wallActiveNominalStressPa;
  const passiveStressPa = input.passive.passiveNominalStressPa;
  const viscousStressPa = input.passive.viscousNominalStressPa;
  const totalStressPa = activeStressPa + passiveStressPa + viscousStressPa;
  const activeContributionSI = wallReferenceVolumeM3 * activeStressPa * dStrainDCoordinate;
  const passiveContributionSI = wallReferenceVolumeM3 * passiveStressPa * dStrainDCoordinate;
  const viscousContributionSI = wallReferenceVolumeM3 * viscousStressPa * dStrainDCoordinate;
  const conjugateForceSI = activeContributionSI + passiveContributionSI + viscousContributionSI;
  const coordinateRateSI = input.kinematics.fiberEngineeringStrainRatePerSec / dStrainDCoordinate;
  const virtualPowerResidualW =
    conjugateForceSI * coordinateRateSI
    - wallReferenceVolumeM3 * totalStressPa * input.kinematics.fiberEngineeringStrainRatePerSec;

  return {
    coordinateIds: [coordinateId],
    conjugateForcesSI: Float64Array.of(conjugateForceSI),
    activeContributionsSI: Float64Array.of(activeContributionSI),
    passiveContributionsSI: Float64Array.of(passiveContributionSI),
    viscousContributionsSI: Float64Array.of(viscousContributionSI),
    virtualPowerResidualW,
    volumeCoordinatePressurePa: {
      [coordinateId]: conjugateForceSI,
    },
  };
}

export function assertValidSingleCoordinateForceInput(input: GeneralizedForceInput): void {
  if (input.kinematics.coordinateIds.length !== 1 || input.kinematics.dStrainDCoordinate.length !== 1) {
    throw new Error("virtual-power-nominal-engineering-v1 requires exactly one generalized coordinate");
  }
  const coordinateId = input.kinematics.coordinateIds[0];
  if (coordinateId !== "cavity-volume") {
    throw new Error("virtual-power-nominal-engineering-v1 Phase 3B requires coordinate id cavity-volume");
  }
  if (!input.kinematics.geometryHealth.finite || !input.kinematics.geometryHealth.inCalibrationDomain) {
    throw new Error("virtual-power-nominal-engineering-v1 requires finite in-domain kinematics");
  }
  requirePositiveFinite(input.kinematics.wallReferenceVolumeM3, "kinematics.wallReferenceVolumeM3");
  const dStrainDCoordinate = input.kinematics.dStrainDCoordinate[0];
  requireFinite(dStrainDCoordinate, "kinematics.dStrainDCoordinate[0]");
  if (dStrainDCoordinate === 0) {
    throw new Error("virtual-power-nominal-engineering-v1 requires nonzero dStrainDCoordinate");
  }
  requireFinite(input.kinematics.fiberEngineeringStrainRatePerSec, "kinematics.fiberEngineeringStrainRatePerSec");
  requireFinite(input.active.wallActiveNominalStressPa, "active.wallActiveNominalStressPa");
  requireFinite(input.active.wallStabilizationStiffnessPa, "active.wallStabilizationStiffnessPa");
  requireFinite(input.passive.passiveNominalStressPa, "passive.passiveNominalStressPa");
  requireFinite(input.passive.viscousNominalStressPa, "passive.viscousNominalStressPa");
  requireFinite(input.passive.dPassiveStressDStrainPa, "passive.dPassiveStressDStrainPa");
  requireFinite(input.passive.storedEnergyDensityJPerM3, "passive.storedEnergyDensityJPerM3");
  requireFinite(input.passive.dissipationDensityWPerM3, "passive.dissipationDensityWPerM3");
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
