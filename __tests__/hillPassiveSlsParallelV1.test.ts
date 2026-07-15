import { describe, expect, it } from "vitest";

import {
  DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1,
  commitHillPassiveSlsParallelTrialV1,
  initialHillPassiveSlsParallelStateV1,
  trialHillPassiveSlsParallelV1,
} from "@/engine/mechanics2/constitutive/HillPassiveSlsParallelV1";
import {
  DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
  evaluateHillPassiveEquilibriumV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";

describe("HillPassiveSlsParallelV1", () => {
  it("retains the PR467 equilibrium-passive law without CE or SEE state", () => {
    const previous = initialHillPassiveSlsParallelStateV1(0.01);
    const trial = trialHillPassiveSlsParallelV1(
      previous,
      { dtSec: 0.005, totalStrain: 0.03 },
      DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1,
    );
    const passive = evaluateHillPassiveEquilibriumV1(
      0.03,
      DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
    );
    expect(trial.valid).toBe(true);
    expect(trial.readback).not.toBeNull();
    expect(passive.valid).toBe(true);
    expect(trial.readback!.passiveEquilibriumStressPa).toBe(passive.stressPa);
    expect(trial.readback!.claim.contractileElementEvaluated).toBe(false);
    expect(trial.readback!.claim.seriesElasticElementEvaluated).toBe(false);
    expect(trial.nextState).not.toHaveProperty("ceStrain");
    expect(trial.nextState).not.toHaveProperty("caTroponin01");
  });

  it("satisfies the backward-Euler SLS work balance and explicit commit", () => {
    const previous = initialHillPassiveSlsParallelStateV1(0, 200);
    const trial = trialHillPassiveSlsParallelV1(
      previous,
      { dtSec: 0.005, totalStrain: 0.02 },
      DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1,
    );
    expect(trial.valid).toBe(true);
    expect(
      Math.abs(trial.readback!.slsBalance.discreteBalanceResidualJPerM3),
    ).toBeLessThan(1e-12);
    expect(
      trial.readback!.slsBalance.physicalRelaxationDissipationJPerM3,
    ).toBeGreaterThanOrEqual(0);
    expect(
      trial.readback!.slsBalance.backwardEulerNumericalDissipationJPerM3,
    ).toBeGreaterThanOrEqual(0);
    const committed = commitHillPassiveSlsParallelTrialV1(trial);
    expect(committed).not.toBe(trial.nextState);
    expect(previous).toEqual({ totalStrain: 0, slsOverstressPa: 200 });
  });

  it("rejects ghost overstress when the SLS branch is disabled", () => {
    const material = {
      ...DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1,
      sls: {
        ...DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1.sls,
        enabled: false,
      },
    };
    const trial = trialHillPassiveSlsParallelV1(
      initialHillPassiveSlsParallelStateV1(0, 1),
      { dtSec: 0.005, totalStrain: 0.01 },
      material,
    );
    expect(trial.valid).toBe(false);
    expect(trial.issues.join(" ")).toContain("disabled SLS");
  });

  it("exposes only provenance, passive, and SLS fields", () => {
    expect(Object.keys(DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1).sort()).toEqual(
      ["parameterSetId", "passive", "sls"],
    );
    expect(DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1.parameterSetId).toBe(
      DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.parameterSetId,
    );
    expect(DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1).not.toHaveProperty(
      "contractileElement",
    );
    expect(DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1).not.toHaveProperty(
      "seriesElasticElement",
    );
    expect(DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1).not.toHaveProperty(
      "calciumTroponinActivation",
    );
  });
});
