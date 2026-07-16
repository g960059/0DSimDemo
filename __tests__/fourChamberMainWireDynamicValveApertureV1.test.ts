import { describe, expect, it } from "vitest";
import { defaultParams } from "@/engine/core/params";
import {
  advanceMainWireDynamicValveApertureBackwardEulerV1,
  compileMainWireDynamicValveParametersByFlowV1,
  evaluateMainWireDynamicValveMomentumV1,
  evaluateMainWireOneSidedC2GateV1,
  initializeMainWireDynamicValveApertureV1,
  MAIN_WIRE_DYNAMIC_VALVE_NUMERICAL_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireDynamicValveApertureV1";
import {
  MAIN_WIRE_INERTANCE_SI_FACTOR_V1,
  MAIN_WIRE_PASCAL_PER_MMHG_V1,
  MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
  MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1";

describe("main-wire dynamic valve aperture V1", () => {
  it("compiles the engine/core topology/default valve values into SI", () => {
    const defaults = defaultParams();
    const compiled = compileMainWireDynamicValveParametersByFlowV1();
    const mv = compiled.Q_MV;
    expect(mv.referenceAreaM2).toBe(defaults.MV_Aref * 1e-4);
    expect(mv.maximumAreaM2).toBe(defaults.MV_Amax * 1e-4);
    expect(mv.leakAreaM2).toBe(defaults.MV_Aleak * 1e-4);
    expect(mv.numericalAreaM2).toBe(
      MAIN_WIRE_DYNAMIC_VALVE_NUMERICAL_POLICY_V1
        .numericalAreaToMaximumAreaRatio * defaults.MV_Amax * 1e-4,
    );
    expect(mv.pressureTransitionWidthPa).toBe(
      MAIN_WIRE_PASCAL_PER_MMHG_V1 / defaults.MV_kOpen,
    );
    expect(mv.baseLinearResistancePaSecPerM3).toBe(
      defaults.MV_R * MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
    );
    expect(mv.inertancePaSec2PerM3).toBe(
      defaults.MV_L * MAIN_WIRE_INERTANCE_SI_FACTOR_V1,
    );
    expect(mv.baseQuadraticResistancePaSec2PerM6).toBe(
      defaults.MV_B * MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
    );
    expect(mv.parameterOwner).toBe(
      "engine/core/topology.ts+engine/core/params.ts",
    );
    expect(mv.topologyAndDefaultValuesAgreeExactly).toBe(true);
    expect(Object.values(compiled).every(Object.isFrozen)).toBe(true);
  });

  it("uses a one-sided quintic C2 gate with zero endpoint jets", () => {
    expect(evaluateMainWireOneSidedC2GateV1(-1)).toBe(0);
    expect(evaluateMainWireOneSidedC2GateV1(0)).toBe(0);
    expect(evaluateMainWireOneSidedC2GateV1(0.5)).toBe(0.5);
    expect(evaluateMainWireOneSidedC2GateV1(1)).toBe(1);
    expect(evaluateMainWireOneSidedC2GateV1(2)).toBe(1);

    const epsilon = 1e-4;
    const derivativeAtZero = evaluateMainWireOneSidedC2GateV1(epsilon)
      / epsilon;
    const secondDerivativeAtZero = (
      evaluateMainWireOneSidedC2GateV1(2 * epsilon)
      - 2 * evaluateMainWireOneSidedC2GateV1(epsilon)
    ) / (epsilon * epsilon);
    const derivativeAtOne = (
      1 - evaluateMainWireOneSidedC2GateV1(1 - epsilon)
    ) / epsilon;
    expect(Math.abs(derivativeAtZero)).toBeLessThan(2e-6);
    expect(Math.abs(secondDerivativeAtZero)).toBeLessThan(1e-2);
    expect(Math.abs(derivativeAtOne)).toBeLessThan(2e-6);
  });

  it("statically condenses the exact backward-Euler aperture without clipping", () => {
    const parameters = compileMainWireDynamicValveParametersByFlowV1().Q_MV;
    const previous = 0.2;
    const dtSec = 0.012;
    const opened = advanceMainWireDynamicValveApertureBackwardEulerV1({
      parameters,
      previousApertureState01: previous,
      pressureGradientPa: 2 * parameters.pressureTransitionWidthPa,
      timeStepSec: dtSec,
    });
    const ko = 1 / parameters.tauOpenSec;
    expect(opened.openingRatePerSec).toBe(ko);
    expect(opened.closingRatePerSec).toBe(0);
    expect(opened.nextApertureState01).toBeCloseTo(
      (previous + dtSec * ko) / (1 + dtSec * ko),
      15,
    );

    const closed = advanceMainWireDynamicValveApertureBackwardEulerV1({
      parameters,
      previousApertureState01: previous,
      pressureGradientPa: -2 * parameters.pressureTransitionWidthPa,
      timeStepSec: dtSec,
    });
    const kc = 1 / parameters.tauCloseSec;
    expect(closed.openingRatePerSec).toBe(0);
    expect(closed.closingRatePerSec).toBe(kc);
    expect(closed.nextApertureState01).toBeCloseTo(
      previous / (1 + dtSec * kc),
      15,
    );

    const held = advanceMainWireDynamicValveApertureBackwardEulerV1({
      parameters,
      previousApertureState01: previous,
      pressureGradientPa: 0,
      timeStepSec: dtSec,
    });
    expect(held.nextApertureState01).toBe(previous);
    expect(held.clampApplied).toBe(false);
    expect(held.projectionApplied).toBe(false);
  });

  it("scales R and B by inverse area squared while keeping L constant", () => {
    const parameters = compileMainWireDynamicValveParametersByFlowV1().Q_AoV;
    const pressureGradientPa = 10 * MAIN_WIRE_PASCAL_PER_MMHG_V1;
    const flowM3PerSec = 80e-6;
    const open = evaluateMainWireDynamicValveMomentumV1({
      parameters,
      valveApertureState01: 1,
      pressureGradientPa,
      flowM3PerSec,
    });
    const closed = evaluateMainWireDynamicValveMomentumV1({
      parameters,
      valveApertureState01: 0,
      pressureGradientPa,
      flowM3PerSec,
    });
    expect(open.areaLossScale).toBeCloseTo(
      Math.pow(parameters.referenceAreaM2 / open.effectiveAreaM2, 2),
      15,
    );
    expect(closed.linearResistancePaSecPerM3
      / open.linearResistancePaSecPerM3).toBeCloseTo(
        closed.areaLossScale / open.areaLossScale,
        9,
      );
    expect(closed.quadraticResistancePaSec2PerM6
      / open.quadraticResistancePaSec2PerM6).toBeCloseTo(
        closed.areaLossScale / open.areaLossScale,
        9,
      );
    expect(closed.inertancePaSec2PerM3).toBe(open.inertancePaSec2PerM3);
    expect(closed.dissipationW).toBeGreaterThan(0);
    expect(closed.apertureClampApplied).toBe(false);
    expect(closed.apertureProjectionApplied).toBe(false);

    const reverse = evaluateMainWireDynamicValveMomentumV1({
      parameters,
      valveApertureState01: 0.4,
      pressureGradientPa: -pressureGradientPa,
      flowM3PerSec: -flowM3PerSec,
    });
    expect(reverse.signedLossPressurePa).toBeLessThan(0);
    expect(reverse.dissipationW).toBeGreaterThan(0);
  });

  it("derives the initial aperture from pressure and flow instead of xi0", () => {
    const parameters = compileMainWireDynamicValveParametersByFlowV1().Q_TV;
    const forward = initializeMainWireDynamicValveApertureV1({
      parameters,
      pressureGradientPa: 2 * parameters.pressureTransitionWidthPa,
      flowM3PerSec: 0,
    });
    const reverse = initializeMainWireDynamicValveApertureV1({
      parameters,
      pressureGradientPa: -2 * parameters.pressureTransitionWidthPa,
      flowM3PerSec: 0,
    });
    const quiescent = initializeMainWireDynamicValveApertureV1({
      parameters,
      pressureGradientPa: 0,
      flowM3PerSec: 0,
    });
    const conflicting = initializeMainWireDynamicValveApertureV1({
      parameters,
      pressureGradientPa: -2 * parameters.pressureTransitionWidthPa,
      flowM3PerSec: 2 * parameters.initializationFlowScaleM3PerSec,
    });
    expect(forward.apertureState01).toBe(1);
    expect(reverse.apertureState01).toBe(0);
    expect(quiescent.apertureState01).toBe(0);
    expect(conflicting.apertureState01).toBe(0.5);
    expect(conflicting.topologyXi0Consumed).toBe(false);
    expect(conflicting.clampApplied).toBe(false);
    expect(conflicting.projectionApplied).toBe(false);
  });
});
