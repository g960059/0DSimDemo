import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1,
  type PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1,
  PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID,
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1,
  runPhaseB1QuiescentPressureReferenceInverseV1,
  type PhaseB1QuiescentPressureReferenceContinuationResultV1,
  type PhaseB1QuiescentPressureReferenceInverseResultV1,
  type PhaseB1QuiescentPressureReferenceNodeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  runPhaseB1ProjectSyntheticColdInitializationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  ALGEBRAIC_FLOW_IDS,
  INERTIAL_FLOW_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const B0_NUMERICAL_EVIDENCE_SHA256 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1";

type Fixture = Readonly<{
  graph: PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1;
}>;

const fixtures = new Map<"on" | "off", Fixture>();

describe("Phase B1 project-synthetic quiescent pressure-reference inverse", () => {
  beforeAll(() => {
    for (const slsMode of ["on", "off"] as const) {
      const bridge = bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
        runPhaseB0TriSegFiniteSupportedEnvelopeV1(slsMode, sha256),
        B0_NUMERICAL_EVIDENCE_SHA256,
        sha256,
      );
      const cold = runPhaseB1ProjectSyntheticColdInitializationV1(
        slsMode,
        sha256,
      );
      const stitch = stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
        bridge,
        cold,
      );
      const graph = runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(
        stitch,
        sha256,
      );
      fixtures.set(slsMode, Object.freeze({
        graph,
        inverse: runPhaseB1QuiescentPressureReferenceInverseV1(
          graph,
          sha256,
        ),
      }));
    }
  }, 1_800_000);

  it.each(["on", "off"] as const)(
    "tracks one independently restarted restoring branch to hydraulic quiescence with SLS-%s",
    (slsMode) => {
      const fixture = requireFixture(slsMode);
      const { graph, inverse } = fixture;
      const policy = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1;
      const center = graph.canonicalNodes.find((audit) => audit.nodeId === "C");
      expect(center).toBeDefined();
      expect(inverse.inverseId)
        .toBe(PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_V1_ID);
      expect(() =>
        assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
          inverse,
        )).not.toThrow();
      expect(inverse.slsMode).toBe(slsMode);
      expect(inverse.sourceGraph).toBe(graph);
      expect(inverse.sourceCanonicalNode).toBe(center?.node);
      expect(inverse.sourceCanonicalNodeObjectIdentity).toBe(true);
      expect(inverse.anchorProvenance.anchorNewtonScaleRegistryContentSha256)
        .toBe(inverse.anchorNewtonScaleRegistryContentSha256);
      expect(Object.values(inverse.anchorProvenance).every((digest) =>
        /^[0-9a-f]{64}$/.test(digest))).toBe(true);
      expect(inverse.correctorBoundary).toEqual(policy.correctorBoundary);
      expect(inverse.correctorBoundary).toEqual({
        method: "block-eliminated-restoring-manifold-damped-newton",
        nonlinearColdBlockElimination: true,
        directFullAugmentedFivePointJacobianSuppliesSchur: true,
        nestedFiniteDifferenceApplied: false,
        reducedTrialColdSeed: "edge-entry-accepted-cold-node",
        fallbackReseedApplied: false,
        monolithicFullNewtonClaimed: false,
      });

      expect(inverse.sourceIdentityAudit).toEqual({
        logReferenceMultipliersExactZero: true,
        coldUnknownsObjectIdentity: true,
        residualExact: true,
        residualRoundoff: true,
        chamberPressuresExact: true,
        fixedBloodVolumesExact: true,
        fixedInertialFlowsExact: true,
        fixedCalciumExact: true,
        pass: true,
      });
      expect(inverse.commonVascularTargetPressurePa).toBe(1000);
      expect(inverse.sourceSchurAudit.pressureRows)
        .toEqual(["LA", "LV", "RA", "RV"]);
      expect(inverse.sourceSchurAudit.logColumns).toEqual([
        "log_LA_reference_cavity_multiplier",
        "log_RA_reference_cavity_multiplier",
        "log_freewall_even_reference_area_multiplier",
        "log_freewall_odd_reference_area_multiplier",
      ]);
      expect(inverse.sourceSchurAudit.coldBlockDimension)
        .toBe(slsMode === "on" ? 37 : 32);
      expectSchurAudit(inverse.sourceSchurAudit);

      expect(inverse.attempts.map((attempt) => attempt.refinementFactor))
        .toEqual([2, 4, 8]);
      expect(
        inverse.attempts.every((attempt) => attempt.completed),
        JSON.stringify(inverse.attempts.map(summarizeAttempt)),
      ).toBe(true);
      expect(inverse.allAttemptsStartFromExactSourceIndependently).toBe(true);
      for (const attempt of inverse.attempts) {
        if (!attempt.completed) continue;
        expect(attempt.nodes[0]).toBe(inverse.attempts[0].nodes[0]);
        expect(attempt.nodes[0].coldUnknowns)
          .toBe(inverse.sourceCanonicalNode.unknowns);
        expect(attempt.nodes[0].logReferenceMultipliers)
          .toEqual([0, 0, 0, 0]);
        expect(attempt.requestedRhoValues).toEqual(attempt.attemptedRhoValues);
        expect(attempt.nodes).toHaveLength(attempt.refinementFactor + 1);
        expect(attempt.edges).toHaveLength(attempt.refinementFactor);
        expect(attempt.edges.every((edge) =>
          edge.correctorBoundary === policy.correctorBoundary)).toBe(true);
        expect(attempt.endpoint.rho).toBe(1);
      }
      const completed = inverse.attempts.map((attempt) => {
        if (!attempt.completed) throw new Error("forward attempt failed");
        return attempt;
      });
      expect(completed[0].endpoint).not.toBe(completed[1].endpoint);
      expect(completed[1].endpoint).not.toBe(completed[2].endpoint);
      expect(completed.map((attempt) => attempt.hardGatePass))
        .toEqual([false, true, true]);
      expect(completed.map((attempt) => attempt.fiftyPercentGuardPass))
        .toEqual([false, false, true]);
      expect(completed[0].maximumAcceptedNodeStepScaledInfinityNorm)
        .toBeGreaterThan(policy.gates.maximumAcceptedNodeStepScaledInfinityNorm);
      expect(completed[1].maximumAcceptedNodeStepScaledInfinityNorm)
        .toBeGreaterThan(
          policy.fiftyPercentGuard.maximumAcceptedNodeStepScaledInfinityNorm,
        );
      expect(completed[2].maximumAcceptedNodeStepScaledInfinityNorm)
        .toBeLessThanOrEqual(
          policy.fiftyPercentGuard.maximumAcceptedNodeStepScaledInfinityNorm,
        );
      expect(completed[2].maximumPredictorCorrectionScaledInfinityNorm)
        .toBeLessThanOrEqual(
          policy.fiftyPercentGuard.maximumPredictorCorrectionScaledInfinityNorm,
        );
      expect(completed[2].maximumAbsoluteFiberLogStrain)
        .toBeLessThanOrEqual(
          policy.fiftyPercentGuard.maximumAbsoluteFiberLogStrain,
        );
      expect(inverse.maximumForwardEndpointAgreementScaledInfinityNorm)
        .toBeLessThanOrEqual(
          policy.gates.maximumForwardEndpointAgreementScaledInfinityNorm,
        );
      expect(inverse.forwardEndpointAgreementPass).toBe(true);
      expect(inverse.selectedAttemptIndex).toBe(2);
      expect(inverse.selectedRefinementFactor).toBe(8);
      expect(inverse.firstHardAndFiftyPercentGuardSelectionPass).toBe(true);

      for (const attempt of completed) {
        expect(attempt.endpoint.logReferenceMultipliers[0])
          .toBeCloseTo(-1.5796210472, 6);
        expect(attempt.endpoint.logReferenceMultipliers[1])
          .toBeCloseTo(-1.5315167193, 6);
        expect(attempt.endpoint.logReferenceMultipliers[2])
          .toBeCloseTo(-0.67997964393, 6);
        expect(attempt.endpoint.logReferenceMultipliers[3])
          .toBeCloseTo(0, 6);
      }

      const selected = completed[2];
      for (const node of selected.nodes) {
        expectNodePressureSchedule(inverse, node);
        expect(node.allFlowsExactlyZero).toBe(true);
        for (const flowId of [...INERTIAL_FLOW_IDS, ...ALGEBRAIC_FLOW_IDS]) {
          expect(node.evaluation.closedLoop.allFlowsM3PerSec[flowId]).toBe(0);
        }
        expect(node.strictFiberLogStrainDomainPass).toBe(true);
        expect(node.maximumAbsoluteFiberLogStrain).toBeLessThan(0.5);
        expect(node.coldRestoringAudit.pass).toBe(true);
        expect(node.coldRestoringAudit.converged).toBe(true);
        expect(node.coldRestoringAudit.coldUnknownsExact).toBe(true);
        expect(node.coldRestoringAudit.effectiveTriSegAccepted).toBe(true);
        expect(node.coldRestoringAudit
          .withinPublishedTaylorTwoPercentTensionErrorDomain).toBe(true);
        expectSchurAudit(node.schurAudit);
      }
      expect(selected.nodes[0].coldRestoringAudit.sourceGraphNodeObjectReused)
        .toBe(true);
      expect(selected.nodes.slice(1).every((node) =>
        !node.coldRestoringAudit.sourceGraphNodeObjectReused)).toBe(true);
      expect(selected.nodes.slice(0, -1).every((node) =>
        node.maximumAbsoluteInertialFlowAccelerationM3PerSec2 > 0)).toBe(true);

      const endpoint = inverse.endpoint;
      expect(endpoint).not.toBeNull();
      if (endpoint === null) return;
      expect(endpoint).toBe(selected.endpoint);
      expect(endpoint.targetChamberPressurePa).toEqual({
        LA: inverse.commonVascularTargetPressurePa,
        LV: inverse.commonVascularTargetPressurePa,
        RA: inverse.commonVascularTargetPressurePa,
        RV: inverse.commonVascularTargetPressurePa,
      });
      expect(endpoint.maximumAbsoluteChamberTargetPressureDifferencePa)
        .toBeLessThanOrEqual(
          policy.gates.maximumAbsoluteDestinationPressureDifferencePa,
        );
      expect(endpoint.maximumAbsoluteInertialFlowAccelerationM3PerSec2)
        .toBeLessThanOrEqual(
          policy.gates.maximumAbsoluteDestinationFlowAccelerationM3PerSec2,
        );
      expect(endpoint.referenceConfiguration
        .triSegReferenceMidwallAreaM2ByWall.SEP).toBe(
          selected.nodes[0].referenceConfiguration
            .triSegReferenceMidwallAreaM2ByWall.SEP,
        );
      expect(inverse.instantaneousHydraulicQuiescencePass).toBe(true);

      const reverse = inverse.factorEightReverse;
      expect(reverse?.completed).toBe(true);
      if (reverse?.completed !== true) return;
      expect(reverse.direction).toBe("reverse");
      expect(reverse.initialization)
        .toBe("canonical-factor-eight-forward-endpoint");
      expect(reverse.nodes[0]).toBe(completed[2].endpoint);
      expect(reverse.endpoint.rho).toBe(0);
      expect(reverse.hardGatePass).toBe(true);
      expect(reverse.fiftyPercentGuardPass).toBe(true);
      expect(inverse.factorEightReverseClosureScaledInfinityNorm)
        .toBeLessThanOrEqual(
          policy.gates.maximumFactorEightReverseClosureScaledInfinityNorm,
        );
      expect(inverse.factorEightReverseClosurePass).toBe(true);

      expect(inverse.failureProbes[0]).toMatchObject({
        injectedAttemptIndex: 0,
        rollbackNodeIsSourceObject: true,
        rollbackNodeIsAcceptedMidpointObject: false,
        rollbackUnknownsObjectIdentity: true,
        pass: true,
      });
      expect(inverse.failureProbes[1]).toMatchObject({
        injectedAttemptIndex: 1,
        rollbackNodeIsSourceObject: false,
        rollbackNodeIsAcceptedMidpointObject: true,
        rollbackUnknownsObjectIdentity: true,
        pass: true,
      });
      expect(inverse.failureProbes.every((probe) =>
        probe.result.completed === false
        && probe.result.reason === "injected-structured-failure")).toBe(true);

      expect(inverse.projectSyntheticQuiescentReferenceInversePass).toBe(true);
      expect([
        inverse.biologicalPathClaimed,
        inverse.physiologicalReferenceAcceptancePass,
        inverse.supportedReferenceEnvelopePass,
        inverse.eventFreeBackwardEulerIdentityHoldPass,
        inverse.closedLoopStationarityPass,
        inverse.fullBeatAcceptancePass,
        inverse.physiologicalValidationPass,
        inverse.phaseB1AcceptancePass,
        inverse.pureCoreParentEvidenceAuthenticationClaimed,
        inverse.modelCoreIntegration,
        inverse.browserRuntimeAdopted,
        inverse.releaseRuntimeReachable,
      ].every((claim) => claim === false)).toBe(true);
      expect(inverse.testOnly).toBe(true);
      expectRecursivelyFrozen(inverse);
    },
  );

  it("fails closed before hashing or computation for widened or mutable graph input", () => {
    const { graph } = requireFixture("on");
    let providerCalls = 0;
    const observingSha = (input: string) => {
      providerCalls += 1;
      return sha256(input);
    };
    const widened = Object.freeze({
      ...graph,
      unexpectedPromotedClaim: true,
    }) as unknown as PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
    expect(() => runPhaseB1QuiescentPressureReferenceInverseV1(
      widened,
      observingSha,
    )).toThrow(/live canonical result/);
    expect(providerCalls).toBe(0);

    const frozenCopy = Object.freeze({ ...graph }) as
      PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
    expect(() => runPhaseB1QuiescentPressureReferenceInverseV1(
      frozenCopy,
      observingSha,
    )).toThrow(/live canonical result/);

    const nestedWidened = Object.freeze({
      ...graph,
      componentIds: Object.freeze({
        ...graph.componentIds,
        unexpectedNestedField: true,
      }),
    }) as unknown as PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
    expect(() => runPhaseB1QuiescentPressureReferenceInverseV1(
      nestedWidened,
      observingSha,
    )).toThrow(/live canonical result/);

    const accessorCopy = { ...graph } as Record<string, unknown>;
    Object.defineProperty(accessorCopy, "graphId", {
      get: () => graph.graphId,
      enumerable: true,
      configurable: true,
    });
    Object.freeze(accessorCopy);
    expect(() => runPhaseB1QuiescentPressureReferenceInverseV1(
      accessorCopy as unknown as PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1,
      observingSha,
    )).toThrow(/live canonical result/);

    const symbolCopy = Object.freeze({
      ...graph,
      [Symbol("unexpected")]: true,
    }) as PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
    expect(() => runPhaseB1QuiescentPressureReferenceInverseV1(
      symbolCopy,
      observingSha,
    )).toThrow(/live canonical result/);

    const mutable = { ...graph } as unknown as
      PhaseB1EtaOneLandCoupledFiniteVolumeGraphResultV1;
    expect(() => runPhaseB1QuiescentPressureReferenceInverseV1(
      mutable,
      observingSha,
    )).toThrow(/live canonical result/);
    expect(providerCalls).toBe(0);
  });

  it("brands only the live passing inverse result and rejects copied shapes", () => {
    const inverse = requireFixture("on").inverse;
    const frozenCopy = Object.freeze({ ...inverse });
    expect(() =>
      assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
        frozenCopy,
      )).toThrow(/live passing result/);

    const nestedWidened = Object.freeze({
      ...inverse,
      anchorProvenance: Object.freeze({
        ...inverse.anchorProvenance,
        unexpectedNestedField: true,
      }),
    });
    expect(() =>
      assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
        nestedWidened,
      )).toThrow(/live passing result/);

    const accessorCopy = { ...inverse } as Record<string, unknown>;
    Object.defineProperty(accessorCopy, "inverseId", {
      get: () => inverse.inverseId,
      enumerable: true,
      configurable: true,
    });
    Object.freeze(accessorCopy);
    expect(() =>
      assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
        accessorCopy,
      )).toThrow(/live passing result/);

    const symbolCopy = Object.freeze({
      ...inverse,
      [Symbol("unexpected")]: true,
    });
    expect(() =>
      assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
        symbolCopy,
      )).toThrow(/live passing result/);
  });
});

