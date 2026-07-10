import { describe, expect, it } from "vitest";

import {
  DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1,
  initialOneFiberAVPlaneLeftHeartStateV1,
  stepOneFiberAVPlaneLeftHeartV1,
} from "@/engine/mechanics2/subsystems/OneFiberAVPlaneLeftHeartV1";
import {
  evaluateOneFiberChamberWallV1,
  initialOneFiberChamberWallStateV1,
} from "@/engine/mechanics2/atrial/OneFiberChamberWallV1";
import {
  initialSmoothInertialValveStateV2,
  stepSmoothInertialValveV2,
} from "@/engine/mechanics2/valve/SmoothInertialValveV2";
import {
  initialSharedAVPlaneStateV1,
  stepSharedAVPlaneV1,
} from "@/engine/mechanics2/core/SharedAVPlaneV1";
import {
  opposedLobeAreasPassV1,
  runMechanisticAtrialOneFiberBenchV1,
  signedLaPvLoopAreaV1,
} from
  "@/engine/mechanics2/benches/MechanisticAtrialOneFiberBench";
import { runMechanisticAtrialEnvelopeBenchV1 } from
  "@/engine/mechanics2/benches/MechanisticAtrialEnvelopeBench";

describe("mechanistic atrial one-fiber vertical slice", () => {
  it("requires opposed, non-degenerate signed A and v lobes", () => {
    const counterClockwise = signedLaPvLoopAreaV1([
      { laVolumeMl: 0, laPressureMmHg: 0 },
      { laVolumeMl: 1, laPressureMmHg: 0 },
      { laVolumeMl: 1, laPressureMmHg: 1 },
      { laVolumeMl: 0, laPressureMmHg: 1 },
    ]);
    const clockwise = signedLaPvLoopAreaV1([
      { laVolumeMl: 0, laPressureMmHg: 0 },
      { laVolumeMl: 0, laPressureMmHg: 1 },
      { laVolumeMl: 1, laPressureMmHg: 1 },
      { laVolumeMl: 1, laPressureMmHg: 0 },
    ]);

    expect(counterClockwise).toBe(1);
    expect(clockwise).toBe(-1);
    expect(opposedLobeAreasPassV1(counterClockwise, clockwise, 0.5, 0.5)).toBe(true);
    expect(opposedLobeAreasPassV1(counterClockwise, counterClockwise, 0.5, 0.5)).toBe(false);
    expect(opposedLobeAreasPassV1(counterClockwise, 0, 0.5, 0.5)).toBe(false);
  });

  it("derives passive pressure by virtual work and dissipates non-negative viscous power", () => {
    const params = DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1.laWall;
    const state = initialOneFiberChamberWallStateV1(0);
    const lower = evaluateOneFiberChamberWallV1(state, {
      dtSec: 0.001,
      electricalActivation01: 0,
      freeWallVolumeMl: 72,
      previousFreeWallVolumeMl: 73,
      pericardialPressureMmHg: 0,
    }, params);
    const upper = evaluateOneFiberChamberWallV1(state, {
      dtSec: 0.001,
      electricalActivation01: 0,
      freeWallVolumeMl: 92,
      previousFreeWallVolumeMl: 93,
      pericardialPressureMmHg: 0,
    }, params);

    expect(upper.passiveStressKPa).toBeGreaterThan(lower.passiveStressKPa);
    expect(lower.viscousStressKPa).toBeLessThan(0);
    expect(lower.viscousDissipationW).toBeGreaterThanOrEqual(0);
    expect(Math.abs(lower.virtualWorkPressureResidualMmHg)).toBeLessThan(1e-10);
  });

  it("keeps smooth inertial valve flow finite and satisfies its pressure-flow equation", () => {
    const params = DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1.mitralValve;
    const output = stepSmoothInertialValveV2(initialSmoothInertialValveStateV2(), {
      dtSec: 0.001,
      upstreamPressureMmHg: 10,
      downstreamPressureMmHg: 5,
    }, params);

    expect(output.openFraction01).toBeGreaterThan(0.99);
    expect(output.qMlPerSec).toBeGreaterThan(0);
    expect(Number.isFinite(output.qMlPerSec)).toBe(true);
    expect(Math.abs(output.pressureFlowResidualMmHg)).toBeLessThan(1e-10);
  });

  it("moves the shared AV-plane apexward from ventricular active wall stress", () => {
    const params = DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1.avPlane;
    const output = stepSharedAVPlaneV1(initialSharedAVPlaneStateV1(), {
      dtSec: 0.001,
      atrialTransmuralPressureMmHg: 5,
      ventricularTransmuralPressureMmHg: 100,
      atrialActiveStressKPa: 0,
      ventricularActiveStressKPa: 65,
    }, params);

    expect(output.positionCm).toBeGreaterThan(0);
    expect(output.velocityCmPerSec).toBeGreaterThan(0);
    expect(Math.abs(output.kinematicResidualCm)).toBeLessThan(1e-10);
    expect(Math.abs(output.forceBalanceResidualN)).toBeLessThan(1e-10);
  });

  it("solves the coupled blood-volume ledger without pressure-memory hooks", () => {
    const output = stepOneFiberAVPlaneLeftHeartV1(
      initialOneFiberAVPlaneLeftHeartStateV1(),
      {
        dtSec: 0.001,
        laElectricalActivation01: 0,
        lvElectricalActivation01: 0,
      },
      DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1,
    );

    expect(output.allFinite).toBe(true);
    expect(output.residual.solverConverged).toBe(true);
    expect(output.residual.maxNormalizedEquationResidual).toBeLessThan(1e-7);
    expect(Math.abs(output.residual.laMassResidualMl)).toBeLessThan(1e-7);
    expect(Math.abs(output.residual.lvMassResidualMl)).toBeLessThan(1e-7);
    expect(Math.abs(output.residual.avPlaneKinematicResidualCm)).toBeLessThan(1e-7);
    expect(Math.abs(output.residual.closedCircuitVolumeResidualMl)).toBeLessThan(1e-7);
  });

  it("retains the normal signal and mechanism negative controls at periodic steady state", () => {
    const report = runMechanisticAtrialOneFiberBenchV1();
    const normal = report.profiles.find((row) => row.profileId === "normal-hr75")!;
    const fixed = report.profiles.find((row) => row.profileId === "av-plane-fixed-control")!;
    const activeOff = report.profiles.find((row) => row.profileId === "atrial-active-off-control")!;

    expect(report.model.forbiddenPressureHooks).toEqual(["P_mem", "P_relief", "P_LV_recv"]);
    expect(report.model.avPlane).toBe("shared-inertial-force-coordinate");
    expect(report.gates).toEqual({
      numericalPass: true,
      normalEnvelopePass: true,
      normalPhasePass: true,
      normalMitralEligibilityPass: true,
      normalMitralPeakEaPass: true,
      normalMitralSupportiveDiagnosticsPass: true,
      normalMitralWaveformPass: true,
      normalFigureEightPass: true,
      mechanismControlsPass: true,
    });
    expect(normal.periodicSteadyState).toBe(true);
    expect(normal.mitralGateReadback).toEqual({
      referenceAgeBand: "41-60",
      measurementApplicability: "applicable",
      fusionEligibility: "pass",
      ageSpecificPeakEToA: "pass",
      atrialFillingFraction: "pass",
      decelerationTime: "pass",
      resolvedRiseAndDecay: "pass",
      resolvedLowFlowDiastasis: "pass",
      hardAcceptancePass: true,
      supportiveDiagnosticsPass: true,
    });
    expect(normal.mitralWaveFusionClass).toBe("separated");
    expect(normal.mitralWaveMeasurementValid).toBe(true);
    expect(normal.mitralPeakMeasurementValid).toBe(true);
    expect(normal.mitralDecelerationMeasurementValid).toBe(true);
    expect(normal.mitralPeakVelocityEToARatio).toBeGreaterThanOrEqual(0.69);
    expect(normal.mitralPeakVelocityEToARatio).toBeLessThanOrEqual(2.07);
    expect(normal.mitralAtrialFillingFraction).toBeGreaterThanOrEqual(0.12);
    expect(normal.mitralAtrialFillingFraction).toBeLessThanOrEqual(0.46);
    expect(normal.mitralEDecelerationTimeSec).toBeGreaterThanOrEqual(0.143);
    expect(normal.mitralEDecelerationTimeSec).toBeLessThanOrEqual(0.219);
    expect(normal.mitralERiseMonotoneFraction).toBeGreaterThanOrEqual(0.80);
    expect(normal.mitralEDecayMonotoneFraction).toBeGreaterThanOrEqual(0.80);
    expect(normal.mitralDiastasisDurationSec).toBeGreaterThan(0);
    expect(
      normal.reservoirConduitIntersection || normal.reservoirPumpingIntersection,
    ).toBe(true);
    expect(normal.figureEightCrossingInPreferredWindow).toBe(true);
    expect(["late-conduit", "early-pumping"]).toContain(normal.figureEightCrossingPhase);
    expect(normal.figureEightCrossingAngleDeg).toBeGreaterThanOrEqual(10);
    expect(normal.conduitBelowReservoirChordFraction).toBeGreaterThan(0.95);
    expect(normal.conduitBeforeCrossingBelowReservoirPathFraction).toBeGreaterThanOrEqual(0.95);
    expect(normal.pumpingAfterCrossingAboveReservoirPathFraction).toBeGreaterThanOrEqual(0.95);
    expect(normal.pumpingAboveFigureEightChordFraction).toBeGreaterThanOrEqual(0.80);
    expect(normal.opposedLobeOrientation).toBe(true);
    expect(normal.aLoopSignedAreaMmHgMl * normal.vLoopSignedAreaMmHgMl).toBeLessThan(0);
    expect(normal.conduitThroughputMl).toBeGreaterThanOrEqual(5);
    expect(normal.conduitVolumeDropMl).toBeGreaterThan(0);
    expect(normal.pressureRangePulmonaryVenousMmHg[0]).toBeGreaterThan(0);
    expect(normal.pressureRangeReturnReservoirMmHg[0]).toBeGreaterThan(0);
    expect(normal.mitralReverseVolumeMl).toBeLessThan(1);
    expect(normal.aorticReverseVolumeMl).toBeLessThan(1);
    expect(normal.mitralSignificantReverseDuty01).toBe(0);
    expect(normal.aorticSignificantReverseDuty01).toBe(0);
    expect(Number.isFinite(normal.mvcTangentJumpNorm)).toBe(true);
    expect(Number.isFinite(normal.mvoTangentJumpNorm)).toBe(true);
    expect(normal.mvcTangentJumpNorm).toBeGreaterThanOrEqual(0);
    expect(normal.mvoTangentJumpNorm).toBeGreaterThanOrEqual(0);
    expect(normal.xDescentDepthMmHg).toBeGreaterThan(fixed.xDescentDepthMmHg + 0.4);
    expect(normal.earlyReservoirOvershootMmHg).toBeLessThanOrEqual(
      0.1 * normal.xDescentDepthMmHg,
    );
    expect(normal.aLoopAreaMmHgMl).toBeGreaterThan(activeOff.aLoopAreaMmHgMl * 1.5);
    expect(activeOff.mitralWaveFusionClass).toBe("not-measurable");
    expect(activeOff.mitralWaveMeasurementValid).toBe(false);
    expect(activeOff.mitralPeakMeasurementValid).toBe(false);
    expect(activeOff.mitralDecelerationMeasurementValid).toBe(false);
    expect(activeOff.mitralGateReadback).toMatchObject({
      referenceAgeBand: "41-60",
      measurementApplicability: "not-applicable-unresolved-peaks",
      ageSpecificPeakEToA: "not-applicable",
      atrialFillingFraction: "not-applicable",
      decelerationTime: "not-applicable",
      resolvedRiseAndDecay: "not-applicable",
      resolvedLowFlowDiastasis: "not-applicable",
    });
  });

  it("preserves numerics, expected directions, and dt parity across the scout envelope", () => {
    const report = runMechanisticAtrialEnvelopeBenchV1();
    const dtHalf = report.cases.find((row) => row.caseId === "normal-dt0p5")!.result;
    const reference = report.cases.find((row) => row.caseId === "normal-dt1")!.result;
    const dtDouble = report.cases.find((row) => row.caseId === "normal-dt2")!.result;
    const hr100 = report.cases.find((row) => row.caseId === "hr100")!.result;
    const preloadLow = report.cases.find((row) => row.caseId === "preload-low")!.result;
    const preloadHigh = report.cases.find((row) => row.caseId === "preload-high")!.result;
    const couplingLow = report.cases.find((row) => row.caseId === "av-coupling-low")!.result;
    const couplingHigh = report.cases.find((row) => row.caseId === "av-coupling-high")!.result;

    expect(report.gates).toEqual({
      numericalPass: true,
      broadEnvelopePass: true,
      boundaryAndValveBurdenPass: true,
      directionalResponsePass: true,
      dtParityPass: true,
      smoothValveEventPass: true,
      normalMitralWaveformRetentionPass: true,
      moderateTopologyRetentionPass: true,
    });
    expect(Math.max(...Object.values(report.dtRelativeErrors))).toBeLessThan(0.01);
    expect(report.cases.every(({ result }) => result.periodicSteadyState)).toBe(true);
    expect(preloadLow.pressureRangeLaMmHg[1]).toBeLessThan(reference.pressureRangeLaMmHg[1]);
    expect(preloadHigh.pressureRangeLaMmHg[1]).toBeGreaterThan(reference.pressureRangeLaMmHg[1]);
    expect(couplingLow.avPlaneDisplacementCm).toBeLessThan(reference.avPlaneDisplacementCm);
    expect(couplingHigh.avPlaneDisplacementCm).toBeGreaterThan(reference.avPlaneDisplacementCm);
    expect(dtHalf.mvcTangentJumpNorm).toBeLessThanOrEqual(0.75 * reference.mvcTangentJumpNorm);
    expect(reference.mvcTangentJumpNorm).toBeLessThanOrEqual(0.75 * dtDouble.mvcTangentJumpNorm);
    expect(dtHalf.mvoTangentJumpNorm).toBeLessThanOrEqual(0.75 * reference.mvoTangentJumpNorm);
    expect(reference.mvoTangentJumpNorm).toBeLessThanOrEqual(0.75 * dtDouble.mvoTangentJumpNorm);
    expect(report.gateScope.diagnosticMorphologyAxes).toContain("heart rate");
    expect(hr100.mitralWaveFusionClass).toBe("partial-fusion");
    expect(hr100.mitralGateReadback.measurementApplicability)
      .toBe("not-applicable-fusion");
    expect(report.gateScope.deferredToFullCircuit).toContain(
      "fusion acceptance across heart-rate, PR, preload, and afterload envelopes",
    );
    expect(report.gateScope.requiresMeasurementModel).toContain(
      "PW-Doppler leaflet-tip sample volume, beam angle, and spectral-envelope operator",
    );
  });
});
