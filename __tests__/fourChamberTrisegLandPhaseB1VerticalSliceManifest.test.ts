import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
  WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1,
} from "@/engine/myocardium/fourChamberV1/energy/wholeHeartEnergyNormalizationV1";
import {
  canonicalizeJson,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicNumericalPolicyV1";
import {
  EXACT_LAND_SEMISMOOTH_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/land/exactSemismoothPolicyV1";
import {
  PHASE_B1_FROZEN_FOUNDATION_MANIFEST_SHA256_V1,
  PHASE_B1_FROZEN_FOUNDATION_READINESS_SHA256_V1,
  buildPhaseB1MonolithicVerticalSliceManifestV1,
  phaseB1MonolithicVerticalSliceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/monolithicVerticalSliceManifestV1";
import {
  FOUR_CHAMBER_PHASE_B1_MONOLITHIC_VERTICAL_SLICE_BLOCKERS_V1,
  FOUR_CHAMBER_PHASE_B1_MONOLITHIC_VERTICAL_SLICE_STATUS_V1,
  buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MonolithicVerticalSliceReadinessV1";
import {
  buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1,
  phaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticVerticalSliceCaseDescriptorV1";
import {
  PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/verticalSliceEventEvidenceFixtureV1";
import {
  PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditPolicyV1";
import {
  PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";

const EXPECTED_DESCRIPTOR_SHA256 =
  "d2fd8e854e6c520d1ea73be0b3f32005e50e2be282fee94484d2ce6e91ab1d99";
const EXPECTED_MANIFEST_SHA256 =
  "973351efd96000e1a69041eb44b41db44d2e4ecc3556005763f3d1ce672e9d69";
const EXPECTED_READINESS_SHA256 =
  "379fb468c1feba725db39465ea7c7bee24476e60e36265a6dce77bc673a82324";

describe("four-chamber Phase B1 monolithic vertical-slice evidence manifest", () => {
  const descriptor = buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1(
    sha256,
  );
  const manifest = buildPhaseB1MonolithicVerticalSliceManifestV1(
    descriptor,
    sha256,
  );
  const readiness = buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1(
    manifest,
  );

  it("pins the canonical synthetic descriptor and covers both physical SLS topologies", () => {
    const payload = phaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1(
      descriptor,
    );
    expect(payload).not.toHaveProperty("hashAlgorithm");
    expect(payload).not.toHaveProperty("contentSha256");
    expect(descriptor.contentSha256).toBe(
      sha256(canonicalizeJson(payload)),
    );
    expect(descriptor.contentSha256).toBe(EXPECTED_DESCRIPTOR_SHA256);
    expect(descriptor.slsModes).toEqual(["on", "off"]);
    expect(Object.keys(descriptor.warmStartByMode)).toEqual(["on", "off"]);
    expect(descriptor.oneStepDtSec).toBe(0.00025);
    expect(descriptor.warmStartByMode.on.slsMode).toBe("on");
    expect(descriptor.warmStartByMode.off.slsMode).toBe("off");
    expect(descriptor.warmStartByMode.on.storedDifferentialStateVector)
      .toHaveLength(59);
    expect(descriptor.warmStartByMode.off.storedDifferentialStateVector)
      .toHaveLength(54);
    for (const mode of descriptor.slsModes) {
      const warmStart = descriptor.warmStartByMode[mode];
      expect(warmStart.timeSec).toBe(0);
      expect(warmStart.algorithm.geometryConsistentIsometricSteadyStateByWall)
        .toBe(true);
      expect(warmStart.algorithm.landStatesStrictlyInsidePopulationSimplex)
        .toBe(true);
      expect(warmStart.algorithm.fullColdInitializationComplete).toBe(false);
      expect(warmStart.algorithm.acceptedMaterialHomotopyBranchEstablished)
        .toBe(false);
    }
    expect(descriptor.model.candidatePriorOnly).toBe(true);
    expect(Object.values(descriptor.negativeClaims).every((claim) => !claim))
      .toBe(true);
  });

  it("pins the canonical manifest, frozen foundation lineage, and exact numerical policy", () => {
    const payload = phaseB1MonolithicVerticalSliceManifestHashPayloadV1(
      manifest,
    );
    expect(payload).not.toHaveProperty("hashAlgorithm");
    expect(payload).not.toHaveProperty("contentSha256");
    expect(manifest.contentSha256).toBe(sha256(canonicalizeJson(payload)));
    expect(manifest.contentSha256).toBe(EXPECTED_MANIFEST_SHA256);
    expect(manifest.bindings.syntheticCaseDescriptorSha256)
      .toBe(descriptor.contentSha256);
    expect(manifest.bindings).toMatchObject({
      phaseA1TissueManifestBundleSha256:
        descriptor.bindings.phaseA1TissueManifestBundleSha256,
      stateNewtonTopologySha256:
        descriptor.bindings.stateNewtonTopologySha256,
      wallMaterialBindingDescriptorSha256:
        descriptor.bindings.wallMaterialBindingDescriptorSha256,
      scaffoldConfigurationSha256:
        descriptor.bindings.scaffoldConfigurationSha256,
      newtonScaleRegistryContentSha256:
        descriptor.model.newtonScaleRegistryContentSha256,
      eventFreeNumericalPolicySha256:
        descriptor.model.eventFreeNumericalPolicySha256,
    });
    expect(manifest.lineage).toEqual({
      frozenFoundationManifestSha256:
        "fa588cd7d59169795429679eb5c4c824a8d4f68a20c8868a36ea2d950d6dfd2d",
      frozenFoundationReadinessSha256:
        "e8b12dc997c4f9b159db7f6a516bc885a2a7bbb6aee8d0061f6f0a8e474949e6",
      frozenFoundationArtifactsReproduceCanonicalHashes: true,
    });
    expect(manifest.lineage.frozenFoundationManifestSha256)
      .toBe(PHASE_B1_FROZEN_FOUNDATION_MANIFEST_SHA256_V1);
    expect(manifest.lineage.frozenFoundationReadinessSha256)
      .toBe(PHASE_B1_FROZEN_FOUNDATION_READINESS_SHA256_V1);

    expect(descriptor.model.eventFreeNumericalPolicy).toEqual({
      policyId: "phase-b1-event-free-monolithic-reference-numerics-v1",
      algorithmicJacobian: "constraint-aware-scaled-five-point-full-system",
      algorithmicJacobianScaledStep: 2 ** -19,
      independentDirectionalAuditStepRatioToConstruction: 0.25,
      semismoothDirectionalConsistencyRelativeTwoNormTolerance: 1e-6,
      minimumRequiredScaledCrossBlockMagnitude: 1e-6,
      differentiatedKinematicsDirectionalStepSec: 1e-7,
      differentiatedKinematicsStepHalvingFactor: 2,
      differentiatedKinematicsHalvingRelativeTolerance: 1e-6,
      differentiatedTriSegConstraintResidualToleranceNPerMSec: 1e-5,
      maxNewtonIterations: 24,
      armijoCoefficient: 1e-4,
      lineSearchContraction: 0.5,
      maxLineSearchBacktracks: 24,
      minimumStepLength: 1e-12,
      fractionToBoundarySafety: 0.995,
      relativePivotTolerance: 64 * Number.EPSILON,
      strictBloodVolumeLowerBoundM3: 1e-12,
      strictJunctionRadiusLowerBoundM: 1e-6,
      landSimplexStrictInterior: true,
      landPopulationProjection: false,
      hiddenStateClipping: false,
      adaptiveRescaling: false,
      testReferenceOnly: true,
      physiologicalParameter: false,
      releaseRuntimeReachable: false,
    });
    expect(descriptor.model.eventFreeNumericalPolicy)
      .toEqual(PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1);
    expect(manifest.eventFreeProtocol).toMatchObject({
      slsModes: ["on", "off"],
      dtSec: 0.00025,
      stepCountPerMode: 1,
      totalBloodVolumeAbsoluteToleranceM3: 1e-17,
      projectionAllowed: false,
      hiddenClippingAllowed: false,
      flowClampAllowed: false,
    });
    expect(manifest.simplexProtocol.fractionToBoundarySafety).toBe(0.995);
    expect(manifest.globalJacobianProtocol).toMatchObject({
      constructionScaledStep: 2 ** -19,
      directionalAuditStepRatio: 0.25,
      directionalRelativeTwoNormTolerance: 1e-6,
      minimumRequiredScaledCrossBlockMagnitude: 1e-6,
    });
    expect(manifest.globalJacobianProtocol.exactLandSemismoothPolicy)
      .toBe(EXACT_LAND_SEMISMOOTH_POLICY_V1);
    expect(manifest.bindings.exactLandSemismoothPolicySha256).toBe(
      sha256(canonicalizeJson(EXACT_LAND_SEMISMOOTH_POLICY_V1)),
    );
    expect(manifest.evidenceFixtures.exactEventRegression)
      .toBe(PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1);
    expect(manifest.evidenceFixtures.exactEventRegression.slsModes)
      .toEqual(descriptor.slsModes);
    expect(manifest.evidenceFixtures.exactEventRegression
      .fiveWallCanonicalBatch.reverseInputOrderCompared).toBe(true);
    expect(manifest.evidenceFixtures.exactEventRegression
      .emptyBatchRegressedInBothTopologies).toBe(true);
    expect(manifest.bindings.exactEventEvidenceFixtureSha256).toBe(
      sha256(canonicalizeJson(
        PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1,
      )),
    );
    expect(manifest.energyEvidence.mechanicalEnergyAuditPolicy)
      .toBe(PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1);
    expect(manifest.bindings.mechanicalEnergyAuditPolicySha256).toBe(
      sha256(canonicalizeJson(
        PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
      )),
    );
    expect(manifest.energyEvidence.normalization).toEqual({
      powerReferenceW: WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1,
      powerFloorW: WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
    });
    expect(manifest.energyEvidence.normalizedSlsIdentityTolerance).toBe(
      PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
    );
    expect(manifest.bindings.wholeHeartEnergyNormalizationSha256).toBe(
      sha256(canonicalizeJson(manifest.energyEvidence.normalization)),
    );
  });

  it("keeps implemented, deferred, and negative claims on disjoint evidence boundaries", () => {
    expect(Object.values(manifest.implementationClaims).every(Boolean))
      .toBe(true);
    expect(Object.values(manifest.deferred).every(Boolean)).toBe(true);
    expect(Object.values(manifest.negativeClaims).every((claim) => !claim))
      .toBe(true);
    expect(manifest.exactEventProtocol).toMatchObject({
      forcingSide: "pre-jump-left-limit",
      aggregateBatchCommittedOnce: true,
      nonemptyEventTransactionRegressedInBothTopologies: true,
      postEventTriSegReinitializationCount: "zero-or-one",
      overflowPreflightBeforeAtomicSolve: true,
      immutableEndpointRollbackSnapshotReturnedAndNoInternalCommitBeforeSuccess:
        true,
      followingIntervalUsesPostJumpCalcium: true,
    });
    expect(manifest.energyEvidence).toMatchObject({
      differentiatedLandKinematicsImplemented: true,
      wholeHeartSlsBackwardEulerIdentityImplemented: true,
      wholeHeartMechanicalCorrectedEndpointStageLedgerImplemented: true,
      publishedTaylorWorkConjugacyClaimed: false,
      atpChemicalEnergyOrEfficiencyClaimed: false,
      backwardEulerWholeHeartEnergyAcceptanceGateImplemented: false,
    });

    const {
      projectionOrHiddenClippingApplied,
      flowClampApplied,
      ...positiveImplementationClaims
    } = readiness.implemented;
    expect(Object.values(positiveImplementationClaims).every(Boolean))
      .toBe(true);
    expect(projectionOrHiddenClippingApplied).toBe(false);
    expect(flowClampApplied).toBe(false);
    expect(readiness.deferred).toBe(manifest.deferred);
    expect(readiness.negativeClaims).toBe(manifest.negativeClaims);
    expect(readiness.evidenceGates).toMatchObject({
      phaseB1ComponentFoundationComplete: true,
      phaseB1OneStepEndpointEventVerticalSliceImplementationComplete: true,
      phaseB1ExactEventTransactionRegressionComplete: true,
      phaseB1ShortHorizonAcceptanceComplete: false,
      phaseB1TimestepConvergenceComplete: false,
      phaseB1FullBeatAcceptanceComplete: false,
      phaseB1AcceptanceComplete: false,
      supportedEnvelopeComplete: false,
      closedLoopReleaseEligible: false,
      clinicalReleaseReady: false,
    });
  });

  it("pins readiness and keeps every release-runtime path false", () => {
    expect(sha256(canonicalizeJson(readiness))).toBe(
      EXPECTED_READINESS_SHA256,
    );
    expect(readiness.completionStatus).toBe(
      FOUR_CHAMBER_PHASE_B1_MONOLITHIC_VERTICAL_SLICE_STATUS_V1,
    );
    expect(readiness.bindings).toMatchObject({
      monolithicVerticalSliceManifestSha256: EXPECTED_MANIFEST_SHA256,
      syntheticCaseDescriptorSha256: EXPECTED_DESCRIPTOR_SHA256,
      frozenFoundationManifestSha256:
        PHASE_B1_FROZEN_FOUNDATION_MANIFEST_SHA256_V1,
      frozenFoundationReadinessSha256:
        PHASE_B1_FROZEN_FOUNDATION_READINESS_SHA256_V1,
    });
    const { testOnlySidecar, ...runtimeFalse } = readiness.runtimeBoundary;
    expect(testOnlySidecar).toBe(true);
    expect(Object.values(runtimeFalse).every((claim) => !claim)).toBe(true);
    expect(readiness.negativeClaims.modelCoreIntegration).toBe(false);
    expect(readiness.negativeClaims.browserRuntimeAdopted).toBe(false);
    expect(readiness.negativeClaims.releaseRuntimeReachable).toBe(false);
    expect(readiness.blockers)
      .toBe(FOUR_CHAMBER_PHASE_B1_MONOLITHIC_VERTICAL_SLICE_BLOCKERS_V1);
    expect(readiness.blockers).toHaveLength(5);
  });

  it("rejects copied descriptor or manifest objects before deriving evidence", () => {
    const copiedDescriptor = Object.freeze({
      ...descriptor,
    }) as typeof descriptor;
    expect(() => buildPhaseB1MonolithicVerticalSliceManifestV1(
      copiedDescriptor,
      sha256,
    )).toThrow(/canonically built/);

    const copiedManifest = Object.freeze({
      ...manifest,
    }) as typeof manifest;
    expect(() => buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1(
      copiedManifest,
    )).toThrow(/canonically built/);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
