import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1,
  type PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1,
  PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
  stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  runPhaseB1ProjectSyntheticColdInitializationV1,
  type PhaseB1ProjectSyntheticColdInitializationResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";

const B0_NUMERICAL_EVIDENCE_SHA256 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1";

describe("Phase B0 center to Phase B1 eta-one material-branch stitch", () => {
  let bridges: Readonly<Record<
    "on" | "off",
    PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1
  >>;
  let cold: Readonly<Record<
    "on" | "off",
    PhaseB1ProjectSyntheticColdInitializationResultV1
  >>;

  beforeAll(() => {
    bridges = Object.freeze({
      on: bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
        runPhaseB0TriSegFiniteSupportedEnvelopeV1("on", sha256),
        B0_NUMERICAL_EVIDENCE_SHA256,
        sha256,
      ),
      off: bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
        runPhaseB0TriSegFiniteSupportedEnvelopeV1("off", sha256),
        B0_NUMERICAL_EVIDENCE_SHA256,
        sha256,
      ),
    });
    cold = Object.freeze({
      on: runPhaseB1ProjectSyntheticColdInitializationV1("on", sha256),
      off: runPhaseB1ProjectSyntheticColdInitializationV1("off", sha256),
    });
  }, 180_000);

  it.each(["on", "off"] as const)(
    "splices the SLS-%s bridge node into the canonical eta-one Land branch",
    (mode) => {
      const result =
        stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
          bridges[mode],
          cold[mode],
        );
      expect(result.stitchId).toBe(
        PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_V1_ID,
      );
      expect(result.slsMode).toBe(mode);
      expect(result.etaZeroBoundary).toEqual({
        bridgeAnalyticEndpointEqualsColdAnchorEndpoint: true,
        bridgeSolvedNodeEqualsColdCanonicalEtaZeroNode: true,
        layoutExact: true,
        maximumScaledUnknownDifference: 0,
        noEtaZeroReinitializationOrResolveAppliedByStitch: true,
      });
      expect(result.canonicalMaterialPath.subdivisionCounts)
        .toEqual([1, 2, 4, 8]);
      expect(result.canonicalMaterialPath.canonicalEtaValues)
        .toEqual([0, 1 / 8, 2 / 8, 3 / 8, 4 / 8, 5 / 8, 6 / 8, 7 / 8, 1]);
      expect(result.canonicalMaterialPath.nodeCount).toBe(9);
      expect(result.canonicalMaterialPath.edgeCount).toBe(8);
      expect(result.canonicalMaterialPath.maximumEndpointAgreementScaledInfinityNorm)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
            .endpointAgreementScaledInfinityTolerance,
        );
      expect(result.canonicalMaterialPath.reverseClosureToBridgeEtaZeroScaledInfinityNorm)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
            .reverseClosureScaledInfinityTolerance,
        );
      expect(result.etaOne.node.eta).toBe(1);
      expect(result.etaOne.maximumAssembledToRawLandActiveStressDifferencePa)
        .toBeLessThanOrEqual(
          PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
            .maximumEtaOneAssembledToRawLandActiveStressDifferencePa,
        );
      expect(Object.values(result.etaOne.wallByWall).every((wall) =>
        Number.isFinite(wall.rawLandActiveStressPa)
        && Number.isFinite(wall.assembledActiveStressPa)
        && wall.absoluteDifferencePa
          <= PHASE_B0_CENTER_TO_PHASE_B1_ETA_ONE_MATERIAL_BRANCH_STITCH_POLICY_V1
            .maximumEtaOneAssembledToRawLandActiveStressDifferencePa)).toBe(true);
      expect(result.finiteRootCensus).toEqual({
        etaZeroMatchingRestoringClusterCount: 1,
        etaZeroSeparateSaddleClusterReported: true,
        etaOneMatchingRestoringClusterCount: 1,
        allDeclaredSeedsAttemptedAndConverged: true,
        everyConvergedResultPartitionedExactlyOnce: true,
        allDiscoveredRootsReported: true,
        selectionInputToAcceptedPath: false,
        globalExhaustivenessClaimed: false,
      });
      expect(result.phaseB0CenterConnectedPhaseB1EtaOneMaterialBranchStitchPass)
        .toBe(true);
      expect([
        result.phaseB0OverallAcceptancePass,
        result.acceptedPhaseB1ReferenceBranchPass,
        result.phaseB1LandCoupledFiniteVolumeGraphPass,
        result.phaseB1LandCoupledVolumeEnvelopePass,
        result.continuousEtaIntervalRegularityPass,
        result.continuousVolumeIntervalRegularityPass,
        result.globalRootUniquenessPass,
        result.globalRootExhaustivenessPass,
        result.energeticStabilityPass,
        result.physiologicalInitializationPass,
        result.closedLoopStationarityPass,
        result.fullBeatAcceptancePass,
        result.physiologicalValidationPass,
        result.phaseB1AcceptancePass,
        result.supportedEnvelopePass,
        result.releaseRuntimePass,
        result.pureCoreParentEvidenceAuthenticationClaimed,
        result.modelCoreIntegration,
        result.browserRuntimeAdopted,
        result.releaseRuntimeReachable,
      ].every((claim) => claim === false)).toBe(true);
      expect(result.testOnly).toBe(true);
    },
  );

  it("fails closed for a mode swap, altered eta-zero node, and missing path", () => {
    expect(() => stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
      bridges.on,
      cold.off,
    )).toThrow(/SLS modes differ/);

    const alteredBridge = Object.freeze({
      ...bridges.on,
      destination: Object.freeze({
        ...bridges.on.destination,
        node: Object.freeze({
          ...bridges.on.destination.node,
          unknowns: Object.freeze(bridges.on.destination.node.unknowns.map(
            (value, index) => index === 0 ? value + 1e-12 : value,
          )),
        }),
      }),
    }) as unknown as PhaseB0CenterToPhaseB1EtaZeroBridgeResultV1;
    expect(() => stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
      alteredBridge,
      cold.on,
    )).toThrow(/solved eta-zero nodes differ/);

    const missingPath = Object.freeze({
      ...cold.on,
      canonicalForwardPath: null,
    }) as PhaseB1ProjectSyntheticColdInitializationResultV1;
    expect(() => stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
      bridges.on,
      missingPath,
    )).toThrow(/canonical forward path is absent/);
  });

  it("fails closed for sparse paths, detached endpoints, NaN state, and forged census clusters", () => {
    const forward = cold.on.canonicalForwardPath!;
    const sparseEtaValues = [...forward.requestedEtaValues];
    delete sparseEtaValues[3];
    const sparseForward = Object.freeze({
      ...forward,
      requestedEtaValues: sparseEtaValues,
    }) as typeof forward;
    const sparseCold = replaceCanonicalForward(cold.on, sparseForward);

    const detachedForward = Object.freeze({
      ...forward,
      endpoint: Object.freeze({ ...forward.endpoint }),
    }) as typeof forward;
    const detachedCold = replaceCanonicalForward(cold.on, detachedForward);

    const etaOneNode = forward.endpoint;
    const alteredLvfw = Object.freeze({
      ...etaOneNode.residualEvaluation.closedLoop.wallMechanics.LVFW,
      totalKirchhoffStressPa:
        etaOneNode.residualEvaluation.closedLoop.wallMechanics.LVFW
          .totalKirchhoffStressPa + 1,
    });
    const alteredEtaOneNode = Object.freeze({
      ...etaOneNode,
      residualEvaluation: Object.freeze({
        ...etaOneNode.residualEvaluation,
        closedLoop: Object.freeze({
          ...etaOneNode.residualEvaluation.closedLoop,
          wallMechanics: Object.freeze({
            ...etaOneNode.residualEvaluation.closedLoop.wallMechanics,
            LVFW: alteredLvfw,
          }),
        }),
      }),
    });
    const alteredEtaOneNodes = [...forward.nodes];
    alteredEtaOneNodes[alteredEtaOneNodes.length - 1] = alteredEtaOneNode;
    const alteredEtaOneForward = Object.freeze({
      ...forward,
      nodes: Object.freeze(alteredEtaOneNodes),
      endpoint: alteredEtaOneNode,
    }) as typeof forward;
    const alteredEtaOneCold = replaceCanonicalForward(
      cold.on,
      alteredEtaOneForward,
    );

    const reverse = cold.on.canonicalReversePath;
    if (reverse === null || !reverse.completed) {
      throw new Error("test fixture requires the canonical reverse path");
    }
    const nonFiniteEndpoint = Object.freeze({
      ...reverse.endpoint,
      unknowns: Object.freeze(reverse.endpoint.unknowns.map((value, index) =>
        index === 0 ? Number.NaN : value)),
    });
    const nonFiniteNodes = [...reverse.nodes];
    nonFiniteNodes[nonFiniteNodes.length - 1] = nonFiniteEndpoint;
    const nonFiniteEdges = [...reverse.edgeAudits];
    nonFiniteEdges[nonFiniteEdges.length - 1] = Object.freeze({
      ...nonFiniteEdges[nonFiniteEdges.length - 1],
      acceptedUnknowns: nonFiniteEndpoint.unknowns,
    });
    const nonFiniteCold = Object.freeze({
      ...cold.on,
      canonicalReversePath: Object.freeze({
        ...reverse,
        nodes: Object.freeze(nonFiniteNodes),
        edgeAudits: Object.freeze(nonFiniteEdges),
        endpoint: nonFiniteEndpoint,
      }),
    }) as PhaseB1ProjectSyntheticColdInitializationResultV1;

    const etaZeroCensusIndex = cold.on.rootCensus.findIndex(
      (census) => census.eta === 0,
    );
    const etaZeroCensus = cold.on.rootCensus[etaZeroCensusIndex]!;
    if (etaZeroCensus.clusters.length !== 2) {
      throw new Error("test fixture requires two eta-zero clusters");
    }
    const forgedCensus = Object.freeze({
      ...etaZeroCensus,
      clusters: Object.freeze([
        Object.freeze({
          ...etaZeroCensus.clusters[0],
          memberResultIndices: Object.freeze([0, 2]),
        }),
        Object.freeze({
          ...etaZeroCensus.clusters[1],
          memberResultIndices: Object.freeze([1]),
        }),
      ]),
    });
    const forgedCensuses = [...cold.on.rootCensus];
    forgedCensuses[etaZeroCensusIndex] = forgedCensus;
    const forgedCensusCold = Object.freeze({
      ...cold.on,
      rootCensus: Object.freeze(forgedCensuses),
    }) as PhaseB1ProjectSyntheticColdInitializationResultV1;
    const selectionCensuses = [...cold.on.rootCensus];
    selectionCensuses[etaZeroCensusIndex] = Object.freeze({
      ...etaZeroCensus,
      selectionInputToAcceptedPath: true,
    }) as unknown as typeof etaZeroCensus;
    const selectionCold = Object.freeze({
      ...cold.on,
      rootCensus: Object.freeze(selectionCensuses),
    }) as PhaseB1ProjectSyntheticColdInitializationResultV1;

    for (const hostile of [
      sparseCold,
      detachedCold,
      alteredEtaOneCold,
      nonFiniteCold,
      forgedCensusCold,
      selectionCold,
    ]) {
      expect(() => stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
        bridges.on,
        hostile,
      )).toThrow(/eta-one stitch/);
    }
  });
});

function replaceCanonicalForward(
  cold: PhaseB1ProjectSyntheticColdInitializationResultV1,
  replacement: NonNullable<
    PhaseB1ProjectSyntheticColdInitializationResultV1["canonicalForwardPath"]
  >,
): PhaseB1ProjectSyntheticColdInitializationResultV1 {
  return Object.freeze({
    ...cold,
    forwardPaths: Object.freeze(cold.forwardPaths.map((path) =>
      path.requestedSubdivisionCount === 8 ? replacement : path)),
    canonicalForwardPath: replacement,
  });
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
