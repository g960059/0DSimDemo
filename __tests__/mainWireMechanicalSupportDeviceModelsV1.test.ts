import { describe, expect, it } from "vitest";

import {
  HEARTMATE_3_SIGNED_LITERATURE_CURVE_V1,
  HEARTMATE_II_LITERATURE_CURVE_V1,
  IMPELLA_CP_SPEED_RPM_BY_LEVEL_V1,
  IMPELLA_CP_MEAN_FLOW_RANGE_L_MIN_BY_LEVEL_V1,
  TAKAHASHI_SENKO_ECMO_CURVE_V1,
  createMechanicalSupportConfigV1,
  evaluateEcmoGasExchangeV1,
  evaluateIabpV1,
  evaluateMechanicalSupportHydraulicsV1,
  evaluateRotaryPumpV1,
  mechanicalSupportPresetV1,
  mechanicalSupportContextAlertsV1,
  mechanicalSupportAlertsV1,
  oxygenSaturationAtPo2V1,
  type EcmoGasExchangeConfigV1,
  type ImpellaPerformanceLevelV1,
  type RotaryPumpDeviceConfigV1,
} from "@/engine/devices";

const ZERO_SEGMENT = Object.freeze({
  linearResistanceMmHgSecPerMl: 0,
  quadraticResistanceMmHgSec2PerMl2: 0,
});

