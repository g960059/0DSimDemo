import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1,
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILE_IDS_V1,
  resolveMainWireAorticRecoveredRootPortValveProfileV1,
  stepMainWireAorticRecoveredRootPortValveScalarsV1,
  validateMainWireAorticRecoveredRootPortValveProfileV1,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import {
  resolveMainWireAorticCharacteristicResistancePlacementProfileV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";
import {
  resolveMainWireAorticValveResearchProfileV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";
import {
  evaluateMainWireValveOpeningTargetAndTangentV2,
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

const PLACEMENT =
  resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
    "Land2017-characteristic-impedance-matched",
  );
const RECOVERY = resolveMainWireAorticValveResearchProfileV1(
  "pressure-recovery-aa-d3p0cm",
);
const PORT = resolveMainWireAorticRecoveredRootPortValveProfileV1(
  "Land2017-Zc-Garcia-AA-d3p0cm-local-opening",
);
const PAIRED_GEOMETRY_PROFILES =
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILE_IDS_V1.map(
    (portProfileId) => {
      const port = resolveMainWireAorticRecoveredRootPortValveProfileV1(
        portProfileId,
      );
      return Object.freeze({
        port,
        recovery: resolveMainWireAorticValveResearchProfileV1(
          port.pressureRecoveryProfileId,
        ),
      });
    },
  );

function evaluate(
  rawGradientMmHg: number,
  previousOpening01 = 0.35,
  params: MainWireQuasiSteadyOrificeValveParamsV2 = AOV,
  recovery = RECOVERY,
  port = PORT,
) {
  return stepMainWireAorticRecoveredRootPortValveScalarsV1(
    previousOpening01,
    0.001,
    80 + rawGradientMmHg,
    80,
    params,
    PLACEMENT,
    recovery,
    port,
  );
}

describe("MainWireAorticRecoveredRootPortValveV1", () => {
  it("owns three paired immutable non-fitted profiles without adding state", () => {
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILE_IDS_V1)
      .toEqual([
        "Land2017-Zc-Garcia-AA-d3p0cm-local-opening",
        "Land2017-Zc-Garcia-AA-d2p5cm-local-opening",
        "Land2017-Zc-Garcia-AA-d3p8cm-local-opening",
      ]);
    for (
      const profileId of
        MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILE_IDS_V1
    ) {
      const profile = resolveMainWireAorticRecoveredRootPortValveProfileV1(
        profileId,
      );
      const recovery = resolveMainWireAorticValveResearchProfileV1(
        profile.pressureRecoveryProfileId,
      );
      expect(validateMainWireAorticRecoveredRootPortValveProfileV1(profile))
        .toEqual([]);
      expect(Object.isFrozen(profile)).toBe(true);
      expect(profile.parameterSearchOrFitting).toBe(false);
      expect(recovery.openingMode).toBe("bounded-backward-euler-memory");
      expect(recovery.ascendingAorticAreaCm2).toBeGreaterThan(3.5);
      const output = stepMainWireAorticRecoveredRootPortValveScalarsV1(
        0.35,
        0.001,
        92,
        80,
        AOV,
        PLACEMENT,
        recovery,
        profile,
      );
      expect(output.valid).toBe(true);
      expect(output.pressureRecoveryProfileId).toBe(recovery.profileId);
      expect(output.recoveredRootPortProfileId).toBe(profile.profileId);
      expect(Object.keys(output.state)).toEqual(["leafletOpeningFraction01"]);
    }
    expect(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1)
      .toMatchObject({
        acceptedMemory: "leaflet-opening-fraction-only",
        flowMemory: false,
        localValveInertance: false,
        newContinuousStateAdded: false,
        characteristicWaveLoadClassifiedAsValveDissipation: false,
        downstreamKineticTransportClassifiedAsValveDissipation: false,
      });
  });

  it("reconstructs all pressure stations and the owned energy ledger", () => {
    const output = evaluate(12, 0.7);
    const q = output.flowMlPerSec;
    const zcPressure =
      output.characteristicImpedanceResistanceMmHgSecPerMl * q;
    const irreversiblePressure = output.bernoulliMmHgSec2PerMl2 * q ** 2;
    const downstreamKineticPressure =
      output.downstreamKineticPressureMmHg;
    const sourceLinearPressure =
      output.sourceValveLinearResistanceMmHgSecPerMl * q;

    expect(output.valid).toBe(true);
    expect(Object.keys(output.state)).toEqual(["leafletOpeningFraction01"]);
    expect(output.activeDirection).toBe("forward");
    expect(output.characteristicImpedancePressureMmHg)
      .toBeCloseTo(zcPressure, 13);
    expect(output.algebraicProximalConstitutivePortPressureMmHg)
      .toBeCloseTo(80 + zcPressure, 13);
    expect(output.localValvePressureGradientMmHg)
      .toBeCloseTo(12 - zcPressure, 13);
    expect(output.localValvePressureGradientMmHg)
      .toBeCloseTo(
        sourceLinearPressure
          + irreversiblePressure
          + downstreamKineticPressure,
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

  it("drives opening from the local port gradient rather than the raw node gap", () => {
    const output = evaluate(1, 0);
    const localTarget = evaluateMainWireValveOpeningTargetAndTangentV2(
      output.localValvePressureGradientMmHg,
      AOV,
    ).openingTarget01;
    const rawTarget = evaluateMainWireValveOpeningTargetAndTangentV2(
      output.pressureGradientMmHg,
      AOV,
    ).openingTarget01;

    expect(output.localValvePressureGradientMmHg)
      .toBeLessThan(output.pressureGradientMmHg);
    expect(output.openingTarget01).toBeCloseTo(localTarget, 13);
    expect(output.openingTarget01).toBeLessThan(rawTarget);
  });

  it("matches finite-difference total tangents over all paired geometries and forward pressure trials", () => {
    for (const { recovery, port } of PAIRED_GEOMETRY_PROFILES) {
      for (const rawGradient of [0.25, 1, 4, 12, 25]) {
        for (const previousOpening of [0, 0.25, 0.8]) {
          const output = evaluate(
            rawGradient,
            previousOpening,
            AOV,
            recovery,
            port,
          );
          const h = 1e-5;
          const plus = evaluate(
            rawGradient + h,
            previousOpening,
            AOV,
            recovery,
            port,
          );
          const minus = evaluate(
            rawGradient - h,
            previousOpening,
            AOV,
            recovery,
            port,
          );
          const flowFiniteDifference =
            (plus.flowMlPerSec - minus.flowMlPerSec) / (2 * h);
          const openingFiniteDifference =
            (plus.state.leafletOpeningFraction01 -
              minus.state.leafletOpeningFraction01) /
            (2 * h);
          const localGradientFiniteDifference =
            (plus.localValvePressureGradientMmHg -
              minus.localValvePressureGradientMmHg) /
            (2 * h);
          const localGradientTangent =
            1 -
            output.characteristicImpedanceResistanceMmHgSecPerMl *
              output.dFlowDPressureGradientMlPerSecPerMmHg;

          expect(output.valid).toBe(true);
          expect(output.pressureRecoveryProfileId).toBe(recovery.profileId);
          expect(output.recoveredRootPortProfileId).toBe(port.profileId);
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
    }
  });

  it("has no tolerance-created zero-flow deadband for a tiny favorable gradient", () => {
    const output = evaluate(2e-7, 0);

    expect(output.valid).toBe(true);
    expect(output.state.leafletOpeningFraction01).toBeGreaterThan(0);
    expect(output.activeEoaCm2).toBeGreaterThan(0);
    expect(output.flowMlPerSec).toBeGreaterThan(0);
    expect(output.subthresholdForwardSupportActive).toBe(false);
    expect(Math.abs(output.openingCouplingResidual01)).toBeLessThanOrEqual(
      PORT.openingResidualTolerance01,
    );
  });

  it("uses the declared one-sided semismooth tangent at zero raw gradient", () => {
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
          + PLACEMENT.upstreamValveLinearResistanceAdditionMmHgSecPerMl
        ),
        12,
      );
    expect(fullyClosed.activeEoaCm2).toBe(0);
    expect(fullyClosed.dFlowDPressureGradientMlPerSecPerMmHg).toBe(0);
  });

  it("resolves both sides of the opening/closing time-constant switch", () => {
    const previousOpening = 0.2;
    const targetPositivePart = -Math.log(1 - previousOpening)
      / AOV.openingGainPerMmHg;
    const localThresholdMmHg = targetPositivePart
      + 0.5 * AOV.openingDriveSmoothingMmHg;
    const thresholdOpening = previousOpening;
    const area = AOV.closedReverseEroaCm2
      + thresholdOpening
        * (AOV.maximumForwardEoaCm2 - AOV.closedReverseEroaCm2);
    const convectiveCoefficient = RECOVERY.ascendingAorticAreaCm2 === null
      ? Number.NaN
      : (() => {
        const energyLossArea = area * RECOVERY.ascendingAorticAreaCm2
          / (RECOVERY.ascendingAorticAreaCm2 - area);
        const coefficientConstant = 1060 / (2 * 133.322387415) * 1e-4;
        return coefficientConstant / energyLossArea ** 2
          + coefficientConstant / RECOVERY.ascendingAorticAreaCm2 ** 2;
      })();
    const localFlow = (
      -AOV.backgroundLinearResistanceMmHgSecPerMl
      + Math.sqrt(
        AOV.backgroundLinearResistanceMmHgSecPerMl ** 2
          + 4 * convectiveCoefficient * localThresholdMmHg,
      )
    ) / (2 * convectiveCoefficient);
    const rawThresholdMmHg = localThresholdMmHg
      + PLACEMENT.upstreamValveLinearResistanceAdditionMmHgSecPerMl
        * localFlow;
    const below = evaluate(rawThresholdMmHg - 1e-6, previousOpening);
    const above = evaluate(rawThresholdMmHg + 1e-6, previousOpening);
    const h = 1e-8;
    const belowFiniteDifference = (
      evaluate(rawThresholdMmHg - 1e-6 + h, previousOpening).state
        .leafletOpeningFraction01
      - evaluate(rawThresholdMmHg - 1e-6 - h, previousOpening).state
        .leafletOpeningFraction01
    ) / (2 * h);
    const aboveFiniteDifference = (
      evaluate(rawThresholdMmHg + 1e-6 + h, previousOpening).state
        .leafletOpeningFraction01
      - evaluate(rawThresholdMmHg + 1e-6 - h, previousOpening).state
        .leafletOpeningFraction01
    ) / (2 * h);

    expect(below.openingTarget01).toBeLessThan(previousOpening);
    expect(above.openingTarget01).toBeGreaterThan(previousOpening);
    expect(below.dLeafletOpeningFractionDPressureGradientPerMmHg)
      .toBeCloseTo(belowFiniteDifference, 5);
    expect(above.dLeafletOpeningFractionDPressureGradientPerMmHg)
      .toBeCloseTo(aboveFiniteDifference, 5);
    expect(above.dLeafletOpeningFractionDPressureGradientPerMmHg)
      .toBeGreaterThan(
        below.dLeafletOpeningFractionDPressureGradientPerMmHg,
      );
  });

  it("retains competent reverse support and an explicit zero-flow energy ledger", () => {
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
    expect(output.openingCouplingIterationCount).toBe(0);
    expect(output.state.leafletOpeningFraction01).toBeCloseTo(
      0.8 * AOV.closingTimeConstantSec
        / (AOV.closingTimeConstantSec + 0.001),
      14,
    );
  });

  it("keeps reverse EROA loss valvular and does not apply recovery", () => {
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
    expect(output.recoveredStaticPressureMmHg).toBe(0);
    expect(output.pressureRecoveryFraction01).toBe(0);
    expect(output.dissipativePowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(output.characteristicWaveLoadPowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(output.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(finiteDifference, 6);
    expect(Math.abs(output.powerBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-8);
  });

  it("fails closed when the fixed station profiles do not match", () => {
    const wrongPlacement =
      resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
        "half-Ao-SA-resistance-upstream-of-root-compliance",
      );
    const output = stepMainWireAorticRecoveredRootPortValveScalarsV1(
      0.5,
      0.001,
      90,
      80,
      AOV,
      wrongPlacement,
      RECOVERY,
      PORT,
    );

    expect(output.valid).toBe(false);
    expect(output.issues.join(" ")).toContain(
      "fixed characteristic-resistance placement",
    );

    const d2p5Recovery = resolveMainWireAorticValveResearchProfileV1(
      "pressure-recovery-aa-d2p5cm",
    );
    const d3p8Port = resolveMainWireAorticRecoveredRootPortValveProfileV1(
      "Land2017-Zc-Garcia-AA-d3p8cm-local-opening",
    );
    const crossPaired = stepMainWireAorticRecoveredRootPortValveScalarsV1(
      0.5,
      0.001,
      90,
      80,
      AOV,
      PLACEMENT,
      d2p5Recovery,
      d3p8Port,
    );
    expect(crossPaired.valid).toBe(false);
    expect(crossPaired.issues.join(" ")).toContain(
      "requires bounded-memory Garcia pressure recovery",
    );
  });
});
