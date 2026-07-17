import {
  buildNonCoronaryCirculationGraphV1,
  createInitialNonCoronaryCirculationStateV1,
  NON_CORONARY_CIRCULATION_SCOPE_V1,
  NON_CORONARY_NODE_NAMES_V1,
  type NonCoronaryCirculationInitialStateInputV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryCirculationTrialDiagnosticsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import type { EdgeSpec, NodeSpec } from "@/engine/core/topology";
import {
  checkpointMainWireFiveWallNonCoronaryV1,
  initializeMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
  type MainWireFiveWallNonCoronaryCheckpointV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID,
  createFixedSinusFiveWallCalciumEventScheduleV1,
  splitFiveWallCalciumIntervalAtEventsV1,
  type FiveWallCalciumEventV1,
  type FiveWallCalciumRepresentationV1,
} from "@/engine/myocardium/calcium/fiveWallExactEventCalciumDriveV1";
import {
  EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  classifyMainWireFiveWallPeriodicityV1,
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  type MainWireFiveWallPeriodicBeatObservationV1,
  type MainWireFiveWallPeriodicClassificationV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
  type MainWireNormalAdultBloodVolumeOperatingPointAuditV1,
  type MainWireNormalAdultBloodVolumeOperatingPointIdentityV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
  validateRetainedAcceptedIntervalWindowV1,
  type AcceptedIntervalEndpointSampleV1,
  type AcceptedIntervalOpenClosedEventV1,
  type AcceptedIntervalV1,
  type RetainedAcceptedIntervalWindowV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultLaSlsModeV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
  type MainWireNormalAdultCommonPericardiumCaseV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import type {
  MainWireCommonPericardiumBindingV1,
  MainWireCommonPericardiumModeV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import type {
  MainWireFourValveDiseaseBracketIdV1,
  MainWireFourValveDiseasePresetV1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";

/** @deprecated Historic V1 artifact ID; V1 runner name aliases canonical V3. */
export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-steady-v1" as const;
/** @deprecated Historic V2 artifact ID; V2 runner name aliases canonical V3. */
export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V2_ID =
  "main-wire-normal-adult-five-wall-periodic-steady-v2" as const;
export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V3_ID =
  "main-wire-normal-adult-five-wall-periodic-steady-v3" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-protocol-identity-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID =
  "main-wire-normal-adult-five-wall-cycle-boundary-warm-start-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1 =
  Object.freeze({
    policyId: "fixed-groupwise-periodic-policy-v1" as const,
    period1NormalizedTolerance: 1e-3,
    period2NormalizedTolerance: 1e-3,
    period2MinimumPeriod1NormalizedDelta: 5e-3,
    consecutiveBeats: 3,
    defaultMaximumBeatCount: 32,
    retainedCompleteBeatCount: 3,
    referenceScaleSetId:
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1.scaleSetId,
  });

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1 =
  Object.freeze({
    variant: "pven-to-pvein-10ml" as const,
    sourceNode: "PVen" as const,
    destinationNode: "PVein" as const,
    transferredVolumeMl: 10,
    totalBloodVolumeChangeMl: 0 as const,
  });

export type MainWireNormalAdultFiveWallPeriodicInitializationV1 =
  | "canonical"
  | typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1.variant
  | "cycle-boundary-warm-start";

export type MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1 =
  Readonly<{
    mechanicsProviderMetadataStableHash: string;
    calciumDriveFixedParamsStableHash: string;
    calciumStateContractStableHash: string;
    circulationTopologyGraphStableHash: string;
    circulationRuntimeStableHash: string;
    bloodVolumeOperatingPointStableHash: string;
    commonPericardiumStableHash: string;
    periodicPolicyStableHash: string;
  }>;

export type MainWireNormalAdultFiveWallCycleWarmStartV1 = Readonly<{
  warmStartId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID;
  schemaVersion: 3;
  sourceProtocolIdentity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  sourceProtocolIdentityHash: string;
  sourceComponentHashes:
    MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
  sourcePericardiumMode: MainWireCommonPericardiumModeV1;
  sourcePericardiumParameterSetId: string;
  sourceDtSec: number;
  sourceCompletedBeatCount: number;
  checkpoint: MainWireFiveWallNonCoronaryCheckpointV1;
  claim: Readonly<{
    cycleBoundaryPhase01: 0;
    timeRebasedToZeroOnRestore: true;
    parameterSearch: false;
    pericardiumStateStored: false;
  }>;
  envelopeFingerprint: string;
}>;

export type MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1 = Readonly<{
  identityId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID;
  mechanicsProvider: Readonly<{
    providerId: string;
    parameterSetId: string;
    /** Includes the provider's material, geometry, and internal solver options. */
    parameterIdentityHash: string;
    stateSchemaVersion: number;
  }>;
  calciumDrive: Readonly<{
    driveId: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID;
    parameterSetId: string;
    fixedParamsStableHash: string;
    representation: FiveWallCalciumRepresentationV1;
    stateSchemaId: typeof FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID;
    stateSchemaVersion: 1;
    eventScheduleId: string;
    eventScheduleIdentityHash: string;
    initializationId: "regular-periodic-prehistory-from-fixed-prior";
    eventKernelId: typeof EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID;
    periodicConversionId: "analytic-periodic-biexponential-to-exact-event-v1";
    stateContractStableHash: string;
  }>;
  circulation: Readonly<{
    topologyGraphSnapshot: Readonly<{
      topologyId: string;
      nodes: readonly Readonly<NodeSpec>[];
      edges: readonly Readonly<EdgeSpec>[];
      scope: typeof NON_CORONARY_CIRCULATION_SCOPE_V1;
    }>;
    topologyGraphStableHash: string;
    runtimeStableHash: string;
    valvePresetStableHash: string;
    valvePresetSnapshot: MainWireFourValveDiseasePresetV1;
  }>;
  bloodVolumeOperatingPoint:
    MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
  commonPericardium: Readonly<{
    bindingId: string;
    parameterSetId: string;
    mode: MainWireCommonPericardiumModeV1;
    stableHash: string;
    bindingSnapshot: MainWireCommonPericardiumBindingV1;
  }>;
  periodicPolicy: Readonly<{
    policyId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.policyId;
    policyStableHash: string;
  }>;
}>;

export type MainWireNormalAdultFiveWallPeriodicOptionsV1 = Readonly<{
  dtSec: number;
  maximumBeatCount?: number;
  laSlsMode?: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode?: MainWireCommonPericardiumModeV1;
  pericardiumCase?: MainWireNormalAdultCommonPericardiumCaseV1;
  valveDiseaseBracketIds?: readonly MainWireFourValveDiseaseBracketIdV1[];
  initialization?: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  warmStart?: MainWireNormalAdultFiveWallCycleWarmStartV1;
  calciumRepresentation?: FiveWallCalciumRepresentationV1;
}>;

/**
 * Provenance copied from the accepted calcium trial. The runner never
 * reconstructs these events by querying the schedule a second time.
 */
export type MainWireNormalAdultFiveWallAcceptedCalciumEventV1 = Readonly<{
  source: "accepted-calcium-trial";
  scheduleId: string;
  scheduleIdentityHash: string;
  acceptedTrialBaseRevision: number;
  eventIndexWithinAcceptedTrial: number;
  calciumEvent: FiveWallCalciumEventV1;
}>;

export type MainWireNormalAdultFiveWallAcceptedDiagnosticIntervalV1 =
  AcceptedIntervalV1<
    MainWireNormalAdultFiveWallDiagnosticSampleV2,
    MainWireNormalAdultFiveWallAcceptedCalciumEventV1
  >;

type MainWireNormalAdultFiveWallAcceptedDiagnosticWindowV1 =
  RetainedAcceptedIntervalWindowV1<
    MainWireNormalAdultFiveWallDiagnosticSampleV2,
    MainWireNormalAdultFiveWallAcceptedCalciumEventV1
  >;

/**
 * The cold accepted state is not itself a Diagnostic V3 sample. The missing
 * branch preserves that fact instead of fabricating a predecessor from state
 * coordinates.
 */
export type MainWireNormalAdultFiveWallAcceptedIntervalTraceV1 =
  | Readonly<MainWireNormalAdultFiveWallAcceptedDiagnosticWindowV1 & {
    status: "complete";
  }>
  | Readonly<
    Omit<MainWireNormalAdultFiveWallAcceptedDiagnosticWindowV1,
      "precedingSample"> & {
      status: "missing-preceding-diagnostic";
      reason: "cold-start";
    }
  >;

export type MainWireNormalAdultFiveWallRetainedBeatV3 = Readonly<{
  beatIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  startRevision: number;
  endRevision: number;
  acceptedIntervalCount: number;
  acceptedIntervalTrace:
    MainWireNormalAdultFiveWallAcceptedIntervalTraceV1;
  /** Compatibility projection; interval endpoints are the canonical owner. */
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
}>;

/**
 * @deprecated Transitional source alias to V3, not a frozen V2 wire schema.
 */
export type MainWireNormalAdultFiveWallRetainedBeatV2 =
  MainWireNormalAdultFiveWallRetainedBeatV3;

/** @deprecated Compatibility alias; the canonical retained-beat schema is V3. */
export type MainWireNormalAdultFiveWallRetainedBeatV1 =
  MainWireNormalAdultFiveWallRetainedBeatV3;

export type MainWireNormalAdultFiveWallPeriodicTerminationReasonV1 =
  | "period1-converged"
  | "period2-suspect"
  | "maximum-beats-reached"
  | "step-failure";

export type MainWireNormalAdultFiveWallPeriodicResultV3 = Readonly<{
  experimentId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V3_ID;
  schemaVersion: 3;
  mode: "canonical";
  protocolIdentity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  protocolIdentityHash: string;
  protocolComponentHashes:
    MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
  /** Deterministic construction readback; intentionally excluded from hashes. */
  bloodVolumeOperatingPointAudit:
    MainWireNormalAdultBloodVolumeOperatingPointAuditV1;
  laSlsMode: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode: MainWireCommonPericardiumModeV1;
  pericardiumCase: MainWireNormalAdultCommonPericardiumCaseV1;
  pericardiumParameterSetId: string;
  valvePreset: MainWireFourValveDiseasePresetV1;
  initialization: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  calciumRepresentation: FiveWallCalciumRepresentationV1;
  dtSec: number;
  stepsPerBeat: number;
  requestedMaximumBeatCount: number;
  completedBeatCount: number;
  terminationReason:
    MainWireNormalAdultFiveWallPeriodicTerminationReasonV1;
  integrationCompletedWithoutFailure: boolean;
  periodicSteadyStateClaimed: boolean;
  period2OrbitSuspected: boolean;
  periodicity: MainWireFiveWallPeriodicClassificationV1;
  beatClosure: readonly MainWireFiveWallPeriodicBeatObservationV1[];
  retainedCompleteBeats:
    readonly MainWireNormalAdultFiveWallRetainedBeatV3[];
  retainedPartialBeat:
    readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  /** Accepted-interval provenance retained if a later step in a beat fails. */
  retainedPartialAcceptedIntervals:
    readonly MainWireNormalAdultFiveWallAcceptedDiagnosticIntervalV1[];
  terminalCycleBoundaryWarmStart:
    MainWireNormalAdultFiveWallCycleWarmStartV1 | null;
  failure: null | Readonly<{
    beatIndex: number;
    stepWithinBeat: number;
    globalStepIndex: number;
    timeSec: number;
    message: string;
    circulationFailureReason:
      "invalid-input"
      | "initial-evaluation-failed"
      | "jacobian-failed"
      | "singular-jacobian"
      | "line-search-failed"
      | "maximum-iterations";
    lastAcceptedCandidateNodeVolumesMl: Readonly<Record<string, number>>;
    circulationDiagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  }>;
  initializationAudit: Readonly<{
    canonicalTotalBloodVolumeMl: number;
    initializedTotalBloodVolumeMl: number;
    totalBloodVolumeDifferenceMl: number;
    chamberVolumesChanged: boolean;
    dynamicEdgeFlowsChanged: boolean;
    valveOpeningStatesChanged: boolean;
    mechanicsColdInputChanged: boolean;
    mechanicsColdStateFingerprintChanged: boolean;
    calciumColdStateChanged: boolean;
    transferredVolumeMl: number;
    sourceNode: "PVen" | null;
    destinationNode: "PVein" | null;
    pulmonaryNodeVolumeDeltaMl: Readonly<{
      PVen: number;
      PVein: number;
    }>;
    warmStartSourceProtocolIdentityHash: string | null;
    warmStartTargetProtocolIdentityHash: string | null;
    warmStartSourcePericardiumStableHash: string | null;
    warmStartTargetPericardiumStableHash: string | null;
    warmStartProtocolDifference:
      | "not-a-warm-start"
      | "none"
      | "common-pericardium-only";
  }>;
  policy: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  claim: Readonly<{
    heartRateBpm: 60;
    circulation: "main-wire-derived-noncoronary-experimental";
    ordinaryBeatIterationOnly: true;
    shootingOrAndersonAccelerationApplied: false;
    parameterSearch: false;
    calciumRepresentationSelectionIsFixedEnum: true;
    exactEventCalciumStatesIncludedInPeriodClosure: true;
    exactEventRepresentationIntervalsSplitAtOffGridEvents: true;
    stepsPerBeatIsNominalGridCount: true;
    acceptedSubstepsMayExceedNominalStepsPerBeat: true;
    acceptedIntervalTimebaseId: typeof ACCEPTED_INTERVAL_TIMEBASE_V1_ID;
    acceptedIntervalOwnership: "open-start-closed-end";
    acceptedIntervalEventsCopiedFromAcceptedCalciumTrial: true;
    retainedIntervalEventScheduleRequeryApplied: false;
    retainedPrecedingDiagnosticFabricated: false;
    initializationVariantChangesRuntimeOrMaterialParameters: false;
    pulmonaryRedistributionIsInitialConditionBasinAuditOnly: true;
    samePeriodicOrbitAcrossInitializationsClaimed: false;
    retainedSamplesAreAtMostTheLastThreeCompleteBeats: true;
    smoothingAppliedToSamples: false;
    pericardialConstraintInterfaceIncluded: true;
    pericardialConstraintEnabled: boolean;
    pericardialConstraintMayBeSlackAtHealthyBaseline: true;
    warmStartIsInitialConditionOnly: true;
    valveDiseasePresetIsProtocolParameterNotAcceptedState: true;
    valveDiseaseBracketIsClinicalDiagnosis: false;
  }>;
}>;

/** @deprecated Transitional source alias to V3. */
export type MainWireNormalAdultFiveWallPeriodicResultV2 =
  MainWireNormalAdultFiveWallPeriodicResultV3;
/** @deprecated Transitional source alias to V3. */
export type MainWireNormalAdultFiveWallPeriodicResultV1 =
  MainWireNormalAdultFiveWallPeriodicResultV3;

export type MainWireNormalAdultFiveWallPeriodicProtocolResolutionV1 =
  Readonly<{
    identity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
    identityHash: string;
    componentHashes:
      MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
  }>;

type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

const CYCLE_LENGTH_SEC = 1;

/**
 * Resolves and validates the fixed protocol identity without integrating a
 * beat. Diagnostics and pure-comparison fixtures use this boundary instead of
 * inventing protocol-shaped objects that could bypass registry validation.
 */
export function resolveMainWireNormalAdultFiveWallPeriodicProtocolIdentityV1(
  options: Readonly<{
    laSlsMode?: MainWireNormalAdultLaSlsModeV1;
    pericardiumMode?: MainWireCommonPericardiumModeV1;
    pericardiumCase?: MainWireNormalAdultCommonPericardiumCaseV1;
    valveDiseaseBracketIds?: readonly MainWireFourValveDiseaseBracketIdV1[];
    calciumRepresentation?: FiveWallCalciumRepresentationV1;
  }> = {},
): MainWireNormalAdultFiveWallPeriodicProtocolResolutionV1 {
  const laSlsMode = options.laSlsMode ?? "on";
  if (laSlsMode !== "on" && laSlsMode !== "exact-off") {
    throw new Error("unsupported LA SLS mode");
  }
  const pericardiumMode = options.pericardiumMode ?? "on";
  if (pericardiumMode !== "on" && pericardiumMode !== "exact-off") {
    throw new Error("unsupported common-pericardium mode");
  }
  const pericardiumCase = options.pericardiumCase ?? "healthy-slack";
  if (
    pericardiumCase !== "healthy-slack"
    && pericardiumCase !== "effusion-300ml-positive-control"
    && pericardiumCase
      !== "global-capacity-vh0-430ml-positive-control"
  ) throw new Error("unsupported common-pericardium case");
  const runtime = normalAdultMainWireRuntimeV1(
    Object.freeze([...(options.valveDiseaseBracketIds ?? [])]),
  );
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1(
    laSlsMode,
  );
  const pericardium = createMainWireNormalAdultCommonPericardiumV1(
    pericardiumMode,
    pericardiumCase,
  );
  const calciumRepresentation = options.calciumRepresentation
    ?? "analytic-periodic-control-with-exact-event-shadow";
  validateCalciumRepresentation(calciumRepresentation);
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const protocol = buildPeriodicProtocolIdentity(
    provider,
    runtime,
    pericardium,
    bloodVolumeOperatingPoint.identity,
    calciumRepresentation,
  );
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1({
    identity: protocol.identity,
    identityHash: protocol.identityHash,
    componentHashes: protocol.componentHashes,
    periodicPolicy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  });
  return protocol;
}

export function runMainWireNormalAdultFiveWallPeriodicSteadyV3(
  options: MainWireNormalAdultFiveWallPeriodicOptionsV1,
): MainWireNormalAdultFiveWallPeriodicResultV3 {
  const resolved = validateAndResolveOptions(options);
  const runtime = normalAdultMainWireRuntimeV1(
    resolved.valveDiseaseBracketIds,
  );
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1(
    resolved.laSlsMode,
  );
  const pericardium = createMainWireNormalAdultCommonPericardiumV1(
    resolved.pericardiumMode,
    resolved.pericardiumCase,
  );
  const calciumDriveParams = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const calciumEventSchedule = createFixedSinusFiveWallCalciumEventScheduleV1(
    calciumDriveParams,
  );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const protocol = buildPeriodicProtocolIdentity(
    provider,
    runtime,
    pericardium,
    bloodVolumeOperatingPoint.identity,
    resolved.calciumRepresentation,
  );
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1({
    identity: protocol.identity,
    identityHash: protocol.identityHash,
    componentHashes: protocol.componentHashes,
    periodicPolicy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  });
  const canonicalCirculation = createInitialNonCoronaryCirculationStateV1({
    timeSec: 0,
    runtime,
    fixedTotalBloodVolumeMl:
      bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl,
    nodeVolumesMl: bloodVolumeOperatingPoint.nodeVolumesMl,
  });
  const canonicalCold = initializeMainWireFiveWallNonCoronaryV1({
    provider,
    runtime,
    calciumDriveParams,
    calciumRepresentation: resolved.calciumRepresentation,
    calciumEventSchedule,
    calciumInitialization:
      "regular-periodic-prehistory-from-fixed-prior",
    pericardium,
    circulationInitial: initialStateInput(canonicalCirculation),
  });
  const initializedState = resolved.warmStart !== null
    ? restoreWarmStart(provider, protocol, resolved.warmStart)
    : resolved.initialization === "canonical"
      ? canonicalCold.acceptedState
      : initializeMainWireFiveWallNonCoronaryV1({
        provider,
        runtime,
        calciumDriveParams,
        calciumRepresentation: resolved.calciumRepresentation,
        calciumEventSchedule,
        calciumInitialization:
          "regular-periodic-prehistory-from-fixed-prior",
        pericardium,
        circulationInitial: pulmonaryRedistributionInitialState(
          canonicalCirculation,
        ),
      }).acceptedState;
  const initializationAudit = resolved.warmStart === null
    ? auditInitialization(
      provider,
      canonicalCold.acceptedState,
      initializedState,
      resolved.initialization,
    )
    : auditWarmStartInitialization(
      provider,
      canonicalCold.acceptedState,
      initializedState,
      resolved.warmStart,
      protocol,
    );

  let state = initializedState;
  const boundaryStates: AcceptedState[] = [state];
  const observations: MainWireFiveWallPeriodicBeatObservationV1[] = [];
  const retainedCompleteBeats: MainWireNormalAdultFiveWallRetainedBeatV3[] = [];
  let retainedPartialBeat: MainWireNormalAdultFiveWallDiagnosticSampleV2[] = [];
  let retainedPartialAcceptedIntervals:
    MainWireNormalAdultFiveWallAcceptedDiagnosticIntervalV1[] = [];
  let lastAcceptedDiagnosticEndpoint:
    AcceptedIntervalEndpointSampleV1<
      MainWireNormalAdultFiveWallDiagnosticSampleV2
    > | null = null;
  let classification = classify(observations);
  let failure: MainWireNormalAdultFiveWallPeriodicResultV3["failure"] = null;

  beatLoop:
  for (
    let beatIndex = 1;
    beatIndex <= resolved.maximumBeatCount;
    beatIndex += 1
  ) {
    const beatSamples: MainWireNormalAdultFiveWallDiagnosticSampleV2[] = [];
    const beatIntervals:
      MainWireNormalAdultFiveWallAcceptedDiagnosticIntervalV1[] = [];
    const startTimeSec = state.acceptedTimeSec;
    const startRevision = state.revision;
    const precedingDiagnosticAtBeatStart = lastAcceptedDiagnosticEndpoint;
    for (
      let stepWithinBeat = 1;
      stepWithinBeat <= resolved.stepsPerBeat;
      stepWithinBeat += 1
    ) {
      const nominalEndTimeSec =
        startTimeSec + stepWithinBeat * resolved.dtSec;
      const subintervalEndTimes = resolved.calciumRepresentation
          === "exact-event-state"
        ? splitFiveWallCalciumIntervalAtEventsV1(
          state.acceptedTimeSec,
          nominalEndTimeSec,
          calciumEventSchedule,
        )
        : Object.freeze([nominalEndTimeSec]);
      for (const subintervalEndTimeSec of subintervalEndTimes) {
        const intervalStartTimeSec = state.acceptedTimeSec;
        const intervalStartRevision = state.revision;
        const stepped = stepMainWireFiveWallNonCoronaryV1(provider, state, {
          dtSec: subintervalEndTimeSec - state.acceptedTimeSec,
          runtime,
          calciumDriveParams,
          calciumEventSchedule,
          pericardium,
        });
        if (stepped.converged === false) {
          retainedPartialBeat = beatSamples;
          retainedPartialAcceptedIntervals = beatIntervals;
          failure = Object.freeze({
            beatIndex,
            stepWithinBeat,
            globalStepIndex:
              (beatIndex - 1) * resolved.stepsPerBeat + stepWithinBeat,
            timeSec: subintervalEndTimeSec,
            message: stepped.message,
            circulationFailureReason: stepped.circulationFailureReason,
            lastAcceptedCandidateNodeVolumesMl:
              stepped.lastAcceptedCandidateNodeVolumesMl,
            circulationDiagnostics: stepped.circulationDiagnostics,
          });
          break beatLoop;
        }
        if (stepped.calciumTrial.baseRevision !== intervalStartRevision) {
          throw new Error(
            "accepted calcium trial base revision differs from the coupled interval",
          );
        }
        const sample = sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped);
        const endpointSample = Object.freeze({
          timeSec: stepped.acceptedState.acceptedTimeSec,
          sample,
        });
        const interval = acceptedDiagnosticInterval(
          intervalStartTimeSec,
          stepped.acceptedState.acceptedTimeSec,
          endpointSample,
          stepped.calciumTrial.events,
          stepped.calciumTrial.baseRevision,
          stepped.acceptedState.calcium.scheduleId,
          stepped.acceptedState.calcium.scheduleIdentityHash,
        );
        state = stepped.acceptedState;
        beatSamples.push(sample);
        beatIntervals.push(interval);
        lastAcceptedDiagnosticEndpoint = endpointSample;
      }
    }

    boundaryStates.push(state);
    const currentBoundaryIndex = boundaryStates.length - 1;
    const period1 = compareMainWireFiveWallAcceptedStatesV1(
      state,
      boundaryStates[currentBoundaryIndex - 1]!,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    const period2 = currentBoundaryIndex >= 2
      ? compareMainWireFiveWallAcceptedStatesV1(
        state,
        boundaryStates[currentBoundaryIndex - 2]!,
        MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
      )
      : null;
    observations.push(Object.freeze({ beatIndex, period1, period2 }));
    classification = classify(observations);
    const acceptedIntervalTrace = retainedAcceptedIntervalTrace(
      startTimeSec,
      state.acceptedTimeSec,
      precedingDiagnosticAtBeatStart,
      Object.freeze(beatIntervals),
      beatIndex === 1 ? "cold-start" : null,
    );
    const retainedBeat = Object.freeze({
      beatIndex,
      startTimeSec,
      endTimeSec: state.acceptedTimeSec,
      startRevision,
      endRevision: state.revision,
      acceptedIntervalCount: beatIntervals.length,
      acceptedIntervalTrace,
      samples: Object.freeze(beatSamples),
    });
    validateRetainedBeat(retainedBeat);
    retainedCompleteBeats.push(retainedBeat);
    if (
      retainedCompleteBeats.length
      > MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
        .retainedCompleteBeatCount
    ) retainedCompleteBeats.shift();
    if (boundaryStates.length > 3) boundaryStates.shift();
    if (classification.status !== "not-converged") break;
  }

  const terminationReason = resolveTerminationReason(
    failure,
    classification,
  );
  const terminalCycleBoundaryWarmStart = failure === null
    && observations.length > 0
    ? buildCycleBoundaryWarmStart(
      provider,
      state,
      protocol,
      resolved.dtSec,
      observations.length,
    )
    : null;
  return Object.freeze({
    experimentId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V3_ID,
    schemaVersion: 3 as const,
    mode: "canonical" as const,
    protocolIdentity: protocol.identity,
    protocolIdentityHash: protocol.identityHash,
    protocolComponentHashes: protocol.componentHashes,
    bloodVolumeOperatingPointAudit: bloodVolumeOperatingPoint.audit,
    laSlsMode: resolved.laSlsMode,
    pericardiumMode: resolved.pericardiumMode,
    pericardiumCase: resolved.pericardiumCase,
    pericardiumParameterSetId: pericardium.parameterSetId,
    valvePreset: runtime.valvePreset,
    initialization: resolved.initialization,
    calciumRepresentation: resolved.calciumRepresentation,
    dtSec: resolved.dtSec,
    stepsPerBeat: resolved.stepsPerBeat,
    requestedMaximumBeatCount: resolved.maximumBeatCount,
    completedBeatCount: observations.length,
    terminationReason,
    integrationCompletedWithoutFailure: failure === null,
    periodicSteadyStateClaimed: terminationReason === "period1-converged",
    period2OrbitSuspected: terminationReason === "period2-suspect",
    periodicity: classification,
    beatClosure: Object.freeze(observations),
    retainedCompleteBeats: Object.freeze(retainedCompleteBeats),
    retainedPartialBeat: Object.freeze(retainedPartialBeat),
    terminalCycleBoundaryWarmStart,
    retainedPartialAcceptedIntervals: Object.freeze(
      retainedPartialAcceptedIntervals,
    ),
    failure,
    initializationAudit,
    policy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
    claim: Object.freeze({
      heartRateBpm: 60 as const,
      circulation: "main-wire-derived-noncoronary-experimental" as const,
      ordinaryBeatIterationOnly: true as const,
      shootingOrAndersonAccelerationApplied: false as const,
      parameterSearch: false as const,
      calciumRepresentationSelectionIsFixedEnum: true as const,
      exactEventCalciumStatesIncludedInPeriodClosure: true as const,
      exactEventRepresentationIntervalsSplitAtOffGridEvents: true as const,
      stepsPerBeatIsNominalGridCount: true as const,
      acceptedSubstepsMayExceedNominalStepsPerBeat: true as const,
      acceptedIntervalTimebaseId: ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
      acceptedIntervalOwnership: "open-start-closed-end" as const,
      acceptedIntervalEventsCopiedFromAcceptedCalciumTrial: true as const,
      retainedIntervalEventScheduleRequeryApplied: false as const,
      retainedPrecedingDiagnosticFabricated: false as const,
      initializationVariantChangesRuntimeOrMaterialParameters: false as const,
      pulmonaryRedistributionIsInitialConditionBasinAuditOnly: true as const,
      samePeriodicOrbitAcrossInitializationsClaimed: false as const,
      retainedSamplesAreAtMostTheLastThreeCompleteBeats: true as const,
      smoothingAppliedToSamples: false as const,
      pericardialConstraintInterfaceIncluded: true as const,
      pericardialConstraintEnabled: resolved.pericardiumMode === "on",
      pericardialConstraintMayBeSlackAtHealthyBaseline: true as const,
      warmStartIsInitialConditionOnly: true as const,
      valveDiseasePresetIsProtocolParameterNotAcceptedState: true as const,
      valveDiseaseBracketIsClinicalDiagnosis: false as const,
    }),
  });
}

/**
 * @deprecated Transitional source alias returning V3; use the explicit V3
 * runner and inspect its experiment ID/schema version.
 */
export const runMainWireNormalAdultFiveWallPeriodicSteadyV2 =
  runMainWireNormalAdultFiveWallPeriodicSteadyV3;
/**
 * @deprecated Transitional source alias returning V3; use the explicit V3
 * runner and inspect its experiment ID/schema version.
 */
export const runMainWireNormalAdultFiveWallPeriodicSteadyV1 =
  runMainWireNormalAdultFiveWallPeriodicSteadyV3;

function acceptedDiagnosticInterval(
  startTimeSec: number,
  endTimeSec: number,
  endpointSample: AcceptedIntervalEndpointSampleV1<
    MainWireNormalAdultFiveWallDiagnosticSampleV2
  >,
  calciumEvents: readonly FiveWallCalciumEventV1[],
  acceptedTrialBaseRevision: number,
  scheduleId: string,
  scheduleIdentityHash: string,
): MainWireNormalAdultFiveWallAcceptedDiagnosticIntervalV1 {
  const eventsOpenClosed = Object.freeze(calciumEvents.map((calciumEvent, index) => {
    const event = Object.freeze({
      source: "accepted-calcium-trial" as const,
      scheduleId,
      scheduleIdentityHash,
      acceptedTrialBaseRevision,
      eventIndexWithinAcceptedTrial: index,
      calciumEvent,
    });
    return Object.freeze({
      eventId: acceptedCalciumEventId(event),
      timeSec: calciumEvent.timeSec,
      event,
    }) satisfies AcceptedIntervalOpenClosedEventV1<
      MainWireNormalAdultFiveWallAcceptedCalciumEventV1
    >;
  }));
  return Object.freeze({
    startTimeSec,
    endTimeSec,
    durationSec: endTimeSec - startTimeSec,
    endpointSample,
    eventsOpenClosed,
  });
}

function acceptedCalciumEventId(
  event: MainWireNormalAdultFiveWallAcceptedCalciumEventV1,
): string {
  return [
    "calcium",
    event.scheduleIdentityHash,
    `r${event.acceptedTrialBaseRevision}`,
    `i${event.eventIndexWithinAcceptedTrial}`,
    stableHash(sanitizeForStableHash(event.calciumEvent)),
  ].join(":");
}

function retainedAcceptedIntervalTrace(
  startTimeSec: number,
  endTimeSec: number,
  precedingSample: AcceptedIntervalEndpointSampleV1<
    MainWireNormalAdultFiveWallDiagnosticSampleV2
  > | null,
  intervals: readonly MainWireNormalAdultFiveWallAcceptedDiagnosticIntervalV1[],
  missingReason: "cold-start" | null,
): MainWireNormalAdultFiveWallAcceptedIntervalTraceV1 {
  const common = {
    timebaseId: ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
    startTimeSec,
    endTimeSec,
    durationSec: endTimeSec - startTimeSec,
    intervals,
  } as const;
  if (precedingSample === null) {
    if (missingReason === null) {
      throw new Error(
        "retained beat is missing a preceding diagnostic without provenance",
      );
    }
    return Object.freeze({
      status: "missing-preceding-diagnostic" as const,
      reason: missingReason,
      ...common,
    });
  }
  if (missingReason !== null) {
    throw new Error(
      "retained beat cannot report a missing predecessor when one is present",
    );
  }
  return Object.freeze({
    status: "complete" as const,
    ...common,
    precedingSample,
  });
}

function validateRetainedBeat(
  beat: MainWireNormalAdultFiveWallRetainedBeatV3,
): void {
  if (!Number.isInteger(beat.beatIndex) || beat.beatIndex < 1) {
    throw new Error("retained beat index must be a positive integer");
  }
  if (!Number.isInteger(beat.startRevision) || beat.startRevision < 0) {
    throw new Error("retained beat start revision must be nonnegative integer");
  }
  if (!Number.isInteger(beat.endRevision) || beat.endRevision < 0) {
    throw new Error("retained beat end revision must be nonnegative integer");
  }
  if (
    beat.acceptedIntervalCount !== beat.acceptedIntervalTrace.intervals.length
    || beat.acceptedIntervalCount !== beat.samples.length
    || beat.acceptedIntervalCount !== beat.endRevision - beat.startRevision
  ) {
    throw new Error(
      "retained beat accepted interval, sample, and revision counts differ",
    );
  }
  if (beat.acceptedIntervalCount === 0) {
    throw new Error("retained complete beat has no accepted intervals");
  }
  const trace = beat.acceptedIntervalTrace;
  if (
    !acceptedTimeEqual(trace.startTimeSec, beat.startTimeSec)
    || !acceptedTimeEqual(trace.endTimeSec, beat.endTimeSec)
    || !acceptedTimeEqual(trace.durationSec, beat.endTimeSec - beat.startTimeSec)
  ) throw new Error("retained beat and accepted interval timebase differ");

  let expectedStartTimeSec = beat.startTimeSec;
  let durationSumSec = 0;
  const eventIds = new Set<string>();
  let previousEventTimeSec = Number.NEGATIVE_INFINITY;
  trace.intervals.forEach((interval, intervalIndex) => {
    if (!acceptedTimeEqual(interval.startTimeSec, expectedStartTimeSec)) {
      throw new Error("retained beat accepted intervals are not contiguous");
    }
    if (!(interval.durationSec > 0) || !Number.isFinite(interval.durationSec)) {
      throw new Error("retained beat accepted interval duration is invalid");
    }
    if (
      !acceptedTimeEqual(
        interval.durationSec,
        interval.endTimeSec - interval.startTimeSec,
      )
      || !acceptedTimeEqual(
        interval.endpointSample.timeSec,
        interval.endTimeSec,
      )
      || interval.endpointSample.sample !== beat.samples[intervalIndex]
      || !acceptedTimeEqual(
        interval.endpointSample.sample.timeSec,
        interval.endTimeSec,
      )
    ) throw new Error("retained accepted endpoint provenance is inconsistent");
    let previousLocalEventTimeSec = Number.NEGATIVE_INFINITY;
    interval.eventsOpenClosed.forEach((ownedEvent, localEventIndex) => {
      if (eventIds.has(ownedEvent.eventId)) {
        throw new Error("retained accepted event identity is duplicated");
      }
      eventIds.add(ownedEvent.eventId);
      if (
        ownedEvent.event.source !== "accepted-calcium-trial"
        || ownedEvent.event.acceptedTrialBaseRevision
          !== beat.startRevision + intervalIndex
        || ownedEvent.event.eventIndexWithinAcceptedTrial !== localEventIndex
        || ownedEvent.eventId !== acceptedCalciumEventId(ownedEvent.event)
        || ownedEvent.timeSec !== ownedEvent.event.calciumEvent.timeSec
        || ownedEvent.timeSec < interval.startTimeSec
        || acceptedTimeEqual(ownedEvent.timeSec, interval.startTimeSec)
        || (ownedEvent.timeSec > interval.endTimeSec
          && !acceptedTimeEqual(ownedEvent.timeSec, interval.endTimeSec))
        || (ownedEvent.timeSec < previousLocalEventTimeSec
          && !acceptedTimeEqual(
            ownedEvent.timeSec,
            previousLocalEventTimeSec,
          ))
        || (ownedEvent.timeSec < previousEventTimeSec
          && !acceptedTimeEqual(ownedEvent.timeSec, previousEventTimeSec))
      ) {
        throw new Error(
          "retained accepted event provenance is inconsistent: "
            + JSON.stringify({
              beatIndex: beat.beatIndex,
              intervalIndex,
              localEventIndex,
              intervalStartTimeSec: interval.startTimeSec,
              intervalEndTimeSec: interval.endTimeSec,
              eventTimeSec: ownedEvent.timeSec,
              previousLocalEventTimeSec,
              previousEventTimeSec,
              acceptedTrialBaseRevision:
                ownedEvent.event.acceptedTrialBaseRevision,
              expectedAcceptedTrialBaseRevision:
                beat.startRevision + intervalIndex,
            }),
        );
      }
      previousLocalEventTimeSec = ownedEvent.timeSec;
      previousEventTimeSec = ownedEvent.timeSec;
    });
    expectedStartTimeSec = interval.endTimeSec;
    durationSumSec += interval.durationSec;
  });
  if (
    !acceptedTimeEqual(expectedStartTimeSec, beat.endTimeSec)
    || !acceptedTimeEqual(durationSumSec, beat.endTimeSec - beat.startTimeSec)
  ) throw new Error("retained accepted interval duration ledger is inconsistent");
  if (trace.status === "complete") {
    validateRetainedAcceptedIntervalWindowV1(trace);
  } else {
    if ("precedingSample" in trace) {
      throw new Error("missing-predecessor trace contains a fabricated sample");
    }
    if (trace.reason === "cold-start" && beat.startRevision !== 0) {
      throw new Error("cold-start predecessor may be missing only at revision zero");
    }
  }
}

function acceptedTimeEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(
    1e-12,
    64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right)),
  );
}

export function assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1(
  input: Readonly<{
    identity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
    identityHash: string;
    componentHashes:
      MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
    periodicPolicy:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  }>,
): void {
  const { identity, identityHash, componentHashes, periodicPolicy } = input;
  if (identityHash !== hashProtocolValue(identity)) {
    throw new Error("periodic protocol identity hash is inconsistent");
  }
  if (
    componentHashes.mechanicsProviderMetadataStableHash
      !== hashProtocolValue(identity.mechanicsProvider)
  ) throw new Error("periodic mechanics component hash is inconsistent");
  if (
    componentHashes.calciumDriveFixedParamsStableHash
      !== identity.calciumDrive.fixedParamsStableHash
    || componentHashes.calciumDriveFixedParamsStableHash
      !== hashProtocolValue(FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1)
    || identity.calciumDrive.parameterSetId
      !== FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId
  ) throw new Error("periodic calcium component hash is inconsistent");
  const calciumStateContractHash = hashProtocolValue({
    representation: identity.calciumDrive.representation,
    stateSchemaId: identity.calciumDrive.stateSchemaId,
    stateSchemaVersion: identity.calciumDrive.stateSchemaVersion,
    eventScheduleId: identity.calciumDrive.eventScheduleId,
    eventScheduleIdentityHash:
      identity.calciumDrive.eventScheduleIdentityHash,
    initializationId: identity.calciumDrive.initializationId,
    eventKernelId: identity.calciumDrive.eventKernelId,
    periodicConversionId: identity.calciumDrive.periodicConversionId,
  });
  if (
    componentHashes.calciumStateContractStableHash !== calciumStateContractHash
    || identity.calciumDrive.stateContractStableHash !== calciumStateContractHash
    || identity.calciumDrive.stateSchemaId
      !== FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID
    || identity.calciumDrive.stateSchemaVersion !== 1
    || identity.calciumDrive.eventKernelId
      !== EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID
    || identity.calciumDrive.periodicConversionId
      !== "analytic-periodic-biexponential-to-exact-event-v1"
    || !/^[0-9a-f]{8}$/.test(identity.calciumDrive.eventScheduleIdentityHash)
    || identity.calciumDrive.initializationId
      !== "regular-periodic-prehistory-from-fixed-prior"
  ) throw new Error("periodic calcium state contract hash is inconsistent");
  const expectedCalciumSchedule =
    createFixedSinusFiveWallCalciumEventScheduleV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    );
  if (
    identity.calciumDrive.eventScheduleId
      !== expectedCalciumSchedule.scheduleId
    || identity.calciumDrive.eventScheduleIdentityHash
      !== expectedCalciumSchedule.scheduleIdentityHash
  ) throw new Error("periodic calcium event schedule is inconsistent");
  const topologyHash = hashProtocolValue(
    identity.circulation.topologyGraphSnapshot,
  );
  if (
    componentHashes.circulationTopologyGraphStableHash !== topologyHash
    || identity.circulation.topologyGraphStableHash !== topologyHash
  ) throw new Error("periodic circulation topology hash is inconsistent");
  if (
    componentHashes.circulationRuntimeStableHash
      !== identity.circulation.runtimeStableHash
    || identity.circulation.valvePresetStableHash
      !== hashProtocolValue(identity.circulation.valvePresetSnapshot)
  ) {
    throw new Error(
      "periodic circulation runtime or valve preset hash is inconsistent",
    );
  }
  if (
    componentHashes.bloodVolumeOperatingPointStableHash
      !== hashProtocolValue(identity.bloodVolumeOperatingPoint)
  ) throw new Error("periodic blood-volume operating point hash is inconsistent");
  const pericardiumHash = hashProtocolValue(
    identity.commonPericardium.bindingSnapshot,
  );
  if (
    componentHashes.commonPericardiumStableHash !== pericardiumHash
    || identity.commonPericardium.stableHash !== pericardiumHash
    || identity.commonPericardium.bindingId
      !== identity.commonPericardium.bindingSnapshot.bindingId
    || identity.commonPericardium.parameterSetId
      !== identity.commonPericardium.bindingSnapshot.parameterSetId
    || identity.commonPericardium.mode
      !== identity.commonPericardium.bindingSnapshot.mode
  ) throw new Error("periodic common-pericardium hash is inconsistent");
  const policyHash = hashProtocolValue(periodicPolicy);
  if (
    componentHashes.periodicPolicyStableHash !== policyHash
    || identity.periodicPolicy.policyStableHash !== policyHash
    || identity.periodicPolicy.policyId !== periodicPolicy.policyId
  ) throw new Error("periodic policy component hash is inconsistent");
}

