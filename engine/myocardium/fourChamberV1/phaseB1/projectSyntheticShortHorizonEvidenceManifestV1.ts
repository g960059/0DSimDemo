import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import {
  buildPhaseB1MonolithicVerticalSliceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/monolithicVerticalSliceManifestV1";
import {
  PHASE_B1_ENDPOINT_STATE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import type {
  FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MonolithicVerticalSliceReadinessV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1,
  PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID,
  buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1,
  type PhaseB1ProjectSyntheticEndpointScaleDescriptorV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticShortHorizonProtocolV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticVerticalSliceCaseDescriptorV1";
import {
  buildPhaseB1StoredDifferentialLabelsV1,
  type PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditPolicyV1";
import {
  PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID,
  PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_EVIDENCE_MANIFEST_V1_ID =
  "phase-b1-project-synthetic-short-horizon-evidence-manifest-v1" as const;

export const PHASE_B1_VERTICAL_SLICE_DESCRIPTOR_SHA256_V1 =
  "d2fd8e854e6c520d1ea73be0b3f32005e50e2be282fee94484d2ce6e91ab1d99" as const;
export const PHASE_B1_VERTICAL_SLICE_MANIFEST_SHA256_V1 =
  "973351efd96000e1a69041eb44b41db44d2e4ecc3556005763f3d1ce672e9d69" as const;
export const PHASE_B1_VERTICAL_SLICE_READINESS_SHA256_V1 =
  "379fb468c1feba725db39465ea7c7bee24476e60e36265a6dce77bc673a82324" as const;

const SHORT_HORIZON_MANIFESTS_V1 = new WeakSet<object>();

export type PhaseB1ProjectSyntheticShortHorizonScheduleV1 = Readonly<{
  slsModes: readonly ["on", "off"];
  durationSec: 0.001;
  mainDtSec: 0.00025;
  grids: readonly Readonly<{
    dtSec: number;
    requestedStepCount: number;
    endpointEventStepOneBased: number;
  }>[];
  endpointEventTimeSec: 0.0005;
  uniformFixedGrid: true;
  hiddenSubdivisionAllowed: false;
}>;

export type PhaseB1ProjectSyntheticShortHorizonEventsV1 = Readonly<{
  events: readonly [
    typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.endpointEvent,
  ];
  forcingSide: "pre-jump-left-limit";
  eventCountPerRun: 1;
  eventMustAlignWithEveryGrid: true;
  followingIntervalsStartFromPostJumpEndpoint: true;
}>;

export type PhaseB1ProjectSyntheticShortHorizonStateScalesV1 = Readonly<{
  on: PhaseB1ProjectSyntheticEndpointScaleDescriptorV1;
  off: PhaseB1ProjectSyntheticEndpointScaleDescriptorV1;
}>;

export type PhaseB1ProjectSyntheticShortHorizonProtocolDefinitionV1 =
  Readonly<{
    protocolId:
      typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID;
    schedule: PhaseB1ProjectSyntheticShortHorizonScheduleV1;
    policy: typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1;
    events: PhaseB1ProjectSyntheticShortHorizonEventsV1;
    stateScales: PhaseB1ProjectSyntheticShortHorizonStateScalesV1;
  }>;

export type PhaseB1ProjectSyntheticShortHorizonEvidenceManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_EVIDENCE_MANIFEST_V1_ID;
    status:
      "project-synthetic-one-millisecond-three-grid-evidence-not-phase-b1-acceptance";
    evidenceClass:
      "project-synthetic-short-horizon-and-state-order-regression";
    lineage: Readonly<{
      verticalSliceDescriptorSha256:
        typeof PHASE_B1_VERTICAL_SLICE_DESCRIPTOR_SHA256_V1;
      verticalSliceManifestSha256:
        typeof PHASE_B1_VERTICAL_SLICE_MANIFEST_SHA256_V1;
      verticalSliceReadinessSha256:
        typeof PHASE_B1_VERTICAL_SLICE_READINESS_SHA256_V1;
      canonicalUpstreamArtifactsVerified: true;
    }>;
    bindings: Readonly<{
      protocolDefinitionSha256: string;
      scheduleSha256: string;
      policySha256: string;
      eventsSha256: string;
      stateScalesSha256: string;
      componentIds: Readonly<{
        runner:
          typeof PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID;
        eventIntegratedTransaction:
          typeof PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID;
        endpointState: typeof PHASE_B1_ENDPOINT_STATE_V1_ID;
        wholeHeartSlsAudit:
          typeof PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID;
        wholeHeartMechanicalEnergyAudit:
          typeof PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID;
      }>;
    }>;
    protocolDefinition:
      PhaseB1ProjectSyntheticShortHorizonProtocolDefinitionV1;
    implementationClaims: Readonly<{
      oneMillisecondProjectSyntheticHorizonInBothSlsTopologies: true;
      threeExactlyAlignedUniformTimeStepGrids: true;
      oneExactEndpointEventPerRun: true;
      followingIntervalsUsePostJumpEndpoint: true;
      allStoredAndTriSegEndpointCoordinatesInScaledStateNorm: true;
      everyStepGlobalSemismoothJacobianAudit: true;
      everyStepDifferentiatedKinematicsAudit: true;
      everyStepSlsBackwardEulerIdentityAudit: true;
      everyStepCorrectedMechanicalStageLedgerAudit: true;
      everyStepTotalBloodVolumeConservationAudit: true;
      projectSyntheticBackwardEulerStateOrderAtLeast0p8Regression: true;
    }>;
    deferred: Readonly<{
      acceptedColdInitialization: true;
      acceptedMaterialHomotopyAndBranchProvenance: true;
      phaseB0SupportedEnvelopeClosure: true;
      acceptedReferenceShortHorizon: true;
      generalTimestepConvergence: true;
      wholeHeartBackwardEulerEnergyAcceptance: true;
      fullBeatPeriodicAttractor: true;
      fullBeatConservationAndEnergy: true;
      multistartAndPerturbationAcceptance: true;
      pathologicalSupportedEnvelope: true;
      physiologicalValidation: true;
      releaseRuntimeIntegration: true;
    }>;
    negativeClaims: Readonly<{
      constitutivePartialsIndependentlyValidated: false;
      triSegWorkConjugacyAccepted: false;
      wholeHeartBackwardEulerEnergyAccepted: false;
      phaseB1ShortHorizonAccepted: false;
      generalTimestepConvergenceEstablished: false;
      phaseB1Acceptance: false;
      supportedEnvelope: false;
      physiologicalValidation: false;
      modelCoreIntegration: false;
      browserRuntimeAdopted: false;
      releaseRuntimeReachable: false;
    }>;
  }>;

export type PhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1 =
  PhaseB1ProjectSyntheticShortHorizonEvidenceManifestPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1 {
  const descriptor = buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1(
    sha256Hex,
  );
  const verticalManifest = buildPhaseB1MonolithicVerticalSliceManifestV1(
    descriptor,
    sha256Hex,
  );
  const verticalReadiness =
    buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1(verticalManifest);
  if (
    descriptor.contentSha256 !== PHASE_B1_VERTICAL_SLICE_DESCRIPTOR_SHA256_V1
    || verticalManifest.contentSha256
      !== PHASE_B1_VERTICAL_SLICE_MANIFEST_SHA256_V1
    || computeCanonicalSha256(verticalReadiness, sha256Hex)
      !== PHASE_B1_VERTICAL_SLICE_READINESS_SHA256_V1
  ) throw new Error("Phase B1 short-horizon parent evidence drifted");
  const protocolDefinition = buildProtocolDefinition(sha256Hex);
  const payload: PhaseB1ProjectSyntheticShortHorizonEvidenceManifestPayloadV1 =
    Object.freeze({
      manifestId:
        PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_EVIDENCE_MANIFEST_V1_ID,
      status:
        "project-synthetic-one-millisecond-three-grid-evidence-not-phase-b1-acceptance",
      evidenceClass:
        "project-synthetic-short-horizon-and-state-order-regression",
      lineage: Object.freeze({
        verticalSliceDescriptorSha256:
          PHASE_B1_VERTICAL_SLICE_DESCRIPTOR_SHA256_V1,
        verticalSliceManifestSha256:
          PHASE_B1_VERTICAL_SLICE_MANIFEST_SHA256_V1,
        verticalSliceReadinessSha256:
          PHASE_B1_VERTICAL_SLICE_READINESS_SHA256_V1,
        canonicalUpstreamArtifactsVerified: true,
      }),
      bindings: Object.freeze({
        protocolDefinitionSha256: computeCanonicalSha256(
          protocolDefinition,
          sha256Hex,
        ),
        scheduleSha256: computeCanonicalSha256(
          protocolDefinition.schedule,
          sha256Hex,
        ),
        policySha256: computeCanonicalSha256(
          protocolDefinition.policy,
          sha256Hex,
        ),
        eventsSha256: computeCanonicalSha256(
          protocolDefinition.events,
          sha256Hex,
        ),
        stateScalesSha256: computeCanonicalSha256(
          protocolDefinition.stateScales,
          sha256Hex,
        ),
        componentIds: Object.freeze({
          runner: PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID,
          eventIntegratedTransaction:
            PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
          endpointState: PHASE_B1_ENDPOINT_STATE_V1_ID,
          wholeHeartSlsAudit: PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID,
          wholeHeartMechanicalEnergyAudit:
            PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID,
        }),
      }),
      protocolDefinition,
      implementationClaims: Object.freeze({
        oneMillisecondProjectSyntheticHorizonInBothSlsTopologies: true,
        threeExactlyAlignedUniformTimeStepGrids: true,
        oneExactEndpointEventPerRun: true,
        followingIntervalsUsePostJumpEndpoint: true,
        allStoredAndTriSegEndpointCoordinatesInScaledStateNorm: true,
        everyStepGlobalSemismoothJacobianAudit: true,
        everyStepDifferentiatedKinematicsAudit: true,
        everyStepSlsBackwardEulerIdentityAudit: true,
        everyStepCorrectedMechanicalStageLedgerAudit: true,
        everyStepTotalBloodVolumeConservationAudit: true,
        projectSyntheticBackwardEulerStateOrderAtLeast0p8Regression: true,
      }),
      deferred: Object.freeze({
        acceptedColdInitialization: true,
        acceptedMaterialHomotopyAndBranchProvenance: true,
        phaseB0SupportedEnvelopeClosure: true,
        acceptedReferenceShortHorizon: true,
        generalTimestepConvergence: true,
        wholeHeartBackwardEulerEnergyAcceptance: true,
        fullBeatPeriodicAttractor: true,
        fullBeatConservationAndEnergy: true,
        multistartAndPerturbationAcceptance: true,
        pathologicalSupportedEnvelope: true,
        physiologicalValidation: true,
        releaseRuntimeIntegration: true,
      }),
      negativeClaims: Object.freeze({
        constitutivePartialsIndependentlyValidated: false,
        triSegWorkConjugacyAccepted: false,
        wholeHeartBackwardEulerEnergyAccepted: false,
        phaseB1ShortHorizonAccepted: false,
        generalTimestepConvergenceEstablished: false,
        phaseB1Acceptance: false,
        supportedEnvelope: false,
        physiologicalValidation: false,
        modelCoreIntegration: false,
        browserRuntimeAdopted: false,
        releaseRuntimeReachable: false,
      }),
    });
  const manifest = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  SHORT_HORIZON_MANIFESTS_V1.add(manifest);
  return validatePhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1(
    manifest,
    sha256Hex,
  );
}

export function assertCanonicalPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1(
  manifest: PhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1,
): PhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1 {
  if (
    manifest === null
    || typeof manifest !== "object"
    || !SHORT_HORIZON_MANIFESTS_V1.has(manifest)
  ) throw new Error(
    "Phase B1 short-horizon manifest must be canonically built in this process",
  );
  return manifest;
}

export function validatePhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1(
  manifest: PhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1 {
  assertCanonicalPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1(
    manifest,
  );
  if (
    manifest.manifestId
      !== PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_EVIDENCE_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("Phase B1 short-horizon manifest identity drifted");
  assertCanonicalSha256(
    phaseB1ProjectSyntheticShortHorizonEvidenceManifestHashPayloadV1(
      manifest,
    ),
    manifest.contentSha256,
    sha256Hex,
  );
  const protocol = manifest.protocolDefinition;
  const expectedProtocol = buildProtocolDefinition(sha256Hex);
  const descriptor = buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1(
    sha256Hex,
  );
  if (
    manifest.lineage.verticalSliceDescriptorSha256
      !== PHASE_B1_VERTICAL_SLICE_DESCRIPTOR_SHA256_V1
    || manifest.lineage.verticalSliceManifestSha256
      !== PHASE_B1_VERTICAL_SLICE_MANIFEST_SHA256_V1
    || manifest.lineage.verticalSliceReadinessSha256
      !== PHASE_B1_VERTICAL_SLICE_READINESS_SHA256_V1
    || manifest.bindings.protocolDefinitionSha256
      !== computeCanonicalSha256(protocol, sha256Hex)
    || manifest.bindings.scheduleSha256
      !== computeCanonicalSha256(protocol.schedule, sha256Hex)
    || manifest.bindings.policySha256
      !== computeCanonicalSha256(protocol.policy, sha256Hex)
    || manifest.bindings.eventsSha256
      !== computeCanonicalSha256(protocol.events, sha256Hex)
    || manifest.bindings.stateScalesSha256
      !== computeCanonicalSha256(protocol.stateScales, sha256Hex)
    || canonicalizeJson(protocol) !== canonicalizeJson(expectedProtocol)
  ) throw new Error("Phase B1 short-horizon evidence binding drifted");
  const policy = PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1;
  if (
    canonicalizeJson(protocol.policy) !== canonicalizeJson(policy)
    || protocol.schedule.durationSec !== policy.durationSec
    || protocol.schedule.mainDtSec !== policy.mainDtSec
    || protocol.schedule.endpointEventTimeSec
      !== policy.endpointEvent.calciumDriveTimeSec
    || protocol.events.events[0] !== policy.endpointEvent
    || protocol.stateScales.on.storedDifferentialStateCount !== 59
    || protocol.stateScales.on.endpointScales.length !== 61
    || protocol.stateScales.off.storedDifferentialStateCount !== 54
    || protocol.stateScales.off.endpointScales.length !== 56
    || protocol.stateScales.on.sourceNewtonScaleRegistryContentSha256
      !== protocol.stateScales.off.sourceNewtonScaleRegistryContentSha256
    || protocol.stateScales.on.sourceNewtonScaleRegistryContentSha256
      !== descriptor.model.newtonScaleRegistryContentSha256
    || policy.normalizedSlsIdentityTolerance
      !== PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1
    || policy.correctedStageLedgerNormalizedResidualTolerance
      !== PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .correctedStageLedgerNormalizedResidualTolerance
  ) throw new Error("Phase B1 short-horizon protocol values drifted");
  const on = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("on", sha256Hex);
  const off = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("off", sha256Hex);
  if (
    canonicalizeJson(protocol.stateScales.on)
      !== canonicalizeJson(deriveExpectedScaleDescriptor(
        "on",
        on.model.newtonScaleRegistry,
      ))
    || canonicalizeJson(protocol.stateScales.off)
      !== canonicalizeJson(deriveExpectedScaleDescriptor(
        "off",
        off.model.newtonScaleRegistry,
      ))
  ) throw new Error("Phase B1 short-horizon endpoint scale mapping drifted");
  for (const grid of protocol.schedule.grids) {
    if (
      grid.requestedStepCount * grid.dtSec !== protocol.schedule.durationSec
      || grid.endpointEventStepOneBased * grid.dtSec
        !== protocol.schedule.endpointEventTimeSec
    ) throw new Error("Phase B1 short-horizon grid alignment drifted");
  }
  if (
    Object.values(manifest.implementationClaims).some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
  ) throw new Error("Phase B1 short-horizon claim boundary drifted");
  return manifest;
}

export function phaseB1ProjectSyntheticShortHorizonEvidenceManifestHashPayloadV1(
  manifest: PhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1,
): PhaseB1ProjectSyntheticShortHorizonEvidenceManifestPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}

function buildProtocolDefinition(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticShortHorizonProtocolDefinitionV1 {
  const policy = PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1;
  const on = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("on", sha256Hex);
  const off = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("off", sha256Hex);
  const schedule: PhaseB1ProjectSyntheticShortHorizonScheduleV1 =
    Object.freeze({
      slsModes: policy.slsModes,
      durationSec: policy.durationSec,
      mainDtSec: policy.mainDtSec,
      grids: Object.freeze(policy.convergenceTimeStepsSec.map((dtSec) =>
        Object.freeze({
          dtSec,
          requestedStepCount: policy.durationSec / dtSec,
          endpointEventStepOneBased:
            policy.endpointEvent.calciumDriveTimeSec / dtSec,
        }))),
      endpointEventTimeSec: policy.endpointEvent.calciumDriveTimeSec,
      uniformFixedGrid: true,
      hiddenSubdivisionAllowed: false,
    });
  const events: PhaseB1ProjectSyntheticShortHorizonEventsV1 = Object.freeze({
    events: Object.freeze([policy.endpointEvent] as const),
    forcingSide: "pre-jump-left-limit",
    eventCountPerRun: 1,
    eventMustAlignWithEveryGrid: true,
    followingIntervalsStartFromPostJumpEndpoint: true,
  });
  const stateScales = Object.freeze({
    on: buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1(
      "on",
      on.model.newtonScaleRegistry,
    ),
    off: buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1(
      "off",
      off.model.newtonScaleRegistry,
    ),
  });
  return Object.freeze({
    protocolId: PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_PROTOCOL_V1_ID,
    schedule,
    policy,
    events,
    stateScales,
  });
}

function deriveExpectedScaleDescriptor(
  slsMode: PhaseB1SlsModeV1,
  registry: FourChamberNewtonScaleRegistryV1,
): PhaseB1ProjectSyntheticEndpointScaleDescriptorV1 {
  if (!registry.fixedBeforeRun || registry.adaptiveRescaling) {
    throw new Error("short-horizon endpoint scales require a fixed registry");
  }
  const endpointScales: number[] = [
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      registry.unknownScales.bloodVolumeM3[id]),
    ...INERTIAL_FLOW_IDS.map(() =>
      registry.unknownScales.inertialFlowM3PerSec),
  ];
  for (const wallId of WALL_IDS) {
    endpointScales.push(
      ...Array(6).fill(registry.unknownScales.calciumAndPopulation),
      registry.unknownScales.landDistortionByWall[wallId],
      registry.unknownScales.landDistortionByWall[wallId],
    );
    if (slsMode === "on") {
      endpointScales.push(registry.unknownScales.slsViscousStrain);
    }
  }
  endpointScales.push(
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  );
  const endpointLabels = [
    ...buildPhaseB1StoredDifferentialLabelsV1(slsMode),
    "algebraic.triseg.V_m_S",
    "algebraic.triseg.y_m",
  ];
  return Object.freeze({
    schemaId: "phase-b1-project-synthetic-endpoint-scale-descriptor-v1",
    slsMode,
    sourceNewtonScaleRegistryContentSha256:
      registry.registryContentSha256,
    sourceRegistryFixedBeforeRun: true,
    sourceRegistryAdaptiveRescaling: false,
    norm: "scaled-infinity-norm",
    storedDifferentialStateCount: slsMode === "on" ? 59 : 54,
    triSegAlgebraicStateCount: 2,
    endpointLabels: Object.freeze(endpointLabels),
    endpointScales: Object.freeze(endpointScales),
  });
}
