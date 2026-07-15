import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
  PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_NUMERICAL_EVIDENCE_V1_ID,
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  assertDeepFrozenPhaseB1QuiescentReferenceNumericalEvidenceV1,
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
  phaseB1QuiescentReferenceNumericalEvidenceHashPayloadV1,
  type PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";

const EXPECTED_MANIFEST_SHA256 =
  "218d5abd7b53dd0e4db594bac1ac1848d3ac49acc3efbdd02b843ee27338bf24";
const EXPECTED_NUMERICAL_SHA256 =
  "7dd2cc61e9f5da24d9495a89b20369bfea143eb03e511fa312ee0c55a3acc9ec";
const MODES = ["on", "off"] as const;

describe("Phase B1 quiescent-reference numerical evidence", () => {
  let manifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  let numerical: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;

  beforeAll(() => {
    manifest = buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
    numerical = buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
      manifest,
      sha256,
    );
  }, 900_000);

  it("self-hashes and authenticates the rebuilt finite-volume-graph parent", () => {
    const certificate = numerical.certificate;
    expect(manifest.contentSha256).toBe(EXPECTED_MANIFEST_SHA256);
    expect(certificate.evidenceId)
      .toBe(PHASE_B1_QUIESCENT_REFERENCE_NUMERICAL_EVIDENCE_V1_ID);
    expect(certificate.manifestSha256).toBe(manifest.contentSha256);
    expect(certificate.manifestBindings).toBe(manifest.bindings);
    expect(certificate.slsModes).toEqual(MODES);
    expect(Reflect.ownKeys(certificate.modes)).toEqual(MODES);
    expect(Reflect.ownKeys(numerical.results)).toEqual(MODES);
    expect(certificate.directParentAuthentication).toEqual({
      finiteVolumeGraph: {
        manifestSha256:
          PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_MANIFEST_SHA256_V1,
        numericalEvidenceSha256:
          PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_NUMERICAL_SHA256_V1,
        readinessSha256:
          PHASE_B1_QUIESCENT_REFERENCE_PARENT_GRAPH_READINESS_SHA256_V1,
        manifestRebuiltCanonicalSelfHashedAndPinned: true,
        numericalBundleRebuiltCanonicalSelfHashedAndPinned: true,
        readinessRebuiltCanonicalHashedAndPinned: true,
        liveBrandedOnOffGraphResultsConsumed: true,
      },
      exactSlsModeKeys: true,
      evidenceLayerDirectParentLineageAuthentication: true,
      pureCoreParentEvidenceAuthenticationClaimed: false,
      allDirectParentArtifactsAuthenticated: true,
    });
    expect(certificate.contentSha256).toBe(EXPECTED_NUMERICAL_SHA256);
    expect(certificate.contentSha256).toBe(computeCanonicalSha256(
      phaseB1QuiescentReferenceNumericalEvidenceHashPayloadV1(certificate),
      sha256,
    ));
    expect(certificate.allModesPass).toBe(true);
    expect(assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
      numerical,
      manifest,
    )).toBe(numerical);
  });

  it("retains the exact live branded graph to inverse to case to hold chain", () => {
    for (const mode of MODES) {
      const raw = numerical.results[mode];
      expect(Reflect.ownKeys(raw)).toEqual([
        "graph",
        "inverse",
        "eventFreeCase",
        "identityHold",
      ]);
      expect(raw.graph).toBe(
        numerical.directParent.numericalEvidence.results[mode],
      );
      expect(raw.inverse.sourceGraph).toBe(raw.graph);
      expect(raw.eventFreeCase.inverse).toBe(raw.inverse);
      expect(raw.eventFreeCase.acceptedInverseEndpoint)
        .toBe(raw.inverse.endpoint);
      expect(raw.identityHold.case).toBe(raw.eventFreeCase);
      expect(raw.eventFreeCase.destinationRegistry)
        .toBe(raw.eventFreeCase.model.newtonScaleRegistry);
      expect(raw.inverse.projectSyntheticQuiescentReferenceInversePass)
        .toBe(true);
      expect(raw.eventFreeCase
        .projectSyntheticQuiescentReferenceEventFreeCasePass).toBe(true);
      expect(raw.identityHold
        .projectSyntheticToleranceCertifiedIdentityHoldPass).toBe(true);
      expect(() =>
        assertCanonicalPhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1(
          raw.graph,
        )).not.toThrow();
      expect(() =>
        assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
          raw.inverse,
        )).not.toThrow();
      expect(numerical.certificate.modes[mode].rawIdentity
        .allIdentityLinksExact).toBe(true);
    }
  });

  it("replays every finite inverse, Schur, endpoint, registry, and dt summary", () => {
    for (const mode of MODES) {
      const raw = numerical.results[mode];
      const summary = numerical.certificate.modes[mode];
      expect(summary.slsMode).toBe(mode);
      expect(summary.attempts.map((attempt) => attempt.refinementFactor))
        .toEqual([2, 4, 8]);
      expect(summary.attempts.every((attempt) => attempt.completed)).toBe(true);
      expect(summary.selection).toMatchObject({
        exactTwoFourEightFactorInventory: true,
        everyAttemptStartsFromExactSourceIndependently: true,
        firstHardAndFiftyPercentGuardSelectionPass: true,
        recomputedFirstSelectionExact: true,
      });
      expect(summary.selection.selectedAttemptIndex).not.toBeNull();
      const selected = summary.attempts[
        summary.selection.selectedAttemptIndex as number
      ];
      expect(selected.selected).toBe(true);
      expect(selected.hardGatePass).toBe(true);
      expect(selected.fiftyPercentGuardPass).toBe(true);

      expect(canonicalizeJson(summary.sourceIdentity.audit))
        .toBe(canonicalizeJson(raw.inverse.sourceIdentityAudit));
      expect(summary.sourceIdentity).toMatchObject({
        sourceGraphObjectIdentity: true,
        sourceCanonicalNodeObjectIdentity: true,
        sourceCanonicalNodeMatchesGraphCenter: true,
        sourceSchurAuditObjectIdentity: true,
      });
      for (const [attemptIndex, attempt] of raw.inverse.attempts.entries()) {
        const replay = summary.attempts[attemptIndex];
        expect(replay.requestedRhoValues).toEqual(attempt.requestedRhoValues);
        expect(replay.attemptedRhoValues).toEqual(attempt.attemptedRhoValues);
        expect(replay.hardGatePass).toBe(attempt.hardGatePass);
        expect(replay.fiftyPercentGuardPass)
          .toBe(attempt.fiftyPercentGuardPass);
        for (const [nodeIndex, node] of attempt.nodes.entries()) {
          const nodeReplay = replay.nodes[nodeIndex];
          expect(nodeReplay.rho).toBe(node.rho);
          expect(nodeReplay.logReferenceMultipliers)
            .toEqual(node.logReferenceMultipliers);
          expect(canonicalizeJson(nodeReplay.referenceConfiguration))
            .toBe(canonicalizeJson(node.referenceConfiguration));
          expect(nodeReplay.schurAudit.primaryScaledStepByColumn)
            .toEqual(node.schurAudit.primaryScaledStepByColumn);
          expect(nodeReplay.schurAudit.independentScaledStepByColumn)
            .toEqual(node.schurAudit.independentScaledStepByColumn);
          expect(nodeReplay.schurAudit.primaryStencilByColumn)
            .toEqual(node.schurAudit.primaryStencilByColumn);
          expect(nodeReplay.schurAudit.independentStencilByColumn)
            .toEqual(node.schurAudit.independentStencilByColumn);
          expect(nodeReplay.schurAudit
            .effectiveJacobianStencilGatePass).toBe(true);
          expect(nodeReplay.schurAudit
            .everyCorrespondingEffectiveStepDiffers).toBe(true);
          expect(nodeReplay.schurAudit
            .everyIndependentEffectiveStepExceedsPrimary).toBe(true);
        }
      }

      const endpoint = raw.inverse.endpoint;
      expect(endpoint).not.toBeNull();
      if (endpoint === null) throw new Error("passing endpoint absent");
      expect(summary.endpoint.logReferenceMultipliers)
        .toEqual(endpoint.logReferenceMultipliers);
      expect(canonicalizeJson(summary.endpoint.referenceConfiguration))
        .toBe(canonicalizeJson(endpoint.referenceConfiguration));
      expect(summary.endpoint.actualChamberPressurePa)
        .toEqual(endpoint.evaluation.closedLoop.chamberAbsolutePressurePa);
      expect(summary.endpoint.allFlowsM3PerSec)
        .toEqual(endpoint.evaluation.closedLoop.allFlowsM3PerSec);
      expect(summary.endpointAgreementAndReverseClosure)
        .toMatchObject({
          maximumForwardEndpointAgreementScaledInfinityNorm:
            raw.inverse.maximumForwardEndpointAgreementScaledInfinityNorm,
          forwardEndpointAgreementPass: true,
          factorEightReverseClosureScaledInfinityNorm:
            raw.inverse.factorEightReverseClosureScaledInfinityNorm,
          factorEightReverseClosurePass: true,
        });
      expect(summary.failureProbes.map((probe) => probe.injectedAttemptIndex))
        .toEqual([0, 1]);
      expect(summary.failureProbes.every((probe) => probe.pass)).toBe(true);
      expect(summary.destination.registryAudit)
        .toEqual(raw.eventFreeCase.registryAudit);
      expect(summary.destination.staticAudit)
        .toEqual(raw.eventFreeCase.staticAudit);
      expect(summary.destination.destinationRegistryContentSha256)
        .toBe(raw.eventFreeCase.destinationRegistry.registryContentSha256);
      expect(summary.identityHold.dtGridSec)
        .toEqual(raw.identityHold.dtGridSec);
      expect(summary.identityHold.steps).toHaveLength(3);
      for (const [index, step] of summary.identityHold.steps.entries()) {
        const audit = raw.identityHold.stepAudits[index];
        expect(step.dtSec).toBe(audit.dtSec);
        expect(step.acceptedNewtonStepCount).toBe(0);
        expect(step.acceptedNewtonStepCountExactZero).toBe(true);
        expect(step.previousEndpointNonTimeStateExact).toBe(true);
        expect(step.nextNewtonTopologyExact).toBe(true);
        expect(step.nextCalciumStateExact).toBe(true);
        expect(step.finalScaledResidualInfinityNorm)
          .toBe(audit.finalScaledResidualInfinityNorm);
        expect(step.finalScaledUpdateInfinityNorm)
          .toBe(audit.finalScaledUpdateInfinityNorm);
        expect(step.maximumAbsoluteChamberTargetPressureDifferencePa)
          .toBe(audit.maximumAbsoluteChamberTargetPressureDifferencePa);
        expect(step.maximumAbsoluteInertialFlowAccelerationM3PerSec2)
          .toBe(audit.maximumAbsoluteInertialFlowAccelerationM3PerSec2);
        expect(step.pass).toBe(true);
      }
      expect(summary.continuationExtrema).toMatchObject({
        everySchurRankFour: true,
        everySchurEffectiveStepAndStencilGatePass: true,
        everySchurIndependentAgreementPass: true,
        everySchurJacobiAuditConverged: true,
        everyColdRestoringAuditPass: true,
      });
      expect(summary.modePass).toBe(true);
    }
  });

  it("has exact closed certificate schemas, narrow-only claims, and deep freeze", () => {
    expect(Reflect.ownKeys(numerical)).toEqual([
      "certificate",
      "directParent",
      "results",
    ]);
    expect(Reflect.ownKeys(numerical.certificate)).toEqual([
      "evidenceId",
      "manifestSha256",
      "manifestBindings",
      "directParentAuthentication",
      "slsModes",
      "modes",
      "narrowClaims",
      "broadClaims",
      "allModesPass",
      "hashAlgorithm",
      "contentSha256",
    ]);
    const expectedModeKeys = [
      "slsMode",
      "rawIdentity",
      "sourceIdentity",
      "attempts",
      "selection",
      "continuationExtrema",
      "endpoint",
      "endpointAgreementAndReverseClosure",
      "factorEightReverse",
      "failureProbes",
      "destination",
      "identityHold",
      "prohibitedOperations",
      "narrowClaims",
      "broadClaims",
      "testOnly",
      "modePass",
    ];
    for (const mode of MODES) {
      const summary = numerical.certificate.modes[mode];
      expect(Reflect.ownKeys(summary)).toEqual(expectedModeKeys);
      expect(Object.values(summary.narrowClaims).every((value) => value))
        .toBe(true);
      expect(Object.values(summary.broadClaims)
        .every((value) => value === false)).toBe(true);
      expect(Object.values(summary.prohibitedOperations)
        .every((value) => value === false)).toBe(true);
      expect(canonicalizeJson(summary)).not.toContain("undefined");
    }
    expect(Object.values(numerical.certificate.narrowClaims)
      .every((value) => value === true)).toBe(true);
    expect(Object.values(numerical.certificate.broadClaims)
      .every((value) => value === false)).toBe(true);
    expect(assertDeepFrozenPhaseB1QuiescentReferenceNumericalEvidenceV1(
      numerical,
    )).toBe(numerical);
    expectRecursivelyFrozen(numerical);
    expect(() =>
      assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
        { ...numerical },
        manifest,
      )).toThrow(/canonically built/);
    const immutableAudits = numerical.results.on.identityHold.stepAudits;
    const mutableAudits = immutableAudits as unknown as unknown[];
    expect(() => mutableAudits.push(
      numerical.results.on.identityHold.stepAudits[0],
    )).toThrow(TypeError);
  });

  it("reports the deterministic numerical hash and bounded extrema", () => {
    const on = numerical.certificate.modes.on;
    const off = numerical.certificate.modes.off;
    console.info("PHASE_B1_QUIESCENT_REFERENCE_NUMERICAL_EVIDENCE", JSON.stringify({
      contentSha256: numerical.certificate.contentSha256,
      on: reportMetrics(on),
      off: reportMetrics(off),
    }));
    for (const summary of [on, off]) {
      expect(summary.continuationExtrema.minimumPrimarySchurSigma)
        .toBeGreaterThan(0);
      expect(summary.continuationExtrema.minimumIndependentSchurSigma)
        .toBeGreaterThan(0);
      expect(summary.continuationExtrema
        .minimumPrimaryColdBlockRelativePivot).toBeGreaterThan(0);
      expect(summary.continuationExtrema
        .minimumIndependentColdBlockRelativePivot).toBeGreaterThan(0);
      expect(summary.endpoint
        .maximumAbsoluteChamberTargetPressureDifferencePa).toBeGreaterThanOrEqual(0);
      expect(summary.endpoint
        .maximumAbsoluteInertialFlowAccelerationM3PerSec2).toBeGreaterThanOrEqual(0);
    }
  });
});

