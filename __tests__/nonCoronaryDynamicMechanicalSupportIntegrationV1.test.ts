import { describe, expect, it, vi } from "vitest";

import {
  NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
  NON_CORONARY_NODE_NAMES_V1,
  buildNonCoronaryCirculationGraphV1,
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  type NonCoronaryAbsoluteChamberPressureTangentV1,
  type NonCoronaryCandidateMechanicsCallbackV1,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  effectiveUnstressedVolumeFromNodeV1,
  vascularPvLawFromNodeV1,
} from "@/engine/core/circulationGraphKernelV1";
import { createMechanicalSupportConfigV1 } from
  "@/engine/devices/defaultsV1";
import {
  createDynamicMechanicalSupportAcceptedStateV1,
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportAcceptedStateV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import type {
  MechanicalSupportConfigV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import { initialMainWireQuasiSteadyOrificeValveStateV2 } from
  "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV2";
import { MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1 } from
  "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";
import { stressedVolumeFromPtm } from "@/engine/vascularPv";

const DT_SEC = 0.001;
const PROFILE_BINDING_SHA = "a".repeat(64);

const RUNTIME: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
  vascular: Object.freeze({ venousTone: 0, arterialStiffness: 1 }),
  losses: Object.freeze({ systemicResistance: 1, pulmonaryResistance: 1 }),
  respiratory: Object.freeze({
    PEEP: 0,
    Pth0: 0,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0,
  }),
  valvePreset: MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
});

