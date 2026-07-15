import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1,
  runPhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1,
  runPhaseB1ColdEtaOneFixedVolumeLoadContinuationV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1,
  type PhaseB1ColdEtaOneFixedVolumeLoadNodeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ColdEtaOneFixedVolumeLoadContinuationV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
  createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  runPhaseB1ProjectSyntheticColdInitializationV1,
  type PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  type BloodCompartmentId,
  type FourChamberWallId,
  type InertialFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("Phase B1 eta-one fixed-volume load continuation", () => {
  it.each(["on", "off"] as const)(
    "tracks the exact closed volume ledger forward and reverse in SLS-%s topology",
    (slsMode) => {
      const cold = runPhaseB1ProjectSyntheticColdInitializationV1(slsMode, sha256);
      const canonical = cold.canonicalForwardPath;
      expect(canonical?.completed).toBe(true);
      if (canonical?.completed !== true) {
        throw new Error(`canonical SLS-${slsMode} cold path did not complete`);
      }
      const center = requireEtaOneNode(canonical.endpoint);
      const session = createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1(
        slsMode,
        sha256,
      );
      const centerVolumes = session.anchorFixedInputs.bloodVolumesM3;
      const eastVolumes = closedLedgerVolumes(centerVolumes, 1.01, 1);
      const forwardInput = (refinementFactor: 2 | 4 | 8) => Object.freeze({
        session,
        sourceNode: center,
        sourceBloodVolumesM3: centerVolumes,
        destinationBloodVolumesM3: eastVolumes,
        direction: "forward" as const,
        refinementFactor,
      });

      expect(Object.isFrozen(
        PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1,
      )).toBe(true);
      expect(
        PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_LOAD_CONTINUATION_POLICY_V1,
      ).toMatchObject({
        refinementFactors: [2, 4, 8],
        coarseLoadDerivativeStep: 2 ** -10,
        fineLoadDerivativeStep: 2 ** -12,
        maximumCoarseFineScaledTangentDisagreement: 1e-5,
        maximumAcceptedNodeStepScaledInfinityNorm: 0.25,
        maximumPredictorCorrectionScaledInfinityNorm: 0.25,
        previousNodeUsedAs: "tangent-predictor-base-only",
        hiddenSubdivisionAllowed: false,
        pseudoArclengthAllowed: false,
        projectionAllowed: false,
        clippingAllowed: false,
        rootRankingAllowed: false,
      });

      const forward = ([2, 4, 8] as const).map((refinementFactor) => {
        const result = requireCompleted(
          runPhaseB1ColdEtaOneFixedVolumeLoadContinuationV1(
            forwardInput(refinementFactor),
          ),
          `SLS-${slsMode} C-to-E factor-${refinementFactor}`,
        );
        expect(result.requestedSValues).toEqual(Array.from(
          { length: refinementFactor + 1 },
          (_, index) => index / refinementFactor,
        ));
        expect(result.attemptedSValues).toEqual(result.requestedSValues);
        expect(result.nodes).toHaveLength(refinementFactor + 1);
        expect(result.edgeAudits).toHaveLength(refinementFactor);
        expectSuccessBoundary(result);
        for (const [index, node] of result.nodes.entries()) {
          expectNodeAtS(
            node,
            centerVolumes,
            eastVolumes,
            index / refinementFactor,
            session.anchorFixedInputs.inertialFlowsM3PerSec,
            session.anchorFixedInputs.calciumByWall,
          );
        }
        for (const [edgeIndex, edge] of result.edgeAudits.entries()) {
          expect(edge.edgeIndex).toBe(edgeIndex);
          expect(edge.edgePass).toBe(true);
          expect(edge.tangentAudit.success).toBe(true);
          expect(edge.tangentAudit.coarseStep).toBe(2 ** -10);
          expect(edge.tangentAudit.fineStep).toBe(2 ** -12);
          expect(edge.tangentAudit.coarseStencil).toBe(
            edgeIndex === 0 ? "forward-five-point" : "centered-five-point",
          );
          expect(edge.tangentAudit.fineStencil)
            .toBe(edge.tangentAudit.coarseStencil);
          expect(edge.tangentAudit.coarseScaledUnknownTangentByS)
            .toHaveLength(session.layout.unknownCount);
          expect(edge.tangentAudit.fineScaledUnknownTangentByS)
            .toHaveLength(session.layout.unknownCount);
          expect(edge.tangentAudit.coarseFineScaledTangentDisagreement)
            .toBeLessThanOrEqual(1e-5);
          expect(edge.acceptedNodeStepScaledInfinityNorm)
            .toBeLessThanOrEqual(0.25);
          expect(edge.predictorCorrectionScaledInfinityNorm)
            .toBeLessThanOrEqual(0.25);
          expect(edge.acceptedNode).toBe(result.nodes[edgeIndex + 1]);
        }
        return result;
      });

      for (let left = 0; left < forward.length; left += 1) {
        for (let right = left + 1; right < forward.length; right += 1) {
          expect(scaledInfinityDistance(
            forward[left].endpoint.node.unknowns,
            forward[right].endpoint.node.unknowns,
            session.layout.unknownScales,
          )).toBeLessThanOrEqual(1e-6);
        }
      }

      const reverseInput = Object.freeze({
        session,
        sourceNode: forward[0].endpoint.node,
        sourceBloodVolumesM3: eastVolumes,
        destinationBloodVolumesM3: centerVolumes,
        direction: "reverse" as const,
        refinementFactor: 2 as const,
      });
      const reverse = requireCompleted(
        runPhaseB1ColdEtaOneFixedVolumeLoadContinuationV1(reverseInput),
        `SLS-${slsMode} E-to-C factor-2`,
      );
      expect(reverse.requestedSValues).toEqual([1, 0.5, 0]);
      expect(reverse.attemptedSValues).toEqual(reverse.requestedSValues);
      expect(reverse.edgeAudits[0].tangentAudit.coarseStencil)
        .toBe("backward-five-point");
      expect(reverse.edgeAudits[0].tangentAudit.fineStencil)
        .toBe("backward-five-point");
      expect(reverse.edgeAudits[1].tangentAudit.coarseStencil)
        .toBe("centered-five-point");
      expectSuccessBoundary(reverse);
      for (const node of reverse.nodes) {
        expectNodeAtS(
          node,
          centerVolumes,
          eastVolumes,
          node.s,
          session.anchorFixedInputs.inertialFlowsM3PerSec,
          session.anchorFixedInputs.calciumByWall,
        );
      }
      expect(scaledInfinityDistance(
        reverse.endpoint.node.unknowns,
        center.unknowns,
        session.layout.unknownScales,
      )).toBeLessThanOrEqual(1e-6);

      for (const injectedAttemptIndex of [0, 1] as const) {
        const probe =
          runPhaseB1ColdEtaOneFixedVolumeLoadContinuationFailureProbeV1(
            forwardInput(2),
            injectedAttemptIndex,
          );
        const expectedRollbackS = injectedAttemptIndex === 0 ? 0 : 0.5;
        expect(Object.isFrozen(probe)).toBe(true);
        expect(probe.injectedAttemptIndex).toBe(injectedAttemptIndex);
        expect(probe.result.completed).toBe(false);
        expect(probe.result.reason).toBe("injected-structured-failure");
        expect(probe.result.acceptedNodes)
          .toHaveLength(injectedAttemptIndex + 1);
        expect(probe.result.edgeAudits).toHaveLength(injectedAttemptIndex);
        expect(probe.result.failedAttempt.attemptIndex)
          .toBe(injectedAttemptIndex);
        expect(probe.result.failedAttempt.fromS).toBe(expectedRollbackS);
        expect(probe.result.failedAttempt.toS)
          .toBe(injectedAttemptIndex === 0 ? 0.5 : 1);
        expect(probe.result.failedAttempt.correctorResult).toBeNull();
        expect(probe.result.failedAttempt.predictorUnknowns).not.toBeNull();
        expect(probe.result.rollbackNode)
          .toBe(probe.result.acceptedNodes[injectedAttemptIndex]);
        expect(probe.result.rollbackUnknowns)
          .toBe(probe.result.rollbackNode.node.unknowns);
        expect(probe.result.rollbackBloodVolumesM3)
          .toBe(probe.result.rollbackNode.bloodVolumesM3);
        if (injectedAttemptIndex === 0) {
          expect(probe.result.rollbackNode.node).toBe(center);
        }
        expect(Object.isFrozen(probe.result)).toBe(true);
        expect(Object.isFrozen(probe.result.acceptedNodes)).toBe(true);
        expect(Object.isFrozen(probe.result.edgeAudits)).toBe(true);
        expect(Object.isFrozen(probe.result.failedAttempt)).toBe(true);
        expect(Object.isFrozen(probe.result.rollbackNode)).toBe(true);
        expect(Object.isFrozen(probe.result.rollbackUnknowns)).toBe(true);
        expect(Object.isFrozen(probe.result.rollbackBloodVolumesM3)).toBe(true);
        expect(() => (probe.result.acceptedNodes as unknown as unknown[])
          .push(probe.result.rollbackNode)).toThrow(TypeError);
        expect(() => (probe.result.rollbackUnknowns as number[]).push(0))
          .toThrow(TypeError);
        expect(() => Object.assign(
          probe.result.rollbackBloodVolumesM3,
          { LV: 0 },
        )).toThrow(TypeError);
        expectFailureBoundary(probe.result);
        expectNodeAtS(
          probe.result.rollbackNode,
          centerVolumes,
          eastVolumes,
          expectedRollbackS,
          session.anchorFixedInputs.inertialFlowsM3PerSec,
          session.anchorFixedInputs.calciumByWall,
        );
      }

      const validInput = forwardInput(2);
      expectInvalidPublicInput({ ...validInput, EXTRA: true }, /exactly/);
      const symbolInput = { ...validInput };
      Object.defineProperty(symbolInput, Symbol("extra"), {
        value: true,
        enumerable: true,
      });
      expectInvalidPublicInput(symbolInput, /exactly/);
      const accessorInput = { ...validInput };
      Object.defineProperty(accessorInput, "direction", {
        enumerable: true,
        configurable: true,
        get: () => "forward",
      });
      expectInvalidPublicInput(accessorInput, /enumerable data property/);
      expectInvalidPublicInput({
        ...validInput,
        sourceBloodVolumesM3: new Float64Array(8),
      }, /plain object/);
      const missingVolume = { ...centerVolumes } as Partial<
        Record<BloodCompartmentId, number>
      >;
      delete missingVolume.PV;
      expectInvalidPublicInput({
        ...validInput,
        sourceBloodVolumesM3: missingVolume,
      }, /exactly/);
      expectInvalidPublicInput({
        ...validInput,
        destinationBloodVolumesM3: { ...eastVolumes, LV: Number.NaN },
      }, /exact closed/);
      expectInvalidPublicInput({ ...validInput, refinementFactor: 3 }, /2, 4, or 8/);
    },
    300_000,
  );
});

