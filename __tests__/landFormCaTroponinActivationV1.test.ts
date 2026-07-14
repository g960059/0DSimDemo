import { describe, expect, it } from "vitest";

import {
  LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1,
  LAND_FORM_CA_TROPONIN_ACTIVATION_CLAIM_V1,
  LAND_FORM_CA_TROPONIN_ACTIVATION_MIDPOINT_CLAIM_V2,
  LAND_FORM_NORMALIZED_THIN_FILAMENT_LAG_CLAIM_V1,
  LAND_FORM_CA_TROPONIN_NTM_2P2_CANDIDATE_PARAMS_V1,
  LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1,
  commitLandFormCaTroponinActivationTrialV1,
  equilibriumLandFormCaTroponinActivationStateV1,
  initialLandFormCaTroponinActivationStateV1,
  prepareLandFormCaTroponinActivationParamsV1,
  trialLandFormCaTroponinActivationV1,
  trialLandFormCaTroponinActivationMidpointV2,
  validateLandFormCaTroponinActivationParamsV1,
  type LandFormCaTroponinActivationParamsV1,
} from "@/engine/mechanics2/activation/LandFormCaTroponinActivationV1";

describe("LandFormCaTroponinActivationV1", () => {
  it("keeps the BE CaTRPN state and normalized availability inside [0,1]", () => {
    const dtValues = [1e-5, 0.001, 0.01, 0.1, 1];
    const calciumValues = [0, 0.05, 0.1, 0.6, 1, 5, 20];
    const acceptedValues = [0, 0.01, 0.25, 0.9, 1];
    for (const dtSec of dtValues) {
      for (const freeCalciumUm of calciumValues) {
        for (const caTroponin01 of acceptedValues) {
          const trial = trialLandFormCaTroponinActivationV1(
            initialLandFormCaTroponinActivationStateV1(caTroponin01),
            {
              dtSec,
              freeCalciumUm,
              contractileElementLogStrain: Math.log(1.05),
            },
          );
          expect(trial.valid).toBe(true);
          expect(trial.finite).toBe(true);
          expect(trial.nextState!.caTroponin01).toBeGreaterThanOrEqual(0);
          expect(trial.nextState!.caTroponin01).toBeLessThanOrEqual(1);
          expect(
            trial.readback!.thinFilamentAvailability01,
          ).toBeGreaterThanOrEqual(0);
          expect(
            trial.readback!.thinFilamentAvailability01,
          ).toBeLessThanOrEqual(1);
        }
      }
    }

    const full = trialLandFormCaTroponinActivationV1(
      initialLandFormCaTroponinActivationStateV1(1),
      { dtSec: 0.001, freeCalciumUm: 1e9, contractileElementLogStrain: 0 },
    );
    expect(full.valid).toBe(true);
    expect(full.readback!.thinFilamentAvailability01).toBeCloseTo(1, 12);
    expect(full.readback!.claimBoundary).toBe(
      LAND_FORM_CA_TROPONIN_ACTIVATION_CLAIM_V1,
    );
    expect(full.readback!.claimBoundary.fullLandModel).toBe(false);
    expect(full.readback!.claimBoundary.calciumCyclingModelled).toBe(false);
    expect(full.readback!.thinFilamentDynamicsMode).toBe(
      "algebraic-equilibrium",
    );
    expect(full.readback!.thinFilamentStateRetention01).toBe(0);
    expect(full.nextState).not.toHaveProperty("thinFilamentAvailability01");
  });

  it("preserves the Land Eq. 47 equilibrium exactly under a BE step", () => {
    const params = LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1;
    const ceStretch = 1;
    const freeCalciumUm = 0.6;
    const ratio =
      (freeCalciumUm / params.referenceHalfActivationCalciumUm) **
      params.caTroponinCooperativity;
    const equilibrium = ratio / (1 + ratio);
    const trial = trialLandFormCaTroponinActivationV1(
      initialLandFormCaTroponinActivationStateV1(equilibrium),
      {
        dtSec: 0.037,
        freeCalciumUm,
        contractileElementLogStrain: Math.log(ceStretch),
      },
      params,
    );

    expect(trial.valid).toBe(true);
    expect(trial.nextState!.caTroponin01).toBeCloseTo(equilibrium, 14);
    expect(commitLandFormCaTroponinActivationTrialV1(trial)).toEqual(
      trial.nextState,
    );
  });

  it("constructs the same resting equilibrium used by the dynamic update", () => {
    const freeCalciumUm = 0.1;
    const contractileElementLogStrain = Math.log(1.1);
    const equilibrium = equilibriumLandFormCaTroponinActivationStateV1(
      freeCalciumUm,
      contractileElementLogStrain,
    );
    const trial = trialLandFormCaTroponinActivationV1(equilibrium, {
      dtSec: 0.005,
      freeCalciumUm,
      contractileElementLogStrain,
    });
    expect(trial.valid).toBe(true);
    expect(trial.nextState?.caTroponin01).toBeCloseTo(
      equilibrium.caTroponin01,
      14,
    );
  });

  it("shifts Ca sensitivity left with CE stretch on the source linear branch", () => {
    const accepted = initialLandFormCaTroponinActivationStateV1(0.05);
    const short = trialLandFormCaTroponinActivationV1(accepted, {
      dtSec: 0.005,
      freeCalciumUm: 0.5,
      contractileElementLogStrain: Math.log(0.9),
    });
    const reference = trialLandFormCaTroponinActivationV1(accepted, {
      dtSec: 0.005,
      freeCalciumUm: 0.5,
      contractileElementLogStrain: 0,
    });
    const long = trialLandFormCaTroponinActivationV1(accepted, {
      dtSec: 0.005,
      freeCalciumUm: 0.5,
      contractileElementLogStrain: Math.log(1.1),
    });

    expect(short.valid && reference.valid && long.valid).toBe(true);
    expect(short.readback!.halfActivationCalciumUm).toBeGreaterThan(
      reference.readback!.halfActivationCalciumUm,
    );
    expect(long.readback!.halfActivationCalciumUm).toBeLessThan(
      reference.readback!.halfActivationCalciumUm,
    );
    expect(short.nextState!.caTroponin01).toBeLessThan(
      reference.nextState!.caTroponin01,
    );
    expect(long.nextState!.caTroponin01).toBeGreaterThan(
      reference.nextState!.caTroponin01,
    );
    expect(long.readback!.caTroponinDerivativePerLogStrain).toBeGreaterThan(0);
  });

  it("reports exact CE-log-strain derivatives consistent with centred finite differences", () => {
    const accepted = initialLandFormCaTroponinActivationStateV1(0.12);
    const input = {
      dtSec: 0.004,
      freeCalciumUm: 0.62,
      contractileElementLogStrain: Math.log(1.04),
    } as const;
    const increment = 1e-7;
    const centre = trialLandFormCaTroponinActivationV1(accepted, input);
    const plus = trialLandFormCaTroponinActivationV1(accepted, {
      ...input,
      contractileElementLogStrain:
        input.contractileElementLogStrain + increment,
    });
    const minus = trialLandFormCaTroponinActivationV1(accepted, {
      ...input,
      contractileElementLogStrain:
        input.contractileElementLogStrain - increment,
    });

    expect(centre.valid && plus.valid && minus.valid).toBe(true);
    const fdCaTroponin =
      (plus.nextState!.caTroponin01 - minus.nextState!.caTroponin01) /
      (2 * increment);
    const fdAvailability =
      (plus.readback!.thinFilamentAvailability01 -
        minus.readback!.thinFilamentAvailability01) /
      (2 * increment);
    expect(
      relativeError(
        fdCaTroponin,
        centre.readback!.caTroponinDerivativePerLogStrain,
      ),
    ).toBeLessThan(2e-8);
    expect(
      relativeError(
        fdAvailability,
        centre.readback!.thinFilamentAvailabilityDerivativePerLogStrain,
      ),
    ).toBeLessThan(3e-8);
  });

  it("exposes predeclared nTm candidates without changing CaTRPN kinetics", () => {
    const accepted = initialLandFormCaTroponinActivationStateV1(0.08);
    const input = {
      dtSec: 0.004,
      freeCalciumUm: 0.5,
      contractileElementLogStrain: 0,
    } as const;
    const source = trialLandFormCaTroponinActivationV1(
      accepted,
      input,
      LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1,
    );
    const n3 = trialLandFormCaTroponinActivationV1(
      accepted,
      input,
      LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1,
    );
    const n2p2 = trialLandFormCaTroponinActivationV1(
      accepted,
      input,
      LAND_FORM_CA_TROPONIN_NTM_2P2_CANDIDATE_PARAMS_V1,
    );

    expect(source.valid && n3.valid && n2p2.valid).toBe(true);
    expect(source.nextState!.caTroponin01).toBe(n3.nextState!.caTroponin01);
    expect(source.nextState!.caTroponin01).toBe(n2p2.nextState!.caTroponin01);
    expect(source.nextState!.caTroponin01).toBeLessThan(
      LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1.thinFilamentHalfActivation01,
    );
    expect(source.readback!.thinFilamentAvailability01).toBeLessThan(
      n3.readback!.thinFilamentAvailability01,
    );
    expect(n3.readback!.thinFilamentAvailability01).toBeLessThan(
      n2p2.readback!.thinFilamentAvailability01,
    );
    expect(
      LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1.parameterSetId,
    ).toContain("source");
    expect(
      LAND_FORM_CA_TROPONIN_NTM_2P2_CANDIDATE_PARAMS_V1.parameterSetId,
    ).toContain("candidate");
    expect(
      LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1.parameterSetId,
    ).toContain("candidate");
  });

  it("returns structured invalid trials instead of clamping invalid state or input", () => {
    const validState = initialLandFormCaTroponinActivationStateV1(0.1);
    const invalidState = trialLandFormCaTroponinActivationV1(
      { caTroponin01: -0.01 },
      { dtSec: 0.005, freeCalciumUm: 0.6, contractileElementLogStrain: 0 },
    );
    const invalidInput = trialLandFormCaTroponinActivationV1(validState, {
      dtSec: 0,
      freeCalciumUm: -1,
      contractileElementLogStrain: Number.NaN,
    });
    const cappedLength = trialLandFormCaTroponinActivationV1(validState, {
      dtSec: 0.005,
      freeCalciumUm: 0.6,
      contractileElementLogStrain: Math.log(1.2),
    });
    const invalidParams = {
      ...LAND2017_HUMAN_VENTRICULAR_CA_TROPONIN_ACTIVATION_PARAMS_V1,
      halfActivationLengthSlopeUmPerStretch: 1,
    };
    const invalidParameterTrial = trialLandFormCaTroponinActivationV1(
      validState,
      { dtSec: 0.005, freeCalciumUm: 0.6, contractileElementLogStrain: 0 },
      invalidParams,
    );

    expect(invalidState.valid).toBe(false);
    expect(invalidState.nextState).toBeNull();
    expect(invalidState.issues.map((entry) => entry.code)).toContain(
      "INVALID_ACCEPTED_STATE",
    );
    expect(invalidInput.valid).toBe(false);
    expect(invalidInput.finite).toBe(false);
    expect(invalidInput.issues.map((entry) => entry.code)).toContain(
      "INVALID_TRIAL_INPUT",
    );
    expect(cappedLength.valid).toBe(false);
    expect(cappedLength.issues.map((entry) => entry.code)).toContain(
      "OUTSIDE_LINEAR_LENGTH_DOMAIN",
    );
    expect(invalidParameterTrial.valid).toBe(false);
    expect(invalidParameterTrial.issues.map((entry) => entry.code)).toContain(
      "INVALID_PARAMETERS",
    );
    expect(
      validateLandFormCaTroponinActivationParamsV1(invalidParams),
    ).not.toHaveLength(0);
    expect(() =>
      commitLandFormCaTroponinActivationTrialV1(invalidState),
    ).toThrow(/Cannot commit/);
  });

  it("keeps evaluation pure and commit explicit", () => {
    const accepted = initialLandFormCaTroponinActivationStateV1(0.21);
    const snapshot = { ...accepted };
    const input = {
      dtSec: 0.005,
      freeCalciumUm: 0.7,
      contractileElementLogStrain: Math.log(1.03),
    } as const;
    const first = trialLandFormCaTroponinActivationV1(accepted, input);
    const second = trialLandFormCaTroponinActivationV1(accepted, input);

    expect(first).toEqual(second);
    expect(accepted).toEqual(snapshot);
    expect(first.previousState).toBe(accepted);
    const committed = commitLandFormCaTroponinActivationTrialV1(first);
    expect(committed).toEqual(first.nextState);
    expect(committed).not.toBe(first.nextState);
    expect(Object.isFrozen(committed)).toBe(true);
  });

  it("prepares an immutable validated clone without changing trial semantics", () => {
    const mutableSource = {
      ...LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1,
      parameterSetId: "land-form-prepared-parity-test-v1",
    };
    const prepared = prepareLandFormCaTroponinActivationParamsV1(mutableSource);
    const accepted = initialLandFormCaTroponinActivationStateV1(0.17);
    const input = {
      dtSec: 0.003,
      freeCalciumUm: 0.71,
      contractileElementLogStrain: Math.log(1.06),
    } as const;

    const rawTrial = trialLandFormCaTroponinActivationV1(
      accepted,
      input,
      mutableSource,
    );
    const preparedTrial = trialLandFormCaTroponinActivationV1(
      accepted,
      input,
      prepared,
    );

    expect(prepared).not.toBe(mutableSource);
    expect(Object.isFrozen(prepared)).toBe(true);
    expect(preparedTrial).toEqual(rawTrial);

    mutableSource.caTroponinRatePerSec = -1;
    const invalidRaw = trialLandFormCaTroponinActivationV1(
      accepted,
      input,
      mutableSource,
    );
    const stillValidPrepared = trialLandFormCaTroponinActivationV1(
      accepted,
      input,
      prepared,
    );
    expect(invalidRaw.valid).toBe(false);
    expect(stillValidPrepared.valid).toBe(true);
    expect(() =>
      prepareLandFormCaTroponinActivationParamsV1(mutableSource),
    ).toThrow(/caTroponinRatePerSec/);
  });
});

