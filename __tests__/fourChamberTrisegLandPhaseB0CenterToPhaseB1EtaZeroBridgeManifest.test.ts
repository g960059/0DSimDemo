import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_READINESS_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_MANIFEST_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_NUMERICAL_SHA256_V1,
  PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_READINESS_SHA256_V1,
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
  buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
  phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestHashPayloadV1,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1";
import {
  assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1,
  buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1,
  phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceHashPayloadV1,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1";
import {
  buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeReadinessV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
  PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";

const EXPECTED_BRIDGE_MANIFEST_SHA256 =
  "a74e6294986d2144573990df4fca5e1d17a58c4642a7b0737f3b956db525528c";
const EXPECTED_BRIDGE_NUMERICAL_EVIDENCE_SHA256 =
  "183f938b1a87c619dee2fd60344ac4f1baed2aa94eac9a0bea8e40552111f60c";
const EXPECTED_BRIDGE_READINESS_SHA256 =
  "84ccdf648a18e0f6a5eea1278c744fae2ac02822375075e1862f84376fd8ac47";

describe("four-chamber Phase B0-center to Phase B1 eta-zero bridge evidence", () => {
  let manifest: PhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1;
  let numericalEvidence:
    PhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceBundleV1;
  let readiness: ReturnType<
    typeof buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1
  >;

  beforeAll(() => {
    manifest =
      buildPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(sha256);
    numericalEvidence =
      buildPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
        manifest,
        sha256,
      );
    readiness =
      buildFourChamberPhaseB0CenterToPhaseB1EtaZeroBridgeStatusV1(
        manifest,
        numericalEvidence,
      );
  }, 180_000);

  it("binds the complete frozen B0 and B1 parent lineage and bridge contract", () => {
    expect(manifest.lineage).toEqual({
      phaseB0FiniteEnvelopeManifestSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1,
      phaseB0FiniteEnvelopeNumericalEvidenceSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1,
      phaseB0FiniteEnvelopeReadinessSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_READINESS_SHA256_V1,
      phaseB1ColdInitializationManifestSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_MANIFEST_SHA256_V1,
      phaseB1ColdInitializationNumericalEvidenceSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_NUMERICAL_SHA256_V1,
      phaseB1ColdInitializationReadinessSha256:
        PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B1_COLD_READINESS_SHA256_V1,
      canonicalParentManifestsVerifiedLive: true,
      parentNumericalAndReadinessArtifactsAreFrozenLineagePins: true,
    });
    expect(manifest.protocolDefinition.bridgeId)
      .toBe(PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID);
    expect(manifest.protocolDefinition.source.nodeId).toBe("C");
    expect(manifest.protocolDefinition.transfer.fields).toEqual(["V_m_S", "y_m"]);
    expect(manifest.protocolDefinition.transfer.noOtherPhaseB0StateTransferred)
      .toBe(true);
    expect(manifest.protocolDefinition.destination).toEqual({
      adapterId:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
      protocolId: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
      homotopyId: PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
      eta: 0,
    });
    expect(manifest.protocolDefinition.policy)
      .toEqual(PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1);
    expect(manifest.bindings.protocolDefinitionSha256).toBe(
      computeCanonicalSha256(manifest.protocolDefinition, sha256),
    );
    expect(manifest.bindings.bridgePolicySha256).toBe(
      computeCanonicalSha256(manifest.protocolDefinition.policy, sha256),
    );
    expect(manifest.contentSha256).toBe(
      computeCanonicalSha256(
        phaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestHashPayloadV1(
          manifest,
        ),
        sha256,
      ),
    );
  });

  it("records full transfer, parity, and eta-zero equilibrium metrics for exact mode keys", () => {
    const certificate = numericalEvidence.certificate;
    expect(certificate.slsModes).toEqual(["on", "off"]);
    expect(Object.keys(certificate.modes)).toEqual(["on", "off"]);
    expect(Object.keys(numericalEvidence.results)).toEqual(["on", "off"]);
    expect(certificate.sourceFiniteEnvelopeManifestSha256)
      .toBe(PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_MANIFEST_SHA256_V1);
    expect(certificate.sourceFiniteEnvelopeNumericalEvidenceSha256)
      .toBe(PHASE_B0_CENTER_TO_B1_BRIDGE_PARENT_B0_NUMERICAL_SHA256_V1);
    expect(certificate.sourceFiniteEnvelopeAllModesPass).toBe(true);
    expect({
      allModesPass: certificate.allModesPass,
      on: {
        modePass: certificate.modes.on.modePass,
        bridgePass:
          numericalEvidence.results.on
            .phaseB0CenterToPhaseB1EtaZeroBridgePass,
        parityPass: certificate.modes.on.parityAudit.sharedPhysicalStateParityPass,
        equilibriumPass:
          certificate.modes.on.destination.equilibriumAudit
            .coupledColdNodeEquilibriumPass,
        broad: certificate.modes.on.broadNegativeClaims,
      },
      off: {
        modePass: certificate.modes.off.modePass,
        bridgePass:
          numericalEvidence.results.off
            .phaseB0CenterToPhaseB1EtaZeroBridgePass,
        parityPass: certificate.modes.off.parityAudit.sharedPhysicalStateParityPass,
        equilibriumPass:
          certificate.modes.off.destination.equilibriumAudit
            .coupledColdNodeEquilibriumPass,
        broad: certificate.modes.off.broadNegativeClaims,
      },
    }).toMatchObject({
      allModesPass: true,
      on: { modePass: true, bridgePass: true, parityPass: true, equilibriumPass: true },
      off: { modePass: true, bridgePass: true, parityPass: true, equilibriumPass: true },
    });
    expect(certificate.contentSha256).toBe(
      computeCanonicalSha256(
        phaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceHashPayloadV1(
          certificate,
        ),
        sha256,
      ),
    );

    for (const modeKey of certificate.slsModes) {
      const mode = certificate.modes[modeKey];
      const result = numericalEvidence.results[modeKey];
      expect(mode.slsMode).toBe(modeKey);
      expect(mode.source.nodeId).toBe("C");
      expect(mode.source.protocolId)
        .toBe(manifest.protocolDefinition.source.protocolId);
      expect(mode.transfer.fieldNames).toEqual(["V_m_S", "y_m"]);
      expect(mode.transfer.noOtherPhaseB0StateTransferred).toBe(true);
      expect(Object.values(mode.upstreamEvidenceAuthentication).every(Boolean))
        .toBe(true);
      expect(mode.source.coordinates).toEqual(mode.transfer.triSegCoordinates);
      expect(mode.destination.upstreamTriSegSeed)
        .toEqual(mode.transfer.triSegCoordinates);
      expect(mode.destination.analyticallyReequilibratedSeedTriSegCoordinates)
        .toEqual(mode.transfer.triSegCoordinates);
      expect(mode.destination.solvedTriSegCoordinates)
        .toEqual(mode.transfer.triSegCoordinates);
      expect(mode.destination.adapterId)
        .toBe(PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID);
      expect(mode.destination.eta).toBe(0);
      expect(mode.destination.unknownCount).toBe(modeKey === "on" ? 37 : 32);
      expect(mode.destination.materialUnknownCount)
        .toBe(modeKey === "on" ? 35 : 30);
      expect(mode.destination.analyticallyReequilibratedSeedUnknownCount)
        .toBe(mode.destination.unknownCount);
      expect(mode.destination.solvedUnknownCount)
        .toBe(mode.destination.unknownCount);
      expect(mode.destination.warmStartImportedOrConsumed).toBe(false);
      expect(mode.destination.bloodVolumeAdjustmentApplied).toBe(false);
      expect(mode.destination.flowAdjustmentApplied).toBe(false);
      expect(mode.destination.calciumWasNewtonUnknown).toBe(false);

      const equilibrium = mode.destination.equilibriumAudit;
      expect(equilibrium.topologyPass).toBe(true);
      expect(equilibrium.materialEquilibriumPass).toBe(true);
      expect(equilibrium.slsEquilibriumPass).toBe(true);
      expect(equilibrium.calciumEquilibriumPass).toBe(true);
      expect(equilibrium.triSegEquilibriumPass).toBe(true);
      expect(equilibrium.prohibitedNumericalOperationsAbsent).toBe(true);
      expect(equilibrium.coupledColdNodeEquilibriumPass).toBe(true);
      expect(equilibrium.scaledResidualInfinityNorm).toBeLessThanOrEqual(
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
          .maximumB1ScaledColdResidualInfinityNorm,
      );

      const parity = mode.parityAudit;
      expect([
        parity.sourceCenterAccepted,
        parity.sourceCenterIsUnique,
        parity.transferredOnlyTriSegCoordinates,
        parity.sourceSeedEncodedExactly,
        parity.destinationEtaIsExactlyZero,
        parity.destinationColdEquilibriumPass,
        parity.timeExact,
        parity.bloodVolumesExact,
        parity.inertialStateFlowsExact,
        parity.solvedTriSegCoordinatesExact,
        parity.wallFiberStrainsExact,
        parity.wallReferenceVolumesExact,
        parity.passiveMaterialEvaluationsExact,
        parity.triSegGeometryExact,
        parity.triSegOracleExact,
        parity.pericardiumExact,
        parity.vascularEvaluationsExact,
        parity.computedFlowsExact,
        parity.phaseA1TissueBundleBindingExact,
        parity.newtonScaleRegistryValuesExact,
        parity.destinationProvenanceBindingsExact,
        parity.sharedFlowAndPressureParameterBindingsExact,
        parity.pinnedEvidenceDigestAndCanonicalCurrentSourceMatched,
        parity.sharedPhysicalStateParityPass,
      ].every(Boolean)).toBe(true);
      expect(parity.maximumAssembledActiveStressAbsoluteDifferencePa)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
            .maximumAssembledActiveStressAbsoluteDifferencePa,
        );
      expect(parity.maximumSlsOverstressAbsoluteDifferencePa)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
            .maximumSlsOverstressAbsoluteDifferencePa,
        );
      expect(parity.maximumTotalWallStressAbsoluteDifferencePa)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
            .maximumTotalWallStressAbsoluteDifferencePa,
        );
      expect(parity.maximumTotalWallTangentAbsoluteDifferencePa)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
            .maximumTotalWallTangentAbsoluteDifferencePa,
        );
      expect(parity.maximumTriSegResidualAbsoluteDifferenceNPerM)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
            .maximumTriSegResidualAbsoluteDifferenceNPerM,
        );
      expect(parity.maximumPressureAbsoluteDifferencePa).toBeLessThanOrEqual(
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
          .maximumPressureAbsoluteDifferencePa,
      );
      expect(parity.maximumAtrialPressureRelativeDifference)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
            .maximumAtrialPressureRelativeDifference,
        );
      expect(
        parity.maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2,
      ).toBeLessThanOrEqual(
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
          .maximumInertialFlowAccelerationAbsoluteDifferenceM3PerSec2,
      );
      expect(parity.maximumRawLandActiveDiagnosticDifferencePa)
        .toBeGreaterThan(1_000);
      expect(parity.rawLandActiveStressDirectParityClaimed).toBe(false);
      expect(parity.landStateCopiedFromPhaseB0).toBe(false);
      expect(parity.slsStateCopiedFromPhaseB0).toBe(false);
      expect(parity.calciumStateCopiedFromPhaseB0).toBe(false);
      expect(result.phaseB0CenterToPhaseB1EtaZeroBridgePass).toBe(true);
      expect(Object.values(mode.broadNegativeClaims)
        .every((value) => value === false)).toBe(true);
      expect(mode.modePass).toBe(true);
    }
  });

  it("opens only the narrow bridge readiness pass", () => {
    expect(Object.values(manifest.implementationClaims).every(Boolean)).toBe(true);
    expect(Object.values(manifest.deferred).every(Boolean)).toBe(true);
    expect(Object.values(manifest.negativeClaims)
      .every((value) => value === false)).toBe(true);
    expect(Object.values(manifest.protocolDefinition.prohibitedOperations)
      .every((value) => value === false)).toBe(true);
    expect(readiness.phaseB0CenterToPhaseB1EtaZeroBridgePass).toBe(true);
    expect(readiness.phaseB0OverallAcceptancePass).toBe(false);
    expect(readiness.acceptedPhaseB1ReferenceBranchPass).toBe(false);
    expect(readiness.phaseB1LandCoupledVolumeEnvelopePass).toBe(false);
    expect(readiness.continuousIntervalRegularityPass).toBe(false);
    expect(readiness.globalRootUniquenessPass).toBe(false);
    expect(readiness.energeticStabilityPass).toBe(false);
    expect(readiness.physiologicalInitializationPass).toBe(false);
    expect(readiness.closedLoopStationarityPass).toBe(false);
    expect(readiness.fullBeatAcceptancePass).toBe(false);
    expect(readiness.physiologicalValidationPass).toBe(false);
    expect(readiness.releaseRuntimePass).toBe(false);
    expect(readiness.modelCoreIntegration).toBe(false);
    expect(readiness.browserRuntimeAdopted).toBe(false);
    expect(readiness.releaseRuntimeReachable).toBe(false);
  });

  it("pins all bridge hashes and rejects canonical-looking copies", () => {
    expect({
      manifest: manifest.contentSha256,
      numericalEvidence: numericalEvidence.certificate.contentSha256,
      readiness: computeCanonicalSha256(readiness, sha256),
    }).toEqual({
      manifest: EXPECTED_BRIDGE_MANIFEST_SHA256,
      numericalEvidence: EXPECTED_BRIDGE_NUMERICAL_EVIDENCE_SHA256,
      readiness: EXPECTED_BRIDGE_READINESS_SHA256,
    });
    const copiedManifest = JSON.parse(canonicalizeJson(manifest));
    expect(() =>
      assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeEvidenceManifestV1(
        copiedManifest,
      )).toThrow(/canonically built/);
    expect(() =>
      assertCanonicalPhaseB0CenterToPhaseB1EtaZeroBridgeNumericalEvidenceV1(
        { ...numericalEvidence },
        manifest,
      )).toThrow(/canonically built/);
  });
});

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
