import { describe, expect, it } from "vitest";

import {
  HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
  HEARTMATE_II_LITERATURE_CURVE_V1,
  createMechanicalSupportConfigV1,
} from "@/engine/devices/defaultsV1";
import {
  DYNAMIC_ROTARY_PUMP_ACCEPTED_FLOW_STATE_V1_ID,
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  createDynamicRotaryPumpAcceptedFlowStateV1,
  evaluateDynamicRotaryPumpV1,
  type DynamicRotaryPumpAcceptedFlowStateV1,
  type DynamicRotaryPumpCircuitInertanceV1,
  type DynamicRotaryPumpInputV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import { evaluateRotaryPumpV1 } from "@/engine/devices/rotaryPumpV1";
import { mechanicalSupportPresetV1 } from "@/engine/devices/presetsV1";
import type {
  HydraulicSegmentV1,
  InletCollapseV1,
  RotaryPumpCurveV1,
  RotaryPumpDeviceConfigV1,
} from "@/engine/devices/typesV1";

const ZERO_INERTANCE = Object.freeze({
  unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  pumpInternalMmHgSec2PerMl: 0,
  drainageMmHgSec2PerMl: 0,
  oxygenatorMmHgSec2PerMl: 0,
  returnPathMmHgSec2PerMl: 0,
}) satisfies DynamicRotaryPumpCircuitInertanceV1;

const ZERO_SEGMENT = Object.freeze({
  linearResistanceMmHgSecPerMl: 0,
  quadraticResistanceMmHgSec2PerMl2: 0,
});

describe("dynamic rotary-pump backward-Euler component V1", () => {
  it("matches the closed-form backward-Euler linear solution", () => {
    const config = pumpConfig({
      curve: {
        shutoffHeadMmHg: 120,
        linearLossMmHgSecPerMl: 0.5,
        quadraticLossMmHgSec2PerMl2: 0,
      },
      drainage: { linearResistanceMmHgSecPerMl: 0.2 },
      oxygenator: { linearResistanceMmHgSecPerMl: 0.1 },
      returnPath: { linearResistanceMmHgSecPerMl: 0.2 },
    });
    const inertance = circuitInertance({
      pumpInternalMmHgSec2PerMl: 0.5,
      drainageMmHgSec2PerMl: 0.5,
      oxygenatorMmHgSec2PerMl: 0.5,
      returnPathMmHgSec2PerMl: 0.5,
    });
    const previous = createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 5);
    const result = evaluateDynamicRotaryPumpV1("LVAD", config, previous, {
      dtSec: 0.25,
      inertance,
      inletPressureMmHg: 10,
      outletPressureMmHg: 50,
      inletVolumeMl: 200,
    });
    const resistance = 1;
    const inertancePerStep = 2 / 0.25;
    const expected = (
      120 + 10 - 50 + inertancePerStep * 5
    ) / (resistance + inertancePerStep);

    expect(result.flowMlPerSec).toBeCloseTo(expected, 13);
    expect(result.dFlowMlPerSecDInletPressureMlPerSecPerMmHg)
      .toBeCloseTo(1 / 9, 13);
    expect(result.dFlowMlPerSecDOutletPressureMlPerSecPerMmHg)
      .toBeCloseTo(-1 / 9, 13);
    expect(result.dFlowMlPerSecDPreviousFlow).toBeCloseTo(8 / 9, 13);
    expect(result.flowAccelerationMlPerSec2)
      .toBeCloseTo((expected - 5) / 0.25, 13);
    expect(result.totalInertanceMmHgSec2PerMl).toBe(2);
    expect(result.constraintOwner).toBe("none");
    expect(result.hydraulicResidualMmHg).toBeCloseTo(0, 12);
  });

  it("transcribes the cited HeartMate-II pump and two-cannula R-L equation", () => {
    const config = mechanicalSupportPresetV1("lvad-hmii-9000").lvad;
    const previousFlowMlPerSec = 20;
    const dtSec = 0.01;
    const inletPressureMmHg = 5;
    const outletPressureMmHg = 65;
    const result = evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      createDynamicRotaryPumpAcceptedFlowStateV1(
        "LVAD",
        previousFlowMlPerSec,
      ),
      {
        dtSec,
        inertance: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
        inletPressureMmHg,
        outletPressureMmHg,
        inletVolumeMl: 100,
      },
    );
    const totalResistanceMmHgSecPerMl =
      HEARTMATE_II_LITERATURE_CURVE_V1.linearLossMmHgSecPerMl
      + 2 * 0.0677;
    const totalInertanceMmHgSec2PerMl = 0.02177 + 2 * 0.0127;
    const inertancePerStep = totalInertanceMmHgSec2PerMl / dtSec;
    const expectedFlowMlPerSec = (
      result.idealPumpHeadMmHg
      + inletPressureMmHg
      - outletPressureMmHg
      + inertancePerStep * previousFlowMlPerSec
    ) / (totalResistanceMmHgSecPerMl + inertancePerStep);

    expect(totalResistanceMmHgSecPerMl).toBeCloseTo(0.3061, 13);
    expect(totalInertanceMmHgSec2PerMl).toBeCloseTo(0.04717, 13);
    expect(totalInertanceMmHgSec2PerMl / totalResistanceMmHgSecPerMl)
      .toBeCloseTo(0.1540999673, 9);
    expect(result.flowMlPerSec).toBeCloseTo(expectedFlowMlPerSec, 13);
    expect(result.totalInertanceMmHgSec2PerMl)
      .toBeCloseTo(totalInertanceMmHgSec2PerMl, 13);
    expect(result.hydraulicResidualMmHg).toBeCloseTo(0, 11);
  });

  it("adds the HMII Choi suction law as a physical series resistance", () => {
    const config = mechanicalSupportPresetV1("lvad-hmii-9000").lvad;
    const previousFlowMlPerSec = 20;
    const dtSec = 0.01;
    const inletPressureMmHg = -1;
    const outletPressureMmHg = 65;
    const result = evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      createDynamicRotaryPumpAcceptedFlowStateV1(
        "LVAD",
        previousFlowMlPerSec,
      ),
      {
        dtSec,
        inertance: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
        inletPressureMmHg,
        outletPressureMmHg,
        // Whole-LV volume must not enter this HMII suction law.
        inletVolumeMl: 1,
      },
    );
    const baseResistance = 0.1707 + 2 * 0.0677;
    const suctionResistance = 3.5 * (1 - inletPressureMmHg);
    const totalInertance = 0.02177 + 2 * 0.0127;
    const inertancePerStep = totalInertance / dtSec;
    const denominator = baseResistance + suctionResistance
      + inertancePerStep;
    const expectedFlow = (
      result.idealPumpHeadMmHg
      + inletPressureMmHg - outletPressureMmHg
      + inertancePerStep * previousFlowMlPerSec
    ) / denominator;
    const expectedInletPressureTangent = (
      1 + 3.5 * expectedFlow
    ) / denominator;

    expect(config.maximumForwardFlowLMin).toBeNull();
    expect(result.flowMlPerSec).toBeCloseTo(expectedFlow, 13);
    expect(result.inletSuctionMechanismKind)
      .toBe("pressure-dependent-series-resistance");
    expect(result.inletSuctionResistanceMmHgSecPerMl).toBe(7);
    expect(result.inletSuctionPressureDropMmHg)
      .toBeCloseTo(7 * expectedFlow, 13);
    expect(result.inletAvailability01).toBe(1);
    expect(result.dFlowMlPerSecDInletVolumePerSec).toBe(0);
    expect(result.dFlowMlPerSecDInletPressureMlPerSecPerMmHg)
      .toBeCloseTo(expectedInletPressureTangent, 12);
    expect(result.constraintOwner).toBe("none");
    expect(result.constraintReactionMmHg).toBe(0);
    expect(result.flowLimitPressureReactionMmHg).toBe(0);
    expect(result.hydraulicResidualMmHg).toBeCloseTo(0, 11);

    const differentWholeLvVolume = evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      createDynamicRotaryPumpAcceptedFlowStateV1(
        "LVAD",
        previousFlowMlPerSec,
      ),
      {
        dtSec,
        inertance: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
        inletPressureMmHg,
        outletPressureMmHg,
        inletVolumeMl: 500,
      },
    );
    expect(differentWholeLvVolume.flowMlPerSec).toBe(result.flowMlPerSec);
  });

  it("assigns equality to the active Choi branch with zero resistance and its one-sided tangent", () => {
    const config = mechanicalSupportPresetV1("lvad-hmii-9000").lvad;
    const result = dynamicAt(config, {
      dtSec: 0.01,
      inertance: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
      inletPressureMmHg: 1,
      outletPressureMmHg: 65,
      inletVolumeMl: 1,
    }, 20);
    const baseResistance = 0.1707 + 2 * 0.0677;
    const inertancePerStep = (0.02177 + 2 * 0.0127) / 0.01;
    const denominator = baseResistance + inertancePerStep;

    expect(result.inletSuctionResistanceMmHgSecPerMl).toBe(0);
    expect(result.inletSuctionPressureDropMmHg).toBe(0);
    expect(result.dFlowMlPerSecDInletPressureMlPerSecPerMmHg)
      .toBeCloseTo((1 + 3.5 * result.flowMlPerSec) / denominator, 12);
    expect(result.constraintOwner).toBe("none");
    expect(result.constraintReactionMmHg).toBe(0);
  });

  it("reports the HMII evidence domain without clipping above advertised capacity", () => {
    const hmii = mechanicalSupportPresetV1("lvad-hmii-9000").lvad;
    const result = dynamicAt(hmii, {
      dtSec: 1,
      inertance: ZERO_INERTANCE,
      inletPressureMmHg: 10,
      outletPressureMmHg: 0,
      inletVolumeMl: 1,
    }, 0);
    const algebraic = evaluateRotaryPumpV1("LVAD", hmii, {
      inletPressureMmHg: 10,
      outletPressureMmHg: 0,
      inletVolumeMl: 1,
    });

    expect(result.flowLMin).toBeGreaterThan(10);
    expect(result.flowLMin).toBe(algebraic.flowLMin);
    expect(result.flowLMin).toBe(result.unrestrictedFlowLMin);
    expect(result.constraintOwner).toBe("none");
    expect(result.forwardFlowPublishedExperimentalTraversalUpperLMin).toBe(9);
    expect(result.forwardFlowAdvertisedCapacityLMin).toBe(10);
    expect(result.forwardFlowEvidenceStatus).toBe("above-advertised-capacity");
    expect(mechanicalSupportPresetV1("lvad-hm3-5200").lvad.inletSuction.kind)
      .toBe("legacy-smooth-availability");
    expect(createMechanicalSupportConfigV1().impella.inletSuction.kind)
      .toBe("legacy-smooth-availability");
    expect(createMechanicalSupportConfigV1().vaEcmo.inletSuction.kind)
      .toBe("legacy-smooth-availability");
  });

  it("does not label zero or reverse HMII flow as forward-domain evidence", () => {
    const hmii = mechanicalSupportPresetV1("lvad-hmii-9000").lvad;
    const zero = evaluateDynamicRotaryPumpV1(
      "LVAD",
      { ...hmii, circuitClamped: true },
      createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 0),
      {
        dtSec: 0.01,
        inertance: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
        inletPressureMmHg: 5,
        outletPressureMmHg: 85,
        inletVolumeMl: 100,
      },
    );
    const reverse = dynamicAt(hmii, {
      dtSec: 1,
      inertance: ZERO_INERTANCE,
      inletPressureMmHg: 0,
      outletPressureMmHg: 120,
      inletVolumeMl: 100,
    }, 0);

    expect(zero.flowMlPerSec).toBe(0);
    expect(zero.forwardFlowEvidenceStatus)
      .toBe("non-forward-flow-not-applicable");
    expect(reverse.flowMlPerSec).toBeLessThan(0);
    expect(reverse.forwardFlowEvidenceStatus)
      .toBe("non-forward-flow-not-applicable");
  });

  it("is exactly the legacy algebraic law when total inertance is zero", () => {
    const base = createMechanicalSupportConfigV1({
      lvad: { enabled: true, speedRpm: 5_200 },
    }).lvad;
    const scenarios: readonly Readonly<{
      label: string;
      config: RotaryPumpDeviceConfigV1;
      input: Readonly<{
        inletPressureMmHg: number;
        outletPressureMmHg: number;
        inletVolumeMl?: number;
      }>;
    }>[] = [
      {
        label: "forward interior",
        config: base,
        input: {
          inletPressureMmHg: 5,
          outletPressureMmHg: 70,
          inletVolumeMl: 100,
        },
      },
      {
        label: "reverse interior",
        config: { ...base, speedRpm: 0, maximumReverseFlowLMin: 20 },
        input: {
          inletPressureMmHg: 8,
          outletPressureMmHg: 80,
          inletVolumeMl: 100,
        },
      },
      {
        label: "pressure collapse",
        config: base,
        input: {
          inletPressureMmHg: -1,
          outletPressureMmHg: 45,
          inletVolumeMl: 100,
        },
      },
      {
        label: "forward cap",
        config: { ...base, maximumForwardFlowLMin: 0.5 },
        input: {
          inletPressureMmHg: 5,
          outletPressureMmHg: 60,
          inletVolumeMl: 100,
        },
      },
      {
        label: "reverse cap",
        config: {
          ...base,
          speedRpm: 0,
          maximumReverseFlowLMin: 0.4,
        },
        input: {
          inletPressureMmHg: 5,
          outletPressureMmHg: 90,
          inletVolumeMl: 100,
        },
      },
      {
        label: "clamp",
        config: { ...base, circuitClamped: true },
        input: {
          inletPressureMmHg: 5,
          outletPressureMmHg: 90,
          inletVolumeMl: 100,
        },
      },
      {
        label: "disabled",
        config: { ...base, enabled: false },
        input: {
          inletPressureMmHg: 5,
          outletPressureMmHg: 90,
          inletVolumeMl: 100,
        },
      },
    ];
    const previous = createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 17);
    const numericFields = [
      "idealPumpHeadMmHg",
      "flowLMin",
      "unrestrictedFlowLMin",
      "dFlowMlPerSecDInletPressureMlPerSecPerMmHg",
      "dFlowMlPerSecDOutletPressureMlPerSecPerMmHg",
      "dFlowMlPerSecDInletVolumePerSec",
      "inletAvailability01",
      "drainagePressureDropMmHg",
      "oxygenatorPressureDropMmHg",
      "returnPathPressureDropMmHg",
      "prePumpPressureMmHg",
      "postPumpPressureMmHg",
      "postOxygenatorPressureMmHg",
      "flowLimitPressureReactionMmHg",
      "hydraulicResidualMmHg",
    ] as const;

    for (const scenario of scenarios) {
      const legacy = evaluateRotaryPumpV1(
        "LVAD",
        scenario.config,
        scenario.input,
      );
      const dynamic = evaluateDynamicRotaryPumpV1(
        "LVAD",
        scenario.config,
        previous,
        {
          dtSec: 0.013,
          inertance: ZERO_INERTANCE,
          ...scenario.input,
        },
      );

      expect(dynamic.enabled, scenario.label).toBe(legacy.enabled);
      expect(dynamic.circuitClamped, scenario.label)
        .toBe(legacy.circuitClamped);
      expect(dynamic.inletCollapseActive, scenario.label)
        .toBe(legacy.inletCollapseActive);
      for (const field of numericFields) {
        expect(dynamic[field], `${scenario.label}: ${field}`)
          .toBe(legacy[field]);
      }
    }
  });

  it("converges to the steady algebraic operating point under accepted steps", () => {
    const config = pumpConfig({
      curve: {
        shutoffHeadMmHg: 100,
        linearLossMmHgSecPerMl: 1,
        quadraticLossMmHgSec2PerMl2: 0,
      },
    });
    const inertance = circuitInertance({
      pumpInternalMmHgSec2PerMl: 0.4,
    });
    const input = Object.freeze({
      dtSec: 0.01,
      inertance,
      inletPressureMmHg: 10,
      outletPressureMmHg: 50,
      inletVolumeMl: 200,
    });
    const steady = evaluateRotaryPumpV1("LVAD", config, input);
    let accepted = createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 0);
    let candidate = evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      accepted,
      input,
    );
    for (let step = 0; step < 1_500; step += 1) {
      accepted = candidate.candidateAcceptedState;
      candidate = evaluateDynamicRotaryPumpV1(
        "LVAD",
        config,
        accepted,
        input,
      );
    }

    expect(candidate.flowMlPerSec)
      .toBeCloseTo(steady.flowLMin * 1_000 / 60, 10);
    expect(candidate.flowAccelerationMlPerSec2).toBeCloseTo(0, 9);
    expect(candidate.hydraulicResidualMmHg).toBeCloseTo(0, 11);
  });

  it("solves the signed quadratic reverse branch without applying suction", () => {
    const config = pumpConfig({
      curve: {
        shutoffHeadMmHg: 0,
        linearLossMmHgSecPerMl: 1,
        quadraticLossMmHgSec2PerMl2: 0.01,
      },
      inletSuction: {
        collapsePressureMmHg: 0,
        recoveredPressureMmHg: 10,
        minimumVolumeMl: 0,
        recoveredVolumeMl: 100,
      },
    });
    const inertance = circuitInertance({
      pumpInternalMmHgSec2PerMl: 0.5,
    });
    const previous = createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", -10);
    const collapsed = evaluateDynamicRotaryPumpV1("LVAD", config, previous, {
      dtSec: 0.1,
      inertance,
      inletPressureMmHg: 10,
      outletPressureMmHg: 70,
      inletVolumeMl: 0,
    });
    const recovered = evaluateDynamicRotaryPumpV1("LVAD", config, previous, {
      dtSec: 0.1,
      inertance,
      inletPressureMmHg: 10,
      outletPressureMmHg: 70,
      inletVolumeMl: 100,
    });
    const driveMagnitude = 110;
    const expected = -2 * driveMagnitude / (
      6 + Math.sqrt(6 ** 2 + 4 * 0.01 * driveMagnitude)
    );

    expect(collapsed.inletAvailability01).toBe(0);
    expect(collapsed.flowMlPerSec).toBeCloseTo(expected, 12);
    expect(collapsed.flowMlPerSec).toBeCloseTo(recovered.flowMlPerSec, 13);
    expect(collapsed.constraintOwner).toBe("none");
    expect(collapsed.dFlowMlPerSecDInletVolumePerSec).toBe(0);
    expect(collapsed.dFlowMlPerSecDPreviousFlow).toBeGreaterThan(0);
    expect(collapsed.hydraulicResidualMmHg).toBeCloseTo(0, 11);
  });

  it("assigns suction, capacity, clamp, and disabled branches deterministically", () => {
    const inertance = circuitInertance({
      pumpInternalMmHgSec2PerMl: 0.2,
    });
    const previous = createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 10);
    const collapse = {
      collapsePressureMmHg: 0,
      recoveredPressureMmHg: 10,
      minimumVolumeMl: 0,
      recoveredVolumeMl: 100,
    } as const;
    const base = pumpConfig({
      curve: {
        shutoffHeadMmHg: 120,
        linearLossMmHgSecPerMl: 1,
        quadraticLossMmHgSec2PerMl2: 0,
      },
      inletSuction: collapse,
    });
    const common = { dtSec: 0.1, inertance } as const;
    const pressure = evaluateDynamicRotaryPumpV1("LVAD", base, previous, {
      ...common,
      inletPressureMmHg: 5,
      outletPressureMmHg: 50,
      inletVolumeMl: 100,
    });
    const volume = evaluateDynamicRotaryPumpV1("LVAD", base, previous, {
      ...common,
      inletPressureMmHg: 15,
      outletPressureMmHg: 50,
      inletVolumeMl: 50,
    });
    const tie = evaluateDynamicRotaryPumpV1("LVAD", base, previous, {
      ...common,
      inletPressureMmHg: 5,
      outletPressureMmHg: 50,
      inletVolumeMl: 50,
    });
    const forwardCap = evaluateDynamicRotaryPumpV1(
      "LVAD",
      { ...base, maximumForwardFlowLMin: 0.5 },
      previous,
      {
        ...common,
        inletPressureMmHg: 15,
        outletPressureMmHg: 50,
        inletVolumeMl: 100,
      },
    );
    const reverseCap = evaluateDynamicRotaryPumpV1(
      "LVAD",
      {
        ...base,
        speedRpm: 0,
        maximumReverseFlowLMin: 0.5,
      },
      previous,
      {
        ...common,
        inletPressureMmHg: 5,
        outletPressureMmHg: 150,
        inletVolumeMl: 100,
      },
    );
    const clamped = evaluateDynamicRotaryPumpV1(
      "LVAD",
      { ...base, circuitClamped: true },
      previous,
      {
        ...common,
        inletPressureMmHg: 5,
        outletPressureMmHg: 80,
        inletVolumeMl: 100,
      },
    );
    const disabled = evaluateDynamicRotaryPumpV1(
      "LVAD",
      { ...base, enabled: false },
      previous,
      {
        ...common,
        inletPressureMmHg: 5,
        outletPressureMmHg: 80,
        inletVolumeMl: 100,
      },
    );

    expect(pressure.constraintOwner).toBe("pressure-collapse");
    expect(volume.constraintOwner).toBe("volume-collapse");
    expect(tie.constraintOwner).toBe("pressure-collapse");
    expect(forwardCap.constraintOwner).toBe("forward-cap");
    expect(reverseCap.constraintOwner).toBe("reverse-cap");
    expect(clamped.constraintOwner).toBe("clamp");
    expect(disabled.constraintOwner).toBe("disabled");
    for (const constrained of [
      pressure,
      volume,
      forwardCap,
      reverseCap,
      clamped,
    ]) {
      expect(constrained.constraintReactionMmHg).not.toBe(0);
      expect(constrained.hydraulicResidualMmHg).toBeCloseTo(0, 13);
      expect(constrained.flowLimitPressureReactionMmHg)
        .toBe(constrained.constraintReactionMmHg);
    }
    for (const hardLimit of [forwardCap, reverseCap, clamped, disabled]) {
      expect(hardLimit.dFlowMlPerSecDInletPressureMlPerSecPerMmHg).toBe(0);
      expect(hardLimit.dFlowMlPerSecDOutletPressureMlPerSecPerMmHg).toBe(0);
      expect(hardLimit.dFlowMlPerSecDInletVolumePerSec).toBe(0);
      expect(hardLimit.dFlowMlPerSecDPreviousFlow).toBe(0);
    }
    expect(clamped.flowMlPerSec).toBe(0);
    expect(clamped.constraintReactionMmHg).toBeCloseTo(65, 12);
    expect(disabled.flowMlPerSec).toBe(0);
    expect(disabled.constraintReactionMmHg).toBe(0);
    expect(disabled.flowAccelerationMlPerSec2).toBe(0);
  });

  it("matches analytic pressure, volume, and accepted-flow tangents to finite differences", () => {
    const config = pumpConfig({
      curve: {
        shutoffHeadMmHg: 120,
        linearLossMmHgSecPerMl: 1,
        quadraticLossMmHgSec2PerMl2: 0.004,
      },
      inletSuction: {
        collapsePressureMmHg: 0,
        recoveredPressureMmHg: 10,
        minimumVolumeMl: 0,
        recoveredVolumeMl: 100,
      },
    });
    const inertance = circuitInertance({
      pumpInternalMmHgSec2PerMl: 0.3,
    });
    const input: DynamicRotaryPumpInputV1 = Object.freeze({
      dtSec: 0.05,
      inertance,
      inletPressureMmHg: 12,
      outletPressureMmHg: 60,
      inletVolumeMl: 40,
    });
    const previousFlow = 20;
    const result = dynamicAt(config, input, previousFlow);
    const h = 1e-5;
    const inletPressureFd = centralDifference(
      (value) => dynamicAt(
        config,
        { ...input, inletPressureMmHg: value },
        previousFlow,
      ).flowMlPerSec,
      input.inletPressureMmHg,
      h,
    );
    const outletPressureFd = centralDifference(
      (value) => dynamicAt(
        config,
        { ...input, outletPressureMmHg: value },
        previousFlow,
      ).flowMlPerSec,
      input.outletPressureMmHg,
      h,
    );
    const inletVolumeFd = centralDifference(
      (value) => dynamicAt(
        config,
        { ...input, inletVolumeMl: value },
        previousFlow,
      ).flowMlPerSec,
      input.inletVolumeMl ?? 0,
      h,
    );
    const previousFlowFd = centralDifference(
      (value) => dynamicAt(config, input, value).flowMlPerSec,
      previousFlow,
      h,
    );

    expect(result.constraintOwner).toBe("volume-collapse");
    expect(result.dFlowMlPerSecDInletPressureMlPerSecPerMmHg)
      .toBeCloseTo(inletPressureFd, 8);
    expect(result.dFlowMlPerSecDOutletPressureMlPerSecPerMmHg)
      .toBeCloseTo(outletPressureFd, 8);
    expect(result.dFlowMlPerSecDInletVolumePerSec)
      .toBeCloseTo(inletVolumeFd, 8);
    expect(result.dFlowMlPerSecDPreviousFlow)
      .toBeCloseTo(previousFlowFd, 8);

    const pressureOwnedInput = Object.freeze({
      ...input,
      inletPressureMmHg: 5,
      inletVolumeMl: 100,
    });
    const pressureOwned = dynamicAt(
      config,
      pressureOwnedInput,
      previousFlow,
    );
    const pressureOwnedFd = centralDifference(
      (value) => dynamicAt(
        config,
        { ...pressureOwnedInput, inletPressureMmHg: value },
        previousFlow,
      ).flowMlPerSec,
      pressureOwnedInput.inletPressureMmHg,
      h,
    );
    expect(pressureOwned.constraintOwner).toBe("pressure-collapse");
    expect(pressureOwned.dFlowMlPerSecDInletPressureMlPerSecPerMmHg)
      .toBeCloseTo(pressureOwnedFd, 8);
  });

  it("is retry-pure and never mutates the last accepted state", () => {
    const config = pumpConfig();
    const inertance = circuitInertance({
      pumpInternalMmHgSec2PerMl: 0.2,
      drainageMmHgSec2PerMl: 0.1,
    });
    const accepted = createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 7);
    const input = Object.freeze({
      dtSec: 0.02,
      inertance,
      inletPressureMmHg: 8,
      outletPressureMmHg: 70,
      inletVolumeMl: 120,
    });
    const first = evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      accepted,
      input,
    );
    evaluateDynamicRotaryPumpV1("LVAD", config, accepted, {
      ...input,
      dtSec: 0.005,
      outletPressureMmHg: 110,
    });
    const retry = evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      accepted,
      input,
    );

    expect(retry).toStrictEqual(first);
    expect(accepted.acceptedFlowMlPerSec).toBe(7);
    expect(Object.isFrozen(accepted)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.candidateAcceptedState)).toBe(true);
    expect(first.candidateAcceptedState).not.toBe(accepted);
  });

  it("fails closed on incompatible units and invalid dynamic state", () => {
    const config = pumpConfig();
    const inertance = circuitInertance({
      pumpInternalMmHgSec2PerMl: 0.2,
    });
    const accepted = createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 7);
    const input = {
      dtSec: 0.02,
      inertance,
      inletPressureMmHg: 8,
      outletPressureMmHg: 70,
      inletVolumeMl: 120,
    } as const;
    const wrongUnits = {
      ...inertance,
      unitSystemId: "litre-minute",
    } as unknown as DynamicRotaryPumpCircuitInertanceV1;
    const wrongDevice = {
      ...accepted,
      deviceId: "IMPELLA",
    } as DynamicRotaryPumpAcceptedFlowStateV1;
    const nonfiniteState = {
      stateId: DYNAMIC_ROTARY_PUMP_ACCEPTED_FLOW_STATE_V1_ID,
      unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
      deviceId: "LVAD",
      acceptedFlowMlPerSec: Number.NaN,
    } as const;

    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      accepted,
      { ...input, dtSec: 0 },
    )).toThrow(/dtSec.*positive/);
    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      accepted,
      { ...input, inertance: wrongUnits },
    )).toThrow(/unitSystemId/);
    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      accepted,
      {
        ...input,
        inertance: {
          ...inertance,
          drainageMmHgSec2PerMl: -0.1,
        },
      },
    )).toThrow(/drainage.*nonnegative/);
    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      wrongDevice,
      input,
    )).toThrow(/belongs to IMPELLA/);
    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      nonfiniteState,
      input,
    )).toThrow(/accepted flow.*finite/);
    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD",
      config,
      accepted,
      { ...input, inletVolumeMl: -1 },
    )).toThrow(/inlet volume.*nonnegative/);
    expect(() => createDynamicRotaryPumpAcceptedFlowStateV1(
      "LVAD",
      Number.POSITIVE_INFINITY,
    )).toThrow(/accepted flow.*finite/);
  });

  it("fails closed on malformed inlet mechanisms and accepts explicit none", () => {
    const base = pumpConfig();
    const accepted = createDynamicRotaryPumpAcceptedFlowStateV1("LVAD", 0);
    const input = {
      dtSec: 0.01,
      inertance: ZERO_INERTANCE,
      inletPressureMmHg: -20,
      outletPressureMmHg: 50,
      inletVolumeMl: 0,
    } as const;
    const invalidKind = {
      ...base,
      inletSuction: { kind: "implicit-auto" },
    } as unknown as RotaryPumpDeviceConfigV1;
    const invalidSlope = {
      ...base,
      inletSuction: {
        kind: "pressure-dependent-series-resistance",
        thresholdPressureMmHg: 1,
        resistanceSlopeMmHgSecPerMlPerMmHg: 0,
      },
    } as RotaryPumpDeviceConfigV1;
    const extraKey = {
      ...base,
      inletSuction: { kind: "none", hiddenFallback: true },
    } as unknown as RotaryPumpDeviceConfigV1;

    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD", invalidKind, accepted, input,
    )).toThrow(/kind.*unsupported/);
    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD", invalidSlope, accepted, input,
    )).toThrow(/resistanceSlope.*positive/);
    expect(() => evaluateDynamicRotaryPumpV1(
      "LVAD", extraKey, accepted, input,
    )).toThrow(/keys must be exactly/);

    const none = evaluateDynamicRotaryPumpV1(
      "LVAD",
      { ...base, inletSuction: Object.freeze({ kind: "none" }) },
      accepted,
      input,
    );
    expect(none.inletSuctionMechanismKind).toBe("none");
    expect(none.inletSuctionResistanceMmHgSecPerMl).toBe(0);
    expect(none.inletAvailability01).toBe(1);
    expect(none.constraintOwner).toBe("none");
  });
});