describe("main-wire mechanical support device laws V1", () => {
  it("obeys the rotary-pump affinity law and increases flow with speed", () => {
    const lowSpeed = evaluateLvad(4_000, 8, 80);
    const highSpeed = evaluateLvad(5_200, 8, 80);

    expect(lowSpeed.idealPumpHeadMmHg).toBeCloseTo(
      HEARTMATE_3_SIGNED_LITERATURE_CURVE_V1.shutoffHeadMmHg
        * (4_000 / HEARTMATE_3_SIGNED_LITERATURE_CURVE_V1.referenceSpeedRpm) ** 2,
      12,
    );
    expect(highSpeed.idealPumpHeadMmHg).toBeCloseTo(
      HEARTMATE_3_SIGNED_LITERATURE_CURVE_V1.shutoffHeadMmHg,
      12,
    );
    expect(highSpeed.idealPumpHeadMmHg / lowSpeed.idealPumpHeadMmHg)
      .toBeCloseTo((5_200 / 4_000) ** 2, 12);
    expect(highSpeed.flowLMin).toBeGreaterThan(lowSpeed.flowLMin);
  });

  it("decreases H-Q operating flow monotonically as afterload rises", () => {
    const flows = [60, 90, 120].map((outletPressureMmHg) =>
      evaluateLvad(5_200, 8, outletPressureMmHg).flowLMin
    );

    expect(flows[0]).toBeGreaterThan(flows[1]);
    expect(flows[1]).toBeGreaterThan(flows[2]);
    expect(flows[2]).toBeLessThan(0);
  });

  it.each([
    { speedRpm: 3_000, expectedHeadAt4LMinMmHg: 228.89469387755102 },
    { speedRpm: 3_500, expectedHeadAt4LMinMmHg: 317.48 },
  ])(
    "reproduces the published Senko ECMO curve benchmark at $speedRpm rpm",
    ({ speedRpm, expectedHeadAt4LMinMmHg }) => {
      const config = ecmoPumpOnlyConfig(speedRpm);
      const evaluation = evaluateRotaryPumpV1("VA_ECMO", config, {
        inletPressureMmHg: 0,
        outletPressureMmHg: expectedHeadAt4LMinMmHg,
        inletVolumeMl: 500,
      });

      expect(publishedSenkoHeadMmHg(speedRpm, 4))
        .toBeCloseTo(expectedHeadAt4LMinMmHg, 10);
      expect(evaluation.flowLMin).toBeCloseTo(4, 10);
      expect(evaluation.hydraulicResidualMmHg).toBeCloseTo(0, 9);
    },
  );

  it("reproduces the HeartMate-II steady Wang benchmark", () => {
    const config = mechanicalSupportPresetV1("lvad-hmii-9000").lvad;
    const evaluation = evaluateRotaryPumpV1("LVAD", config, {
      inletPressureMmHg: 5,
      outletPressureMmHg: 65,
      inletVolumeMl: 100,
    });
    const angularSpeedRadSec = 2 * Math.PI * 9_000 / 60;
    const expectedFlowLMin = (
      0.0000903 * angularSpeedRadSec ** 2 - 60
    ) / (
      HEARTMATE_II_LITERATURE_CURVE_V1.linearLossMmHgSecPerMl
      + 2 * 0.0677
    ) * 0.06;

    expect(expectedFlowLMin).toBeCloseTo(3.96, 2);
    expect(evaluation.flowLMin).toBeCloseTo(expectedFlowLMin, 12);
  });

  it("distinguishes a clamped circuit from pump-off retrograde flow", () => {
    const base = createMechanicalSupportConfigV1({
      lvad: {
        enabled: true,
        circuitClamped: false,
        speedRpm: 0,
      },
    }).lvad;
    const pumpOff = evaluateRotaryPumpV1("LVAD", base, {
      inletPressureMmHg: 8,
      outletPressureMmHg: 85,
      inletVolumeMl: 100,
    });
    const clamped = evaluateRotaryPumpV1(
      "LVAD",
      { ...base, circuitClamped: true },
      {
        inletPressureMmHg: 8,
        outletPressureMmHg: 85,
        inletVolumeMl: 100,
      },
    );

    expect(pumpOff.speedRpm).toBe(0);
    expect(pumpOff.flowLMin).toBeLessThan(0);
    expect(pumpOff.flowLMin).toBeGreaterThanOrEqual(
      -base.maximumReverseFlowLMin,
    );
    expect(clamped.flowLMin).toBe(0);
    expect(clamped.circuitClamped).toBe(true);
  });

  it("smoothly limits forward flow when inlet pressure or volume collapses", () => {
    const config = createMechanicalSupportConfigV1({
      lvad: { enabled: true, speedRpm: 5_200 },
    }).lvad;
    if (config.inletSuction.kind !== "legacy-smooth-availability") {
      throw new Error("default LVAD must use legacy inlet availability");
    }
    const recovered = evaluateRotaryPumpV1("LVAD", config, {
      inletPressureMmHg: 4,
      outletPressureMmHg: 70,
      inletVolumeMl: 80,
    });
    const pressureCollapse = evaluateRotaryPumpV1("LVAD", config, {
      inletPressureMmHg: config.inletSuction.collapsePressureMmHg,
      outletPressureMmHg: 70,
      inletVolumeMl: 80,
    });
    const volumeCollapse = evaluateRotaryPumpV1("LVAD", config, {
      inletPressureMmHg: 4,
      outletPressureMmHg: 70,
      inletVolumeMl: config.inletSuction.minimumVolumeMl ?? 0,
    });

    expect(recovered.flowLMin).toBeGreaterThan(0);
    expect(recovered.inletAvailability01).toBe(1);
    expect(pressureCollapse.unrestrictedFlowLMin).toBeGreaterThan(0);
    expect(pressureCollapse.flowLMin).toBe(0);
    expect(pressureCollapse.inletCollapseActive).toBe(true);
    expect(volumeCollapse.unrestrictedFlowLMin).toBeGreaterThan(0);
    expect(volumeCollapse.flowLMin).toBe(0);
    expect(volumeCollapse.inletCollapseActive).toBe(true);
  });

  it("does not assign an unvalidated legacy alert severity to HMII Choi resistance", () => {
    const config = mechanicalSupportPresetV1("lvad-hmii-9000");
    const hydraulics = evaluateMechanicalSupportHydraulicsV1(config, {
      timeSec: 1,
      cyclePhase01: 0.5,
      beatIndex: 1,
      heartRateBpm: 60,
      nodeAbsolutePressureMmHg: {
        LV: -1,
        Ao: 65,
        SA: 60,
        RA: 4,
        VC: 6,
      },
      nodeVolumeMl: { LV: 1 },
    });
    const alerts = mechanicalSupportAlertsV1(hydraulics);

    expect(hydraulics.pump.LVAD.inletCollapseActive).toBe(true);
    expect(hydraulics.pump.LVAD.inletAvailability01).toBe(1);
    expect(hydraulics.pump.LVAD.inletSuctionResistanceMmHgSecPerMl).toBe(7);
    expect(alerts.map((entry) => entry.code)).not.toContain("INLET_COLLAPSE");
  });

  it("rejects non-finite inlet-collapse thresholds", () => {
    const base = createMechanicalSupportConfigV1({
      lvad: { enabled: true },
    }).lvad;
    if (base.inletSuction.kind !== "legacy-smooth-availability") {
      throw new Error("default LVAD must use legacy inlet availability");
    }
    const config = {
      ...base,
      inletSuction: {
        ...base.inletSuction,
        collapsePressureMmHg: Number.NaN,
      },
    };

    expect(() => evaluateRotaryPumpV1("LVAD", config, {
      inletPressureMmHg: 5,
      outletPressureMmHg: 80,
      inletVolumeMl: 100,
    })).toThrow(/collapsePressureMmHg/);
  });

  it("routes every enabled device conservatively between its configured nodes", () => {
    const config = createMechanicalSupportConfigV1({
      lvad: { enabled: true, speedRpm: 5_200 },
      impella: { enabled: true, performanceLevel: 7 },
      vaEcmo: { enabled: true, speedRpm: 3_500, cannulation: "peripheral" },
      vvEcmo: { enabled: true, speedRpm: 3_500 },
    });
    const result = evaluateMechanicalSupportHydraulicsV1(config, {
      timeSec: 1,
      cyclePhase01: 0.5,
      beatIndex: 1,
      heartRateBpm: 60,
      nodeAbsolutePressureMmHg: {
        LV: 10,
        Ao: 80,
        SA: 75,
        RA: 4,
        VC: 6,
      },
      nodeVolumeMl: {
        LV: 100,
        Ao: 100,
        SA: 800,
        RA: 100,
        VC: 600,
      },
    });
    const lMinToMlSec = 1_000 / 60;
    const leftFlow = result.pump.LVAD.flowLMin + result.pump.IMPELLA.flowLMin;
    const vaFlow = result.pump.VA_ECMO.flowLMin;
    const vvFlow = result.pump.VV_ECMO.flowLMin;

    for (const evaluation of Object.values(result.pump)) {
      expect(evaluation.flowLMin).toBeGreaterThan(0);
    }
    expect(result.nodeNetVolumeRateMlPerSec.LV)
      .toBeCloseTo(-leftFlow * lMinToMlSec, 12);
    expect(result.nodeNetVolumeRateMlPerSec.Ao)
      .toBeCloseTo(leftFlow * lMinToMlSec, 12);
    expect(result.nodeNetVolumeRateMlPerSec.VC)
      .toBeCloseTo(-vaFlow * lMinToMlSec, 12);
    expect(result.nodeNetVolumeRateMlPerSec.SA)
      .toBeCloseTo(vaFlow * lMinToMlSec, 12);
    expect(result.nodeNetVolumeRateMlPerSec.RA).toBe(0);
    expect(vvFlow).toBeGreaterThan(0);
    expect(result.conservationResidualMlPerSec).toBeCloseTo(0, 12);
    expect(Object.values(result.nodeNetVolumeRateMlPerSec)
      .reduce((sum, value) => sum + value, 0)).toBeCloseTo(0, 12);
  });

  it("maps central VA and pressure-resolved bicaval VV to distinct conservative nodes", () => {
    const central = createMechanicalSupportConfigV1({
      vaEcmo: { enabled: true, cannulation: "central", speedRpm: 3_200 },
      vvEcmo: {
        enabled: true,
        hemodynamicCoupling: "bicaval-pressure-resolved",
        speedRpm: 3_200,
      },
    });
    const result = evaluateMechanicalSupportHydraulicsV1(central, {
      timeSec: 1,
      cyclePhase01: 0.5,
      beatIndex: 1,
      heartRateBpm: 60,
      nodeAbsolutePressureMmHg: { LV: 10, Ao: 80, SA: 75, RA: 4, VC: 6 },
      nodeVolumeMl: { LV: 100, Ao: 100, SA: 800, RA: 100, VC: 600 },
    });
    const vaFlowMlSec = result.pump.VA_ECMO.flowLMin * 1_000 / 60;
    const vvFlowMlSec = result.pump.VV_ECMO.flowLMin * 1_000 / 60;

    expect(result.pump.VA_ECMO.inletNode).toBe("RA");
    expect(result.pump.VA_ECMO.outletNode).toBe("Ao");
    expect(result.pump.VV_ECMO.inletNode).toBe("VC");
    expect(result.pump.VV_ECMO.outletNode).toBe("RA");
    expect(result.nodeNetVolumeRateMlPerSec.Ao).toBeCloseTo(vaFlowMlSec, 12);
    expect(result.nodeNetVolumeRateMlPerSec.VC).toBeCloseTo(-vvFlowMlSec, 12);
    expect(result.nodeNetVolumeRateMlPerSec.RA)
      .toBeCloseTo(vvFlowMlSec - vaFlowMlSec, 12);
    expect(result.conservationResidualMlPerSec).toBeCloseTo(0, 12);
  });

  it("labels severe AR with VA-ECMO as a contraindication stress test", () => {
    const alerts = mechanicalSupportContextAlertsV1(
      mechanicalSupportPresetV1("va-ecmo-peripheral-3200"),
      { severeAorticRegurgitation: true },
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.code).toBe("VA_ECMO_SEVERE_AORTIC_REGURGITATION");
    expect(alerts[0]!.severity).toBe("critical");
  });

  it("maps every FDA Impella CP P-level to its specified rotor speed", () => {
    const expected = [
      0, 23_000, 31_000, 33_000, 35_000,
      37_000, 39_000, 42_000, 44_000, 46_000,
    ];

    for (let level = 0; level <= 9; level += 1) {
      const performanceLevel = level as ImpellaPerformanceLevelV1;
      const config = createMechanicalSupportConfigV1({
        impella: { performanceLevel, speedRpm: 123 },
      });
      expect(IMPELLA_CP_SPEED_RPM_BY_LEVEL_V1[performanceLevel])
        .toBe(expected[level]);
      expect(config.impella.performanceLevel).toBe(performanceLevel);
      expect(config.impella.speedRpm).toBe(expected[level]);
    }
  });

  it("keeps P2-P9 pressure-dependent Impella flow inside the FDA mean-flow bands at 70 mmHg", () => {
    for (let level = 2; level <= 9; level += 1) {
      const performanceLevel = level as ImpellaPerformanceLevelV1;
      const config = createMechanicalSupportConfigV1({
        impella: { enabled: true, performanceLevel },
      }).impella;
      const evaluation = evaluateRotaryPumpV1("IMPELLA", config, {
        inletPressureMmHg: 10,
        outletPressureMmHg: 80,
        inletVolumeMl: 100,
      });
      const [minimum, maximum] =
        IMPELLA_CP_MEAN_FLOW_RANGE_L_MIN_BY_LEVEL_V1[performanceLevel];

      expect(evaluation.flowLMin).toBeGreaterThanOrEqual(minimum);
      expect(evaluation.flowLMin).toBeLessThanOrEqual(maximum);
    }
  });

  it("inflates in diastole, deflates before systole, and honors assist ratio", () => {
    const config = createMechanicalSupportConfigV1({
      iabp: {
        enabled: true,
        assistRatio: 2,
        balloonVolumeMl: 40,
      },
    }).iabp;
    const evaluate = (cyclePhase01: number, beatIndex: number) =>
      evaluateIabpV1(config, { cyclePhase01, beatIndex, heartRateBpm: 60 });

    const preInflation = evaluate(0.2, 0);
    const inflating = evaluate(0.245, 0);
    const fullDiastole = evaluate(0.7, 0);
    const deflating = evaluate(0.97, 0);
    const skippedBeat = evaluate(0.7, 1);
    const nextAssistedBeat = evaluate(0.7, 2);

    expect(preInflation.balloonVolumeMl).toBe(0);
    expect(inflating.balloonVolumeMl).toBeGreaterThan(0);
    expect(inflating.balloonVolumeMl).toBeLessThan(40);
    expect(fullDiastole.activation01).toBe(1);
    expect(fullDiastole.balloonVolumeMl).toBe(40);
    expect(deflating.balloonVolumeMl).toBeGreaterThan(0);
    expect(deflating.balloonVolumeMl).toBeLessThan(40);
    expect(skippedBeat.assistedBeat).toBe(false);
    expect(skippedBeat.balloonVolumeMl).toBe(0);
    expect(nextAssistedBeat.assistedBeat).toBe(true);
    expect(nextAssistedBeat.balloonVolumeMl).toBe(40);
  });

  it("advances IABP deflation at high heart rate to avoid a beat-boundary jump", () => {
    const config = createMechanicalSupportConfigV1({
      iabp: { enabled: true },
    }).iabp;
    const nearBoundary = evaluateIabpV1(config, {
      cyclePhase01: 0.999,
      beatIndex: 0,
      heartRateBpm: 120,
    });
    const nextBoundary = evaluateIabpV1(config, {
      cyclePhase01: 0,
      beatIndex: 1,
      heartRateBpm: 120,
    });

    expect(nearBoundary.balloonVolumeMl).toBeLessThan(0.01);
    expect(nextBoundary.balloonVolumeMl).toBe(0);
  });
});