function requireEtaOneNode(
  node: Readonly<{ eta: number }>,
): PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 {
  if (node.eta !== 1) throw new Error("canonical endpoint was not eta one");
  return node as PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1;
}

function requireCompleted(
  result: PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
  label: string,
): PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1 {
  const diagnostic = result.completed === false
    ? {
      label,
      reason: result.reason,
      message: result.message,
      failedAttempt: result.failedAttempt,
    }
    : { label };
  expect(result.completed, JSON.stringify(diagnostic)).toBe(true);
  if (result.completed === false) {
    throw new Error(`${label} did not complete: ${result.reason}`);
  }
  return result;
}

function expectSuccessBoundary(
  result: PhaseB1ColdEtaOneFixedVolumeLoadContinuationSuccessV1,
): void {
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.requestedSValues)).toBe(true);
  expect(Object.isFrozen(result.attemptedSValues)).toBe(true);
  expect(Object.isFrozen(result.nodes)).toBe(true);
  expect(Object.isFrozen(result.edgeAudits)).toBe(true);
  expect(Object.isFrozen(result.endpoint)).toBe(true);
  expect(() => (result.nodes as unknown as unknown[]).push(result.endpoint))
    .toThrow(TypeError);
  expect(() => (result.edgeAudits as unknown as unknown[]).pop())
    .toThrow(TypeError);
  expect(() => Object.assign(result.endpoint.bloodVolumesM3, { LV: 0 }))
    .toThrow(TypeError);
  expect(result.previousNodeUsedAs).toBe("tangent-predictor-base-only");
  expect(result.branchIdentityEstablished).toBe(true);
  expect(result.hiddenSubdivisionApplied).toBe(false);
  expect(result.pseudoArclengthApplied).toBe(false);
  expect(result.projectionApplied).toBe(false);
  expect(result.clippingApplied).toBe(false);
  expect(result.nearestRootSelectionApplied).toBe(false);
  expect(result.minimumResidualRootSelectionApplied).toBe(false);
  expect(result.maximumJunctionRadiusRootSelectionApplied).toBe(false);
  expect(result.maximumCoarseFineScaledTangentDisagreement)
    .toBeLessThanOrEqual(1e-5);
  expect(result.maximumAcceptedNodeStepScaledInfinityNorm)
    .toBeLessThanOrEqual(0.25);
  expect(result.maximumPredictorCorrectionScaledInfinityNorm)
    .toBeLessThanOrEqual(0.25);
}

