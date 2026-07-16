const PA_PER_MMHG = 133.322;

export const DYNAMIC_INERTIAL_VALVE_V1_ID =
  "dynamic-inertial-valve-v1" as const;

export type DynamicInertialValveParamsV1 = {
  readonly valveId: "MV" | "AoV" | "TV" | "PV";
  readonly openAreaCm2: number;
  /** Numerical hydraulic floor; it is not a claimed normal regurgitant EROA. */
  readonly minimumAreaCm2: number;
  readonly bloodDensityKgPerM3: number;
  readonly effectiveLengthCm: number;
  readonly openLinearResistanceMmHgSecPerMl: number;
  readonly openingRatePerMmHgSec: number;
  readonly closingRatePerMmHgSec: number;
  readonly openingThresholdMmHg: number;
  readonly closingThresholdMmHg: number;
  /** C1 exact-zero positive-part transition width. */
  readonly driveTransitionWidthMmHg: number;
  readonly flowSmoothingMlPerSec: number;
};

export type DynamicInertialValveStateV1 = {
  readonly qMlPerSec: number;
  readonly openingFraction01: number;
};

export type DynamicInertialValveInputV1 = {
  readonly dtSec: number;
  readonly upstreamPressureMmHg: number;
  readonly downstreamPressureMmHg: number;
};

export type DynamicInertialValveOutputV1 = {
  readonly state: DynamicInertialValveStateV1;
  readonly valveId: DynamicInertialValveParamsV1["valveId"];
  readonly pressureGradientMmHg: number;
  readonly openFraction01: number;
  readonly effectiveAreaCm2: number;
  readonly qMlPerSec: number;
  readonly qDotMlPerSec2: number;
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly pressureFlowResidualMmHg: number;
  readonly dissipatedPowerMmHgMlPerSec: number;
  readonly openingDrivePerSec: number;
  readonly closingDrivePerSec: number;
  readonly backwardEulerOpeningTargetFraction01: number;
  readonly openingStateResidual01: number;
  /** Same physical BE root, expressed in the solver's unconstrained logit. */
  readonly openingStateResidualLogit: number;
};

/**
 * Mynard-type first-order valve-area memory coupled to inertial flow.
 *
 * Area is owned by an independent bounded state, rather than an instantaneous
 * function of pressure difference.  Consequently the flow residual has no
 * direct dA/d(delta-p) fold.  L and B are derived from density, area, and one
 * effective length; they are not independent fitting knobs.
 */
export function evaluateDynamicInertialValveV1(
  previous: DynamicInertialValveStateV1,
  candidate: DynamicInertialValveStateV1,
  input: DynamicInertialValveInputV1,
  params: DynamicInertialValveParamsV1,
): DynamicInertialValveOutputV1 {
  validate(previous, candidate, input, params);
  const pressureGradientMmHg =
    input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const openFraction01 = candidate.openingFraction01;
  const effectiveAreaCm2 =
    params.minimumAreaCm2 +
    (params.openAreaCm2 - params.minimumAreaCm2) * openFraction01;
  const areaRatio = params.openAreaCm2 / effectiveAreaCm2;
  const resistanceMmHgSecPerMl =
    params.openLinearResistanceMmHgSecPerMl * areaRatio * areaRatio;
  const inertanceMmHgSec2PerMl = inertanceFromGeometry(
    params.bloodDensityKgPerM3,
    params.effectiveLengthCm,
    effectiveAreaCm2,
  );
  const bernoulliMmHgSec2PerMl2 = bernoulliFromGeometry(
    params.bloodDensityKgPerM3,
    effectiveAreaCm2,
  );
  const qMlPerSec = candidate.qMlPerSec;
  const qDotMlPerSec2 =
    (qMlPerSec - previous.qMlPerSec) / input.dtSec;
  const smoothAbs = Math.sqrt(
    qMlPerSec * qMlPerSec + params.flowSmoothingMlPerSec ** 2,
  );
  const resistiveLoss = resistanceMmHgSecPerMl * qMlPerSec;
  const inertialLoss = inertanceMmHgSec2PerMl * qDotMlPerSec2;
  const bernoulliLoss =
    bernoulliMmHgSec2PerMl2 * qMlPerSec * smoothAbs;
  const openingDrivePerSec =
    params.openingRatePerMmHgSec *
    c1PositivePart(
      pressureGradientMmHg - params.openingThresholdMmHg,
      params.driveTransitionWidthMmHg,
    );
  const closingDrivePerSec =
    params.closingRatePerMmHgSec *
    c1PositivePart(
      params.closingThresholdMmHg - pressureGradientMmHg,
      params.driveTransitionWidthMmHg,
    );
  const openingStateResidual01 =
    openFraction01 - previous.openingFraction01 -
    input.dtSec *
      (openingDrivePerSec * (1 - openFraction01) -
        closingDrivePerSec * openFraction01);
  const backwardEulerOpeningTargetFraction01 =
    (previous.openingFraction01 + input.dtSec * openingDrivePerSec) /
    (1 + input.dtSec * (openingDrivePerSec + closingDrivePerSec));
  return Object.freeze({
    state: Object.freeze({ qMlPerSec, openingFraction01: openFraction01 }),
    valveId: params.valveId,
    pressureGradientMmHg,
    openFraction01,
    effectiveAreaCm2,
    qMlPerSec,
    qDotMlPerSec2,
    resistanceMmHgSecPerMl,
    inertanceMmHgSec2PerMl,
    bernoulliMmHgSec2PerMl2,
    pressureFlowResidualMmHg:
      pressureGradientMmHg - resistiveLoss - inertialLoss - bernoulliLoss,
    dissipatedPowerMmHgMlPerSec:
      resistiveLoss * qMlPerSec + bernoulliLoss * qMlPerSec,
    openingDrivePerSec,
    closingDrivePerSec,
    backwardEulerOpeningTargetFraction01,
    openingStateResidual01,
    openingStateResidualLogit:
      boundedOpeningLogit(openFraction01) -
      boundedOpeningLogit(backwardEulerOpeningTargetFraction01),
  });
}

