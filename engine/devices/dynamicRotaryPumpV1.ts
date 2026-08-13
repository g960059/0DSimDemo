import {
  evaluateRotaryPumpInletSuctionV1,
  rotaryPumpForwardFlowEvidenceDiagnosticsV1,
  solveSignedLinearQuadraticFlowV1,
  validateRotaryPumpConfigV1,
} from "@/engine/devices/rotaryPumpV1";
import type {
  HydraulicSegmentV1,
  RotaryPumpDeviceConfigV1,
  RotaryPumpForwardFlowEvidenceStatusV1,
  RotaryPumpInletSuctionMechanismV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";

const ML_PER_L = 1000;
const SEC_PER_MIN = 60;

/**
 * Explicit internal unit contract. Inertance is pressure / flow acceleration:
 * mmHg / (mL/s^2) = mmHg*s^2/mL.
 */
export const DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID =
  "circleheart-mmHg-mL-second-v1" as const;

export const DYNAMIC_ROTARY_PUMP_ACCEPTED_FLOW_STATE_V1_ID =
  "circleheart-dynamic-rotary-pump-accepted-flow-v1" as const;

export type DynamicRotaryPumpCircuitInertanceV1 = Readonly<{
  unitSystemId: typeof DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID;
  pumpInternalMmHgSec2PerMl: number;
  drainageMmHgSec2PerMl: number;
  oxygenatorMmHgSec2PerMl: number;
  returnPathMmHgSec2PerMl: number;
}>;

export type DynamicRotaryPumpAcceptedFlowStateV1 = Readonly<{
  stateId: typeof DYNAMIC_ROTARY_PUMP_ACCEPTED_FLOW_STATE_V1_ID;
  unitSystemId: typeof DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID;
  deviceId: RotarySupportDeviceIdV1;
  acceptedFlowMlPerSec: number;
}>;

export type DynamicRotaryPumpConstraintOwnerV1 =
  | "none"
  | "disabled"
  | "clamp"
  | "pressure-collapse"
  | "volume-collapse"
  | "forward-cap"
  | "reverse-cap";

export type DynamicRotaryPumpEvaluationV1 = Readonly<{
  unitSystemId: typeof DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID;
  deviceId: RotarySupportDeviceIdV1;
  enabled: boolean;
  circuitClamped: boolean;
  speedRpm: number;
  inletNode: RotaryPumpDeviceConfigV1["inletNode"];
  outletNode: RotaryPumpDeviceConfigV1["outletNode"];
  dtSec: number;
  inletPressureMmHg: number;
  outletPressureMmHg: number;
  pressureRiseRequiredMmHg: number;
  idealPumpHeadMmHg: number;
  previousAcceptedFlowMlPerSec: number;
  candidateAcceptedState: DynamicRotaryPumpAcceptedFlowStateV1;
  flowMlPerSec: number;
  flowLMin: number;
  unrestrictedFlowMlPerSec: number;
  unrestrictedFlowLMin: number;
  flowAccelerationMlPerSec2: number;
  totalInertanceMmHgSec2PerMl: number;
  dFlowMlPerSecDInletPressureMlPerSecPerMmHg: number;
  dFlowMlPerSecDOutletPressureMlPerSecPerMmHg: number;
  dFlowMlPerSecDInletVolumePerSec: number;
  dFlowMlPerSecDPreviousFlow: number;
  inletAvailability01: number;
  inletCollapseActive: boolean;
  inletSuctionMechanismKind: RotaryPumpInletSuctionMechanismV1["kind"];
  inletSuctionResistanceMmHgSecPerMl: number;
  inletSuctionPressureDropMmHg: number;
  forwardFlowEvidenceStatus: RotaryPumpForwardFlowEvidenceStatusV1;
  forwardFlowPublishedExperimentalTraversalUpperLMin: number | null;
  forwardFlowAdvertisedCapacityLMin: number | null;
  constraintOwner: DynamicRotaryPumpConstraintOwnerV1;
  constraintReactionMmHg: number;
  flowLimitPressureReactionMmHg: number;
  drainagePressureDropMmHg: number;
  oxygenatorPressureDropMmHg: number;
  returnPathPressureDropMmHg: number;
  prePumpPressureMmHg: number;
  postPumpPressureMmHg: number;
  postOxygenatorPressureMmHg: number;
  unconstrainedHydraulicResidualMmHg: number;
  hydraulicResidualMmHg: number;
}>;

export type DynamicRotaryPumpInputV1 = Readonly<{
  dtSec: number;
  inertance: DynamicRotaryPumpCircuitInertanceV1;
  inletPressureMmHg: number;
  outletPressureMmHg: number;
  inletVolumeMl?: number;
}>;

/**
 * Creates the last accepted flow state. Trial evaluations return a new candidate
 * and never mutate this object, so rejected nonlinear/time-step retries are pure.
 */
export function createDynamicRotaryPumpAcceptedFlowStateV1(
  deviceId: RotarySupportDeviceIdV1,
  acceptedFlowMlPerSec = 0,
): DynamicRotaryPumpAcceptedFlowStateV1 {
  validateDeviceId(deviceId);
  finite(acceptedFlowMlPerSec, "accepted flow");
  return Object.freeze({
    stateId: DYNAMIC_ROTARY_PUMP_ACCEPTED_FLOW_STATE_V1_ID,
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    deviceId,
    acceptedFlowMlPerSec,
  });
}

/**
 * A disabled circuit is absent topology and therefore always proposes the
 * same canonical zero accepted-flow state. Sharing these deeply frozen values
 * removes four short-lived objects from every all-off Newton candidate while
 * preserving the exact public state content.
 */
const DISABLED_ACCEPTED_FLOW_STATE_BY_DEVICE_V1 = Object.freeze({
  LVAD: createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 0),
  IMPELLA: createDynamicRotaryPumpAcceptedFlowStateV1("IMPELLA", 0),
  VA_ECMO: createDynamicRotaryPumpAcceptedFlowStateV1("VA_ECMO", 0),
  VV_ECMO: createDynamicRotaryPumpAcceptedFlowStateV1("VV_ECMO", 0),
}) satisfies Readonly<Record<
  RotarySupportDeviceIdV1,
  DynamicRotaryPumpAcceptedFlowStateV1
