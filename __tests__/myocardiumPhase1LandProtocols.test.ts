import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/land2017-phase1c-source-protocols.json";
import {
  LAND2017_ACTIVE_STIFFNESS_PROVENANCE,
  computeLand2017ActiveStiffnessPa,
  computeLand2017AlgorithmicTangentPa,
  computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep,
  computeLand2017FrozenStateTangentByFiniteDifferencePa,
  computeLand2017FrozenStateTangentPa,
  evaluateLand2017SolvedStepWithTangents,
  evaluateLand2017StepOutput,
  runLand2017Phase1CProtocolReport,
  solveLand2017BackwardEulerStep,
  stableHash,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

describe("myocardium Phase 1C Land protocol closure", () => {
  it("uses explicit algorithmic-source-closure fixtures with deferred experimental targets", () => {
    expect(protocolDescriptor.claimBoundary).toBe("algorithmic-source-closure-only");
    expect(protocolDescriptor.deferredExperimentalTargets.length).toBeGreaterThan(0);
    expect(protocolDescriptor.sourceDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: "land2017-human-contraction" }),
        expect.objectContaining({ sourceId: "regazzoni-quarteroni2020-active-stiffness" }),
      ]),
    );
  });

  it("computes source-grounded active stiffness in canonical output", () => {
    const state = representativeState();
    const input = representativeStepInput();
    const output = evaluateLand2017StepOutput(state, input);
    const expected = computeLand2017ActiveStiffnessPa(state, {
      fiberEngineeringStrain: input.stageFiberEngineeringStrain,
    });

    expect(output.stabilizationStiffnessPa).toBeCloseTo(expected, 12);
    expect(output.stabilizationStiffnessPa).toBeGreaterThan(0);
    expect(LAND2017_ACTIVE_STIFFNESS_PROVENANCE).toMatchObject({
      sourceId: "regazzoni-quarteroni2020-active-stiffness",
      persistentId: "arXiv:2007.15714",
      role: "stabilization",
    });
  });

  it("solves a BE source step and reports domain exits as structured failures", () => {
    const solved = solveLand2017BackwardEulerStep(representativeState(), representativeStepInput());
    expect(solved.ok).toBe(true);
    expect(solved.output?.health.projectionUsed).toBe(false);
    expect(solved.residualNorm).toBeLessThan(1e-8);

    const invalidPrevious = Float64Array.from([0, 0.12, 0.08, 0.04, 0.06, 0.12]);
    const failed = solveLand2017BackwardEulerStep(invalidPrevious, representativeStepInput(), {
      maxIterations: 2,
    });
    expect(failed.ok).toBe(false);
    expect(failed.stepRejected).toBe(true);
    expect(failed.failureReason).toBe("domain-error");

    const failedWithValidGuess = solveLand2017BackwardEulerStep(invalidPrevious, representativeStepInput(), {
      initialGuess: representativeState(),
      maxIterations: 2,
    });
    expect(failedWithValidGuess.ok).toBe(false);
    expect(failedWithValidGuess.stepRejected).toBe(true);
    expect(failedWithValidGuess.failureReason).toBe("domain-error");
  });

  it("separates stabilization, algorithmic tangent, and frozen-state tangent numerically", () => {
    const previous = representativeState();
    const input = representativeStepInput();
    const solved = evaluateLand2017SolvedStepWithTangents(previous, input);

    expect(solved.ok).toBe(true);
    expect(solved.output?.algorithmicTangentPa).toEqual(expect.any(Number));
    expect(solved.output?.frozenStateTangentPa).toEqual(expect.any(Number));

    const algorithmic = computeLand2017AlgorithmicTangentPa(previous, input);
    const frozen = computeLand2017FrozenStateTangentPa(solved.nextState, input);
    const frozenFd = computeLand2017FrozenStateTangentByFiniteDifferencePa(solved.nextState, input);
    const stabilization = solved.output!.stabilizationStiffnessPa;

    expect(solved.output!.algorithmicTangentPa).toBeCloseTo(algorithmic, 12);
    expect(frozen).toBeCloseTo(frozenFd, 3);
    expect(Math.abs(algorithmic - frozen)).toBeGreaterThan(1e-6);
    expect(Math.abs(algorithmic - stabilization)).toBeGreaterThan(1e-6);
    expect(Math.abs(frozen - stabilization)).toBeGreaterThan(1e-6);
  });

  it("matches the implicit BE consistent tangent to resolved finite-difference shadows", () => {
    const previous = representativeState();
    const inputs: readonly LandStepInput[] = [
      representativeStepInput(),
      {
        freeCalciumUM: 0.25,
        previousFiberEngineeringStrain: -0.01,
        stageFiberEngineeringStrain: 0.005,
        dtSec: 0.0005,
        stage: { scheme: "BE", stageIndex: 0 },
      },
      {
        freeCalciumUM: 1.2,
        previousFiberEngineeringStrain: 0.04,
        stageFiberEngineeringStrain: 0.025,
        stageZetaDriveFiberEngineeringStrainRatePerSec: -0.3,
        dtSec: 0.001,
        stage: { scheme: "BE", stageIndex: 0 },
      },
    ];

    for (const input of inputs) {
      const solved = solveLand2017BackwardEulerStep(previous, input);
      expect(solved.ok).toBe(true);
      const consistent =
        computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep(
          solved.nextState,
          input,
        );
      const shadow = computeLand2017AlgorithmicTangentPa(previous, input, {
        epsilonStrain: 1e-6,
      });
      expect(relativeError(consistent, shadow)).toBeLessThan(2e-6);
    }
  });

  it("reports every Phase 1C source-closure protocol without experimental pass claims", () => {
    const report = runLand2017Phase1CProtocolReport();
    const ids = report.sections.map((section) => section.id);

    expect(report.claimBoundary).toBe("algorithmic-source-closure-only");
    expect(report.experimentalTargets).toBe("deferred");
    expect(report.closurePass).toBe(true);
    expect(ids).toEqual(
      expect.arrayContaining([
        "force-ca-multistrain-smoke",
        "synthetic-isometric-twitch-shape",
        "rapid-length-step-positive-negative",
        "constant-velocity-shortening-family",
        "force-velocity-sweep-report",
        "length-dependent-twitch-prolongation-smoke",
        "prescribed-shortening-replay-synthetic-v1",
        "state-conservation-positivity-report",
        "dt-convergence-be-source-v1",
        "active-stiffness-provenance-v1",
        "algorithmic-tangent-resolved-fd-v1",
        "deterministic-reproducibility-v1",
        "deferred-experimental-targets",
      ]),
    );
    expect(JSON.stringify(report)).not.toMatch(/experimentalPass/);
    for (const section of report.sections.filter((item) => item.status === "closure-pass")) {
      if ("trajectoryComplete" in section.metrics) {
        expect(section.metrics.trajectoryComplete).toBe(true);
      }
      if ("failedTrajectoryCount" in section.metrics) {
        expect(section.metrics.failedTrajectoryCount).toBe(0);
      }
    }
  });

  it("keeps the protocol summary deterministic", () => {
    const first = runLand2017Phase1CProtocolReport();
    const second = runLand2017Phase1CProtocolReport();

    expect(first.stableSummaryHash).toBe(second.stableSummaryHash);
    expect(stableHash(first.sections)).toBe(stableHash(second.sections));
  });
});

function representativeState(): Float64Array {
  return Float64Array.from([0.55, 0.12, 0.08, 0.04, 0.06, 0.12]);
}

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}

function representativeStepInput(): LandStepInput {
  return {
    freeCalciumUM: 0.92,
    previousFiberEngineeringStrain: 0.015,
    stageFiberEngineeringStrain: 0.02,
    dtSec: 0.0002,
    stage: { scheme: "BE", stageIndex: 0 },
  };
}
