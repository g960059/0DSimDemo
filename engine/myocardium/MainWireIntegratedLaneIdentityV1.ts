import type {
  SimulationReleaseEvidenceStatusV1,
  SimulationReleaseLifecycleStatusV1,
  SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import type {
  ModelSurfaceManifestRefV1,
} from "@/engine/modelSurface/v1/ModelSurfaceManifestV1";

export const INTEGRATED_V3_LANE_KIND_V1 =
  "integrated-v3-experimental" as const;
export const INTEGRATED_V3_LANE_ID_V1 =
  "integrated-coronary-sinus-hmii-9000-experimental-v1" as const;
export const INTEGRATED_V3_LANE_DISPLAY_NAME_V1 =
  "Experimental — coronary + sinus + HMII 9000" as const;
export const INTEGRATED_V3_LANE_BADGE_V1 =
  "Experimental · development · unverified" as const;
export const INTEGRATED_V3_LANE_PRESENTATION_OBSERVATION_STRIDE_V1 =
  4 as const;

export const INTEGRATED_V3_LANE_LIMITATIONS_V1 = Object.freeze([
  "Experimental lane. Development lifecycle, unverified evidence. This is not a release.",
  "Fixed input. Regular sinus at a 1.000 s cycle, normal-adult coronary priors, and a HeartMate II LVAD at 9,000 rpm. Nothing on this lane can be adjusted.",
  "Regular sinus only. Atrial fibrillation, other non-sinus rhythms, and IABP are not available on this lane.",
  "The LVAD circuit inertance profile is production-owned and explicitly not release-approved.",
  "Not clinically validated, not patient-specific, and not fitted to any patient or waveform.",
  "Cold, transient exploration. Periodic steady state is not established, and long-term physiological behaviour is not established.",
  "This lane reports the rate it actually achieves, measured rather than declared. That rate depends on the machine and on how many lanes are open, and running slower than realtime is expected here rather than a fault.",
  "Live view only. There is no exact 0.002 s export, no saved snapshot, and no steady-state candidate on this lane.",
] as const);

export type StudioLaneCapabilityUnavailableReasonV1 =
  | "not-implemented-for-this-lane"
  | "no-owner-preserving-transition-protocol"
  | "no-periodic-tracker-for-this-lane"
  | "no-versioned-persisted-artifact-for-this-lane"
  | "accepted-revision-is-not-a-presentation-sample-index"
  | "protocol-bound-to-noncoronary-accepted-state"
  | "no-canonical-beat-boundary-for-this-lane"
  | "blocked-by-open-release-blocker"
  | "out-of-scope-for-this-increment";

export type StudioLaneCapabilityV1 =
  | Readonly<{ available: true }>
  | Readonly<{
      available: false;
      reason: StudioLaneCapabilityUnavailableReasonV1;
      explanation: string;
    }>;

export type StudioLaneDecimatedPresentationCapabilityV1 =
  Readonly<{
    available: true;
    observationStride: number;
  }>;

export type StudioLaneCapabilitiesV1 = Readonly<{
  liveWorkerExecution: StudioLaneCapabilityV1;
  decimatedLivePresentation:
    StudioLaneDecimatedPresentationCapabilityV1;
  livePacingReporting: StudioLaneCapabilityV1;
  suspendResumePresentation: StudioLaneCapabilityV1;
  operationalWorkerRotationCheckpoint: StudioLaneCapabilityV1;
  interactiveResearchControls: StudioLaneCapabilityV1;
  strictPeriodicSettlement: StudioLaneCapabilityV1;
  steadyCandidatePromotion: StudioLaneCapabilityV1;
  candidatePinning: StudioLaneCapabilityV1;
  persistedWarmSnapshot: StudioLaneCapabilityV1;
  exactSignalExport: StudioLaneCapabilityV1;
  presentationBeatEstimates: StudioLaneCapabilityV1;
  hemodynamicSideAnalysis: StudioLaneCapabilityV1;
  pvRelationsSideAnalysis: StudioLaneCapabilityV1;
  tbvContinuationSeedPrediction: StudioLaneCapabilityV1;
  externalAfRhythm: StudioLaneCapabilityV1;
  iabpSupport: StudioLaneCapabilityV1;
  releaseOrCandidateIdentity: StudioLaneCapabilityV1;
}>;

export const INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1 = Object.freeze([
  "liveWorkerExecution",
  "decimatedLivePresentation",
  "livePacingReporting",
  "suspendResumePresentation",
  "operationalWorkerRotationCheckpoint",
  "interactiveResearchControls",
  "strictPeriodicSettlement",
  "steadyCandidatePromotion",
  "candidatePinning",
  "persistedWarmSnapshot",
  "exactSignalExport",
  "presentationBeatEstimates",
  "hemodynamicSideAnalysis",
  "pvRelationsSideAnalysis",
  "tbvContinuationSeedPrediction",
  "externalAfRhythm",
  "iabpSupport",
  "releaseOrCandidateIdentity",
] as const satisfies readonly (keyof StudioLaneCapabilitiesV1)[]);

const NONCORONARY_SIDE_ANALYSIS_EXPLANATION =
  "This analysis runs on the non-coronary model and cannot read this lane's state.";

export const INTEGRATED_V3_LANE_CAPABILITIES_V1 = Object.freeze({
  liveWorkerExecution: available(),
  decimatedLivePresentation: Object.freeze({
    available: true as const,
    observationStride:
      INTEGRATED_V3_LANE_PRESENTATION_OBSERVATION_STRIDE_V1,
  }),
  livePacingReporting: available(),
  suspendResumePresentation: unavailable(
    "out-of-scope-for-this-increment",
    "Suspend and resume presentation are out of scope for this increment.",
  ),
  operationalWorkerRotationCheckpoint: available(),
  interactiveResearchControls: unavailable(
    "no-owner-preserving-transition-protocol",
    "This experimental lane runs one fixed input. Controls need a transition protocol that preserves the coronary, rhythm and device state, which this lane does not have yet.",
  ),
  strictPeriodicSettlement: unavailable(
    "no-periodic-tracker-for-this-lane",
    "Periodic settlement needs a periodicity tracker for the integrated model. This lane has none.",
  ),
  steadyCandidatePromotion: unavailable(
    "no-periodic-tracker-for-this-lane",
    "There is no settled candidate to promote on this lane.",
  ),
  candidatePinning: unavailable(
    "no-versioned-persisted-artifact-for-this-lane",
    "Pinning writes a run artifact that asserts a converged, warm-restartable state. This lane has neither.",
  ),
  persistedWarmSnapshot: unavailable(
    "no-versioned-persisted-artifact-for-this-lane",
    "This lane's checkpoint is internal only. It is not a portable or restorable saved state.",
  ),
  exactSignalExport: unavailable(
    "accepted-revision-is-not-a-presentation-sample-index",
    "Exact 0.002 s export is not available for this experimental lane.",
  ),
  presentationBeatEstimates: unavailable(
    "no-canonical-beat-boundary-for-this-lane",
    "Per-beat metrics need a canonical beat boundary, which this lane does not define.",
  ),
  hemodynamicSideAnalysis: unavailable(
    "protocol-bound-to-noncoronary-accepted-state",
    NONCORONARY_SIDE_ANALYSIS_EXPLANATION,
  ),
  pvRelationsSideAnalysis: unavailable(
    "protocol-bound-to-noncoronary-accepted-state",
    NONCORONARY_SIDE_ANALYSIS_EXPLANATION,
  ),
  tbvContinuationSeedPrediction: unavailable(
    "protocol-bound-to-noncoronary-accepted-state",
    NONCORONARY_SIDE_ANALYSIS_EXPLANATION,
  ),
  externalAfRhythm: unavailable(
    "out-of-scope-for-this-increment",
    "This lane is regular sinus only.",
  ),
  iabpSupport: unavailable(
    "blocked-by-open-release-blocker",
    "IABP needs an accepted ventricular event-triggered owner, which is not integrated yet.",
  ),
  releaseOrCandidateIdentity: unavailable(
    "out-of-scope-for-this-increment",
    "This lane has a development, unverified identity. It is not a release or a release candidate.",
  ),
} satisfies StudioLaneCapabilitiesV1);

export type StudioLaneDescriptorV1 = Readonly<{
  laneKind: typeof INTEGRATED_V3_LANE_KIND_V1 | "noncoronary-v1";
  laneId: string;
  displayName: string;
  badge: string;
  releaseRef: SimulationReleaseRef;
  lifecycleStatus: SimulationReleaseLifecycleStatusV1;
  evidenceStatus: SimulationReleaseEvidenceStatusV1;
  observableCatalogId: string;
  observableCatalogSha256: string;
  limitations: readonly string[];
  capabilities: StudioLaneCapabilitiesV1;
}>;

export type StudioModelSurfaceLaneDescriptorV1 =
  StudioLaneDescriptorV1 & Readonly<{
    modelSurfaceManifestRef: ModelSurfaceManifestRefV1;
  }>;

export function createIntegratedV3LaneDescriptorV1(
  releaseRef: SimulationReleaseRef,
  observableCatalogSha256: string,
): StudioLaneDescriptorV1 {
  if (!/^[0-9a-f]{64}$/.test(observableCatalogSha256)) {
    throw new Error("integrated lane observable catalog SHA-256 is invalid");
  }
  return Object.freeze({
    laneKind: INTEGRATED_V3_LANE_KIND_V1,
    laneId: INTEGRATED_V3_LANE_ID_V1,
    displayName: INTEGRATED_V3_LANE_DISPLAY_NAME_V1,
    badge: INTEGRATED_V3_LANE_BADGE_V1,
    releaseRef: Object.freeze({ ...releaseRef }),
    lifecycleStatus: "development" as const,
    evidenceStatus: "unverified" as const,
    observableCatalogId:
      MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID,
    observableCatalogSha256,
    limitations: INTEGRATED_V3_LANE_LIMITATIONS_V1,
    capabilities: INTEGRATED_V3_LANE_CAPABILITIES_V1,
  });
}

/**
 * Adds model-surface discovery after the Worker boundary. The V1 Worker
 * descriptor and response payload remain byte-for-byte schema-compatible.
 */
export function attachModelSurfaceManifestRefV1(
  descriptor: StudioLaneDescriptorV1,
  manifestRef: ModelSurfaceManifestRefV1,
): StudioModelSurfaceLaneDescriptorV1 {
  if (
    manifestRef.schemaVersion !== 1
    || manifestRef.manifestId.trim() === ""
    || !/^[0-9a-f]{64}$/.test(manifestRef.contentSha256)
  ) {
    throw new Error("lane model surface manifest ref is invalid");
  }
  return Object.freeze({
    ...descriptor,
    modelSurfaceManifestRef: Object.freeze({ ...manifestRef }),
  });
}

function available(): StudioLaneCapabilityV1 {
  return Object.freeze({ available: true as const });
}

function unavailable(
  reason: StudioLaneCapabilityUnavailableReasonV1,
  explanation: string,
): StudioLaneCapabilityV1 {
  if (explanation.trim() === "") {
    throw new Error("unavailable lane capability explanation is empty");
  }
  return Object.freeze({
    available: false as const,
    reason,
    explanation,
  });
}