function reportMetrics(
  summary: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1[
    "certificate"
  ]["modes"]["on"],
) {
  return {
    selectedRefinementFactor: summary.selection.selectedRefinementFactor,
    minimumPrimarySchurSigma:
      summary.continuationExtrema.minimumPrimarySchurSigma,
    minimumIndependentSchurSigma:
      summary.continuationExtrema.minimumIndependentSchurSigma,
    maximumPrimarySchurConditionNumber2:
      summary.continuationExtrema.maximumPrimarySchurConditionNumber2,
    maximumIndependentSchurConditionNumber2:
      summary.continuationExtrema.maximumIndependentSchurConditionNumber2,
    minimumPrimaryColdBlockRelativePivot:
      summary.continuationExtrema.minimumPrimaryColdBlockRelativePivot,
    minimumIndependentColdBlockRelativePivot:
      summary.continuationExtrema.minimumIndependentColdBlockRelativePivot,
    maximumCoarseFineScaledSchurAbsoluteDifference:
      summary.continuationExtrema
        .maximumCoarseFineScaledSchurAbsoluteDifference,
    endpointPressureDifferencePa:
      summary.endpoint.maximumAbsoluteChamberTargetPressureDifferencePa,
    endpointAccelerationM3PerSec2:
      summary.endpoint.maximumAbsoluteInertialFlowAccelerationM3PerSec2,
    destinationRegistryContentSha256:
      summary.destination.destinationRegistryContentSha256,
    dtResiduals: summary.identityHold.steps.map((step) =>
      step.finalScaledResidualInfinityNorm),
    dtUpdates: summary.identityHold.steps.map((step) =>
      step.finalScaledUpdateInfinityNorm),
  };
}

function expectRecursivelyFrozen(value: unknown): void {
  const seen = new WeakSet<object>();
  const visit = (candidate: unknown): void => {
    if (
      candidate === null
      || (typeof candidate !== "object" && typeof candidate !== "function")
    ) return;
    const objectCandidate = candidate as object;
    if (seen.has(objectCandidate)) return;
    seen.add(objectCandidate);
    expect(Object.isFrozen(objectCandidate)).toBe(true);
    for (const key of Reflect.ownKeys(objectCandidate)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(objectCandidate, key);
      if (descriptor !== undefined && "value" in descriptor) {
        visit(descriptor.value);
      }
    }
  };
  visit(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
