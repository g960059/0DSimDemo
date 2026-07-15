import { describe, expect, it } from "vitest";

import {
  DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
  commitEquilibriumPassiveSlsParallelTrialV1,
  evaluateEquilibriumPassiveStressV1,
  initialEquilibriumPassiveSlsParallelStateV1,
  prepareEquilibriumPassiveSlsParallelParamsV1,
  trialEquilibriumPassiveSlsParallelV1,
} from "@/engine/mechanics2/constitutive/EquilibriumPassiveSlsParallelV1";
import {
  DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
  evaluateHillPassiveEquilibriumV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";

describe("EquilibriumPassiveSlsParallelV1", () => {
  it("derives passive stress and tangent from the stored-energy law", () => {
    const params = DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1.passive;
    const strain = 0.08;
    const h = 1e-6;
    const centre = evaluateEquilibriumPassiveStressV1(strain, params);
    const plus = evaluateEquilibriumPassiveStressV1(strain + h, params);
    const minus = evaluateEquilibriumPassiveStressV1(strain - h, params);
    expect(centre.valid && plus.valid && minus.valid).toBe(true);
    if (!centre.valid || !plus.valid || !minus.valid) return;
    const energyDerivative =
      (plus.storageJPerM3 - minus.storageJPerM3) / (2 * h);
    const stressDerivative = (plus.stressPa - minus.stressPa) / (2 * h);
    expect(energyDerivative).toBeCloseTo(centre.stressPa, 5);
    expect(stressDerivative).toBeCloseTo(centre.tangentPa, 5);
  });

  it("preserves the accepted V2 equilibrium-passive equation exactly", () => {
    for (const strain of [-0.08, -0.001, 0, 0.005, 0.02, 0.08, 0.15]) {
      const standalone = evaluateEquilibriumPassiveStressV1(
        strain,
        DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1.passive,
      );
      const legacy = evaluateHillPassiveEquilibriumV1(
        strain,
        DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      );
      expect(standalone.valid).toBe(true);
      expect(legacy.valid).toBe(true);
      if (!standalone.valid || !legacy.valid) continue;
      expect(standalone.stressPa).toBe(legacy.stressPa);
      expect(standalone.tangentPa).toBe(legacy.tangentPa);
      expect(standalone.storageJPerM3).toBe(legacy.storageJPerM3);
    }
  });

  it("satisfies the one-state SLS backward-Euler work balance", () => {
    const previous = initialEquilibriumPassiveSlsParallelStateV1(0, 200);
    const trial = trialEquilibriumPassiveSlsParallelV1(
      previous,
      { dtSec: 0.005, totalStrain: 0.02 },
      DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
    );
    expect(trial.valid).toBe(true);
    expect(trial.readback).not.toBeNull();
    expect(
      Math.abs(trial.readback!.slsBalance.discreteBalanceResidualJPerM3),
    ).toBeLessThan(1e-12);
    expect(
      trial.readback!.slsBalance.physicalRelaxationDissipationJPerM3,
    ).toBeGreaterThanOrEqual(0);
    expect(
      trial.readback!.slsBalance.backwardEulerNumericalDissipationJPerM3,
    ).toBeGreaterThanOrEqual(0);
    const committed = commitEquilibriumPassiveSlsParallelTrialV1(trial);
    expect(committed).not.toBe(trial.nextState);
    expect(previous).toEqual({ totalStrain: 0, slsOverstressPa: 200 });
  });

  it("keeps SLS-off as an exact nested zero-state model", () => {
    const params = prepareEquilibriumPassiveSlsParallelParamsV1({
      ...DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
      parameterSetId: "passive-sls-off-test-v1",
      sls: {
        ...DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1.sls,
        enabled: false,
        modulusPa: 0,
      },
    });
    const trial = trialEquilibriumPassiveSlsParallelV1(
      initialEquilibriumPassiveSlsParallelStateV1(0),
      { dtSec: 0.005, totalStrain: 0.03 },
      params,
    );
    expect(trial.valid).toBe(true);
    expect(trial.nextState!.slsOverstressPa).toBe(0);
    expect(trial.readback!.slsAlgorithmicTangentPa).toBe(0);
    expect(trial.readback!.slsStorageJPerM3).toBe(0);
    expect(Object.values(trial.readback!.slsBalance).every((value) =>
      value === 0
    )).toBe(true);
  });

  it("owns no active, calcium, CE, or SEE parameters", () => {
    expect(
      Object.keys(DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1).sort(),
    ).toEqual(["parameterSetId", "passive", "sls"]);
    expect(DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1).not.toHaveProperty(
      "active",
    );
    expect(DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1).not.toHaveProperty(
      "contractileElement",
    );
    expect(DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1).not.toHaveProperty(
      "seriesElasticElement",
    );
    expect(DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1).not.toHaveProperty(
      "calciumTroponinActivation",
    );
  });

  it("rejects ghost overstress when the SLS branch is disabled", () => {
    const params = prepareEquilibriumPassiveSlsParallelParamsV1({
      ...DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
      parameterSetId: "passive-sls-off-ghost-test-v1",
      sls: {
        ...DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1.sls,
        enabled: false,
      },
    });
    const trial = trialEquilibriumPassiveSlsParallelV1(
      initialEquilibriumPassiveSlsParallelStateV1(0, 1),
      { dtSec: 0.005, totalStrain: 0.01 },
      params,
    );
    expect(trial.valid).toBe(false);
    expect(trial.issues.join(" ")).toContain("disabled SLS");
  });
});