function buildPeriodicProtocolIdentity(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  pericardium: MainWireCommonPericardiumBindingV1,
  bloodVolumeOperatingPoint:
    MainWireNormalAdultBloodVolumeOperatingPointIdentityV1,
  calciumRepresentation: FiveWallCalciumRepresentationV1,
): Readonly<{
  identity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  identityHash: string;
  componentHashes: MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
}> {
  const mechanicsProvider = deepFreezeProtocolValue({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  const topologyGraph = buildNonCoronaryCirculationGraphV1();
  const commonPericardium = deepFreezeProtocolValue({
    bindingId: pericardium.bindingId,
    parameterSetId: pericardium.parameterSetId,
    mode: pericardium.mode,
    parameters: pericardium.parameters,
    wallMaterialVolumesM3: pericardium.wallMaterialVolumesM3,
    prescribedPericardialFluidVolumeM3:
      pericardium.prescribedPericardialFluidVolumeM3,
  });
  validateCalciumRepresentation(calciumRepresentation);
  const calciumEventSchedule = createFixedSinusFiveWallCalciumEventScheduleV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  );
  const calciumStateContract = deepFreezeProtocolValue({
    representation: calciumRepresentation,
    stateSchemaId: FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID,
    stateSchemaVersion: 1 as const,
    eventScheduleId: calciumEventSchedule.scheduleId,
    eventScheduleIdentityHash: calciumEventSchedule.scheduleIdentityHash,
    initializationId:
      "regular-periodic-prehistory-from-fixed-prior" as const,
    eventKernelId: EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID,
    periodicConversionId:
      "analytic-periodic-biexponential-to-exact-event-v1" as const,
  });
  const topologyGraphSnapshot = deepFreezeProtocolValue({
    topologyId: topologyGraph.topologyId,
    nodes: topologyGraph.nodes,
    edges: topologyGraph.edges,
    scope: topologyGraph.scope,
  }) as MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1["circulation"]["topologyGraphSnapshot"];
  const componentHashes = Object.freeze({
    mechanicsProviderMetadataStableHash: hashProtocolValue(mechanicsProvider),
    calciumDriveFixedParamsStableHash:
      hashProtocolValue(FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1),
    calciumStateContractStableHash:
      hashProtocolValue(calciumStateContract),
    circulationTopologyGraphStableHash:
      hashProtocolValue(topologyGraphSnapshot),
    circulationRuntimeStableHash: hashProtocolValue(runtime),
    bloodVolumeOperatingPointStableHash:
      hashProtocolValue(bloodVolumeOperatingPoint),
    commonPericardiumStableHash: hashProtocolValue(commonPericardium),
    periodicPolicyStableHash:
      hashProtocolValue(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1),
  });
  const identity = deepFreezeProtocolValue({
    identityId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID,
    mechanicsProvider,
    calciumDrive: {
      driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
      parameterSetId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId,
      fixedParamsStableHash:
        componentHashes.calciumDriveFixedParamsStableHash,
      ...calciumStateContract,
      stateContractStableHash:
        componentHashes.calciumStateContractStableHash,
    },
    circulation: {
      topologyGraphSnapshot,
      topologyGraphStableHash:
        componentHashes.circulationTopologyGraphStableHash,
      runtimeStableHash: componentHashes.circulationRuntimeStableHash,
      valvePresetStableHash: hashProtocolValue(runtime.valvePreset),
      valvePresetSnapshot: runtime.valvePreset,
    },
    bloodVolumeOperatingPoint,
    commonPericardium: {
      bindingId: pericardium.bindingId,
      parameterSetId: pericardium.parameterSetId,
      mode: pericardium.mode,
      stableHash: componentHashes.commonPericardiumStableHash,
      bindingSnapshot: commonPericardium,
    },
    periodicPolicy: {
      policyId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.policyId,
      policyStableHash: componentHashes.periodicPolicyStableHash,
    },
  }) as MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  return Object.freeze({
    identity,
    identityHash: hashProtocolValue(identity),
    componentHashes,
  });
}

function hashProtocolValue(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}

function deepFreezeProtocolValue<T>(value: T): Readonly<T> {
  const sanitized = sanitizeForStableHash(value) as T;
  return deepFreezeObject(sanitized);
}

function deepFreezeObject<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeObject(child);
    }
    Object.freeze(value);
  }
  return value;
}