function expectInvalidPublicInput(value: unknown, message: RegExp): void {
  expect(() => runPhaseB1ColdEtaOneFixedVolumeLoadContinuationV1(
    value as Parameters<
      typeof runPhaseB1ColdEtaOneFixedVolumeLoadContinuationV1
    >[0],
  )).toThrow(message);
}

function expectFailureBoundary(
  result: Extract<
    PhaseB1ColdEtaOneFixedVolumeLoadContinuationResultV1,
    { completed: false }
  >,
): void {
  expect(result.branchIdentityEstablished).toBe(false);
  expect(result.branchIdentity).toBe("not-established");
  expect(result.previousNodeUsedAs).toBe("tangent-predictor-base-only");
  expect(result.hiddenSubdivisionApplied).toBe(false);
  expect(result.pseudoArclengthApplied).toBe(false);
  expect(result.projectionApplied).toBe(false);
  expect(result.clippingApplied).toBe(false);
  expect(result.nearestRootSelectionApplied).toBe(false);
  expect(result.minimumResidualRootSelectionApplied).toBe(false);
  expect(result.maximumJunctionRadiusRootSelectionApplied).toBe(false);
}

function expectNodeAtS(
  entry: PhaseB1ColdEtaOneFixedVolumeLoadNodeV1,
  center: Readonly<Record<BloodCompartmentId, number>>,
  east: Readonly<Record<BloodCompartmentId, number>>,
  s: number,
  inertialFlows: Readonly<Record<InertialFlowId, number>>,
  calciumByWall: Readonly<
    Record<FourChamberWallId, Readonly<{ r: number; d: number }>>
  >,
): void {
  const expected = interpolatedClosedLedgerVolumes(center, east, s);
  expect(entry.s).toBe(s);
  expect(entry.bloodVolumesM3).toEqual(expected);
  expect(entry.node.endpoint.differentialState.bloodVolumesM3).toEqual(expected);
  expect(entry.node.endpoint.timeSec).toBe(0);
  expect(entry.node.endpoint.differentialState.inertialFlowsM3PerSec)
    .toEqual(inertialFlows);
  expect(entry.node.endpoint.differentialState.calciumByWall)
    .toEqual(calciumByWall);
  expect(entry.node.eta).toBe(1);
  expect(entry.node.effectiveTriSegAudit.accepted).toBe(true);
  expect(entry.node.effectiveTriSegAudit.classification)
    .toBe("robust-restoring");
  expect(entry.node.scaledResidualInfinityNorm).toBeLessThanOrEqual(
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
      .maximumScaledColdResidualInfinityNorm,
  );
  expect(entry.node.scaledUpdateInfinityNorm).toBeLessThanOrEqual(
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
      .maximumScaledColdUpdateInfinityNorm,
  );
  expect(entry.node.minimumLandSimplexMargin).toBeGreaterThan(0);
  expect(entry.node.maximumLocalMaterialResidualInfinityNorm)
    .toBeLessThanOrEqual(
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .maximumLocalMaterialResidualInfinityNorm,
    );
  expect(entry.node.projectionApplied).toBe(false);
  expect(entry.node.clippingApplied).toBe(false);
  expect(entry.node.fallbackApplied).toBe(false);
  expect(entry.node.residualEvaluation.projectionApplied).toBe(false);
  expect(entry.node.residualEvaluation.clippingApplied).toBe(false);
}