function expectNodePressureSchedule(
  inverse: PhaseB1QuiescentPressureReferenceInverseResultV1,
  node: PhaseB1QuiescentPressureReferenceNodeV1,
): void {
  for (const chamberId of ["LA", "LV", "RA", "RV"] as const) {
    const expected = node.rho === 0
      ? inverse.sourceChamberPressurePa[chamberId]
      : node.rho === 1
        ? inverse.commonVascularTargetPressurePa
        : Math.exp(
          (1 - node.rho)
            * Math.log(inverse.sourceChamberPressurePa[chamberId])
          + node.rho * Math.log(inverse.commonVascularTargetPressurePa),
        );
    expect(node.targetChamberPressurePa[chamberId]).toBe(expected);
    expect(Math.abs(
      node.evaluation.closedLoop.chamberAbsolutePressurePa[chamberId]
      - expected,
    )).toBeLessThanOrEqual(
      PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1.gates
        .maximumAbsoluteDestinationPressureDifferencePa,
    );
  }
}

function expectSchurAudit(
  audit: PhaseB1QuiescentPressureReferenceNodeV1["schurAudit"],
): void {
  const policy = PHASE_B1_QUIESCENT_PRESSURE_REFERENCE_INVERSE_POLICY_V1;
  expect(audit.rank).toBe(4);
  expect(audit.independentRank).toBe(4);
  expect(audit.fullRankPass).toBe(true);
  expect(audit.fiftyPercentGuardPass).toBe(true);
  expect(audit.independentAgreementPass).toBe(true);
  expect(audit.effectiveJacobianStencilGatePass).toBe(true);
  expect(audit.independentScaledStep)
    .toBe(policy.independentSchurJacobianScaledStep);
  const expectedDimension = audit.coldBlockDimension + 4;
  expect(audit.primaryScaledStepByColumn).toHaveLength(expectedDimension);
  expect(audit.independentScaledStepByColumn).toHaveLength(expectedDimension);
  expect(audit.primaryStencilByColumn).toHaveLength(expectedDimension);
  expect(audit.independentStencilByColumn).toHaveLength(expectedDimension);
  for (const inventory of [
    audit.primaryScaledStepByColumn,
    audit.independentScaledStepByColumn,
    audit.primaryStencilByColumn,
    audit.independentStencilByColumn,
  ]) {
    expect(Array.from({ length: expectedDimension }, (_, column) => column)
      .every((column) => Object.hasOwn(inventory, column))).toBe(true);
  }
  expect(audit.primaryScaledStepByColumn.every((step) =>
    step > 0 && step <= policy.fullJacobianScaledStep)).toBe(true);
  expect(audit.independentScaledStepByColumn.every((step) =>
    step > 0 && step <= policy.independentSchurJacobianScaledStep)).toBe(true);
  expect(audit.primaryScaledStepByColumn.every((step, column) =>
    !Object.is(step, audit.independentScaledStepByColumn[column])
    && audit.independentScaledStepByColumn[column] > step)).toBe(true);
  expect(audit.maximumIndependentScaledSchurAbsoluteDifference)
    .toBeLessThanOrEqual(
      policy.maximumIndependentScaledSchurAbsoluteDifference,
    );
  expect(audit.jacobiSvdAudit.converged).toBe(true);
  expect(audit.independentJacobiSvdAudit.converged).toBe(true);
  expect(audit.coldBlockLuDiagnosticsByLog).toHaveLength(4);
  expect(audit.independentColdBlockLuDiagnosticsByLog).toHaveLength(4);
  expect(audit.minimumColdBlockRelativePivot)
    .toBeGreaterThanOrEqual(policy.gates.minimumColdBlockRelativePivot);
  expect(audit.independentMinimumColdBlockRelativePivot)
    .toBeGreaterThanOrEqual(policy.gates.minimumColdBlockRelativePivot);
  expect(audit.singularValuesDescending[3])
    .toBeGreaterThanOrEqual(policy.gates.minimumSchurSingularValue);
  expect(audit.relativeMinimumSingularValue)
    .toBeGreaterThanOrEqual(policy.gates.minimumRelativeSchurSingularValue);
  expect(audit.conditionNumber2)
    .toBeLessThanOrEqual(policy.gates.maximumSchurConditionNumber2);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      expect(audit.rawPressurePerLogSchurPa[row][column]).toBe(
        audit.scaledSchur[row][column]
          * policy.pressureResidualScalePa / policy.logUnknownScale,
      );
    }
  }
}

function summarizeAttempt(
  attempt: PhaseB1QuiescentPressureReferenceContinuationResultV1,
) {
  if (attempt.completed === true) {
    return { factor: attempt.refinementFactor, completed: true as const };
  }
  return {
    factor: attempt.refinementFactor,
    completed: false as const,
    reason: attempt.reason,
    message: attempt.message,
    failedAttemptIndex: attempt.failedAttemptIndex,
  };
}

function requireFixture(slsMode: "on" | "off"): Fixture {
  const fixture = fixtures.get(slsMode);
  if (fixture === undefined) throw new Error(`missing SLS-${slsMode} fixture`);
  return fixture;
}

function expectRecursivelyFrozen(
  value: unknown,
  seen = new WeakSet<object>(),
): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  if (Array.isArray(value)) {
    value.forEach((entry) => expectRecursivelyFrozen(entry, seen));
    return;
  }
  Object.values(value).forEach((entry) => expectRecursivelyFrozen(entry, seen));
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