function initialStateInput(
  state: ReturnType<typeof createInitialNonCoronaryCirculationStateV1>,
): Omit<NonCoronaryCirculationInitialStateInputV1, "timeSec" | "runtime"> {
  return Object.freeze({
    fixedTotalBloodVolumeMl: state.totalBloodVolumeMl,
    nodeVolumesMl: state.nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: state.dynamicEdgeFlowsMlPerSec,
    valveStates: state.valveStates,
  });
}

function pulmonaryRedistributionInitialState(
  canonical: ReturnType<typeof createInitialNonCoronaryCirculationStateV1>,
): Omit<NonCoronaryCirculationInitialStateInputV1, "timeSec" | "runtime"> {
  const transfer =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1
      .transferredVolumeMl;
  const nodeVolumesMl = Object.freeze({
    ...canonical.nodeVolumesMl,
    PVen: canonical.nodeVolumesMl.PVen - transfer,
    PVein: canonical.nodeVolumesMl.PVein + transfer,
  });
  if (!(nodeVolumesMl.PVen > 0)) {
    throw new Error("fixed pulmonary redistribution made PVen nonpositive");
  }
  const before = sumNodeVolumes(canonical.nodeVolumesMl);
  const after = sumNodeVolumes(nodeVolumesMl);
  if (Math.abs(after - before) > 1e-12) {
    throw new Error("fixed pulmonary redistribution changed total blood volume");
  }
  return Object.freeze({
    fixedTotalBloodVolumeMl: canonical.totalBloodVolumeMl,
    nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: canonical.dynamicEdgeFlowsMlPerSec,
    valveStates: canonical.valveStates,
  });
}

