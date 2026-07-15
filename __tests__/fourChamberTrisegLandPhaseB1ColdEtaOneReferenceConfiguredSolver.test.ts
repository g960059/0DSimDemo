import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_POLICY_V1,
  PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_V1_ID,
  createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1,
  createPhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1,
  runPhaseB1ProjectSyntheticColdInitializationV1,
  type PhaseB1ColdEtaOneReferenceConfigurationV1,
  type PhaseB1ColdEtaOneReferenceConfiguredEvaluateInputV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";

describe("Phase B1 eta-one reference-configured cold solver session", () => {
  it.each(["on", "off"] as const)(
    "preserves the canonical SLS-%s anchor and exposes reference sensitivity",
    (slsMode) => {
      const cold = runPhaseB1ProjectSyntheticColdInitializationV1(
        slsMode,
        sha256,
      );
      const canonical = cold.canonicalForwardPath;
      expect(canonical?.completed).toBe(true);
      if (canonical?.completed !== true) return;
      const anchorNode = canonical.endpoint;
      const fixedVolume = createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1(
        slsMode,
        sha256,
      );
      const session =
        createPhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1(
          slsMode,
          sha256,
        );

      expect(session.solverId).toBe(
        PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_V1_ID,
      );
      expect(session.layout).toEqual(fixedVolume.layout);
      expect(session.anchorFixedInputs).toEqual(fixedVolume.anchorFixedInputs);
      expect(session.anchorNewtonScaleRegistryContentSha256).toMatch(
        /^[0-9a-f]{64}$/,
      );
      expect(Object.values(session.anchorProvenance)).toHaveLength(4);
      expect(Object.values(session.anchorProvenance).every((value) =>
        /^[0-9a-f]{64}$/.test(value))).toBe(true);
      expect(
        session.anchorProvenance.anchorNewtonScaleRegistryContentSha256,
      ).toBe(session.anchorNewtonScaleRegistryContentSha256);
      expect(session.claimBoundary).toEqual({
        physiologicalReferenceAcceptance: false,
        supportedReferenceEnvelope: false,
        releaseRuntimeReachability: false,
      });
      expect(PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_POLICY_V1)
        .toMatchObject({
          eta: 1,
          timeSec: 0,
          bloodVolumesRemainAtCanonicalAnchor: true,
          inertialFlowsRemainAtCanonicalAnchor: true,
          prescribedCalciumRemainsAtCanonicalAnchor: true,
          anchorNewtonScaleRegistryRemainsFixed: true,
          restoringBranchSolveOnly: true,
          physiologicalReferenceAcceptanceClaimed: false,
          supportedReferenceEnvelopeClaimed: false,
        });

      const anchorEvaluation =
        session.evaluateColdResidualAtReferenceConfiguration({
          referenceConfiguration: session.anchorReferenceConfiguration,
          unknowns: anchorNode.unknowns,
        });
      const fixedVolumeResidual = fixedVolume.evaluateResidualVectorAtVolumes({
        bloodVolumesM3: fixedVolume.anchorFixedInputs.bloodVolumesM3,
        unknowns: anchorNode.unknowns,
      });
      expect(anchorEvaluation.eta).toBe(1);
      expect(anchorEvaluation.residual).toEqual(fixedVolumeResidual);
      expect(anchorEvaluation.residual).toEqual(
        anchorNode.residualEvaluation.residual,
      );
      expect(anchorEvaluation.closedLoop.chamberAbsolutePressurePa).toEqual(
        anchorNode.residualEvaluation.closedLoop.chamberAbsolutePressurePa,
      );

      const resolved = session.solveRestoringNodeAtReferenceConfiguration({
        referenceConfiguration: session.anchorReferenceConfiguration,
        initialUnknowns: anchorNode.unknowns,
      });
      const resolveDiagnostic = resolved.converged === false
        ? JSON.stringify({ reason: resolved.reason, message: resolved.message })
        : undefined;
      expect(
        resolved.converged,
        resolveDiagnostic,
      ).toBe(true);
      if (resolved.converged === false) return;
      expect(resolved.eta).toBe(1);
      expect(resolved.unknowns).toEqual(anchorNode.unknowns);
      expect(resolved.endpoint).toEqual(anchorNode.endpoint);

      const seed = session.buildAnalyticSeedAtReferenceConfiguration({
        referenceConfiguration: session.anchorReferenceConfiguration,
        triSegCoordinates: anchorNode.endpoint.triSegCoordinates,
      });
      expect(seed).toHaveLength(session.layout.unknownCount);

      const perturbedConfiguration = perturbReferenceConfiguration(
        session.anchorReferenceConfiguration,
      );
      const perturbedEvaluation =
        session.evaluateColdResidualAtReferenceConfiguration({
          referenceConfiguration: perturbedConfiguration,
          unknowns: anchorNode.unknowns,
        });
      expect(perturbedEvaluation.residual).not.toEqual(
        anchorEvaluation.residual,
      );
      expect(perturbedEvaluation.closedLoop.chamberAbsolutePressurePa)
        .not.toEqual(anchorEvaluation.closedLoop.chamberAbsolutePressurePa);
      expect(perturbedEvaluation.endpoint.differentialState.bloodVolumesM3)
        .toEqual(session.anchorFixedInputs.bloodVolumesM3);
      expect(perturbedEvaluation.endpoint.differentialState.inertialFlowsM3PerSec)
        .toEqual(session.anchorFixedInputs.inertialFlowsM3PerSec);
      expect(perturbedEvaluation.endpoint.differentialState.calciumByWall)
        .toEqual(session.anchorFixedInputs.calciumByWall);

      for (const result of [
        session.anchorProvenance,
        session.anchorReferenceConfiguration,
        anchorEvaluation,
        resolved,
        seed,
        perturbedEvaluation,
      ]) expectRecursivelyFrozen(result);
    },
  );

  it("strictly rejects malformed, undeclared, and nonpositive reference inputs", () => {
    const session =
      createPhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1("on", sha256);
    const anchor = session.anchorReferenceConfiguration;
    const validUnknowns = session.buildAnalyticSeedAtReferenceConfiguration({
      referenceConfiguration: anchor,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
    });
    const evaluate = (
      referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1,
    ) => session.evaluateColdResidualAtReferenceConfiguration({
      referenceConfiguration,
      unknowns: validUnknowns,
    });

    expect(() => evaluate({
      ...anchor,
      extra: 1,
    } as unknown as PhaseB1ColdEtaOneReferenceConfigurationV1)).toThrow(
      /exactly/,
    );
    expect(() => evaluate({
      atrialReferenceCavityVolumeM3ByChamber:
        anchor.atrialReferenceCavityVolumeM3ByChamber,
    } as unknown as PhaseB1ColdEtaOneReferenceConfigurationV1)).toThrow(
      /exactly/,
    );
    expect(() => evaluate({
      ...anchor,
      atrialReferenceCavityVolumeM3ByChamber: {
        ...anchor.atrialReferenceCavityVolumeM3ByChamber,
        EXTRA: 1,
      },
    } as unknown as PhaseB1ColdEtaOneReferenceConfigurationV1)).toThrow(
      /exactly/,
    );
    expect(() => evaluate({
      ...anchor,
      triSegReferenceMidwallAreaM2ByWall: {
        ...anchor.triSegReferenceMidwallAreaM2ByWall,
        SEP: 0,
      },
    })).toThrow(/positive and finite/);
    expect(() => evaluate({
      ...anchor,
      atrialReferenceCavityVolumeM3ByChamber: {
        ...anchor.atrialReferenceCavityVolumeM3ByChamber,
        LA: Number.NaN,
      },
    })).toThrow(/positive and finite/);

    const accessor = {
      ...anchor.triSegReferenceMidwallAreaM2ByWall,
    };
    Object.defineProperty(accessor, "LVFW", {
      enumerable: true,
      configurable: true,
      get: () => anchor.triSegReferenceMidwallAreaM2ByWall.LVFW,
    });
    expect(() => evaluate({
      ...anchor,
      triSegReferenceMidwallAreaM2ByWall: accessor,
    })).toThrow(/enumerable data property/);

    expect(() => session.evaluateColdResidualAtReferenceConfiguration({
      referenceConfiguration: anchor,
      unknowns: validUnknowns,
      eta: 0,
    } as unknown as PhaseB1ColdEtaOneReferenceConfiguredEvaluateInputV1))
      .toThrow(/exactly/);
    expect(() => session.buildAnalyticSeedAtReferenceConfiguration({
      referenceConfiguration: anchor,
      triSegCoordinates: { V_m_S: 0, y_m: 0 },
    })).toThrow(/positive and finite/);
    expect(Reflect.set(
      anchor.atrialReferenceCavityVolumeM3ByChamber,
      "LA",
      1,
    )).toBe(false);
  });
});

