/**
 * One energy-derived pressure shared by all four cardiac chambers.
 *
 * The bag owns no blood volume and no hidden dynamic state.  Its scalar
 * potential depends only on the total intrapericardial blood plus wall
 * material volume.  Consequently dPsi/dV is the same external pressure for
 * LA, LV, RA, and RV, and dPsi/dt = P_peri dV_heart/dt.
 */

export const COMMON_PERICARDIUM_V1_ID = "common-pericardium-v1" as const;
export const COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1 = 1e-3;

export type CommonPericardiumParamsV1 = {
  readonly referenceHeartVolumeMl: number;
  readonly exponentialPressureScaleMmHg: number;
  readonly exponentialStiffness: number;
  readonly biasPressureMmHg: number;
};

export type CommonPericardiumOutputV1 = {
  readonly totalHeartVolumeMl: number;
  readonly dimensionlessVolumeExcess: number;
  readonly smoothedEngagement: number;
  readonly smoothingBranch: "zero" | "transition" | "linear";
  /** mmHg mL; multiplying by 1.33322e-4 converts this to joules. */
  readonly storedEnergyMmHgMl: number;
  readonly pressureMmHg: number;
  readonly pressureDerivativeMmHgPerMl: number;
};

export type IntrapericardialHeartVolumeInputV1 = {
  readonly chamberBloodVolumesMl: readonly [number, number, number, number];
  readonly wallMaterialVolumesMl: readonly number[];
};

type PositivePartOutputV1 = {
  readonly value: number;
  readonly firstDerivative: number;
  readonly secondDerivative: number;
  readonly branch: CommonPericardiumOutputV1["smoothingBranch"];
};

export function evaluateCommonPericardiumV1(
  params: CommonPericardiumParamsV1,
  totalHeartVolumeMl: number,
): CommonPericardiumOutputV1 {
  requirePositive(params.referenceHeartVolumeMl, "referenceHeartVolumeMl");
  requirePositive(
    params.exponentialPressureScaleMmHg,
    "exponentialPressureScaleMmHg",
  );
  requirePositive(params.exponentialStiffness, "exponentialStiffness");
  requireNonNegative(params.biasPressureMmHg, "biasPressureMmHg");
  requirePositive(totalHeartVolumeMl, "totalHeartVolumeMl");

  const excess =
    (totalHeartVolumeMl - params.referenceHeartVolumeMl) /
    params.referenceHeartVolumeMl;
  const engagement = smoothPositivePart(excess);
  const exponent = params.exponentialStiffness * engagement.value;
  const exponentialMinusOne = Math.expm1(exponent);
  const storedEnergyMmHgMl =
    params.biasPressureMmHg *
      (totalHeartVolumeMl - params.referenceHeartVolumeMl) +
    (params.exponentialPressureScaleMmHg *
      params.referenceHeartVolumeMl /
      params.exponentialStiffness) *
      expm1MinusX(exponent);
  const pressureMmHg =
    params.biasPressureMmHg +
    params.exponentialPressureScaleMmHg *
      exponentialMinusOne *
      engagement.firstDerivative;
  const pressureDerivativeMmHgPerMl =
    (params.exponentialPressureScaleMmHg /
      params.referenceHeartVolumeMl) *
    (params.exponentialStiffness *
      (exponentialMinusOne + 1) *
      engagement.firstDerivative *
      engagement.firstDerivative +
      exponentialMinusOne * engagement.secondDerivative);

  for (const [name, value] of Object.entries({
    storedEnergyMmHgMl,
    pressureMmHg,
    pressureDerivativeMmHgPerMl,
  })) {
    if (!Number.isFinite(value)) throw new Error(`${name} became non-finite`);
  }
  if (pressureMmHg < 0 || pressureDerivativeMmHgPerMl < 0) {
    throw new Error("common pericardium must remain nonnegative and monotone");
  }
  return Object.freeze({
    totalHeartVolumeMl,
    dimensionlessVolumeExcess: excess,
    smoothedEngagement: engagement.value,
    smoothingBranch: engagement.branch,
    storedEnergyMmHgMl,
    pressureMmHg,
    pressureDerivativeMmHgPerMl,
  });
}

export function computeIntrapericardialHeartVolumeMlV1(
  input: IntrapericardialHeartVolumeInputV1,
): number {
  if (input.chamberBloodVolumesMl.length !== 4) {
    throw new Error("exactly four chamber blood volumes are required");
  }
  if (input.wallMaterialVolumesMl.length < 1) {
    throw new Error("at least one wall material volume is required");
  }
  const values = [
    ...input.chamberBloodVolumesMl,
    ...input.wallMaterialVolumesMl,
  ];
  let total = 0;
  values.forEach((value, index) => {
    requireNonNegative(value, `intrapericardialVolume[${index}]`);
    total += value;
  });
  if (!Number.isFinite(total)) {
    throw new Error("intrapericardial heart volume became non-finite");
  }
  return total;
}

function smoothPositivePart(value: number): PositivePartOutputV1 {
  if (!Number.isFinite(value)) {
    throw new Error("dimensionless volume excess must be finite");
  }
  const delta = COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1;
  if (value <= -delta) {
    return Object.freeze({
      value: 0,
      firstDerivative: 0,
      secondDerivative: 0,
      branch: "zero" as const,
    });
  }
  if (value >= delta) {
    return Object.freeze({
      value,
      firstDerivative: 1,
      secondDerivative: 0,
      branch: "linear" as const,
    });
  }
  const t = (value + delta) / (2 * delta);
  const t2 = t * t;
  const t3 = t2 * t;
  return Object.freeze({
    value: delta * (2 * t3 - t3 * t),
    firstDerivative: 3 * t2 - 2 * t3,
    secondDerivative: (3 * t * (1 - t)) / delta,
    branch: "transition" as const,
  });
}

function expm1MinusX(value: number): number {
  if (Math.abs(value) >= 1e-4) return Math.expm1(value) - value;
  const value2 = value * value;
  return (
    value2 *
    (0.5 +
      value *
        (1 / 6 + value * (1 / 24 + value * (1 / 120 + value / 720))))
  );
}

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be positive and finite`);
  }
}

function requireNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be nonnegative and finite`);
  }
}