function auditInitialization(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  canonical: AcceptedState,
  initialized: AcceptedState,
  variant: MainWireNormalAdultFiveWallPeriodicInitializationV1,
): MainWireNormalAdultFiveWallPeriodicResultV3["initializationAudit"] {
  if (variant === "cycle-boundary-warm-start") {
    throw new Error("warm-start initialization requires its dedicated audit");
  }
  const canonicalTotal = canonical.circulation.totalBloodVolumeMl;
  const initializedTotal = initialized.circulation.totalBloodVolumeMl;
  const totalDifference = initializedTotal - canonicalTotal;
  if (Math.abs(totalDifference) > 1e-12) {
    throw new Error("periodic initialization basin audit changed total blood volume");
  }
  const redistributed = variant !== "canonical";
  const transfer = redistributed
    ? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1
      .transferredVolumeMl
    : 0;
  for (const node of NON_CORONARY_NODE_NAMES_V1) {
    const expectedDelta = node === "PVen"
      ? -transfer
      : node === "PVein" ? transfer : 0;
    const actualDelta = initialized.circulation.nodeVolumesMl[node]
      - canonical.circulation.nodeVolumesMl[node];
    if (Math.abs(actualDelta - expectedDelta) > 1e-12) {
      throw new Error(`periodic basin audit changed unexpected node ${node}`);
    }
  }
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (
      initialized.circulation.nodeVolumesMl[chamber]
      !== canonical.circulation.nodeVolumesMl[chamber]
    ) throw new Error("periodic basin audit changed a chamber cold volume");
  }
  if (
    JSON.stringify(initialized.circulation.dynamicEdgeFlowsMlPerSec)
      !== JSON.stringify(canonical.circulation.dynamicEdgeFlowsMlPerSec)
  ) throw new Error("periodic basin audit changed a dynamic edge flow");
  if (
    JSON.stringify(initialized.circulation.valveStates)
      !== JSON.stringify(canonical.circulation.valveStates)
  ) throw new Error("periodic basin audit changed a valve opening state");
  const mechanicsChanged = initialized.mechanics.materialStateFingerprint
    !== canonical.mechanics.materialStateFingerprint
    || JSON.stringify(provider.stateCodec.encode(initialized.mechanics.materialState))
      !== JSON.stringify(provider.stateCodec.encode(canonical.mechanics.materialState));
  if (mechanicsChanged) {
    throw new Error("periodic basin audit changed the mechanics cold state");
  }
  if (JSON.stringify(initialized.calcium) !== JSON.stringify(canonical.calcium)) {
    throw new Error("periodic basin audit changed the calcium cold state");
  }
  return Object.freeze({
    canonicalTotalBloodVolumeMl: canonicalTotal,
    initializedTotalBloodVolumeMl: initializedTotal,
    totalBloodVolumeDifferenceMl: totalDifference,
    chamberVolumesChanged: false as const,
    dynamicEdgeFlowsChanged: false as const,
    valveOpeningStatesChanged: false as const,
    mechanicsColdInputChanged: false as const,
    mechanicsColdStateFingerprintChanged: false as const,
    calciumColdStateChanged: false as const,
    transferredVolumeMl: transfer,
    sourceNode: redistributed ? "PVen" as const : null,
    destinationNode: redistributed ? "PVein" as const : null,
    pulmonaryNodeVolumeDeltaMl: Object.freeze({
      PVen: -transfer,
      PVein: transfer,
    }),
    warmStartSourceProtocolIdentityHash: null,
    warmStartTargetProtocolIdentityHash: null,
    warmStartSourcePericardiumStableHash: null,
    warmStartTargetPericardiumStableHash: null,
    warmStartProtocolDifference: "not-a-warm-start" as const,
  });
}