describe("non-coronary dynamic mechanical-support trial seam V1", () => {
  it("keeps the all-off extension bit-exact with the no-device path", () => {
    const fixture = steadyStateFixture();
    const config = createMechanicalSupportConfigV1();
    const profile = profileWith(inertance({
      pumpInternalMmHgSec2PerMl: 0.1,
    }));
    const acceptedDeviceState = acceptedDeviceStateWith(config, profile, {
      LVAD: 11,
      IMPELLA: -2,
      VA_ECMO: 17,
      VV_ECMO: 23,
    });
    const mechanics = fixedMechanics(fixture.chamberPressures);
    const withoutDevices = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: DT_SEC,
      runtime: RUNTIME,
      evaluateCandidateMechanics: mechanics,
    });
    const dynamicAllOff = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: DT_SEC,
      runtime: RUNTIME,
      dynamicMechanicalSupport: {
        config,
        heartRateBpm: 60,
        profile,
        previousAcceptedState: acceptedDeviceState,
      },
      evaluateCandidateMechanics: mechanics,
    });

    expect(withoutDevices.converged).toBe(true);
    expect(dynamicAllOff.converged).toBe(true);
    if (!withoutDevices.converged || !dynamicAllOff.converged) return;
    const { dynamicMechanicalSupport, ...dynamicCommon } = dynamicAllOff;
    expect(dynamicCommon).toEqual(withoutDevices);
    expect(dynamicMechanicalSupport).toBeDefined();
    expect(dynamicMechanicalSupport!.candidateAcceptedState.acceptedFlowMlPerSec)
      .toEqual({ LVAD: 0, IMPELLA: 0, VA_ECMO: 0, VV_ECMO: 0 });
    expect("mechanicalSupport" in dynamicAllOff).toBe(false);
  });

  it("uses the same accepted q_n across an L>0 trial and remains retry-pure", () => {
    const fixture = steadyStateFixture();
    const config = activeLvadConfig();
    const profile = profileWith(inertance({
      pumpInternalMmHgSec2PerMl: 0.04,
      drainageMmHgSec2PerMl: 0.02,
      returnPathMmHgSec2PerMl: 0.04,
    }));
    const priorHigh = acceptedDeviceStateWith(config, profile, {
      LVAD: 50,
      IMPELLA: 0,
      VA_ECMO: 0,
      VV_ECMO: 0,
    });
    const priorZero = acceptedDeviceStateWith(config, profile, {
      LVAD: 0,
      IMPELLA: 0,
      VA_ECMO: 0,
      VV_ECMO: 0,
    });
    const priorSnapshot = JSON.parse(JSON.stringify(priorHigh));
    const mechanics = coupledElasticMechanicsCallback(fixture.state, true);
    const evaluate = (deviceState: DynamicMechanicalSupportAcceptedStateV1) =>
      evaluateNonCoronaryCirculationBackwardEulerTrialV1({
        previousAcceptedState: fixture.state,
        dtSec: DT_SEC,
        runtime: RUNTIME,
        dynamicMechanicalSupport: {
          config,
          heartRateBpm: 60,
          profile,
          previousAcceptedState: deviceState,
        },
        options: { analyticJacobianFiniteDifferenceShadow: true },
        evaluateCandidateMechanics: mechanics,
      });

    const high = evaluate(priorHigh);
    const zero = evaluate(priorZero);
    const retry = evaluate(priorHigh);

    expect(high.converged).toBe(true);
    expect(zero.converged).toBe(true);
    expect(retry).toEqual(high);
    expect(priorHigh).toEqual(priorSnapshot);
    if (!high.converged || !zero.converged) return;
    const highSupport = high.dynamicMechanicalSupport!;
    const zeroSupport = zero.dynamicMechanicalSupport!;
    expect(highSupport.pump.LVAD.previousAcceptedFlowMlPerSec).toBe(50);
    expect(zeroSupport.pump.LVAD.previousAcceptedFlowMlPerSec).toBe(0);
    expect(highSupport.pump.LVAD.flowMlPerSec)
      .not.toBeCloseTo(zeroSupport.pump.LVAD.flowMlPerSec, 6);
    expect(high.candidateNodeVolumesMl.LV)
      .not.toBeCloseTo(zero.candidateNodeVolumesMl.LV, 9);
    expect(Math.abs(highSupport.conservationResidualMlPerSec))
      .toBeLessThan(1e-12);
    expect(Math.abs(high.diagnostics.totalBloodVolumeErrorMl))
      .toBeLessThan(1e-9);
    expect(high.diagnostics.jacobianMode).toBe("analytic-semismooth");
    expect(high.diagnostics.finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(high.diagnostics.finiteDifferenceJacobianShadowCount)
      .toBeGreaterThan(0);
    expect(high.diagnostics.jacobianMaximumRelativeFrobeniusShadowDifference!)
      .toBeLessThan(2e-5);
    expect(highSupport.candidateAcceptedState).not.toBe(priorHigh);
    expect(highSupport.candidateAcceptedState.acceptedFlowMlPerSec.LVAD)
      .toBe(highSupport.pump.LVAD.flowMlPerSec);
  });

  it("matches the analytic shadow with dynamic IABP displacement on nonlinear SA PV", () => {
    const fixture = steadyStateFixture(0.5);
    const config = createMechanicalSupportConfigV1({
      iabp: { enabled: true },
    });
    const profile = profileWith(inertance());
    const acceptedDeviceState = createDynamicMechanicalSupportAcceptedStateV1(
      profile,
      config,
    );
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: DT_SEC,
      runtime: RUNTIME,
      dynamicMechanicalSupport: {
        config,
        heartRateBpm: 60,
        profile,
        previousAcceptedState: acceptedDeviceState,
      },
      options: { analyticJacobianFiniteDifferenceShadow: true },
      evaluateCandidateMechanics:
        coupledElasticMechanicsCallback(fixture.state, true),
    });

    expect(trial.converged).toBe(true);
    if (!trial.converged) return;
    expect(trial.dynamicMechanicalSupport!.iabp.balloonVolumeMl).toBe(40);
    expect(trial.diagnostics.jacobianMode).toBe("analytic-semismooth");
    expect(trial.diagnostics.finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(trial.diagnostics.finiteDifferenceJacobianShadowCount)
      .toBeGreaterThan(0);
    expect(trial.diagnostics.jacobianMaximumRelativeFrobeniusShadowDifference!)
      .toBeLessThan(2e-5);
  });

  it("preserves active L=0 algebraic parity with the legacy device seam", () => {
    const fixture = steadyStateFixture();
    const config = createMechanicalSupportConfigV1({
      lvad: { enabled: true, speedRpm: 4_500 },
      vaEcmo: { enabled: true, speedRpm: 3_200, cannulation: "central" },
    });
    const profile = profileWith(inertance());
    const acceptedDeviceState = acceptedDeviceStateWith(config, profile, {
      LVAD: 100,
      IMPELLA: -20,
      VA_ECMO: 50,
      VV_ECMO: 7,
    });
    const mechanics = coupledElasticMechanicsCallback(fixture.state, true);
    const legacy = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: DT_SEC,
      runtime: RUNTIME,
      mechanicalSupport: { config, heartRateBpm: 60 },
      evaluateCandidateMechanics: mechanics,
    });
    const dynamic = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: DT_SEC,
      runtime: RUNTIME,
      dynamicMechanicalSupport: {
        config,
        heartRateBpm: 60,
        profile,
        previousAcceptedState: acceptedDeviceState,
      },
      evaluateCandidateMechanics: mechanics,
    });

    expect(legacy.converged).toBe(true);
    expect(dynamic.converged).toBe(true);
    if (!legacy.converged || !dynamic.converged) return;
    expect(dynamic.candidateNodeVolumesMl).toEqual(legacy.candidateNodeVolumesMl);
    expect(dynamic.nodeAbsolutePressuresMmHg)
      .toEqual(legacy.nodeAbsolutePressuresMmHg);
    expect(dynamic.edgeFlowsMlPerSec).toEqual(legacy.edgeFlowsMlPerSec);
    expect(dynamic.dynamicMechanicalSupport!.nodeNetVolumeRateMlPerSec)
      .toEqual(legacy.mechanicalSupport!.nodeNetVolumeRateMlPerSec);
    for (const deviceId of ["LVAD", "IMPELLA", "VA_ECMO", "VV_ECMO"] as const) {
      expect(dynamic.dynamicMechanicalSupport!.pump[deviceId].flowLMin)
        .toBe(legacy.mechanicalSupport!.pump[deviceId].flowLMin);
    }
  });

  it("rejects simultaneous legacy and dynamic seams before evaluating mechanics", () => {
    const fixture = steadyStateFixture();
    const config = createMechanicalSupportConfigV1();
    const profile = profileWith(inertance());
    const acceptedDeviceState = createDynamicMechanicalSupportAcceptedStateV1(
      profile,
      config,
    );
    const mechanics = vi.fn(fixedMechanics(fixture.chamberPressures));
    const stateSnapshot = JSON.parse(JSON.stringify(fixture.state));
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: DT_SEC,
      runtime: RUNTIME,
      mechanicalSupport: { config, heartRateBpm: 60 },
      dynamicMechanicalSupport: {
        config,
        heartRateBpm: 60,
        profile,
        previousAcceptedState: acceptedDeviceState,
      },
      evaluateCandidateMechanics: mechanics,
    });

    expect(trial.converged).toBe(false);
    if (trial.converged === true) return;
    expect(trial.reason).toBe("invalid-input");
    expect(trial.message).toMatch(/mutually exclusive/);
    expect(trial.rollbackState).toEqual(fixture.state);
    expect(fixture.state).toEqual(stateSnapshot);
    expect(mechanics).not.toHaveBeenCalled();
  });

  it("returns invalid-input rollback for a cross-device profile binding", () => {
    const fixture = steadyStateFixture();
    const config = activeLvadConfig();
    const profile = profileWith(inertance({
      pumpInternalMmHgSec2PerMl: 0.1,
    }));
    const acceptedDeviceState = createDynamicMechanicalSupportAcceptedStateV1(
      profile,
      config,
    );
    const malformedProfile = {
      ...profile,
      deviceProfileBindingByDevice: {
        ...profile.deviceProfileBindingByDevice,
        IMPELLA: profile.deviceProfileBindingByDevice.LVAD,
      },
    } as unknown as DynamicMechanicalSupportInertanceProfileV1;
    const mechanics = vi.fn(coupledElasticMechanicsCallback(fixture.state, true));
    const circulationSnapshot = JSON.parse(JSON.stringify(fixture.state));
    const deviceSnapshot = JSON.parse(JSON.stringify(acceptedDeviceState));
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: DT_SEC,
      runtime: RUNTIME,
      dynamicMechanicalSupport: {
        config,
        heartRateBpm: 60,
        profile: malformedProfile,
        previousAcceptedState: acceptedDeviceState,
      },
      evaluateCandidateMechanics: mechanics,
    });

    expect(trial.converged).toBe(false);
    if (trial.converged === true) return;
    expect(trial.reason).toBe("invalid-input");
    expect(trial.message).toMatch(/IMPELLA belongs to LVAD/);
    expect(trial.rollbackState).toEqual(fixture.state);
    expect(fixture.state).toEqual(circulationSnapshot);
    expect(acceptedDeviceState).toEqual(deviceSnapshot);
    expect(mechanics).not.toHaveBeenCalled();
  });
});

