export type CollapsibleIntramyocardialPvPriorV1 = Readonly<{
  referenceVolumeMl: number;
  pressureScaleMmHg: number;
  expansionExponent: number;
  collapseExponent: number;
}>;

export type CollapsibleIntramyocardialPvEvaluationV1 = Readonly<{
  volumeMl: number;
  normalizedVolume: number;
  transmuralPressureMmHg: number;
  complianceMlPerMmHg: number;
  dTransmuralPressureDVolumeMmHgPerMl: number;
}>;

export type VolumeDependentCoronaryResistancePriorV1 = Readonly<{
  referenceResistanceMmHgSecPerMl: number;
  referenceVolumeMl: number;
  /** Patent hydraulic area at complete collapse, relative to reference area. */
  residualHydraulicAreaFraction: number;
}>;

export type VolumeDependentCoronaryResistanceEvaluationV1 = Readonly<{
  resistanceMmHgSecPerMl: number;
  resistanceScale: number;
  dResistanceDVolumeMmHgSecPerMl2: number;
  maximumResistanceScale: number;
}>;

/**
 * Smooth collapsible-tube law on the physical domain V > 0:
 *
 *   P_tm = P0 [(V/V0)^m - (V/V0)^(-n)].
 *
 * It has zero pressure at V0, positive compliance everywhere, progressive
 * collapse at negative pressure, and strain stiffening at positive pressure.
 */
export function evaluateCollapsibleIntramyocardialPvV1(
  volumeMl: number,
  prior: CollapsibleIntramyocardialPvPriorV1,
): CollapsibleIntramyocardialPvEvaluationV1 {
  validateCollapsibleIntramyocardialPvPriorV1(prior);
  if (!Number.isFinite(volumeMl) || volumeMl <= 0) {
    throw new RangeError("intramyocardial vascular volume must be positive and finite");
  }
  const normalizedVolume = volumeMl / prior.referenceVolumeMl;
  const expanded = normalizedVolume ** prior.expansionExponent;
  const collapsed = normalizedVolume ** (-prior.collapseExponent);
  const transmuralPressureMmHg =
    prior.pressureScaleMmHg * (expanded - collapsed);
  const dTransmuralPressureDVolumeMmHgPerMl =
    prior.pressureScaleMmHg / prior.referenceVolumeMl
    * (
      prior.expansionExponent
        * normalizedVolume ** (prior.expansionExponent - 1)
      + prior.collapseExponent
        * normalizedVolume ** (-prior.collapseExponent - 1)
    );
  return Object.freeze({
    volumeMl,
    normalizedVolume,
    transmuralPressureMmHg,
    complianceMlPerMmHg: 1 / dTransmuralPressureDVolumeMmHgPerMl,
    dTransmuralPressureDVolumeMmHgPerMl,
  });
}

/**
 * Smooth, bounded collapse-only Poiseuille-inspired R(V) law.
 *
 * Slow tone owns vasodilation.  Volume therefore modulates resistance only
 * when the compartment is compressed below its reference volume; distension
 * must not create a second hyperemic gain.  A C1 smoothstep maps normalized
 * volume to a patent hydraulic-area fraction and Poiseuille scaling gives
 * R/R0 = A^-2.  Resistance is exactly R0, with zero derivative, for V >= V0.
 */
export function evaluateVolumeDependentCoronaryResistanceV1(
  volumeMl: number,
  prior: VolumeDependentCoronaryResistancePriorV1,
): VolumeDependentCoronaryResistanceEvaluationV1 {
  validateVolumeDependentCoronaryResistancePriorV1(prior);
  if (!Number.isFinite(volumeMl) || volumeMl < 0) {
    throw new RangeError("hydraulic vascular volume must be non-negative and finite");
  }
  const normalizedVolume = volumeMl / prior.referenceVolumeMl;
  const x = Math.min(1, Math.max(0, normalizedVolume));
  const patentFraction01 = x * x * (3 - 2 * x);
  const residualArea = prior.residualHydraulicAreaFraction;
  const hydraulicAreaFraction =
    residualArea + (1 - residualArea) * patentFraction01;
  const resistanceScale = 1 / (hydraulicAreaFraction ** 2);
  const dPatentFractionDx = normalizedVolume > 0 && normalizedVolume < 1
    ? 6 * x * (1 - x)
    : 0;
  const dScaleDx = dPatentFractionDx === 0
    ? 0
    : -2 * (1 - residualArea) * dPatentFractionDx
      / (hydraulicAreaFraction ** 3);
  const dResistanceDVolumeMmHgSecPerMl2 =
    prior.referenceResistanceMmHgSecPerMl
    * dScaleDx / prior.referenceVolumeMl;
  const maximumResistanceScale = 1 / (residualArea ** 2);
  return Object.freeze({
    resistanceMmHgSecPerMl:
      prior.referenceResistanceMmHgSecPerMl * resistanceScale,
    resistanceScale,
    dResistanceDVolumeMmHgSecPerMl2,
    maximumResistanceScale,
  });
}

