import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
  type PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_BLOCKERS_V1,
  FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_STATUS_V1,
  assertCanonicalFourChamberPhaseB1QuiescentReferenceStatusV1,
  assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1,
  buildFourChamberPhaseB1QuiescentReferenceStatusV1,
  type FourChamberPhaseB1QuiescentReferenceStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceReadinessV1";

const MODES = ["on", "off"] as const;
const EXPECTED_READINESS_SHA256 =
  "0fd4b9a8b8c624896180303897b73ac72ec5d9f269c96f96ba4490164669b28f";
const NARROW_PASS_KEYS = [
  "projectSyntheticQuiescentPressureReferenceInversePass",
  "instantaneousHydraulicQuiescencePass",
  "projectSyntheticQuiescentReferenceEventFreeCasePass",
  "projectSyntheticToleranceCertifiedIdentityHoldPass",
] as const;
const BROAD_FALSE_KEYS = [
  "biologicalPressurePathPass",
  "acceptedPhaseB1ReferenceBranchPass",
  "physiologicalReferenceAcceptancePass",
  "supportedReferenceEnvelopePass",
  "continuousReferenceCoordinateRegularityPass",
  "continuousPressurePathRegularityPass",
  "closedLoopAnalyticalStationarityPass",
  "globalRootUniquenessPass",
  "globalRootExhaustivenessPass",
  "energeticStabilityPass",
  "fullBeatAcceptancePass",
  "eventIntegratedAcceptancePass",
  "physiologicalValidationPass",
  "phaseB1AcceptancePass",
  "pureCoreParentEvidenceAuthenticationClaimed",
  "releaseRuntimePass",
  "modelCoreIntegration",
  "browserRuntimeAdopted",
  "releaseRuntimeReachable",
] as const;