function activeLvadConfig(): MechanicalSupportConfigV1 {
  return createMechanicalSupportConfigV1({
    lvad: { enabled: true, speedRpm: 5_200 },
  });
}

function profileWith(
  sameInertance: DynamicRotaryPumpCircuitInertanceV1,
): DynamicMechanicalSupportInertanceProfileV1 {
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: "core-integration-synthetic-v1-not-release-approved",
    profileBindingSha256: PROFILE_BINDING_SHA,
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: deviceBinding("LVAD", "1"),
      IMPELLA: deviceBinding("IMPELLA", "2"),
      VA_ECMO: deviceBinding("VA_ECMO", "3"),
      VV_ECMO: deviceBinding("VV_ECMO", "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: sameInertance,
      IMPELLA: sameInertance,
      VA_ECMO: sameInertance,
      VV_ECMO: sameInertance,
    }),
  });
}

function deviceBinding(deviceId: RotarySupportDeviceIdV1, hex: string) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId:
      `core-integration-${deviceId.toLowerCase()}-synthetic-not-approved`,
    circuitProfileBindingSha256: hex.repeat(64),
  });
}

function acceptedDeviceStateWith(
  config: MechanicalSupportConfigV1,
  profile: DynamicMechanicalSupportInertanceProfileV1,
  flows: Readonly<Record<RotarySupportDeviceIdV1, number>>,
): DynamicMechanicalSupportAcceptedStateV1 {
  return createDynamicMechanicalSupportAcceptedStateV1(profile, config, flows);
}