function restoreWarmStart(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  targetProtocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
): AcceptedState {
  if (
    warmStart.warmStartId
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID
    || warmStart.schemaVersion !== 3
  ) throw new Error("unsupported five-wall cycle warm start");
  const { envelopeFingerprint, ...fingerprintedEnvelope } = warmStart;
  if (hashProtocolValue(fingerprintedEnvelope) !== envelopeFingerprint) {
    throw new Error("warm-start envelope fingerprint mismatch");
  }
  if (
    hashProtocolValue(warmStart.sourceProtocolIdentity)
      !== warmStart.sourceProtocolIdentityHash
  ) throw new Error("warm-start source protocol identity hash mismatch");
  validateWarmStartSourceProtocolConsistency(warmStart);
  const targetHashes = targetProtocol.componentHashes;
  for (const key of [
    "mechanicsProviderMetadataStableHash",
    "calciumDriveFixedParamsStableHash",
    "calciumStateContractStableHash",
    "circulationTopologyGraphStableHash",
    "circulationRuntimeStableHash",
    "bloodVolumeOperatingPointStableHash",
    "periodicPolicyStableHash",
  ] as const) {
    if (warmStart.sourceComponentHashes[key] !== targetHashes[key]) {
      throw new Error(`warm-start component mismatch: ${key}`);
    }
  }
  const pericardiumMatches = warmStart.sourceComponentHashes
    .commonPericardiumStableHash === targetHashes.commonPericardiumStableHash;
  const sourceAndTargetIdentityMatch = warmStart.sourceProtocolIdentityHash
    === targetProtocol.identityHash;
  if (pericardiumMatches !== sourceAndTargetIdentityMatch) {
    throw new Error("warm-start protocol difference is not common-pericardium-only");
  }
  const checkpointBloodVolumeOwnerMl =
    warmStart.checkpoint.circulation.state.totalBloodVolumeMl;
  if (
    !Number.isFinite(checkpointBloodVolumeOwnerMl)
    || checkpointBloodVolumeOwnerMl
      !== warmStart.sourceProtocolIdentity.bloodVolumeOperatingPoint
        .fixedTotalBloodVolumeMl
    || checkpointBloodVolumeOwnerMl
      !== targetProtocol.identity.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl
  ) {
    throw new Error("warm-start checkpoint TBV owner does not match protocol identity");
  }
  const phase = positiveModulo(warmStart.checkpoint.acceptedTimeSec, CYCLE_LENGTH_SEC);
  if (Math.min(phase, CYCLE_LENGTH_SEC - phase) > 1e-9) {
    throw new Error("warm start must be captured at the HR60 cycle boundary");
  }
  const sourceSteps = CYCLE_LENGTH_SEC / warmStart.sourceDtSec;
  const sourceStepsPerBeat = Math.round(sourceSteps);
  if (
    !(warmStart.sourceDtSec > 0)
    || !Number.isInteger(sourceStepsPerBeat)
    || Math.abs(sourceSteps - sourceStepsPerBeat) > 1e-12
    || !Number.isInteger(warmStart.sourceCompletedBeatCount)
    || warmStart.sourceCompletedBeatCount <= 0
    || warmStart.checkpoint.revision
      !== sourceStepsPerBeat * warmStart.sourceCompletedBeatCount
    || Math.abs(
      warmStart.checkpoint.acceptedTimeSec
        - warmStart.sourceCompletedBeatCount * CYCLE_LENGTH_SEC,
    ) > 1e-9
  ) throw new Error("warm-start source dt/beat/checkpoint provenance mismatch");
  return restoreMainWireFiveWallNonCoronaryV1(
    provider,
    warmStart.checkpoint,
    { revision: 0, acceptedTimeSec: 0 },
  );
}

