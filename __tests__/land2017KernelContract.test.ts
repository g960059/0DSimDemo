import { describe, expect, it } from "vitest";
import {
  measureMainWireVentricularLandSteadyStateForceCalciumAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandSteadyStateForceCalciumAuditV1";
import {
  resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_LOCAL_JACOBIAN_SIZE,
  LAND2017_STATE_SIZE,
  computeLand2017AlgorithmicTangentPa,
  computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep,
  deriveLand2017DerivedParameters,
  evaluateLand2017StepOutput,
  solveLand2017BackwardEulerStep,
  writeLand2017BackwardEulerResidual,
  writeLand2017BackwardEulerResidualJacobian,
  stableHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

describe("Land 2017 kernel contract", () => {
  it("matches the analytic BE residual Jacobian to finite differences", () => {
    const next = representativeState();
    const previous = Float64Array.from([
      0.52,
      0.105,
      0.07,
      0.035,
      0.045,
      0.09,
    ]);
    const input = representativeStepInput();
    const analytic = writeLand2017BackwardEulerResidualJacobian(next, input);
    const epsilon = 1e-6;

    expect(analytic.length).toBe(LAND2017_LOCAL_JACOBIAN_SIZE);
    for (let column = 0; column < LAND2017_STATE_SIZE; column += 1) {
      const plus = Float64Array.from(next);
      const minus = Float64Array.from(next);
      plus[column] += epsilon;
      minus[column] -= epsilon;
      const residualPlus = writeLand2017BackwardEulerResidual(
        plus,
        previous,
        input,
      );
      const residualMinus = writeLand2017BackwardEulerResidual(
        minus,
        previous,
        input,
      );

      for (let row = 0; row < LAND2017_STATE_SIZE; row += 1) {
        const finiteDifference =
          (residualPlus[row] - residualMinus[row]) / (2 * epsilon);
        expect(
          analytic[row * LAND2017_STATE_SIZE + column],
        ).toBeCloseTo(finiteDifference, 5);
      }
    }
  });

  it("reports invalid domains without silently projecting or clamping", () => {
    const input = representativeStepInput();
    const invalidCaTrpn = Float64Array.from([
      0,
      0.12,
      0.08,
      0.04,
      0.06,
      0.12,
    ]);

    expect(() =>
      writeLand2017BackwardEulerResidual(
        invalidCaTrpn,
        representativeState(),
        input,
      )).toThrow(/CaTRPN/);

    const negativePopulation = Float64Array.from([
      0.55,
      -0.01,
      0.08,
      0.04,
      0.06,
      0.12,
    ]);
    const output = evaluateLand2017StepOutput(negativePopulation, input);

    expect(output.health.finite).toBe(false);
    expect(output.health.minimumPopulation).toBeLessThan(0);
    expect(output.health.projectionUsed).toBe(false);
    expect(negativePopulation[1]).toBe(-0.01);

    const failed = solveLand2017BackwardEulerStep(invalidCaTrpn, input, {
      initialGuess: representativeState(),
      maxIterations: 2,
    });
    expect(failed).toMatchObject({
      ok: false,
      stepRejected: true,
      failureReason: "domain-error",
    });
  });

  it("matches the implicit consistent tangent to resolved shadows", () => {
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

  it("uses the centered semismooth tangent at both zetaS recruitment kinks", () => {
    const parameterSet = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    const dtSec = 0.0002;
    const cases = [
      { expectedSolvedZetaS: 0, previousZetaS: 0 },
      {
        expectedSolvedZetaS: -1,
        previousZetaS: -(1 + dtSec * parameterSet.derived.cs),
      },
    ] as const;

    for (const testCase of cases) {
      const previous = Float64Array.from([
        0.55,
        0.12,
        0.08,
        0.04,
        0,
        testCase.previousZetaS,
      ]);
      const input: LandStepInput = {
        freeCalciumUM: 0.92,
        previousFiberEngineeringStrain: 0.02,
        stageFiberEngineeringStrain: 0.02,
        dtSec,
        stage: { scheme: "BE", stageIndex: 0 },
      };
      const solved = solveLand2017BackwardEulerStep(
        previous,
        input,
        { residualTolerance: 1e-12, maxIterations: 20 },
        parameterSet,
      );

      expect(solved.ok).toBe(true);
      expect(solved.nextState[5]).toBeCloseTo(testCase.expectedSolvedZetaS, 13);
      const consistent =
        computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep(
          solved.nextState,
          input,
          parameterSet,
        );
      const centeredShadow = computeLand2017AlgorithmicTangentPa(
        previous,
        input,
        {
          epsilonStrain: 1e-7,
          residualTolerance: 1e-12,
          maxIterations: 20,
        },
        parameterSet,
      );
      expect(relativeError(consistent, centeredShadow)).toBeLessThan(2e-6);
    }
  });

  it("audits the composed steady-state force-calcium response", () => {
    const source =
      measureMainWireVentricularLandSteadyStateForceCalciumAuditV1();

    expect(source.halfActivation.eq48NumericalCapActive).toBe(false);
    expect(source.halfActivation.calciumTroponinFraction).toBeCloseTo(0.35, 14);
    expect(source.halfActivation.freeCalciumUM).toBeCloseTo(
      0.590708505492801,
      14,
    );
    expect(source.halfActivation.normalizedActiveStress01).toBeCloseTo(
      0.5,
      14,
    );
    expect(source.halfActivation.localForceOddsHillSlope).toBeCloseTo(6.5, 14);
    expect(source.numericalHealth).toMatchObject({
      everyPopulationNonNegative: true,
      everyValueFinite: true,
    });
    expect(
      source.numericalHealth.maximumPopulationConservationResidual,
    ).toBeLessThan(1e-14);
    expect(
      source.numericalHealth.maximumAbsoluteRhsResidualPerSec,
    ).toBeLessThan(1e-10);

    const material =
      resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
        "source-twitch-retention-kws-thirteen-twentieths-ntm-four-fifths-peak-compensated",
        "land-sarcomere-reference-plus-5-percent",
        "land-whole-organ-kuw-nu4",
      );
    const retained =
      measureMainWireVentricularLandSteadyStateForceCalciumAuditV1(
        material.landEquationParameters,
      );
    expect(retained.halfActivation.freeCalciumUM).toBeCloseTo(
      source.halfActivation.freeCalciumUM,
      14,
    );
    expect(retained.halfActivation.localForceOddsHillSlope).toBeCloseTo(
      5.2,
      14,
    );
  });

  it("keeps normalized equilibrium force invariant to population kinetics", () => {
    const source = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    const values: Land2017RuntimeParameters = Object.freeze({
      ...source.values,
      kws: source.values.kws * 0.4,
      rs: source.values.rs * 0.6,
      rw: source.values.rw * 0.75,
    });
    const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
      ...source,
      parameterSetId: `${source.parameterSetId}-population-coordinate-test`,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    };
    const changed: Land2017SourceParameterSet = Object.freeze({
      ...hashInput,
      parameterSetStableHash: stableHash(hashInput),
    });
    const reference =
      measureMainWireVentricularLandSteadyStateForceCalciumAuditV1(source);
    const comparison =
      measureMainWireVentricularLandSteadyStateForceCalciumAuditV1(changed);

    expect(comparison.halfActivation.freeCalciumUM).toBeCloseTo(
      reference.halfActivation.freeCalciumUM,
      14,
    );
    expect(comparison.halfActivation.localForceOddsHillSlope).toBeCloseTo(
      reference.halfActivation.localForceOddsHillSlope,
      14,
    );
    for (const [index, sample] of comparison.curveSamples.entries()) {
      expect(sample.normalizedActiveStress01).toBeCloseTo(
        reference.curveSamples[index]!.normalizedActiveStress01,
        14,
      );
    }
    expect(comparison.curveSamples.some((sample, index) =>
      sample.strongPopulationS
      !== reference.curveSamples[index]!.strongPopulationS)).toBe(true);
  });

  it("includes the Eq 48 numerical cap in the equilibrium half point", () => {
    const source = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    const values: Land2017RuntimeParameters = Object.freeze({
      ...source.values,
      TRPN50: 0.01,
    });
    const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
      ...source,
      parameterSetId: `${source.parameterSetId}-eq48-cap-test`,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    };
    const parameterSet: Land2017SourceParameterSet = Object.freeze({
      ...hashInput,
      parameterSetStableHash: stableHash(hashInput),
    });
    const audit =
      measureMainWireVentricularLandSteadyStateForceCalciumAuditV1(
        parameterSet,
      );

    expect(audit.halfActivation.eq48NumericalCapActive).toBe(true);
    expect(audit.halfActivation.normalizedActiveStress01).toBeCloseTo(
      0.5,
      14,
    );
    expect(audit.numericalHealth.maximumAbsoluteRhsResidualPerSec)
      .toBeLessThan(1e-10);
  });
});

function representativeState(): Float64Array {
  return Float64Array.from([0.55, 0.12, 0.08, 0.04, 0.06, 0.12]);
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

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}
