import { beforeAll, describe, expect, it } from "vitest";

import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1,
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

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

    expect(summary.protocol).toEqual({
      identity: result.protocolIdentity,
      identityHash: result.protocolIdentityHash,
      componentHashes: result.protocolComponentHashes,
    });
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
    expect(summary.convergence.policy).toBe(result.policy);
    expect(summary.convergence.latestPeriod1Closure).not.toBeNull();
    expect(summary.selectedBeat.jacobianFiniteDifferenceWidthAudit
      .acceptedStepCount).toBe(summary.selectedBeat.sampleCount);
    expect(summary.selectedBeat.jacobianFiniteDifferenceWidthAudit
      .nominalStepCount
      + summary.selectedBeat.jacobianFiniteDifferenceWidthAudit
        .alternateStepCount).toBe(summary.selectedBeat.sampleCount);
  });

  it("keeps compact morphology readbacks but withholds interpretation pre-closure", () => {
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result);

    expect(summary.morphologyInterpretation).toEqual({
      eligible: false,
      scope: "current-dt-period1-only",
      timeStepRobustnessEstablished: false,
      reason: "ineligible-period1-not-converged",
    });
    expect(summary.claim.morphologyMetricsComputedWhenNotPeriodic).toBe(true);
    expect(summary.claim.morphologyInterpretationRequiresPeriod1Convergence)
      .toBe(true);
    expect(summary.claim.parameterSearchOrTuning).toBe(false);
    expect(summary.claim.changesPhysiologyOrMaterialParameters).toBe(false);
    expect(summary.claim.timeSeriesResamplingOrInterpolationApplied).toBe(false);
    expect(summary.claim.piecewiseLinearPvGeometryInterpolationApplied).toBe(true);
    expect(summary.claim.timeStepRobustnessAssessedBySummary).toBe(false);
    expect(summary.fixedActivationPrior.purpose).toBe(
      "normalized-Ca-lobe-selection-proxy-not-Land-activation-or-tension-law",
    );
    expect("probes" in summary.laPvMorphology
      .reservoirConduitEqualVolumeOrder).toBe(false);
    if (summary.laPvMorphology.twoLobes.status === "measurable") {
      expect("path" in summary.laPvMorphology.twoLobes.aLobe).toBe(false);
      expect(summary.laPvMorphology.twoLobes.aLobe.pointCount).toBeGreaterThan(1);
    }
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1
      .addsDynamicState).toBe(false);
  });

  it("reports classifier evidence closures and rejects a scale-set mismatch", () => {
    const observation = result.beatClosure.at(-1)!;
    const withEvidence = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...result,
      periodicity: Object.freeze({
        ...result.periodicity,
        evidenceBeatIndices: Object.freeze([observation.beatIndex]),
      }),
    });
    expect(withEvidence.convergence.evidenceClosures).toEqual([{
      beatIndex: observation.beatIndex,
      period1MaximumNormalizedDelta:
        observation.period1!.overall.maximumNormalizedDelta,
      period2MaximumNormalizedDelta:
        observation.period2?.overall.maximumNormalizedDelta ?? null,
    }]);

    const mismatchedObservation = Object.freeze({
      ...observation,
      period1: Object.freeze({
        ...observation.period1!,
        referenceScaleSetId: "wrong-scale-set",
      }),
    });
    expect(() => summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...result,
      beatClosure: Object.freeze([
        ...result.beatClosure.slice(0, -1),
        mismatchedObservation,
      ]),
    })).toThrow(/referenceScaleSetId does not match periodic policy/);
  });

  it("counts nominal and alternate accepted Jacobian widths on the selected beat", () => {
    const nominal =
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1;
    const selected = result.retainedCompleteBeats.at(-1)!;
    const samples = Object.freeze(selected.samples.map((sample, index) =>
      Object.freeze({
        ...sample,
        acceptedMechanicsJacobianAudit: Object.freeze({
          ...sample.acceptedMechanicsJacobianAudit,
          finiteDifferenceScaledStepUsed: index === 0 ? nominal / 2 : nominal,
        }),
      })));
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...result,
      retainedCompleteBeats: Object.freeze([
        ...result.retainedCompleteBeats.slice(0, -1),
        Object.freeze({ ...selected, samples }),
      ]),
    });
    expect(summary.selectedBeat.jacobianFiniteDifferenceWidthAudit).toEqual({
      nominalScaledStep: nominal,
      acceptedStepCount: samples.length,
      nominalStepCount: samples.length - 1,
      alternateStepCount: 1,
      histogram: [
        {
          absoluteScaledStep: nominal / 2,
          count: 1,
          classification: "alternate",
        },
        {
          absoluteScaledStep: nominal,
          count: samples.length - 1,
          classification: "nominal",
        },
      ],
    });
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
      scope: "current-dt-period1-only",
      timeStepRobustnessEstablished: false,
      reason: "eligible-current-dt-period1-only",
    });
  });

  it("requires a retained complete beat", () => {
    expect(() => summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...result,
      retainedCompleteBeats: [],
    })).toThrow("no retained complete beat");
  });
});