describe("LandFormCaTroponinActivation midpoint V2", () => {
  it("has the semigroup property for constant calcium and CE strain", () => {
    const state = initialLandFormCaTroponinActivationStateV1(0.12);
    const whole = trialLandFormCaTroponinActivationMidpointV2(state, {
      dtSec: 0.005,
      midpointFreeCalciumUm: 0.62,
      previousContractileElementLogStrain: Math.log(1.04),
      nextContractileElementLogStrain: Math.log(1.04),
    });
    const half1 = trialLandFormCaTroponinActivationMidpointV2(state, {
      dtSec: 0.0025,
      midpointFreeCalciumUm: 0.62,
      previousContractileElementLogStrain: Math.log(1.04),
      nextContractileElementLogStrain: Math.log(1.04),
    });
    const half2 = trialLandFormCaTroponinActivationMidpointV2(
      half1.nextState!,
      {
        dtSec: 0.0025,
        midpointFreeCalciumUm: 0.62,
        previousContractileElementLogStrain: Math.log(1.04),
        nextContractileElementLogStrain: Math.log(1.04),
      },
    );

    expect(whole.valid && half1.valid && half2.valid).toBe(true);
    expect(
      Math.abs(whole.nextState!.caTroponin01 - half2.nextState!.caTroponin01),
    ).toBeLessThan(2e-15);
    expect(whole.readback!.claimBoundary).toBe(
      LAND_FORM_CA_TROPONIN_ACTIVATION_MIDPOINT_CLAIM_V2,
    );
  });

  it("reports the midpoint endpoint tangent consistent with centred differences", () => {
    const state = initialLandFormCaTroponinActivationStateV1(0.12);
    const previous = Math.log(1.01);
    const endpoint = Math.log(1.07);
    const increment = 1e-7;
    const evaluate = (next: number) =>
      trialLandFormCaTroponinActivationMidpointV2(state, {
        dtSec: 0.004,
        midpointFreeCalciumUm: 0.62,
        previousContractileElementLogStrain: previous,
        nextContractileElementLogStrain: next,
      });
    const centre = evaluate(endpoint);
    const plus = evaluate(endpoint + increment);
    const minus = evaluate(endpoint - increment);
    expect(centre.valid && plus.valid && minus.valid).toBe(true);
    const stateDerivative =
      (plus.nextState!.caTroponin01 - minus.nextState!.caTroponin01) /
      (2 * increment);
    const availabilityDerivative =
      (plus.readback!.thinFilamentAvailability01 -
        minus.readback!.thinFilamentAvailability01) /
      (2 * increment);
    expect(
      relativeError(
        stateDerivative,
        centre.readback!.caTroponinDerivativePerNextLogStrain,
      ),
    ).toBeLessThan(3e-8);
    expect(
      relativeError(
        availabilityDerivative,
        centre.readback!.thinFilamentAvailabilityDerivativePerNextLogStrain,
      ),
    ).toBeLessThan(4e-8);
  });
});

