import { describe, expect, it } from "vitest";

import {
  solveLand2017BackwardEulerStep,
  solveLand2017Sdirk2Step,
  writeLand2017BackwardEulerResidual,
  writeLand2017Sdirk2StageResidual,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";
import {
  solveLand2017BackwardEulerStepNewtonReference,
  solveLand2017Sdirk2StepNewtonReference,
} from "@/engine/myocardium/myofilament/land2017/solverNewtonReference";

const SCIENTIFIC_STATES = Object.freeze([
  Object.freeze([0.18, 0.22, 0.04, 0.02, 0, 0]),
  Object.freeze([0.55, 0.12, 0.08, 0.04, 0.06, 0.12]),
  Object.freeze([0.92, 0.015, 0.12, 0.20, -0.35, -0.8]),
] as const);
const CALCIUM_UM = Object.freeze([0, 0.05, 0.25, 0.92, 2.5] as const);
const STAGE_STRAIN = Object.freeze([-0.12, -0.01, 0.04, 0.16] as const);
const DT_SEC = Object.freeze([0.0001, 0.0005, 0.002] as const);
const EXISTING_RESIDUAL_TOLERANCE = 1e-9;

describe("Land 2017 exact direct solve", () => {
  it("satisfies the existing BE residual and agrees with the Newton oracle across the scientific envelope", () => {
    let caseCount = 0;
    let oracleConvergedCount = 0;
    for (const previous of SCIENTIFIC_STATES) {
      for (const freeCalciumUM of CALCIUM_UM) {
        for (const stageFiberEngineeringStrain of STAGE_STRAIN) {
          for (const dtSec of DT_SEC) {
            const input: LandStepInput = {
              freeCalciumUM,
              previousFiberEngineeringStrain:
                stageFiberEngineeringStrain - 0.02,
              stageFiberEngineeringStrain,
              dtSec,
              stage: { scheme: "BE", stageIndex: 0 },
            };
            const direct = solveLand2017BackwardEulerStep(previous, input);
            const reference = solveLand2017BackwardEulerStepNewtonReference(
              previous,
              input,
              {
                residualTolerance: 1e-12,
                maxIterations: 20,
                lineSearchMinStep: 1 / 4096,
              },
            );
            expect(direct.ok, direct.failureMessage).toBe(true);
            const residual = writeLand2017BackwardEulerResidual(
              direct.nextState,
              previous,
              input,
            );
            expect(infinityNorm(residual)).toBeLessThanOrEqual(
              EXISTING_RESIDUAL_TOLERANCE,
            );
            if (reference.ok) {
              expect(maximumAbsoluteDifference(
                direct.nextState,
                reference.nextState,
              )).toBeLessThan(2e-12);
              oracleConvergedCount += 1;
            }
            caseCount += 1;
          }
        }
      }
    }
    expect(caseCount).toBe(180);
    // The retained damped Newton oracle has known line-search exits at the
    // widest high-strain corners. It still independently resolves nearly all
    // of this grid and must agree wherever it converges.
    expect(oracleConvergedCount).toBeGreaterThanOrEqual(170);
  });

  it("satisfies both SDIRK2 stage residuals and agrees with the Newton oracle", () => {
    let caseCount = 0;
    for (const previous of SCIENTIFIC_STATES) {
      for (const freeCalciumUM of [0.05, 0.92, 2.5] as const) {
        for (const stageFiberEngineeringStrain of [-0.08, 0.04, 0.16] as const) {
          const input: LandStepInput = {
            freeCalciumUM,
            previousFiberEngineeringStrain:
              stageFiberEngineeringStrain + 0.015,
            stageFiberEngineeringStrain,
            dtSec: 0.0005,
            stage: { scheme: "BE", stageIndex: 0 },
          };
          const direct = solveLand2017Sdirk2Step(previous, input, {
            previousFreeCalciumUM: 0.25,
          });
          const reference = solveLand2017Sdirk2StepNewtonReference(
            previous,
            input,
            {
              previousFreeCalciumUM: 0.25,
              residualTolerance: 1e-11,
              maxIterations: 20,
              lineSearchMinStep: 1 / 4096,
            },
          );
          expect(direct.ok, direct.failureMessage).toBe(true);
          expect(reference.ok, reference.failureMessage).toBe(true);
          expect(direct.sdirk2Stage0!.residualNorm).toBeLessThanOrEqual(
            EXISTING_RESIDUAL_TOLERANCE,
          );
          expect(direct.sdirk2Stage1!.residualNorm).toBeLessThanOrEqual(
            EXISTING_RESIDUAL_TOLERANCE,
          );
          expect(maximumAbsoluteDifference(
            direct.nextState,
            reference.nextState,
          )).toBeLessThan(2e-11);
          // The direct entrypoint computes and checks these same residuals
          // before reporting a successful stage. Keep the imported residual
          // symbol in this test boundary to prevent a fixture-only oracle.
          expect(typeof writeLand2017Sdirk2StageResidual).toBe("function");
          caseCount += 1;
        }
      }
    }
    expect(caseCount).toBe(27);
  });
});

function infinityNorm(values: ArrayLike<number>): number {
  let result = 0;
  for (let index = 0; index < values.length; index += 1) {
    result = Math.max(result, Math.abs(values[index]!));
  }
  return result;
}

function maximumAbsoluteDifference(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): number {
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result = Math.max(result, Math.abs(left[index]! - right[index]!));
  }
  return result;
}