>>;

/**
 * Backward-Euler rotary-pump flow law with the accepted q_n statically
 * condensed into one signed linear-quadratic root:
 *
 * (R + L/dt) q_(n+1) + B q_(n+1)|q_(n+1)|
 *   = H_ideal + P_in - P_out + (L/dt) q_n.
 *
 * The returned pressure reaction closes the original, uncondensed equation
 * whenever legacy inlet availability, a capacity limit, or a circuit clamp
 * owns the flow. A pressure-dependent suction resistance is part of R and
 * therefore creates no constraint reaction.
 */
export function evaluateDynamicRotaryPumpV1(
  deviceId: RotarySupportDeviceIdV1,
  config: RotaryPumpDeviceConfigV1,
  previousAcceptedState: DynamicRotaryPumpAcceptedFlowStateV1,
  input: DynamicRotaryPumpInputV1,
): DynamicRotaryPumpEvaluationV1 {
  validateDeviceId(deviceId);
  validateRotaryPumpConfigV1(config, deviceId);
  validateAcceptedState(previousAcceptedState, deviceId);
  const dtSec = positive(input.dtSec, "dtSec");
  validateInertance(input.inertance);
  const inletPressureMmHg = finite(
    input.inletPressureMmHg,
    "inlet pressure",
  );
  const outletPressureMmHg = finite(
    input.outletPressureMmHg,
    "outlet pressure",
  );
  if (input.inletVolumeMl !== undefined) {
    nonnegative(input.inletVolumeMl, "inlet volume");
  }

  const previousFlowMlPerSec = previousAcceptedState.acceptedFlowMlPerSec;
  const totalInertanceMmHgSec2PerMl = finite(
    input.inertance.pumpInternalMmHgSec2PerMl
      + input.inertance.drainageMmHgSec2PerMl
      + input.inertance.oxygenatorMmHgSec2PerMl
      + input.inertance.returnPathMmHgSec2PerMl,
    "total inertance",
  );
  const pressureRiseRequiredMmHg = outletPressureMmHg - inletPressureMmHg;

  if (!config.enabled) {
    return inactiveEvaluation(
      "disabled",
      deviceId,
      config,
      previousFlowMlPerSec,
      input,
      totalInertanceMmHgSec2PerMl,
      inletPressureMmHg,
      outletPressureMmHg,
      pressureRiseRequiredMmHg,
    );
  }

  const coefficients = pumpCoefficients(config);
  if (config.circuitClamped) {
    return clampedEvaluation(
      deviceId,
      config,
      coefficients.idealPumpHeadMmHg,
      previousFlowMlPerSec,
      input,
      totalInertanceMmHgSec2PerMl,
      inletPressureMmHg,
      outletPressureMmHg,
      pressureRiseRequiredMmHg,
    );
  }

  const inertancePerStepMmHgSecPerMl =
    totalInertanceMmHgSec2PerMl / dtSec;
  const suction = evaluateRotaryPumpInletSuctionV1(
    config.inletSuction,
    input,
  );
  const condensedLinearMmHgSecPerMl =
    coefficients.effectiveLinearMmHgSecPerMl
    + inertancePerStepMmHgSecPerMl
    + suction.resistanceMmHgSecPerMl;
  const condensedPressureDriveMmHg = coefficients.idealPumpHeadMmHg
    - pressureRiseRequiredMmHg
    + inertancePerStepMmHgSecPerMl * previousFlowMlPerSec;
  const unrestrictedFlowMlPerSec = solveSignedLinearQuadraticFlowV1(
    condensedPressureDriveMmHg,
    condensedLinearMmHgSecPerMl,
    coefficients.quadraticMmHgSec2PerMl2,
  );
  const rootSlopeDenominator = condensedLinearMmHgSecPerMl
    + 2 * coefficients.quadraticMmHgSec2PerMl2
      * Math.abs(unrestrictedFlowMlPerSec);
  const unrestrictedPressureTangent = (
    1 - unrestrictedFlowMlPerSec * suction.dResistanceDInletPressure
  ) / rootSlopeDenominator;
  const unrestrictedOutletPressureTangent = -1 / rootSlopeDenominator;
  const unrestrictedPreviousFlowTangent =
    inertancePerStepMmHgSecPerMl / rootSlopeDenominator;
  const availability = suction.availability;
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
  let dFlowDPreviousFlow: number;
  let constraintOwner: DynamicRotaryPumpConstraintOwnerV1;
  if (unrestrictedFlowMlPerSec >= 0) {
    const availabilityLimitedFlow =
      unrestrictedFlowMlPerSec * availability.value;
    if (forwardCapacityMlPerSec !== null
        && availabilityLimitedFlow >= forwardCapacityMlPerSec) {
      flowMlPerSec = forwardCapacityMlPerSec;
      dFlowDInletPressure = 0;
      dFlowDOutletPressure = 0;
      dFlowDInletVolume = 0;
      dFlowDPreviousFlow = 0;
      constraintOwner = "forward-cap";
    } else {
      flowMlPerSec = availabilityLimitedFlow;
      dFlowDInletPressure = availability.value
          * unrestrictedPressureTangent
        + unrestrictedFlowMlPerSec * availability.dInletPressure;
      dFlowDOutletPressure = availability.value
        * unrestrictedOutletPressureTangent;
      dFlowDInletVolume = unrestrictedFlowMlPerSec
        * availability.dInletVolume;
      dFlowDPreviousFlow = availability.value
        * unrestrictedPreviousFlowTangent;
      constraintOwner = availability.value < 1
        ? availability.owner ?? "none"
        : "none";
    }
  } else if (unrestrictedFlowMlPerSec <= -reverseCapacityMlPerSec) {
    flowMlPerSec = -reverseCapacityMlPerSec;
    dFlowDInletPressure = 0;
    dFlowDOutletPressure = 0;
    dFlowDInletVolume = 0;
    dFlowDPreviousFlow = 0;
    constraintOwner = "reverse-cap";
  } else {
    // Inlet suction limits drainage only; they must not suppress back-flow.
    flowMlPerSec = unrestrictedFlowMlPerSec;
    dFlowDInletPressure = unrestrictedPressureTangent;
    dFlowDOutletPressure = unrestrictedOutletPressureTangent;
    dFlowDInletVolume = 0;
    dFlowDPreviousFlow = unrestrictedPreviousFlowTangent;
    constraintOwner = "none";
  }

  return activeEvaluation(
    deviceId,
    config,
    previousFlowMlPerSec,
    input,
    coefficients,
    totalInertanceMmHgSec2PerMl,
    inletPressureMmHg,
    outletPressureMmHg,
    pressureRiseRequiredMmHg,
    unrestrictedFlowMlPerSec,
    flowMlPerSec,
    dFlowDInletPressure,
    dFlowDOutletPressure,
    dFlowDInletVolume,
    dFlowDPreviousFlow,
    availability.value,
    constraintOwner,
    suction.resistanceMmHgSecPerMl,
  );
}