describe("Phase B1 quiescent-reference readiness", () => {
  let manifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  let numerical: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
  let readiness: FourChamberPhaseB1QuiescentReferenceStatusV1;

  beforeAll(() => {
    manifest = buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
    numerical = buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
      manifest,
      sha256,
    );
    readiness = buildFourChamberPhaseB1QuiescentReferenceStatusV1(
      manifest,
      numerical,
    );
  }, 900_000);

  it("binds the live canonical manifest, numerical evidence, and parent lineage", () => {
    expect(readiness.completionStatus)
      .toBe(FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_STATUS_V1);
    expect(readiness.manifestSha256).toBe(manifest.contentSha256);
    expect(readiness.numericalEvidenceSha256)
      .toBe(numerical.certificate.contentSha256);
    expect(readiness.bindings.quiescentReferenceEvidenceManifestSha256)
      .toBe(manifest.contentSha256);
    expect(readiness.bindings.numericalEvidenceSha256)
      .toBe(numerical.certificate.contentSha256);
    expect(readiness.bindings).toMatchObject(manifest.bindings);
    expect(readiness.lineage).toBe(manifest.lineage);
    expect(readiness.directParentAuthentication)
      .toBe(numerical.certificate.directParentAuthentication);
    expect(readiness.lineage.directParentGraphManifestSha256)
      .toBe(readiness.directParentAuthentication.finiteVolumeGraph.manifestSha256);
    expect(readiness.lineage.directParentGraphNumericalEvidenceSha256).toBe(
      readiness.directParentAuthentication.finiteVolumeGraph
        .numericalEvidenceSha256,
    );
    expect(readiness.lineage.directParentGraphReadinessSha256)
      .toBe(readiness.directParentAuthentication.finiteVolumeGraph.readinessSha256);
    expect(readiness.implementation.slsTopologies).toEqual(MODES);
    expect(readiness.allEvidenceBindingsPass).toBe(true);
    expect(readiness.evidenceLayerDirectParentAuthenticationPass).toBe(true);
    expect(readiness.implementation).toMatchObject({
      exactPairedPhysicalSlsModeInventory: true,
      manifestAndNumericalEvidenceCanonicalLive: true,
      directParentGraphArtifactsAuthenticated: true,
      effectiveJacobianStepAndStencilGateBound: true,
      reducedRestoringManifoldCorrectorBound: true,
      destinationRegistryCompiledOnceFromAcceptedDestination: true,
      completeIndependentDtGridIdentityHoldBound: true,
      pureCoreParentEvidenceAuthenticationClaimed: false,
    });
  });

  it("opens only the four narrow evidence-layer claims", () => {
    for (const key of NARROW_PASS_KEYS) expect(readiness[key]).toBe(true);
    for (const key of BROAD_FALSE_KEYS) expect(readiness[key]).toBe(false);
    expect(Object.values(readiness.deferred).every((value) => value === true))
      .toBe(true);
    expect(readiness.testOnly).toBe(true);
    expect(readiness.blockers)
      .toBe(FOUR_CHAMBER_PHASE_B1_QUIESCENT_REFERENCE_BLOCKERS_V1);
    expect(readiness.blockers.length).toBeGreaterThan(0);
    expect(readiness.blockers.every((blocker) => blocker.length > 0)).toBe(true);
  });

  it("is an exact, deeply frozen, canonically branded readiness output", () => {
    expect(Reflect.ownKeys(readiness)).toEqual([
      "phase",
      "completionStatus",
      "evidenceBoundary",
      "manifestSha256",
      "numericalEvidenceSha256",
      "lineage",
      "directParentAuthentication",
      "bindings",
      "implementation",
      "deferred",
      "allEvidenceBindingsPass",
      "evidenceLayerDirectParentAuthenticationPass",
      ...NARROW_PASS_KEYS,
      ...BROAD_FALSE_KEYS,
      "testOnly",
      "blockers",
    ]);
    expect(() =>
      assertCanonicalFourChamberPhaseB1QuiescentReferenceStatusV1(readiness))
      .not.toThrow();
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        readiness,
      )).not.toThrow();
    expectRecursivelyFrozen(readiness);

    const readinessSha256 = computeCanonicalSha256(readiness, sha256);
    expect(readinessSha256).toBe(EXPECTED_READINESS_SHA256);
    console.info("PHASE_B1_QUIESCENT_REFERENCE_READINESS", JSON.stringify({
      manifestSha256: readiness.manifestSha256,
      numericalEvidenceSha256: readiness.numericalEvidenceSha256,
      readinessSha256,
    }));
  });

  it("rejects copied or widened inputs at the canonical construction boundary", () => {
    const copiedManifest = Object.freeze({ ...manifest });
    expect(() => buildFourChamberPhaseB1QuiescentReferenceStatusV1(
      copiedManifest as PhaseB1QuiescentReferenceEvidenceManifestV1,
      numerical,
    )).toThrow(/canonically built/);

    const widenedManifest = Object.freeze({
      ...manifest,
      undeclared: true,
    });
    expect(() => buildFourChamberPhaseB1QuiescentReferenceStatusV1(
      widenedManifest as PhaseB1QuiescentReferenceEvidenceManifestV1,
      numerical,
    )).toThrow(/canonically built/);

    const copiedNumerical = Object.freeze({ ...numerical });
    expect(() => buildFourChamberPhaseB1QuiescentReferenceStatusV1(
      manifest,
      copiedNumerical as PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
    )).toThrow(/canonically built/);

    const widenedNumerical = Object.freeze({
      ...numerical,
      undeclared: true,
    });
    expect(() => buildFourChamberPhaseB1QuiescentReferenceStatusV1(
      manifest,
      widenedNumerical as PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
    )).toThrow(/canonically built/);

    const exactFrozenCopy = Object.freeze({ ...readiness });
    expect(() =>
      assertCanonicalFourChamberPhaseB1QuiescentReferenceStatusV1(
        exactFrozenCopy,
      )).toThrow(/canonically built/);
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        exactFrozenCopy,
      )).not.toThrow();

    const widenedReadiness = Object.freeze({
      ...readiness,
      undeclared: true,
    });
    expect(() =>
      assertCanonicalFourChamberPhaseB1QuiescentReferenceStatusV1(
        widenedReadiness,
      )).toThrow(/canonically built/);
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        widenedReadiness,
      )).toThrow(/must contain exactly/);
  });

  it("rejects mutable, internally inconsistent, and non-canonical forgeries", () => {
    const mutableCopy = { ...readiness };
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        mutableCopy,
      )).toThrow(/must be frozen/);

    const falseNarrowClaim = Object.freeze({
      ...readiness,
      projectSyntheticQuiescentPressureReferenceInversePass: false,
    });
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        falseNarrowClaim,
      )).toThrow(/inventory drifted/);

    const inconsistentBindings = Object.freeze({
      ...readiness.bindings,
      numericalEvidenceSha256: "0".repeat(64),
    });
    const falseBindingClaim = Object.freeze({
      ...readiness,
      bindings: inconsistentBindings,
    });
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        falseBindingClaim,
      )).toThrow(/inventory drifted/);

    const falseParentAuthentication = Object.freeze({
      ...readiness.directParentAuthentication,
      allDirectParentArtifactsAuthenticated: false,
    });
    const falseParentClaim = Object.freeze({
      ...readiness,
      directParentAuthentication: falseParentAuthentication,
    });
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        falseParentClaim,
      )).toThrow(/inventory drifted/);

    const invalidParentGraph = Object.freeze({
      ...readiness.directParentAuthentication.finiteVolumeGraph,
      manifestSha256: "not-a-sha256",
    });
    const invalidParentAuthentication = Object.freeze({
      ...readiness.directParentAuthentication,
      finiteVolumeGraph: invalidParentGraph,
    });
    const invalidParentLineage = Object.freeze({
      ...readiness.lineage,
      directParentGraphManifestSha256: "not-a-sha256",
    });
    const invalidParentHashClaim = Object.freeze({
      ...readiness,
      lineage: invalidParentLineage,
      directParentAuthentication: invalidParentAuthentication,
    });
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        invalidParentHashClaim,
      )).toThrow(/inventory drifted/);

    const cyclic = { ...readiness } as Record<string, unknown>;
    cyclic.lineage = cyclic;
    Object.freeze(cyclic);
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        cyclic,
      )).toThrow(/cyclic reference/);

    const accessor = { ...readiness };
    Object.defineProperty(accessor, "phase", {
      configurable: true,
      enumerable: true,
      get: () => readiness.phase,
    });
    Object.freeze(accessor);
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        accessor,
      )).toThrow(/enumerable data property/);

    const symbolKeyed = { ...readiness };
    Object.defineProperty(symbolKeyed, Symbol("undeclared"), {
      enumerable: true,
      value: true,
    });
    Object.freeze(symbolKeyed);
    expect(() =>
      assertDeepFrozenAndClosedFourChamberPhaseB1QuiescentReferenceStatusV1(
        symbolKeyed,
      )).toThrow(/symbol keys/);
  });
});

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8, "utf8").digest("hex");
}

function expectRecursivelyFrozen(value: unknown): void {
  const seen = new WeakSet<object>();
  const visit = (candidate: unknown): void => {
    if (candidate === null || typeof candidate !== "object") return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    expect(Object.isFrozen(candidate)).toBe(true);
    for (const key of Reflect.ownKeys(candidate)) {
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
      if (descriptor !== undefined && "value" in descriptor) {
        visit(descriptor.value);
      }
    }
  };
  visit(value);
}
