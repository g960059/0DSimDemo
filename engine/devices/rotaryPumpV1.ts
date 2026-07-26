import type {
  HydraulicSegmentV1,
  MechanicalSupportNodeNameV1,
  RotaryPumpDeviceConfigV1,
  RotaryPumpEvaluationV1,
  RotaryPumpForwardFlowEvidenceStatusV1,
  RotaryPumpInletSuctionMechanismV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";

const ML_PER_L = 1000;
const SEC_PER_MIN = 60;

export function evaluateRotaryPumpV1(
  deviceId: RotarySupportDeviceIdV1,
  config: RotaryPumpDeviceConfigV1,
  input: Readonly<{
    inletPressureMmHg: number;
    outletPressureMmHg: number;
    inletVolumeMl?: number;
  }>,
): RotaryPumpEvaluationV1 {
  validateRotaryPumpConfigV1(config, deviceId);
  const inletPressureMmHg = finite(input.inletPressureMmHg, "inlet pressure");
  const outletPressureMmHg = finite(input.outletPressureMmHg, "outlet pressure");
  const pressureRiseRequiredMmHg = outletPressureMmHg - inletPressureMmHg;
  if (!config.enabled) {
    return disabledEvaluation(
      deviceId,
      config,
      inletPressureMmHg,
      outletPressureMmHg,
    );
  }
  if (config.circuitClamped) {
    return clampedEvaluation(
      deviceId,
      config,
      inletPressureMmHg,
      outletPressureMmHg,
    );
  }

  const speedRatio = config.speedRpm / config.curve.referenceSpeedRpm;
  const idealPumpHeadMmHg = config.curve.shutoffHeadMmHg * speedRatio ** 2;
  const linearSpeedScale = Math.abs(speedRatio)
    ** config.curve.linearLossSpeedExponent;
  const linear = config.curve.linearLossMmHgSecPerMl * linearSpeedScale
    + config.drainage.linearResistanceMmHgSecPerMl
    + config.oxygenator.linearResistanceMmHgSecPerMl
    + config.returnPath.linearResistanceMmHgSecPerMl;
  const quadratic = config.curve.quadraticLossMmHgSec2PerMl2
    + config.drainage.quadraticResistanceMmHgSec2PerMl2
    + config.oxygenator.quadraticResistanceMmHgSec2PerMl2
    + config.returnPath.quadraticResistanceMmHgSec2PerMl2;
  const suction = evaluateRotaryPumpInletSuctionV1(
    config.inletSuction,
    input,
  );
  const effectiveLinear = Math.max(linear, 1e-6)
    + suction.resistanceMmHgSecPerMl;
  const unrestrictedMlPerSec = solveSignedLinearQuadraticFlowV1(
    idealPumpHeadMmHg - pressureRiseRequiredMmHg,
    effectiveLinear,
    quadratic,
  );
  const unrestrictedFlowLMin = mlPerSecToLMin(unrestrictedMlPerSec);
  const rootSlopeDenominator = effectiveLinear
    + 2 * quadratic * Math.abs(unrestrictedMlPerSec);
  const unrestrictedFlowPressureTangent = (
    1 - unrestrictedMlPerSec * suction.dResistanceDInletPressure
  ) / rootSlopeDenominator;
  const unrestrictedFlowOutletPressureTangent =
    -1 / rootSlopeDenominator;
  const availability = suction.availability;
  const inletAvailability01 = availability.value;
  const forwardCapacityMlPerSec = config.maximumForwardFlowLMin === null
    ? null
    : lMinToMlPerSec(config.maximumForwardFlowLMin);
  const reverseCapacityMlPerSec = lMinToMlPerSec(
    config.maximumReverseFlowLMin,
  );
  let flowMlPerSec: number;
  let dFlowDInletPressure: number;
  let dFlowDOutletPressure: number;
  let dFlowDInletVolume: number;
  if (unrestrictedMlPerSec >= 0) {
    const availabilityLimitedFlow = unrestrictedMlPerSec * availability.value;
    if (forwardCapacityMlPerSec !== null
        && availabilityLimitedFlow >= forwardCapacityMlPerSec) {
      flowMlPerSec = forwardCapacityMlPerSec;
      dFlowDInletPressure = 0;
      dFlowDOutletPressure = 0;
      dFlowDInletVolume = 0;
    } else {
      flowMlPerSec = availabilityLimitedFlow;
      dFlowDInletPressure = availability.value * unrestrictedFlowPressureTangent
        + unrestrictedMlPerSec * availability.dInletPressure;
      dFlowDOutletPressure = availability.value
        * unrestrictedFlowOutletPressureTangent;
      dFlowDInletVolume = unrestrictedMlPerSec
        * availability.dInletVolume;
    }
  } else if (unrestrictedMlPerSec <= -reverseCapacityMlPerSec) {
    flowMlPerSec = -reverseCapacityMlPerSec;
    dFlowDInletPressure = 0;
    dFlowDOutletPressure = 0;
    dFlowDInletVolume = 0;
  } else {
    flowMlPerSec = unrestrictedMlPerSec;
    dFlowDInletPressure = unrestrictedFlowPressureTangent;
    dFlowDOutletPressure = unrestrictedFlowOutletPressureTangent;
    dFlowDInletVolume = 0;
  }
  const flowLMin = mlPerSecToLMin(flowMlPerSec);
  const inletSuctionPressureDropMmHg =
    suction.resistanceMmHgSecPerMl * flowMlPerSec;
  const drainagePressureDropMmHg = segmentDrop(config.drainage, flowMlPerSec);
  const oxygenatorPressureDropMmHg = segmentDrop(config.oxygenator, flowMlPerSec);
  const returnPathPressureDropMmHg = segmentDrop(config.returnPath, flowMlPerSec);
  const internalPumpLossMmHg =
    config.curve.linearLossMmHgSecPerMl * linearSpeedScale * flowMlPerSec
    + config.curve.quadraticLossMmHgSec2PerMl2
      * flowMlPerSec * Math.abs(flowMlPerSec);
  const deliveredPumpHeadMmHg = idealPumpHeadMmHg - internalPumpLossMmHg;
  const totalPathDrop = inletSuctionPressureDropMmHg
    + drainagePressureDropMmHg
    + oxygenatorPressureDropMmHg
    + returnPathPressureDropMmHg;
  const prePumpPressureMmHg = inletPressureMmHg
    - inletSuctionPressureDropMmHg - drainagePressureDropMmHg;
  const postPumpPressureMmHg = prePumpPressureMmHg + deliveredPumpHeadMmHg;
  const postOxygenatorPressureMmHg =
    postPumpPressureMmHg - oxygenatorPressureDropMmHg;
  const unconstrainedHydraulicResidualMmHg = deliveredPumpHeadMmHg
    - pressureRiseRequiredMmHg - totalPathDrop;
  const flowWasLimited = Math.abs(flowLMin - unrestrictedFlowLMin) > 1e-12;
  const flowLimitPressureReactionMmHg = flowWasLimited
    ? unconstrainedHydraulicResidualMmHg
    : 0;
  const hydraulicResidualMmHg = unconstrainedHydraulicResidualMmHg
    - flowLimitPressureReactionMmHg;

  return Object.freeze({
    deviceId,
    enabled: true,
    circuitClamped: false,
    speedRpm: config.speedRpm,
    inletNode: config.inletNode,
    outletNode: config.outletNode,
    inletPressureMmHg,
    outletPressureMmHg,
    pressureRiseRequiredMmHg,
    idealPumpHeadMmHg,
    flowLMin,
    unrestrictedFlowLMin,
    dFlowMlPerSecDInletPressureMlPerSecPerMmHg: dFlowDInletPressure,
    dFlowMlPerSecDOutletPressureMlPerSecPerMmHg: dFlowDOutletPressure,
    dFlowMlPerSecDInletVolumePerSec: dFlowDInletVolume,
    inletAvailability01,
    inletCollapseActive: unrestrictedMlPerSec > 0
      && (inletAvailability01 < 0.999
        || suction.resistanceMmHgSecPerMl > 0),
    inletSuctionMechanismKind: config.inletSuction.kind,
    inletSuctionResistanceMmHgSecPerMl:
      suction.resistanceMmHgSecPerMl,
    inletSuctionPressureDropMmHg,
    ...rotaryPumpForwardFlowEvidenceDiagnosticsV1(config, flowLMin),
    drainagePressureDropMmHg,
    oxygenatorPressureDropMmHg,
    returnPathPressureDropMmHg,
    prePumpPressureMmHg,
    postPumpPressureMmHg,
    postOxygenatorPressureMmHg,
    flowLimitPressureReactionMmHg,
    hydraulicResidualMmHg,
  });
}

export function solveSignedLinearQuadraticFlowV1(
  pressureDriveMmHg: number,
  linearCoefficientMmHgSecPerMl: number,
  quadraticCoefficientMmHgSec2PerMl2: number,
): number {
  finite(pressureDriveMmHg, "pressure drive");
  positive(linearCoefficientMmHgSecPerMl, "linear coefficient");
  nonnegative(quadraticCoefficientMmHgSec2PerMl2, "quadratic coefficient");
  if (pressureDriveMmHg === 0) return 0;
  if (quadraticCoefficientMmHgSec2PerMl2 === 0) {
    return pressureDriveMmHg / linearCoefficientMmHgSecPerMl;
  }
  const magnitude = Math.abs(pressureDriveMmHg);
  const root = Math.sqrt(
    linearCoefficientMmHgSecPerMl ** 2
      + 4 * quadraticCoefficientMmHgSec2PerMl2 * magnitude,
  );
  return Math.sign(pressureDriveMmHg)
    * 2 * magnitude / (linearCoefficientMmHgSecPerMl + root);
}

export function validateRotaryPumpConfigV1(
  config: RotaryPumpDeviceConfigV1,
  label = "rotary pump",
): void {
  if (typeof config.enabled !== "boolean") throw new Error(`${label}.enabled must be boolean`);
  if (typeof config.circuitClamped !== "boolean") {
    throw new Error(`${label}.circuitClamped must be boolean`);
  }
  nonnegative(config.speedRpm, `${label}.speedRpm`);
  positive(config.curve.referenceSpeedRpm, `${label}.referenceSpeedRpm`);
  nonnegative(config.curve.shutoffHeadMmHg, `${label}.shutoffHeadMmHg`);
  nonnegative(config.curve.linearLossMmHgSecPerMl, `${label}.linearLoss`);
  if (
    config.curve.linearLossSpeedExponent !== 0
    && config.curve.linearLossSpeedExponent !== 1
  ) throw new Error(`${label}.linearLossSpeedExponent must be 0 or 1`);
  nonnegative(config.curve.quadraticLossMmHgSec2PerMl2, `${label}.quadraticLoss`);
  validateSegment(config.drainage, `${label}.drainage`);
  validateSegment(config.oxygenator, `${label}.oxygenator`);
  validateSegment(config.returnPath, `${label}.returnPath`);
  validateInletSuction(config.inletSuction, `${label}.inletSuction`);
  if (config.maximumForwardFlowLMin !== null) {
    nonnegative(
      config.maximumForwardFlowLMin,
      `${label}.maximumForwardFlowLMin`,
    );
  }
  nonnegative(config.maximumReverseFlowLMin, `${label}.maximumReverseFlowLMin`);
  validateForwardFlowEvidenceDomain(config, label);
}

function disabledEvaluation(
  deviceId: RotarySupportDeviceIdV1,
  config: RotaryPumpDeviceConfigV1,
  inletPressureMmHg: number,
  outletPressureMmHg: number,
): RotaryPumpEvaluationV1 {
  return Object.freeze({
    deviceId,
    enabled: config.enabled,
    circuitClamped: config.circuitClamped,
    speedRpm: config.speedRpm,
    inletNode: config.inletNode,
    outletNode: config.outletNode,
    inletPressureMmHg,
    outletPressureMmHg,
    pressureRiseRequiredMmHg: outletPressureMmHg - inletPressureMmHg,
    idealPumpHeadMmHg: 0,
    flowLMin: 0,
    unrestrictedFlowLMin: 0,
    dFlowMlPerSecDInletPressureMlPerSecPerMmHg: 0,
    dFlowMlPerSecDOutletPressureMlPerSecPerMmHg: 0,
    dFlowMlPerSecDInletVolumePerSec: 0,
    inletAvailability01: 1,
    inletCollapseActive: false,
    inletSuctionMechanismKind: config.inletSuction.kind,
    inletSuctionResistanceMmHgSecPerMl: 0,
    inletSuctionPressureDropMmHg: 0,
    ...rotaryPumpForwardFlowEvidenceDiagnosticsV1(config, 0),
    drainagePressureDropMmHg: 0,
    oxygenatorPressureDropMmHg: 0,
    returnPathPressureDropMmHg: 0,
    prePumpPressureMmHg: inletPressureMmHg,
    postPumpPressureMmHg: inletPressureMmHg,
    postOxygenatorPressureMmHg: inletPressureMmHg,
    flowLimitPressureReactionMmHg: 0,
    hydraulicResidualMmHg: 0,
  });
}

function clampedEvaluation(
  deviceId: RotarySupportDeviceIdV1,
  config: RotaryPumpDeviceConfigV1,
  inletPressureMmHg: number,
  outletPressureMmHg: number,
): RotaryPumpEvaluationV1 {
  const speedRatio = config.speedRpm / config.curve.referenceSpeedRpm;
  const idealPumpHeadMmHg = config.curve.shutoffHeadMmHg * speedRatio ** 2;
  return Object.freeze({
    deviceId,
    enabled: true,
    circuitClamped: true,
    speedRpm: config.speedRpm,
    inletNode: config.inletNode,
    outletNode: config.outletNode,
    inletPressureMmHg,
    outletPressureMmHg,
    pressureRiseRequiredMmHg: outletPressureMmHg - inletPressureMmHg,
    idealPumpHeadMmHg,
    flowLMin: 0,
    unrestrictedFlowLMin: 0,
    dFlowMlPerSecDInletPressureMlPerSecPerMmHg: 0,
    dFlowMlPerSecDOutletPressureMlPerSecPerMmHg: 0,
    dFlowMlPerSecDInletVolumePerSec: 0,
    inletAvailability01: 1,
    inletCollapseActive: false,
    inletSuctionMechanismKind: config.inletSuction.kind,
    inletSuctionResistanceMmHgSecPerMl: 0,
    inletSuctionPressureDropMmHg: 0,
    ...rotaryPumpForwardFlowEvidenceDiagnosticsV1(config, 0),
    drainagePressureDropMmHg: 0,
    oxygenatorPressureDropMmHg: 0,
    returnPathPressureDropMmHg: 0,
    prePumpPressureMmHg: inletPressureMmHg,
    postPumpPressureMmHg: inletPressureMmHg + idealPumpHeadMmHg,
    postOxygenatorPressureMmHg: inletPressureMmHg + idealPumpHeadMmHg,
    flowLimitPressureReactionMmHg:
      idealPumpHeadMmHg - (outletPressureMmHg - inletPressureMmHg),
    hydraulicResidualMmHg: 0,
  });
}

function segmentDrop(segment: HydraulicSegmentV1, flowMlPerSec: number): number {
  return segment.linearResistanceMmHgSecPerMl * flowMlPerSec
    + segment.quadraticResistanceMmHgSec2PerMl2
      * flowMlPerSec * Math.abs(flowMlPerSec);
}

function validateSegment(segment: HydraulicSegmentV1, label: string): void {
  nonnegative(segment.linearResistanceMmHgSecPerMl, `${label}.linearResistance`);
  nonnegative(segment.quadraticResistanceMmHgSec2PerMl2, `${label}.quadraticResistance`);
}

export type EvaluatedRotaryPumpInletSuctionV1 = Readonly<{
  resistanceMmHgSecPerMl: number;
  dResistanceDInletPressure: number;
  availability: Readonly<{
    value: number;
    dInletPressure: number;
    dInletVolume: number;
    owner: "pressure-collapse" | "volume-collapse" | null;
  }>;
}>;

export function evaluateRotaryPumpInletSuctionV1(
  mechanism: RotaryPumpInletSuctionMechanismV1,
  input: Readonly<{
    inletPressureMmHg: number;
    inletVolumeMl?: number;
  }>,
): EvaluatedRotaryPumpInletSuctionV1 {
  if (mechanism.kind === "none") {
    return Object.freeze({
      resistanceMmHgSecPerMl: 0,
      dResistanceDInletPressure: 0,
      availability: Object.freeze({
        value: 1,
        dInletPressure: 0,
        dInletVolume: 0,
        owner: null,
      }),
    });
  }
  if (mechanism.kind === "pressure-dependent-series-resistance") {
    // The cited law owns equality: P_LV <= P_threshold. R_k is zero at the
    // boundary, while the one-sided active-branch pressure tangent is kept.
    const active = input.inletPressureMmHg <= mechanism.thresholdPressureMmHg;
    return Object.freeze({
      resistanceMmHgSecPerMl: active
        ? mechanism.resistanceSlopeMmHgSecPerMlPerMmHg
          * (mechanism.thresholdPressureMmHg - input.inletPressureMmHg)
        : 0,
      dResistanceDInletPressure: active
        ? -mechanism.resistanceSlopeMmHgSecPerMlPerMmHg
        : 0,
      availability: Object.freeze({
        value: 1,
        dInletPressure: 0,
        dInletVolume: 0,
        owner: null,
      }),
    });
  }

  const pressureInterval = mechanism.recoveredPressureMmHg
    - mechanism.collapsePressureMmHg;
  const pressureAvailability = smoothstep01WithDerivative(
    (input.inletPressureMmHg - mechanism.collapsePressureMmHg)
      / pressureInterval,
    1 / pressureInterval,
  );
  const volumeAvailability = input.inletVolumeMl === undefined
    || mechanism.minimumVolumeMl === null
    || mechanism.recoveredVolumeMl === null
    ? Object.freeze({ value: 1, derivative: 0 })
    : smoothstep01WithDerivative(
      (input.inletVolumeMl - mechanism.minimumVolumeMl)
        / (mechanism.recoveredVolumeMl - mechanism.minimumVolumeMl),
      1 / (mechanism.recoveredVolumeMl - mechanism.minimumVolumeMl),
    );
  return Object.freeze({
    resistanceMmHgSecPerMl: 0,
    dResistanceDInletPressure: 0,
    // Preserve the pre-existing deterministic tie-break exactly.
    availability: pressureAvailability.value <= volumeAvailability.value
      ? Object.freeze({
        value: pressureAvailability.value,
        dInletPressure: pressureAvailability.derivative,
        dInletVolume: 0,
        owner: "pressure-collapse" as const,
      })
      : Object.freeze({
        value: volumeAvailability.value,
        dInletPressure: 0,
        dInletVolume: volumeAvailability.derivative,
        owner: "volume-collapse" as const,
      }),
  });
}

function validateInletSuction(
  mechanism: RotaryPumpInletSuctionMechanismV1,
  label: string,
): void {
  if (mechanism === null || typeof mechanism !== "object") {
    throw new Error(`${label} must be a discriminated object`);
  }
  if (mechanism.kind === "none") {
    assertExactKeys(mechanism, ["kind"], label);
    return;
  }
  if (mechanism.kind === "pressure-dependent-series-resistance") {
    assertExactKeys(mechanism, [
      "kind",
      "thresholdPressureMmHg",
      "resistanceSlopeMmHgSecPerMlPerMmHg",
    ], label);
    finite(
      mechanism.thresholdPressureMmHg,
      `${label}.thresholdPressureMmHg`,
    );
    positive(
      mechanism.resistanceSlopeMmHgSecPerMlPerMmHg,
      `${label}.resistanceSlopeMmHgSecPerMlPerMmHg`,
    );
    return;
  }
  if (mechanism.kind !== "legacy-smooth-availability") {
    throw new Error(`${label}.kind is unsupported`);
  }
  assertExactKeys(mechanism, [
    "kind",
    "collapsePressureMmHg",
    "recoveredPressureMmHg",
    "minimumVolumeMl",
    "recoveredVolumeMl",
  ], label);
  finite(mechanism.collapsePressureMmHg, `${label}.collapsePressureMmHg`);
  finite(mechanism.recoveredPressureMmHg, `${label}.recoveredPressureMmHg`);
  if (mechanism.recoveredPressureMmHg <= mechanism.collapsePressureMmHg) {
    throw new Error(`${label} pressure interval must be positive`);
  }
  if (mechanism.minimumVolumeMl === null
      && mechanism.recoveredVolumeMl === null) return;
  if (mechanism.minimumVolumeMl === null
      || mechanism.recoveredVolumeMl === null) {
    throw new Error(`${label} volume interval must be positive or null`);
  }
  nonnegative(mechanism.minimumVolumeMl, `${label}.minimumVolumeMl`);
  nonnegative(mechanism.recoveredVolumeMl, `${label}.recoveredVolumeMl`);
  if (mechanism.recoveredVolumeMl <= mechanism.minimumVolumeMl) {
    throw new Error(`${label} volume interval must be positive or null`);
  }
}

function validateForwardFlowEvidenceDomain(
  config: RotaryPumpDeviceConfigV1,
  label: string,
): void {
  const domain = config.forwardFlowEvidenceDomain;
  if (domain === null || typeof domain !== "object") {
    throw new Error(`${label}.forwardFlowEvidenceDomain must be an object`);
  }
  assertExactKeys(domain, [
    "publishedExperimentalTraversalUpperLMin",
    "advertisedCapacityLMin",
  ], `${label}.forwardFlowEvidenceDomain`);
  const publishedUpper = domain.publishedExperimentalTraversalUpperLMin;
  const advertised = domain.advertisedCapacityLMin;
  if ((publishedUpper === null) !== (advertised === null)) {
    throw new Error(
      `${label}.forwardFlowEvidenceDomain limits must both be null or finite`,
    );
  }
  if (publishedUpper === null || advertised === null) return;
  positive(
    publishedUpper,
    `${label}.forwardFlowEvidenceDomain.publishedExperimentalTraversalUpperLMin`,
  );
  positive(advertised, `${label}.forwardFlowEvidenceDomain.advertisedCapacityLMin`);
  if (advertised < publishedUpper) {
    throw new Error(
      `${label}.forwardFlowEvidenceDomain advertised capacity must cover published experimental traversal`,
    );
  }
}

export function rotaryPumpForwardFlowEvidenceDiagnosticsV1(
  config: RotaryPumpDeviceConfigV1,
  flowLMin: number,
): Readonly<{
  forwardFlowEvidenceStatus: RotaryPumpForwardFlowEvidenceStatusV1;
  forwardFlowPublishedExperimentalTraversalUpperLMin: number | null;
  forwardFlowAdvertisedCapacityLMin: number | null;
}> {
  const publishedUpper = config.forwardFlowEvidenceDomain
    .publishedExperimentalTraversalUpperLMin;
  const advertised = config.forwardFlowEvidenceDomain.advertisedCapacityLMin;
  let status: RotaryPumpForwardFlowEvidenceStatusV1;
  if (publishedUpper === null || advertised === null) status = "not-declared";
  else if (!(flowLMin > 0)) {
    // The cited traversal and advertised capacity describe forward flow only.
    // Zero or reverse flow must not be mislabeled as lying inside that domain.
    status = "non-forward-flow-not-applicable";
  }
  else if (flowLMin <= publishedUpper) {
    status = "within-published-experimental-domain";
  }
  else if (flowLMin <= advertised) {
    status =
      "above-published-experimental-domain-within-advertised-capacity";
  } else status = "above-advertised-capacity";
  return Object.freeze({
    forwardFlowEvidenceStatus: status,
    forwardFlowPublishedExperimentalTraversalUpperLMin: publishedUpper,
    forwardFlowAdvertisedCapacityLMin: advertised,
  });
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  if (actual.length !== keys.length
      || actual.some((key, index) => key !== keys[index])) {
    throw new Error(`${label} keys must be exactly ${keys.join(", ")}`);
  }
}

function smoothstep01WithDerivative(
  value: number,
  inputDerivative: number,
): Readonly<{ value: number; derivative: number }> {
  const x = Math.min(1, Math.max(0, value));
  return Object.freeze({
    value: x * x * (3 - 2 * x),
    derivative: value > 0 && value < 1
      ? 6 * x * (1 - x) * inputDerivative
      : 0,
  });
}

function mlPerSecToLMin(value: number): number {
  return value * SEC_PER_MIN / ML_PER_L;
}

function lMinToMlPerSec(value: number): number {
  return value * ML_PER_L / SEC_PER_MIN;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function positive(value: number, label: string): number {
  finite(value, label);
  if (!(value > 0)) throw new Error(`${label} must be positive`);
  return value;
}

function nonnegative(value: number, label: string): number {
  finite(value, label);
  if (value < 0) throw new Error(`${label} must be nonnegative`);
  return value;
}

export function emptyMechanicalSupportNodeRatesV1(): Record<
  MechanicalSupportNodeNameV1,
  number
> {
  return { LV: 0, Ao: 0, SA: 0, RA: 0, VC: 0 };
}