type PumpCoefficients = Readonly<{
  idealPumpHeadMmHg: number;
  linearSpeedScale: number;
  effectiveLinearMmHgSecPerMl: number;
  quadraticMmHgSec2PerMl2: number;
}>;

function pumpCoefficients(config: RotaryPumpDeviceConfigV1): PumpCoefficients {
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
  return Object.freeze({
    idealPumpHeadMmHg,
    linearSpeedScale,
    effectiveLinearMmHgSecPerMl: Math.max(linear, 1e-6),
    quadraticMmHgSec2PerMl2: quadratic,
  });
}

function activeEvaluation(
  deviceId: RotarySupportDeviceIdV1,
  config: RotaryPumpDeviceConfigV1,
  previousFlowMlPerSec: number,
  input: DynamicRotaryPumpInputV1,
  coefficients: PumpCoefficients,
  totalInertanceMmHgSec2PerMl: number,
  inletPressureMmHg: number,
  outletPressureMmHg: number,
  pressureRiseRequiredMmHg: number,
  unrestrictedFlowMlPerSec: number,
  flowMlPerSec: number,
  dFlowDInletPressure: number,
  dFlowDOutletPressure: number,
  dFlowDInletVolume: number,
  dFlowDPreviousFlow: number,
  inletAvailability01: number,
  constraintOwner: DynamicRotaryPumpConstraintOwnerV1,
  inletSuctionResistanceMmHgSecPerMl: number,
): DynamicRotaryPumpEvaluationV1 {
  const flowAccelerationMlPerSec2 =
    (flowMlPerSec - previousFlowMlPerSec) / input.dtSec;
  const hydraulics = reconstructHydraulics(
    config,
    input.inertance,
    coefficients,
    flowMlPerSec,
    flowAccelerationMlPerSec2,
    inletPressureMmHg,
    pressureRiseRequiredMmHg,
    inletSuctionResistanceMmHgSecPerMl,
  );
  const flowLMin = mlPerSecToLMin(flowMlPerSec);
  const unrestrictedFlowLMin = mlPerSecToLMin(unrestrictedFlowMlPerSec);
  const flowWasLimited = Math.abs(flowLMin - unrestrictedFlowLMin) > 1e-12;
  const constraintReactionMmHg = flowWasLimited
    ? hydraulics.unconstrainedHydraulicResidualMmHg
    : 0;

  return Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    deviceId,
    enabled: true,
    circuitClamped: false,
    speedRpm: config.speedRpm,
    inletNode: config.inletNode,
    outletNode: config.outletNode,
    dtSec: input.dtSec,
    inletPressureMmHg,
    outletPressureMmHg,
    pressureRiseRequiredMmHg,
    idealPumpHeadMmHg: coefficients.idealPumpHeadMmHg,
    previousAcceptedFlowMlPerSec: previousFlowMlPerSec,
    candidateAcceptedState: createDynamicRotaryPumpAcceptedFlowStateV1(
      deviceId,
      flowMlPerSec,
    ),
    flowMlPerSec,
    flowLMin,
    unrestrictedFlowMlPerSec,
    unrestrictedFlowLMin,
    flowAccelerationMlPerSec2,
    totalInertanceMmHgSec2PerMl,
    dFlowMlPerSecDInletPressureMlPerSecPerMmHg: dFlowDInletPressure,
    dFlowMlPerSecDOutletPressureMlPerSecPerMmHg: dFlowDOutletPressure,
    dFlowMlPerSecDInletVolumePerSec: dFlowDInletVolume,
    dFlowMlPerSecDPreviousFlow: dFlowDPreviousFlow,
    inletAvailability01,
    inletCollapseActive: unrestrictedFlowMlPerSec > 0
      && (inletAvailability01 < 0.999
        || inletSuctionResistanceMmHgSecPerMl > 0),
    inletSuctionMechanismKind: config.inletSuction.kind,
    inletSuctionResistanceMmHgSecPerMl,
    inletSuctionPressureDropMmHg:
      hydraulics.inletSuctionPressureDropMmHg,
    ...rotaryPumpForwardFlowEvidenceDiagnosticsV1(config, flowLMin),
    constraintOwner,
    constraintReactionMmHg,
    flowLimitPressureReactionMmHg: constraintReactionMmHg,
    drainagePressureDropMmHg: hydraulics.drainagePressureDropMmHg,
    oxygenatorPressureDropMmHg: hydraulics.oxygenatorPressureDropMmHg,
    returnPathPressureDropMmHg: hydraulics.returnPathPressureDropMmHg,
    prePumpPressureMmHg: hydraulics.prePumpPressureMmHg,
    postPumpPressureMmHg: hydraulics.postPumpPressureMmHg,
    postOxygenatorPressureMmHg: hydraulics.postOxygenatorPressureMmHg,
    unconstrainedHydraulicResidualMmHg:
      hydraulics.unconstrainedHydraulicResidualMmHg,
    hydraulicResidualMmHg:
      hydraulics.unconstrainedHydraulicResidualMmHg
      - constraintReactionMmHg,
  });
}

