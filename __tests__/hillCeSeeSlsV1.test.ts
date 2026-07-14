import { describe, expect, it } from "vitest";
import {
  initialLandFormCaTroponinActivationStateV1,
  trialLandFormCaTroponinActivationMidpointV2,
} from "@/engine/mechanics2/activation/LandFormCaTroponinActivationV1";
import {
  DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
  HILL_CE_SEE_SLS_KINEMATIC_CLAIM_V1,
  commitHillCeSeeSlsTrialV1,
  hillCeClassicalShorteningVelocityFromForceFactorV1,
  hillCeForceVelocityFactorV1,
  hillCeLengthFactorV1,
  initialHillCeSeeSlsStateV1,
  prepareHillCeSeeSlsParamsV1,
  trialHillCeSeeSlsV1,
  validateHillCeSeeSlsParamsV1,
  type HillCeSeeSlsParamsV1,
  type HillCeSeeSlsTrialInputV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";

describe("HillCeSeeSlsV1", () => {
  it("enforces CE--SEE serial topology and uses calcium-derived activation without double-counting tension", () => {
    const trial = trialHillCeSeeSlsV1(initialHillCeSeeSlsStateV1(0), {
      dtSec: 0.004,
      totalStrain: 0.08,
      freeCalciumUm: 0.8,
    });

    expect(trial.valid).toBe(true);
    expect(trial.finite).toBe(true);
    expect(trial.solver.converged).toBe(true);
    expect(
      trial.readback.strains.contractileElement +
        trial.readback.strains.seriesElasticElement,
    ).toBe(trial.readback.strains.total);
    expect(trial.solver.absoluteResidualPa).toBeLessThan(2e-6);

    const stress = trial.readback.stresses;
    expect(stress.contractileElementTensionPa).toBeGreaterThan(0);
    expect(stress.seriesElasticTensionPa).toBeGreaterThan(0);
    expect(stress.totalTransmittedPa).toBe(
      stress.passiveEquilibriumPa +
        stress.seriesElasticTensionPa +
        stress.slsOverstressPa,
    );
    expect(stress.totalTransmittedPa).not.toBe(
      stress.passiveEquilibriumPa +
        stress.contractileElementTensionPa +
        stress.seriesElasticTensionPa +
        stress.slsOverstressPa,
    );
    expect(trial.readback.freeCalciumUm).toBe(0.8);
    expect(trial.readback.caTroponin01).toBeGreaterThan(0);
    expect(trial.readback.activation01).toBeGreaterThan(0);
    expect(trial.readback.activation01).toBe(
      trial.readback.thinFilamentAvailability01,
    );
    expect(trial.readback.calciumTroponinActivation).not.toBeNull();
    expect(trial.readback.kinematicClaim).toBe(
      HILL_CE_SEE_SLS_KINEMATIC_CLAIM_V1,
    );
    expect(trial.readback.kinematicClaim.stretchDecomposition).toBe(
      "lambda=lambda_CE*lambda_SE",
    );
    expect(trial.readback.kinematicClaim.prescribedFreeCalciumInput).toBe(true);
    expect(
      trial.readback.kinematicClaim.caTroponinUpdatedInsideSerialEquilibrium,
    ).toBe(true);
    expect(trial.readback.serialWork.activeChemicalEnergyModelled).toBe(false);
    expect(trial.readback.serialWork.activeChemicalEnergyClaim).toBe(
      "unmodelled-in-v1",
    );
    expect(
      trial.readback.kinematicClaim.materialParametersMayChangeWithinTrajectory,
    ).toBe(false);
    expect(trial.nextState).not.toHaveProperty("thinFilamentAvailability01");
    expect(
      trial.readback.calciumTroponinActivation?.thinFilamentDynamicsMode,
    ).toBe("algebraic-equilibrium");
  });

  it("has a finite unloaded shortening velocity and an invertible classical Hill branch", () => {
    const params = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1;
    const ce = params.contractileElement;
    const vmax = ce.maximumShorteningVelocityPerSec;

    expect(hillCeForceVelocityFactorV1(-2 * vmax, params)).toBe(0);
    expect(hillCeForceVelocityFactorV1(-vmax, params)).toBe(0);
    expect(hillCeForceVelocityFactorV1(-0.999 * vmax, params)).toBeGreaterThan(
      0,
    );
    expect(hillCeForceVelocityFactorV1(0, params)).toBe(1);
    expect(hillCeForceVelocityFactorV1(1, params)).toBeGreaterThan(1);
    expect(hillCeForceVelocityFactorV1(100, params)).toBeLessThanOrEqual(
      ce.maximumLengtheningForceVelocityFactor,
    );

    for (const forceFactor of [0, 0.2, 0.5, 0.8, 1]) {
      const velocity = hillCeClassicalShorteningVelocityFromForceFactorV1(
        forceFactor,
        params,
      );
      expect(velocity).toBeGreaterThanOrEqual(-vmax);
      expect(velocity).toBeLessThanOrEqual(0);
      expect(hillCeForceVelocityFactorV1(velocity, params)).toBeCloseTo(
        forceFactor,
        12,
      );
    }

    const delta = 1e-8;
    for (const join of [
      -vmax,
      -vmax + ce.unloadedTransitionWidthPerSec,
      -ce.forceVelocityTransitionHalfWidthPerSec,
      0,
      ce.forceVelocityTransitionHalfWidthPerSec,
    ]) {
      const leftSlope =
        (hillCeForceVelocityFactorV1(join, params) -
          hillCeForceVelocityFactorV1(join - delta, params)) /
        delta;
      const rightSlope =
        (hillCeForceVelocityFactorV1(join + delta, params) -
          hillCeForceVelocityFactorV1(join, params)) /
        delta;
      expect(Math.abs(leftSlope - rightSlope)).toBeLessThan(2e-5);
    }

    const lengthSamples = Array.from(
      { length: 801 },
      (_, index) => -2 + index * 0.005,
    ).map((strain) => hillCeLengthFactorV1(strain, params));
    expect(Math.min(...lengthSamples)).toBeGreaterThanOrEqual(
      ce.minimumLengthFactor,
    );
    expect(Math.max(...lengthSamples)).toBeLessThanOrEqual(
      ce.maximumLengthFactor,
    );
  });

  it("evaluates and commits the Land-form CaTRPN endpoint at the selected CE root", () => {
    const accepted = initialHillCeSeeSlsStateV1(0.01, -0.01, 0, 0.17);
    const input = {
      dtSec: 0.006,
      totalStrain: 0.07,
      freeCalciumUm: 0.75,
    } as const;
    const trial = trialHillCeSeeSlsV1(accepted, input);

    expect(trial.valid).toBe(true);
    const standalone = trialLandFormCaTroponinActivationMidpointV2(
      initialLandFormCaTroponinActivationStateV1(accepted.caTroponin01),
      {
        dtSec: input.dtSec,
        midpointFreeCalciumUm: input.freeCalciumUm,
        previousContractileElementLogStrain: accepted.ceStrain,
        nextContractileElementLogStrain: trial.nextState.ceStrain,
      },
      DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.calciumTroponinActivation,
    );
    expect(standalone.valid).toBe(true);
    expect(standalone.nextState).not.toBeNull();
    expect(standalone.readback).not.toBeNull();
    expect(trial.nextState.caTroponin01).toBeCloseTo(
      standalone.nextState!.caTroponin01,
      15,
    );
    expect(trial.readback.caTroponin01).toBeCloseTo(
      standalone.readback!.caTroponin01,
      15,
    );
    expect(trial.readback.activation01).toBeCloseTo(
      standalone.readback!.thinFilamentAvailability01,
      15,
    );
    expect(trial.readback.calciumTroponinActivation).toEqual(
      standalone.readback,
    );

    const committed = commitHillCeSeeSlsTrialV1(trial);
    expect(committed.caTroponin01).toBe(trial.nextState.caTroponin01);
    expect(committed).not.toBe(trial.nextState);
    expect(Object.isFrozen(committed)).toBe(true);
  });

  it("retains residual CaTRPN activation during deactivation and does not substitute free Ca for force", () => {
    const dtSec = 0.01;
    const accepted = initialHillCeSeeSlsStateV1(0.03, 0.03, 0, 0.8);
    const firstOff = trialHillCeSeeSlsV1(accepted, {
      dtSec,
      totalStrain: 0.03,
      freeCalciumUm: 0,
    });

    expect(firstOff.valid).toBe(true);
    expect(firstOff.readback.freeCalciumUm).toBe(0);
    expect(firstOff.nextState.caTroponin01).toBeGreaterThan(0);
    expect(firstOff.nextState.caTroponin01).toBeLessThan(accepted.caTroponin01);
    expect(firstOff.readback.activation01).toBeGreaterThan(0);
    expect(
      firstOff.readback.stresses.contractileElementTensionPa,
    ).toBeGreaterThan(0);

    const secondOff = trialHillCeSeeSlsV1(commitHillCeSeeSlsTrialV1(firstOff), {
      dtSec,
      totalStrain: 0.03,
      freeCalciumUm: 0,
    });
    expect(secondOff.valid).toBe(true);
    expect(secondOff.nextState.caTroponin01).toBeLessThan(
      firstOff.nextState.caTroponin01,
    );
    expect(secondOff.readback.activation01).toBeLessThan(
      firstOff.readback.activation01,
    );

    const fullyUnbound = trialHillCeSeeSlsV1(initialHillCeSeeSlsStateV1(0.03), {
      dtSec,
      totalStrain: 0.03,
      freeCalciumUm: 0,
    });
    expect(fullyUnbound.valid).toBe(true);
    expect(fullyUnbound.nextState.caTroponin01).toBe(0);
    expect(fullyUnbound.readback.activation01).toBe(0);
    expect(fullyUnbound.readback.stresses.contractileElementTensionPa).toBe(0);
  });

  it("shifts the calcium-force response left at longer CE length through CaT50", () => {
    const params: HillCeSeeSlsParamsV1 = {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      contractileElement: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.contractileElement,
        lengthWidth: 1,
      },
    };
    const freeCalciumUm = 0.55;
    const short = trialHillCeSeeSlsV1(
      initialHillCeSeeSlsStateV1(-0.08, -0.08),
      {
        dtSec: 0.01,
        totalStrain: -0.08,
        freeCalciumUm,
      },
      params,
    );
    const long = trialHillCeSeeSlsV1(
      initialHillCeSeeSlsStateV1(0.08, 0.08),
      {
        dtSec: 0.01,
        totalStrain: 0.08,
        freeCalciumUm,
      },
      params,
    );

    expect(short.valid && long.valid).toBe(true);
    const shortActivation = short.readback.calciumTroponinActivation!;
    const longActivation = long.readback.calciumTroponinActivation!;
    expect(longActivation.contractileElementStretch).toBeGreaterThan(
      shortActivation.contractileElementStretch,
    );
    expect(longActivation.halfActivationCalciumUm).toBeLessThan(
      shortActivation.halfActivationCalciumUm,
    );
    expect(long.readback.caTroponin01).toBeGreaterThan(
      short.readback.caTroponin01,
    );
    expect(long.readback.activation01).toBeGreaterThan(
      short.readback.activation01,
    );
    expect(long.readback.stresses.contractileElementTensionPa).toBeGreaterThan(
      short.readback.stresses.contractileElementTensionPa,
    );
  });

  it("supports finite free shortening, calcium washout, and reactivation", () => {
    const params: HillCeSeeSlsParamsV1 = {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      solver: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.solver,
        preferLocalContinuation: false,
      },
    };
    const dtSec = 0.01;
    const vmax = params.contractileElement.maximumShorteningVelocityPerSec;
    let accepted = initialHillCeSeeSlsStateV1(0, 0, 0, 1);

    const freeShortening = trialHillCeSeeSlsV1(
      accepted,
      {
        dtSec,
        totalStrain: -vmax * dtSec,
        freeCalciumUm: 5,
      },
      params,
    );
    expect(freeShortening.valid).toBe(true);
    expect(freeShortening.readback.factors.forceVelocity).toBe(0);
    expect(
      freeShortening.readback.strains.contractileElementRatePerSec,
    ).toBeCloseTo(-vmax, 7);
    expect(freeShortening.solver.selectedNeutralZeroManifold).toBe(true);
    expect(freeShortening.solver.selectedMechanicallyStable).toBe(false);
    accepted = commitHillCeSeeSlsTrialV1(freeShortening);

    const off = trialHillCeSeeSlsV1(
      accepted,
      {
        dtSec: 0.05,
        totalStrain: accepted.totalStrain,
        freeCalciumUm: 0,
      },
      params,
    );
    expect(off.valid).toBe(true);
    expect(off.nextState.caTroponin01).toBeLessThan(accepted.caTroponin01);
    accepted = commitHillCeSeeSlsTrialV1(off);

    const reactivated = trialHillCeSeeSlsV1(
      accepted,
      {
        dtSec,
        totalStrain: accepted.totalStrain,
        freeCalciumUm: 5,
      },
      params,
    );
    expect(reactivated.valid).toBe(true);
    expect(reactivated.nextState.caTroponin01).toBeGreaterThan(
      accepted.caTroponin01,
    );
    expect(
      reactivated.readback.strains.contractileElementRatePerSec,
    ).toBeGreaterThanOrEqual(-vmax - 1e-8);
    expect(reactivated.readback.factors.forceVelocity).toBeGreaterThan(0);
    expect(reactivated.solver.selectedAlgorithmicStabilityPa).toBeGreaterThan(
      0,
    );
  });

  it("has a C1 coupled tangent at the unloaded-shortening and SEE-slack boundary", () => {
    const params: HillCeSeeSlsParamsV1 = {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      solver: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.solver,
        preferLocalContinuation: false,
      },
    };
    const accepted = initialHillCeSeeSlsStateV1(0, 0, 0, 1);
    const dtSec = 0.01;
    const centreStrain =
      -params.contractileElement.maximumShorteningVelocityPerSec * dtSec;
    const increment = 1e-7;
    const minus = trialHillCeSeeSlsV1(
      accepted,
      {
        dtSec,
        totalStrain: centreStrain - increment,
        freeCalciumUm: 5,
      },
      params,
    );
    const centre = trialHillCeSeeSlsV1(
      accepted,
      {
        dtSec,
        totalStrain: centreStrain,
        freeCalciumUm: 5,
      },
      params,
    );
    const plus = trialHillCeSeeSlsV1(
      accepted,
      {
        dtSec,
        totalStrain: centreStrain + increment,
        freeCalciumUm: 5,
      },
      params,
    );

    expect(minus.valid && centre.valid && plus.valid).toBe(true);
    expect(centre.solver.selectedNeutralZeroManifold).toBe(true);
    expect(centre.readback.tangentsPa.serialTransmittedAlgorithmicPa).toBe(0);
    const finiteDifference =
      (plus.readback.stresses.totalTransmittedPa -
        minus.readback.stresses.totalTransmittedPa) /
      (2 * increment);
    expect(finiteDifference).toBeCloseTo(
      centre.readback.tangentsPa.totalTransmittedAlgorithmicPa,
      5,
    );
  });

  it("does not mistake tolerance contours for roots and selects a neutral continuation", () => {
    const base = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1;
    const params: HillCeSeeSlsParamsV1 = {
      ...base,
      contractileElement: {
        ...base.contractileElement,
        maximumIsometricTensionPa: 5_000,
        lengthWidth: 0.05,
        minimumLengthFactor: 0.001,
      },
      seriesElasticElement: {
        ...base.seriesElasticElement,
        linearStiffnessPa: 1_000,
        cubicStiffnessPa: 0,
      },
      solver: { ...base.solver, preferLocalContinuation: false },
    };
    const previousCeStrain = 0.17;
    const trial = trialHillCeSeeSlsV1(
      initialHillCeSeeSlsStateV1(0.1, previousCeStrain, 0, 1),
      { dtSec: 0.02, totalStrain: 0.1, freeCalciumUm: 5 },
      params,
    );

    expect(trial.valid).toBe(true);
    const toleranceContours = trial.solver.rootCandidates.filter(
      (candidate) => candidate.source === "zero-manifold-boundary",
    );
    expect(toleranceContours.length).toBeGreaterThanOrEqual(2);
    expect(toleranceContours.every((candidate) => !candidate.admissible)).toBe(
      true,
    );
    expect(trial.solver.stableRootCount).toBe(0);
    const admissibleRoots = trial.solver.rootCandidates.filter(
      (candidate) => candidate.admissible,
    );
    expect(admissibleRoots).toHaveLength(1);
    expect(trial.nextState.ceStrain).toBe(admissibleRoots[0]!.ceStrain);
    expect(trial.solver.selectedMechanicallyStable).toBe(false);
    expect(trial.solver.selectedNeutralZeroManifold).toBe(true);
  });

  it("uses relative force balance on a high-stress branch and remains deterministic under full root scanning", () => {
    const base = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1;
    const params: HillCeSeeSlsParamsV1 = {
      ...base,
      contractileElement: {
        ...base.contractileElement,
        maximumIsometricTensionPa: 1_000_000,
        lengthWidth: 0.035,
        minimumLengthFactor: 1e-5,
      },
      seriesElasticElement: {
        ...base.seriesElasticElement,
        linearStiffnessPa: 400_000,
        cubicStiffnessPa: 0,
      },
      solver: {
        ...base.solver,
        preferLocalContinuation: false,
        absoluteStressTolerancePa: 1e-14,
        relativeStressTolerance: 1e-10,
        rootScanSubdivisions: 16,
      },
    };
    const accepted = initialHillCeSeeSlsStateV1(0, -0.1, 0, 0.55);
    const input = {
      dtSec: 0.002,
      totalStrain: 0.12,
      freeCalciumUm: 0.9,
    } as const;
    const first = trialHillCeSeeSlsV1(accepted, input, params);
    const second = trialHillCeSeeSlsV1(accepted, input, params);

    expect(first.valid).toBe(true);
    expect(first).toEqual(second);
    const selected =
      first.solver.rootCandidates[first.solver.selectedRootIndex!]!;
    expect(Math.abs(selected.residualPa)).toBeGreaterThan(
      params.solver.absoluteStressTolerancePa,
    );
    expect(Math.abs(selected.residualPa)).toBeLessThanOrEqual(
      selected.residualTolerancePa,
    );
    expect(selected.converged && selected.stable && selected.admissible).toBe(
      true,
    );
  });

  it("includes the same-step CaTRPN length derivative in the reported endpoint tangent", () => {
    const state = initialHillCeSeeSlsStateV1(0.01, 0, 0, 0.2);
    const dtSec = 0.004;
    const totalStrain = 0.08;
    const freeCalciumUm = 0.65;
    const increment = 1e-7;
    const centre = trialHillCeSeeSlsV1(state, {
      dtSec,
      totalStrain,
      freeCalciumUm,
    });
    const plus = trialHillCeSeeSlsV1(state, {
      dtSec,
      totalStrain: totalStrain + increment,
      freeCalciumUm,
    });
    const minus = trialHillCeSeeSlsV1(state, {
      dtSec,
      totalStrain: totalStrain - increment,
      freeCalciumUm,
    });

    expect(centre.valid && plus.valid && minus.valid).toBe(true);
    const activation = centre.readback.calciumTroponinActivation!;
    expect(activation.caTroponinDerivativePerLogStrain).toBeGreaterThan(0);
    expect(
      activation.thinFilamentAvailabilityDerivativePerLogStrain,
    ).toBeGreaterThan(0);

    const ceFiniteDifference =
      (plus.readback.activation01 - minus.readback.activation01) /
      (plus.nextState.ceStrain - minus.nextState.ceStrain);
    expect(
      relativeError(
        ceFiniteDifference,
        activation.thinFilamentAvailabilityDerivativePerLogStrain,
      ),
    ).toBeLessThan(2e-5);

    const stressFiniteDifference =
      (plus.readback.stresses.totalTransmittedPa -
        minus.readback.stresses.totalTransmittedPa) /
      (2 * increment);
    const reported = centre.readback.tangentsPa.totalTransmittedAlgorithmicPa;
    expect(relativeError(stressFiniteDifference, reported)).toBeLessThan(1e-5);
    expect(centre.readback.tangentsPa.serialStabilityPa).toBeGreaterThan(0);
  });

  it("couples the opt-in availability state inside every serial-root candidate with its exact tangent", () => {
    const params = withDynamicThinFilamentLag(0.026);
    const accepted = initialHillCeSeeSlsStateV1(0.01, 0, 0, 0.2, 0.08);
    const snapshot = { ...accepted };
    const dtSec = 0.004;
    const totalStrain = 0.08;
    const freeCalciumUm = 0.65;
    const increment = 1e-7;
    const evaluate = (strain: number) =>
      trialHillCeSeeSlsV1(
        accepted,
        { dtSec, totalStrain: strain, freeCalciumUm },
        params,
      );
    const centre = evaluate(totalStrain);
    const plus = evaluate(totalStrain + increment);
    const minus = evaluate(totalStrain - increment);

    expect(centre.valid && plus.valid && minus.valid).toBe(true);
    expect(accepted).toEqual(snapshot);
    expect(centre.nextState.thinFilamentAvailability01).toBeDefined();
    const activation = centre.readback.calciumTroponinActivation!;
    expect(activation.thinFilamentDynamicsMode).toBe(
      "one-state-normalized-lag",
    );
    expect(
      activation.thinFilamentAvailabilityDerivativePerNextLogStrain,
    ).toBeGreaterThan(0);

    const availabilityPerCeFiniteDifference =
      (plus.nextState.thinFilamentAvailability01! -
        minus.nextState.thinFilamentAvailability01!) /
      (plus.nextState.ceStrain - minus.nextState.ceStrain);
    expect(
      relativeError(
        availabilityPerCeFiniteDifference,
        activation.thinFilamentAvailabilityDerivativePerNextLogStrain,
      ),
    ).toBeLessThan(3e-5);

    const stressFiniteDifference =
      (plus.readback.stresses.totalTransmittedPa -
        minus.readback.stresses.totalTransmittedPa) /
      (2 * increment);
    expect(
      relativeError(
        stressFiniteDifference,
        centre.readback.tangentsPa.totalTransmittedAlgorithmicPa,
      ),
    ).toBeLessThan(2e-5);
    expect(centre.readback.tangentsPa.serialStabilityPa).toBeGreaterThan(0);

    const committed = commitHillCeSeeSlsTrialV1(centre);
    expect(committed).toEqual(centre.nextState);
    expect(committed).not.toBe(centre.nextState);
    expect(committed.thinFilamentAvailability01).toBe(
      centre.nextState.thinFilamentAvailability01,
    );
    expect(accepted).toEqual(snapshot);
  });

  it("rejects an uninitialized dynamic availability state and deep-freezes its parameter branch", () => {
    const params = withDynamicThinFilamentLag(0.025);
    const missingState = trialHillCeSeeSlsV1(
      initialHillCeSeeSlsStateV1(0, 0, 0, 0.2),
      { dtSec: 0.004, totalStrain: 0.04, freeCalciumUm: 0.7 },
      params,
    );
    expect(missingState.valid).toBe(false);
    expect(missingState.issues[0]?.code).toBe("INVALID_ACCEPTED_STATE");
    expect(missingState.issues[0]?.message).toContain(
      "thinFilamentAvailability01",
    );

    const prepared = prepareHillCeSeeSlsParamsV1(params);
    expect(prepared.calciumTroponinActivation.thinFilamentDynamics).not.toBe(
      params.calciumTroponinActivation.thinFilamentDynamics,
    );
    expect(
      Object.isFrozen(prepared.calciumTroponinActivation.thinFilamentDynamics),
    ).toBe(true);
  });

  it("keeps the calcium-coupled trial pure, deterministic, and commit explicit", () => {
    const accepted = initialHillCeSeeSlsStateV1(0.01, -0.01, 25, 0.21);
    const snapshot = { ...accepted };
    const input = {
      dtSec: 0.005,
      totalStrain: 0.045,
      freeCalciumUm: 0.7,
    } as const;
    const first = trialHillCeSeeSlsV1(accepted, input);
    const second = trialHillCeSeeSlsV1(accepted, input);

    expect(first.valid).toBe(true);
    expect(first).toEqual(second);
    expect(accepted).toEqual(snapshot);
    expect(first.previousState).toBe(accepted);
    const committed = commitHillCeSeeSlsTrialV1(first);
    expect(committed).toEqual(first.nextState);
    expect(committed).not.toBe(first.nextState);
    expect(Object.isFrozen(committed)).toBe(true);
    expect(accepted).toEqual(snapshot);
  });

  it("uses local continuation only as an exact-law acceleration of the full scan", () => {
    const accepted = initialHillCeSeeSlsStateV1(0.02, 0.01, 15, 0.18);
    const input = {
      dtSec: 0.005,
      totalStrain: 0.055,
      freeCalciumUm: 0.72,
    } as const;
    const local = trialHillCeSeeSlsV1(accepted, input);
    const full = trialHillCeSeeSlsV1(accepted, input, {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      solver: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.solver,
        preferLocalContinuation: false,
      },
    });
    expect(local.valid && full.valid).toBe(true);
    expect(local.solver.rootCandidates[0]?.source).toBe("local-continuation");
    expect(local.nextState.ceStrain).toBeCloseTo(full.nextState.ceStrain, 11);
    expect(local.nextState.caTroponin01).toBeCloseTo(
      full.nextState.caTroponin01,
      12,
    );
    expect(local.readback.stresses.totalTransmittedPa).toBeCloseTo(
      full.readback.stresses.totalTransmittedPa,
      7,
    );
  });

  it("selects the analytic unloaded neutral manifold instead of a local tolerance contour", () => {
    const accepted = initialHillCeSeeSlsStateV1(
      0.14681876596296206,
      0.07225217018276453,
      0,
      0.3216748614795506,
    );
    const input = {
      dtSec: 0.0035461666542105376,
      totalStrain: -0.1644643503241241,
      freeCalciumUm: 1.0359321712749079,
    } as const;
    const local = trialHillCeSeeSlsV1(accepted, input);
    const full = trialHillCeSeeSlsV1(accepted, input, {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      solver: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.solver,
        preferLocalContinuation: false,
      },
    });
    const unloadedUpper =
      accepted.ceStrain -
      DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.contractileElement
        .maximumShorteningVelocityPerSec *
        input.dtSec;

    expect(local.valid && full.valid).toBe(true);
    expect(
      local.solver.rootCandidates[local.solver.selectedRootIndex!]?.source,
    ).toBe("zero-manifold-continuation");
    expect(local.solver.selectedNeutralZeroManifold).toBe(true);
    expect(full.solver.selectedNeutralZeroManifold).toBe(true);
    expect(local.nextState.ceStrain).toBeLessThanOrEqual(unloadedUpper);
    expect(local.nextState.ceStrain).toBeCloseTo(unloadedUpper, 12);
    expect(local.nextState.ceStrain).toBeCloseTo(full.nextState.ceStrain, 14);
    expect(local.readback.stresses.contractileElementTensionPa).toBe(0);
    expect(local.readback.stresses.seriesElasticTensionPa).toBe(0);
    expect(local.readback.stresses.serialEquilibriumResidualPa).toBe(0);
  });

  it("closes SLS backward-Euler energy and preserves an exact SLS-off nested model", () => {
    const initial = initialHillCeSeeSlsStateV1(0);
    const loading = trialHillCeSeeSlsV1(initial, {
      dtSec: 0.01,
      totalStrain: 0.04,
      freeCalciumUm: 0,
    });
    expect(loading.valid).toBe(true);
    expect(loading.readback.energies.slsStorageJPerM3).toBeGreaterThan(0);
    expect(
      loading.readback.slsBalance.physicalRelaxationDissipationJPerM3,
    ).toBeGreaterThanOrEqual(0);
    expect(
      loading.readback.slsBalance.backwardEulerNumericalDissipationJPerM3,
    ).toBeGreaterThanOrEqual(0);
    expect(
      Math.abs(loading.readback.slsBalance.discreteBalanceResidualJPerM3),
    ).toBeLessThan(1e-12);

    const disabled = withSls({
      enabled: false,
      modulusPa: 9_999,
      relaxationTimeSec: 0.001,
    });
    const zeroModulus = withSls({
      enabled: true,
      modulusPa: 0,
      relaxationTimeSec: 99,
    });
    const accepted = initialHillCeSeeSlsStateV1(-0.02, -0.04, 0, 0.2);
    const input = {
      dtSec: 0.008,
      totalStrain: 0.03,
      freeCalciumUm: 0.6,
    } as const;
    const disabledTrial = trialHillCeSeeSlsV1(accepted, input, disabled);
    const zeroModulusTrial = trialHillCeSeeSlsV1(accepted, input, zeroModulus);
    expect(disabledTrial).toEqual(zeroModulusTrial);
    expect(disabledTrial.valid).toBe(true);
    expect(disabledTrial.nextState.slsOverstressPa).toBe(0);
    expect(Object.values(disabledTrial.readback.slsBalance)).toEqual([
      0, 0, 0, 0, 0, 0, 0,
    ]);

    const inconsistentAccepted = initialHillCeSeeSlsStateV1(
      -0.02,
      -0.04,
      321,
      0.2,
    );
    const rejectedReset = trialHillCeSeeSlsV1(
      inconsistentAccepted,
      input,
      disabled,
    );
    expect(rejectedReset.valid).toBe(false);
    expect(rejectedReset.issues[0]?.code).toBe("INVALID_ACCEPTED_STATE");
    expect(rejectedReset.nextState).toBe(inconsistentAccepted);
    expect(() => commitHillCeSeeSlsTrialV1(rejectedReset)).toThrow(/invalid/);
  });

  it("closes serial and SLS work ledgers over a calcium-driven loading cycle", () => {
    let accepted = initialHillCeSeeSlsStateV1(0.04, 0.04);
    const dtSec = 0.002;
    let maximumSerialResidual = 0;
    let maximumSlsResidual = 0;
    let summedSerialResidual = 0;
    for (let index = 1; index <= 500; index += 1) {
      const time = index * dtSec;
      const totalStrain = 0.04 + 0.08 * Math.sin(2 * Math.PI * time);
      const phase = time % 1;
      const calciumPulse =
        phase < 0.35
          ? 0.1 + 0.8 * (0.5 - 0.5 * Math.cos((2 * Math.PI * phase) / 0.35))
          : 0.1;
      const trial = trialHillCeSeeSlsV1(accepted, {
        dtSec,
        totalStrain,
        freeCalciumUm: calciumPulse,
      });
      expect(trial.valid).toBe(true);
      const serial = trial.readback.serialWork;
      const sls = trial.readback.slsBalance;
      expect(
        serial.seriesElasticBackwardEulerNumericalDissipationJPerM3,
      ).toBeGreaterThanOrEqual(0);
      expect(sls.physicalRelaxationDissipationJPerM3).toBeGreaterThanOrEqual(0);
      expect(
        sls.backwardEulerNumericalDissipationJPerM3,
      ).toBeGreaterThanOrEqual(0);
      maximumSerialResidual = Math.max(
        maximumSerialResidual,
        Math.abs(serial.discreteBalanceResidualJPerM3),
      );
      maximumSlsResidual = Math.max(
        maximumSlsResidual,
        Math.abs(sls.discreteBalanceResidualJPerM3),
      );
      summedSerialResidual += serial.discreteBalanceResidualJPerM3;
      accepted = commitHillCeSeeSlsTrialV1(trial);
    }
    expect(maximumSerialResidual).toBeLessThan(1e-7);
    expect(maximumSlsResidual).toBeLessThan(1e-12);
    expect(Math.abs(summedSerialResidual)).toBeLessThan(1e-6);
  });

  it("uses a smooth tension-only passive potential with zero compression energy", () => {
    const params = withSls({
      enabled: false,
      modulusPa: 0,
      relaxationTimeSec: 0.08,
    });
    for (const strain of [-0.2, -0.01, 0]) {
      const trial = trialHillCeSeeSlsV1(
        initialHillCeSeeSlsStateV1(strain, strain),
        { dtSec: 0.01, totalStrain: strain, freeCalciumUm: 0 },
        params,
      );
      expect(trial.valid).toBe(true);
      expect(trial.readback.stresses.passiveEquilibriumPa).toBe(0);
      expect(trial.readback.tangentsPa.passiveEquilibriumPa).toBe(0);
      expect(trial.readback.energies.passiveEquilibriumStorageJPerM3).toBe(0);
    }
    const tensile = trialHillCeSeeSlsV1(
      initialHillCeSeeSlsStateV1(1e-4, 1e-4),
      { dtSec: 0.01, totalStrain: 1e-4, freeCalciumUm: 0 },
      params,
    );
    expect(tensile.valid).toBe(true);
    expect(tensile.readback.stresses.passiveEquilibriumPa).toBeGreaterThan(0);
    expect(tensile.readback.tangentsPa.passiveEquilibriumPa).toBeGreaterThan(0);
    expect(
      tensile.readback.energies.passiveEquilibriumStorageJPerM3,
    ).toBeGreaterThan(0);
  });

  it("returns structured invalid trials for free-Ca, CaTRPN, CE-domain, and overflow failures", () => {
    const accepted = initialHillCeSeeSlsStateV1(0);
    const negativeCalcium = trialHillCeSeeSlsV1(accepted, {
      dtSec: 0.01,
      totalStrain: 0,
      freeCalciumUm: -0.01,
    });
    expect(negativeCalcium.valid).toBe(false);
    expect(negativeCalcium.finite).toBe(true);
    expect(negativeCalcium.issues[0]?.code).toBe("INVALID_TRIAL_INPUT");
    expect(negativeCalcium.nextState).toBe(accepted);
    expect(() => commitHillCeSeeSlsTrialV1(negativeCalcium)).toThrow(/invalid/);

    const legacyActivationOnly = trialHillCeSeeSlsV1(accepted, {
      dtSec: 0.01,
      totalStrain: 0,
      activation01: 1,
    } as unknown as HillCeSeeSlsTrialInputV1);
    expect(legacyActivationOnly.valid).toBe(false);
    expect(legacyActivationOnly.issues[0]?.code).toBe("INVALID_TRIAL_INPUT");

    const badDt = trialHillCeSeeSlsV1(accepted, {
      dtSec: 0,
      totalStrain: 0,
      freeCalciumUm: 0,
    });
    expect(badDt.valid).toBe(false);
    expect(badDt.finite).toBe(true);
    expect(badDt.issues[0]?.code).toBe("INVALID_TRIAL_INPUT");

    const badState = trialHillCeSeeSlsV1(
      {
        totalStrain: 0,
        ceStrain: 0,
        slsOverstressPa: 0,
        caTroponin01: 1.01,
      },
      { dtSec: 0.01, totalStrain: 0, freeCalciumUm: 0 },
    );
    expect(badState.valid).toBe(false);
    expect(badState.issues[0]?.code).toBe("INVALID_ACCEPTED_STATE");
    expect(() => initialHillCeSeeSlsStateV1(0, 0, 0, -0.01)).toThrow(
      /caTroponin01/,
    );

    const ceOutOfDomain = trialHillCeSeeSlsV1(
      {
        totalStrain: 0,
        ceStrain: Math.log(1.2),
        slsOverstressPa: 0,
        caTroponin01: 0,
      },
      { dtSec: 0.01, totalStrain: 0, freeCalciumUm: 0.5 },
    );
    expect(ceOutOfDomain.valid).toBe(false);
    expect(ceOutOfDomain.issues[0]?.code).toBe("INVALID_ACCEPTED_STATE");

    const base = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1;
    const invalidLandDomain: HillCeSeeSlsParamsV1 = {
      ...base,
      contractileElement: {
        ...base.contractileElement,
        maximumStrain: Math.log(1.2),
      },
    };
    expect(validateHillCeSeeSlsParamsV1(invalidLandDomain)).toContain(
      "contractileElement.maximumStrain must stay below the open Land-form linear CE-stretch bound",
    );

    const overflowParams: HillCeSeeSlsParamsV1 = {
      ...base,
      seriesElasticElement: { ...base.seriesElasticElement, slackStrain: 88 },
    };
    const overflow = trialHillCeSeeSlsV1(
      accepted,
      {
        dtSec: 0.01,
        totalStrain: 88,
        freeCalciumUm: 0,
      },
      overflowParams,
    );
    expect(overflow.valid).toBe(false);
    expect(overflow.finite).toBe(false);
    expect(overflow.issues[0]?.code).toBe("NONFINITE_CONSTITUTIVE_OUTPUT");
  });

  it("validates parameter contracts without throwing from the trial surface", () => {
    expect(
      validateHillCeSeeSlsParamsV1(DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1),
    ).toEqual([]);
    const invalid: HillCeSeeSlsParamsV1 = {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      contractileElement: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.contractileElement,
        maximumShorteningVelocityPerSec: 0,
      },
    };
    expect(validateHillCeSeeSlsParamsV1(invalid)).toContain(
      "contractileElement.maximumShorteningVelocityPerSec must be finite and > 0",
    );
    expect(() => prepareHillCeSeeSlsParamsV1(invalid)).toThrow(
      /contractileElement.maximumShorteningVelocityPerSec must be finite and > 0/,
    );
    const trial = trialHillCeSeeSlsV1(
      initialHillCeSeeSlsStateV1(0),
      {
        dtSec: 0.01,
        totalStrain: 0,
        freeCalciumUm: 0,
      },
      invalid,
    );
    expect(trial.valid).toBe(false);
    expect(trial.issues[0]?.code).toBe("INVALID_PARAMETERS");
  });

  it("prepares an isolated deeply frozen parameter snapshot without changing trial results", () => {
    const mutablePassive = { ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.passive };
    const source: HillCeSeeSlsParamsV1 = {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
      calciumTroponinActivation: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.calciumTroponinActivation,
      },
      passive: mutablePassive,
      contractileElement: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.contractileElement,
      },
      seriesElasticElement: {
        ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.seriesElasticElement,
      },
      sls: { ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.sls },
      solver: { ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.solver },
    };
    const accepted = initialHillCeSeeSlsStateV1(0.01, -0.01, 125, 0.17);
    const input = {
      dtSec: 0.006,
      totalStrain: 0.07,
      freeCalciumUm: 0.75,
    } as const;
    const rawTrial = trialHillCeSeeSlsV1(accepted, input, source);
    const prepared = prepareHillCeSeeSlsParamsV1(source);
    const preparedTrial = trialHillCeSeeSlsV1(accepted, input, prepared);

    expect(preparedTrial).toEqual(rawTrial);
    expect(prepared).not.toBe(source);
    expect(prepared.calciumTroponinActivation).not.toBe(
      source.calciumTroponinActivation,
    );
    expect(prepared.passive).not.toBe(source.passive);
    expect(prepared.contractileElement).not.toBe(source.contractileElement);
    expect(prepared.seriesElasticElement).not.toBe(source.seriesElasticElement);
    expect(prepared.sls).not.toBe(source.sls);
    expect(prepared.solver).not.toBe(source.solver);
    expect(
      [
        prepared,
        prepared.calciumTroponinActivation,
        prepared.passive,
        prepared.contractileElement,
        prepared.seriesElasticElement,
        prepared.sls,
        prepared.solver,
      ].every(Object.isFrozen),
    ).toBe(true);

    mutablePassive.tangentModulusPa = Number.NaN;
    expect(trialHillCeSeeSlsV1(accepted, input, source).issues[0]?.code).toBe(
      "INVALID_PARAMETERS",
    );
    expect(trialHillCeSeeSlsV1(accepted, input, prepared)).toEqual(
      preparedTrial,
    );
  });
});

function withSls(sls: HillCeSeeSlsParamsV1["sls"]): HillCeSeeSlsParamsV1 {
  return {
    ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
    sls,
  };
}

function withDynamicThinFilamentLag(
  timeConstantSec: number,
): HillCeSeeSlsParamsV1 {
  return {
    ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
    parameterSetId: `hill-ce-see-sls-dynamic-thin-filament-${timeConstantSec}`,
    calciumTroponinActivation: {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.calciumTroponinActivation,
      parameterSetId: `hill-dynamic-thin-filament-${timeConstantSec}`,
      thinFilamentDynamics: {
        mode: "one-state-normalized-lag",
        timeConstantSec,
      },
    },
  };
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(1, Math.abs(expected));
}
