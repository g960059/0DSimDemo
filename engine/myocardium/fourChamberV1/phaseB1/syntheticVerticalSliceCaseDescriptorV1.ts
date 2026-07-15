import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  fourChamberNewtonScaleRegistryHashPayloadV1,
  type FourChamberNewtonScaleRegistryHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import type {
  PhaseB1EventFreeClosedLoopParametersV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
  type PhaseB1EventFreeMonolithicNumericalPolicyV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicNumericalPolicyV1";
import {
  PHASE_B1_ENDPOINT_STATE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1StateNewtonTopologyV1,
  encodePhaseB1StoredDifferentialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  PHASE_B1_SYNTHETIC_EVENT_FREE_MONOLITHIC_CASE_V1_ID,
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
  type PhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  PHASE_B1_SYNTHETIC_GEOMETRY_WARM_START_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticGeometryWarmStartV1";
import type {
  PhaseB1TriSegCoordinatesV1,
  PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";

export const PHASE_B1_SYNTHETIC_VERTICAL_SLICE_CASE_DESCRIPTOR_V1_ID =
  "four-chamber-phase-b1-synthetic-vertical-slice-case-descriptor-v1" as const;

const PHASE_B1_SYNTHETIC_VERTICAL_SLICE_CASE_DESCRIPTORS_V1 =
  new WeakSet<object>();

type WarmStartPayloadV1 = Readonly<{
  initializationId: typeof PHASE_B1_SYNTHETIC_GEOMETRY_WARM_START_V1_ID;
  endpointStateId: typeof PHASE_B1_ENDPOINT_STATE_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  timeSec: number;
  storedDifferentialStateVector: readonly number[];
  triSegCoordinates: PhaseB1TriSegCoordinatesV1;
  algorithm: Readonly<{
    activeStressStateSource:
      "analytic-isometric-steady-source-state-at-candidate-geometry-transformed-to-rate-free-v1";
    sourceSteadyInitializer: "initializeLand2017IsometricSteadyStateV1";
    geometryConsistentIsometricSteadyStateByWall: true;
    landStatesStrictlyInsidePopulationSimplex: true;
    fullColdInitializationComplete: false;
    acceptedMaterialHomotopyBranchEstablished: false;
  }>;
  provenance: PhaseB1SyntheticEventFreeMonolithicCaseV1["warmStart"]["provenance"];
}>;

export type PhaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1 =
  Readonly<{
    descriptorId:
      typeof PHASE_B1_SYNTHETIC_VERTICAL_SLICE_CASE_DESCRIPTOR_V1_ID;
    status: "project-synthetic-case-not-supported-envelope-or-physiology";
    caseBuilderId:
      typeof PHASE_B1_SYNTHETIC_EVENT_FREE_MONOLITHIC_CASE_V1_ID;
    slsModes: readonly ["on", "off"];
    oneStepDtSec: 0.00025;
    model: Readonly<{
      modelId: "four-chamber-phase-b1-candidate-prior-test-reference-v1";
      closedLoopParameters: PhaseB1EventFreeClosedLoopParametersV1;
      closedLoopParametersSha256: string;
      newtonScaleRegistryHashPayload:
        FourChamberNewtonScaleRegistryHashPayloadV1;
      newtonScaleRegistryContentSha256: string;
      eventFreeNumericalPolicy:
        PhaseB1EventFreeMonolithicNumericalPolicyV1;
      eventFreeNumericalPolicySha256: string;
      candidatePriorOnly: true;
    }>;
    bindings: Readonly<{
      phaseA1TissueManifestBundleSha256: string;
      stateNewtonTopologySha256: string;
      wallMaterialBindingDescriptorSha256: string;
      scaffoldConfigurationSha256: string;
    }>;
    warmStartByMode: Readonly<{
      on: WarmStartPayloadV1;
      off: WarmStartPayloadV1;
    }>;
    negativeClaims: Readonly<{
      acceptedColdInitialization: false;
      acceptedMaterialHomotopyBranch: false;
      supportedEnvelope: false;
      physiologicalValidation: false;
      phaseB1Acceptance: false;
      releaseRuntimeReachable: false;
    }>;
  }>;

export type PhaseB1SyntheticVerticalSliceCaseDescriptorV1 =
  PhaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1SyntheticVerticalSliceCaseDescriptorV1 {
  const on = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("on", sha256Hex);
  const off = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("off", sha256Hex);
  assertSharedCaseBindings(on, off);
  const topology = buildPhaseB1StateNewtonTopologyV1(sha256Hex);
  const registryPayload = fourChamberNewtonScaleRegistryHashPayloadV1(
    on.model.newtonScaleRegistry,
  );
  const closedLoopParametersSha256 = computeCanonicalSha256(
    on.model.closedLoopParameters,
    sha256Hex,
  );
  const eventFreeNumericalPolicySha256 = computeCanonicalSha256(
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
    sha256Hex,
  );
  const payload: PhaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1 =
    Object.freeze({
      descriptorId:
        PHASE_B1_SYNTHETIC_VERTICAL_SLICE_CASE_DESCRIPTOR_V1_ID,
      status: "project-synthetic-case-not-supported-envelope-or-physiology",
      caseBuilderId: PHASE_B1_SYNTHETIC_EVENT_FREE_MONOLITHIC_CASE_V1_ID,
      slsModes: Object.freeze(["on", "off"] as const),
      oneStepDtSec: 0.00025,
      model: Object.freeze({
        modelId: on.model.modelId,
        closedLoopParameters: on.model.closedLoopParameters,
        closedLoopParametersSha256,
        newtonScaleRegistryHashPayload: registryPayload,
        newtonScaleRegistryContentSha256:
          on.model.newtonScaleRegistry.registryContentSha256,
        eventFreeNumericalPolicy:
          PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
        eventFreeNumericalPolicySha256,
        candidatePriorOnly: true,
      }),
      bindings: Object.freeze({
        phaseA1TissueManifestBundleSha256:
          on.scaffold.phaseA1TissueManifestBundle.contentSha256,
        stateNewtonTopologySha256: topology.contentSha256,
        wallMaterialBindingDescriptorSha256:
          on.wallMaterialBinding.contentSha256,
        scaffoldConfigurationSha256: on.scaffoldConfigurationSha256,
      }),
      warmStartByMode: Object.freeze({
        on: buildWarmStartPayload(on),
        off: buildWarmStartPayload(off),
      }),
      negativeClaims: Object.freeze({
        acceptedColdInitialization: false,
        acceptedMaterialHomotopyBranch: false,
        supportedEnvelope: false,
        physiologicalValidation: false,
        phaseB1Acceptance: false,
        releaseRuntimeReachable: false,
      }),
    });
  const descriptor = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  PHASE_B1_SYNTHETIC_VERTICAL_SLICE_CASE_DESCRIPTORS_V1.add(descriptor);
  return validatePhaseB1SyntheticVerticalSliceCaseDescriptorV1(
    descriptor,
    sha256Hex,
  );
}

export function validatePhaseB1SyntheticVerticalSliceCaseDescriptorV1(
  descriptor: PhaseB1SyntheticVerticalSliceCaseDescriptorV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1SyntheticVerticalSliceCaseDescriptorV1 {
  if (
    descriptor === null
    || typeof descriptor !== "object"
    || !PHASE_B1_SYNTHETIC_VERTICAL_SLICE_CASE_DESCRIPTORS_V1.has(descriptor)
  ) {
    throw new Error(
      "Phase B1 synthetic vertical-slice descriptor must be canonically built in this process",
    );
  }
  if (
    descriptor.descriptorId
      !== PHASE_B1_SYNTHETIC_VERTICAL_SLICE_CASE_DESCRIPTOR_V1_ID
    || descriptor.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("Phase B1 synthetic vertical-slice descriptor identity drifted");
  assertCanonicalSha256(
    phaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1(descriptor),
    descriptor.contentSha256,
    sha256Hex,
  );
  if (
    computeCanonicalSha256(descriptor.model.closedLoopParameters, sha256Hex)
      !== descriptor.model.closedLoopParametersSha256
    || computeCanonicalSha256(
      descriptor.model.newtonScaleRegistryHashPayload,
      sha256Hex,
    ) !== descriptor.model.newtonScaleRegistryContentSha256
    || computeCanonicalSha256(
      descriptor.model.eventFreeNumericalPolicy,
      sha256Hex,
    ) !== descriptor.model.eventFreeNumericalPolicySha256
  ) throw new Error("Phase B1 synthetic vertical-slice inner hash drifted");
  if (
    descriptor.warmStartByMode.on.slsMode !== "on"
    || descriptor.warmStartByMode.off.slsMode !== "off"
    || descriptor.warmStartByMode.on.storedDifferentialStateVector.length !== 59
    || descriptor.warmStartByMode.off.storedDifferentialStateVector.length !== 54
  ) throw new Error("Phase B1 synthetic vertical-slice warm topology drifted");
  for (const mode of descriptor.slsModes) {
    const warm = descriptor.warmStartByMode[mode];
    if (
      warm.endpointStateId !== PHASE_B1_ENDPOINT_STATE_V1_ID
      || warm.provenance.symmetricClosedLoopScaffoldConfigurationSha256
        !== descriptor.bindings.scaffoldConfigurationSha256
      || warm.provenance.phaseA1TissueManifestBundleSha256
        !== descriptor.bindings.phaseA1TissueManifestBundleSha256
      || warm.provenance.phaseB1WallMaterialBindingSha256
        !== descriptor.bindings.wallMaterialBindingDescriptorSha256
    ) throw new Error(`Phase B1 ${mode} warm-start provenance drifted`);
  }
  if (Object.values(descriptor.negativeClaims).some(Boolean)) {
    throw new Error("Phase B1 synthetic descriptor overclaims acceptance");
  }
  return descriptor;
}

export function phaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1(
  descriptor: PhaseB1SyntheticVerticalSliceCaseDescriptorV1,
): PhaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = descriptor;
  return Object.freeze(payload);
}

function buildWarmStartPayload(
  candidate: PhaseB1SyntheticEventFreeMonolithicCaseV1,
): WarmStartPayloadV1 {
  const warmStart = candidate.warmStart;
  return Object.freeze({
    initializationId: warmStart.initializationId,
    endpointStateId: warmStart.endpoint.stateId,
    slsMode: warmStart.slsMode,
    timeSec: warmStart.endpoint.timeSec,
    storedDifferentialStateVector: encodePhaseB1StoredDifferentialStateV1(
      warmStart.endpoint.differentialState,
    ),
    triSegCoordinates: warmStart.endpoint.triSegCoordinates,
    algorithm: Object.freeze({
      activeStressStateSource: warmStart.audit.activeStressStateSource,
      sourceSteadyInitializer: warmStart.audit.sourceSteadyInitializer,
      geometryConsistentIsometricSteadyStateByWall: true,
      landStatesStrictlyInsidePopulationSimplex: true,
      fullColdInitializationComplete: false,
      acceptedMaterialHomotopyBranchEstablished: false,
    }),
    provenance: warmStart.provenance,
  });
}

function assertSharedCaseBindings(
  on: PhaseB1SyntheticEventFreeMonolithicCaseV1,
  off: PhaseB1SyntheticEventFreeMonolithicCaseV1,
): void {
  const shared = [
    [on.scaffoldConfigurationSha256, off.scaffoldConfigurationSha256],
    [on.wallMaterialBinding.contentSha256, off.wallMaterialBinding.contentSha256],
    [
      on.model.newtonScaleRegistry.registryContentSha256,
      off.model.newtonScaleRegistry.registryContentSha256,
    ],
    [
      on.scaffold.phaseA1TissueManifestBundle.contentSha256,
      off.scaffold.phaseA1TissueManifestBundle.contentSha256,
    ],
    [
      canonicalizeJson(on.model.closedLoopParameters),
      canonicalizeJson(off.model.closedLoopParameters),
    ],
  ] as const;
  if (shared.some(([left, right]) => left !== right)) {
    throw new Error("SLS-on/off synthetic cases must share canonical bindings");
  }
}
