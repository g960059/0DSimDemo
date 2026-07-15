export const PERICARDIAL_TRANSITION_HALF_WIDTH_V1 = 1e-3;
export const PERICARDIAL_WIDTH_SENSITIVITY_POLICY_V1 = Object.freeze({
  policyId: "common-pericardium-width-sensitivity-v1",
  allowedFactors: Object.freeze([0.5, 1, 2] as const),
  diagnosticOnly: true,
  fitAllowed: false,
} as const);
export type PericardialWidthSensitivityFactorV1 =
  (typeof PERICARDIAL_WIDTH_SENSITIVITY_POLICY_V1.allowedFactors)[number];

export type PericardialPositivePartOutputV1 = {
  readonly value: number;
  readonly firstDerivative: number;
  readonly secondDerivative: number;
  readonly branch: "zero" | "transition" | "linear";
};

/** Dimensionless C2 positive-part regularization from Section 13. */
export function evaluatePericardialPositivePartV1(
  dimensionlessVolumeExcess: number,
): PericardialPositivePartOutputV1 {
  return evaluatePericardialPositivePartWithWidthV1(
    dimensionlessVolumeExcess,
    PERICARDIAL_TRANSITION_HALF_WIDTH_V1,
  );
}

export function evaluatePericardialPositivePartWidthSensitivityV1(
  dimensionlessVolumeExcess: number,
  factor: PericardialWidthSensitivityFactorV1,
): PericardialPositivePartOutputV1 {
  return evaluatePericardialPositivePartWithWidthV1(
    dimensionlessVolumeExcess,
    diagnosticPericardialWidth(factor),
  );
}

function evaluatePericardialPositivePartWithWidthV1(
  dimensionlessVolumeExcess: number,
  transitionHalfWidth: number,
): PericardialPositivePartOutputV1 {
  const x = requireFinite(dimensionlessVolumeExcess, "dimensionlessVolumeExcess");
  const delta = requirePositiveFinite(transitionHalfWidth, "transitionHalfWidth");
  if (x <= -delta) {
    return Object.freeze({ value: 0, firstDerivative: 0, secondDerivative: 0, branch: "zero" });
  }
  if (x >= delta) {
    return Object.freeze({ value: x, firstDerivative: 1, secondDerivative: 0, branch: "linear" });
  }
  const t = (x + delta) / (2 * delta);
  const t2 = t * t;
  const t3 = t2 * t;
  const value = delta * (2 * t3 - t3 * t);
  const firstDerivative = 3 * t2 - 2 * t3;
  const secondDerivative = 3 * t * (1 - t) / delta;
  requireDerivedFinite(value, "smoothed positive-part value");
  requireDerivedFinite(firstDerivative, "smoothed positive-part first derivative");
  requireDerivedFinite(secondDerivative, "smoothed positive-part second derivative");
  if (value < 0 || firstDerivative < 0 || secondDerivative < 0) {
    throw new Error("Pericardial positive-part transition lost nonnegative monotone convex structure");
  }
  return Object.freeze({ value, firstDerivative, secondDerivative, branch: "transition" });
}

export type CommonPericardiumParametersV1 = {
  readonly referenceHeartVolumeM3: number;
  readonly exponentialPressureScalePa: number;
  readonly exponentialStiffness: number;
  readonly effusionPressurePa: number;
};

export type CommonPericardiumOutputV1 = {
  readonly totalHeartVolumeM3: number;
  readonly dimensionlessVolumeExcess: number;
  readonly smoothedEngagement: number;
  readonly smoothingBranch: PericardialPositivePartOutputV1["branch"];
  readonly storedEnergyJ: number;
  readonly excessPressurePa: number;
  readonly pressureDerivativePaPerM3: number;
};

export type FourChamberTransmuralPressuresV1 = {
  readonly LA: number;
  readonly LV: number;
  readonly RA: number;
  readonly RV: number;
};

export type FourChamberCavityPressuresV1 = FourChamberTransmuralPressuresV1 & {
  readonly commonIntrathoracicPressurePa: number;
  readonly commonPericardialPressurePa: number;
};