function validateWarmStartSourceProtocolConsistency(
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
): void {
  const identity = warmStart.sourceProtocolIdentity;
  const hashes = warmStart.sourceComponentHashes;
  try {
    assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1({
      identity,
      identityHash: warmStart.sourceProtocolIdentityHash,
      componentHashes: hashes,
      periodicPolicy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
    });
  } catch {
    throw new Error("warm-start source protocol provenance mismatch");
  }
  if (
    identity.identityId
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID
    || hashProtocolValue(identity.mechanicsProvider)
      !== hashes.mechanicsProviderMetadataStableHash
    || identity.calciumDrive.fixedParamsStableHash
      !== hashes.calciumDriveFixedParamsStableHash
    || identity.circulation.topologyGraphStableHash
      !== hashes.circulationTopologyGraphStableHash
    || hashProtocolValue(identity.circulation.topologyGraphSnapshot)
      !== hashes.circulationTopologyGraphStableHash
    || identity.circulation.runtimeStableHash
      !== hashes.circulationRuntimeStableHash
    || hashProtocolValue(identity.circulation.valvePresetSnapshot)
      !== identity.circulation.valvePresetStableHash
    || identity.bloodVolumeOperatingPoint === undefined
    || hashProtocolValue(identity.bloodVolumeOperatingPoint)
      !== hashes.bloodVolumeOperatingPointStableHash
    || identity.commonPericardium.stableHash
      !== hashes.commonPericardiumStableHash
    || hashProtocolValue(identity.commonPericardium.bindingSnapshot)
      !== hashes.commonPericardiumStableHash
    || identity.commonPericardium.bindingId
      !== identity.commonPericardium.bindingSnapshot.bindingId
    || identity.commonPericardium.parameterSetId
      !== identity.commonPericardium.bindingSnapshot.parameterSetId
    || identity.commonPericardium.mode
      !== identity.commonPericardium.bindingSnapshot.mode
    || identity.periodicPolicy.policyStableHash
      !== hashes.periodicPolicyStableHash
    || identity.commonPericardium.mode !== warmStart.sourcePericardiumMode
    || identity.commonPericardium.parameterSetId
      !== warmStart.sourcePericardiumParameterSetId
    || warmStart.claim.cycleBoundaryPhase01 !== 0
    || warmStart.claim.timeRebasedToZeroOnRestore !== true
    || warmStart.claim.parameterSearch !== false
    || warmStart.claim.pericardiumStateStored !== false
  ) throw new Error("warm-start source protocol provenance mismatch");
}

