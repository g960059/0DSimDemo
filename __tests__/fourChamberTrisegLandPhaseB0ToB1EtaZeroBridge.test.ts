import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1,
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1,
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";

const UPSTREAM_NUMERICAL_EVIDENCE_SHA256 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1";

describe("Phase B0 finite-envelope center to Phase B1 eta=0 bridge", () => {
  it.each(["on", "off"] as const)(
    "reconstructs the SLS-%s B1 state while transferring only two TriSeg coordinates",
    (slsMode) => {
      const source = runPhaseB0TriSegFiniteSupportedEnvelopeV1(slsMode, sha256);
      const bridge = bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
        source,
        UPSTREAM_NUMERICAL_EVIDENCE_SHA256,
        sha256,
      );
      expect(bridge.bridgeId).toBe(
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_V1_ID,
      );
      expect(bridge.slsMode).toBe(slsMode);
      expect(bridge.source.nodeId).toBe("C");
      expect(bridge.transfer.fieldNames).toEqual(["V_m_S", "y_m"]);
      expect(bridge.transfer.noOtherPhaseB0StateTransferred).toBe(true);
      expect(bridge.transfer.triSegCoordinates).toEqual({ V_m_S: 0, y_m: 0.03 });
      expect(bridge.destination.upstreamTriSegSeed).toEqual(
        bridge.transfer.triSegCoordinates,
      );
      expect(bridge.destination.eta).toBe(0);
      expect(bridge.destination.equilibriumAudit.coupledColdNodeEquilibriumPass)
        .toBe(true);
      expect(bridge.destination.equilibriumAudit.seedToSolvedScaledInfinityNorm)
        .toBe(0);
      expect(
        bridge.parityAudit.sharedPhysicalStateParityPass,
        JSON.stringify(bridge.parityAudit),
      ).toBe(true);
      expect(bridge.phaseB0CenterToPhaseB1EtaZeroBridgePass).toBe(true);

      const exactFlags = [
        bridge.parityAudit.sourceCenterAccepted,
        bridge.parityAudit.sourceCenterIsUnique,
        bridge.parityAudit.sourceSeedEncodedExactly,
        bridge.parityAudit.destinationEtaIsExactlyZero,
        bridge.parityAudit.destinationColdEquilibriumPass,
        bridge.parityAudit.timeExact,
        bridge.parityAudit.bloodVolumesExact,
        bridge.parityAudit.inertialStateFlowsExact,
        bridge.parityAudit.solvedTriSegCoordinatesExact,
        bridge.parityAudit.wallFiberStrainsExact,
        bridge.parityAudit.wallReferenceVolumesExact,
        bridge.parityAudit.passiveMaterialEvaluationsExact,
        bridge.parityAudit.triSegGeometryExact,
        bridge.parityAudit.triSegOracleExact,
        bridge.parityAudit.pericardiumExact,
        bridge.parityAudit.vascularEvaluationsExact,
        bridge.parityAudit.computedFlowsExact,
        bridge.parityAudit.phaseA1TissueBundleBindingExact,
        bridge.parityAudit.newtonScaleRegistryValuesExact,
        bridge.parityAudit.destinationProvenanceBindingsExact,
        bridge.parityAudit.sharedFlowAndPressureParameterBindingsExact,
        bridge.parityAudit
          .pinnedEvidenceDigestAndCanonicalCurrentSourceMatched,
      ];
      expect(exactFlags.every(Boolean)).toBe(true);
      expect(
        bridge.parityAudit.maximumAssembledActiveStressAbsoluteDifferencePa,
      ).toBeLessThanOrEqual(
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ZERO_BRIDGE_POLICY_V1
          .maximumAssembledActiveStressAbsoluteDifferencePa,
      );
      expect(bridge.parityAudit.maximumRawLandActiveDiagnosticDifferencePa)
        .toBeGreaterThan(1_000);
      expect(bridge.parityAudit.rawLandActiveStressDirectParityClaimed)
        .toBe(false);
      expect(bridge.parityAudit.landStateCopiedFromPhaseB0).toBe(false);
      expect(bridge.parityAudit.slsStateCopiedFromPhaseB0).toBe(false);
      expect(bridge.parityAudit.calciumStateCopiedFromPhaseB0).toBe(false);
      expect(bridge.acceptedPhaseB1ReferenceBranchPass).toBe(false);
      expect(bridge.phaseB1LandCoupledVolumeEnvelopePass).toBe(false);
      expect(bridge.continuousIntervalRegularityPass).toBe(false);
      expect(bridge.globalRootUniquenessPass).toBe(false);
      expect(bridge.energeticStabilityPass).toBe(false);
      expect(bridge.physiologicalInitializationPass).toBe(false);
      expect(bridge.closedLoopStationarityPass).toBe(false);
      expect(bridge.fullBeatAcceptancePass).toBe(false);
      expect(bridge.modelCoreIntegration).toBe(false);
      expect(bridge.browserRuntimeAdopted).toBe(false);
      expect(bridge.releaseRuntimeReachable).toBe(false);
      expect(Object.isFrozen(bridge)).toBe(true);
      expect(Object.isFrozen(bridge.parityAudit)).toBe(true);
    },
  );

  it("rejects malformed provenance and a non-unique center inventory", () => {
    const source = runPhaseB0TriSegFiniteSupportedEnvelopeV1("on", sha256);
    expect(() => bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
      source,
      "not-a-digest",
      sha256,
    )).toThrow(/upstreamFiniteEnvelopeEvidenceSha256/);
    expect(() => bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
      source,
      "0".repeat(64),
      sha256,
    )).toThrow(/pinned canonical B0 numerical evidence/);
    const duplicated = Object.freeze({
      ...source,
      canonicalNodes: Object.freeze([
        ...source.canonicalNodes,
        source.canonicalNodes.find((node) => node.nodeId === "C")!,
      ]),
    });
    expect(() => bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
      duplicated,
      UPSTREAM_NUMERICAL_EVIDENCE_SHA256,
      sha256,
    )).toThrow(/exactly one canonical/);

    const canonicalCenterIndex = source.canonicalNodes.findIndex(
      (node) => node.nodeId === "C",
    );
    const canonicalCenter = source.canonicalNodes[canonicalCenterIndex]!;
    const forged = Object.freeze({
      ...source,
      canonicalNodes: Object.freeze(source.canonicalNodes.map((node, index) =>
        index === canonicalCenterIndex
          ? Object.freeze({
            ...canonicalCenter,
            root: Object.freeze({
              ...canonicalCenter.root,
              rootId: "forged-root-id",
              algorithmicJacobianId: "forged-jacobian-id",
            }),
          })
          : node)),
    }) as unknown as typeof source;
    expect(() => bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
      forged,
      UPSTREAM_NUMERICAL_EVIDENCE_SHA256,
      sha256,
    )).toThrow(/not the canonical Phase B0 finite-envelope mode result/);
  });
});

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