function inactiveEvaluation(
  constraintOwner: "disabled",
  deviceId: RotarySupportDeviceIdV1,
  config: RotaryPumpDeviceConfigV1,
  previousFlowMlPerSec: number,
  input: DynamicRotaryPumpInputV1,
  totalInertanceMmHgSec2PerMl: number,
  inletPressureMmHg: number,
  outletPressureMmHg: number,
  pressureRiseRequiredMmHg: number,
): DynamicRotaryPumpEvaluationV1 {
  return Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    deviceId,
    enabled: false,
    circuitClamped: config.circuitClamped,
    speedRpm: config.speedRpm,
    inletNode: config.inletNode,
    outletNode: config.outletNode,
    dtSec: input.dtSec,
    inletPressureMmHg,
    outletPressureMmHg,
    pressureRiseRequiredMmHg,
    idealPumpHeadMmHg: 0,
    previousAcceptedFlowMlPerSec: previousFlowMlPerSec,
    candidateAcceptedState: DISABLED_ACCEPTED_FLOW_STATE_BY_DEVICE_V1[deviceId],
    flowMlPerSec: 0,
    flowLMin: 0,
    unrestrictedFlowMlPerSec: 0,
    unrestrictedFlowLMin: 0,
    // Disabled means absent topology, not deceleration through an inertance.
    flowAccelerationMlPerSec2: 0,
    totalInertanceMmHgSec2PerMl,
    dFlowMlPerSecDInletPressureMlPerSecPerMmHg: 0,
    dFlowMlPerSecDOutletPressureMlPerSecPerMmHg: 0,
    dFlowMlPerSecDInletVolumePerSec: 0,
    dFlowMlPerSecDPreviousFlow: 0,
    inletAvailability01: 1,
    inletCollapseActive: false,
    inletSuctionMechanismKind: config.inletSuction.kind,
    inletSuctionResistanceMmHgSecPerMl: 0,
    inletSuctionPressureDropMmHg: 0,
    ...rotaryPumpForwardFlowEvidenceDiagnosticsV1(config, 0),
    constraintOwner,
    constraintReactionMmHg: 0,
    flowLimitPressureReactionMmHg: 0,
    drainagePressureDropMmHg: 0,
    oxygenatorPressureDropMmHg: 0,
    returnPathPressureDropMmHg: 0,
    prePumpPressureMmHg: inletPressureMmHg,
    postPumpPressureMmHg: inletPressureMmHg,
    postOxygenatorPressureMmHg: inletPressureMmHg,
    unconstrainedHydraulicResidualMmHg: 0,
    hydraulicResidualMmHg: 0,
  });
}