function buildCycleBoundaryWarmStart(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  state: AcceptedState,
  protocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
  dtSec: number,
  completedBeatCount: number,
): MainWireNormalAdultFiveWallCycleWarmStartV1 {
  const phase = positiveModulo(state.acceptedTimeSec, CYCLE_LENGTH_SEC);
  if (Math.min(phase, CYCLE_LENGTH_SEC - phase) > 1e-9) {
    throw new Error("terminal warm start is not on a cycle boundary");
  }
  const envelope = {
    warmStartId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID,
    schemaVersion: 3 as const,
    sourceProtocolIdentity: protocol.identity,
    sourceProtocolIdentityHash: protocol.identityHash,
    sourceComponentHashes: Object.freeze({ ...protocol.componentHashes }),
    sourcePericardiumMode: protocol.identity.commonPericardium.mode,
    sourcePericardiumParameterSetId:
      protocol.identity.commonPericardium.parameterSetId,
    sourceDtSec: dtSec,
    sourceCompletedBeatCount: completedBeatCount,
    checkpoint: checkpointMainWireFiveWallNonCoronaryV1(provider, state),
    claim: Object.freeze({
      cycleBoundaryPhase01: 0 as const,
      timeRebasedToZeroOnRestore: true as const,
      parameterSearch: false as const,
      pericardiumStateStored: false as const,
    }),
  };
  return Object.freeze({
    ...envelope,
    envelopeFingerprint: hashProtocolValue(envelope),
  });
}

