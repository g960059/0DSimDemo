import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1,
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVIDENCE_MANIFEST_V1_ID,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  assertCanonicalPhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1,
  assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1,
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
  phaseB1QuiescentReferenceEvidenceManifestHashPayloadV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1,
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1,
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1,
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeIdentityHoldV1";

const EXPECTED_MANIFEST_SHA256 =
  "218d5abd7b53dd0e4db594bac1ac1848d3ac49acc3efbdd02b843ee27338bf24";

describe("Phase B1 quiescent-reference evidence manifest", () => {
  let first: PhaseB1QuiescentReferenceEvidenceManifestV1;
  let second: PhaseB1QuiescentReferenceEvidenceManifestV1;

  beforeAll(() => {
    first = buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
    second = buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
  });

  it("builds a deterministic canonically branded frozen self-hashed manifest", () => {
    expect(first).not.toBe(second);
    expect(first.protocolDefinition).not.toBe(second.protocolDefinition);
    expect(canonicalizeJson(first)).toBe(canonicalizeJson(second));
    expect(first.contentSha256).toBe(second.contentSha256);
    expect(first.contentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(first.contentSha256).toBe(EXPECTED_MANIFEST_SHA256);
    expect(first.contentSha256).toBe(computeCanonicalSha256(
      phaseB1QuiescentReferenceEvidenceManifestHashPayloadV1(first),
      sha256,
    ));
    expect(first.manifestId)
      .toBe(PHASE_B1_QUIESCENT_REFERENCE_EVIDENCE_MANIFEST_V1_ID);
    expect(first.testOnly).toBe(true);
    expect(assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(first))
      .toBe(first);
    expect(
      assertCanonicalPhaseB1QuiescentReferenceEvidenceProtocolDefinitionV1(
        first.protocolDefinition,
      ),
    ).toBe(first.protocolDefinition);
    expect(() =>
      assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1(
        first,
      )).not.toThrow();
    expectRecursivelyFrozen(first);
  });

  it("pins the graph lineage and the exact inverse, adapter, and hold policies", () => {
    const protocol = first.protocolDefinition;
    expect(first.lineage).toEqual({
      directParentGraphManifestSha256:
        PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
      directParentGraphNumericalEvidenceSha256:
        PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
      directParentGraphReadinessSha256:
        PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
      canonicalDirectParentManifestVerifiedLive: true,
      directParentNumericalAndReadinessRebuiltAndPinnedByNumericalEvidence:
        true,
      evidenceLayerDirectParentLineageAuthentication: true,
      pureCoreParentEvidenceAuthenticationClaimed: false,
    });
    expect(protocol.slsModes).toEqual(["on", "off"]);
    expect(protocol.componentIds).toEqual({
      inverse: PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID,
      eventFreeCase: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
      identityHold:
        PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_V1_ID,
    });

    const inverse = protocol.inverseProtocol;
    expect(inverse.policy)
      .toBe(PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1);
    expect(inverse.referenceCoordinateMap).toMatchObject({
      dimension: 4,
      leftVentricularFreewallLogMap: "ell_LVFW=ell_even+ell_odd",
      rightVentricularFreewallLogMap: "ell_RVFW=ell_even-ell_odd",
      septalReferenceMidwallAreaFixedAnchorExact: true,
    });
    expect(inverse.referenceCoordinateMap.coordinates).toEqual([
      "log_LA_reference_cavity_multiplier",
      "log_RA_reference_cavity_multiplier",
      "log_freewall_even_reference_area_multiplier",
      "log_freewall_odd_reference_area_multiplier",
    ]);
    expect(inverse.positiveGeometricPressureSchedule).toMatchObject({
      kind: "positive-geometric-source-to-common-vascular-pressure",
      formula: "P_i(rho)=P_i(0)^(1-rho)*P_common^rho",
      sourceAndDestinationPressuresRequiredStrictlyPositive: true,
      biologicalPathClaimed: false,
    });
    expect(inverse.refinement).toMatchObject({
      factors: [2, 4, 8],
      selectionRule: "first-hard-pass-with-50pct-guard",
      everyFactorAttemptStartsFromExactCanonicalSourceIndependently: true,
      factorEndpointsSharedAsSeeds: false,
      factorEightReverseRequired: true,
    });
    expect(inverse.augmentedJacobian.primary).toMatchObject({
      construction: "direct-full-augmented-five-point-algorithmic-jacobian",
      scaledStep: 2 ** -19,
      includesEveryColdUnknownAndAllFourLogCoordinates: true,
    });
    expect(inverse.augmentedJacobian.independent).toMatchObject({
      construction:
        "independent-direct-full-augmented-five-point-algorithmic-jacobian",
      scaledStep: 2 ** -17,
      includesEveryColdUnknownAndAllFourLogCoordinates: true,
    });
    expect(inverse.augmentedJacobian.effectiveStepAndStencilGate)
      .toBe(PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .effectiveJacobianStencilGate);
    expect(Object.values(inverse.augmentedJacobian
      .effectiveStepAndStencilGate).every(Boolean)).toBe(true);
    expect(inverse.restoringManifoldCorrector).toMatchObject({
      reducedUnknownDimension: 4,
      nonlinearColdBlockRestoredAtEveryReducedTrial: true,
      directFullAugmentedJacobianSuppliesReducedSchur: true,
      monolithicFullNewtonClaimed: false,
    });
    expect(inverse.hardGates)
      .toBe(PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates);
    expect(inverse.fiftyPercentGuard).toBe(
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1
        .fiftyPercentGuard,
    );
    expect(inverse.failureProbes.injectedAttemptIndices).toEqual([0, 1]);
    expect(inverse.livePassingResultBrand).toEqual({
      weakSetBackedCanonicalAssertionRequired: true,
      onlyPassingResultsBranded: true,
    });

    const eventFreeCase = protocol.eventFreeCaseProtocol;
    expect(eventFreeCase.policy)
      .toBe(PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1);
    expect(eventFreeCase).toMatchObject({
      destinationRegistryStageBoundary:
        "compile-once-after-accepted-inverse-before-any-backward-euler-step",
      destinationRegistryCompiledExactlyOnce: true,
      acceptedInverseDestinationDefinesRegistry: true,
      septalReferenceMidwallAreaFixedAnchorExact: true,
      inverseAnchorRegistryValuesReverseEngineered: false,
      adaptiveRescalingAllowed: false,
      eventSchedulerIntegrated: false,
    });

    const hold = protocol.identityHoldProtocol;
    expect(hold.policy)
      .toBe(PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1);
    expect(hold.dtGridSec)
      .toBe(PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1);
    expect(hold).toMatchObject({
      dtGridSec: [0.125e-3, 0.25e-3, 0.5e-3],
      everyStepStartsFromSameReferenceEndpointIndependently: true,
      nonTimeStateComparison:
        "Object.is-over-complete-newton-topology-and-ten-calcium-scalars",
      expectedStoredScalarCountBySlsMode: { on: 61, off: 56 },
      acceptedNewtonStepCount: 0,
      destinationRegistryObjectReusedAcrossAllSteps: true,
      destinationRegistryRecompiledDuringHold: false,
      eventFree: true,
      eventSchedulerIntegrated: false,
      adaptiveRescalingAllowed: false,
    });

    for (const [binding, value] of Object.entries({
      protocolDefinitionSha256: protocol,
      directParentSha256: protocol.directParent,
      componentIdsSha256: protocol.componentIds,
      inverseProtocolSha256: inverse,
      inversePolicySha256: inverse.policy,
      eventFreeCaseProtocolSha256: eventFreeCase,
      eventFreeCasePolicySha256: eventFreeCase.policy,
      identityHoldProtocolSha256: hold,
      identityHoldPolicySha256: hold.policy,
      identityHoldDtGridSha256: hold.dtGridSec,
      prohibitedOperationsSha256: protocol.prohibitedOperations,
      claimBoundarySha256: protocol.claimBoundary,
    })) {
      expect(first.bindings[binding as keyof typeof first.bindings])
        .toBe(computeCanonicalSha256(value, sha256));
    }
    expect(Object.values(protocol.prohibitedOperations)
      .every((value) => value === false)).toBe(true);
    expect(Object.entries(protocol.claimBoundary)
      .filter(([, value]) => value === true).map(([key]) => key)).toEqual([
      "projectSyntheticQuiescentPressureReferenceInverse",
      "instantaneousHydraulicQuiescence",
      "projectSyntheticQuiescentReferenceEventFreeCase",
      "projectSyntheticToleranceCertifiedIdentityHold",
    ]);
    expect(Object.values(first.implementationClaims).every(Boolean)).toBe(true);
    expect(Object.values(first.deferred).every(Boolean)).toBe(true);
  });

  it("rejects copies, cycles, nested widening, accessors, and symbol properties", () => {
    const plainCopy = deepFreeze(structuredClone(first));
    expect(() =>
      assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
        plainCopy as PhaseB1QuiescentReferenceEvidenceManifestV1,
      )).toThrow(/canonically built/);

    const cyclic = structuredClone(first) as Record<string, any>;
    cyclic.bindings.protocolDefinitionSha256 = cyclic.bindings;
    deepFreeze(cyclic);
    expect(() =>
      assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1(
        cyclic,
      )).toThrow(/cyclic reference/);

    const widened = structuredClone(first) as Record<string, any>;
    widened.protocolDefinition.inverseProtocol.referenceCoordinateMap
      .undeclaredCoordinate = "forbidden";
    deepFreeze(widened);
    expect(() =>
      assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1(
        widened,
      )).toThrow(/inventory drifted/);

    const accessor = structuredClone(first) as Record<string, any>;
    Object.defineProperty(
      accessor.protocolDefinition.eventFreeCaseProtocol,
      "undeclaredAccessor",
      { enumerable: true, get: () => true },
    );
    deepFreeze(accessor);
    expect(() =>
      assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1(
        accessor,
      )).toThrow(/enumerable data property/);

    const symbol = structuredClone(first) as Record<string, any>;
    Object.defineProperty(
      symbol.protocolDefinition.identityHoldProtocol,
      Symbol("undeclared"),
      { enumerable: true, value: true },
    );
    deepFreeze(symbol);
    expect(() =>
      assertDeepFrozenAndClosedPhaseB1QuiescentReferenceEvidenceManifestV1(
        symbol,
      )).toThrow(/symbol (?:keys|properties)/);
  });
});

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8).digest("hex");
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && "value" in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
}

function expectRecursivelyFrozen(
  value: unknown,
  seen = new WeakSet<object>(),
): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && "value" in descriptor) {
      expectRecursivelyFrozen(descriptor.value, seen);
    }
  }
}