export function evaluateCommonPericardiumV1(
  parameters: CommonPericardiumParametersV1,
  totalHeartVolumeM3: number,
): CommonPericardiumOutputV1 {
  return evaluateCommonPericardiumWithWidthV1(
    parameters,
    totalHeartVolumeM3,
    PERICARDIAL_TRANSITION_HALF_WIDTH_V1,
  );
}

export function evaluateCommonPericardiumWidthSensitivityV1(
  parameters: CommonPericardiumParametersV1,
  totalHeartVolumeM3: number,
  factor: PericardialWidthSensitivityFactorV1,
): CommonPericardiumOutputV1 {
  return evaluateCommonPericardiumWithWidthV1(
    parameters,
    totalHeartVolumeM3,
    diagnosticPericardialWidth(factor),
  );
}

function evaluateCommonPericardiumWithWidthV1(
  parameters: CommonPericardiumParametersV1,
  totalHeartVolumeM3: number,
  transitionHalfWidth: number,
): CommonPericardiumOutputV1 {
  assertExactKeys(parameters, [
    "referenceHeartVolumeM3",
    "exponentialPressureScalePa",
    "exponentialStiffness",
    "effusionPressurePa",
  ], "parameters");
  const volume = requirePositiveFinite(totalHeartVolumeM3, "totalHeartVolumeM3");
  const referenceVolume = requirePositiveFinite(
    parameters.referenceHeartVolumeM3,
    "referenceHeartVolumeM3",
  );
  const pressureScale = requirePositiveFinite(
    parameters.exponentialPressureScalePa,
    "exponentialPressureScalePa",
  );
  const stiffness = requirePositiveFinite(parameters.exponentialStiffness, "exponentialStiffness");
  const effusionPressure = requireNonNegativeFinite(parameters.effusionPressurePa, "effusionPressurePa");
  const dimensionlessVolumeExcess = (volume - referenceVolume) / referenceVolume;
  const engagement = evaluatePericardialPositivePartWithWidthV1(
    dimensionlessVolumeExcess,
    transitionHalfWidth,
  );
  const exponent = stiffness * engagement.value;
  const exponentialMinusOne = Math.expm1(exponent);
  requireDerivedFinite(exponentialMinusOne, "pericardial exponential response");
  const elasticEnergyFactor = expm1MinusX(exponent);
  const storedEnergyJ = effusionPressure * (volume - referenceVolume)
    + pressureScale * referenceVolume / stiffness * elasticEnergyFactor;
  const excessPressurePa = effusionPressure
    + pressureScale * exponentialMinusOne * engagement.firstDerivative;
  const pressureDerivativePaPerM3 = pressureScale / referenceVolume * (
    stiffness * (exponentialMinusOne + 1) * engagement.firstDerivative * engagement.firstDerivative
    + exponentialMinusOne * engagement.secondDerivative
  );

  requireDerivedFinite(storedEnergyJ, "pericardial storedEnergyJ");
  requireDerivedFinite(excessPressurePa, "pericardial excessPressurePa");
  requireDerivedFinite(pressureDerivativePaPerM3, "pericardial pressureDerivativePaPerM3");
  if (excessPressurePa < 0 || pressureDerivativePaPerM3 < 0) {
    throw new Error("Common pericardium must remain nonnegative and monotone");
  }

  return Object.freeze({
    totalHeartVolumeM3: volume,
    dimensionlessVolumeExcess,
    smoothedEngagement: engagement.value,
    smoothingBranch: engagement.branch,
    storedEnergyJ,
    excessPressurePa,
    pressureDerivativePaPerM3,
  });
}

function diagnosticPericardialWidth(factor: PericardialWidthSensitivityFactorV1): number {
  if (!PERICARDIAL_WIDTH_SENSITIVITY_POLICY_V1.allowedFactors.includes(factor)) {
    throw new Error("Pericardial width sensitivity factor must be one of 0.5, 1, or 2");
  }
  return PERICARDIAL_TRANSITION_HALF_WIDTH_V1 * factor;
}

/**
 * Adds the same external pressure to all four chambers without accepting or
 * returning a blood-volume-like quantity.
 */