function clampedEvaluation(
  deviceId: RotarySupportDeviceIdV1,
  config: RotaryPumpDeviceConfigV1,
  idealPumpHeadMmHg: number,
  previousFlowMlPerSec: number,
  input: DynamicRotaryPumpInputV1,
  totalInertanceMmHgSec2PerMl: number,
  inletPressureMmHg: number,
  outletPressureMmHg: number,
  pressureRiseRequiredMmHg: number,
): DynamicRotaryPumpEvaluationV1 {
  const coefficients = pumpCoefficients(config);
  const suction = evaluateRotaryPumpInletSuctionV1(
    config.inletSuction,
    input,
  );
  const flowAccelerationMlPerSec2 = -previousFlowMlPerSec / input.dtSec;
  const hydraulics = reconstructHydraulics(
    config,
    input.inertance,
    coefficients,
    0,
    flowAccelerationMlPerSec2,
    inletPressureMmHg,
    pressureRiseRequiredMmHg,
    suction.resistanceMmHgSecPerMl,
  );
  const reaction = hydraulics.unconstrainedHydraulicResidualMmHg;
  return Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    deviceId,
    enabled: true,
    circuitClamped: true,
    speedRpm: config.speedRpm,
    inletNode: config.inletNode,
    outletNode: config.outletNode,
    dtSec: input.dtSec,
    inletPressureMmHg,
    outletPressureMmHg,
    pressureRiseRequiredMmHg,
    idealPumpHeadMmHg,
    previousAcceptedFlowMlPerSec: previousFlowMlPerSec,
    candidateAcceptedState: createDynamicRotaryPumpAcceptedFlowStateV1(
      deviceId,
      0,
    ),
    flowMlPerSec: 0,
    flowLMin: 0,
    unrestrictedFlowMlPerSec: 0,
    unrestrictedFlowLMin: 0,
    flowAccelerationMlPerSec2,
    totalInertanceMmHgSec2PerMl,
    dFlowMlPerSecDInletPressureMlPerSecPerMmHg: 0,
    dFlowMlPerSecDOutletPressureMlPerSecPerMmHg: 0,
    dFlowMlPerSecDInletVolumePerSec: 0,
    dFlowMlPerSecDPreviousFlow: 0,
    inletAvailability01: 1,
    inletCollapseActive: false,
    inletSuctionMechanismKind: config.inletSuction.kind,
    inletSuctionResistanceMmHgSecPerMl:
      suction.resistanceMmHgSecPerMl,
    inletSuctionPressureDropMmHg:
      hydraulics.inletSuctionPressureDropMmHg,
    ...rotaryPumpForwardFlowEvidenceDiagnosticsV1(config, 0),
    constraintOwner: "clamp",
    constraintReactionMmHg: reaction,
    flowLimitPressureReactionMmHg: reaction,
    drainagePressureDropMmHg: hydraulics.drainagePressureDropMmHg,
    oxygenatorPressureDropMmHg: hydraulics.oxygenatorPressureDropMmHg,
    returnPathPressureDropMmHg: hydraulics.returnPathPressureDropMmHg,
    prePumpPressureMmHg: hydraulics.prePumpPressureMmHg,
    postPumpPressureMmHg: hydraulics.postPumpPressureMmHg,
    postOxygenatorPressureMmHg: hydraulics.postOxygenatorPressureMmHg,
    unconstrainedHydraulicResidualMmHg: reaction,
    hydraulicResidualMmHg: 0,
  });
}

