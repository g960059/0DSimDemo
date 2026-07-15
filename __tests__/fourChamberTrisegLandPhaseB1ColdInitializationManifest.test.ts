import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticColdInitializationReadinessV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  buildPhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  assertCanonicalPhaseB1ProjectSyntheticColdNumericalEvidenceV1,
  buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1,
  phaseB1ProjectSyntheticColdNumericalEvidenceHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationNumericalEvidenceV1";
import {
  PHASE_B1_COLD_B0_STATIC_RESTORING_MANIFEST_SHA256_V1,
  PHASE_B1_COLD_PARENT_VERTICAL_DESCRIPTOR_SHA256_V1,
  PHASE_B1_COLD_PARENT_VERTICAL_MANIFEST_SHA256_V1,
  PHASE_B1_COLD_PARENT_VERTICAL_READINESS_SHA256_V1,
  assertCanonicalPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
  buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1,
  phaseB1ProjectSyntheticColdInitializationEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationEvidenceManifestV1";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import { WALL_IDS } from
  "@/engine/myocardium/fourChamberV1/topology/contracts";

const EXPECTED_COLD_MANIFEST_SHA256 =
  "eacff4e5019d4b7650cd7bba7c3999994ebee674f37093177e572bfef7fa33b7";
const EXPECTED_COLD_READINESS_SHA256 =
  "401b5e5b29b8ed33794d693074f199773e45b142d44a6191ebf3ab7fd956f994";
const EXPECTED_COLD_NUMERICAL_EVIDENCE_SHA256 =
  "1f3066c237c5fb5661a66824968d6f924f243803a2b5f570d2832fc2d28a01d9";

describe("four-chamber Phase B1 cold-initialization evidence manifest", () => {
  it("binds its frozen parent lineage and every protocol leaf", () => {
    const manifest =
      buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(sha256);
    expect(manifest.lineage.verticalSliceDescriptorSha256)
      .toBe(PHASE_B1_COLD_PARENT_VERTICAL_DESCRIPTOR_SHA256_V1);
    expect(manifest.lineage.verticalSliceManifestSha256)
      .toBe(PHASE_B1_COLD_PARENT_VERTICAL_MANIFEST_SHA256_V1);
    expect(manifest.lineage.verticalSliceReadinessSha256)
      .toBe(PHASE_B1_COLD_PARENT_VERTICAL_READINESS_SHA256_V1);
    expect(manifest.lineage.b0StaticRestoringThresholdSemanticsManifestSha256)
      .toBe(PHASE_B1_COLD_B0_STATIC_RESTORING_MANIFEST_SHA256_V1);
    expect(manifest.lineage.shortHorizonEvidenceIsNotANormativeParent).toBe(true);
    expect(manifest.bindings.protocolDefinitionSha256).toBe(
      computeCanonicalSha256(manifest.protocolDefinition, sha256),
    );
    expect(manifest.bindings.fixedInputsSha256).toBe(
      computeCanonicalSha256(manifest.protocolDefinition.fixedInputs, sha256),
    );
    expect(manifest.bindings.topologyBySlsModeSha256).toBe(
      computeCanonicalSha256(manifest.protocolDefinition.topologyBySlsMode, sha256),
    );
    expect(manifest.bindings.policySha256).toBe(
      computeCanonicalSha256(manifest.protocolDefinition.policy, sha256),
    );
    expect(manifest.contentSha256).toBe(
      computeCanonicalSha256(
        phaseB1ProjectSyntheticColdInitializationEvidenceManifestHashPayloadV1(
          manifest,
        ),
        sha256,
      ),
    );
  });

  it("freezes the complete 37/32 unknown and residual topology", () => {
    const protocol =
      buildPhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1(sha256);
    const scaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(sha256);
    const expectedLabels = (mode: "on" | "off") => Object.freeze([
      ...WALL_IDS.flatMap((wallId) => [
        `tissue.${wallId}.patch-0.land.CaTRPN`,
        `tissue.${wallId}.patch-0.land.B`,
        `tissue.${wallId}.patch-0.land.W`,
        `tissue.${wallId}.patch-0.land.S`,
        `tissue.${wallId}.patch-0.land.xiW`,
        `tissue.${wallId}.patch-0.land.xiS`,
      ]),
      ...(mode === "on"
        ? WALL_IDS.map((wallId) => `tissue.${wallId}.patch-0.sls.alphaV`)
        : []),
      "algebraic.triseg.V_m_S",
      "algebraic.triseg.y_m",
    ]);
    const expectedResidualLabels = (mode: "on" | "off") => Object.freeze([
      ...WALL_IDS.flatMap((wallId) => [
        `cold.${wallId}.population.CaTRPN`,
        `cold.${wallId}.population.B`,
        `cold.${wallId}.population.W`,
        `cold.${wallId}.population.S`,
        `cold.${wallId}.distortion.xiW`,
        `cold.${wallId}.distortion.xiS`,
      ]),
      ...(mode === "on"
        ? WALL_IDS.map((wallId) =>
          `cold.${wallId}.sls.alphaVMinusFiberLogStrain`)
        : []),
      "cold.triseg.equilibrium.axial",
      "cold.triseg.equilibrium.radial",
    ]);
    const registry = scaffold.newtonScaleRegistry;
    const expectedUnknownScales = (mode: "on" | "off") => Object.freeze([
      ...WALL_IDS.flatMap((wallId) => [
        registry.unknownScales.calciumAndPopulation,
        registry.unknownScales.calciumAndPopulation,
        registry.unknownScales.calciumAndPopulation,
        registry.unknownScales.calciumAndPopulation,
        registry.unknownScales.landDistortionByWall[wallId],
        registry.unknownScales.landDistortionByWall[wallId],
      ]),
      ...(mode === "on"
        ? WALL_IDS.map(() => registry.unknownScales.slsViscousStrain)
        : []),
      registry.unknownScales.septalMidwallVolumeM3,
      registry.unknownScales.junctionRadiusM,
    ]);
    const expectedResidualScales = (mode: "on" | "off") => Object.freeze([
      ...expectedUnknownScales(mode).slice(0, mode === "on" ? 35 : 30),
      registry.residualScales.publishedTriSegEquilibriumNPerM,
      registry.residualScales.publishedTriSegEquilibriumNPerM,
    ]);
    const expectedLowerBounds = (mode: "on" | "off") => Object.freeze([
      ...WALL_IDS.flatMap(() => [0, 0, 0, 0, null, null]),
      ...(mode === "on" ? WALL_IDS.map(() => null) : []),
      null,
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .strictJunctionRadiusLowerBoundM,
    ]);
    expect(protocol.topologyBySlsMode.on.unknownLabels)
      .toEqual(expectedLabels("on"));
    expect(protocol.topologyBySlsMode.off.unknownLabels)
      .toEqual(expectedLabels("off"));
    expect(protocol.topologyBySlsMode.on.residualLabels)
      .toEqual(expectedResidualLabels("on"));
    expect(protocol.topologyBySlsMode.off.residualLabels)
      .toEqual(expectedResidualLabels("off"));
    expect(protocol.topologyBySlsMode.on.unknownCount).toBe(37);
    expect(protocol.topologyBySlsMode.off.unknownCount).toBe(32);
    expect(protocol.topologyBySlsMode.on.unknownScales)
      .toEqual(expectedUnknownScales("on"));
    expect(protocol.topologyBySlsMode.off.unknownScales)
      .toEqual(expectedUnknownScales("off"));
    expect(protocol.topologyBySlsMode.on.residualScales)
      .toEqual(expectedResidualScales("on"));
    expect(protocol.topologyBySlsMode.off.residualScales)
      .toEqual(expectedResidualScales("off"));
    expect(protocol.topologyBySlsMode.on.strictLowerBounds)
      .toEqual(expectedLowerBounds("on"));
    expect(protocol.topologyBySlsMode.off.strictLowerBounds)
      .toEqual(expectedLowerBounds("off"));
    for (const topology of [
      protocol.topologyBySlsMode.on,
      protocol.topologyBySlsMode.off,
    ]) {
      expect(topology.strictAffineConstraints).toHaveLength(2 * WALL_IDS.length);
      expect(topology.strictAffineConstraints.map((constraint) =>
        constraint.constraintId)).toEqual(WALL_IDS.flatMap((wallId) => [
        `cold.${wallId}.CaTRPN<1`,
        `cold.${wallId}.B+W+S<1`,
      ]));
      expect(topology.strictAffineConstraints.every((constraint) =>
        constraint.lowerBound === -1
        && constraint.coefficients.length === topology.unknownCount)).toBe(true);
    }
    expect(protocol.fixedInputs.anchorTargetTransmuralPressurePa).toBe(1_000);
    expect(Object.keys(protocol.fixedInputs.activeAnchorFiberStressPaByWall))
      .toEqual([...WALL_IDS]);
    expect(Object.values(protocol.fixedInputs.activeAnchorFiberStressPaByWall)
      .every((value) => value > 1_000)).toBe(true);
    expect(protocol.bindings.newtonScaleRegistryContentSha256).toBe(
      scaffold.newtonScaleRegistry.registryContentSha256,
    );
    expect(protocol.policy.subdivisionCounts).toEqual([1, 2, 4, 8]);
    expect(protocol.policy.hiddenHomotopySubdivisionAllowed).toBe(false);
    expect(protocol.policy.pseudoArclengthRescueAllowed).toBe(false);
  });

  it("keeps every deferred and negative claim explicit", () => {
    const manifest =
      buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(sha256);
    expect(Object.values(manifest.implementationClaims).every(Boolean)).toBe(true);
    expect(Object.values(manifest.deferred).every(Boolean)).toBe(true);
    expect(Object.values(manifest.negativeClaims).every((value) => !value)).toBe(true);
    expect(Object.values(manifest.protocolDefinition.prohibitedOperations)
      .every((value) => !value)).toBe(true);
    expect(Object.values(manifest.protocolDefinition.claimBoundary)
      .every((value) => !value)).toBe(true);
    const readiness =
      buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1(
        manifest,
        buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1(manifest, sha256),
      );
    expect(readiness.projectSyntheticColdInitializationImplementationPass)
      .toBe(true);
    expect(readiness.physiologicalColdInitializationPass).toBe(false);
    expect(readiness.acceptedPhaseB1ReferenceBranchPass).toBe(false);
    expect(readiness.phaseB1AcceptancePass).toBe(false);
    expect(readiness.releaseRuntimePass).toBe(false);
  });

  it("pins manifest/readiness hashes and rejects copied manifests", () => {
    const manifest =
      buildPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(sha256);
    const numericalEvidence =
      buildPhaseB1ProjectSyntheticColdNumericalEvidenceV1(manifest, sha256);
    const readiness =
      buildFourChamberPhaseB1ProjectSyntheticColdInitializationStatusV1(
        manifest,
        numericalEvidence,
      );
    expect(numericalEvidence.certificate.allModesPass).toBe(true);
    expect(readiness.bindings.numericalEvidenceSha256)
      .toBe(numericalEvidence.certificate.contentSha256);
    expect(numericalEvidence.certificate.contentSha256).toBe(
      computeCanonicalSha256(
        phaseB1ProjectSyntheticColdNumericalEvidenceHashPayloadV1(
          numericalEvidence.certificate,
        ),
        sha256,
      ),
    );
    expect(numericalEvidence.certificate.contentSha256)
      .toBe(EXPECTED_COLD_NUMERICAL_EVIDENCE_SHA256);
    expect(manifest.contentSha256).toBe(EXPECTED_COLD_MANIFEST_SHA256);
    expect(computeCanonicalSha256(readiness, sha256))
      .toBe(EXPECTED_COLD_READINESS_SHA256);
    const copied = JSON.parse(canonicalizeJson(manifest));
    expect(() =>
      assertCanonicalPhaseB1ProjectSyntheticColdInitializationEvidenceManifestV1(
        copied,
      )).toThrow(/canonically built/);
    expect(() =>
      assertCanonicalPhaseB1ProjectSyntheticColdNumericalEvidenceV1(
        { ...numericalEvidence },
        manifest,
      )).toThrow(/canonically built/);
    expect(canonicalizeJson(manifest.protocolDefinition.policy)).toBe(
      canonicalizeJson(
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
      ),
    );
  });
});

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
