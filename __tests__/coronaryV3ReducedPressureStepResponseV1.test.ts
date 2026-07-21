import { describe, expect, it } from "vitest";

import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1,
  runCoronaryV3ReducedPressureStepResponseV1,
  type CoronaryV3ReducedPressureStepProtocolV1,
  type CoronaryV3ReducedPressureStepResponseV1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepResponseV1";
import {
  describeCoronaryV3StepResponseMetricsV1,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";

const PROTOCOL = Object.freeze({
  dtSec: 0.2,
  acceptedAutoregulationWindowSec: 1,
  baselineEquilibrationMaximumDurationSec: 400,
  equilibriumRequiredConsecutiveWindows: 3,
  equilibriumMaximumAbsoluteLogToneChangePerWindow: 8e-4,
  equilibriumMaximumAbsoluteLogQmTargetRatio: 0.02,
  baselineObservationDurationSec: 5,
  postStepObservationDurationSec: 60,
  baselineMetricsWindowDurationSec: 5,
  finalMetricsWindowDurationSec: 10,
  fixedAbsoluteRightAtrialPressureMmHg: 5,
  fixedPerivascularExternalPressureMmHg: 0,
  fixedIntramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
    LAD: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
    LCx: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
    RCA: Object.freeze({ subepicardial: 10, subendocardial: 10 }),
  }),
  maximumAbsoluteInitializerContinuityResidualMlPerSec: 1e-8,
  maximumAbsoluteStepLedgerResidualMl: 1e-8,
  maximumAbsoluteNodeContinuityResidualMl: 1e-8,
}) satisfies CoronaryV3ReducedPressureStepProtocolV1;

let cached: CoronaryV3ReducedPressureStepResponseV1 | undefined;

function result(): CoronaryV3ReducedPressureStepResponseV1 {
  cached ??= runCoronaryV3ReducedPressureStepResponseV1(PROTOCOL);
  return cached;
}