function perturbReferenceConfiguration(
  anchor: PhaseB1ColdEtaOneReferenceConfigurationV1,
): PhaseB1ColdEtaOneReferenceConfigurationV1 {
  return Object.freeze({
    atrialReferenceCavityVolumeM3ByChamber: Object.freeze({
      LA: 1.01 * anchor.atrialReferenceCavityVolumeM3ByChamber.LA,
      RA: 0.99 * anchor.atrialReferenceCavityVolumeM3ByChamber.RA,
    }),
    triSegReferenceMidwallAreaM2ByWall: Object.freeze({
      LVFW: 1.01 * anchor.triSegReferenceMidwallAreaM2ByWall.LVFW,
      SEP: 0.99 * anchor.triSegReferenceMidwallAreaM2ByWall.SEP,
      RVFW: 1.01 * anchor.triSegReferenceMidwallAreaM2ByWall.RVFW,
    }),
  });
}

function expectRecursivelyFrozen(value: unknown): void {
  const seen = new WeakSet<object>();
  const visit = (current: unknown): void => {
    if (current === null || typeof current !== "object") return;
    if (seen.has(current)) return;
    seen.add(current);
    expect(Object.isFrozen(current)).toBe(true);
    for (const key of Reflect.ownKeys(current)) {
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (descriptor !== undefined && "value" in descriptor) {
        visit(descriptor.value);
      }
    }
  };
  visit(value);
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
