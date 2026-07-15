import { describe, expect, it } from "vitest";

import {
  DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1,
  DEFAULT_LAND2017_VENTRICULAR_ACTIVE_ONLY_PARAMS_V1,
  createLand2017AtrialActiveOnlyParamsV1,
  createLand2017VentricularActiveOnlyParamsV1,
} from "@/engine/mechanics2/activation/LiteratureLand2017ActiveOnlyParamsV1";
import { DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1 } from "@/engine/mechanics2/constitutive/EquilibriumPassiveSlsParallelV1";
import {
  LAND_ACTIVE_PASSIVE_SLS_CLAIM_V1,
  LAND_ACTIVE_PASSIVE_SLS_V1_ID,
  commitLandActivePassiveSlsTrialV1,
  initialLandActivePassiveSlsStateV1,
  prepareLandActivePassiveSlsParamsV1,
  trialLandActivePassiveSlsV1,
} from "@/engine/mechanics2/constitutive/LandActivePassiveSlsV1";

describe("LandActivePassiveSlsV1", () => {
  it("provides provenance-locked atrial and ventricular active defaults", () => {
    expect(DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1.parameterPackId).toBe(
      "land-niederer-2018-human-atrial-literature-prior-v1",
    );
    expect(
      DEFAULT_LAND2017_VENTRICULAR_ACTIVE_ONLY_PARAMS_V1.parameterPackId,
    ).toBe("land2017-intact-human-37c-source-v1");
    expect(
      DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1.parameterPackStableHash,
    ).not.toBe(
      DEFAULT_LAND2017_VENTRICULAR_ACTIVE_ONLY_PARAMS_V1.parameterPackStableHash,
    );

    const atrial = createLand2017AtrialActiveOnlyParamsV1({
      lambdaLandSlack: 0.98,
      solveOptions: { substeps: 6 },
    });
    const ventricular = createLand2017VentricularActiveOnlyParamsV1({
      lambdaLandSlack: 1.02,
      solveOptions: { substeps: 2 },
    });
    expect(atrial.parameterPackId).toBe(
      DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1.parameterPackId,
    );
    expect(atrial.parameterPackStableHash).toBe(
      DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1.parameterPackStableHash,
    );
    expect(atrial.lambdaLandSlack).toBe(0.98);
    expect(atrial.solveOptions.substeps).toBe(6);
    expect(ventricular.parameterPackId).toBe(
      DEFAULT_LAND2017_VENTRICULAR_ACTIVE_ONLY_PARAMS_V1.parameterPackId,
    );
    expect(ventricular.lambdaLandSlack).toBe(1.02);
    expect(ventricular.solveOptions.substeps).toBe(2);
    expect(Object.isFrozen(atrial.solveOptions)).toBe(true);
    expect(() =>
      createLand2017VentricularActiveOnlyParamsV1({
        solveOptions: {
          previousFreeCalciumUM: 0.1,
        } as never,
      }),
    ).toThrow(/does not accept state\/history option/);
  });

  it("combines Land active, equilibrium passive, and SLS without CE or SEE", () => {
    const params = makeMaterial("atrial-composite-test-v1");
    const previous = initialLandActivePassiveSlsStateV1(0.04, 0.1, params);
    const before = JSON.stringify(previous);
    const trial = trialLandActivePassiveSlsV1(
      previous,
      {
        dtSec: 0.001,
        fiberLogStrain: 0.039,
        freeCalciumUm: 0.11,
      },
      params,
    );
    const repeated = trialLandActivePassiveSlsV1(
      previous,
      {
        dtSec: 0.001,
        fiberLogStrain: 0.039,
        freeCalciumUm: 0.11,
      },
      params,
    );
    expect(trial.valid).toBe(true);
    expect(trial.finite).toBe(true);
    expect(repeated.nextState).toEqual(trial.nextState);
    expect(JSON.stringify(previous)).toBe(before);
    expect(trial.nextState!.kind).toBe(LAND_ACTIVE_PASSIVE_SLS_V1_ID);
    expect(trial.nextState!.active.previousFiberLogStrain).toBe(
      trial.nextState!.passiveSls.totalStrain,
    );
    const stresses = trial.readback!.stresses;
    expect(stresses.totalTransmittedPa).toBeCloseTo(
      stresses.passiveEquilibriumPa +
        stresses.effectiveTransmittedActivePa +
        stresses.slsOverstressPa,
      12,
    );
    expect(stresses.mappedCellularLandActivePa).toBe(
      trial.activeTrial.readback!.wallActiveKirchhoffStressPa,
    );
    expect(stresses.effectiveTransmittedActivePa).toBe(
      stresses.mappedCellularLandActivePa,
    );
    expect(params.activeHomogenizationScale).toBe(1);
    expect(trial.readback!.activation01).toBe(
      trial.activeTrial.readback!.state.CaTRPN,
    );
    expect(
      trial.activeTrial.readback!.claim.externalSeriesElasticElementAdded,
    ).toBe(false);
    expect(
      trial.activeTrial.readback!.claim.postHocForceVelocityMultiplierAdded,
    ).toBe(false);
    expect(trial.activeTrial.readback!.claim.activeStressGainAdded).toBe(false);
    expect(
      LAND_ACTIVE_PASSIVE_SLS_CLAIM_V1.sourceLandTrefOrKineticsModifiedByComposite,
    ).toBe(false);
    expect(
      Math.abs(
        trial.passiveSlsTrial.readback!.slsBalance
          .discreteBalanceResidualJPerM3,
      ),
    ).toBeLessThan(1e-12);
    const committed = commitLandActivePassiveSlsTrialV1(trial);
    expect(committed.active.landState).not.toBe(
      trial.activeTrial.nextState!.landState,
    );
    expect(committed.passiveSls).not.toBe(trial.passiveSlsTrial.nextState);
    expect(previous).not.toHaveProperty("ceStrain");
    expect(params).not.toHaveProperty("contractileElement");
    expect(params).not.toHaveProperty("seriesElasticElement");
  });

  it("requires a cold state after any effective material change", () => {
    const params = makeMaterial("identity-a-v1");
    const previous = initialLandActivePassiveSlsStateV1(0.04, 0.1, params);
    const changed = makeMaterial("identity-b-v1");
    const trial = trialLandActivePassiveSlsV1(
      previous,
      {
        dtSec: 0.001,
        fiberLogStrain: 0.039,
        freeCalciumUm: 0.11,
      },
      changed,
    );
    expect(trial.valid).toBe(false);
    expect(trial.issues.join(" ")).toMatch(/cold initialization/);
  });

  it("applies an explicit homogenization scale to effective stress and work without changing source Land", () => {
    const unit = makeMaterial("homogenization-identity-v1", 1);
    const doubled = makeMaterial("homogenization-identity-v1", 2);
    const input = {
      dtSec: 0.001,
      fiberLogStrain: 0.039,
      freeCalciumUm: 0.11,
    } as const;
    const unitTrial = trialLandActivePassiveSlsV1(
      initialLandActivePassiveSlsStateV1(0.04, 0.1, unit),
      input,
      unit,
    );
    const doubledTrial = trialLandActivePassiveSlsV1(
      initialLandActivePassiveSlsStateV1(0.04, 0.1, doubled),
      input,
      doubled,
    );
    expect(unitTrial.valid).toBe(true);
    expect(doubledTrial.valid).toBe(true);
    expect(doubledTrial.activeTrial.readback).toEqual(
      unitTrial.activeTrial.readback,
    );
    expect(doubled.active.parameterSet.values.Tref).toBe(
      unit.active.parameterSet.values.Tref,
    );
    expect(doubledTrial.readback!.stresses.mappedCellularLandActivePa).toBe(
      unitTrial.readback!.stresses.mappedCellularLandActivePa,
    );
    expect(
      doubledTrial.readback!.stresses.effectiveTransmittedActivePa,
    ).toBeCloseTo(
      2 * unitTrial.readback!.stresses.effectiveTransmittedActivePa,
      12,
    );
    expect(
      doubledTrial.readback!.activeWork.discreteEffectiveWallPowerDensityWPerM3,
    ).toBeCloseTo(
      2 *
        unitTrial.readback!.activeWork.discreteEffectiveWallPowerDensityWPerM3,
      12,
    );
    expect(
      doubledTrial.readback!.activeWork.discretePowerResidualWPerM3,
    ).toBeCloseTo(
      2 * unitTrial.readback!.activeWork.discretePowerResidualWPerM3,
      12,
    );

    const wrongIdentityTrial = trialLandActivePassiveSlsV1(
      initialLandActivePassiveSlsStateV1(0.04, 0.1, unit),
      input,
      doubled,
    );
    expect(wrongIdentityTrial.valid).toBe(false);
    expect(wrongIdentityTrial.issues.join(" ")).toMatch(/cold initialization/);
  });

  it("rejects nonpositive scales and composite overflow", () => {
    expect(() => makeMaterial("zero-scale-v1", 0)).toThrow(
      /activeHomogenizationScale must be positive and finite/,
    );
    const extreme = makeMaterial("extreme-scale-v1", Number.MAX_VALUE);
    const previous = initialLandActivePassiveSlsStateV1(0.04, 0.1, extreme);
    const trial = trialLandActivePassiveSlsV1(
      previous,
      {
        dtSec: 0.001,
        fiberLogStrain: 0.039,
        freeCalciumUm: 0.11,
      },
      extreme,
    );
    expect(trial.valid).toBe(false);
    expect(trial.finite).toBe(false);
    expect(trial.readback).toBeNull();
    expect(trial.issues.join(" ")).toMatch(/composite.*non-finite/);
  });

  it("rejects an equation parameter set with a stale provenance hash", () => {
    const base = DEFAULT_LAND2017_VENTRICULAR_ACTIVE_ONLY_PARAMS_V1;
    const stale = {
      ...base,
      parameterSet: {
        ...base.parameterSet,
        values: {
          ...base.parameterSet.values,
          Tref: base.parameterSet.values.Tref * 1.01,
        },
      },
    };
    expect(() =>
      prepareLandActivePassiveSlsParamsV1({
        materialId: "stale-active-pack-v1",
        active: stale,
        passiveSls: DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
      }),
    ).toThrow(/provenance hash is stale/);
  });

  it("rejects forged or cross-wired active pack provenance", () => {
    const ventricular = DEFAULT_LAND2017_VENTRICULAR_ACTIVE_ONLY_PARAMS_V1;
    expect(() =>
      prepareLandActivePassiveSlsParamsV1({
        materialId: "forged-pack-hash-v1",
        active: {
          ...ventricular,
          parameterPackStableHash: "forged",
        },
        passiveSls: DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
      }),
    ).toThrow(/parameter-pack provenance hash.*recognized registry/);
    expect(() =>
      prepareLandActivePassiveSlsParamsV1({
        materialId: "cross-wired-pack-v1",
        active: {
          ...ventricular,
          parameterSet:
            DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1.parameterSet,
        },
        passiveSls: DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
      }),
    ).toThrow(/nested equation parameter-set hash/);
    expect(() =>
      prepareLandActivePassiveSlsParamsV1({
        materialId: "unknown-pack-v1",
        active: {
          ...ventricular,
          parameterPackId: "unknown-land-pack-v1",
        },
        passiveSls: DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
      }),
    ).toThrow(/unrecognized Land active parameter pack/);
  });
});

function makeMaterial(materialId: string, activeHomogenizationScale?: number) {
  return prepareLandActivePassiveSlsParamsV1({
    materialId,
    active: DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1,
    ...(activeHomogenizationScale == null ? {} : { activeHomogenizationScale }),
    passiveSls: {
      ...DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1,
      parameterSetId: `${materialId}-passive-sls`,
    },
  });
}