describe("VV-ECMO beat-mean gas-exchange directions V1", () => {
  it("raises systemic oxygenation with circuit flow and FDO2", () => {
    const base = defaultGasConfig();
    const lowFlow = vvGas(base, 2);
    const highFlow = vvGas(base, 5);
    const lowFdo2 = vvGas({ ...base, fractionDeliveredOxygen01: 0.4 }, 4);
    const highFdo2 = vvGas({ ...base, fractionDeliveredOxygen01: 1 }, 4);

    expect(highFlow.effectiveEcmoFlowLMin)
      .toBeGreaterThan(lowFlow.effectiveEcmoFlowLMin);
    expect(highFlow.estimatedSystemicArterialSaturation01)
      .toBeGreaterThan(lowFlow.estimatedSystemicArterialSaturation01);
    expect(highFlow.membraneOxygenTransferMlPerMin)
      .toBeGreaterThan(lowFlow.membraneOxygenTransferMlPerMin);
    expect(highFdo2.postOxygenatorOxygenContentMlPerDl)
      .toBeGreaterThan(lowFdo2.postOxygenatorOxygenContentMlPerDl);
    expect(highFdo2.estimatedSystemicArterialSaturation01)
      .toBeGreaterThan(lowFdo2.estimatedSystemicArterialSaturation01);
  });

  it("reduces effective support with recirculation and increases CO2 removal with sweep", () => {
    const base = defaultGasConfig();
    const lowRecirculation = vvGas({ ...base, vvRecirculationFraction01: 0.05 }, 4);
    const highRecirculation = vvGas({ ...base, vvRecirculationFraction01: 0.5 }, 4);
    const lowSweep = vvGas({ ...base, sweepGasLMin: 1 }, 4);
    const highSweep = vvGas({ ...base, sweepGasLMin: 8 }, 4);
    const noSweep = vvGas({ ...base, sweepGasLMin: 0 }, 4);

    expect(highRecirculation.recirculationFlowLMin)
      .toBeGreaterThan(lowRecirculation.recirculationFlowLMin);
    expect(highRecirculation.effectiveEcmoFlowLMin)
      .toBeLessThan(lowRecirculation.effectiveEcmoFlowLMin);
    expect(highRecirculation.estimatedSystemicArterialSaturation01)
      .toBeLessThan(lowRecirculation.estimatedSystemicArterialSaturation01);
    expect(highRecirculation.membraneOxygenTransferMlPerMin)
      .toBeLessThan(lowRecirculation.membraneOxygenTransferMlPerMin);
    expect(highSweep.membraneCo2RemovalMlPerMin)
      .toBeGreaterThan(lowSweep.membraneCo2RemovalMlPerMin);
    expect(noSweep.membraneOxygenTransferMlPerMin).toBe(0);
    expect(lowSweep.membraneOxygenTransferMlPerMin).toBeGreaterThan(0);
    expect(Math.abs(
      highSweep.membraneOxygenTransferMlPerMin
        - lowSweep.membraneOxygenTransferMlPerMin,
    ) / highSweep.membraneOxygenTransferMlPerMin).toBeLessThan(0.01);
  });

  it("normalizes the saturating CO2 sweep response at sweep 1 L/min", () => {
    const base = defaultGasConfig();
    const atSweepOne = evaluateEcmoGasExchangeV1({
      mode: "VV",
      ecmoFlowLMin: 20,
      nativeCardiacOutputLMin: 5,
      config: { ...base, sweepGasLMin: 1 },
    });
    const atHighSweep = evaluateEcmoGasExchangeV1({
      mode: "VV",
      ecmoFlowLMin: 20,
      nativeCardiacOutputLMin: 5,
      config: { ...base, sweepGasLMin: 100 },
    });

    expect(atSweepOne.membraneCo2RemovalMlPerMin)
      .toBeCloseTo(base.membraneCo2RemovalMlPerMinAtSweep1, 8);
    expect(atHighSweep.membraneCo2RemovalMlPerMin)
      .toBeLessThan(2 * base.membraneCo2RemovalMlPerMinAtSweep1);
  });

  it("rejects non-clinical FDO2 and non-finite gas coefficients at the public API", () => {
    const base = defaultGasConfig();

    expect(() => vvGas({ ...base, fractionDeliveredOxygen01: 0.2 }, 4))
      .toThrow(/\[0\.21, 1\]/);
    expect(() => vvGas({ ...base, membraneOxygenTransferCoefficient: Number.NaN }, 4))
      .toThrow(/membraneOxygenTransferCoefficient/);
  });

  it("keeps every reported scalar finite over representative VV controls", () => {
    const evaluations = [
      vvGas(defaultGasConfig(), 0),
      vvGas({ ...defaultGasConfig(), fractionDeliveredOxygen01: 0.21 }, 2),
      vvGas({ ...defaultGasConfig(), sweepGasLMin: 10 }, 7),
      vvGas({ ...defaultGasConfig(), vvRecirculationFraction01: 0.8 }, 5),
    ];

    for (const evaluation of evaluations) {
      for (const [name, value] of Object.entries(evaluation)) {
        if (typeof value === "number") {
          expect(Number.isFinite(value), name).toBe(true);
        }
      }
      expect(evaluation.estimatedSystemicArterialSaturation01)
        .toBeGreaterThanOrEqual(0);
      expect(evaluation.estimatedSystemicArterialSaturation01)
        .toBeLessThanOrEqual(1);
    }
  });

  it("plateaus when VV circuit flow exceeds native cardiac output", () => {
    const atSix = vvGas(defaultGasConfig(), 6);
    const atSeven = vvGas(defaultGasConfig(), 7);

    expect(atSix.effectiveEcmoFlowLMin).toBe(5);
    expect(atSeven.effectiveEcmoFlowLMin).toBe(5);
    expect(atSeven.totalRecirculationFraction01).toBeGreaterThan(
      atSix.totalRecirculationFraction01,
    );
    expect(atSeven.estimatedSystemicArterialSaturation01)
      .toBeCloseTo(atSix.estimatedSystemicArterialSaturation01, 12);
  });

  it("keeps reported oxygen saturation and PO2 on one dissociation curve", () => {
    const result = vvGas({
      ...defaultGasConfig(),
      fractionDeliveredOxygen01: 0.21,
    }, 4);

    expect(result.postOxygenatorSaturation01).toBeCloseTo(
      oxygenSaturationAtPo2V1(result.postOxygenatorPo2MmHg),
      12,
    );
    expect(result.estimatedSystemicArterialSaturation01).toBeCloseTo(
      oxygenSaturationAtPo2V1(result.estimatedSystemicArterialPo2MmHg),
      12,
    );
  });

  it("closes the steady Fick balance and lowers oxygenation as VO2 rises", () => {
    const base = { ...defaultGasConfig(), nativeLungShuntFraction01: 0.8 };
    const lowDemand = vvGas({ ...base, oxygenConsumptionMlPerMin: 100 }, 4);
    const usualDemand = vvGas({ ...base, oxygenConsumptionMlPerMin: 250 }, 4);

    expect(lowDemand.oxygenConsumptionResidualMlPerMin).toBeCloseTo(0, 9);
    expect(usualDemand.oxygenConsumptionResidualMlPerMin).toBeCloseTo(0, 9);
    expect(usualDemand.resolvedMixedVenousSaturation01)
      .toBeLessThan(lowDemand.resolvedMixedVenousSaturation01);
    expect(usualDemand.estimatedSystemicArterialSaturation01)
      .toBeLessThan(lowDemand.estimatedSystemicArterialSaturation01);
  });

  it("keeps measured SvO2 fixed when prescribed-saturation mode is selected", () => {
    const base = {
      ...defaultGasConfig(),
      venousOxygenMode: "prescribed-saturation" as const,
      mixedVenousSaturation01: 0.6,
      nativeLungShuntFraction01: 0.8,
    };
    const lowDemand = vvGas({ ...base, oxygenConsumptionMlPerMin: 100 }, 4);
    const highDemand = vvGas({ ...base, oxygenConsumptionMlPerMin: 350 }, 4);

    expect(lowDemand.resolvedMixedVenousSaturation01).toBeCloseTo(0.6, 12);
    expect(highDemand.resolvedMixedVenousSaturation01).toBeCloseTo(0.6, 12);
    expect(highDemand.estimatedSystemicArterialSaturation01)
      .toBeCloseTo(lowDemand.estimatedSystemicArterialSaturation01, 12);
    expect(highDemand.oxygenConsumptionResidualMlPerMin)
      .toBeLessThan(lowDemand.oxygenConsumptionResidualMlPerMin);
  });

  it("reports low delivery and demand that exceeds the Fick-closure ceiling", () => {
    const gas = vvGas({
      ...defaultGasConfig(),
      nativeLungShuntFraction01: 0.8,
      oxygenConsumptionMlPerMin: 350,
    }, 4);
    const hydraulics = evaluateMechanicalSupportHydraulicsV1(
      createMechanicalSupportConfigV1(),
      {
        timeSec: 1,
        cyclePhase01: 0.5,
        beatIndex: 1,
        heartRateBpm: 60,
        nodeAbsolutePressureMmHg: { LV: 10, Ao: 80, SA: 75, RA: 4, VC: 6 },
      },
    );
    const alerts = mechanicalSupportAlertsV1(hydraulics, gas);

    expect(gas.resolvedMixedVenousSaturation01).toBe(0);
    expect(gas.oxygenDemandMetFraction01).toBeLessThan(1);
    expect(alerts.map((entry) => entry.code)).toContain(
      "LOW_OXYGEN_DELIVERY_RATIO",
    );
    expect(alerts.map((entry) => entry.code)).toContain(
      "OXYGEN_DEMAND_NOT_MET",
    );
  });

  it("uses differential mixing only for peripheral, not central, VA return", () => {
    const config = { ...defaultGasConfig(), nativeLungShuntFraction01: 0.8 };
    const common = {
      mode: "VA" as const,
      ecmoFlowLMin: 3,
      nativeCardiacOutputLMin: 3,
      config,
    };
    const peripheral = evaluateEcmoGasExchangeV1({
      ...common,
      vaCannulation: "peripheral",
    });
    const central = evaluateEcmoGasExchangeV1({
      ...common,
      vaCannulation: "central",
    });

    expect(peripheral.femoralArterialSaturation01
      - peripheral.rightRadialArterialSaturation01).toBeGreaterThan(0.05);
    expect(central.vaMixingRegime).toBe("central-return-well-mixed");
    expect(central.rightRadialArterialSaturation01)
      .toBeCloseTo(central.femoralArterialSaturation01, 12);
  });

  it("supports the zero-native-output VA-ECMO regime without inventing LV flow", () => {
    const result = evaluateEcmoGasExchangeV1({
      mode: "VA",
      vaCannulation: "central",
      ecmoFlowLMin: 4,
      nativeCardiacOutputLMin: 0,
      config: defaultGasConfig(),
    });

    expect(result.nativeCardiacOutputLMin).toBe(0);
    expect(result.ecmoToCardiacOutputRatio).toBeNull();
    expect(result.estimatedArterialOxygenContentMlPerDl)
      .toBeCloseTo(result.postOxygenatorOxygenContentMlPerDl, 12);
    expect(result.vaMixingRegime).toBe("central-return-well-mixed");
  });
});