export function composeFourChamberCavityPressuresV1(
  transmuralPressuresPa: FourChamberTransmuralPressuresV1,
  intrathoracicPressurePa: number,
  commonPericardialPressurePa: number,
): FourChamberCavityPressuresV1 {
  assertExactKeys(transmuralPressuresPa, ["LA", "LV", "RA", "RV"], "transmuralPressuresPa");
  const intrathoracic = requireFinite(intrathoracicPressurePa, "intrathoracicPressurePa");
  const pericardial = requireNonNegativeFinite(
    commonPericardialPressurePa,
    "commonPericardialPressurePa",
  );
  const commonExternalPressurePa = intrathoracic + pericardial;
  requireDerivedFinite(commonExternalPressurePa, "commonExternalPressurePa");
  const result = {
    LA: requireFinite(transmuralPressuresPa.LA, "transmuralPressuresPa.LA") + commonExternalPressurePa,
    LV: requireFinite(transmuralPressuresPa.LV, "transmuralPressuresPa.LV") + commonExternalPressurePa,
    RA: requireFinite(transmuralPressuresPa.RA, "transmuralPressuresPa.RA") + commonExternalPressurePa,
    RV: requireFinite(transmuralPressuresPa.RV, "transmuralPressuresPa.RV") + commonExternalPressurePa,
    commonIntrathoracicPressurePa: intrathoracic,
    commonPericardialPressurePa: pericardial,
  };
  for (const [field, value] of Object.entries(result)) requireDerivedFinite(value, field);
  return Object.freeze(result);
}

export type IntrapericardialHeartVolumeInputV1 = {
  readonly leftAtrialBloodVolumeM3: number;
  readonly leftVentricularBloodVolumeM3: number;
  readonly rightAtrialBloodVolumeM3: number;
  readonly rightVentricularBloodVolumeM3: number;
  readonly wallMaterialVolumesM3: readonly [number, number, number, number, number];
};

export function computeIntrapericardialHeartVolumeM3V1(
  input: IntrapericardialHeartVolumeInputV1,
): number {
  assertExactKeys(input, [
    "leftAtrialBloodVolumeM3",
    "leftVentricularBloodVolumeM3",
    "rightAtrialBloodVolumeM3",
    "rightVentricularBloodVolumeM3",
    "wallMaterialVolumesM3",
  ], "input");
  if (
    !Array.isArray(input.wallMaterialVolumesM3)
    || Object.getPrototypeOf(input.wallMaterialVolumesM3) !== Array.prototype
    || input.wallMaterialVolumesM3.length !== 5
  ) {
    throw new Error("wallMaterialVolumesM3 must be a plain dense five-wall array");
  }
  for (const key of Reflect.ownKeys(input.wallMaterialVolumesM3)) {
    if (typeof key !== "string") {
      throw new Error("wallMaterialVolumesM3 must not contain symbol keys");
    }
    if (key === "length") continue;
    if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= 5) {
      throw new Error(`wallMaterialVolumesM3 contains an extra field: ${key}`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(input.wallMaterialVolumesM3, key);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
      throw new Error(`wallMaterialVolumesM3[${key}] must be an enumerable data property`);
    }
  }
  for (let index = 0; index < 5; index += 1) {
    if (!Object.hasOwn(input.wallMaterialVolumesM3, index)) {
      throw new Error("wallMaterialVolumesM3 must be a plain dense five-wall array");
    }
  }
  const volumes = [
    input.leftAtrialBloodVolumeM3,
    input.leftVentricularBloodVolumeM3,
    input.rightAtrialBloodVolumeM3,
    input.rightVentricularBloodVolumeM3,
    ...input.wallMaterialVolumesM3,
  ];
  let total = 0;
  volumes.forEach((volume, index) => {
    total += requireNonNegativeFinite(volume, `intrapericardialVolume[${index}]`);
    requireDerivedFinite(total, "intrapericardial heart volume sum");
  });
  return total;
}

function expm1MinusX(value: number): number {
  const magnitude = Math.abs(value);
  if (magnitude >= 1e-4) return Math.expm1(value) - value;
  const value2 = value * value;
  return value2 * (
    0.5 + value * (
      1 / 6 + value * (
        1 / 24 + value * (
          1 / 120 + value / 720
        )
      )
    )
  );
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