function inertance(
  overrides: Partial<DynamicRotaryPumpCircuitInertanceV1> = {},
): DynamicRotaryPumpCircuitInertanceV1 {
  return Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
    ...overrides,
  });
}

function fixedMechanics(
  pressures: Readonly<{ LV: number; LA: number; RV: number; RA: number }>,
): NonCoronaryCandidateMechanicsCallbackV1<null> {
  return () => Object.freeze({
    absolutePressuresMmHg: pressures,
    evaluation: null,
  });
}

function steadyStateFixture(timeSec = 0) {
  const graph = buildNonCoronaryCirculationGraphV1();
  const vascularHighMmHg = 20;
  const waterfallDownstreamMmHg = vascularHighMmHg
    - 0.25 ** 2 / (4 * vascularHighMmHg);
  const pressureByNode = Object.freeze({
    Ao: vascularHighMmHg,
    SA: vascularHighMmHg,
    Art: vascularHighMmHg,
    Cap: vascularHighMmHg,
    SV: vascularHighMmHg,
    VC: vascularHighMmHg,
    PA: vascularHighMmHg,
    PArt: vascularHighMmHg,
    PCap: vascularHighMmHg,
    PVen: waterfallDownstreamMmHg,
    PVein: waterfallDownstreamMmHg,
  });
  const chamberPressures = Object.freeze({
    LA: waterfallDownstreamMmHg,
    LV: 0.5 * (waterfallDownstreamMmHg + vascularHighMmHg),
    RA: waterfallDownstreamMmHg,
    RV: 0.5 * (waterfallDownstreamMmHg + vascularHighMmHg),
  });
  const nodeVolumes = Object.fromEntries(NON_CORONARY_NODE_NAMES_V1.map((name) => {
    const node = graph.nodes[graph.nodeIndex.get(name)!];
    if (name === "LV" || name === "LA" || name === "RV" || name === "RA") {
      return [name, node.x0];
    }
    const law = vascularPvLawFromNodeV1(node, RUNTIME.vascular);
    const pressure = pressureByNode[name as keyof typeof pressureByNode];
    return [
      name,
      effectiveUnstressedVolumeFromNodeV1(node, RUNTIME.vascular)
        + stressedVolumeFromPtm(law, pressure),
    ];
  })) as NonCoronaryCirculationAcceptedStateV1["nodeVolumesMl"];
  const state = createInitialNonCoronaryCirculationStateV1({
    timeSec,
    runtime: RUNTIME,
    fixedTotalBloodVolumeMl: sumNodeVolumes(nodeVolumes),
    nodeVolumesMl: nodeVolumes,
    dynamicEdgeFlowsMlPerSec: Object.freeze({ Ao_SA: 0, PA_PArt: 0 }),
    valveStates: Object.freeze({
      MV: initialMainWireQuasiSteadyOrificeValveStateV2(0),
      AoV: initialMainWireQuasiSteadyOrificeValveStateV2(0),
      TV: initialMainWireQuasiSteadyOrificeValveStateV2(0),
      PV: initialMainWireQuasiSteadyOrificeValveStateV2(0),
    }),
  });
  return Object.freeze({ state, chamberPressures });
}