describe("LandForm normalized thin-filament availability lag", () => {
  it("keeps the opt-in dynamic state bounded and rejects missing or invalid state", () => {
    const params = dynamicThinFilamentParams(0.025);
    for (const caTroponin01 of [0, 0.1, 0.5, 1]) {
      for (const thinFilamentAvailability01 of [0, 0.2, 0.8, 1]) {
        for (const dtSec of [1e-6, 0.001, 0.02, 1]) {
          const trial = trialLandFormCaTroponinActivationMidpointV2(
            initialLandFormCaTroponinActivationStateV1(
              caTroponin01,
              thinFilamentAvailability01,
            ),
            {
              dtSec,
              midpointFreeCalciumUm: 0.7,
              previousContractileElementLogStrain: 0,
              nextContractileElementLogStrain: Math.log(1.05),
            },
            params,
          );
          expect(trial.valid).toBe(true);
          expect(trial.nextState!.caTroponin01).toBeGreaterThanOrEqual(0);
          expect(trial.nextState!.caTroponin01).toBeLessThanOrEqual(1);
          expect(
            trial.nextState!.thinFilamentAvailability01,
          ).toBeGreaterThanOrEqual(0);
          expect(
            trial.nextState!.thinFilamentAvailability01,
          ).toBeLessThanOrEqual(1);
        }
      }
    }

    const missing = trialLandFormCaTroponinActivationMidpointV2(
      initialLandFormCaTroponinActivationStateV1(0.2),
      {
        dtSec: 0.004,
        midpointFreeCalciumUm: 0.7,
        previousContractileElementLogStrain: 0,
        nextContractileElementLogStrain: 0,
      },
      params,
    );
    expect(missing.valid).toBe(false);
    expect(missing.issues.map((entry) => entry.code)).toContain(
      "INVALID_ACCEPTED_STATE",
    );
    expect(
      validateLandFormCaTroponinActivationParamsV1(
        dynamicThinFilamentParams(0),
      ),
    ).not.toHaveLength(0);
    expect(
      validateLandFormCaTroponinActivationParamsV1(
        dynamicThinFilamentParams(Number.POSITIVE_INFINITY),
      ),
    ).not.toHaveLength(0);
  });

  it("initializes at the joint CaTRPN and availability equilibrium", () => {
    const params = dynamicThinFilamentParams(0.03);
    const freeCalciumUm = 0.42;
    const strain = Math.log(1.04);
    const equilibrium = equilibriumLandFormCaTroponinActivationStateV1(
      freeCalciumUm,
      strain,
      params,
    );
    const trial = trialLandFormCaTroponinActivationMidpointV2(
      equilibrium,
      {
        dtSec: 0.017,
        midpointFreeCalciumUm: freeCalciumUm,
        previousContractileElementLogStrain: strain,
        nextContractileElementLogStrain: strain,
      },
      params,
    );

    expect(equilibrium.thinFilamentAvailability01).toBeDefined();
    expect(trial.valid).toBe(true);
    expect(trial.nextState!.caTroponin01).toBeCloseTo(
      equilibrium.caTroponin01,
      14,
    );
    expect(trial.nextState!.thinFilamentAvailability01).toBeCloseTo(
      equilibrium.thinFilamentAvailability01!,
      14,
    );
    expect(trial.readback!.thinFilamentEquilibriumAvailability01).toBeCloseTo(
      equilibrium.thinFilamentAvailability01!,
      14,
    );
  });

  it("has the exponential semigroup property while its equilibrium target is constant", () => {
    const params = dynamicThinFilamentParams(0.021);
    const freeCalciumUm = 0.5;
    const strain = Math.log(1.02);
    const equilibrium = equilibriumLandFormCaTroponinActivationStateV1(
      freeCalciumUm,
      strain,
      params,
    );
    const state = initialLandFormCaTroponinActivationStateV1(
      equilibrium.caTroponin01,
      0.07,
    );
    const evaluate = (
      accepted: ReturnType<typeof initialLandFormCaTroponinActivationStateV1>,
      dtSec: number,
    ) =>
      trialLandFormCaTroponinActivationMidpointV2(
        accepted,
        {
          dtSec,
          midpointFreeCalciumUm: freeCalciumUm,
          previousContractileElementLogStrain: strain,
          nextContractileElementLogStrain: strain,
        },
        params,
      );
    const whole = evaluate(state, 0.012);
    const half1 = evaluate(state, 0.006);
    const half2 = evaluate(half1.nextState!, 0.006);

    expect(whole.valid && half1.valid && half2.valid).toBe(true);
    expect(whole.nextState!.caTroponin01).toBeCloseTo(
      half2.nextState!.caTroponin01,
      14,
    );
    expect(whole.nextState!.thinFilamentAvailability01).toBeCloseTo(
      half2.nextState!.thinFilamentAvailability01!,
      14,
    );
  });

  it("recovers algebraic parity as tau tends to zero and freezes as tau grows", () => {
    const acceptedCaTroponin01 = 0.18;
    const acceptedAvailability01 = 0.73;
    const input = {
      dtSec: 0.004,
      midpointFreeCalciumUm: 0.64,
      previousContractileElementLogStrain: Math.log(1.01),
      nextContractileElementLogStrain: Math.log(1.07),
    } as const;
    const algebraic = trialLandFormCaTroponinActivationMidpointV2(
      initialLandFormCaTroponinActivationStateV1(acceptedCaTroponin01),
      input,
      LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1,
    );
    const fast = trialLandFormCaTroponinActivationMidpointV2(
      initialLandFormCaTroponinActivationStateV1(
        acceptedCaTroponin01,
        acceptedAvailability01,
      ),
      input,
      dynamicThinFilamentParams(1e-12),
    );
    const slow = trialLandFormCaTroponinActivationMidpointV2(
      initialLandFormCaTroponinActivationStateV1(
        acceptedCaTroponin01,
        acceptedAvailability01,
      ),
      input,
      dynamicThinFilamentParams(1e9),
    );

    expect(algebraic.valid && fast.valid && slow.valid).toBe(true);
    expect(fast.nextState!.caTroponin01).toBe(
      algebraic.nextState!.caTroponin01,
    );
    expect(fast.readback!.thinFilamentAvailability01).toBe(
      algebraic.readback!.thinFilamentAvailability01,
    );
    expect(
      fast.readback!.thinFilamentAvailabilityDerivativePerNextLogStrain,
    ).toBe(
      algebraic.readback!.thinFilamentAvailabilityDerivativePerNextLogStrain,
    );
    expect(slow.nextState!.thinFilamentAvailability01).toBeCloseTo(
      acceptedAvailability01,
      10,
    );
  });

  it("reports its exact endpoint CE tangent against centred finite differences", () => {
    const params = dynamicThinFilamentParams(0.026);
    const state = initialLandFormCaTroponinActivationStateV1(0.16, 0.09);
    const previous = Math.log(1.01);
    const endpoint = Math.log(1.08);
    const increment = 1e-7;
    const evaluate = (next: number) =>
      trialLandFormCaTroponinActivationMidpointV2(
        state,
        {
          dtSec: 0.005,
          midpointFreeCalciumUm: 0.68,
          previousContractileElementLogStrain: previous,
          nextContractileElementLogStrain: next,
        },
        params,
      );
    const centre = evaluate(endpoint);
    const plus = evaluate(endpoint + increment);
    const minus = evaluate(endpoint - increment);
    const finiteDifference =
      (plus.nextState!.thinFilamentAvailability01! -
        minus.nextState!.thinFilamentAvailability01!) /
      (2 * increment);

    expect(centre.valid && plus.valid && minus.valid).toBe(true);
    expect(
      relativeError(
        finiteDifference,
        centre.readback!.thinFilamentAvailabilityDerivativePerNextLogStrain,
      ),
    ).toBeLessThan(5e-8);
    expect(centre.readback!.thinFilamentDynamicsMode).toBe(
      "one-state-normalized-lag",
    );
    expect(centre.readback!.thinFilamentDynamicsClaimBoundary).toBe(
      LAND_FORM_NORMALIZED_THIN_FILAMENT_LAG_CLAIM_V1,
    );
    expect(
      centre.readback!.thinFilamentDynamicsClaimBoundary
        .landEquation48Implemented,
    ).toBe(false);
  });

  it("keeps dynamic trials pure and commits both accepted states explicitly", () => {
    const params = dynamicThinFilamentParams(0.024);
    const accepted = initialLandFormCaTroponinActivationStateV1(0.2, 0.11);
    const snapshot = { ...accepted };
    const input = {
      dtSec: 0.006,
      freeCalciumUm: 0.72,
      contractileElementLogStrain: Math.log(1.05),
    } as const;
    const first = trialLandFormCaTroponinActivationV1(accepted, input, params);
    const second = trialLandFormCaTroponinActivationV1(accepted, input, params);

    expect(first.valid).toBe(true);
    expect(first).toEqual(second);
    expect(accepted).toEqual(snapshot);
    const committed = commitLandFormCaTroponinActivationTrialV1(first);
    expect(committed).toEqual(first.nextState);
    expect(committed).not.toBe(first.nextState);
    expect(committed.thinFilamentAvailability01).toBe(
      first.nextState!.thinFilamentAvailability01,
    );
    expect(accepted).toEqual(snapshot);
  });
});

function dynamicThinFilamentParams(
  timeConstantSec: number,
): LandFormCaTroponinActivationParamsV1 {
  return {
    ...LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1,
    parameterSetId: `land-form-dynamic-thin-filament-test-${timeConstantSec}`,
    thinFilamentDynamics: {
      mode: "one-state-normalized-lag",
      timeConstantSec,
    },
  };
}

function relativeError(value: number, reference: number): number {
  return Math.abs(value - reference) / Math.max(1e-12, Math.abs(reference));
}
