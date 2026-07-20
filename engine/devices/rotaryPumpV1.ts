import type {
  HydraulicSegmentV1,
  MechanicalSupportNodeNameV1,
  RotaryPumpDeviceConfigV1,
  RotaryPumpEvaluationV1,
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
  const effectiveLinear = Math.max(linear, 1e-6);
  const unrestrictedMlPerSec = solveSignedLinearQuadraticFlowV1(
    idealPumpHeadMmHg - pressureRiseRequiredMmHg,
    effectiveLinear,
    quadratic,
  );
  const unrestrictedFlowLMin = mlPerSecToLMin(unrestrictedMlPerSec);
  const unrestrictedFlowPressureTangent = 1 / (
    effectiveLinear + 2 * quadratic * Math.abs(unrestrictedMlPerSec)
  );
  const pressureAvailability = smoothstep01WithDerivative(
    (inletPressureMmHg - config.inletCollapse.collapsePressureMmHg)
      / (config.inletCollapse.recoveredPressureMmHg
        - config.inletCollapse.collapsePressureMmHg),
    1 / (config.inletCollapse.recoveredPressureMmHg
      - config.inletCollapse.collapsePressureMmHg),
  );
  const volumeAvailability = input.inletVolumeMl === undefined
    || config.inletCollapse.minimumVolumeMl === null
    || config.inletCollapse.recoveredVolumeMl === null
    ? Object.freeze({ value: 1, derivative: 0 })
    : smoothstep01WithDerivative(
      (input.inletVolumeMl - config.inletCollapse.minimumVolumeMl)
        / (config.inletCollapse.recoveredVolumeMl
          - config.inletCollapse.minimumVolumeMl),
      1 / (config.inletCollapse.recoveredVolumeMl
        - config.inletCollapse.minimumVolumeMl),
    );
  const availability = pressureAvailability.value <= volumeAvailability.value
    ? Object.freeze({
      value: pressureAvailability.value,
      dInletPressure: pressureAvailability.derivative,
      dInletVolume: 0,
    })
    : Object.freeze({
      value: volumeAvailability.value,
      dInletPressure: 0,
      dInletVolume: volumeAvailability.derivative,
    });
  const inletAvailability01 = availability.value;
  const forwardCapacityMlPerSec = lMinToMlPerSec(
    config.maximumForwardFlowLMin,
  );
  const reverseCapacityMlPerSec = lMinToMlPerSec(
    config.maximumReverseFlowLMin,
  );
  let flowMlPerSec: number;
  let dFlowDInletPressure: number;
  let dFlowDOutletPressure: number;
  let dFlowDInletVolume: number;
  if (unrestrictedMlPerSec >= 0) {
    const availabilityLimitedFlow = unrestrictedMlPerSec * availability.value;
    if (availabilityLimitedFlow >= forwardCapacityMlPerSec) {
      flowMlPerSec = forwardCapacityMlPerSec;
      dFlowDInletPressure = 0;
      dFlowDOutletPressure = 0;
      dFlowDInletVolume = 0;
    } else {
      flowMlPerSec = availabilityLimitedFlow;
      dFlowDInletPressure = availability.value * unrestrictedFlowPressureTangent
        + unrestrictedMlPerSec * availability.dInletPressure;
      dFlowDOutletPressure = -availability.value
        * unrestrictedFlowPressureTangent;
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
    dFlowDOutletPressure = -unrestrictedFlowPressureTangent;
    dFlowDInletVolume = 0;
  }
  const flowLMin = mlPerSecToLMin(flowMlPerSec);
  const drainagePressureDropMmHg = segmentDrop(config.drainage, flowMlPerSec);
  const oxygenatorPressureDropMmHg = segmentDrop(config.oxygenator, flowMlPerSec);
  const returnPathPressureDropMmHg = segmentDrop(config.returnPath, flowMlPerSec);
  const internalPumpLossMmHg =
    config.curve.linearLossMmHgSecPerMl * linearSpeedScale * flowMlPerSec
    + config.curve.quadraticLossMmHgSec2PerMl2
      * flowMlPerSec * Math.abs(flowMlPerSec);
  const deliveredPumpHeadMmHg = idealPumpHeadMmHg - internalPumpLossMmHg;
  const totalPathDrop = drainagePressureDropMmHg
    + oxygenatorPressureDropMmHg
    + returnPathPressureDropMmHg;
  const prePumpPressureMmHg = inletPressureMmHg - drainagePressureDropMmHg;
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
      && inletAvailability01 < 0.999,
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
  finite(config.inletCollapse.collapsePressureMmHg,
    `${label}.inletCollapse.collapsePressureMmHg`);
  finite(config.inletCollapse.recoveredPressureMmHg,
    `${label}.inletCollapse.recoveredPressureMmHg`);
  if (
    config.inletCollapse.recoveredPressureMmHg
      <= config.inletCollapse.collapsePressureMmHg
  ) throw new Error(`${label}.inletCollapse pressure interval must be positive`);
  if (
    config.inletCollapse.minimumVolumeMl !== null
    || config.inletCollapse.recoveredVolumeMl !== null
  ) {
    if (config.inletCollapse.minimumVolumeMl !== null) {
      nonnegative(config.inletCollapse.minimumVolumeMl,
        `${label}.inletCollapse.minimumVolumeMl`);
    }
    if (config.inletCollapse.recoveredVolumeMl !== null) {
      nonnegative(config.inletCollapse.recoveredVolumeMl,
        `${label}.inletCollapse.recoveredVolumeMl`);
    }
    if (
      config.inletCollapse.minimumVolumeMl === null
      || config.inletCollapse.recoveredVolumeMl === null
      || config.inletCollapse.recoveredVolumeMl
        <= config.inletCollapse.minimumVolumeMl
    ) throw new Error(`${label}.inletCollapse volume interval must be positive or null`);
  }
  nonnegative(config.maximumForwardFlowLMin, `${label}.maximumForwardFlowLMin`);
  nonnegative(config.maximumReverseFlowLMin, `${label}.maximumReverseFlowLMin`);
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
