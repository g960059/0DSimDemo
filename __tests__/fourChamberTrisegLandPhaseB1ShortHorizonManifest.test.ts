import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalizeJson,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_VERTICAL_SLICE_DESCRIPTOR_SHA256_V1,
  PHASE_B1_VERTICAL_SLICE_MANIFEST_SHA256_V1,
  PHASE_B1_VERTICAL_SLICE_READINESS_SHA256_V1,
  assertCanonicalPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1,
  buildPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1,
  phaseB1ProjectSyntheticShortHorizonEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticShortHorizonEvidenceManifestV1";
import {
  FOUR_CHAMBER_PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_BLOCKERS_V1,
  FOUR_CHAMBER_PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_STATUS_V1,
  buildFourChamberPhaseB1ProjectSyntheticShortHorizonStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticShortHorizonReadinessV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticShortHorizonProtocolV1";
import {
  buildPhaseB1StoredDifferentialLabelsV1,
  type PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const EXPECTED_MANIFEST_SHA256 =
  "f6c71697bcdcefe555dabe69ad9a493d82eebd07c37acd3bf9183ad3bc2fa06c";
const EXPECTED_READINESS_SHA256 =
  "dd4c2b2e45d4002c1b33be742005213349ef928989d957cb46b87ac5877d1259";

describe("four-chamber Phase B1 project-synthetic short-horizon manifest", () => {
  const manifest =
    buildPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1(sha256);
  const readiness =
    buildFourChamberPhaseB1ProjectSyntheticShortHorizonStatusV1(manifest);

  it("pins the parent vertical-slice evidence and every protocol leaf", () => {
    expect(manifest.lineage).toEqual({
      verticalSliceDescriptorSha256:
        PHASE_B1_VERTICAL_SLICE_DESCRIPTOR_SHA256_V1,
      verticalSliceManifestSha256:
        PHASE_B1_VERTICAL_SLICE_MANIFEST_SHA256_V1,
      verticalSliceReadinessSha256:
        PHASE_B1_VERTICAL_SLICE_READINESS_SHA256_V1,
      canonicalUpstreamArtifactsVerified: true,
    });
    expect(manifest.protocolDefinition.policy)
      .toBe(PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1);
    expect(manifest.bindings.protocolDefinitionSha256).toBe(
      sha256(canonicalizeJson(manifest.protocolDefinition)),
    );
    expect(manifest.bindings.scheduleSha256).toBe(
      sha256(canonicalizeJson(manifest.protocolDefinition.schedule)),
    );
    expect(manifest.bindings.policySha256).toBe(
      sha256(canonicalizeJson(manifest.protocolDefinition.policy)),
    );
    expect(manifest.bindings.eventsSha256).toBe(
      sha256(canonicalizeJson(manifest.protocolDefinition.events)),
    );
    expect(manifest.bindings.stateScalesSha256).toBe(
      sha256(canonicalizeJson(manifest.protocolDefinition.stateScales)),
    );
  });

  it("fixes the one-millisecond three-grid exact-event contract", () => {
    expect(manifest.protocolDefinition.schedule).toEqual({
      slsModes: ["on", "off"],
      durationSec: 0.001,
      mainDtSec: 0.00025,
      grids: [
        { dtSec: 0.0005, requestedStepCount: 2, endpointEventStepOneBased: 1 },
        { dtSec: 0.00025, requestedStepCount: 4, endpointEventStepOneBased: 2 },
        { dtSec: 0.000125, requestedStepCount: 8, endpointEventStepOneBased: 4 },
      ],
      endpointEventTimeSec: 0.0005,
      uniformFixedGrid: true,
      hiddenSubdivisionAllowed: false,
    });
    expect(manifest.protocolDefinition.events.events).toEqual([
      PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1.endpointEvent,
    ]);
    expect(manifest.protocolDefinition.events).toMatchObject({
      forcingSide: "pre-jump-left-limit",
      eventCountPerRun: 1,
      eventMustAlignWithEveryGrid: true,
      followingIntervalsStartFromPostJumpEndpoint: true,
    });
  });

  it("hashes the complete 61/56 coordinate endpoint scale descriptors", () => {
    const { on, off } = manifest.protocolDefinition.stateScales;
    expect(on.endpointLabels).toHaveLength(61);
    expect(on.endpointScales).toHaveLength(61);
    expect(on.storedDifferentialStateCount).toBe(59);
    expect(off.endpointLabels).toHaveLength(56);
    expect(off.endpointScales).toHaveLength(56);
    expect(off.storedDifferentialStateCount).toBe(54);
    expect(new Set(on.endpointLabels).size).toBe(61);
    expect(new Set(off.endpointLabels).size).toBe(56);
    expect(on.sourceNewtonScaleRegistryContentSha256)
      .toBe(off.sourceNewtonScaleRegistryContentSha256);
    expect(on.sourceRegistryFixedBeforeRun).toBe(true);
    expect(on.sourceRegistryAdaptiveRescaling).toBe(false);
    for (const mode of ["on", "off"] as const) {
      const scaleDescriptor = manifest.protocolDefinition.stateScales[mode];
      const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        mode,
        sha256,
      );
      expect(scaleDescriptor.endpointLabels).toEqual([
        ...buildPhaseB1StoredDifferentialLabelsV1(mode),
        "algebraic.triseg.V_m_S",
        "algebraic.triseg.y_m",
      ]);
      expect(scaleDescriptor.endpointScales).toEqual(
        expectedEndpointScales(mode, candidate.model.newtonScaleRegistry),
      );
      expect(scaleDescriptor.sourceNewtonScaleRegistryContentSha256).toBe(
        candidate.model.newtonScaleRegistry.registryContentSha256,
      );
    }
  });

  it("pins the manifest/readiness while preserving the narrow claim boundary", () => {
    const payload =
      phaseB1ProjectSyntheticShortHorizonEvidenceManifestHashPayloadV1(
        manifest,
      );
    expect(manifest.contentSha256).toBe(sha256(canonicalizeJson(payload)));
    expect(manifest.contentSha256).toBe(EXPECTED_MANIFEST_SHA256);
    expect(sha256(canonicalizeJson(readiness))).toBe(
      EXPECTED_READINESS_SHA256,
    );
    expect(Object.values(manifest.implementationClaims).every(Boolean))
      .toBe(true);
    expect(Object.values(manifest.deferred).every(Boolean)).toBe(true);
    expect(Object.values(manifest.negativeClaims).every((value) => !value))
      .toBe(true);
    expect(readiness.completionStatus).toBe(
      FOUR_CHAMBER_PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_STATUS_V1,
    );
    expect(readiness.evidenceGates).toMatchObject({
      projectSyntheticShortHorizonImplementationRegressionComplete: true,
      projectSyntheticThreeGridStateOrderRegressionComplete: true,
      phaseB1AcceptedReferenceShortHorizonComplete: false,
      phaseB1GeneralTimestepConvergenceComplete: false,
      phaseB1WholeHeartBackwardEulerEnergyAcceptanceComplete: false,
      phaseB1AcceptanceComplete: false,
      closedLoopReleaseEligible: false,
      clinicalReleaseReady: false,
    });
    expect(readiness.blockers)
      .toBe(FOUR_CHAMBER_PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_BLOCKERS_V1);
    expect(readiness.blockers).toHaveLength(5);
    const { testOnlySidecar, ...runtimeFalse } = readiness.runtimeBoundary;
    expect(testOnlySidecar).toBe(true);
    expect(Object.values(runtimeFalse).every((value) => !value)).toBe(true);
  });

  it("rejects copied manifests before readiness derivation", () => {
    const copied = Object.freeze({ ...manifest }) as typeof manifest;
    expect(() => assertCanonicalPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1(
      copied,
    )).toThrow(/canonically built/);
    expect(() => buildFourChamberPhaseB1ProjectSyntheticShortHorizonStatusV1(
      copied,
    )).toThrow(/canonically built/);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function expectedEndpointScales(
  mode: PhaseB1SlsModeV1,
  registry: ReturnType<
    typeof buildPhaseB1SyntheticEventFreeMonolithicCaseV1
  >["model"]["newtonScaleRegistry"],
): readonly number[] {
  const scales = [
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      registry.unknownScales.bloodVolumeM3[id]),
    ...INERTIAL_FLOW_IDS.map(() =>
      registry.unknownScales.inertialFlowM3PerSec),
  ];
  for (const wallId of WALL_IDS) {
    scales.push(
      ...Array(6).fill(registry.unknownScales.calciumAndPopulation),
      registry.unknownScales.landDistortionByWall[wallId],
      registry.unknownScales.landDistortionByWall[wallId],
    );
    if (mode === "on") scales.push(registry.unknownScales.slsViscousStrain);
  }
  scales.push(
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  );
  return scales;
}
