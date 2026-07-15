import { describe, expect, it } from "vitest";
import {
  evaluatePeripheralResistanceV1,
  evaluateLinearVascularComplianceV1,
} from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";
import {
  evaluateSignedFlowMomentumV1,
  evaluateValveLossCoefficientsV1,
  evaluateValveMomentumV1,
  type ValveLossParametersV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import {
  PERICARDIAL_TRANSITION_HALF_WIDTH_V1,
  composeFourChamberCavityPressuresV1,
  computeIntrapericardialHeartVolumeM3V1,
  evaluateCommonPericardiumV1,
  evaluateCommonPericardiumWidthSensitivityV1,
  evaluatePericardialPositivePartV1,
  evaluatePericardialPositivePartWidthSensitivityV1,
} from "@/engine/myocardium/fourChamberV1/pericardium/commonPericardiumV1";

describe("four-chamber Phase A1 vascular, flow-loss, and pericardial components", () => {
  it("derives linear vascular pressure from one elastic energy and preserves monotonicity", () => {
    const parameters = {
      unstressedVolumeM3: 500e-6,
      complianceM3PerPa: 12e-9,
      externalPressurePa: 300,
    };
    const volumeM3 = 620e-6;
    const output = evaluateLinearVascularComplianceV1(parameters, volumeM3);
    expect(output.absolutePressurePa).toBeCloseTo(10_300, 12);
    expect(output.pressureDerivativePaPerM3).toBeGreaterThan(0);

    const step = 1e-10;
    const energyDerivative = (
      evaluateLinearVascularComplianceV1(parameters, volumeM3 + step).elasticEnergyJ
      - evaluateLinearVascularComplianceV1(parameters, volumeM3 - step).elasticEnergyJ
    ) / (2 * step);
    expectRelativeErrorBelow(energyDerivative, output.elasticPressurePa, 1e-9);
    expect(evaluateLinearVascularComplianceV1(parameters, volumeM3 + step).absolutePressurePa)
      .toBeGreaterThan(evaluateLinearVascularComplianceV1(parameters, volumeM3 - step).absolutePressurePa);

    const resistance = evaluatePeripheralResistanceV1(20e6, -80e-6);
    expect(resistance.pressureDropPa).toBeLessThan(0);
    expect(resistance.dissipationW).toBeGreaterThan(0);
  });

  it("keeps signed inlet flow, nonnegative loss, and an exact flow tangent", () => {
    const parameters = {
      inertancePaSec2PerM3: 1.2e6,
      linearResistancePaSecPerM3: 8e6,
      quadraticResistancePaSec2PerM6: 1.5e10,
      flowSmoothingM3PerSec: 1e-8,
    };
    const flow = -60e-6;
    const output = evaluateSignedFlowMomentumV1(parameters, -900, flow);
    expect(output.flowM3PerSec).toBe(flow);
    expect(output.signedLossPressurePa).toBeLessThan(0);
    expect(output.dissipationW).toBeGreaterThan(0);
    expect(output.flowAccelerationM3PerSec2).toBeLessThan(0);

    const step = 1e-10;
    const derivative = (
      evaluateSignedFlowMomentumV1(parameters, -900, flow + step).signedLossPressurePa
      - evaluateSignedFlowMomentumV1(parameters, -900, flow - step).signedLossPressurePa
    ) / (2 * step);
    expectRelativeErrorBelow(derivative, output.lossDerivativePaSecPerM3, 1e-9);
  });

  it("separates valve EOA, physiological EROA, and numerical reverse permeability", () => {
    const parameters = valveFixture();
    const forward = evaluateValveLossCoefficientsV1(parameters, 2_000);
    const reverse = evaluateValveLossCoefficientsV1(parameters, -2_000);
    const atZero = evaluateValveLossCoefficientsV1(parameters, 0);

    expect(forward.pressureGate).toBeGreaterThan(0.99);
    expect(reverse.pressureGate).toBeLessThan(0.01);
    expect(reverse.inverseSquareLossPerM4).toBeGreaterThan(forward.inverseSquareLossPerM4);
    expect(atZero.pressureGate).toBe(0.5);
    expect(forward.reverseLossAreaM2).toBeCloseTo(Math.hypot(
      parameters.physiologicalRegurgitantAreaM2,
      parameters.numericalReverseAreaM2,
    ), 14);
    expect(forward.physiologicalEroaLeftCensored).toBe(false);

    const competent = evaluateValveLossCoefficientsV1({
      ...parameters,
      physiologicalRegurgitantAreaM2: 0,
    }, -2_000);
    expect(competent.physiologicalEroaLeftCensored).toBe(true);
    expect(competent.reverseLossAreaM2).toBe(parameters.numericalReverseAreaM2);

    const pressureStep = 1e-3;
    const gateDerivative = (
      evaluateValveLossCoefficientsV1(parameters, pressureStep).inverseSquareLossPerM4
      - evaluateValveLossCoefficientsV1(parameters, -pressureStep).inverseSquareLossPerM4
    ) / (2 * pressureStep);
    expectRelativeErrorBelow(gateDerivative, atZero.inverseSquareLossDerivativePerM4Pa, 1e-9);

    const reverseFlow = evaluateValveMomentumV1(parameters, -1_000, -20e-6);
    expect(reverseFlow.flowM3PerSec).toBeLessThan(0);
    expect(reverseFlow.dissipationW).toBeGreaterThan(0);
  });

  it("implements the exact C2 pericardial engagement polynomial", () => {
    const delta = PERICARDIAL_TRANSITION_HALF_WIDTH_V1;
    expect(evaluatePericardialPositivePartV1(-delta)).toEqual({
      value: 0,
      firstDerivative: 0,
      secondDerivative: 0,
      branch: "zero",
    });
    expect(evaluatePericardialPositivePartV1(delta)).toEqual({
      value: delta,
      firstDerivative: 1,
      secondDerivative: 0,
      branch: "linear",
    });
    const center = evaluatePericardialPositivePartV1(0);
    expect(center.value).toBeCloseTo(3 * delta / 16, 15);
    expect(center.firstDerivative).toBe(0.5);
    expect(center.secondDerivative).toBeGreaterThan(0);

    for (let index = 0; index <= 100; index += 1) {
      const x = -delta + 2 * delta * index / 100;
      const value = evaluatePericardialPositivePartV1(x);
      expect(value.value).toBeGreaterThanOrEqual(0);
      expect(value.firstDerivative).toBeGreaterThanOrEqual(0);
      expect(value.secondDerivative).toBeGreaterThanOrEqual(0);
    }
  });

  it("derives common pericardial pressure and tangent from one energy", () => {
    const parameters = {
      referenceHeartVolumeM3: 700e-6,
      exponentialPressureScalePa: 500,
      exponentialStiffness: 8,
      effusionPressurePa: 100,
    };
    const volume = 735e-6;
    const output = evaluateCommonPericardiumV1(parameters, volume);
    expect(output.excessPressurePa).toBeGreaterThanOrEqual(parameters.effusionPressurePa);
    expect(output.pressureDerivativePaPerM3).toBeGreaterThan(0);

    const step = 1e-10;
    const energyDerivative = (
      evaluateCommonPericardiumV1(parameters, volume + step).storedEnergyJ
      - evaluateCommonPericardiumV1(parameters, volume - step).storedEnergyJ
    ) / (2 * step);
    expect(energyDerivative).toBeCloseTo(output.excessPressurePa, 5);
    const pressureDerivative = (
      evaluateCommonPericardiumV1(parameters, volume + step).excessPressurePa
      - evaluateCommonPericardiumV1(parameters, volume - step).excessPressurePa
    ) / (2 * step);
    expectRelativeErrorBelow(pressureDerivative, output.pressureDerivativePaPerM3, 1e-9);

    for (const factor of [0.5, 1, 2] as const) {
      const delta = PERICARDIAL_TRANSITION_HALF_WIDTH_V1 * factor;
      for (const x of [-delta, -0.5 * delta, 0, 0.5 * delta, delta]) {
        const pointVolume = parameters.referenceHeartVolumeM3 * (1 + x);
        const point = evaluateCommonPericardiumWidthSensitivityV1(
          parameters,
          pointVolume,
          factor,
        );
        const volumeStep = parameters.referenceHeartVolumeM3 * delta * 1e-5;
        const pressureFromEnergy = (
          evaluateCommonPericardiumWidthSensitivityV1(
            parameters,
            pointVolume + volumeStep,
            factor,
          ).storedEnergyJ
          - evaluateCommonPericardiumWidthSensitivityV1(
            parameters,
            pointVolume - volumeStep,
            factor,
          ).storedEnergyJ
        ) / (2 * volumeStep);
        const tangentFromPressure = (
          evaluateCommonPericardiumWidthSensitivityV1(
            parameters,
            pointVolume + volumeStep,
            factor,
          ).excessPressurePa
          - evaluateCommonPericardiumWidthSensitivityV1(
            parameters,
            pointVolume - volumeStep,
            factor,
          ).excessPressurePa
        ) / (2 * volumeStep);
        expectRelativeErrorBelow(pressureFromEnergy, point.excessPressurePa, 2e-8);
        expectRelativeErrorBelow(tangentFromPressure, point.pressureDerivativePaPerM3, 1e-5);
      }
    }

    const centerPressures = ([0.5, 1, 2] as const).map((factor) =>
      evaluateCommonPericardiumWidthSensitivityV1(
        parameters,
        parameters.referenceHeartVolumeM3,
        factor,
      ).excessPressurePa);
    expect(centerPressures[0]).toBeLessThan(centerPressures[1]);
    expect(centerPressures[1]).toBeLessThan(centerPressures[2]);

    const chamberVolumeRatesM3PerSec = [12e-6, -5e-6, 9e-6, -3e-6];
    const totalRate = chamberVolumeRatesM3PerSec.reduce((sum, rate) => sum + rate, 0);
    const center = evaluateCommonPericardiumV1(parameters, parameters.referenceHeartVolumeM3);
    const timeStepSec = 1e-6;
    const energyRate = (
      evaluateCommonPericardiumV1(
        parameters,
        parameters.referenceHeartVolumeM3 + totalRate * timeStepSec,
      ).storedEnergyJ
      - evaluateCommonPericardiumV1(
        parameters,
        parameters.referenceHeartVolumeM3 - totalRate * timeStepSec,
      ).storedEnergyJ
    ) / (2 * timeStepSec);
    expectRelativeErrorBelow(energyRate, center.excessPressurePa * totalRate, 2e-8);
    expect(() => evaluateCommonPericardiumWidthSensitivityV1(
      parameters,
      parameters.referenceHeartVolumeM3,
      3 as never,
    )).toThrow(/0.5, 1, or 2/);
    expect(evaluatePericardialPositivePartWidthSensitivityV1(0, 2).value)
      .toBeCloseTo(2 * evaluatePericardialPositivePartV1(0).value, 15);
  });

  it("computes one common bag volume without creating a blood-volume state", () => {
    const total = computeIntrapericardialHeartVolumeM3V1({
      leftAtrialBloodVolumeM3: 60e-6,
      leftVentricularBloodVolumeM3: 140e-6,
      rightAtrialBloodVolumeM3: 70e-6,
      rightVentricularBloodVolumeM3: 160e-6,
      wallMaterialVolumesM3: [20e-6, 18e-6, 120e-6, 45e-6, 80e-6],
    });
    expect(total).toBeCloseTo(713e-6, 15);
    expect(() => computeIntrapericardialHeartVolumeM3V1({
      leftAtrialBloodVolumeM3: 1,
      leftVentricularBloodVolumeM3: 1,
      rightAtrialBloodVolumeM3: 1,
      rightVentricularBloodVolumeM3: 1,
      wallMaterialVolumesM3: [1, 1, 1, 1, 1, 1] as never,
    })).toThrow(/five-wall array/);
  });

  it("adds one identical pericardial pressure to all four chambers without a volume channel", () => {
    const transmural = { LA: 500, LV: 10_000, RA: 300, RV: 3_000 };
    const result = composeFourChamberCavityPressuresV1(transmural, -200, 750);
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      expect(result[chamber] - transmural[chamber]).toBe(550);
    }
    expect(Object.keys(result).some((key) => /volume/i.test(key))).toBe(false);
    expect(() => composeFourChamberCavityPressuresV1({
      ...transmural,
      hiddenReservoirVolumeM3: 1,
    } as never, 0, 0)).toThrow(/unknown fields: hiddenReservoirVolumeM3/);
  });

  it("preserves the physiological direction of stenosis and regurgitation changes", () => {
    const reference = valveFixture();
    const forwardReference = evaluateValveLossCoefficientsV1(reference, 2_000);
    const forwardStenosis = evaluateValveLossCoefficientsV1({
      ...reference,
      openAreaM2: reference.openAreaM2 / 2,
    }, 2_000);
    expect(forwardStenosis.inverseSquareLossPerM4).toBeGreaterThan(
      forwardReference.inverseSquareLossPerM4,
    );

    const reverseReference = evaluateValveLossCoefficientsV1(reference, -2_000);
    const reverseRegurgitation = evaluateValveLossCoefficientsV1({
      ...reference,
      physiologicalRegurgitantAreaM2: 2 * reference.physiologicalRegurgitantAreaM2,
    }, -2_000);
    expect(reverseRegurgitation.inverseSquareLossPerM4).toBeLessThan(
      reverseReference.inverseSquareLossPerM4,
    );
  });

  it("rejects nonphysical domains and non-finite derived values", () => {
    expect(() => evaluateLinearVascularComplianceV1({
      unstressedVolumeM3: 0,
      complianceM3PerPa: 0,
      externalPressurePa: 0,
    }, 1)).toThrow(/complianceM3PerPa/);
    expect(() => evaluateSignedFlowMomentumV1({
      inertancePaSec2PerM3: 1,
      linearResistancePaSecPerM3: Number.MAX_VALUE,
      quadraticResistancePaSec2PerM6: 0,
      flowSmoothingM3PerSec: 1,
    }, 1, Number.MAX_VALUE)).toThrow(/non-finite/);
    expect(() => evaluateValveLossCoefficientsV1({
      ...valveFixture(),
      numericalReverseAreaM2: 0,
    }, 0)).toThrow(/numericalReverseAreaM2/);
    expect(() => evaluateCommonPericardiumV1({
      referenceHeartVolumeM3: 1,
      exponentialPressureScalePa: Number.MAX_VALUE,
      exponentialStiffness: Number.MAX_VALUE,
      effusionPressurePa: 0,
    }, 2)).toThrow(/non-finite/);
  });

  it("rejects undeclared free fields and unhashed array metadata", () => {
    expect(() => evaluateLinearVascularComplianceV1({
      unstressedVolumeM3: 0,
      complianceM3PerPa: 1,
      externalPressurePa: 0,
      empiricalPressureGain: 2,
    } as never, 1)).toThrow(/unknown fields: empiricalPressureGain/);
    expect(() => evaluateValveLossCoefficientsV1({
      ...valveFixture(),
      dischargeCoefficient: 0.7,
    } as never, 0)).toThrow(/unknown fields: dischargeCoefficient/);
    expect(() => evaluateCommonPericardiumV1({
      referenceHeartVolumeM3: 1,
      exponentialPressureScalePa: 1,
      exponentialStiffness: 1,
      effusionPressurePa: 0,
      waveformFitGain: 2,
    } as never, 1)).toThrow(/unknown fields: waveformFitGain/);

    const walls = [1, 1, 1, 1, 1] as number[] & { hiddenGain?: number };
    walls.hiddenGain = 2;
    expect(() => computeIntrapericardialHeartVolumeM3V1({
      leftAtrialBloodVolumeM3: 1,
      leftVentricularBloodVolumeM3: 1,
      rightAtrialBloodVolumeM3: 1,
      rightVentricularBloodVolumeM3: 1,
      wallMaterialVolumesM3: walls as never,
    })).toThrow(/extra field: hiddenGain/);
  });
});

function valveFixture(): ValveLossParametersV1 {
  return {
    openAreaM2: 4e-4,
    physiologicalRegurgitantAreaM2: 5e-5,
    numericalReverseAreaM2: 2e-6,
    pressureGateWidthPa: 200,
    bloodDynamicViscosityPaSec: 3.5e-3,
    bloodDensityKgPerM3: 1_060,
    viscousEffectiveLengthM: 0.01,
    inertialEffectiveLengthM: 0.01,
    inertialReferenceAreaM2: 4e-4,
    flowSmoothingM3PerSec: 1e-8,
  };
}

function expectRelativeErrorBelow(actual: number, expected: number, tolerance: number): void {
  expect(Math.abs(actual - expected) / Math.max(1, Math.abs(expected))).toBeLessThan(tolerance);
}
