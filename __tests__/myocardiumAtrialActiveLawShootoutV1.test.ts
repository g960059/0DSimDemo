import { describe, expect, it } from "vitest";

import {
  DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1,
  commitLand2017ActiveOnlyTrialV1,
  initialLand2017ActiveOnlyStateV1,
  land2017IsometricSteadyStateV1,
  trialLand2017ActiveOnlyV1,
} from "@/engine/mechanics2/activation/Land2017ActiveOnlyV1";
import {
  runAtrialActiveLawShootoutBenchV1,
} from "@/engine/mechanics2/benches/AtrialActiveLawShootoutBenchV1";
import {
  DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
  hillCeForceVelocityFactorV1,
  type HillCeSeeSlsParamsV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  LAND_NIEDERER_2018_ATRIAL_CALIBRATION_SOURCE_ID,
  LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1,
} from "@/engine/myocardium/atrialLandNiederer2018";
import { writeLand2017Rhs } from
  "@/engine/myocardium/myofilament/land2017";
import sourcesRegistry from "@/data/myocardium/sources.json";

describe("atrial active-law component shootout V1", () => {
  it("uses a pure active-only Land trial with explicit work-conjugate readback", () => {
    const previous = initialLand2017ActiveOnlyStateV1(0.08, 0.1);
    const before = Array.from(previous.landState);
    const trial = trialLand2017ActiveOnlyV1(previous, {
      dtSec: 0.001,
      fiberLogStrain: 0.079,
      freeCalciumUm: 0.11,
    });

    expect(trial.valid).toBe(true);
    expect(trial.finite).toBe(true);
    expect(trial.nextState).not.toBeNull();
    expect(trial.readback).not.toBeNull();
    expect(Array.from(previous.landState)).toEqual(before);
    expect(trial.readback!.claim.externalSeriesElasticElementAdded).toBe(false);
    expect(trial.readback!.claim.postHocForceVelocityMultiplierAdded).toBe(false);
    expect(trial.readback!.claim.activeStressGainAdded).toBe(false);
    expect(Math.abs(trial.readback!.continuousPowerResidualWPerM3)).toBeLessThan(
      1e-8,
    );
    expect(Math.abs(trial.readback!.discretePowerResidualWPerM3)).toBeLessThan(
      1e-8,
    );
    expect(
      Math.abs(trial.readback!.sourceReportedPowerResidualWPerM3),
    ).toBeLessThan(1e-8);
    expect(
      Math.abs(trial.readback!.finiteDifferenceWorkConjugacyResidualPa),
    ).toBeLessThan(1e-5);
    expect(trial.readback!.health.projectionUsed).toBe(false);
    const committed = commitLand2017ActiveOnlyTrialV1(trial);
    expect(committed.landState).not.toBe(trial.nextState!.landState);
    expect(Object.isFrozen(committed.landState)).toBe(true);
    expect(() => {
      (committed.landState as number[])[0] = 0;
    }).toThrow();
    expect(DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1.parameterPackId).toBe(
      "land-niederer-2018-human-atrial-literature-prior-v1",
    );
    expect(
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1
        .crossbridgeCyclingMapping.derivedKsuScale,
    ).toBe(3);
    const effectiveRows = Object.fromEntries(
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1
        .effectiveParameterProvenance.map((row) => [row.parameter, row]),
    );
    expect(effectiveRows.ksu).toMatchObject({
      baseValue: 18,
      effectiveValue: 54,
    });
    expect(effectiveRows.kwu).toMatchObject({
      baseValue: 170,
      effectiveValue: 146,
    });
    expect(effectiveRows.cs.effectiveValue).toBeCloseTo(120.42, 10);
    expect(
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1
        .parameterPackStableHash,
    ).toMatch(/^[0-9a-f]{8}$/);
    const atrialSource = sourcesRegistry.sources.find((source) =>
      source.id === LAND_NIEDERER_2018_ATRIAL_CALIBRATION_SOURCE_ID
    );
    expect(atrialSource).toMatchObject({
      verificationStatus: "verified",
      normativeForPhaseA: false,
      doi: "10.1002/cnm.2931",
    });
  });

  it("constructs a zero-rate Land equilibrium across atrial Ca and length", () => {
    const parameterSet =
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1
        .effectiveEquationParameters;
    for (const freeCalciumUm of [0.05, 0.1, 0.6, 0.9]) {
      for (const landStretch of [0.9, 1, 1.1, 1.19]) {
        const state = land2017IsometricSteadyStateV1(
          landStretch,
          freeCalciumUm,
          parameterSet,
        );
        const rhs = writeLand2017Rhs(state, {
          freeCalciumUM: freeCalciumUm,
          fiberEngineeringStrain: landStretch - 1,
          fiberEngineeringStrainRatePerSec: 0,
        }, parameterSet);
        expect(Math.max(...Array.from(rhs, Math.abs))).toBeLessThan(1e-10);
      }
    }
  });

  it("keeps the near-unity fV arm within its preregistered diagnostic limit", () => {
    const unity: HillCeSeeSlsParamsV1 = {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      contractileElement: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.contractileElement,
        hillCurvatureRatio: 1e6,
        maximumShorteningVelocityPerSec: 1e9,
        maximumLengtheningForceVelocityFactor: 1,
      },
    };
    for (const velocity of [-100, -2, -0.5, 0, 0.5, 2, 100]) {
      expect(Math.abs(hillCeForceVelocityFactorV1(velocity, unity) - 1))
        .toBeLessThanOrEqual(1e-6);
    }
  });

  it("reproduces the lag-plus-instantaneous-fV late-recovery signature without ranking physiology", () => {
    const report = runAtrialActiveLawShootoutBenchV1({
      dtSec: 0.001,
      warmupCycles: 3,
      includeDtRefinement: false,
    });

    expect(report.results).toHaveLength(20);
    expect(report.decision).toBe("no-winner-selected");
    expect(report.claimBoundary.automaticWinnerSelection).toBe(false);
    expect(report.numericalGates.allNumericalGatesPass).toBe(true);

    const causal = (variantId: string) => report.results.find((row) =>
      row.variantId === variantId &&
      row.protocolId === "a-wave-shortening-stop"
    )!;
    const lag = causal("hill-lag25-classical-fv");
    const algebraic = causal("hill-algebraic-classical-fv");
    const unity = causal("hill-algebraic-fv-near-unity");
    const lagUnity = causal("hill-lag25-fv-near-unity");
    const land = causal("land2017-atrial-active-only");

    expect(lag.peakActiveStressPhase01).toBeGreaterThan(0.3);
    expect(
      lag.velocityStopDiagnostics.remainingShorteningAtGlobalStressPeak01,
    ).toBe(0);
    expect(
      lag.velocityStopDiagnostics.postStopGainNormalizedByPeak,
    ).toBeGreaterThan(0.02);
    expect(
      algebraic.velocityStopDiagnostics
        .remainingShorteningAtGlobalStressPeak01,
    ).toBeGreaterThan(0.5);
    expect(
      unity.velocityStopDiagnostics.remainingShorteningAtGlobalStressPeak01,
    ).toBeGreaterThan(0.5);
    expect(lagUnity.trace.every((sample) =>
      sample.forceVelocityFactor != null &&
      Math.abs(sample.forceVelocityFactor - 1) <= 1e-6
    )).toBe(true);
    expect(lagUnity.peakActiveStressPhase01).toBeLessThan(0.3);
    expect(
      lagUnity.velocityStopDiagnostics.remainingShorteningAtGlobalStressPeak01,
    ).toBeGreaterThan(0.4);
    expect(
      land.velocityStopDiagnostics.remainingShorteningAtGlobalStressPeak01,
    ).toBeGreaterThan(0.4);
    expect(unity.trace.every((sample) =>
      sample.forceVelocityFactor != null &&
      Math.abs(sample.forceVelocityFactor - 1) <= 1e-6
    )).toBe(true);
    expect(land.landProjectionOccurred).toBe(false);
    expect(report.factorialDesign.hillTwoByTwoComplete).toBe(true);
    expect(report.factorialContrasts.peakPhase.differenceInDifferences)
      .toBeGreaterThan(0.08);
    expect(report.factorialContrasts.postStopGainKPa.differenceInDifferences)
      .toBeGreaterThan(0.5);
    expect(report.claimBoundary.landNiedererPaperBaselineReproduced).toBe(
      false,
    );
    expect(report.protocol.commonBenchCalciumRangeUM.maximum).toBeGreaterThan(
      report.protocol.landNiedererPaperCalibrationCalciumContext.peakUM,
    );
  });
});