function closedLedgerVolumes(
  anchor: Readonly<Record<BloodCompartmentId, number>>,
  leftMultiplier: number,
  rightMultiplier: number,
): Readonly<Record<BloodCompartmentId, number>> {
  const LV = anchor.LV * leftMultiplier;
  const RV = anchor.RV * rightMultiplier;
  return Object.freeze({
    ...anchor,
    LV,
    RV,
    PV: anchor.PV - (LV - anchor.LV),
    SV: anchor.SV - (RV - anchor.RV),
  });
}

function interpolatedClosedLedgerVolumes(
  center: Readonly<Record<BloodCompartmentId, number>>,
  destination: Readonly<Record<BloodCompartmentId, number>>,
  s: number,
): Readonly<Record<BloodCompartmentId, number>> {
  const LV = s === 0
    ? center.LV
    : s === 1
      ? destination.LV
      : center.LV + s * (destination.LV - center.LV);
  const RV = s === 0
    ? center.RV
    : s === 1
      ? destination.RV
      : center.RV + s * (destination.RV - center.RV);
  return Object.freeze({
    ...center,
    LV,
    RV,
    PV: center.PV - (LV - center.LV),
    SV: center.SV - (RV - center.RV),
  });
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  expect(left).toHaveLength(right.length);
  expect(left).toHaveLength(scales.length);
  return Math.max(...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