type ReconstructedHydraulics = Readonly<{
  inletSuctionPressureDropMmHg: number;
  drainagePressureDropMmHg: number;
  oxygenatorPressureDropMmHg: number;
  returnPathPressureDropMmHg: number;
  prePumpPressureMmHg: number;
  postPumpPressureMmHg: number;
  postOxygenatorPressureMmHg: number;
  unconstrainedHydraulicResidualMmHg: number;
}>;

function reconstructHydraulics(
  config: RotaryPumpDeviceConfigV1,
  inertance: DynamicRotaryPumpCircuitInertanceV1,
  coefficients: PumpCoefficients,
  flowMlPerSec: number,
  flowAccelerationMlPerSec2: number,
  inletPressureMmHg: number,
  pressureRiseRequiredMmHg: number,
  inletSuctionResistanceMmHgSecPerMl: number,
): ReconstructedHydraulics {
  const inletSuctionPressureDropMmHg =
    inletSuctionResistanceMmHgSecPerMl * flowMlPerSec;
  const drainagePressureDropMmHg = dynamicSegmentDrop(
    config.drainage,
    inertance.drainageMmHgSec2PerMl,
    flowMlPerSec,
    flowAccelerationMlPerSec2,
  );
  const oxygenatorPressureDropMmHg = dynamicSegmentDrop(
    config.oxygenator,
    inertance.oxygenatorMmHgSec2PerMl,
    flowMlPerSec,
    flowAccelerationMlPerSec2,
  );
  const returnPathPressureDropMmHg = dynamicSegmentDrop(
    config.returnPath,
    inertance.returnPathMmHgSec2PerMl,
    flowMlPerSec,
    flowAccelerationMlPerSec2,
  );
  const pumpInternalLossMmHg =
    config.curve.linearLossMmHgSecPerMl
      * coefficients.linearSpeedScale * flowMlPerSec
    + config.curve.quadraticLossMmHgSec2PerMl2
      * flowMlPerSec * Math.abs(flowMlPerSec)
    + inertance.pumpInternalMmHgSec2PerMl * flowAccelerationMlPerSec2;
  const deliveredPumpHeadMmHg = coefficients.idealPumpHeadMmHg
    - pumpInternalLossMmHg;
  const prePumpPressureMmHg = inletPressureMmHg
    - inletSuctionPressureDropMmHg - drainagePressureDropMmHg;
  const postPumpPressureMmHg = prePumpPressureMmHg
    + deliveredPumpHeadMmHg;
  const postOxygenatorPressureMmHg = postPumpPressureMmHg
    - oxygenatorPressureDropMmHg;
  const totalPathDropMmHg = inletSuctionPressureDropMmHg
    + drainagePressureDropMmHg
    + oxygenatorPressureDropMmHg
    + returnPathPressureDropMmHg;
  return Object.freeze({
    inletSuctionPressureDropMmHg,
    drainagePressureDropMmHg,
    oxygenatorPressureDropMmHg,
    returnPathPressureDropMmHg,
    prePumpPressureMmHg,
    postPumpPressureMmHg,
    postOxygenatorPressureMmHg,
    unconstrainedHydraulicResidualMmHg: deliveredPumpHeadMmHg
      - pressureRiseRequiredMmHg
      - totalPathDropMmHg,
  });
}