function coupledElasticMechanicsCallback(
  reference: NonCoronaryCirculationAcceptedStateV1,
  includeTangent: boolean,
): NonCoronaryCandidateMechanicsCallbackV1<null> {
  const base = [16, 12, 11, 7] as const;
  const tangentMatrix:
    NonCoronaryAbsoluteChamberPressureTangentV1[
      "dPressureDVolumeMmHgPerMl"
    ] = [
      [0.12, 0.004, 0.006, 0],
      [0.004, 0.08, 0, 0.003],
      [0.006, 0, 0.09, 0.002],
      [0, 0.003, 0.002, 0.06],
    ];
  const tangent: NonCoronaryAbsoluteChamberPressureTangentV1 = Object.freeze({
    rowPressureOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    columnVolumeOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    units: "mmHg/mL" as const,
    pressureKind: "absolute" as const,
    derivativeSemantics:
      "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive" as const,
    dPressureDVolumeMmHgPerMl: tangentMatrix,
  });
  const referenceVolumes = NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map(
    (name) => reference.nodeVolumesMl[name],
  );
  return (volumes) => {
    const delta = NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map(
      (name, index) => volumes[name] - referenceVolumes[index]!,
    );
    const pressures = tangentMatrix.map((row, pressureIndex) =>
      base[pressureIndex]!
      + row.reduce(
        (sum, coefficient, volumeIndex) =>
          sum + coefficient * delta[volumeIndex]!,
        0,
      ));
    return Object.freeze({
      absolutePressuresMmHg: Object.freeze({
        LV: pressures[0]!,
        LA: pressures[1]!,
        RV: pressures[2]!,
        RA: pressures[3]!,
      }),
      ...(includeTangent ? { absolutePressureTangent: tangent } : {}),
      evaluation: null,
    });
  };
}

function sumNodeVolumes(
  volumes: NonCoronaryCirculationAcceptedStateV1["nodeVolumesMl"],
): number {
  return NON_CORONARY_NODE_NAMES_V1.reduce(
    (sum, name) => sum + volumes[name],
    0,
  );
}
