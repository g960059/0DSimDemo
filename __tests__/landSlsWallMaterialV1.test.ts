import { describe, expect, it } from "vitest";

import {
  initializeLandSlsWallAtFixedInputV1,
  trialLandSlsWallMaterialNumericalV1,
  trialLandSlsWallMaterialV1,
  type LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import { LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1 } from
  "@/engine/myocardium/myofilament/land2017/atrialPrior";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from
  "@/engine/myocardium/myofilament/land2017/parameterSets";

const VENTRICULAR_PARAMS: LandSlsWallMaterialParamsV1 = Object.freeze({
  parameterSetId: "fixed-normal-ventricular-wall-material-v1",
  landEquationParameters: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  landSlackStretch: 1,
  orientationFraction01: 0.72,
  viableActiveFraction01: 1,
  sls: Object.freeze({
    parameterSetId: "fixed-normal-ventricular-sls-v1",
    branchModulusPa: 3000,
    relaxationTimeSec: 0.08,
  }),
});

const ATRIAL_PARAMS: LandSlsWallMaterialParamsV1 = Object.freeze({
  ...VENTRICULAR_PARAMS,
  parameterSetId: "fixed-normal-atrial-wall-material-v1",
  landEquationParameters: LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1,
  orientationFraction01: 0.58,
  sls: Object.freeze({
    parameterSetId: "fixed-normal-atrial-sls-v1",
    branchModulusPa: 1800,
    relaxationTimeSec: 0.05,
  }),
});

describe("Land active + external equilibrium passive + parallel SLS wall V1", () => {
  it("cold-equilibrates Land at fixed calcium and initializes SLS without prestress", () => {
    const cold = initializeLandSlsWallAtFixedInputV1(0, 0.1, VENTRICULAR_PARAMS);
    expect(cold.converged).toBe(true);
    expect(cold.maximumStateUpdate).toBeLessThanOrEqual(1e-10);
    expect(cold.state.slsState.viscousLogStrain).toBe(0);
    expect(cold.state.previousFreeCalciumUM).toBe(0.1);
  });

  it("cold-equilibrates the bounded slow-transition candidate without truncating its relaxation", () => {
    const material =
      resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
        "source-twitch-retention-kws-one-half-ntm-four-fifths-peak-compensated",
        "land-sarcomere-reference-canonical",
        "land-whole-organ-kuw-nu7",
      );
    const fixedLandStretch = 1;
    const cold = initializeLandSlsWallAtFixedInputV1(
      Math.log(fixedLandStretch / material.landSlackStretch),
      0.164,
      material,
    );
    expect(cold.converged).toBe(true);
    expect(cold.fixedInputIterations).toBeGreaterThan(800);
    expect(cold.fixedInputIterations).toBeLessThanOrEqual(1600);
    expect(cold.maximumStateUpdate).toBeLessThanOrEqual(1e-10);
  });

  it("advances Land and SLS from accepted history without mutating it", () => {
    const cold = initializeLandSlsWallAtFixedInputV1(0, 0.1, VENTRICULAR_PARAMS);
    const before = Array.from(cold.state.landState);
    const trial = trialLandSlsWallMaterialV1(
      cold.state,
      {
        nextFiberLogStrain: 0.04,
        nextFreeCalciumUM: 0.55,
        dtSec: 0.005,
        equilibriumPassive: {
          stressPa: 800,
          tangentPa: 12_000,
          storedEnergyDensityJPerM3: 20,
        },
      },
      VENTRICULAR_PARAMS,
    );
    expect(trial.valid).toBe(true);
    expect(Array.from(cold.state.landState)).toEqual(before);
    expect(trial.activeNominalStressPa).toBeGreaterThanOrEqual(0);
    expect(trial.activeKirchhoffStressPa).toBeCloseTo(
      trial.landStretch *
      VENTRICULAR_PARAMS.orientationFraction01 *
      VENTRICULAR_PARAMS.viableActiveFraction01 *
      trial.activeNominalStressPa,
      12,
    );
    expect(trial.totalKirchhoffStressPa).toBeCloseTo(
      800 + trial.activeKirchhoffStressPa + trial.sls.nextOverstressPa,
      12,
    );
    expect(Math.abs(trial.sls.discreteEnergyBalanceResidualJPerM3))
      .toBeLessThan(1e-9);
    expect(trial.claim.externalSeriesElasticElement).toBe(false);
    expect(trial.claim.postHocForceVelocityMultiplier).toBe(false);
  });

  it("keeps the allocation-lean numerical trial exactly equal to the public constitutive result", () => {
    const cases = [
      {
        params: VENTRICULAR_PARAMS,
        previousFiberLogStrain: 0,
        nextFiberLogStrain: 0.04,
        nextFreeCalciumUM: 0.55,
        dtSec: 0.005,
      },
      {
        params: VENTRICULAR_PARAMS,
        previousFiberLogStrain: -0.01,
        nextFiberLogStrain: 0.025,
        nextFreeCalciumUM: 0.9,
        dtSec: 0.002,
      },
      {
        params: ATRIAL_PARAMS,
        previousFiberLogStrain: 0.01,
        nextFiberLogStrain: 0.02,
        nextFreeCalciumUM: 0.45,
        dtSec: 0.005,
      },
    ] as const;
    for (const testCase of cases) {
      const previous = initializeLandSlsWallAtFixedInputV1(
        testCase.previousFiberLogStrain,
        0.1,
        testCase.params,
      ).state;
      const input = {
        nextFiberLogStrain: testCase.nextFiberLogStrain,
        nextFreeCalciumUM: testCase.nextFreeCalciumUM,
        dtSec: testCase.dtSec,
        equilibriumPassive: {
          stressPa: 12_000 * testCase.nextFiberLogStrain,
          tangentPa: 12_000,
          storedEnergyDensityJPerM3:
            6000 * testCase.nextFiberLogStrain ** 2,
        },
      } as const;
      const full = trialLandSlsWallMaterialV1(
        previous,
        input,
        testCase.params,
      );
      const numerical = trialLandSlsWallMaterialNumericalV1(
        previous,
        input,
        testCase.params,
      );

      expect(Array.from(numerical.state.landState))
        .toEqual(Array.from(full.state.landState));
      expect(numerical.state.slsState).toEqual(full.state.slsState);
      expect(numerical.state.previousFiberLogStrain)
        .toBe(full.state.previousFiberLogStrain);
      expect(numerical.state.previousFreeCalciumUM)
        .toBe(full.state.previousFreeCalciumUM);
      expect(numerical.fiberLogStrain).toBe(full.fiberLogStrain);
      expect(numerical.totalKirchhoffStressPa)
        .toBe(full.totalKirchhoffStressPa);
      expect(numerical.activeKirchhoffStressPa)
        .toBe(full.activeKirchhoffStressPa);
      expect(numerical.totalAlgorithmicTangentPa)
        .toBe(full.totalAlgorithmicTangentPa);
      expect(numerical.activeAlgorithmicTangentPa)
        .toBe(full.activeAlgorithmicTangentPa);
      expect(numerical.landSolverIterations).toBe(full.landSolverIterations);
      expect(numerical.residualNorm).toBe(Math.max(
        Math.abs(full.landSolverResidualNorm),
        Math.abs(full.sls.stateResidual),
      ));
    }
  });

  it("accepts the separate literature atrial parameter family without changing topology", () => {
    const cold = initializeLandSlsWallAtFixedInputV1(0, 0.1, ATRIAL_PARAMS);
    const trial = trialLandSlsWallMaterialV1(
      cold.state,
      {
        nextFiberLogStrain: 0.02,
        nextFreeCalciumUM: 0.45,
        dtSec: 0.005,
        equilibriumPassive: {
          stressPa: 300,
          tangentPa: 5000,
          storedEnergyDensityJPerM3: 5,
        },
      },
      ATRIAL_PARAMS,
    );
    expect(trial.valid).toBe(true);
    expect(trial.parameterSetId).toBe("fixed-normal-atrial-wall-material-v1");
  });

  it("represents complete loss of viable active myocardium without another state", () => {
    const exactOff = Object.freeze({
      ...VENTRICULAR_PARAMS,
      parameterSetId: "complete-active-loss-wall-material-v1",
      viableActiveFraction01: 0,
    });
    const cold = initializeLandSlsWallAtFixedInputV1(0, 0.1, exactOff);
    const trial = trialLandSlsWallMaterialV1(
      cold.state,
      {
        nextFiberLogStrain: 0.03,
        nextFreeCalciumUM: 0.8,
        dtSec: 0.005,
        equilibriumPassive: {
          stressPa: 600,
          tangentPa: 9000,
          storedEnergyDensityJPerM3: 12,
        },
      },
      exactOff,
    );

    expect(trial.valid).toBe(true);
    expect(trial.activeNominalStressPa).toBeGreaterThan(0);
    expect(trial.activeKirchhoffStressPa).toBe(0);
    expect(trial.claim.exactZeroViabilityAllowed).toBe(true);
  });

  it("matches assembled Land/passive/SLS log-strain tangents to resolved shadows", () => {
    const passiveModulusPa = 12_000;
    const cases = [
      {
        params: VENTRICULAR_PARAMS,
        fiberLogStrain: 0.03,
        nextFreeCalciumUM: 0.55,
        dtSec: 0.005,
      },
      {
        params: VENTRICULAR_PARAMS,
        fiberLogStrain: -0.015,
        nextFreeCalciumUM: 0.9,
        dtSec: 0.002,
      },
      {
        params: ATRIAL_PARAMS,
        fiberLogStrain: 0.02,
        nextFreeCalciumUM: 0.45,
        dtSec: 0.005,
      },
    ] as const;

    for (const testCase of cases) {
      const previous = initializeLandSlsWallAtFixedInputV1(
        0,
        0.1,
        testCase.params,
      ).state;
      const evaluate = (fiberLogStrain: number) =>
        trialLandSlsWallMaterialV1(
          previous,
          {
            nextFiberLogStrain: fiberLogStrain,
            nextFreeCalciumUM: testCase.nextFreeCalciumUM,
            dtSec: testCase.dtSec,
            equilibriumPassive: {
              stressPa: passiveModulusPa * fiberLogStrain,
              tangentPa: passiveModulusPa,
              storedEnergyDensityJPerM3:
                0.5 * passiveModulusPa * fiberLogStrain ** 2,
            },
          },
          testCase.params,
        );
      const epsilon = 1e-6;
      const center = evaluate(testCase.fiberLogStrain);
      const lower = evaluate(testCase.fiberLogStrain - epsilon);
      const upper = evaluate(testCase.fiberLogStrain + epsilon);
      const shadowPa = (
        upper.totalKirchhoffStressPa - lower.totalKirchhoffStressPa
      ) / (2 * epsilon);

      expect(center.valid && lower.valid && upper.valid).toBe(true);
      expect(relativeError(center.totalAlgorithmicTangentPa, shadowPa))
        .toBeLessThan(3e-6);
    }
  });
});

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}