type PumpOverrides = Omit<
  Partial<RotaryPumpDeviceConfigV1>,
  "curve" | "drainage" | "oxygenator" | "returnPath" | "inletSuction"
> & Readonly<{
  curve?: Partial<RotaryPumpCurveV1>;
  drainage?: Partial<HydraulicSegmentV1>;
  oxygenator?: Partial<HydraulicSegmentV1>;
  returnPath?: Partial<HydraulicSegmentV1>;
  inletSuction?: Partial<InletCollapseV1>;
}>;

function pumpConfig(overrides: PumpOverrides = {}): RotaryPumpDeviceConfigV1 {
  const base = createMechanicalSupportConfigV1({
    lvad: { enabled: true },
  }).lvad;
  return deepFreeze({
    ...base,
    enabled: true,
    circuitClamped: false,
    speedRpm: 1,
    curve: {
      referenceSpeedRpm: 1,
      shutoffHeadMmHg: 120,
      linearLossMmHgSecPerMl: 1,
      linearLossSpeedExponent: 0,
      quadraticLossMmHgSec2PerMl2: 0.002,
      ...overrides.curve,
    },
    drainage: { ...ZERO_SEGMENT, ...overrides.drainage },
    oxygenator: { ...ZERO_SEGMENT, ...overrides.oxygenator },
    returnPath: { ...ZERO_SEGMENT, ...overrides.returnPath },
    inletSuction: {
      kind: "legacy-smooth-availability",
      collapsePressureMmHg: -100,
      recoveredPressureMmHg: -90,
      minimumVolumeMl: null,
      recoveredVolumeMl: null,
      ...overrides.inletSuction,
    },
    maximumForwardFlowLMin: 30,
    maximumReverseFlowLMin: 30,
    ...withoutNestedPumpOverrides(overrides),
  });
}

