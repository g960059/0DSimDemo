/**
 * Conservative common-bag pericardium.
 *
 * The component owns no blood volume or dynamic state. Its only generalized
 * coordinate is the total intrapericardial occupied volume. The same pressure,
 * dPsi/dVocc, is therefore work-conjugate to every chamber cavity volume.
 */

export const COMMON_PERICARDIUM_V1_ID =
  "conservative-common-bag-pericardium-v1" as const;

export const COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1 = 1e-3;

export type CommonPericardiumParametersV1 = Readonly<{
  referenceOccupiedVolumeM3: number;
  exponentialPressureScalePa: number;
  exponentialStiffness: number;
}>;

export type CommonPericardiumPositivePartV1 = Readonly<{
  value: number;
  firstDerivative: number;
  secondDerivative: number;
  branch: "zero" | "transition" | "linear";
}>;

export type CommonPericardiumEvaluationV1 = Readonly<{
  modelId: typeof COMMON_PERICARDIUM_V1_ID;
  totalOccupiedVolumeM3: number;
  dimensionlessVolumeExcess: number;
  smoothedEngagement: number;
  smoothingBranch: CommonPericardiumPositivePartV1["branch"];
  storedEnergyJ: number;
  excessPressurePa: number;
  pressureDerivativePaPerM3: number;
}>;

export type IntrapericardialHeartVolumeInputV1 = Readonly<{
  chamberBloodVolumesM3: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
  wallMaterialVolumesM3: readonly [number, number, number, number, number];
}>;

export function evaluateCommonPericardiumPositivePartV1(
  dimensionlessVolumeExcess: number,
  transitionHalfWidth = COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1,
): CommonPericardiumPositivePartV1 {
  const x = requireFinite(
    dimensionlessVolumeExcess,
    "dimensionlessVolumeExcess",
  );
  const delta = requirePositiveFinite(
    transitionHalfWidth,
    "transitionHalfWidth",
  );
  if (x <= -delta) {
    return Object.freeze({
      value: 0,
      firstDerivative: 0,
      secondDerivative: 0,
      branch: "zero" as const,
    });
  }
  if (x >= delta) {
    return Object.freeze({
      value: x,
      firstDerivative: 1,
      secondDerivative: 0,
      branch: "linear" as const,
    });
  }

  const t = (x + delta) / (2 * delta);
  const t2 = t * t;
  const t3 = t2 * t;
  const value = delta * (2 * t3 - t3 * t);
  const firstDerivative = 3 * t2 - 2 * t3;
  const secondDerivative = 3 * t * (1 - t) / delta;
  for (const [label, candidate] of Object.entries({
    value,
    firstDerivative,
    secondDerivative,
  })) requireFinite(candidate, label);
  if (value < 0 || firstDerivative < 0 || secondDerivative < 0) {
    throw new Error(
      "pericardial positive-part transition must remain monotone and convex",
    );
  }
  return Object.freeze({
    value,
    firstDerivative,
    secondDerivative,
    branch: "transition" as const,
  });
}

export function evaluateCommonPericardiumV1(
  parameters: CommonPericardiumParametersV1,
  totalOccupiedVolumeM3: number,
): CommonPericardiumEvaluationV1 {
  const volume = requirePositiveFinite(
    totalOccupiedVolumeM3,
    "totalOccupiedVolumeM3",
  );
  const referenceVolume = requirePositiveFinite(
    parameters.referenceOccupiedVolumeM3,
    "referenceOccupiedVolumeM3",
  );
  const pressureScale = requirePositiveFinite(
    parameters.exponentialPressureScalePa,
    "exponentialPressureScalePa",
  );
  const stiffness = requirePositiveFinite(
    parameters.exponentialStiffness,
    "exponentialStiffness",
  );
  const dimensionlessVolumeExcess = (volume - referenceVolume) / referenceVolume;
  const engagement = evaluateCommonPericardiumPositivePartV1(
    dimensionlessVolumeExcess,
  );
  const exponent = stiffness * engagement.value;
  const exponentialMinusOne = Math.expm1(exponent);
  const storedEnergyJ = pressureScale * referenceVolume / stiffness
    * expm1MinusX(exponent);
  const excessPressurePa = pressureScale * exponentialMinusOne
    * engagement.firstDerivative;
  const pressureDerivativePaPerM3 = pressureScale / referenceVolume * (
    stiffness * (exponentialMinusOne + 1)
      * engagement.firstDerivative * engagement.firstDerivative
    + exponentialMinusOne * engagement.secondDerivative
  );

  for (const [label, candidate] of Object.entries({
    storedEnergyJ,
    excessPressurePa,
    pressureDerivativePaPerM3,
  })) requireFinite(candidate, label);
  if (excessPressurePa < 0 || pressureDerivativePaPerM3 < 0) {
    throw new Error("common pericardium must remain nonnegative and monotone");
  }
  return Object.freeze({
    modelId: COMMON_PERICARDIUM_V1_ID,
    totalOccupiedVolumeM3: volume,
    dimensionlessVolumeExcess,
    smoothedEngagement: engagement.value,
    smoothingBranch: engagement.branch,
    storedEnergyJ,
    excessPressurePa,
    pressureDerivativePaPerM3,
  });
}

export function computeIntrapericardialHeartVolumeM3V1(
  input: IntrapericardialHeartVolumeInputV1,
): number {
  if (input.wallMaterialVolumesM3.length !== 5) {
    throw new Error("wallMaterialVolumesM3 must contain exactly five walls");
  }
  const volumes = [
    input.chamberBloodVolumesM3.LA,
    input.chamberBloodVolumesM3.LV,
    input.chamberBloodVolumesM3.RA,
    input.chamberBloodVolumesM3.RV,
    ...input.wallMaterialVolumesM3,
  ];
  return volumes.reduce(
    (total, value, index) => total
      + requireNonNegativeFinite(value, `intrapericardialVolume[${index}]`),
    0,
  );
}

function expm1MinusX(value: number): number {
  if (Math.abs(value) >= 1e-4) return Math.expm1(value) - value;
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
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}
