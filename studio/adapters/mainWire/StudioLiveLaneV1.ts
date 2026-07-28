import {
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_LIMITATIONS_V1,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_SHA256,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION,
} from "@/engine/scientific/assembly/mainWireAdultFiveWallNonCoronaryReleaseV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
} from "@/engine/scientific/observables/MainWireScientificObservableRegistryV1";
import {
  INTEGRATED_V3_LANE_KIND_V1,
  type StudioLaneCapabilitiesV1,
  type StudioLaneCapabilityV1,
  type StudioLaneDescriptorV1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import type {
  MainWireIntegratedLaneObservableFrameV1,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import type {
  RuntimeExecutionIdentityV1,
} from "@/studio/contracts/v1/artifacts";
import type {
  RuntimePresentationSignalSubscriptionV1,
  RuntimeTargetIntentExecutionV1,
  SimulationRuntimePortV1,
} from "@/studio/contracts/v1/ports";
import type {
  OpenSimulationSessionCommandV1,
  PromoteSteadyCandidateCommandV1,
  RuntimeCandidatePromotedV1,
  RuntimeLivePacingStateV1,
  RuntimePresentationSignalChannelRefV1,
  RuntimePresentationSignalEventV1,
  RuntimePresentationSignalFailureV1,
  RuntimeSessionOpenedV1,
  RuntimeTargetIntentCommandV1,
} from "@/studio/contracts/v1/runtime";

export const STUDIO_NONCORONARY_LANE_KIND_V1 =
  "noncoronary-v1" as const;
export const STUDIO_LIVE_LANE_SIGNAL_CHANNEL_PROTOCOL_V1 =
  "circleheart-studio-runtime-signal-channel-v1" as const;
export const STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1 =
  "integrated-v3-live-presentation" as const;

export type StudioLiveLaneKindV1 =
  | typeof STUDIO_NONCORONARY_LANE_KIND_V1
  | typeof INTEGRATED_V3_LANE_KIND_V1;

/**
 * Hash of the canonical non-coronary observable-registry snapshot embedded in
 * release 0.2.0. It is descriptor identity, not a second release identity.
 */
export const STUDIO_NONCORONARY_OBSERVABLE_CATALOG_SHA256_V1 =
  "f1ad4bb8de57ff396587e5639f0a81266f174122588d05e9465dd01470421867" as const;

export const STUDIO_NONCORONARY_LANE_CAPABILITIES_V1 = Object.freeze({
  liveWorkerExecution: availableV1(),
  decimatedLivePresentation: availableV1(),
  livePacingReporting: availableV1(),
  suspendResumePresentation: availableV1(),
  operationalWorkerRotationCheckpoint: availableV1(),
  interactiveResearchControls: availableV1(),
  strictPeriodicSettlement: availableV1(),
  steadyCandidatePromotion: availableV1(),
  candidatePinning: availableV1(),
  persistedWarmSnapshot: availableV1(),
  exactSignalExport: availableV1(),
  presentationBeatEstimates: availableV1(),
  hemodynamicSideAnalysis: availableV1(),
  pvRelationsSideAnalysis: availableV1(),
  tbvContinuationSeedPrediction: availableV1(),
  externalAfRhythm: unavailableV1(
    "not-implemented-for-this-lane",
    "The non-coronary lane does not expose an external atrial-fibrillation rhythm owner.",
  ),
  iabpSupport: unavailableV1(
    "not-implemented-for-this-lane",
    "The non-coronary lane does not include a device graph or IABP.",
  ),
  releaseOrCandidateIdentity: availableV1(),
} satisfies StudioLaneCapabilitiesV1);

export const STUDIO_NONCORONARY_LANE_DESCRIPTOR_V1 = Object.freeze({
  laneKind: STUDIO_NONCORONARY_LANE_KIND_V1,
  laneId: "main-wire-adult-five-wall-noncoronary-0.2.0",
  displayName: "Main Wire — non-coronary",
  badge: "Candidate · verified research",
  releaseRef: Object.freeze({
    id: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID,
    version: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION,
    sha256: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_SHA256,
  }),
  lifecycleStatus: "candidate" as const,
  evidenceStatus: "verified-research" as const,
  observableCatalogId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  observableCatalogSha256:
    STUDIO_NONCORONARY_OBSERVABLE_CATALOG_SHA256_V1,
  limitations: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_LIMITATIONS_V1,
  capabilities: STUDIO_NONCORONARY_LANE_CAPABILITIES_V1,
} satisfies StudioLaneDescriptorV1);

export const STUDIO_NONCORONARY_EXECUTION_IDENTITY_V1 = Object.freeze({
  modelRef:
    `${MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID}@${MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION}:sha256:${MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_SHA256}`,
  runtimeRef: "main-wire-scientific-browser-worker@1",
  solverRef: "main-wire-five-wall-noncoronary-transaction@1",
  stateCodecRef: "main-wire-five-wall-noncoronary-accepted-state@1",
  protocolRef: "main-wire-periodic-settlement@1",
} satisfies RuntimeExecutionIdentityV1);

export type OpenStudioNonCoronaryLiveLaneCommandV1 = Readonly<{
  laneKind: typeof STUDIO_NONCORONARY_LANE_KIND_V1;
  command: OpenSimulationSessionCommandV1;
}>;

export type OpenStudioIntegratedV3LiveLaneCommandV1 = Readonly<{
  laneKind: typeof INTEGRATED_V3_LANE_KIND_V1;
  sessionId: string;
  branches: readonly Readonly<{
    scenarioId: string;
  }>[];
}>;

export type OpenStudioLiveLaneCommandV1 =
  | OpenStudioNonCoronaryLiveLaneCommandV1
  | OpenStudioIntegratedV3LiveLaneCommandV1;

export type StudioNonCoronaryLiveLaneOpenedV1 = Readonly<{
  laneKind: typeof STUDIO_NONCORONARY_LANE_KIND_V1;
  laneDescriptor: StudioLaneDescriptorV1;
  executionIdentity: RuntimeExecutionIdentityV1;
  session: RuntimeSessionOpenedV1;
}>;

export type StudioIntegratedV3PresentationSampleV1 = Readonly<{
  coverage: typeof STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1;
  presentationOrdinal: number;
  presentationTimeSec: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  acceptedRevisionSpanFromPrevious: number;
  internalAcceptedSubstepCount: number;
  boundaryClippedSubstepCount: number;
  observableFrame: MainWireIntegratedLaneObservableFrameV1;
}>;

export type StudioIntegratedV3InitialPresentationV1 = Readonly<{
  sample: StudioIntegratedV3PresentationSampleV1;
  livePacing: RuntimeLivePacingStateV1;
  metricState: null;
}>;

export type StudioIntegratedV3ScenarioBranchOpenedV1 = Readonly<{
  scenarioId: string;
  liveBranchId: string;
  presentationSignalChannelRef: RuntimePresentationSignalChannelRefV1;
  streamEpoch: 0;
  execution: RuntimeExecutionIdentityV1;
  initialPresentation: StudioIntegratedV3InitialPresentationV1;
}>;

export type StudioIntegratedV3LiveLaneOpenedV1 = Readonly<{
  laneKind: typeof INTEGRATED_V3_LANE_KIND_V1;
  laneDescriptor: StudioLaneDescriptorV1;
  executionIdentity: RuntimeExecutionIdentityV1;
  sessionId: string;
  branches: readonly StudioIntegratedV3ScenarioBranchOpenedV1[];
}>;

export type StudioLiveLaneOpenedV1 =
  | StudioNonCoronaryLiveLaneOpenedV1
  | StudioIntegratedV3LiveLaneOpenedV1;

/**
 * The integrated lane deliberately retains the existing stream envelope:
 * channel/session/branch correlation, sample batches, live pacing, and a
 * failure event. Only the lane-specific presentation sample and unavailable
 * metric state differ.
 */
export type StudioIntegratedV3PresentationSampleBatchV1 = Readonly<{
  kind: "samples";
  channelId: string;
  sessionId: string;
  scenarioId: string;
  liveBranchId: string;
  targetGeneration: 0;
  presentationRevision: 0;
  streamEpoch: 0;
  samples: readonly StudioIntegratedV3PresentationSampleV1[];
  metricState: null;
  livePacing: RuntimeLivePacingStateV1;
}>;

export type StudioIntegratedV3PresentationSignalEventV1 =
  | StudioIntegratedV3PresentationSampleBatchV1
  | RuntimePresentationSignalFailureV1;

export type StudioLiveLanePresentationSignalEventV1 =
  | RuntimePresentationSignalEventV1
  | StudioIntegratedV3PresentationSignalEventV1;

/**
 * The honest adapter seam is stream-shaped. Advancing, observation and
 * operational checkpoint rotation remain private to each concrete driver.
 */
export interface StudioLiveLaneStreamDriverV1<
  TKind extends StudioLiveLaneKindV1 = StudioLiveLaneKindV1,
  TEvent extends StudioLiveLanePresentationSignalEventV1 =
    StudioLiveLanePresentationSignalEventV1,
> {
  readonly laneKind: TKind;
  readonly laneDescriptor: StudioLaneDescriptorV1;
  readonly executionIdentity: RuntimeExecutionIdentityV1;

  openSession(
    command: Extract<OpenStudioLiveLaneCommandV1, { laneKind: TKind }>,
  ): Promise<Extract<StudioLiveLaneOpenedV1, { laneKind: TKind }>>;

  subscribePresentationSignalChannel(
    channel: RuntimePresentationSignalChannelRefV1,
    observer: (event: TEvent) => void,
  ): RuntimePresentationSignalSubscriptionV1;

  closeSession(sessionId: string): Promise<void>;
}

export interface StudioLiveLanePresentationSchedulingV1 {
  suspendPresentationSignalChannel(
    channel: RuntimePresentationSignalChannelRefV1,
  ): Promise<void>;
  resumePresentationSignalChannel(
    channel: RuntimePresentationSignalChannelRefV1,
    expectedStreamEpoch: number,
  ): Promise<void>;
}

export interface StudioLiveLaneResearchTransitionsV1 {
  startTargetIntent(
    command: RuntimeTargetIntentCommandV1,
  ): RuntimeTargetIntentExecutionV1;
  promoteSteadyCandidate(
    command: PromoteSteadyCandidateCommandV1,
  ): Promise<RuntimeCandidatePromotedV1>;
}

export interface StudioNonCoronaryLiveLaneDriverV1
extends StudioLiveLaneStreamDriverV1<
  typeof STUDIO_NONCORONARY_LANE_KIND_V1,
  RuntimePresentationSignalEventV1
> {
  readonly presentationScheduling: StudioLiveLanePresentationSchedulingV1;
  readonly researchTransitions: StudioLiveLaneResearchTransitionsV1;
  readonly runtimePort: SimulationRuntimePortV1;
}

export interface StudioIntegratedV3LiveLaneDriverV1
extends StudioLiveLaneStreamDriverV1<
  typeof INTEGRATED_V3_LANE_KIND_V1,
  StudioIntegratedV3PresentationSignalEventV1
> {}

export type StudioLiveLaneDriverV1 =
  | StudioNonCoronaryLiveLaneDriverV1
  | StudioIntegratedV3LiveLaneDriverV1;

function availableV1(): StudioLaneCapabilityV1 {
  return Object.freeze({ available: true as const });
}

function unavailableV1(
  reason: Extract<
    StudioLaneCapabilityV1,
    { available: false }
  >["reason"],
  explanation: string,
): StudioLaneCapabilityV1 {
  return Object.freeze({
    available: false as const,
    reason,
    explanation,
  });
}