function auditWarmStartInitialization(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  canonical: AcceptedState,
  initialized: AcceptedState,
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
  targetProtocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
): MainWireNormalAdultFiveWallPeriodicResultV1["initializationAudit"] {
  const canonicalTotal = canonical.circulation.totalBloodVolumeMl;
  const initializedTotal = initialized.circulation.totalBloodVolumeMl;
  const totalDifference = initializedTotal - canonicalTotal;
  if (Math.abs(totalDifference) > 1e-9) {
    throw new Error("cycle warm start changed total blood volume");
  }
  const chamberVolumesChanged = (["LA", "LV", "RA", "RV"] as const)
    .some((chamber) => initialized.circulation.nodeVolumesMl[chamber]
      !== canonical.circulation.nodeVolumesMl[chamber]);
  const dynamicEdgeFlowsChanged = JSON.stringify(
    initialized.circulation.dynamicEdgeFlowsMlPerSec,
  ) !== JSON.stringify(canonical.circulation.dynamicEdgeFlowsMlPerSec);
  const valveOpeningStatesChanged = JSON.stringify(
    initialized.circulation.valveStates,
  ) !== JSON.stringify(canonical.circulation.valveStates);
  const mechanicsColdStateFingerprintChanged =
    initialized.mechanics.materialStateFingerprint
      !== canonical.mechanics.materialStateFingerprint
    || JSON.stringify(provider.stateCodec.encode(initialized.mechanics.materialState))
      !== JSON.stringify(provider.stateCodec.encode(canonical.mechanics.materialState));
  const calciumColdStateChanged = JSON.stringify(initialized.calcium)
    !== JSON.stringify(canonical.calcium);
  return Object.freeze({
    canonicalTotalBloodVolumeMl: canonicalTotal,
    initializedTotalBloodVolumeMl: initializedTotal,
    totalBloodVolumeDifferenceMl: totalDifference,
    chamberVolumesChanged,
    dynamicEdgeFlowsChanged,
    valveOpeningStatesChanged,
    mechanicsColdInputChanged: chamberVolumesChanged,
    mechanicsColdStateFingerprintChanged,
    calciumColdStateChanged,
    transferredVolumeMl: 0,
    sourceNode: null,
    destinationNode: null,
    pulmonaryNodeVolumeDeltaMl: Object.freeze({
      PVen: initialized.circulation.nodeVolumesMl.PVen
        - canonical.circulation.nodeVolumesMl.PVen,
      PVein: initialized.circulation.nodeVolumesMl.PVein
        - canonical.circulation.nodeVolumesMl.PVein,
    }),
    warmStartSourceProtocolIdentityHash:
      warmStart.sourceProtocolIdentityHash,
    warmStartTargetProtocolIdentityHash: targetProtocol.identityHash,
    warmStartSourcePericardiumStableHash:
      warmStart.sourceComponentHashes.commonPericardiumStableHash,
    warmStartTargetPericardiumStableHash:
      targetProtocol.componentHashes.commonPericardiumStableHash,
    warmStartProtocolDifference:
      warmStart.sourceProtocolIdentityHash === targetProtocol.identityHash
        ? "none" as const
        : "common-pericardium-only" as const,
  });
}

function classify(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
): MainWireFiveWallPeriodicClassificationV1 {
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  return classifyMainWireFiveWallPeriodicityV1(observations, {
    period1NormalizedTolerance: policy.period1NormalizedTolerance,
    period2NormalizedTolerance: policy.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      policy.period2MinimumPeriod1NormalizedDelta,
    consecutiveBeats: policy.consecutiveBeats,
  });
}

function resolveTerminationReason(
  failure: MainWireNormalAdultFiveWallPeriodicResultV3["failure"],
  classification: MainWireFiveWallPeriodicClassificationV1,
): MainWireNormalAdultFiveWallPeriodicTerminationReasonV1 {
  if (failure !== null) return "step-failure";
  if (classification.status === "period1-converged") {
    return "period1-converged";
  }
  if (classification.status === "period2-suspect") return "period2-suspect";
  return "maximum-beats-reached";
}

function validateAndResolveOptions(
  options: MainWireNormalAdultFiveWallPeriodicOptionsV1,
): Readonly<{
  dtSec: number;
  stepsPerBeat: number;
  maximumBeatCount: number;
  laSlsMode: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode: MainWireCommonPericardiumModeV1;
  pericardiumCase: MainWireNormalAdultCommonPericardiumCaseV1;
  valveDiseaseBracketIds: readonly MainWireFourValveDiseaseBracketIdV1[];
  initialization: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1 | null;
  calciumRepresentation: FiveWallCalciumRepresentationV1;
}> {
  if (!(options.dtSec > 0) || !Number.isFinite(options.dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  const steps = CYCLE_LENGTH_SEC / options.dtSec;
  const stepsPerBeat = Math.round(steps);
  if (!Number.isInteger(stepsPerBeat) || Math.abs(steps - stepsPerBeat) > 1e-12) {
    throw new Error("dtSec must divide the fixed HR60 one-second cycle exactly");
  }
  const maximumBeatCount = options.maximumBeatCount
    ?? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
      .defaultMaximumBeatCount;
  if (!Number.isInteger(maximumBeatCount) || maximumBeatCount <= 0) {
    throw new Error("maximumBeatCount must be a positive integer");
  }
  const laSlsMode = options.laSlsMode ?? "on";
  if (laSlsMode !== "on" && laSlsMode !== "exact-off") {
    throw new Error("unsupported LA SLS mode");
  }
  const pericardiumMode = options.pericardiumMode ?? "on";
  if (pericardiumMode !== "on" && pericardiumMode !== "exact-off") {
    throw new Error("unsupported common-pericardium mode");
  }
  const pericardiumCase = options.pericardiumCase ?? "healthy-slack";
  if (
    pericardiumCase !== "healthy-slack"
    && pericardiumCase !== "effusion-300ml-positive-control"
    && pericardiumCase
      !== "global-capacity-vh0-430ml-positive-control"
  ) throw new Error("unsupported common-pericardium case");
  const warmStart = options.warmStart ?? null;
  const requestedInitialization = options.initialization ?? "canonical";
  if (warmStart !== null && requestedInitialization !== "canonical"
    && requestedInitialization !== "cycle-boundary-warm-start") {
    throw new Error("warm start cannot be combined with another initialization variant");
  }
  if (warmStart === null
    && requestedInitialization === "cycle-boundary-warm-start") {
    throw new Error("cycle-boundary-warm-start requires a warmStart payload");
  }
  if (
    requestedInitialization !== "canonical"
    && requestedInitialization !== "cycle-boundary-warm-start"
    && requestedInitialization
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1.variant
  ) throw new Error("unsupported periodic initialization variant");
  const initialization = warmStart === null
    ? requestedInitialization
    : "cycle-boundary-warm-start" as const;
  const calciumRepresentation = options.calciumRepresentation
    ?? "analytic-periodic-control-with-exact-event-shadow";
  validateCalciumRepresentation(calciumRepresentation);
  return Object.freeze({
    dtSec: options.dtSec,
    stepsPerBeat,
    maximumBeatCount,
    laSlsMode,
    pericardiumMode,
    pericardiumCase,
    valveDiseaseBracketIds: Object.freeze([
      ...(options.valveDiseaseBracketIds ?? []),
    ]),
    initialization,
    warmStart,
    calciumRepresentation,
  });
}

function validateCalciumRepresentation(
  value: FiveWallCalciumRepresentationV1,
): void {
  if (
    value !== "analytic-periodic-control-with-exact-event-shadow"
    && value !== "exact-event-state"
  ) throw new Error("unsupported five-wall calcium representation");
}

function sumNodeVolumes(
  volumes: Readonly<Record<(typeof NON_CORONARY_NODE_NAMES_V1)[number], number>>,
): number {
  return NON_CORONARY_NODE_NAMES_V1.reduce(
    (sum, node) => sum + volumes[node],
    0,
  );
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}