function withoutNestedPumpOverrides(
  overrides: PumpOverrides,
): Omit<
  PumpOverrides,
  "curve" | "drainage" | "oxygenator" | "returnPath" | "inletSuction"
> {
  const {
    curve: _curve,
    drainage: _drainage,
    oxygenator: _oxygenator,
    returnPath: _returnPath,
    inletSuction: _inletSuction,
    ...flat
  } = overrides;
  return flat;
}

function circuitInertance(
  overrides: Partial<Omit<
    DynamicRotaryPumpCircuitInertanceV1,
    "unitSystemId"
  >> = {},
): DynamicRotaryPumpCircuitInertanceV1 {
  return Object.freeze({
    ...ZERO_INERTANCE,
    ...overrides,
  });
}

function dynamicAt(
  config: RotaryPumpDeviceConfigV1,
  input: DynamicRotaryPumpInputV1,
  previousFlowMlPerSec: number,
) {
  return evaluateDynamicRotaryPumpV1(
    "LVAD",
    config,
    createDynamicRotaryPumpAcceptedFlowStateV1(
      "LVAD",
      previousFlowMlPerSec,
    ),
    input,
  );
}

function centralDifference(
  evaluate: (value: number) => number,
  value: number,
  h: number,
): number {
  return (evaluate(value + h) - evaluate(value - h)) / (2 * h);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
