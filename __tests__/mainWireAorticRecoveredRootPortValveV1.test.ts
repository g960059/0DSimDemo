import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
  validateMainWireAorticRecoveredRootProfileV1,
  type MainWireAorticRecoveredRootProfileV1,
} from "@/engine/valves/MainWireAorticRecoveredRootProfileV1";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1,
  stepMainWireAorticRecoveredRootPortValveScalarsV1,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

const AOV = Object.freeze({
  parameterSetId: "test-AoV-recovered-root-port-v1",
  valveId: "AoV",
  backgroundLinearResistanceMmHgSecPerMl: 0.0015,
  maximumForwardEoaCm2: 3.5,
  closedReverseEroaCm2: 0,
  openingGainPerMmHg: 3,
  openingPressureOffsetMmHg: 0,
  openingDriveDeadbandMmHg: 0,
  openingDriveSmoothingMmHg: 0.1,
  openingTimeConstantSec: 0.006,
  closingTimeConstantSec: 0.008,
} satisfies MainWireQuasiSteadyOrificeValveParamsV2);

const PROFILE = MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1;

function evaluate(
  rawGradientMmHg: number,
  previousOpening01 = 0.35,
  params: MainWireQuasiSteadyOrificeValveParamsV2 = AOV,
) {
  return stepMainWireAorticRecoveredRootPortValveScalarsV1(
    previousOpening01,
    0.001,
    80 + rawGradientMmHg,
    80,
    params,
    PROFILE,
  );
}