/**
 * Scalar collapse projection for an already identified reference volume.
 * This keeps the public diagnostic evaluator above intact while allowing a
 * nonlinear residual probe to avoid allocating a prior and result record.
 */
export function evaluateVolumeDependentCoronaryResistanceScaleV1(
  volumeMl: number,
  referenceVolumeMl: number,
  residualHydraulicAreaFraction: number,
): number {
  validateVolumeDependentCoronaryResistanceScalarsV1(
    volumeMl,
    referenceVolumeMl,
    residualHydraulicAreaFraction,
  );
  const normalizedVolume = volumeMl / referenceVolumeMl;
  const x = Math.min(1, Math.max(0, normalizedVolume));
  const patentFraction01 = x * x * (3 - 2 * x);
  const hydraulicAreaFraction = residualHydraulicAreaFraction
    + (1 - residualHydraulicAreaFraction) * patentFraction01;
  return 1 / (hydraulicAreaFraction ** 2);
}

/**
 * Write the collapse scale and its volume derivative into caller-owned
 * storage. Slots are `[resistanceScale, dResistanceScaleDVolumePerMl]`.
 */
export function evaluateVolumeDependentCoronaryResistanceScaleIntoV1(
  volumeMl: number,
  referenceVolumeMl: number,
  residualHydraulicAreaFraction: number,
  destination: number[],
): void {
  validateVolumeDependentCoronaryResistanceScalarsV1(
    volumeMl,
    referenceVolumeMl,
    residualHydraulicAreaFraction,
  );
  if (destination.length !== 2) {
    throw new RangeError("collapse scalar destination must contain two slots");
  }
  const normalizedVolume = volumeMl / referenceVolumeMl;
  const x = Math.min(1, Math.max(0, normalizedVolume));
  const patentFraction01 = x * x * (3 - 2 * x);
  const hydraulicAreaFraction = residualHydraulicAreaFraction
    + (1 - residualHydraulicAreaFraction) * patentFraction01;
  const resistanceScale = 1 / (hydraulicAreaFraction ** 2);
  const dPatentFractionDx = normalizedVolume > 0 && normalizedVolume < 1
    ? 6 * x * (1 - x)
    : 0;
  const dScaleDx = dPatentFractionDx === 0
    ? 0
    : -2 * (1 - residualHydraulicAreaFraction) * dPatentFractionDx
      / (hydraulicAreaFraction ** 3);
  destination[0] = resistanceScale;
  destination[1] = dScaleDx / referenceVolumeMl;
}

function validateVolumeDependentCoronaryResistanceScalarsV1(
  volumeMl: number,
  referenceVolumeMl: number,
  residualHydraulicAreaFraction: number,
): void {
  if (!Number.isFinite(volumeMl) || volumeMl < 0) {
    throw new RangeError(
      "hydraulic vascular volume must be non-negative and finite",
    );
  }
  if (!Number.isFinite(referenceVolumeMl) || referenceVolumeMl <= 0) {
    throw new RangeError("hydraulic reference volume must be positive and finite");
  }
  if (
    !Number.isFinite(residualHydraulicAreaFraction)
    || residualHydraulicAreaFraction <= 0
    || residualHydraulicAreaFraction > 1
  ) {
    throw new RangeError("residual hydraulic area fraction must lie in (0, 1]");
  }
}

export function validateCollapsibleIntramyocardialPvPriorV1(
  prior: CollapsibleIntramyocardialPvPriorV1,
): void {
  for (const [name, value] of [
    ["referenceVolumeMl", prior.referenceVolumeMl],
    ["pressureScaleMmHg", prior.pressureScaleMmHg],
    ["expansionExponent", prior.expansionExponent],
    ["collapseExponent", prior.collapseExponent],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
}

export function validateVolumeDependentCoronaryResistancePriorV1(
  prior: VolumeDependentCoronaryResistancePriorV1,
): void {
  if (
    !Number.isFinite(prior.referenceResistanceMmHgSecPerMl)
    || prior.referenceResistanceMmHgSecPerMl <= 0
  ) {
    throw new RangeError("reference coronary resistance must be positive and finite");
  }
  if (!Number.isFinite(prior.referenceVolumeMl) || prior.referenceVolumeMl <= 0) {
    throw new RangeError("reference hydraulic volume must be positive and finite");
  }
  if (
    !Number.isFinite(prior.residualHydraulicAreaFraction)
    || prior.residualHydraulicAreaFraction <= 0
    || prior.residualHydraulicAreaFraction >= 1
  ) {
    throw new RangeError("residual hydraulic area fraction must lie in (0, 1)");
  }
}
