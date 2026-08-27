import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_CLAIM_V1,
  MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1,
  resolveMainWireAorticValveResearchProfileV1,
  stepMainWireAorticValvePressureRecoveryAblationScalarsV1,
  validateMainWireAorticValveResearchProfileV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  stepMainWireQuasiSteadyOrificeValveScalarsV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

const AOV = Object.freeze({
  parameterSetId: "test-normal-AoV-pressure-recovery-ablation-v1",
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

describe("MainWireAorticValvePressureRecoveryAblationV1", () => {
  it("owns only fixed, non-fitting research profiles", () => {
    expect(MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1).toEqual([
      "pressure-recovery-aa-d3p0cm",
      "instantaneous-opening",
      "pressure-recovery-aa-d3p0cm-instantaneous-opening",
    ]);
    for (const profileId of MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1) {
      const profile = resolveMainWireAorticValveResearchProfileV1(profileId);
      expect(validateMainWireAorticValveResearchProfileV1(profile)).toEqual([]);
      expect(profile.parameterSearchOrFitting).toBe(false);
      expect(Object.isFrozen(profile)).toBe(true);
    }
    expect(MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_CLAIM_V1)
      .toMatchObject({
        flowMemory: false,
        localValveInertance: false,
        rootInertanceOwnerChanged: false,
        pressureRecoveryAddsState: false,
        reverseFlowPressureRecoveryApplied: false,
      });
  });

  it("separates Garcia ELCo loss from downstream kinetic flux at the static root port", () => {
    const profile = resolveMainWireAorticValveResearchProfileV1(
      "pressure-recovery-aa-d3p0cm",
    );
    const output = stepMainWireAorticValvePressureRecoveryAblationScalarsV1(
      1,
      0.001,
      19,
      10,
      AOV,
      profile,
    );
    const area = output.activeEoaCm2;
    const aorticArea = profile.ascendingAorticAreaCm2!;
    const expectedEnergyLossArea = area * aorticArea / (aorticArea - area);
    const expectedIrreversibleCoefficient =
      idealBernoulliLossFromEffectiveOrificeAreaV2(expectedEnergyLossArea);
    const expectedDownstreamKineticCoefficient =
      idealBernoulliLossFromEffectiveOrificeAreaV2(aorticArea);
    const expectedPortCoefficient =
      expectedIrreversibleCoefficient
      + expectedDownstreamKineticCoefficient;
    const areaRatio = area / aorticArea;

    expect(output.valid).toBe(true);
    expect(output.energyLossCoefficientAreaCm2)
      .toBeCloseTo(expectedEnergyLossArea, 14);
    expect(output.venaContractaBernoulliMmHgSec2PerMl2)
      .toBeCloseTo(idealBernoulliLossFromEffectiveOrificeAreaV2(area), 15);
    expect(output.bernoulliMmHgSec2PerMl2)
      .toBeCloseTo(expectedIrreversibleCoefficient, 15);
    expect(output.portConvectivePressureMmHgSec2PerMl2)
      .toBeCloseTo(expectedPortCoefficient, 15);
    expect(output.portConvectivePressureMmHgSec2PerMl2)
      .toBeLessThan(output.venaContractaBernoulliMmHgSec2PerMl2);
    expect(output.recoveredStaticPressureMmHg).toBeGreaterThan(0);
    expect(output.pressureRecoveryFraction01)
      .toBeCloseTo(2 * areaRatio * (1 - areaRatio), 14);
    expect(output.netStaticConvectivePressureMmHg)
      .toBeCloseTo(
        expectedPortCoefficient * output.flowMlPerSec ** 2,
        12,
      );
    expect(output.downstreamKineticPressureMmHg)
      .toBeCloseTo(
        expectedDownstreamKineticCoefficient * output.flowMlPerSec ** 2,
        12,
      );
    expect(Math.abs(output.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-12);
    expect(Math.abs(output.powerBalanceResidualMmHgMlPerSec)).toBeLessThan(1e-8);
    expect(output.dissipativePowerMmHgMlPerSec).toBeGreaterThanOrEqual(0);
    expect(output.downstreamKineticPowerMmHgMlPerSec).toBeGreaterThan(0);
  });

  it("changes the forward net drop without changing the bounded opening update", () => {
    const recovery = stepMainWireAorticValvePressureRecoveryAblationScalarsV1(
      0.25,
      0.001,
      13,
      8,
      AOV,
      resolveMainWireAorticValveResearchProfileV1(
        "pressure-recovery-aa-d3p0cm",
      ),
    );
    const canonical = stepMainWireQuasiSteadyOrificeValveScalarsV2(
      0.25,
      0.001,
      13,
      8,
      AOV,
    );

    expect(recovery.state).toEqual(canonical.state);
    expect(recovery.openingTarget01).toBe(canonical.openingTarget01);
    expect(recovery.flowMlPerSec).toBeGreaterThan(canonical.flowMlPerSec);
  });

  it("does not apply pressure recovery to reverse EROA flow", () => {
    const regurgitant = Object.freeze({
      ...AOV,
      closedReverseEroaCm2: 0.2,
    });
    const recovery = stepMainWireAorticValvePressureRecoveryAblationScalarsV1(
      0.7,
      0.001,
      5,
      20,
      regurgitant,
      resolveMainWireAorticValveResearchProfileV1(
        "pressure-recovery-aa-d3p0cm",
      ),
    );
    const canonical = stepMainWireQuasiSteadyOrificeValveScalarsV2(
      0.7,
      0.001,
      5,
      20,
      regurgitant,
    );

    expect(recovery.activeDirection).toBe("reverse");
    expect(recovery.flowMlPerSec).toBe(canonical.flowMlPerSec);
    expect(recovery.bernoulliMmHgSec2PerMl2)
      .toBe(canonical.bernoulliMmHgSec2PerMl2);
    expect(recovery.portConvectivePressureMmHgSec2PerMl2)
      .toBe(canonical.bernoulliMmHgSec2PerMl2);
    expect(recovery.downstreamKineticPressureMmHg).toBe(0);
    expect(recovery.downstreamKineticPowerMmHgMlPerSec).toBe(0);
    expect(recovery.recoveredStaticPressureMmHg).toBe(0);
    expect(recovery.pressureRecoveryFraction01).toBe(0);
  });

  it("makes the instantaneous-opening arm independent of previous xi", () => {
    const profile = resolveMainWireAorticValveResearchProfileV1(
      "instantaneous-opening",
    );
    const fromClosed = stepMainWireAorticValvePressureRecoveryAblationScalarsV1(
      0,
      0.001,
      11,
      10,
      AOV,
      profile,
    );
    const fromOpen = stepMainWireAorticValvePressureRecoveryAblationScalarsV1(
      1,
      0.001,
      11,
      10,
      AOV,
      profile,
    );

    expect(fromClosed.openingMemoryUsed).toBe(false);
    expect(fromClosed.tangentMode)
      .toBe("instantaneous-opening-constraint-eliminated");
    expect(fromClosed.state).toEqual(fromOpen.state);
    expect(fromClosed.flowMlPerSec).toBe(fromOpen.flowMlPerSec);
    expect(fromClosed.openingEquationResidual01).toBe(0);
  });

  it("provides an analytic pressure-flow tangent for every fixed profile", () => {
    const pressureGradientMmHg = 1.2;
    const h = 1e-5;
    for (const profileId of MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1) {
      const profile = resolveMainWireAorticValveResearchProfileV1(profileId);
      const evaluate = (gradient: number) =>
        stepMainWireAorticValvePressureRecoveryAblationScalarsV1(
          0.35,
          0.001,
          10 + gradient,
          10,
          AOV,
          profile,
        );
      const output = evaluate(pressureGradientMmHg);
      const finiteDifference = (
        evaluate(pressureGradientMmHg + h).flowMlPerSec
        - evaluate(pressureGradientMmHg - h).flowMlPerSec
      ) / (2 * h);
      expect(output.dFlowDPressureGradientMlPerSecPerMmHg)
        .toBeCloseTo(finiteDifference, 5);
    }
  });

  it("fails closed when fixed root area is not larger than maximum EOA", () => {
    const output = stepMainWireAorticValvePressureRecoveryAblationScalarsV1(
      0.5,
      0.001,
      15,
      10,
      { ...AOV, maximumForwardEoaCm2: 8 },
      resolveMainWireAorticValveResearchProfileV1(
        "pressure-recovery-aa-d3p0cm",
      ),
    );
    expect(output.valid).toBe(false);
    expect(output.issues.join(" ")).toMatch(/area greater than maximum forward EOA/);
  });
});