describe("coronary V3 fixed-IMP venous-boundary pressure-step harness", () => {
  it("uses independently initialized and explicitly equilibrated 80 and 100 mmHg baselines", () => {
    const characterized = result();
    const low = characterized.up.baselineCheckpoint;
    const high = characterized.down.baselineCheckpoint;
    expect(characterized.baselinesInitializedIndependently).toBe(true);
    expect(low.independentlyInitialized).toBe(true);
    expect(high.independentlyInitialized).toBe(true);
    expect(low.baselineAorticPressureMmHg).toBe(80);
    expect(high.baselineAorticPressureMmHg).toBe(100);
    expect(low.acceptedHydraulicState).not.toBe(high.acceptedHydraulicState);
    expect(low.initializerDiagnostics.pressureConsistentCoronaryBloodVolumeMl)
      .not.toBeCloseTo(
        high.initializerDiagnostics.pressureConsistentCoronaryBloodVolumeMl,
        8,
      );
    expect(low.initializerDiagnostics
      .maximumAbsoluteNodeContinuityResidualMlPerSec).toBeLessThanOrEqual(
        PROTOCOL.maximumAbsoluteInitializerContinuityResidualMlPerSec,
      );
    expect(high.initializerDiagnostics
      .maximumAbsoluteNodeContinuityResidualMlPerSec).toBeLessThanOrEqual(
        PROTOCOL.maximumAbsoluteInitializerContinuityResidualMlPerSec,
      );
    expect(low.equilibriumCriteriaSatisfied).toBe(true);
    expect(high.equilibriumCriteriaSatisfied).toBe(true);
    expect(low.terminalConsecutiveSatisfiedWindowCount).toBe(3);
    expect(high.terminalConsecutiveSatisfiedWindowCount).toBe(3);
  });

  it("preserves finite per-window layer observations and the blood-volume ledger", () => {
    const characterized = result();
    for (const direction of [characterized.up, characterized.down]) {
      for (const arm of [direction.toneActive, direction.toneFrozen]) {
        expect(arm.allFinite).toBe(true);
        expect(arm.conservationToleranceSatisfied).toBe(true);
        for (const window of arm.allWindows) {
          expect(window.allFinite).toBe(true);
          expect(window.conservationToleranceSatisfied).toBe(true);
          expect(Math.abs(window.bloodVolumeLedgerResidualMl))
            .toBeLessThanOrEqual(
              PROTOCOL.maximumAbsoluteStepLedgerResidualMl
                * window.acceptedStepCount,
            );
          expect(window.maximumAbsoluteStepLedgerResidualMl)
            .toBeLessThanOrEqual(
              PROTOCOL.maximumAbsoluteStepLedgerResidualMl,
            );
          expect(window.maximumAbsoluteNodeContinuityResidualMl)
            .toBeLessThanOrEqual(
              PROTOCOL.maximumAbsoluteNodeContinuityResidualMl,
            );
          for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
            expect(Object.keys(window.layerByTerritory[territoryId]).sort())
              .toEqual([...CORONARY_LAYER_IDS_V2].sort());
            expect(window.endpointPostFocalLesionMinusCommonCvPressureMmHgByTerritory[
              territoryId
            ]).toBeGreaterThan(0);
            for (const layerId of CORONARY_LAYER_IDS_V2) {
              const layer = window.layerByTerritory[territoryId][layerId];
              expect(layer.meanQmInternalFlowMlPerSec).toBeGreaterThan(0);
              expect(layer.demandTargetFlowMlPerSec).toBeGreaterThan(0);
              expect(Number.isFinite(layer.meanQmTargetRatio)).toBe(true);
              expect(Number.isFinite(layer.endpointQmTargetRatio)).toBe(true);
            }
          }
        }
      }
    }
  });

  it("separates the passive pressure response from the slow active-tone response", () => {
    const characterized = result();
    const upActive = characterized.up.toneActive;
    const upFrozen = characterized.up.toneFrozen;
    const downActive = characterized.down.toneActive;
    const downFrozen = characterized.down.toneFrozen;

    expect(firstPostFlow(upFrozen)).toBeGreaterThan(lastBaselineFlow(upFrozen));
    expect(firstPostFlow(downFrozen)).toBeLessThan(lastBaselineFlow(downFrozen));
    expect(meanTerminalTone(upActive)).toBeGreaterThan(meanTerminalTone(upFrozen));
    expect(meanTerminalTone(downActive)).toBeLessThan(meanTerminalTone(downFrozen));
    expect(meanTerminalTone(upActive)).not.toBeCloseTo(
      meanTerminalTone(upFrozen),
      6,
    );
    expect(meanTerminalTone(downActive)).not.toBeCloseTo(
      meanTerminalTone(downFrozen),
      6,
    );
    for (const window of [...upFrozen.allWindows, ...downFrozen.allWindows]) {
      for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
        for (const layerId of CORONARY_LAYER_IDS_V2) {
          const layer = window.layerByTerritory[territoryId][layerId];
          expect(layer.appliedEndToneResistanceScale)
            .toBe(layer.startToneResistanceScale);
        }
      }
    }
  });

  it("returns metric-ready raw windows while keeping every validation claim false", () => {
    const characterized = result();
    for (const arm of [
      characterized.up.toneActive,
      characterized.up.toneFrozen,
      characterized.down.toneActive,
      characterized.down.toneFrozen,
    ]) {
      const metrics = describeCoronaryV3StepResponseMetricsV1(arm.metricInput);
      expect(metrics.measurementStation.kind)
        .toBe("venous-boundary-pressure-flow-surrogate");
      expect(metrics.exactDankelmanMeasurementStationEstablished).toBe(false);
      expect(metrics.eligibleForDirectOriginalPaperT50ReproductionClaim)
        .toBe(false);
      expect(metrics.physiologicalAcceptanceEstablished).toBe(false);
      expect(metrics.independentValidationEstablished).toBe(false);
    }
    expect(characterized.claim)
      .toBe(CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1);
    expect(characterized.claim.leftMainCannulaRepresented).toBe(false);
    expect(characterized.claim.distalZeroFlowWedgeRepresented).toBe(false);
    expect(characterized.claim.constantFlowBoundaryRepresented).toBe(false);
    expect(characterized.claim.dankelmanProtocolReproduced).toBe(false);
    expect(characterized.claim.parameterFittingApplied).toBe(false);
    expect(characterized.claim.observations.passiveResponseResolution)
      .toBe("one-second-window-means-only");
    expect(characterized.claim.observations
      .subWindowInstantaneousPassiveExtremumResolved).toBe(false);
    expect(characterized.claim.initializerAndSolverDefaultsUsedImplicitly)
      .toBe(false);
    expect(characterized.modelBinding).toMatchObject({
      topologyPriorSource: "NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2",
      diseaseSource: "NORMAL_CORONARY_DISEASE_INPUT_V2",
      collapseHydraulicsConstruction:
        "buildCoronaryCollapseHydraulicsPriorV2-normal-topology-residual-area-0.10",
      initialToneSource: "initialCoronaryToneStateV2-normal-prior",
      initializerOptionsSource:
        "DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2-explicit",
      backwardEulerSolverOptionsSource:
        "DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2-explicit",
      autoregulationLaw: "integral-flow-homeostasis-v2",
      autoregulationWindowInterpretation: "irregular-rhythm-stationary",
    });
    for (const fingerprint of [
      characterized.modelBinding.topologyPriorFingerprint,
      characterized.modelBinding.normalDiseaseFingerprint,
      characterized.modelBinding.collapseHydraulicsFingerprint,
      characterized.modelBinding.initialToneFingerprint,
      characterized.modelBinding.initializerOptionsFingerprint,
      characterized.modelBinding.backwardEulerSolverOptionsFingerprint,
      characterized.modelBinding.autoregulationPriorFingerprint,
      characterized.modelBinding.normalControlFingerprint,
    ]) expect(fingerprint).toMatch(/^fnv1a32-[0-9a-f]{8}$/);
    expect(characterized.biologicalValidationEstablished).toBe(false);
    expect(characterized.physiologicalAcceptanceEstablished).toBe(false);
  });

  it("fails closed for implicit windows, malformed layer records, or insufficient response coverage", () => {
    expect(() => runCoronaryV3ReducedPressureStepResponseV1({
      ...PROTOCOL,
      acceptedAutoregulationWindowSec: 0.5,
    })).toThrow(/explicit 1 s/);
    expect(() => runCoronaryV3ReducedPressureStepResponseV1({
      ...PROTOCOL,
      postStepObservationDurationSec: 4,
      finalMetricsWindowDurationSec: 4,
    })).toThrow(/five-second/);
    expect(() => runCoronaryV3ReducedPressureStepResponseV1({
      ...PROTOCOL,
      fixedIntramyocardialPressureMmHgByTerritoryLayer: {
        ...PROTOCOL.fixedIntramyocardialPressureMmHgByTerritoryLayer,
        LAD: { subepicardial: 10, subendocardial: Number.NaN },
      },
    })).toThrow(/must be finite/);
  });
});

function firstPostFlow(
  arm: CoronaryV3ReducedPressureStepResponseV1["up"]["toneActive"],
): number {
  return arm.postStepWindows[0]!.beat.meanObservedFlowMlPerSec;
}

function lastBaselineFlow(
  arm: CoronaryV3ReducedPressureStepResponseV1["up"]["toneActive"],
): number {
  return arm.baselineWindows.at(-1)!.beat.meanObservedFlowMlPerSec;
}

function meanTerminalTone(
  arm: CoronaryV3ReducedPressureStepResponseV1["up"]["toneActive"],
): number {
  let sum = 0;
  let count = 0;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      sum += arm.terminalHydraulicState
        .toneResistanceScaleByTerritoryLayer[territoryId][layerId];
      count += 1;
    }
  }
  return sum / count;
}