function evaluateLvad(
  speedRpm: number,
  inletPressureMmHg: number,
  outletPressureMmHg: number,
) {
  const config = createMechanicalSupportConfigV1({
    lvad: { enabled: true, speedRpm },
  }).lvad;
  return evaluateRotaryPumpV1("LVAD", config, {
    inletPressureMmHg,
    outletPressureMmHg,
    inletVolumeMl: 100,
  });
}

function ecmoPumpOnlyConfig(speedRpm: number): RotaryPumpDeviceConfigV1 {
  return Object.freeze({
    ...createMechanicalSupportConfigV1().vaEcmo,
    enabled: true,
    speedRpm,
    curve: TAKAHASHI_SENKO_ECMO_CURVE_V1,
    drainage: ZERO_SEGMENT,
    oxygenator: ZERO_SEGMENT,
    returnPath: ZERO_SEGMENT,
    inletSuction: Object.freeze({
      kind: "legacy-smooth-availability" as const,
      collapsePressureMmHg: -50,
      recoveredPressureMmHg: -40,
      minimumVolumeMl: null,
      recoveredVolumeMl: null,
    }),
    maximumForwardFlowLMin: 20,
    maximumReverseFlowLMin: 20,
  });
}

function publishedSenkoHeadMmHg(speedRpm: number, flowLMin: number): number {
  const speedRatio = speedRpm / 3_500;
  const flowMlPerSec = flowLMin * 1_000 / 60;
  return 337 * speedRatio ** 2
    - 0.0864 * Math.abs(speedRatio) * flowMlPerSec
    - 0.003096 * flowMlPerSec ** 2;
}

function defaultGasConfig(): EcmoGasExchangeConfigV1 {
  return createMechanicalSupportConfigV1().gasExchange;
}

function vvGas(config: EcmoGasExchangeConfigV1, ecmoFlowLMin: number) {
  return evaluateEcmoGasExchangeV1({
    mode: "VV",
    ecmoFlowLMin,
    nativeCardiacOutputLMin: 5,
    config,
  });
}
