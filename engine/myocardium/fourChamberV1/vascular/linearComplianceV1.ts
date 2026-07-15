export type LinearVascularComplianceParametersV1 = {
  readonly unstressedVolumeM3: number;
  readonly complianceM3PerPa: number;
  readonly externalPressurePa: number;
};

export type LinearVascularComplianceOutputV1 = {
  readonly volumeM3: number;
  readonly elasticVolumeM3: number;
  readonly elasticPressurePa: number;
  readonly absolutePressurePa: number;
  readonly elasticEnergyJ: number;
  readonly pressureDerivativePaPerM3: number;
};

/**
 * Energy-owning SA/SV/PA/PV compliance from Section 11 of the v1 specification.
 * External pressure is reported separately from the stored elastic energy.
 */
export function evaluateLinearVascularComplianceV1(
  parameters: LinearVascularComplianceParametersV1,
  volumeM3: number,
): LinearVascularComplianceOutputV1 {
  assertExactKeys(
    parameters,
    ["unstressedVolumeM3", "complianceM3PerPa", "externalPressurePa"],
    "parameters",
  );
  const volume = requireNonNegativeFinite(volumeM3, "volumeM3");
  const unstressedVolume = requireNonNegativeFinite(
    parameters.unstressedVolumeM3,
    "unstressedVolumeM3",
  );
  const compliance = requirePositiveFinite(parameters.complianceM3PerPa, "complianceM3PerPa");
  const externalPressure = requireFinite(parameters.externalPressurePa, "externalPressurePa");
  const elasticVolumeM3 = volume - unstressedVolume;
  const elasticPressurePa = elasticVolumeM3 / compliance;
  const absolutePressurePa = externalPressure + elasticPressurePa;
  const elasticEnergyJ = elasticVolumeM3 * elasticVolumeM3 / (2 * compliance);
  const pressureDerivativePaPerM3 = 1 / compliance;

  requireDerivedFinite(elasticPressurePa, "elasticPressurePa");
  requireDerivedFinite(absolutePressurePa, "absolutePressurePa");
  requireDerivedFinite(elasticEnergyJ, "elasticEnergyJ");
  requireDerivedFinite(pressureDerivativePaPerM3, "pressureDerivativePaPerM3");

  return Object.freeze({
    volumeM3: volume,
    elasticVolumeM3,
    elasticPressurePa,
    absolutePressurePa,
    elasticEnergyJ,
    pressureDerivativePaPerM3,
  });
}

export type PeripheralResistanceOutputV1 = {
  readonly pressureDropPa: number;
  readonly dissipationW: number;
};

export function evaluatePeripheralResistanceV1(
  resistancePaSecPerM3: number,
  flowM3PerSec: number,
): PeripheralResistanceOutputV1 {
  const resistance = requireNonNegativeFinite(resistancePaSecPerM3, "resistancePaSecPerM3");
  const flow = requireFinite(flowM3PerSec, "flowM3PerSec");
  const pressureDropPa = resistance * flow;
  const dissipationW = resistance * flow * flow;
  requireDerivedFinite(pressureDropPa, "pressureDropPa");
  requireDerivedFinite(dissipationW, "dissipationW");
  return Object.freeze({ pressureDropPa, dissipationW });
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be non-negative and finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be positive and finite`);
  return value;
}

function requireDerivedFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} became non-finite`);
}

function assertExactKeys(value: object, expected: readonly string[], field: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${field} must be a plain object`);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) throw new Error(`${field} must not contain symbol keys`);
  const names = keys as string[];
  const expectedSet = new Set(expected);
  const unknown = names.filter((key) => !expectedSet.has(key));
  const missing = expected.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0) throw new Error(`${field} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`${field} is missing fields: ${missing.join(", ")}`);
  for (const key of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
      throw new Error(`${field}.${key} must be an enumerable data property`);
    }
  }
}