describe("MainWireAorticRecoveredRootPortValveV1", () => {
  it("owns one immutable fixed d3.0 profile and conserves source resistance exactly", () => {
    expect(validateMainWireAorticRecoveredRootProfileV1(PROFILE)).toEqual([]);
    expect(Object.isFrozen(PROFILE)).toBe(true);
    expect(PROFILE).toMatchObject({
      sourceTopologyResistanceMmHgSecPerMl: 0.0465088,
      characteristicImpedanceResistanceMmHgSecPerMl: 0.035,
      residualDownstreamResistanceMmHgSecPerMl: 0.0115088,
      ascendingAorticDiameterCm: 3,
      referenceMaximumForwardEoaCm2: 3.5,
      parameterSearchOrFitting: false,
    });
    expect(
      PROFILE.characteristicImpedanceResistanceMmHgSecPerMl
        + PROFILE.residualDownstreamResistanceMmHgSecPerMl,
    ).toBe(PROFILE.sourceTopologyResistanceMmHgSecPerMl);
    expect(PROFILE.ascendingAorticAreaCm2)
      .toBe(Math.PI * (PROFILE.ascendingAorticDiameterCm / 2) ** 2);
    expect(PROFILE.downstreamResistanceScaleFromTopology)
      .toBe(
        PROFILE.residualDownstreamResistanceMmHgSecPerMl
          / PROFILE.sourceTopologyResistanceMmHgSecPerMl,
      );
  });

  it("reconstructs Pprox and closes the pressure and power ledgers", () => {
    const output = evaluate(12, 0.7);
    const q = output.flowMlPerSec;
    const zcPressure =
      PROFILE.characteristicImpedanceResistanceMmHgSecPerMl * q;
    const sourceLinearPressure =
      AOV.backgroundLinearResistanceMmHgSecPerMl * q;
    const irreversiblePressure = output.bernoulliMmHgSec2PerMl2 * q ** 2;
    const expectedElco = output.activeEoaCm2 * PROFILE.ascendingAorticAreaCm2
      / (PROFILE.ascendingAorticAreaCm2 - output.activeEoaCm2);
    const expectedPortCoefficient =
      idealBernoulliLossFromEffectiveOrificeAreaV2(expectedElco)
      + idealBernoulliLossFromEffectiveOrificeAreaV2(
        PROFILE.ascendingAorticAreaCm2,
      );

    expect(output.valid).toBe(true);
    expect(output.activeDirection).toBe("forward");
    expect(output.energyLossCoefficientAreaCm2).toBeCloseTo(expectedElco, 13);
    expect(output.portConvectivePressureMmHgSec2PerMl2)
      .toBeCloseTo(expectedPortCoefficient, 14);
    expect(output.characteristicImpedancePressureMmHg)
      .toBeCloseTo(zcPressure, 13);
    expect(output.algebraicProximalConstitutivePortPressureMmHg)
      .toBeCloseTo(80 + zcPressure, 13);
    expect(output.localValvePressureGradientMmHg)
      .toBeCloseTo(12 - zcPressure, 13);
    expect(output.localValvePressureGradientMmHg).toBeCloseTo(
      sourceLinearPressure
        + irreversiblePressure
        + output.downstreamKineticPressureMmHg,
      11,
    );
    expect(Math.abs(output.openOrificeResidualMmHg)).toBeLessThan(1e-10);
    expect(Math.abs(output.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-10);
    expect(Math.abs(output.powerBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-7);
    expect(output.dissipativePowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(output.downstreamKineticPowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(output.characteristicWaveLoadPowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(output.openingCouplingIterationCount).toBeGreaterThan(0);
    expect(Math.abs(output.openingCouplingResidual01)).toBeLessThan(1e-12);
    expect(Math.abs(output.openingEquationResidual01)).toBeLessThan(1e-12);
  });

  it("drives opening from LV minus Pprox rather than the raw node gap", () => {
    const output = evaluate(1, 0);
    const localTarget = openingTarget(
      output.localValvePressureGradientMmHg,
      AOV,
    );
    const rawTarget = openingTarget(output.pressureGradientMmHg, AOV);

    expect(output.localValvePressureGradientMmHg)
      .toBeLessThan(output.pressureGradientMmHg);
    expect(output.openingTarget01).toBeCloseTo(localTarget, 13);
    expect(output.openingTarget01).toBeLessThan(rawTarget);
  });

  it("matches centered finite differences for total flow and opening tangents", () => {
    for (const rawGradient of [0.25, 1, 4, 12, 25]) {
      for (const previousOpening of [0, 0.25, 0.8]) {
        const output = evaluate(rawGradient, previousOpening);
        const h = 1e-5;
        const plus = evaluate(rawGradient + h, previousOpening);
        const minus = evaluate(rawGradient - h, previousOpening);
        const flowFiniteDifference =
          (plus.flowMlPerSec - minus.flowMlPerSec) / (2 * h);
        const openingFiniteDifference =
          (plus.state.leafletOpeningFraction01
            - minus.state.leafletOpeningFraction01) / (2 * h);
        const localGradientFiniteDifference =
          (plus.localValvePressureGradientMmHg
            - minus.localValvePressureGradientMmHg) / (2 * h);
        const localGradientTangent =
          1 - PROFILE.characteristicImpedanceResistanceMmHgSecPerMl
            * output.dFlowDPressureGradientMlPerSecPerMmHg;

        expect(output.valid).toBe(true);
        expect(output.dFlowDPressureGradientMlPerSecPerMmHg)
          .toBeGreaterThanOrEqual(0);
        expect(output.dLeafletOpeningFractionDPressureGradientPerMmHg)
          .toBeGreaterThanOrEqual(0);
        expect(output.dFlowDPressureGradientMlPerSecPerMmHg)
          .toBeCloseTo(flowFiniteDifference, 5);
        expect(output.dLeafletOpeningFractionDPressureGradientPerMmHg)
          .toBeCloseTo(openingFiniteDifference, 6);
        expect(localGradientTangent)
          .toBeCloseTo(localGradientFiniteDifference, 6);
      }
    }
  });

  it("has no tolerance-created deadband for a tiny favorable gradient", () => {
    const output = evaluate(2e-7, 0);

    expect(output.valid).toBe(true);
    expect(output.state.leafletOpeningFraction01).toBeGreaterThan(0);
    expect(output.activeEoaCm2).toBeGreaterThan(0);
    expect(output.flowMlPerSec).toBeGreaterThan(0);
    expect(output.subthresholdForwardSupportActive).toBe(false);
    expect(Math.abs(output.openingCouplingResidual01))
      .toBeLessThanOrEqual(PROFILE.openingResidualTolerance01);
  });

  it("uses the declared one-sided semismooth zero-gradient tangent", () => {
    const previousOpening = 0.4;
    const residualOpening = evaluate(0, previousOpening);
    const fullyClosed = evaluate(0, 0);

    expect(residualOpening.flowMlPerSec).toBe(0);
    expect(residualOpening.state.leafletOpeningFraction01).toBeCloseTo(
      previousOpening * AOV.closingTimeConstantSec
        / (AOV.closingTimeConstantSec + 0.001),
      14,
    );
    expect(residualOpening.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(
        1 / (
          AOV.backgroundLinearResistanceMmHgSecPerMl
            + PROFILE.characteristicImpedanceResistanceMmHgSecPerMl
        ),
        12,
      );
    expect(fullyClosed.activeEoaCm2).toBe(0);
    expect(fullyClosed.dFlowDPressureGradientMlPerSecPerMmHg).toBe(0);
  });

  it("retains competent reverse support with no added accepted state", () => {
    const output = evaluate(-15, 0.8);

    expect(output.activeDirection).toBe("reverse");
    expect(output.flowMlPerSec).toBe(0);
    expect(output.activeEoaCm2).toBe(0);
    expect(output.competentReverseClosureActive).toBe(true);
    expect(output.hydraulicBalanceResidualMmHg).toBe(0);
    expect(output.hydraulicPowerInputMmHgMlPerSec).toBe(0);
    expect(output.dissipativePowerMmHgMlPerSec).toBe(0);
    expect(output.downstreamKineticPowerMmHgMlPerSec).toBe(0);
    expect(output.characteristicWaveLoadPowerMmHgMlPerSec).toBe(0);
    expect(output.powerBalanceResidualMmHgMlPerSec).toBe(0);
    expect(Object.keys(output.state)).toEqual(["leafletOpeningFraction01"]);
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1)
      .toMatchObject({
        acceptedMemory: "leaflet-opening-fraction-only",
        flowMemory: false,
        localValveInertance: false,
        newContinuousStateAdded: false,
      });
  });

  it(
    "retains the opening tangent for a closed valve with an active target",
    () => {
      const negativeOffset = Object.freeze({
        ...AOV,
        openingPressureOffsetMmHg: -2,
      });
      const output = evaluate(-1, 0, negativeOffset);
      const h = 1e-5;
      const openingFiniteDifference = (
        evaluate(-1 + h, 0, negativeOffset).state.leafletOpeningFraction01
          - evaluate(-1 - h, 0, negativeOffset).state.leafletOpeningFraction01
      ) / (2 * h);

      expect(output.activeDirection).toBe("reverse");
      expect(output.activeEoaCm2).toBe(0);
      expect(output.flowMlPerSec).toBe(0);
      expect(output.dFlowDPressureGradientMlPerSecPerMmHg).toBe(0);
      expect(output.dLeafletOpeningFractionDPressureGradientPerMmHg)
        .toBeCloseTo(openingFiniteDifference, 7);
    },
  );

  it("keeps reverse EROA loss valvular and does not apply pressure recovery", () => {
    const regurgitant = Object.freeze({
      ...AOV,
      closedReverseEroaCm2: 0.2,
    });
    const output = evaluate(-15, 0.8, regurgitant);
    const h = 1e-5;
    const finiteDifference = (
      evaluate(-15 + h, 0.8, regurgitant).flowMlPerSec
        - evaluate(-15 - h, 0.8, regurgitant).flowMlPerSec
    ) / (2 * h);

    expect(output.activeDirection).toBe("reverse");
    expect(output.flowMlPerSec).toBeLessThan(0);
    expect(output.downstreamKineticPressureMmHg).toBe(0);
    expect(output.pressureRecoveryFromVenaContractaMmHg).toBe(0);
    expect(output.pressureRecoveryFraction01).toBe(0);
    expect(output.dissipativePowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(output.characteristicWaveLoadPowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(output.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(finiteDifference, 6);
    expect(Math.abs(output.powerBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-8);
  });

  it("reports malformed fixed profiles with canonical invalid readback identity", () => {
    for (const malformed of [null, {}]) {
      const output = stepMainWireAorticRecoveredRootPortValveScalarsV1(
        0,
        0.001,
        90,
        80,
        AOV,
        malformed as unknown as MainWireAorticRecoveredRootProfileV1,
      );

      expect(output.valid).toBe(false);
      expect(output.finite).toBe(false);
      expect(output.recoveredRootProfileId).toBe(PROFILE.profileId);
      expect(output.openingDrivePressureStation)
        .toBe(PROFILE.openingDrivePressureStation);
      expect(output.characteristicImpedanceResistanceMmHgSecPerMl)
        .toBe(PROFILE.characteristicImpedanceResistanceMmHgSecPerMl);
      expect(output.ascendingAorticAreaCm2).toBe(PROFILE.ascendingAorticAreaCm2);
      expect(output.issues.length).toBeGreaterThan(0);
    }
  });
});

function openingTarget(
  pressureGradientMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): number {
  const drive = pressureGradientMmHg
    - params.openingDriveDeadbandMmHg
    - params.openingPressureOffsetMmHg;
  const positiveDrive = drive <= 0
    ? 0
    : drive >= params.openingDriveSmoothingMmHg
      ? drive - 0.5 * params.openingDriveSmoothingMmHg
      : drive ** 2 / (2 * params.openingDriveSmoothingMmHg);
  return 1 - Math.exp(-params.openingGainPerMmHg * positiveDrive);
}