function dynamicSegmentDrop(
  segment: HydraulicSegmentV1,
  inertanceMmHgSec2PerMl: number,
  flowMlPerSec: number,
  flowAccelerationMlPerSec2: number,
): number {
  return segment.linearResistanceMmHgSecPerMl * flowMlPerSec
    + segment.quadraticResistanceMmHgSec2PerMl2
      * flowMlPerSec * Math.abs(flowMlPerSec)
    + inertanceMmHgSec2PerMl * flowAccelerationMlPerSec2;
}

function validateAcceptedState(
  state: DynamicRotaryPumpAcceptedFlowStateV1,
  deviceId: RotarySupportDeviceIdV1,
): void {
  if (state === null || typeof state !== "object") {
    throw new Error("previous accepted flow state must be an object");
  }
  if (state.stateId !== DYNAMIC_ROTARY_PUMP_ACCEPTED_FLOW_STATE_V1_ID) {
    throw new Error("previous accepted flow stateId is incompatible");
  }
  if (state.unitSystemId !== DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID) {
    throw new Error("previous accepted flow unitSystemId is incompatible");
  }
  if (state.deviceId !== deviceId) {
    throw new Error(
      `previous accepted flow belongs to ${state.deviceId}, not ${deviceId}`,
    );
  }
  finite(state.acceptedFlowMlPerSec, "previous accepted flow");
}

function validateInertance(
  inertance: DynamicRotaryPumpCircuitInertanceV1,
): void {
  if (inertance === null || typeof inertance !== "object") {
    throw new Error("inertance must be an object");
  }
  if (inertance.unitSystemId !== DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID) {
    throw new Error("inertance.unitSystemId is incompatible");
  }
  nonnegative(
    inertance.pumpInternalMmHgSec2PerMl,
    "inertance.pumpInternalMmHgSec2PerMl",
  );
  nonnegative(
    inertance.drainageMmHgSec2PerMl,
    "inertance.drainageMmHgSec2PerMl",
  );
  nonnegative(
    inertance.oxygenatorMmHgSec2PerMl,
    "inertance.oxygenatorMmHgSec2PerMl",
  );
  nonnegative(
    inertance.returnPathMmHgSec2PerMl,
    "inertance.returnPathMmHgSec2PerMl",
  );
}

function validateDeviceId(deviceId: RotarySupportDeviceIdV1): void {
  if (
    deviceId !== "LVAD"
    && deviceId !== "IMPELLA"
    && deviceId !== "VA_ECMO"
    && deviceId !== "VV_ECMO"
  ) throw new Error(`unsupported rotary support deviceId: ${deviceId}`);
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
