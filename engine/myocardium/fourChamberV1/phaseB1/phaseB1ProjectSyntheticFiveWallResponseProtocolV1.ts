import {
  exactEventCalciumNormalizationV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1,
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID,
  assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1,
  type PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  encodePhaseB1StoredDifferentialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID,
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  BLOOD_COMPARTMENT_IDS,
  FOUR_CHAMBER_SIGN_CONVENTIONS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberFlowId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_PROTOCOL_V1_ID =
  "phase-b1-project-synthetic-five-wall-event-train-response-protocol-v1" as const;
export const PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_SCHEMA_V1_ID =
  "phase-b1-project-synthetic-five-wall-response-definition-v1" as const;
export const PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_RESULT_SCHEMA_V1_ID =
  "phase-b1-project-synthetic-five-wall-response-result-v1" as const;
export const PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_TRACE_V1_ID =
  "phase-b1-project-synthetic-five-wall-response-trace-v1" as const;

export const PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_NOMINAL_DT_SEC_V1 =
  0.001 as const;
export const PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1 =
  0.1 as const;
export const PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1 =
  1e-4 as const;
export const PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_HYDRAULIC_SCALED_THRESHOLD_V1 =
  1e-4 as const;

const LEFT_FLOW_GROUP = Object.freeze(["Q_MV", "Q_AoV"] as const);
const RIGHT_FLOW_GROUP = Object.freeze(["Q_TV", "Q_PuV"] as const);
const LEFT_VOLUME_GROUP = Object.freeze(["LA", "LV"] as const);
const RIGHT_VOLUME_GROUP = Object.freeze(["RA", "RV"] as const);

const CLAIM_BOUNDARY = deepFreeze({
  positiveClaim:
    "scale-separated-response-detected-in-one-declared-project-synthetic-event-train-interval",
  positiveClaimAppliesOnlyWhenOverallDetectionPasses: true,
  prescribedCalciumEventOwnershipRequired: true,
  temporallyOrderedLocalMaterialResponseRequired: true,
  bilateralHydraulicExcursionRequired: true,
  perWallEventCausalEffectClaimed: false,
  wallSpecificHemodynamicAttributionClaimed: false,
  physiologicalValidationClaimed: false,
  fullBeatAcceptanceClaimed: false,
  periodicityOrPeriodOneClaimed: false,
  cycleEnergyAcceptanceClaimed: false,
  phaseB1AcceptanceClaimed: false,
  modelCoreOrBrowserRuntimeAdopted: false,
  releaseRuntimeReachable: false,
} as const);

const BUILDER_ISSUED_RESPONSE_DEFINITIONS = new WeakSet<object>();
const BUILDER_ISSUED_RESPONSE_RESULTS = new WeakSet<object>();

export type PhaseB1FiveWallResponseCalciumStateV1 = Readonly<{
  r: number;
  d: number;
}>;

export type PhaseB1FiveWallResponseWallPolicyV1 = Readonly<{
  wallId: FourChamberWallId;
  eventKey: string;
  eventTimeSec: number;
  eventStrength: number;
  tissueClass: "atrial" | "ventricular";
  tauRiseSec: number;
  tauDecaySec: number;
  isolatedUnitPeakTimeSec: number;
  calciumAmplitudeUM: number;
  freeCalciumWindowStartExclusiveSec: number;
  freeCalciumWindowEndInclusiveSec: number;
  activeStressWindowEndInclusiveSec: number;
  freeCalciumIncreaseThresholdUM: number;
  activeStressScalePa: number;
  activeStressIncreaseThresholdPa: number;
}>;

export type PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1 = Readonly<{
  schemaId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_SCHEMA_V1_ID;
  protocolId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_PROTOCOL_V1_ID;
  status: "project-synthetic-detection-policy-not-physiological-acceptance";
  sourceBindings: Readonly<{
    eventScheduleId:
      typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID;
    eventScheduleContentSha256: string;
    wallMaterialBindingContentSha256: string;
    newtonScaleRegistryContentSha256: string;
    eventScheduleRunnerId:
      typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID;
    eventScheduleRunnerPolicyId:
      typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.policyId;
  }>;
  interval: Readonly<{
    cycleIndex: 0;
    startTimeSec: 0;
    endTimeSec:
      typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1;
    durationSec:
      typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1;
    nominalDtSec:
      typeof PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_NOMINAL_DT_SEC_V1;
    oneDeclaredScheduleIntervalOnly: true;
    periodicityInferredFromSingleInterval: false;
  }>;
  samplingPolicy: Readonly<{
    baseline: "event-transaction-left-limit-at-t-e";
    postEventSamples:
      "committed-backward-euler-left-limit-endpoints-strictly-after-t-e";
    interpolation: "none";
    smoothing: "none";
    freeCalciumWindow: "t-e-open-through-t-e-plus-two-isolated-peak-times-closed";
    activeStressWindow:
      "first-free-calcium-threshold-crossing-through-t-e-plus-two-decay-times-closed";
    otherWallEventsInsideWindow:
      "retained-as-declared-train-no-wall-specific-causal-attribution";
  }>;
  thresholdPolicy: Readonly<{
    freeCalciumFractionOfOwnedEventAmplitude:
      typeof PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1;
    activeStressScaledThreshold:
      typeof PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1;
    hydraulicScaledThreshold:
      typeof PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_HYDRAULIC_SCALED_THRESHOLD_V1;
    initialHydraulicScaledFlowTolerance: number;
    thresholdComparison: "greater-than-or-equal";
    exactOwnedJumpComparison: "Object.is(post,pre+strength)";
    exactOtherWallJumpComparison: "Object.is(post,pre)";
  }>;
  wallOrder: typeof WALL_IDS;
  wallPolicyByWall: Readonly<Record<
    FourChamberWallId,
    PhaseB1FiveWallResponseWallPolicyV1
  >>;
  hydraulicPolicy: Readonly<{
    directedFlowSignConvention:
      typeof FOUR_CHAMBER_SIGN_CONVENTIONS.directedFlow;
    flowScaleM3PerSec: number;
    bloodVolumeScaleM3ByCompartment:
      Readonly<Record<BloodCompartmentId, number>>;
    leftFlowGroup: typeof LEFT_FLOW_GROUP;
    rightFlowGroup: typeof RIGHT_FLOW_GROUP;
    leftVolumeGroup: typeof LEFT_VOLUME_GROUP;
    rightVolumeGroup: typeof RIGHT_VOLUME_GROUP;
    allEightFlowsRecorded: true;
    allEightVolumesRecorded: true;
    wallSpecificHydraulicCausalityClaimed: false;
  }>;
  claimBoundary: typeof CLAIM_BOUNDARY;
  hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  contentSha256: string;
}>;

type DefinitionHashPayload = Omit<
  PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
  "contentSha256"
>;

export type PhaseB1FiveWallResponseTraceSampleV1 = Readonly<{
  sampleIndex: number;
  timeSec: number;
  freeCalciumUMByWall: Readonly<Record<FourChamberWallId, number>>;
  activeKirchhoffStressPaByWall: Readonly<Record<FourChamberWallId, number>>;
  flowsM3PerSec: Readonly<Record<FourChamberFlowId, number>>;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
}>;

export type PhaseB1FiveWallResponseEventJumpTraceV1 = Readonly<{
  wallId: FourChamberWallId;
  eventKey: string;
  eventTimeSec: number;
  eventStrength: number;
  calciumByWallAtEndLeftLimit: Readonly<Record<
    FourChamberWallId,
    PhaseB1FiveWallResponseCalciumStateV1
  >>;
  calciumByWallAfterEventBatch: Readonly<Record<
    FourChamberWallId,
    PhaseB1FiveWallResponseCalciumStateV1
  >>;
}>;

export type PhaseB1ProjectSyntheticFiveWallResponseTraceV1 = Readonly<{
  traceId: typeof PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_TRACE_V1_ID;
  initialSample: PhaseB1FiveWallResponseTraceSampleV1;
  committedLeftLimitSamples: readonly PhaseB1FiveWallResponseTraceSampleV1[];
  eventJumpTraceByWall: Readonly<Record<
    FourChamberWallId,
    PhaseB1FiveWallResponseEventJumpTraceV1
  >>;
  sourceIsCommittedRunnerSuccess: boolean;
  uncommittedRetryAttemptSamplesIncluded: false;
}>;

export type PhaseB1FiveWallResponseWallResultV1 = Readonly<{
  wallId: FourChamberWallId;
  exactOwnedCalciumJumpVerified: boolean;
  exactOtherWallCalciumJumpInvarianceVerified: boolean;
  eventOwnershipVerified: boolean;
  baselineFreeCalciumUM: number;
  maximumFreeCalciumIncreaseUM: number;
  freeCalciumIncreaseThresholdUM: number;
  freeCalciumWindowSampleCount: number;
  firstFreeCalciumThresholdCrossingTimeSec: number | null;
  freeCalciumResponseDetected: boolean;
  baselineActiveKirchhoffStressPa: number;
  maximumTemporallyOrderedActiveStressIncreasePa: number;
  activeStressIncreaseThresholdPa: number;
  activeStressWindowSampleCount: number;
  temporallyOrderedActiveStressResponseDetected: boolean;
  localScaleSeparatedResponseDetected: boolean;
  perWallCausalEffectClaimed: false;
}>;

export type PhaseB1FiveWallResponseMetricsV1 = Readonly<{
  wallResultByWall: Readonly<Record<
    FourChamberWallId,
    PhaseB1FiveWallResponseWallResultV1
  >>;
  everyWallEventOwnershipVerified: boolean;
  everyWallFreeCalciumResponseDetected: boolean;
  everyWallTemporallyOrderedActiveStressResponseDetected: boolean;
  everyWallLocalScaleSeparatedResponseDetected: boolean;
  initialHydraulicScaledFlowInfinityNorm: number;
  initialHydraulicBaselineWithinTolerance: boolean;
  maximumLeftFlowScaledExcursion: number;
  maximumRightFlowScaledExcursion: number;
  maximumLeftVolumeScaledExcursion: number;
  maximumRightVolumeScaledExcursion: number;
  leftFlowResponseDetected: boolean;
  rightFlowResponseDetected: boolean;
  leftVolumeResponseDetected: boolean;
  rightVolumeResponseDetected: boolean;
  bilateralHydraulicResponseDetected: boolean;
  scaleSeparatedResponseMetricsPass: boolean;
  sourceRunnerProvenanceCertified: false;
  projectSyntheticFiveWallEventTrainScaleSeparatedResponseDetected: false;
  perWallEventCausalEffectClaimed: false;
  wallSpecificHemodynamicAttributionClaimed: false;
  physiologicalValidationClaimed: false;
  fullBeatAcceptanceClaimed: false;
  periodicityOrPeriodOneClaimed: false;
  cycleEnergyAcceptanceClaimed: false;
  phaseB1AcceptanceClaimed: false;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1FiveWallResponseSummaryV1 = Readonly<
  Omit<
    PhaseB1FiveWallResponseMetricsV1,
    | "sourceRunnerProvenanceCertified"
    | "projectSyntheticFiveWallEventTrainScaleSeparatedResponseDetected"
  > & {
    sourceRunnerProvenanceCertified: true;
    projectSyntheticFiveWallEventTrainScaleSeparatedResponseDetected: boolean;
  }
>;

export type PhaseB1ProjectSyntheticFiveWallResponseResultV1 = Readonly<{
  schemaId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_RESULT_SCHEMA_V1_ID;
  protocolDefinition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1;
  sourceRun: Readonly<{
    slsMode: "on" | "off";
    acceptedTransactionCount: number;
    attemptedTransactionCount: number;
    explicitSolverRetryUsed: boolean;
    committedTransactionProvenanceAuditPass: true;
    allOrderedEventsCommittedExactlyOnce: true;
    registryObjectReusedAcrossAllAttempts: true;
    testFailureProbeUsed: false;
  }>;
  traceDigests: Readonly<{
    responseTraceSha256: string;
    orderedStepTraceSha256: string;
    eventBatchTraceSha256: string;
    finalEndpointSha256: string;
  }>;
  response: PhaseB1FiveWallResponseSummaryV1;
  claimBoundary: typeof CLAIM_BOUNDARY;
  hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  contentSha256: string;
}>;

type ResultHashPayload = Omit<
  PhaseB1ProjectSyntheticFiveWallResponseResultV1,
  "contentSha256"
>;

export function buildPhaseB1ProjectSyntheticFiveWallResponseDefinitionV1(
  input: Readonly<{
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    wallMaterialBinding: PhaseB1WallMaterialBindingV1;
    newtonScaleRegistry: FourChamberNewtonScaleRegistryV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1 {
  assertExactPlainRecordV1(input, [
    "schedule",
    "wallMaterialBinding",
    "newtonScaleRegistry",
    "sha256Hex",
  ], "five-wall response definition input");
  requireHashProvider(input.sha256Hex);
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const binding = assertPhaseB1WallMaterialBindingV1(
    input.wallMaterialBinding,
  );
  const registry = assertCanonicalFourChamberNewtonScaleRegistryV1(
    input.newtonScaleRegistry,
  );
  if (
    binding.contentSha256
      !== schedule.sourceBindings.phaseB1WallMaterialBindingSha256
  ) throw new Error("response definition wall binding disagrees with schedule");

  const wallPolicyByWall = wallRecord((wallId) => {
    const event = schedule.events.find((candidate) =>
      candidate.wallId === wallId);
    if (event === undefined) throw new Error(`schedule is missing ${wallId}`);
    const material = binding.runtimeByWall[wallId];
    const calcium = material.prescribedCalciumParameters;
    const isolatedUnitPeakTimeSec = exactEventCalciumNormalizationV1(
      calcium,
    ).peakTimeSec;
    const eventTimeSec = event.calciumDriveEvent.calciumDriveTimeSec;
    const freeCalciumWindowEndInclusiveSec = eventTimeSec
      + 2 * isolatedUnitPeakTimeSec;
    const activeStressWindowEndInclusiveSec = eventTimeSec
      + 2 * calcium.tauDecaySec;
    if (
      !(freeCalciumWindowEndInclusiveSec <= schedule.cycleLengthSec)
      || !(activeStressWindowEndInclusiveSec <= schedule.cycleLengthSec)
    ) throw new Error(`${wallId} response window exceeds the declared interval`);
    const activeStressScalePa = registry.residualScales
      .tissueStressByWallPa[wallId];
    return deepFreeze<PhaseB1FiveWallResponseWallPolicyV1>({
      wallId,
      eventKey: event.eventKey,
      eventTimeSec,
      eventStrength: event.calciumDriveEvent.strength,
      tissueClass: material.tissueClass,
      tauRiseSec: calcium.tauRiseSec,
      tauDecaySec: calcium.tauDecaySec,
      isolatedUnitPeakTimeSec,
      calciumAmplitudeUM: calcium.calciumAmplitudeUM,
      freeCalciumWindowStartExclusiveSec: eventTimeSec,
      freeCalciumWindowEndInclusiveSec,
      activeStressWindowEndInclusiveSec,
      freeCalciumIncreaseThresholdUM:
        event.calciumDriveEvent.strength
        * calcium.calciumAmplitudeUM
        * PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1,
      activeStressScalePa,
      activeStressIncreaseThresholdPa:
        activeStressScalePa
        * PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1,
    });
  });
  const payload = deepFreeze<DefinitionHashPayload>({
    schemaId: PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_SCHEMA_V1_ID,
    protocolId: PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_PROTOCOL_V1_ID,
    status: "project-synthetic-detection-policy-not-physiological-acceptance",
    sourceBindings: {
      eventScheduleId: schedule.scheduleId,
      eventScheduleContentSha256: schedule.contentSha256,
      wallMaterialBindingContentSha256: binding.contentSha256,
      newtonScaleRegistryContentSha256: registry.registryContentSha256,
      eventScheduleRunnerId:
        PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID,
      eventScheduleRunnerPolicyId:
        PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.policyId,
    },
    interval: {
      cycleIndex: 0,
      startTimeSec: 0,
      endTimeSec:
        PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
      durationSec:
        PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
      nominalDtSec:
        PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_NOMINAL_DT_SEC_V1,
      oneDeclaredScheduleIntervalOnly: true,
      periodicityInferredFromSingleInterval: false,
    },
    samplingPolicy: {
      baseline: "event-transaction-left-limit-at-t-e",
      postEventSamples:
        "committed-backward-euler-left-limit-endpoints-strictly-after-t-e",
      interpolation: "none",
      smoothing: "none",
      freeCalciumWindow:
        "t-e-open-through-t-e-plus-two-isolated-peak-times-closed",
      activeStressWindow:
        "first-free-calcium-threshold-crossing-through-t-e-plus-two-decay-times-closed",
      otherWallEventsInsideWindow:
        "retained-as-declared-train-no-wall-specific-causal-attribution",
    },
    thresholdPolicy: {
      freeCalciumFractionOfOwnedEventAmplitude:
        PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1,
      activeStressScaledThreshold:
        PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1,
      hydraulicScaledThreshold:
        PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_HYDRAULIC_SCALED_THRESHOLD_V1,
      initialHydraulicScaledFlowTolerance:
        registry.tolerances.globalResidualInfinityNorm,
      thresholdComparison: "greater-than-or-equal",
      exactOwnedJumpComparison: "Object.is(post,pre+strength)",
      exactOtherWallJumpComparison: "Object.is(post,pre)",
    },
    wallOrder: WALL_IDS,
    wallPolicyByWall,
    hydraulicPolicy: {
      directedFlowSignConvention:
        FOUR_CHAMBER_SIGN_CONVENTIONS.directedFlow,
      flowScaleM3PerSec: registry.unknownScales.inertialFlowM3PerSec,
      bloodVolumeScaleM3ByCompartment:
        registry.unknownScales.bloodVolumeM3,
      leftFlowGroup: LEFT_FLOW_GROUP,
      rightFlowGroup: RIGHT_FLOW_GROUP,
      leftVolumeGroup: LEFT_VOLUME_GROUP,
      rightVolumeGroup: RIGHT_VOLUME_GROUP,
      allEightFlowsRecorded: true,
      allEightVolumesRecorded: true,
      wallSpecificHydraulicCausalityClaimed: false,
    },
    claimBoundary: CLAIM_BOUNDARY,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  });
  const definition = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
  BUILDER_ISSUED_RESPONSE_DEFINITIONS.add(definition);
  return definition;
}

export function evaluatePhaseB1ProjectSyntheticFiveWallResponseTraceV1(
  input: Readonly<{
    definition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1;
    trace: PhaseB1ProjectSyntheticFiveWallResponseTraceV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1FiveWallResponseMetricsV1 {
  assertExactPlainRecordV1(input, [
    "definition",
    "trace",
    "sha256Hex",
  ], "five-wall response trace evaluator input");
  requireHashProvider(input.sha256Hex);
  validateDefinition(input.definition, input.sha256Hex);
  validateTrace(input.trace, input.definition);
  const { definition, trace } = input;
  const wallResultByWall = wallRecord((wallId) => {
    const policy = definition.wallPolicyByWall[wallId];
    const jump = trace.eventJumpTraceByWall[wallId];
    const exactOwnedCalciumJumpVerified = ownedJumpExact(jump, wallId);
    const exactOtherWallCalciumJumpInvarianceVerified = WALL_IDS.every(
      (otherWallId) => otherWallId === wallId
        || calciumStateExact(
          jump.calciumByWallAfterEventBatch[otherWallId],
          jump.calciumByWallAtEndLeftLimit[otherWallId],
        ),
    );
    const baseline = trace.committedLeftLimitSamples.find((sample) =>
      Object.is(sample.timeSec, policy.eventTimeSec));
    if (baseline === undefined) {
      throw new Error(`${wallId} trace is missing its exact event left limit`);
    }
    const freeSamples = trace.committedLeftLimitSamples.filter((sample) =>
      sample.timeSec > policy.freeCalciumWindowStartExclusiveSec
      && sample.timeSec <= policy.freeCalciumWindowEndInclusiveSec);
    if (freeSamples.length === 0) {
      throw new Error(`${wallId} free-calcium window has no committed sample`);
    }
    const baselineFreeCalciumUM = baseline.freeCalciumUMByWall[wallId];
    const maximumFreeCalciumIncreaseUM = Math.max(...freeSamples.map(
      (sample) => sample.freeCalciumUMByWall[wallId]
        - baselineFreeCalciumUM,
    ));
    const firstCrossing = freeSamples.find((sample) =>
      sample.freeCalciumUMByWall[wallId] - baselineFreeCalciumUM
        >= policy.freeCalciumIncreaseThresholdUM);
    const baselineActiveKirchhoffStressPa =
      baseline.activeKirchhoffStressPaByWall[wallId];
    const activeSamples = firstCrossing === undefined
      ? []
      : trace.committedLeftLimitSamples.filter((sample) =>
        sample.timeSec >= firstCrossing.timeSec
        && sample.timeSec <= policy.activeStressWindowEndInclusiveSec);
    const maximumTemporallyOrderedActiveStressIncreasePa =
      activeSamples.length === 0
        ? 0
        : Math.max(...activeSamples.map((sample) =>
          sample.activeKirchhoffStressPaByWall[wallId]
            - baselineActiveKirchhoffStressPa));
    const freeCalciumResponseDetected = firstCrossing !== undefined;
    const temporallyOrderedActiveStressResponseDetected =
      maximumTemporallyOrderedActiveStressIncreasePa
        >= policy.activeStressIncreaseThresholdPa;
    const eventOwnershipVerified = exactOwnedCalciumJumpVerified
      && exactOtherWallCalciumJumpInvarianceVerified;
    return deepFreeze<PhaseB1FiveWallResponseWallResultV1>({
      wallId,
      exactOwnedCalciumJumpVerified,
      exactOtherWallCalciumJumpInvarianceVerified,
      eventOwnershipVerified,
      baselineFreeCalciumUM,
      maximumFreeCalciumIncreaseUM,
      freeCalciumIncreaseThresholdUM: policy.freeCalciumIncreaseThresholdUM,
      freeCalciumWindowSampleCount: freeSamples.length,
      firstFreeCalciumThresholdCrossingTimeSec:
        firstCrossing?.timeSec ?? null,
      freeCalciumResponseDetected,
      baselineActiveKirchhoffStressPa,
      maximumTemporallyOrderedActiveStressIncreasePa,
      activeStressIncreaseThresholdPa:
        policy.activeStressIncreaseThresholdPa,
      activeStressWindowSampleCount: activeSamples.length,
      temporallyOrderedActiveStressResponseDetected,
      localScaleSeparatedResponseDetected:
        eventOwnershipVerified
        && freeCalciumResponseDetected
        && temporallyOrderedActiveStressResponseDetected,
      perWallCausalEffectClaimed: false,
    });
  });

  const initial = trace.initialSample;
  const samples = trace.committedLeftLimitSamples;
  const flowScale = definition.hydraulicPolicy.flowScaleM3PerSec;
  const volumeScales = definition.hydraulicPolicy
    .bloodVolumeScaleM3ByCompartment;
  const initialHydraulicScaledFlowInfinityNorm = Math.max(
    ...FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) =>
      Math.abs(initial.flowsM3PerSec[flowId]) / flowScale),
  );
  const maximumFlowExcursion = (flowIds: readonly FourChamberFlowId[]) =>
    Math.max(...samples.flatMap((sample) => flowIds.map((flowId) =>
      Math.abs(
        sample.flowsM3PerSec[flowId] - initial.flowsM3PerSec[flowId],
      ) / flowScale)));
  const maximumVolumeExcursion = (
    compartmentIds: readonly BloodCompartmentId[],
  ) => Math.max(...samples.flatMap((sample) => compartmentIds.map(
    (compartmentId) => Math.abs(
      sample.bloodVolumesM3[compartmentId]
        - initial.bloodVolumesM3[compartmentId],
    ) / volumeScales[compartmentId],
  )));
  const maximumLeftFlowScaledExcursion = maximumFlowExcursion(
    definition.hydraulicPolicy.leftFlowGroup,
  );
  const maximumRightFlowScaledExcursion = maximumFlowExcursion(
    definition.hydraulicPolicy.rightFlowGroup,
  );
  const maximumLeftVolumeScaledExcursion = maximumVolumeExcursion(
    definition.hydraulicPolicy.leftVolumeGroup,
  );
  const maximumRightVolumeScaledExcursion = maximumVolumeExcursion(
    definition.hydraulicPolicy.rightVolumeGroup,
  );
  const hydraulicThreshold = definition.thresholdPolicy
    .hydraulicScaledThreshold;
  const initialHydraulicBaselineWithinTolerance =
    initialHydraulicScaledFlowInfinityNorm
      <= definition.thresholdPolicy.initialHydraulicScaledFlowTolerance;
  const leftFlowResponseDetected =
    maximumLeftFlowScaledExcursion >= hydraulicThreshold;
  const rightFlowResponseDetected =
    maximumRightFlowScaledExcursion >= hydraulicThreshold;
  const leftVolumeResponseDetected =
    maximumLeftVolumeScaledExcursion >= hydraulicThreshold;
  const rightVolumeResponseDetected =
    maximumRightVolumeScaledExcursion >= hydraulicThreshold;
  const bilateralHydraulicResponseDetected =
    initialHydraulicBaselineWithinTolerance
    && leftFlowResponseDetected
    && rightFlowResponseDetected
    && leftVolumeResponseDetected
    && rightVolumeResponseDetected;
  const wallResults = WALL_IDS.map((wallId) => wallResultByWall[wallId]);
  const everyWallEventOwnershipVerified = wallResults.every((result) =>
    result.eventOwnershipVerified);
  const everyWallFreeCalciumResponseDetected = wallResults.every((result) =>
    result.freeCalciumResponseDetected);
  const everyWallTemporallyOrderedActiveStressResponseDetected =
    wallResults.every((result) =>
      result.temporallyOrderedActiveStressResponseDetected);
  const everyWallLocalScaleSeparatedResponseDetected = wallResults.every(
    (result) => result.localScaleSeparatedResponseDetected,
  );
  return deepFreeze({
    wallResultByWall,
    everyWallEventOwnershipVerified,
    everyWallFreeCalciumResponseDetected,
    everyWallTemporallyOrderedActiveStressResponseDetected,
    everyWallLocalScaleSeparatedResponseDetected,
    initialHydraulicScaledFlowInfinityNorm,
    initialHydraulicBaselineWithinTolerance,
    maximumLeftFlowScaledExcursion,
    maximumRightFlowScaledExcursion,
    maximumLeftVolumeScaledExcursion,
    maximumRightVolumeScaledExcursion,
    leftFlowResponseDetected,
    rightFlowResponseDetected,
    leftVolumeResponseDetected,
    rightVolumeResponseDetected,
    bilateralHydraulicResponseDetected,
    scaleSeparatedResponseMetricsPass:
      everyWallLocalScaleSeparatedResponseDetected
      && bilateralHydraulicResponseDetected,
    sourceRunnerProvenanceCertified: false,
    projectSyntheticFiveWallEventTrainScaleSeparatedResponseDetected: false,
    perWallEventCausalEffectClaimed: false,
    wallSpecificHemodynamicAttributionClaimed: false,
    physiologicalValidationClaimed: false,
    fullBeatAcceptanceClaimed: false,
    periodicityOrPeriodOneClaimed: false,
    cycleEnergyAcceptanceClaimed: false,
    phaseB1AcceptanceClaimed: false,
    releaseRuntimeReachable: false,
  } satisfies PhaseB1FiveWallResponseMetricsV1);
}

export function runPhaseB1ProjectSyntheticFiveWallResponseProtocolV1(
  input: Readonly<{
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1ProjectSyntheticFiveWallResponseResultV1 {
  assertExactPlainRecordV1(input, [
    "schedule",
    "scheduleRun",
    "sha256Hex",
  ], "five-wall response protocol input");
  requireHashProvider(input.sha256Hex);
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const run = assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1(
    input.scheduleRun,
  );
  assertCanonicalScheduleRun(schedule, run);
  const model = run.modelObjectAtRunStart;
  const binding = assertPhaseB1WallMaterialBindingV1(
    run.wallMaterialBindingObjectAtRunStart,
  );
  const registry = assertCanonicalFourChamberNewtonScaleRegistryV1(
    run.newtonScaleRegistryObjectAtRunStart,
  );
  if (!Object.is(model.newtonScaleRegistry, registry)) {
    throw new Error("response run lost registry object identity");
  }
  const definition = buildPhaseB1ProjectSyntheticFiveWallResponseDefinitionV1({
    schedule,
    wallMaterialBinding: binding,
    newtonScaleRegistry: registry,
    sha256Hex: input.sha256Hex,
  });
  const trace = projectResponseTrace(run, model, binding, definition);
  const responseMetrics =
    evaluatePhaseB1ProjectSyntheticFiveWallResponseTraceV1({
    definition,
    trace,
    sha256Hex: input.sha256Hex,
  });
  const response = deepFreeze<PhaseB1FiveWallResponseSummaryV1>({
    ...responseMetrics,
    sourceRunnerProvenanceCertified: true,
    projectSyntheticFiveWallEventTrainScaleSeparatedResponseDetected:
      responseMetrics.scaleSeparatedResponseMetricsPass,
  });
  const orderedStepTrace = run.acceptedTransactions.map((transaction) => ({
    startTimeSec: transaction.previousEndpoint.timeSec,
    endTimeSec: transaction.nextEndpoint.timeSec,
    eventKeys: transaction.coordinator.eventKeys,
    previousStoredState: encodePhaseB1StoredDifferentialStateV1(
      transaction.previousEndpoint.differentialState,
    ),
    nextLeftStoredState: encodePhaseB1StoredDifferentialStateV1(
      transaction.leftLimitStep.nextEndpointLeftLimit.differentialState,
    ),
    nextStoredState: encodePhaseB1StoredDifferentialStateV1(
      transaction.nextEndpoint.differentialState,
    ),
    nextLeftTriSegCoordinates:
      transaction.leftLimitStep.nextEndpointLeftLimit.triSegCoordinates,
    nextTriSegCoordinates: transaction.nextEndpoint.triSegCoordinates,
    freeCalciumUMByWall:
      transaction.leftLimitStep.nextEvaluation.freeCalciumUMByWall,
    activeKirchhoffStressPaByWall: wallRecord((wallId) =>
      transaction.leftLimitStep.nextEvaluation.wallMaterialByWall[wallId]
        .wallActiveKirchhoffStressPa),
    flowsM3PerSec:
      transaction.leftLimitStep.nextEvaluation.closedLoop.allFlowsM3PerSec,
    bloodVolumesM3:
      transaction.nextEndpoint.differentialState.bloodVolumesM3,
  }));
  const eventBatchTrace = WALL_IDS.map((wallId) =>
    trace.eventJumpTraceByWall[wallId]);
  const finalEndpointPayload = {
    timeSec: run.finalEndpoint.timeSec,
    storedState: encodePhaseB1StoredDifferentialStateV1(
      run.finalEndpoint.differentialState,
    ),
    triSegCoordinates: run.finalEndpoint.triSegCoordinates,
  };
  const payload = deepFreeze<ResultHashPayload>({
    schemaId:
      PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_RESULT_SCHEMA_V1_ID,
    protocolDefinition: definition,
    sourceRun: {
      slsMode: run.slsMode,
      acceptedTransactionCount: run.acceptedTransactionCount,
      attemptedTransactionCount: run.attemptedTransactionCount,
      explicitSolverRetryUsed: run.explicitSolverRetryUsed,
      committedTransactionProvenanceAuditPass: true,
      allOrderedEventsCommittedExactlyOnce: true,
      registryObjectReusedAcrossAllAttempts: true,
      testFailureProbeUsed: false,
    },
    traceDigests: {
      responseTraceSha256: computeCanonicalSha256(trace, input.sha256Hex),
      orderedStepTraceSha256: computeCanonicalSha256(
        orderedStepTrace,
        input.sha256Hex,
      ),
      eventBatchTraceSha256: computeCanonicalSha256(
        eventBatchTrace,
        input.sha256Hex,
      ),
      finalEndpointSha256: computeCanonicalSha256(
        finalEndpointPayload,
        input.sha256Hex,
      ),
    },
    response,
    claimBoundary: CLAIM_BOUNDARY,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  });
  const result = deepFreeze<PhaseB1ProjectSyntheticFiveWallResponseResultV1>({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
  BUILDER_ISSUED_RESPONSE_RESULTS.add(result);
  return result;
}

export function assertBuilderIssuedPhaseB1ProjectSyntheticFiveWallResponseResultV1(
  value: PhaseB1ProjectSyntheticFiveWallResponseResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticFiveWallResponseResultV1 {
  requireHashProvider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_RESPONSE_RESULTS.has(value)
  ) {
    throw new Error(
      "five-wall response result must be a live builder-issued object",
    );
  }
  assertExactPlainRecordV1(value, [
    "schemaId",
    "protocolDefinition",
    "sourceRun",
    "traceDigests",
    "response",
    "claimBoundary",
    "hashAlgorithm",
    "contentSha256",
  ], "five-wall response result");
  if (
    value.schemaId
      !== PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_RESULT_SCHEMA_V1_ID
    || value.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
    || value.sourceRun.committedTransactionProvenanceAuditPass !== true
    || value.sourceRun.allOrderedEventsCommittedExactlyOnce !== true
    || value.sourceRun.registryObjectReusedAcrossAllAttempts !== true
    || value.sourceRun.testFailureProbeUsed !== false
    || value.response.sourceRunnerProvenanceCertified !== true
    || value.response
      .projectSyntheticFiveWallEventTrainScaleSeparatedResponseDetected
      !== value.response.scaleSeparatedResponseMetricsPass
  ) throw new Error("five-wall response result contract is invalid");
  validateDefinition(value.protocolDefinition, sha256Hex);
  assertRecursivelyFrozen(value, "responseResult", new WeakSet<object>());
  const { contentSha256, ...payload } = value;
  assertCanonicalSha256(payload, contentSha256, sha256Hex);
  return value;
}

function assertCanonicalScheduleRun(
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  run: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
): void {
  if (
    run.testFailureProbeUsed
    || !run.committedTransactionProvenanceAuditPass
    || !run.allOrderedEventsCommittedExactlyOnce
    || !run.registryObjectReusedAcrossAllAttempts
    || !run.everyAcceptedTransactionContractAuditPass
    || !run.everyAcceptedTransactionProjectionClippingClampAndFallbackFree
  ) throw new Error("response protocol requires an unprobed canonical runner success");
  if (
    !Object.is(run.initialEndpoint.timeSec, 0)
    || !Object.is(
      run.requestedEndTimeSec,
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
    )
    || !Object.is(
      run.nominalDtSec,
      PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_NOMINAL_DT_SEC_V1,
    )
  ) throw new Error("response run must cover the canonical 0.8 s interval at 1 ms nominal dt");
  const expectedEvents = schedule.events.map((event) =>
    event.calciumDriveEvent);
  if (run.orderedEvents.length !== expectedEvents.length) {
    throw new Error("response run event count disagrees with schedule");
  }
  expectedEvents.forEach((expected, index) => {
    const actual = run.orderedEvents[index];
    if (
      actual.wallId !== expected.wallId
      || actual.eventId !== expected.eventId
      || !Object.is(actual.calciumDriveTimeSec, expected.calciumDriveTimeSec)
      || !Object.is(actual.strength, expected.strength)
      || actual.timingOwner !== expected.timingOwner
    ) throw new Error(`response run event ${index} disagrees with schedule`);
  });
  if (
    run.wallMaterialBindingObjectAtRunStart.contentSha256
      !== schedule.sourceBindings.phaseB1WallMaterialBindingSha256
  ) throw new Error("response run wall binding disagrees with schedule");
}

function projectResponseTrace(
  run: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
  model: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1["modelObjectAtRunStart"],
  binding: PhaseB1WallMaterialBindingV1,
  definition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
): PhaseB1ProjectSyntheticFiveWallResponseTraceV1 {
  const initialEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    model,
    binding,
    run.initialEndpoint,
  );
  const initialSample = evaluationSample(
    0,
    run.initialEndpoint.timeSec,
    initialEvaluation,
    run.initialEndpoint.differentialState.bloodVolumesM3,
  );
  const committedLeftLimitSamples = run.acceptedTransactions.map(
    (transaction, sampleIndex) => evaluationSample(
      sampleIndex + 1,
      transaction.nextEndpoint.timeSec,
      transaction.leftLimitStep.nextEvaluation,
      transaction.leftLimitStep.nextEndpointLeftLimit.differentialState
        .bloodVolumesM3,
    ),
  );
  const eventJumpTraceByWall = wallRecord((wallId) => {
    const policy = definition.wallPolicyByWall[wallId];
    const matches = run.acceptedTransactions.filter((transaction) =>
      transaction.coordinator.eventKeys.includes(policy.eventKey));
    if (matches.length !== 1) {
      throw new Error(`${wallId} event must occur in exactly one committed transaction`);
    }
    const transaction = matches[0];
    return deepFreeze<PhaseB1FiveWallResponseEventJumpTraceV1>({
      wallId,
      eventKey: policy.eventKey,
      eventTimeSec: policy.eventTimeSec,
      eventStrength: policy.eventStrength,
      calciumByWallAtEndLeftLimit: copyCalciumByWall(
        transaction.leftLimitStep.nextEndpointLeftLimit.differentialState
          .calciumByWall,
      ),
      calciumByWallAfterEventBatch: copyCalciumByWall(
        transaction.nextEndpoint.differentialState.calciumByWall,
      ),
    });
  });
  return deepFreeze({
    traceId: PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_TRACE_V1_ID,
    initialSample,
    committedLeftLimitSamples,
    eventJumpTraceByWall,
    sourceIsCommittedRunnerSuccess: true,
    uncommittedRetryAttemptSamplesIncluded: false,
  });
}

function evaluationSample(
  sampleIndex: number,
  timeSec: number,
  evaluation: ReturnType<typeof evaluatePhaseB1EventFreeEndpointV1>,
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
): PhaseB1FiveWallResponseTraceSampleV1 {
  return deepFreeze({
    sampleIndex,
    timeSec,
    freeCalciumUMByWall: evaluation.freeCalciumUMByWall,
    activeKirchhoffStressPaByWall: wallRecord((wallId) =>
      evaluation.wallMaterialByWall[wallId].wallActiveKirchhoffStressPa),
    flowsM3PerSec: evaluation.closedLoop.allFlowsM3PerSec,
    bloodVolumesM3,
  });
}

function validateDefinition(
  definition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  assertExactPlainRecordV1(definition, [
    "schemaId",
    "protocolId",
    "status",
    "sourceBindings",
    "interval",
    "samplingPolicy",
    "thresholdPolicy",
    "wallOrder",
    "wallPolicyByWall",
    "hydraulicPolicy",
    "claimBoundary",
    "hashAlgorithm",
    "contentSha256",
  ], "five-wall response definition");
  if (
    definition.schemaId
      !== PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_SCHEMA_V1_ID
    || definition.protocolId
      !== PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_PROTOCOL_V1_ID
    || definition.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("five-wall response definition identity is invalid");
  if (!BUILDER_ISSUED_RESPONSE_DEFINITIONS.has(definition)) {
    throw new Error(
      "five-wall response definition must be a live builder-issued object",
    );
  }
  validateDefinitionStructure(definition);
  assertRecursivelyFrozen(definition, "definition", new WeakSet<object>());
  const { contentSha256, ...payload } = definition;
  assertCanonicalSha256(payload, contentSha256, sha256Hex);
}

function validateDefinitionStructure(
  definition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
): void {
  assertExactPlainRecordV1(definition.sourceBindings, [
    "eventScheduleId",
    "eventScheduleContentSha256",
    "wallMaterialBindingContentSha256",
    "newtonScaleRegistryContentSha256",
    "eventScheduleRunnerId",
    "eventScheduleRunnerPolicyId",
  ], "definition.sourceBindings");
  if (
    definition.status
      !== "project-synthetic-detection-policy-not-physiological-acceptance"
    || definition.sourceBindings.eventScheduleId
      !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID
    || definition.sourceBindings.eventScheduleRunnerId
      !== PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID
    || definition.sourceBindings.eventScheduleRunnerPolicyId
      !== PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.policyId
  ) throw new Error("five-wall response definition provenance is invalid");
  for (const [field, value] of Object.entries(definition.sourceBindings)) {
    if (field.endsWith("Sha256") && !/^[0-9a-f]{64}$/u.test(value)) {
      throw new Error(`definition.sourceBindings.${field} must be sha256 hex`);
    }
  }

  assertExactPlainRecordV1(definition.interval, [
    "cycleIndex",
    "startTimeSec",
    "endTimeSec",
    "durationSec",
    "nominalDtSec",
    "oneDeclaredScheduleIntervalOnly",
    "periodicityInferredFromSingleInterval",
  ], "definition.interval");
  if (
    definition.interval.cycleIndex !== 0
    || !Object.is(definition.interval.startTimeSec, 0)
    || !Object.is(
      definition.interval.endTimeSec,
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
    )
    || !Object.is(
      definition.interval.durationSec,
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
    )
    || !Object.is(
      definition.interval.nominalDtSec,
      PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_NOMINAL_DT_SEC_V1,
    )
    || definition.interval.oneDeclaredScheduleIntervalOnly !== true
    || definition.interval.periodicityInferredFromSingleInterval !== false
  ) throw new Error("five-wall response interval policy is invalid");

  assertExactPlainRecordV1(definition.samplingPolicy, [
    "baseline",
    "postEventSamples",
    "interpolation",
    "smoothing",
    "freeCalciumWindow",
    "activeStressWindow",
    "otherWallEventsInsideWindow",
  ], "definition.samplingPolicy");
  if (
    definition.samplingPolicy.baseline
      !== "event-transaction-left-limit-at-t-e"
    || definition.samplingPolicy.postEventSamples
      !== "committed-backward-euler-left-limit-endpoints-strictly-after-t-e"
    || definition.samplingPolicy.interpolation !== "none"
    || definition.samplingPolicy.smoothing !== "none"
    || definition.samplingPolicy.freeCalciumWindow
      !== "t-e-open-through-t-e-plus-two-isolated-peak-times-closed"
    || definition.samplingPolicy.activeStressWindow
      !== "first-free-calcium-threshold-crossing-through-t-e-plus-two-decay-times-closed"
    || definition.samplingPolicy.otherWallEventsInsideWindow
      !== "retained-as-declared-train-no-wall-specific-causal-attribution"
  ) throw new Error("five-wall response sampling policy is invalid");

  assertExactPlainRecordV1(definition.thresholdPolicy, [
    "freeCalciumFractionOfOwnedEventAmplitude",
    "activeStressScaledThreshold",
    "hydraulicScaledThreshold",
    "initialHydraulicScaledFlowTolerance",
    "thresholdComparison",
    "exactOwnedJumpComparison",
    "exactOtherWallJumpComparison",
  ], "definition.thresholdPolicy");
  if (
    !Object.is(
      definition.thresholdPolicy.freeCalciumFractionOfOwnedEventAmplitude,
      PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1,
    )
    || !Object.is(
      definition.thresholdPolicy.activeStressScaledThreshold,
      PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1,
    )
    || !Object.is(
      definition.thresholdPolicy.hydraulicScaledThreshold,
      PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_HYDRAULIC_SCALED_THRESHOLD_V1,
    )
    || !(definition.thresholdPolicy.initialHydraulicScaledFlowTolerance > 0)
    || !Number.isFinite(
      definition.thresholdPolicy.initialHydraulicScaledFlowTolerance,
    )
    || definition.thresholdPolicy.thresholdComparison !== "greater-than-or-equal"
    || definition.thresholdPolicy.exactOwnedJumpComparison
      !== "Object.is(post,pre+strength)"
    || definition.thresholdPolicy.exactOtherWallJumpComparison
      !== "Object.is(post,pre)"
  ) throw new Error("five-wall response threshold policy is invalid");

  assertDensePlainArrayV1(
    definition.wallOrder,
    WALL_IDS.length,
    "definition.wallOrder",
  );
  if (!WALL_IDS.every((wallId, index) =>
    definition.wallOrder[index] === wallId)) {
    throw new Error("five-wall response wall order is invalid");
  }
  assertExactPlainRecordV1(
    definition.wallPolicyByWall,
    WALL_IDS,
    "definition.wallPolicyByWall",
  );
  for (const wallId of WALL_IDS) {
    const policy = definition.wallPolicyByWall[wallId];
    assertExactPlainRecordV1(policy, [
      "wallId",
      "eventKey",
      "eventTimeSec",
      "eventStrength",
      "tissueClass",
      "tauRiseSec",
      "tauDecaySec",
      "isolatedUnitPeakTimeSec",
      "calciumAmplitudeUM",
      "freeCalciumWindowStartExclusiveSec",
      "freeCalciumWindowEndInclusiveSec",
      "activeStressWindowEndInclusiveSec",
      "freeCalciumIncreaseThresholdUM",
      "activeStressScalePa",
      "activeStressIncreaseThresholdPa",
    ], `definition.wallPolicyByWall.${wallId}`);
    const expectedTissueClass = wallId === "LA" || wallId === "RA"
      ? "atrial"
      : "ventricular";
    if (
      policy.wallId !== wallId
      || typeof policy.eventKey !== "string"
      || policy.eventKey.length === 0
      || policy.tissueClass !== expectedTissueClass
    ) throw new Error(`${wallId} response policy identity is invalid`);
    requireNonNegativeFinite(policy.eventTimeSec, `${wallId}.eventTimeSec`);
    requirePositiveFinite(policy.eventStrength, `${wallId}.eventStrength`);
    requirePositiveFinite(policy.tauRiseSec, `${wallId}.tauRiseSec`);
    requirePositiveFinite(policy.tauDecaySec, `${wallId}.tauDecaySec`);
    requirePositiveFinite(
      policy.isolatedUnitPeakTimeSec,
      `${wallId}.isolatedUnitPeakTimeSec`,
    );
    requirePositiveFinite(
      policy.calciumAmplitudeUM,
      `${wallId}.calciumAmplitudeUM`,
    );
    requirePositiveFinite(policy.activeStressScalePa, `${wallId}.activeStressScalePa`);
    if (
      !Object.is(
        policy.freeCalciumWindowStartExclusiveSec,
        policy.eventTimeSec,
      )
      || !Object.is(
        policy.freeCalciumWindowEndInclusiveSec,
        policy.eventTimeSec + 2 * policy.isolatedUnitPeakTimeSec,
      )
      || !Object.is(
        policy.activeStressWindowEndInclusiveSec,
        policy.eventTimeSec + 2 * policy.tauDecaySec,
      )
      || !Object.is(
        policy.freeCalciumIncreaseThresholdUM,
        policy.eventStrength
          * policy.calciumAmplitudeUM
          * PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1,
      )
      || !Object.is(
        policy.activeStressIncreaseThresholdPa,
        policy.activeStressScalePa
          * PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1,
      )
      || !(policy.freeCalciumWindowEndInclusiveSec
        <= definition.interval.endTimeSec)
      || !(policy.activeStressWindowEndInclusiveSec
        <= definition.interval.endTimeSec)
    ) throw new Error(`${wallId} response threshold or window derivation is invalid`);
  }

  assertExactPlainRecordV1(definition.hydraulicPolicy, [
    "directedFlowSignConvention",
    "flowScaleM3PerSec",
    "bloodVolumeScaleM3ByCompartment",
    "leftFlowGroup",
    "rightFlowGroup",
    "leftVolumeGroup",
    "rightVolumeGroup",
    "allEightFlowsRecorded",
    "allEightVolumesRecorded",
    "wallSpecificHydraulicCausalityClaimed",
  ], "definition.hydraulicPolicy");
  assertExactPlainRecordV1(
    definition.hydraulicPolicy.bloodVolumeScaleM3ByCompartment,
    BLOOD_COMPARTMENT_IDS,
    "definition.hydraulicPolicy.bloodVolumeScaleM3ByCompartment",
  );
  requirePositiveFinite(
    definition.hydraulicPolicy.flowScaleM3PerSec,
    "definition.hydraulicPolicy.flowScaleM3PerSec",
  );
  for (const compartmentId of BLOOD_COMPARTMENT_IDS) {
    requirePositiveFinite(
      definition.hydraulicPolicy.bloodVolumeScaleM3ByCompartment[
        compartmentId
      ],
      `definition.hydraulicPolicy.bloodVolumeScaleM3ByCompartment.${compartmentId}`,
    );
  }
  if (
    definition.hydraulicPolicy.directedFlowSignConvention
      !== FOUR_CHAMBER_SIGN_CONVENTIONS.directedFlow
    || !arrayExact(definition.hydraulicPolicy.leftFlowGroup, LEFT_FLOW_GROUP)
    || !arrayExact(definition.hydraulicPolicy.rightFlowGroup, RIGHT_FLOW_GROUP)
    || !arrayExact(definition.hydraulicPolicy.leftVolumeGroup, LEFT_VOLUME_GROUP)
    || !arrayExact(definition.hydraulicPolicy.rightVolumeGroup, RIGHT_VOLUME_GROUP)
    || definition.hydraulicPolicy.allEightFlowsRecorded !== true
    || definition.hydraulicPolicy.allEightVolumesRecorded !== true
    || definition.hydraulicPolicy.wallSpecificHydraulicCausalityClaimed !== false
    || definition.claimBoundary !== CLAIM_BOUNDARY
  ) throw new Error("five-wall response hydraulic or claim policy is invalid");
}

function validateTrace(
  trace: PhaseB1ProjectSyntheticFiveWallResponseTraceV1,
  definition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
): void {
  assertExactPlainRecordV1(trace, [
    "traceId",
    "initialSample",
    "committedLeftLimitSamples",
    "eventJumpTraceByWall",
    "sourceIsCommittedRunnerSuccess",
    "uncommittedRetryAttemptSamplesIncluded",
  ], "five-wall response trace");
  if (
    trace.traceId !== PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_TRACE_V1_ID
    || typeof trace.sourceIsCommittedRunnerSuccess !== "boolean"
    || trace.uncommittedRetryAttemptSamplesIncluded !== false
  ) throw new Error("five-wall response trace identity is invalid");
  assertRecursivelyFrozen(trace, "trace", new WeakSet<object>());
  validateSample(trace.initialSample, "trace.initialSample");
  if (
    trace.initialSample.sampleIndex !== 0
    || !Object.is(trace.initialSample.timeSec, definition.interval.startTimeSec)
  ) {
    throw new Error("response trace initial time is invalid");
  }
  assertDensePlainArrayV1(
    trace.committedLeftLimitSamples,
    undefined,
    "trace.committedLeftLimitSamples",
  );
  if (trace.committedLeftLimitSamples.length === 0) {
    throw new Error("response trace must contain committed samples");
  }
  let previousTime = trace.initialSample.timeSec;
  trace.committedLeftLimitSamples.forEach((sample, index) => {
    validateSample(sample, `trace.committedLeftLimitSamples[${index}]`);
    if (!(sample.timeSec > previousTime)) {
      throw new Error("response trace samples must be strictly time ordered");
    }
    if (sample.sampleIndex !== index + 1) {
      throw new Error("response trace sample indices must be contiguous");
    }
    previousTime = sample.timeSec;
  });
  if (!Object.is(previousTime, definition.interval.endTimeSec)) {
    throw new Error("response trace must end at the declared interval end");
  }
  assertExactPlainRecordV1(
    trace.eventJumpTraceByWall,
    WALL_IDS,
    "trace.eventJumpTraceByWall",
  );
  for (const wallId of WALL_IDS) {
    const jump = trace.eventJumpTraceByWall[wallId];
    assertExactPlainRecordV1(jump, [
      "wallId",
      "eventKey",
      "eventTimeSec",
      "eventStrength",
      "calciumByWallAtEndLeftLimit",
      "calciumByWallAfterEventBatch",
    ], `trace.eventJumpTraceByWall.${wallId}`);
    const policy = definition.wallPolicyByWall[wallId];
    if (
      jump.wallId !== wallId
      || jump.eventKey !== policy.eventKey
      || !Object.is(jump.eventTimeSec, policy.eventTimeSec)
      || !Object.is(jump.eventStrength, policy.eventStrength)
    ) throw new Error(`${wallId} event jump trace disagrees with definition`);
    validateCalciumRecord(
      jump.calciumByWallAtEndLeftLimit,
      `${wallId}.calciumByWallAtEndLeftLimit`,
    );
    validateCalciumRecord(
      jump.calciumByWallAfterEventBatch,
      `${wallId}.calciumByWallAfterEventBatch`,
    );
  }
}

function validateSample(
  sample: PhaseB1FiveWallResponseTraceSampleV1,
  field: string,
): void {
  assertExactPlainRecordV1(sample, [
    "sampleIndex",
    "timeSec",
    "freeCalciumUMByWall",
    "activeKirchhoffStressPaByWall",
    "flowsM3PerSec",
    "bloodVolumesM3",
  ], field);
  if (!Number.isInteger(sample.sampleIndex) || sample.sampleIndex < 0) {
    throw new Error(`${field}.sampleIndex must be nonnegative integer`);
  }
  requireNonNegativeFinite(sample.timeSec, `${field}.timeSec`);
  validateFiniteRecord(sample.freeCalciumUMByWall, WALL_IDS, `${field}.freeCalciumUMByWall`, true);
  validateFiniteRecord(sample.activeKirchhoffStressPaByWall, WALL_IDS, `${field}.activeKirchhoffStressPaByWall`, false);
  validateFiniteRecord(sample.flowsM3PerSec, FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1, `${field}.flowsM3PerSec`, false);
  validateFiniteRecord(sample.bloodVolumesM3, BLOOD_COMPARTMENT_IDS, `${field}.bloodVolumesM3`, true);
}

function validateCalciumRecord(
  record: Readonly<Record<FourChamberWallId, PhaseB1FiveWallResponseCalciumStateV1>>,
  field: string,
): void {
  assertExactPlainRecordV1(record, WALL_IDS, field);
  for (const wallId of WALL_IDS) {
    const state = record[wallId];
    assertExactPlainRecordV1(state, ["r", "d"], `${field}.${wallId}`);
    requireNonNegativeFinite(state.r, `${field}.${wallId}.r`);
    requireNonNegativeFinite(state.d, `${field}.${wallId}.d`);
    if (state.d < state.r) throw new Error(`${field}.${wallId} is unreachable`);
  }
}

function validateFiniteRecord<Key extends string>(
  record: Readonly<Record<Key, number>>,
  keys: readonly Key[],
  field: string,
  positive: boolean,
): void {
  assertExactPlainRecordV1(record, keys, field);
  for (const key of keys) {
    if (positive) requirePositiveFinite(record[key], `${field}.${key}`);
    else requireFinite(record[key], `${field}.${key}`);
  }
}

function ownedJumpExact(
  jump: PhaseB1FiveWallResponseEventJumpTraceV1,
  wallId: FourChamberWallId,
): boolean {
  const before = jump.calciumByWallAtEndLeftLimit[wallId];
  const after = jump.calciumByWallAfterEventBatch[wallId];
  return Object.is(after.r, before.r + jump.eventStrength)
    && Object.is(after.d, before.d + jump.eventStrength);
}

function calciumStateExact(
  left: PhaseB1FiveWallResponseCalciumStateV1,
  right: PhaseB1FiveWallResponseCalciumStateV1,
): boolean {
  return Object.is(left.r, right.r) && Object.is(left.d, right.d);
}

function copyCalciumByWall(
  input: Readonly<Record<FourChamberWallId, PhaseB1FiveWallResponseCalciumStateV1>>,
): Readonly<Record<FourChamberWallId, PhaseB1FiveWallResponseCalciumStateV1>> {
  return wallRecord((wallId) => deepFreeze({
    r: input[wallId].r,
    d: input[wallId].d,
  }));
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

function arrayExact<Value>(
  left: readonly Value[],
  right: readonly Value[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function requireHashProvider(
  value: CanonicalSha256HexProvider,
): void {
  if (typeof value !== "function") throw new Error("sha256Hex must be a function");
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result < 0) throw new Error(`${field} must be nonnegative`);
  return result;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (!(result > 0)) throw new Error(`${field} must be positive`);
  return result;
}

function assertRecursivelyFrozen(
  value: unknown,
  field: string,
  visited: WeakSet<object>,
): void {
  if (value === null || typeof value !== "object") return;
  if (visited.has(value)) return;
  visited.add(value);
  if (!Object.isFrozen(value)) throw new Error(`${field} must be recursively frozen`);
  for (const [key, child] of Object.entries(value)) {
    assertRecursivelyFrozen(child, `${field}.${key}`, visited);
  }
}

function deepFreeze<Value>(
  value: Value,
  visited: WeakSet<object> = new WeakSet<object>(),
): Value {
  if (value === null || typeof value !== "object") return value;
  const object = value as object;
  if (visited.has(object)) return value;
  visited.add(object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, visited);
  }
  if (!Object.isFrozen(object)) Object.freeze(object);
  return value;
}
