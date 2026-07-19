import { PASCAL_PER_MMHG_V1 } from "@/engine/coronary/intramyocardialPressureV1";

export type YoungTsaiCoronaryStenosisGeometryV1 = Readonly<{
  healthyDiameterMm: number;
  lesionLengthMm: number;
  bloodDynamicViscosityPaSec: number;
  bloodDensityKgPerM3: number;
  /** Dimensionless post-stenotic separation/turbulence loss coefficient. */
  separationLossCoefficient: number;
}>;

export type YoungTsaiCoronaryStenosisCoefficientsV1 = Readonly<{
  diameterStenosisFraction01: number;
  residualDiameterFraction01: number;
  residualAreaFraction01: number;
  stenosisDiameterMm: number;
  stenosisAreaMm2: number;
  additionalLinearResistanceMmHgSecPerMl: number;
  additionalQuadraticResistanceMmHgSec2PerMl2: number;
  inertanceIncluded: false;
}>;

export type SignedLinearQuadraticLossEvaluationV1 = Readonly<{
  flowMlPerSec: number;
  pressureLossMmHg: number;
  dPressureLossDFlowMmHgSecPerMl: number;
  dissipatedPowerMmHgMlPerSec: number;
}>;

const METER_PER_MM = 1e-3;
const M3_PER_ML = 1e-6;
const M2_PER_MM2 = 1e-6;

/**
 * Map diameter stenosis to the steady Young-Tsai-style viscous and separation
 * loss terms. The healthy same-length Poiseuille coefficient is subtracted,
 * so both additional coefficients are exactly zero at zero stenosis.
 * Unsteady/inertial dQ/dt loss is deliberately outside the V1 model.
 */
export function mapYoungTsaiCoronaryStenosisV1(
  diameterStenosisFraction01: number,
  geometry: YoungTsaiCoronaryStenosisGeometryV1,
): YoungTsaiCoronaryStenosisCoefficientsV1 {
  validateYoungTsaiGeometryV1(geometry);
  if (
    !Number.isFinite(diameterStenosisFraction01)
    || diameterStenosisFraction01 < 0
    || diameterStenosisFraction01 >= 1
  ) {
    throw new RangeError("diameter stenosis fraction must lie in [0, 1)");
  }

  const residualDiameterFraction01 = 1 - diameterStenosisFraction01;
  const residualAreaFraction01 = residualDiameterFraction01 ** 2;
  const healthyDiameterM = geometry.healthyDiameterMm * METER_PER_MM;
  const stenosisDiameterM = healthyDiameterM * residualDiameterFraction01;
  const lesionLengthM = geometry.lesionLengthMm * METER_PER_MM;
  const healthyAreaM2 = Math.PI * healthyDiameterM ** 2 / 4;
  const stenosisAreaM2 = healthyAreaM2 * residualAreaFraction01;

  // Incremental Poiseuille loss through the lesion, in Pa*s/m^3.
  const linearSi =
    128 * geometry.bloodDynamicViscosityPaSec * lesionLengthM / Math.PI
    * (1 / stenosisDiameterM ** 4 - 1 / healthyDiameterM ** 4);
  // Irreversible contraction/separation loss, in Pa*s^2/m^6.
  const quadraticSi =
    0.5 * geometry.bloodDensityKgPerM3
    * geometry.separationLossCoefficient
    * (1 / stenosisAreaM2 - 1 / healthyAreaM2) ** 2;

  return Object.freeze({
    diameterStenosisFraction01,
    residualDiameterFraction01,
    residualAreaFraction01,
    stenosisDiameterMm: stenosisDiameterM / METER_PER_MM,
    stenosisAreaMm2: stenosisAreaM2 / M2_PER_MM2,
    additionalLinearResistanceMmHgSecPerMl:
      linearSi * M3_PER_ML / PASCAL_PER_MMHG_V1,
    additionalQuadraticResistanceMmHgSec2PerMl2:
      quadraticSi * M3_PER_ML ** 2 / PASCAL_PER_MMHG_V1,
    inertanceIncluded: false as const,
  });
}

/** Evaluate the odd signed loss dP = R Q + B |Q| Q and its exact tangent. */
export function evaluateSignedLinearQuadraticLossV1(
  flowMlPerSec: number,
  linearResistanceMmHgSecPerMl: number,
  quadraticResistanceMmHgSec2PerMl2: number,
): SignedLinearQuadraticLossEvaluationV1 {
  if (!Number.isFinite(flowMlPerSec)) {
    throw new RangeError("flow must be finite");
  }
  if (
    !Number.isFinite(linearResistanceMmHgSecPerMl)
    || linearResistanceMmHgSecPerMl < 0
    || !Number.isFinite(quadraticResistanceMmHgSec2PerMl2)
    || quadraticResistanceMmHgSec2PerMl2 < 0
  ) {
    throw new RangeError("linear and quadratic loss coefficients must be finite and non-negative");
  }
  const pressureLossMmHg =
    linearResistanceMmHgSecPerMl * flowMlPerSec
    + quadraticResistanceMmHgSec2PerMl2
      * Math.abs(flowMlPerSec) * flowMlPerSec;
  return Object.freeze({
    flowMlPerSec,
    pressureLossMmHg,
    dPressureLossDFlowMmHgSecPerMl:
      linearResistanceMmHgSecPerMl
      + 2 * quadraticResistanceMmHgSec2PerMl2 * Math.abs(flowMlPerSec),
    dissipatedPowerMmHgMlPerSec: pressureLossMmHg * flowMlPerSec,
  });
}

export function validateYoungTsaiGeometryV1(
  geometry: YoungTsaiCoronaryStenosisGeometryV1,
): void {
  for (const [name, value] of [
    ["healthyDiameterMm", geometry.healthyDiameterMm],
    ["lesionLengthMm", geometry.lesionLengthMm],
    ["bloodDynamicViscosityPaSec", geometry.bloodDynamicViscosityPaSec],
    ["bloodDensityKgPerM3", geometry.bloodDensityKgPerM3],
    ["separationLossCoefficient", geometry.separationLossCoefficient],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
}
