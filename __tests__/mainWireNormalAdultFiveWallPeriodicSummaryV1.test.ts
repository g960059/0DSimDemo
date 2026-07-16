import { beforeAll, describe, expect, it } from "vitest";

import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1,
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire normal-adult five-wall periodic summary V1", () => {
  let result: MainWireNormalAdultFiveWallPeriodicResultV1;

  beforeAll(() => {
    result = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 2,
      initialization: "canonical",
    });
  }, 90_000);

  it("summarizes only the final retained cycle with its preceding sample", () => {
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result);

    expect(summary.selectedBeat).toMatchObject({
      beatIndex: 2,
      sampleCount: 100,
      precedingAcceptedSampleAvailable: true,
      precedingBeatIndex: 1,
    });
    expect(summary.cyclePhysiology.sampleCount).toBe(100);
    expect(summary.cyclePhysiology.workEnergy.stressWorkCoverageFraction).toBe(1);
    expect(summary.fixedActivationPrior.atrialCalciumOnsetPhase01)
      .toBeCloseTo(0.852, 12);
    expect(summary.ranges.chamberVolumeMl.LA.maximum)
      .toBeGreaterThan(summary.ranges.chamberVolumeMl.LA.minimum);
    expect(summary.ranges.chamberTransmuralPressureMmHg.LV.maximum)
      .toBeGreaterThan(summary.ranges.chamberTransmuralPressureMmHg.LV.minimum);
    expect(summary.hemodynamics.leftVentricularEjectionFraction01)
      .toBeGreaterThan(0);
    expect(summary.residualMaxima.absoluteTotalBloodVolumeErrorMl)
      .toBeLessThan(1e-6);
    expect(summary.convergence.latestPeriod1Closure).not.toBeNull();
  });

  it("keeps compact morphology readbacks but withholds interpretation pre-closure", () => {
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result);

    expect(summary.morphologyInterpretation).toEqual({
      eligible: false,
      reason: "ineligible-period1-not-converged",
    });
    expect(summary.claim.morphologyMetricsComputedWhenNotPeriodic).toBe(true);
    expect(summary.claim.morphologyInterpretationRequiresPeriod1Convergence)
      .toBe(true);
    expect(summary.claim.parameterSearchOrTuning).toBe(false);
    expect(summary.claim.changesPhysiologyOrMaterialParameters).toBe(false);
    expect("probes" in summary.laPvMorphology
      .reservoirConduitEqualVolumeOrder).toBe(false);
    if (summary.laPvMorphology.twoLobes.status === "measurable") {
      expect("path" in summary.laPvMorphology.twoLobes.aLobe).toBe(false);
      expect(summary.laPvMorphology.twoLobes.aLobe.pointCount).toBeGreaterThan(1);
    }
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1
      .addsDynamicState).toBe(false);
  });

  it("allows morphology interpretation only for a consistent period-1 result", () => {
    const inconsistent = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...result,
      terminationReason: "period1-converged",
      periodicSteadyStateClaimed: true,
    });
    expect(inconsistent.morphologyInterpretation.eligible).toBe(false);

    const period1 = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...result,
      terminationReason: "period1-converged",
      periodicSteadyStateClaimed: true,
      periodicity: Object.freeze({
        ...result.periodicity,
        status: "period1-converged" as const,
      }),
    });
    expect(period1.morphologyInterpretation).toEqual({
      eligible: true,
      reason: "eligible-period1-converged",
    });
  });

  it("requires a retained complete beat", () => {
    expect(() => summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...result,
      retainedCompleteBeats: [],
    })).toThrow("no retained complete beat");
  });
});