/** Exact bounded backward-Euler opening update at a fixed pressure gradient. */
export function backwardEulerDynamicValveOpeningFractionV1(
  previousOpeningFraction01: number,
  pressureGradientMmHg: number,
  dtSec: number,
  params: DynamicInertialValveParamsV1,
): number {
  validateOpening(previousOpeningFraction01, "previousOpeningFraction01");
  requireFinite(pressureGradientMmHg, "pressureGradientMmHg");
  requirePositive(dtSec, "dtSec");
  const openingDrive = params.openingRatePerMmHgSec * c1PositivePart(
    pressureGradientMmHg - params.openingThresholdMmHg,
    params.driveTransitionWidthMmHg,
  );
  const closingDrive = params.closingRatePerMmHgSec * c1PositivePart(
    params.closingThresholdMmHg - pressureGradientMmHg,
    params.driveTransitionWidthMmHg,
  );
  return (
    previousOpeningFraction01 + dtSec * openingDrive
  ) / (1 + dtSec * (openingDrive + closingDrive));
}

/** Monotone scalar momentum solve at a fixed independent opening state. */
export function backwardEulerDynamicValveFlowV1(
  previous: DynamicInertialValveStateV1,
  openingFraction01: number,
  input: DynamicInertialValveInputV1,
  params: DynamicInertialValveParamsV1,
): number {
  validateOpening(openingFraction01, "openingFraction01");
  const seed = evaluateDynamicInertialValveV1(
    previous,
    { qMlPerSec: previous.qMlPerSec, openingFraction01 },
    input,
    params,
  );
  const momentum = seed.inertanceMmHgSec2PerMl / input.dtSec;
  let q = previous.qMlPerSec;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const smoothAbs = Math.sqrt(
      q * q + params.flowSmoothingMlPerSec ** 2,
    );
    const residual =
      input.upstreamPressureMmHg - input.downstreamPressureMmHg -
      seed.resistanceMmHgSecPerMl * q -
      momentum * (q - previous.qMlPerSec) -
      seed.bernoulliMmHgSec2PerMl2 * q * smoothAbs;
    const derivative = -(
      seed.resistanceMmHgSecPerMl + momentum +
      seed.bernoulliMmHgSec2PerMl2 *
        (2 * q * q + params.flowSmoothingMlPerSec ** 2) /
        Math.max(smoothAbs, 1e-12)
    );
    q -= residual / derivative;
  }
  return q;
}

function inertanceFromGeometry(
  densityKgPerM3: number,
  effectiveLengthCm: number,
  areaCm2: number,
): number {
  return densityKgPerM3 * effectiveLengthCm * 1e-4 /
    (PA_PER_MMHG * areaCm2);
}

function bernoulliFromGeometry(
  densityKgPerM3: number,
  areaCm2: number,
): number {
  return 0.5 * densityKgPerM3 * 1e-4 /
    (PA_PER_MMHG * areaCm2 * areaCm2);
}

function c1PositivePart(value: number, width: number): number {
  requireFinite(value, "positive-part input");
  requirePositive(width, "driveTransitionWidthMmHg");
  if (value <= 0) return 0;
  if (value >= width) return value;
  return value * value * (2 * width - value) / (width * width);
}

function boundedOpeningLogit(openingFraction01: number): number {
  const interior = Math.min(
    Math.max(openingFraction01, 1e-12),
    1 - 1e-12,
  );
  return Math.log(interior / (1 - interior));
}

function validate(
  previous: DynamicInertialValveStateV1,
  candidate: DynamicInertialValveStateV1,
  input: DynamicInertialValveInputV1,
  params: DynamicInertialValveParamsV1,
): void {
  requireFinite(previous.qMlPerSec, "previous.qMlPerSec");
  requireFinite(candidate.qMlPerSec, "candidate.qMlPerSec");
  validateOpening(previous.openingFraction01, "previous.openingFraction01");
  validateOpening(candidate.openingFraction01, "candidate.openingFraction01");
  requirePositive(input.dtSec, "dtSec");
  requireFinite(input.upstreamPressureMmHg, "upstreamPressureMmHg");
  requireFinite(input.downstreamPressureMmHg, "downstreamPressureMmHg");
  requirePositive(params.openAreaCm2, "openAreaCm2");
  requirePositive(params.minimumAreaCm2, "minimumAreaCm2");
  if (params.minimumAreaCm2 > params.openAreaCm2) {
    throw new Error("minimumAreaCm2 cannot exceed openAreaCm2");
  }
  requirePositive(params.bloodDensityKgPerM3, "bloodDensityKgPerM3");
  requirePositive(params.effectiveLengthCm, "effectiveLengthCm");
  requireNonNegative(
    params.openLinearResistanceMmHgSecPerMl,
    "openLinearResistanceMmHgSecPerMl",
  );
  requirePositive(params.openingRatePerMmHgSec, "openingRatePerMmHgSec");
  requirePositive(params.closingRatePerMmHgSec, "closingRatePerMmHgSec");
  requireFinite(params.openingThresholdMmHg, "openingThresholdMmHg");
  requireFinite(params.closingThresholdMmHg, "closingThresholdMmHg");
  requirePositive(
    params.driveTransitionWidthMmHg,
    "driveTransitionWidthMmHg",
  );
  requirePositive(params.flowSmoothingMlPerSec, "flowSmoothingMlPerSec");
}

function validateOpening(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must lie in [0, 1]`);
  }
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

function requireFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
}
