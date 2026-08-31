import { describe, expect, it } from "vitest";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1,
  LAND2017_LOCAL_JACOBIAN_SIZE,
  LAND2017_STATE_SIZE,
  LAND2017_STRONG_BRIDGE_DEACTIVATION_EXIT_V1,
  computeLand2017AlgorithmicTangentPa,
  computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep,
  evaluateLand2017StrongBridgeDeactivationExitRateTermsV1,
  evaluateLand2017StrongBridgeDeactivationExitTermsV1,
  evaluateLand2017StepOutput,
  land2017ParameterSetHashInput,
  solveLand2017BackwardEulerStep,
  solveLand2017Sdirk2Step,
  stableHash,
  writeLand2017BackwardEulerResidual,
  writeLand2017BackwardEulerResidualJacobian,
  writeLand2017Rhs,
  type Land2017SourceParameterSet,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";
import {
  solveLand2017BackwardEulerStepNewtonReference,
  solveLand2017Sdirk2StepNewtonReference,
} from "@/engine/myocardium/myofilament/land2017/solverNewtonReference";

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

  it("keeps the absent extension path bit-exact and out of existing parameter identities", () => {
    const source = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    const wholeOrgan =
      LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1;
    expect(source.parameterSetStableHash).toBe("8ff268fc");
    expect(wholeOrgan.parameterSetStableHash).toBe("b3d4e447");
    expect(stableHash(land2017ParameterSetHashInput(source)))
      .toBe("8ff268fc");
    expect(stableHash(land2017ParameterSetHashInput(wholeOrgan)))
      .toBe("b3d4e447");
    expect(Object.hasOwn(source, "strongBridgeDeactivationExit")).toBe(false);
    expect(Object.hasOwn(wholeOrgan, "strongBridgeDeactivationExit"))
      .toBe(false);

    const solved = solveLand2017BackwardEulerStep(
      representativeState(),
      representativeStepInput(),
    );
    expect(solved.ok, solved.failureMessage).toBe(true);
    expect(Array.from(solved.nextState)).toEqual([
      0.5521848653455507,
      0.12348689189660304,
      0.10176394893525159,
      0.04008842187287956,
      0.10174144354459791,
      0.16864610903665378,
    ]);
    expect(solved.output?.sourceActiveFiberStressPa)
      .toBe(9693.127053248472);
  });

  it("moves only positive excess strong bridges to unbound through the fixed octic gate", () => {
    const parameterSet = selectedStrongBridgeExitParameterSet();
    const state = Float64Array.from([
      0.3,
      0.2,
      0.04,
      0.12,
      0.01,
      -0.1,
    ]);
    const input = {
      freeCalciumUM: 0.2,
      fiberEngineeringStrain: 0.02,
      fiberEngineeringStrainRatePerSec: 0,
    };
    const sourceRhs = writeLand2017Rhs(
      state,
      input,
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
    );
    const extendedRhs = writeLand2017Rhs(state, input, parameterSet);
    const terms = evaluateLand2017StrongBridgeDeactivationExitTermsV1(
      state,
      parameterSet,
    );
    expect(parameterSet.strongBridgeDeactivationExit).toEqual({
      extensionId: "land2017-strong-bridge-deactivation-exit-v1",
      maximumRatePerSec: 30,
      calciumTroponinGate:
        "TRPN50-power-over-TRPN50-power-plus-CaTRPN-power",
      cooperativeGatePower: 8,
      deactivationDirectionGate: "none",
      strongPopulationGate:
        "positive-excess-over-zero-distortion-equilibrium",
      exitDestination: "unbound",
      sourceIdentityClaimed: false,
    });
    expect(LAND2017_STATE_SIZE).toBe(6);
    expect(stableHash(land2017ParameterSetHashInput(parameterSet)))
      .toBe(parameterSet.parameterSetStableHash);
    expect(parameterSet.parameterSetStableHash)
      .not.toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET
        .parameterSetStableHash);
    expect(terms.populationGateActive).toBe(true);
    expect(terms.equilibriumStrongToWeakRatio).toBeCloseTo(2 / 3, 14);
    expect(terms.populationExcess).toBeCloseTo(
      0.12 - (2 / 3) * 0.04,
      14,
    );
    expect(terms.populationFluxPerSec).toBeGreaterThan(0);
    expect(terms.ratePerSec).toBeGreaterThanOrEqual(0);
    expect(terms.ratePerSec).toBeLessThanOrEqual(30);
    for (const index of [0, 1, 2, 4, 5]) {
      expect(extendedRhs[index]).toBe(sourceRhs[index]);
    }
    expect(extendedRhs[3] - sourceRhs[3])
      .toBeCloseTo(-terms.populationFluxPerSec, 13);
    expect(
      extendedRhs[1] + extendedRhs[2] + extendedRhs[3]
      - sourceRhs[1] - sourceRhs[2] - sourceRhs[3],
    ).toBeCloseTo(-terms.populationFluxPerSec, 13);

    const epsilon = 1e-6;
    const calciumTroponinValues = [0.1, 0.3, 0.55, 0.8] as const;
    const rates = calciumTroponinValues.map((CaTRPN) => {
      const rateTerms =
        evaluateLand2017StrongBridgeDeactivationExitRateTermsV1(
          CaTRPN,
          parameterSet,
        );
      const plus = evaluateLand2017StrongBridgeDeactivationExitRateTermsV1(
        CaTRPN + epsilon,
        parameterSet,
      ).ratePerSec;
      const minus = evaluateLand2017StrongBridgeDeactivationExitRateTermsV1(
        CaTRPN - epsilon,
        parameterSet,
      ).ratePerSec;
      expect(rateTerms.derivativeByCaTRPNPerSec)
        .toBeCloseTo((plus - minus) / (2 * epsilon), 7);
      return rateTerms.ratePerSec;
    });
    expect(rates).toEqual([...rates].sort((left, right) => right - left));

    const inactiveState = Float64Array.from(state);
    inactiveState[2] = 0.12;
    inactiveState[3] = 0.04;
    expect(evaluateLand2017StrongBridgeDeactivationExitTermsV1(
      inactiveState,
      parameterSet,
    )).toMatchObject({
      populationGateActive: false,
      populationExcess: 0,
      populationFluxPerSec: 0,
    });
  });

  it("is bit-exact to the source solve while the population gate is inactive", () => {
    const parameterSet = selectedStrongBridgeExitParameterSet();
    const previous = representativeState();
    const input = representativeStepInput();
    const source = solveLand2017BackwardEulerStep(previous, input);
    const extended = solveLand2017BackwardEulerStep(
      previous,
      input,
      {},
      parameterSet,
    );
    expect(source.ok, source.failureMessage).toBe(true);
    expect(extended.ok, extended.failureMessage).toBe(true);
    expect(evaluateLand2017StrongBridgeDeactivationExitTermsV1(
      extended.nextState,
      parameterSet,
    ).populationGateActive).toBe(false);
    expect(Array.from(extended.nextState)).toEqual(Array.from(source.nextState));
    expect(extended.output).toEqual(source.output);
    expect(extended.residualNorm).toBe(source.residualNorm);
  });

  it("matches the active extension residual Jacobian to finite differences", () => {
    const parameterSet = selectedStrongBridgeExitParameterSet();
    const next = Float64Array.from([
      0.3,
      0.2,
      0.04,
      0.12,
      0.01,
      -0.1,
    ]);
    const previous = Float64Array.from([
      0.31,
      0.19,
      0.045,
      0.115,
      0.008,
      -0.09,
    ]);
    const input: LandStepInput = {
      freeCalciumUM: 0.2,
      previousFiberEngineeringStrain: 0.015,
      stageFiberEngineeringStrain: 0.02,
      dtSec: 0.0002,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const analytic = writeLand2017BackwardEulerResidualJacobian(
      next,
      input,
      parameterSet,
    );
    const epsilon = 1e-6;
    for (let column = 0; column < LAND2017_STATE_SIZE; column += 1) {
      const plus = Float64Array.from(next);
      const minus = Float64Array.from(next);
      plus[column] += epsilon;
      minus[column] -= epsilon;
      const upper = writeLand2017BackwardEulerResidual(
        plus,
        previous,
        input,
        parameterSet,
      );
      const lower = writeLand2017BackwardEulerResidual(
        minus,
        previous,
        input,
        parameterSet,
      );
      for (let row = 0; row < LAND2017_STATE_SIZE; row += 1) {
        expect(analytic[row * LAND2017_STATE_SIZE + column])
          .toBeCloseTo((upper[row] - lower[row]) / (2 * epsilon), 5);
      }
    }
  });

  it("keeps the active direct solve, Newton oracle, and consistent tangent aligned", () => {
    const parameterSet = selectedStrongBridgeExitParameterSet();
    const previous = Float64Array.from([
      0.4,
      0.2,
      0.04,
      0.12,
      0.01,
      -0.1,
    ]);
    const input: LandStepInput = {
      freeCalciumUM: 0.2,
      previousFiberEngineeringStrain: 0.015,
      stageFiberEngineeringStrain: 0.02,
      dtSec: 0.0002,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const direct = solveLand2017BackwardEulerStep(
      previous,
      input,
      { residualTolerance: 1e-12 },
      parameterSet,
    );
    const reference = solveLand2017BackwardEulerStepNewtonReference(
      previous,
      input,
      {
        residualTolerance: 1e-12,
        maxIterations: 20,
        lineSearchMinStep: 1 / 4096,
      },
      parameterSet,
    );
    expect(direct.ok, direct.failureMessage).toBe(true);
    expect(reference.ok, reference.failureMessage).toBe(true);
    expect(maximumAbsoluteDifference(direct.nextState, reference.nextState))
      .toBeLessThan(2e-12);
    expect(evaluateLand2017StrongBridgeDeactivationExitTermsV1(
      direct.nextState,
      parameterSet,
    ).populationGateActive).toBe(true);
    const residual = writeLand2017BackwardEulerResidual(
      direct.nextState,
      previous,
      input,
      parameterSet,
    );
    expect(maximumAbsoluteValue(residual)).toBeLessThanOrEqual(1e-12);

    const consistent =
      computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep(
        direct.nextState,
        input,
        parameterSet,
      );
    const shadow = computeLand2017AlgorithmicTangentPa(
      previous,
      input,
      { epsilonStrain: 1e-6, residualTolerance: 1e-12 },
      parameterSet,
    );
    expect(relativeError(consistent, shadow)).toBeLessThan(2e-6);
  });

  it("does not reject adjacent floating-point representations of the population kink", () => {
    const parameterSet = selectedStrongBridgeExitParameterSet();
    const input: LandStepInput = {
      freeCalciumUM: 0.31056759459897876,
      previousFiberEngineeringStrain: -0.003809990719892074,
      stageFiberEngineeringStrain: -0.01877302788197993,
      dtSec: 0.00014171843496984857,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const sharedPrevious = [
      0.6515367081807927,
      0.03235331576317549,
      0.05513429424725473,
    ] as const;
    for (const previousStrongPopulation of [
      0.04811296876380546,
      0.04811296876380547,
    ]) {
      const previous = Float64Array.from([
        ...sharedPrevious,
        previousStrongPopulation,
        -0.3332724687643349,
        -0.12000198173336685,
      ]);
      const solved = solveLand2017BackwardEulerStep(
        previous,
        input,
        { residualTolerance: 1e-12 },
        parameterSet,
      );
      expect(solved.ok, solved.failureMessage).toBe(true);
      expect(solved.residualNorm).toBeLessThanOrEqual(1e-12);
      const terms = evaluateLand2017StrongBridgeDeactivationExitTermsV1(
        solved.nextState,
        parameterSet,
      );
      expect(Math.abs(
        solved.nextState[3]
          - terms.equilibriumStrongToWeakRatio * solved.nextState[2],
      )).toBeLessThanOrEqual(128 * Number.EPSILON);
    }
  });

  it("keeps the active SDIRK2 direct solve aligned with the Newton oracle", () => {
    const parameterSet = selectedStrongBridgeExitParameterSet();
    const previous = Float64Array.from([
      0.4,
      0.2,
      0.04,
      0.12,
      0.01,
      -0.1,
    ]);
    const input: LandStepInput = {
      freeCalciumUM: 0.2,
      previousFiberEngineeringStrain: 0.015,
      stageFiberEngineeringStrain: 0.02,
      dtSec: 0.0005,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const direct = solveLand2017Sdirk2Step(
      previous,
      input,
      { previousFreeCalciumUM: 0.25, residualTolerance: 1e-11 },
      parameterSet,
    );
    const reference = solveLand2017Sdirk2StepNewtonReference(
      previous,
      input,
      {
        previousFreeCalciumUM: 0.25,
        residualTolerance: 1e-11,
        maxIterations: 20,
        lineSearchMinStep: 1 / 4096,
      },
      parameterSet,
    );
    expect(direct.ok, direct.failureMessage).toBe(true);
    expect(reference.ok, reference.failureMessage).toBe(true);
    expect(maximumAbsoluteDifference(direct.nextState, reference.nextState))
      .toBeLessThan(2e-11);
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

function selectedStrongBridgeExitParameterSet(): Land2017SourceParameterSet {
  const source = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  const hashInput: Omit<
    Land2017SourceParameterSet,
    "parameterSetStableHash"
  > = {
    parameterSetId:
      `${source.parameterSetId}-strong-bridge-deactivation-exit-v1`,
    sourceId: source.sourceId,
    doi: source.doi,
    values: source.values,
    derived: source.derived,
    sourceParameters: source.sourceParameters,
    derivedParameters: source.derivedParameters,
    strongBridgeDeactivationExit:
      LAND2017_STRONG_BRIDGE_DEACTIVATION_EXIT_V1,
  };
  return Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableHash(hashInput),
  });
}

function maximumAbsoluteDifference(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): number {
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result = Math.max(result, Math.abs(left[index] - right[index]));
  }
  return result;
}

function maximumAbsoluteValue(values: ArrayLike<number>): number {
  let result = 0;
  for (let index = 0; index < values.length; index += 1) {
    result = Math.max(result, Math.abs(values[index]));
  }
  return result;
}

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}
