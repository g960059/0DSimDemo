import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1,
  ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1,
  ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1,
  ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1,
  ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1,
  ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1,
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
  phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestHashPayloadV1,
  type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1";
import {
  assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1,
  assertDeepFrozenPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1,
  buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1,
  phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1,
  type PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1";
import {
  buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchReadinessV1";

const EXPECTED_MANIFEST_SHA256 =
  "1d1459076227bfd16f924bb19d8f3fa9e5a59408480fb7d644369858d5ef8edd";
const EXPECTED_NUMERICAL_SHA256 =
  "6759092ba01aa58cda41ef5f529f67bdeb7ebc3ee6cdd7afeba61c519af5adef";
const EXPECTED_READINESS_SHA256 =
  "b9dfa93528f0431659d53b8c5998e490093a6236c636570cb21f4e729b90336a";

describe("four-chamber B0-center to B1 eta-one material-branch stitch evidence", () => {
  let manifest:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1;
  let numerical:
    PhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceBundleV1;
  let readiness: ReturnType<
    typeof buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1
  >;

  beforeAll(() => {
    manifest =
      buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
        sha256,
      );
    numerical =
      buildPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
        manifest,
        sha256,
      );
    readiness =
      buildFourChamberPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchStatusV1(
        manifest,
        numerical,
      );
  }, 300_000);

  it("binds both complete direct-parent lineages and the stitch protocol", () => {
    expect(manifest.lineage).toEqual({
      bridgeManifestSha256:
        ETA_ONE_STITCH_PARENT_BRIDGE_MANIFEST_SHA256_V1,
      bridgeNumericalEvidenceSha256:
        ETA_ONE_STITCH_PARENT_BRIDGE_NUMERICAL_SHA256_V1,
      bridgeReadinessSha256:
        ETA_ONE_STITCH_PARENT_BRIDGE_READINESS_SHA256_V1,
      coldManifestSha256: ETA_ONE_STITCH_PARENT_COLD_MANIFEST_SHA256_V1,
      coldNumericalEvidenceSha256:
        ETA_ONE_STITCH_PARENT_COLD_NUMERICAL_SHA256_V1,
      coldReadinessSha256: ETA_ONE_STITCH_PARENT_COLD_READINESS_SHA256_V1,
      canonicalParentManifestsVerifiedLive: true,
      parentNumericalAndReadinessArtifactsRebuiltAndPinnedByNumericalEvidence:
        true,
    });
    const protocol = manifest.protocolDefinition;
    expect(protocol.slsModes).toEqual(["on", "off"]);
    expect(protocol.etaZeroBoundary.maximumScaledUnknownDifference).toBe(0);
    expect(protocol.canonicalMaterialPath.canonicalEtaValues).toEqual([
      0, 1 / 8, 2 / 8, 3 / 8, 4 / 8, 5 / 8, 6 / 8, 7 / 8, 1,
    ]);
    expect(protocol.etaOneConstitutiveBoundary.maximumAbsoluteDifferencePa)
      .toBe(1e-9);
    expect(Object.values(protocol.prohibitedOperations)
      .every((value) => value === false)).toBe(true);
    expect(Object.values(protocol.claimBoundary)
      .every((value) => value === false)).toBe(true);
    expect(manifest.bindings.protocolDefinitionSha256).toBe(
      computeCanonicalSha256(protocol, sha256),
    );
    expect(manifest.contentSha256).toBe(computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestHashPayloadV1(
        manifest,
      ),
      sha256,
    ));
  });

  it("hash-binds canonical parents, eta-zero boundary, paths, eta-one Land assembly, and finite census in both modes", () => {
    const certificate = numerical.certificate;
    expect(certificate.slsModes).toEqual(["on", "off"]);
    expect(Object.keys(certificate.modes)).toEqual(["on", "off"]);
    expect(Object.keys(numerical.results)).toEqual(["on", "off"]);
    expect(Object.keys(numerical.bridgeEvidence.results)).toEqual(["on", "off"]);
    expect(Object.keys(numerical.coldEvidence.results)).toEqual(["on", "off"]);
    expect(Object.values(certificate.directParentAuthentication.bridge)
      .filter((value) => typeof value === "boolean").every(Boolean)).toBe(true);
    expect(Object.values(certificate.directParentAuthentication.cold)
      .filter((value) => typeof value === "boolean").every(Boolean)).toBe(true);
    expect(certificate.directParentAuthentication.allDirectParentsAuthenticated)
      .toBe(true);
    expect(certificate.contentSha256).toBe(computeCanonicalSha256(
      phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceHashPayloadV1(
        certificate,
      ),
      sha256,
    ));

    for (const modeKey of certificate.slsModes) {
      const mode = certificate.modes[modeKey];
      expect(mode.slsMode).toBe(modeKey);
      expect(mode.sourceModeResultsTakenFromCanonicalBundles).toBe(true);
      expect(mode.etaZeroBoundary.projectionHashesExact).toBe(true);
      expect(mode.etaZeroBoundary.maximumScaledUnknownDifference).toBe(0);
      expect(mode.canonicalMaterialPath.forwardPaths.map(
        (path) => path.requestedSubdivisionCount,
      )).toEqual([1, 2, 4, 8]);
      expect(mode.canonicalMaterialPath.forwardPaths.every((path) =>
        path.nodes.length === path.requestedSubdivisionCount + 1
        && path.edges.length === path.requestedSubdivisionCount)).toBe(true);
      expect(mode.canonicalMaterialPath.canonicalForward.requestedEtaValues)
        .toEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
            .canonicalEtaValues,
        );
      expect(mode.canonicalMaterialPath.canonicalForward.nodes).toHaveLength(9);
      expect(mode.canonicalMaterialPath.canonicalForward.edges).toHaveLength(8);
      expect(mode.canonicalMaterialPath.canonicalReverse.requestedEtaValues)
        .toEqual([1, 7 / 8, 6 / 8, 5 / 8, 4 / 8, 3 / 8, 2 / 8, 1 / 8, 0]);
      expect(mode.canonicalMaterialPath.everyNodeAccepted).toBe(true);
      expect(mode.canonicalMaterialPath
        .fixedTimeVolumesFlowsAndCalciumAcrossPath).toBe(true);
      expect(mode.canonicalMaterialPath.prohibitedOperationsAbsent).toBe(true);
      expect(mode.etaOne.eta).toBe(1);
      expect(mode.etaOne.reportedWallAuditExact).toBe(true);
      expect(mode.etaOne.reportedMaximumExact).toBe(true);
      expect(mode.etaOne.maximumAssembledToRawLandActiveStressDifferencePa)
        .toBeLessThanOrEqual(1e-9);
      expect(Object.values(mode.etaOne.wallByWall)
        .every((wall) => wall.absoluteDifferencePa <= 1e-9)).toBe(true);
      expect(mode.finiteRootCensus.censuses.map((census) => census.eta))
        .toEqual([0, 1]);
      expect(mode.finiteRootCensus.censusBoundaryPass).toBe(true);
      expect(mode.finiteRootCensus.everyConvergedResultPartitionedExactlyOnce)
        .toBe(true);
      expect(mode.finiteRootCensus.censuses.every((census) =>
        census.allMemberClassificationsAndDistancesPass)).toBe(true);
      expect(mode.finiteRootCensus.selectionInputToAcceptedPath).toBe(false);
      expect(mode.finiteRootCensus.globalExhaustivenessClaimed).toBe(false);
      expect(Object.values(mode.broadNegativeClaims)
        .every((value) => value === false)).toBe(true);
      expect(mode.testOnly).toBe(true);
      expect(mode.modePass).toBe(true);
      expect(canonicalizeJson(mode)).not.toContain("undefined");
    }
    expect(certificate.allModesPass).toBe(true);
  });

  it("opens only the narrow stitch readiness pass", () => {
    expect(readiness.phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass)
      .toBe(true);
    expect(readiness.phaseB0OverallAcceptancePass).toBe(false);
    expect(readiness.acceptedPhaseB1ReferenceBranchPass).toBe(false);
    expect(readiness.phaseB1LandCoupledFiniteVolumeGraphPass).toBe(false);
    expect(readiness.phaseB1LandCoupledVolumeEnvelopePass).toBe(false);
    expect(readiness.continuousEtaIntervalRegularityPass).toBe(false);
    expect(readiness.continuousVolumeIntervalRegularityPass).toBe(false);
    expect(readiness.globalRootUniquenessPass).toBe(false);
    expect(readiness.globalRootExhaustivenessPass).toBe(false);
    expect(readiness.energeticStabilityPass).toBe(false);
    expect(readiness.physiologicalInitializationPass).toBe(false);
    expect(readiness.closedLoopStationarityPass).toBe(false);
    expect(readiness.fullBeatAcceptancePass).toBe(false);
    expect(readiness.physiologicalValidationPass).toBe(false);
    expect(readiness.phaseB1AcceptancePass).toBe(false);
    expect(readiness.supportedEnvelopePass).toBe(false);
    expect(readiness.releaseRuntimePass).toBe(false);
    expect(readiness.pureCoreParentEvidenceAuthenticationClaimed).toBe(false);
    expect(readiness.modelCoreIntegration).toBe(false);
    expect(readiness.browserRuntimeAdopted).toBe(false);
    expect(readiness.releaseRuntimeReachable).toBe(false);
    expect(readiness.testOnly).toBe(true);
  });

  it("pins all stitch hashes and rejects canonical-looking copies", () => {
    expect({
      manifest: manifest.contentSha256,
      numerical: numerical.certificate.contentSha256,
      readiness: computeCanonicalSha256(readiness, sha256),
    }).toEqual({
      manifest: EXPECTED_MANIFEST_SHA256,
      numerical: EXPECTED_NUMERICAL_SHA256,
      readiness: EXPECTED_READINESS_SHA256,
    });
    expect(() =>
      assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchEvidenceManifestV1(
        JSON.parse(canonicalizeJson(manifest)),
      )).toThrow(/canonically built/);
    expect(() =>
      assertCanonicalPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
        { ...numerical },
        manifest,
      )).toThrow(/canonically built/);
    expect(
      assertDeepFrozenPhaseB0CenterToPhaseB1EtaOneMaterialBranchStitchNumericalEvidenceV1(
        numerical,
      ),
    ).toBe(numerical);
    const sourceLandOutput = numerical.results.on.etaOne.node
      .residualEvaluation.wallMaterialByWall.LVFW.sourceLandOutput;
    expect(Object.isFrozen(sourceLandOutput)).toBe(true);
    expect(Object.isFrozen(sourceLandOutput.health)).toBe(true);
    expect(() => Object.defineProperty(sourceLandOutput.health, "finite", {
      value: false,
    })).toThrow(TypeError);
    expect(sourceLandOutput.health.finite).toBe(true);
  });
});

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
