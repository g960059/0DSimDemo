import { describe, expect, it } from "vitest";

import {
  initialParallelOneStateSlsStateV1,
  stepParallelOneStateSlsBackwardEulerV1,
} from "@/engine/myocardium/mechanics/parallelOneStateSlsV1";

const PARAMS = Object.freeze({
  parameterSetId: "fixed-atrial-parallel-sls-prior-v1",
  branchModulusPa: 2500,
  relaxationTimeSec: 0.05,
});

describe("parallel one-state SLS V1", () => {
  it("cold-starts without a hidden prestress", () => {
    const strain = 0.12;
    const output = stepParallelOneStateSlsBackwardEulerV1(
      initialParallelOneStateSlsStateV1(strain),
      { previousFiberLogStrain: strain, nextFiberLogStrain: strain, dtSec: 0.002 },
      PARAMS,
    );
    expect(output.previousOverstressPa).toBe(0);
    expect(output.nextOverstressPa).toBe(0);
    expect(output.stateResidual).toBe(0);
    expect(output.passive).toBe(true);
  });

  it("satisfies the closed-form backward-Euler state and energy identities", () => {
    const previousStrain = -0.03;
    const output = stepParallelOneStateSlsBackwardEulerV1(
      initialParallelOneStateSlsStateV1(previousStrain),
      { previousFiberLogStrain: previousStrain, nextFiberLogStrain: 0.08, dtSec: 0.01 },
      PARAMS,
    );
    expect(output.nextOverstressPa).toBeGreaterThan(0);
    expect(output.dNextOverstressDNextFiberLogStrainPa).toBeGreaterThan(0);
    expect(Math.abs(output.stateResidual)).toBeLessThan(1e-14);
    expect(output.physicalDissipationIncrementDensityJPerM3).toBeGreaterThan(0);
    expect(output.backwardEulerNumericalDissipationIncrementDensityJPerM3)
      .toBeGreaterThan(0);
    expect(Math.abs(output.discreteEnergyBalanceResidualJPerM3)).toBeLessThan(1e-10);
    expect(output.passive).toBe(true);
  });

  it("relaxes its overstress at fixed strain without changing the equilibrium owner", () => {
    let state = initialParallelOneStateSlsStateV1(0);
    let previousStrain = 0;
    let peak = 0;
    for (let index = 0; index < 100; index += 1) {
      const nextStrain = 0.1;
      const output = stepParallelOneStateSlsBackwardEulerV1(
        state,
        { previousFiberLogStrain: previousStrain, nextFiberLogStrain: nextStrain, dtSec: 0.005 },
        PARAMS,
      );
      if (index === 0) peak = output.nextOverstressPa;
      state = output.state;
      previousStrain = nextStrain;
      if (index === 99) {
        expect(Math.abs(output.nextOverstressPa)).toBeLessThan(peak * 1e-3);
      }
    }
  });
});
