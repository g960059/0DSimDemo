import { beforeAll, describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_FLOW_ET_PEAK_FRACTIONS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESIS_COMPARISON_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_OBSERVATION_GEOMETRY_V1,
  type MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1,
  type MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1,
  type MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 heart-rate calcium hypothesis comparison V1", () => {
  let inputs: readonly MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1[];
  let comparison: MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonV1;

  beforeAll(() => {
    inputs = Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1.map((arm) => {
        const run =
          runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1(
            { dtSec: arm.dtSec, maximumBeatCount: 1 },
            arm.calciumProfileId,
          );
        return Object.freeze({
          arm,
          calciumProfile: run.calciumHypothesisProfile,
          calciumDriveParams: run.calciumDriveParams,
          periodicResult: run.periodicResult,
        });
      }),
    );
    comparison =
      compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1(inputs);
  }, 120_000);

  it("measures all fixed arms without treating a one-beat transient as steady", () => {
    expect(comparison.arms).toHaveLength(8);
    expect(comparison.hypothesisTrends).toHaveLength(2);
    expect(comparison.allArmsInterpretationEligible).toBe(false);
    expect(
      comparison.hypothesisTrends.every(
        (trend) => trend.interpretationEligible === false,
      ),
    ).toBe(true);
    expect(comparison.allExactReadbacksAvailable).toBe(true);
    expect(comparison.allExactReadbackStationEquationsWithinTolerance).toBe(
      true,
    );
    expect(
      new Set(comparison.arms.map((arm) => arm.protocolIdentityHash)).size,
    ).toBe(8);
    expect(comparison.observationGeometry).toBe(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_OBSERVATION_GEOMETRY_V1,
    );
    expect(comparison.analysisClaim).toBe(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESIS_COMPARISON_CLAIM_V1,
    );

    for (const measured of comparison.arms) {
      const source = inputs.find(
        (input) => input.arm.armId === measured.arm.armId,
      )!;
      const selectedBeat = source.periodicResult.retainedCompleteBeats.at(-1)!;
      const aorticFlows = selectedBeat.samples.map(
        (sample) => sample.valveHydraulics.AoV.flowMlPerSec,
      );
      expect(measured.periodicSteadyStateClaimed).toBe(false);
      expect(measured.integrationCompletedWithoutFailure).toBe(true);
      expect(measured.completedBeatCount).toBe(1);
      expect(measured.completedPhysicalTimeSec).toBeCloseTo(
        measured.arm.cycleLengthSec,
        12,
      );
      expect(measured.selectedBeatSampleCount).toBe(2_000);
      expect(
        measured.flowThresholdEjectionTimes.map(
          (entry) => entry.peakFraction01,
        ),
      ).toEqual(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_FLOW_ET_PEAK_FRACTIONS_V1,
      );
      const [et0p1, et1, et5] = measured.flowThresholdEjectionTimes.map(
        (entry) => entry.interpolatedEjectionTimeSec,
      );
      expect(et0p1).toBeGreaterThanOrEqual(et1!);
      expect(et1).toBeGreaterThanOrEqual(et5!);
      expect(et5).toBeGreaterThan(0);
      expect(et0p1).toBeLessThan(measured.arm.cycleLengthSec);
      for (const thresholdEt of measured.flowThresholdEjectionTimes) {
        expectMeasuredCyclicEpisodeToMatchThreshold(
          aorticFlows,
          thresholdEt.thresholdMlPerSec,
          thresholdEt,
          thresholdEt.interpolatedEjectionTimeSec,
          source.periodicResult.dtSec,
        );
      }
      expect(
        measured.exactLocalGradientPositiveDuration
          .interpolatedPositiveDurationSec,
      ).toBeGreaterThan(0);
      expect(
        measured.exactLocalGradientPositiveDuration
          .interpolatedPositiveDurationSec,
      ).toBeLessThan(measured.arm.cycleLengthSec);
      expectMeasuredCyclicEpisodeToMatchThreshold(
        selectedBeat.samples.map(
          (sample) =>
            sample.valveHydraulics.AoV.recoveredRootPortExactReadback!
              .localValvePressureGradientMmHg,
        ),
        0,
        measured.exactLocalGradientPositiveDuration,
        measured.exactLocalGradientPositiveDuration
          .interpolatedPositiveDurationSec,
        source.periodicResult.dtSec,
      );
      expect(measured.exactReadbackAudit.availableSelectedBeatSampleCount).toBe(
        measured.exactReadbackAudit.requiredSelectedBeatSampleCount,
      );
      expect(measured.exactReadbackAudit.stationEquationsWithinTolerance).toBe(
        true,
      );
      expect(
        measured.pressureStations.positiveForwardFlowSampleCount,
      ).toBeGreaterThan(0);
      expect(
        measured.pressureStations.rawLvMinusAorticComplianceNodeGradientMmHg
          .timeMean,
      ).toBeCloseTo(
        measured.pressureStations
          .exactLvMinusProximalConstitutivePortGradientMmHg.timeMean +
          measured.pressureStations.characteristicImpedancePressureMmHg
            .timeMean,
        10,
      );
      expect(
        measured.observationStations.geometry.lvotCrossSectionalAreaCm2,
      ).toBeCloseTo(Math.PI * 1.15 ** 2, 14);
      expect(
        measured.observationStations.geometry
          .ascendingAorticCrossSectionalAreaCm2,
      ).toBeCloseTo(Math.PI * 1.5 ** 2, 14);
    }
  });

  it("sorts each hypothesis by HR and owns reproducible HR50-to-90 deltas", () => {
    for (const trend of comparison.hypothesisTrends) {
      expect(trend.heartRatesBpm).toEqual([50, 60, 75, 90]);
      expect(
        trend.armsSortedByHeartRate.map((arm) => arm.arm.heartRateBpm),
      ).toEqual([50, 60, 75, 90]);
      const low = trend.armsSortedByHeartRate[0]!;
      const high = trend.armsSortedByHeartRate.at(-1)!;
      expect(trend.heartRate50To90Delta["stroke-volume-ml"]).toBeCloseTo(
        high.cycleMetrics.aorticForwardVolumeMl -
          low.cycleMetrics.aorticForwardVolumeMl,
        12,
      );
      const range =
        trend.rangesAcrossHeartRate["flow-threshold-1-percent-et-sec"];
      expect(range).not.toBeNull();
      expect(range!.maximum).toBeGreaterThanOrEqual(range!.minimum);
      expect(range!.span).toBeCloseTo(range!.maximum - range!.minimum, 14);
    }
  });

  it("rejects duplicate, missing, profile, calcium, and phase identities", () => {
    expect(() =>
      compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1([
        ...inputs.slice(0, -1),
        inputs[0]!,
      ]),
    ).toThrow(/duplicate V10 HR calcium arm/);
    expect(() =>
      compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1(
        inputs.slice(0, -1),
      ),
    ).toThrow(/missing V10 HR calcium arm/);

    const profileMismatch = replaceInput(inputs, 0, {
      ...inputs[0]!,
      calciumProfile: inputs[1]!.calciumProfile,
    });
    expect(() =>
      compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1(
        profileMismatch,
      ),
    ).toThrow(/calcium profile identity mismatch/);

    const calciumMismatch = replaceInput(inputs, 0, {
      ...inputs[0]!,
      calciumDriveParams: Object.freeze({
        ...inputs[0]!.calciumDriveParams,
        cycleLengthSec: inputs[0]!.calciumDriveParams.cycleLengthSec + 0.01,
      }),
    });
    expect(() =>
      compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1(
        calciumMismatch,
      ),
    ).toThrow(/calcium parameter cycle mismatch/);

    const phaseMismatch = replaceInput(inputs, 0, {
      ...inputs[0]!,
      periodicResult: withFirstSelectedSamplePhaseOffset(
        inputs[0]!.periodicResult,
        0.1,
      ),
    });
    expect(() =>
      compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1(
        phaseMismatch,
      ),
    ).toThrow(/cycle phase mismatch/);

    const absentExactPort = replaceInput(inputs, 0, {
      ...inputs[0]!,
      periodicResult: withoutFirstSelectedSampleExactPort(
        inputs[0]!.periodicResult,
      ),
    });
    expect(() =>
      compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1(
        absentExactPort,
      ),
    ).toThrow(/exact proximal-port readback missing/);
  });
});

function expectMeasuredCyclicEpisodeToMatchThreshold(
  values: readonly number[],
  threshold: number,
  measurement: Readonly<{
    primaryEpisodeActiveSampleCount: number;
    extraActiveSampleCountOutsidePrimaryEpisode: number;
    primaryOpeningSampleIndex: number;
    primaryClosingSampleIndex: number;
  }>,
  measuredDurationSec: number,
  dtSec: number,
): void {
  const sampleCount = values.length;
  expect(measurement.primaryEpisodeActiveSampleCount).toBe(
    cyclicInclusiveSampleCount(
      measurement.primaryOpeningSampleIndex,
      measurement.primaryClosingSampleIndex,
      sampleCount,
    ),
  );
  for (
    let offset = 0;
    offset < measurement.primaryEpisodeActiveSampleCount;
    offset += 1
  ) {
    expect(
      values[(measurement.primaryOpeningSampleIndex + offset) % sampleCount],
    ).toBeGreaterThan(threshold);
  }
  expect(
    values[
      (measurement.primaryOpeningSampleIndex - 1 + sampleCount) % sampleCount
    ],
  ).toBeLessThanOrEqual(threshold);
  expect(
    values[(measurement.primaryClosingSampleIndex + 1) % sampleCount],
  ).toBeLessThanOrEqual(threshold);
  expect(
    measurement.primaryEpisodeActiveSampleCount +
      measurement.extraActiveSampleCountOutsidePrimaryEpisode,
  ).toBe(values.filter((value) => value > threshold).length);
  const previous =
    values[
      (measurement.primaryOpeningSampleIndex - 1 + sampleCount) % sampleCount
    ]! - threshold;
  const first = values[measurement.primaryOpeningSampleIndex]! - threshold;
  const last = values[measurement.primaryClosingSampleIndex]! - threshold;
  const next =
    values[(measurement.primaryClosingSampleIndex + 1) % sampleCount]! -
    threshold;
  const openingFraction = -previous / (first - previous);
  const closingFraction = last / (last - next);
  expect(measuredDurationSec).toBeCloseTo(
    (measurement.primaryEpisodeActiveSampleCount +
      closingFraction -
      openingFraction) *
      dtSec,
    14,
  );
}

function cyclicInclusiveSampleCount(
  openingIndex: number,
  closingIndex: number,
  sampleCount: number,
): number {
  return ((closingIndex - openingIndex + sampleCount) % sampleCount) + 1;
}

function replaceInput(
  inputs: readonly MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1[],
  index: number,
  replacement: MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1,
): readonly MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1[] {
  return Object.freeze(
    inputs.map((input, candidateIndex) =>
      candidateIndex === index ? Object.freeze(replacement) : input,
    ),
  );
}

function withFirstSelectedSamplePhaseOffset(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  offset01: number,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const selectedBeatIndex = result.retainedCompleteBeats.length - 1;
  const selectedBeat = result.retainedCompleteBeats[selectedBeatIndex]!;
  const firstSample = selectedBeat.samples[0]!;
  const changedBeat = Object.freeze({
    ...selectedBeat,
    samples: Object.freeze([
      Object.freeze({
        ...firstSample,
        cyclePhase01: (firstSample.cyclePhase01 + offset01) % 1,
      }),
      ...selectedBeat.samples.slice(1),
    ]),
  });
  return Object.freeze({
    ...result,
    retainedCompleteBeats: Object.freeze(
      result.retainedCompleteBeats.map((beat, index) =>
        index === selectedBeatIndex ? changedBeat : beat,
      ),
    ),
  });
}

function withoutFirstSelectedSampleExactPort(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const selectedBeatIndex = result.retainedCompleteBeats.length - 1;
  const selectedBeat = result.retainedCompleteBeats[selectedBeatIndex]!;
  const firstSample = selectedBeat.samples[0]!;
  const {
    recoveredRootPortExactReadback: omittedExactReadback,
    ...aorticValveWithoutExactReadback
  } = firstSample.valveHydraulics.AoV;
  void omittedExactReadback;
  const changedBeat = Object.freeze({
    ...selectedBeat,
    samples: Object.freeze([
      Object.freeze({
        ...firstSample,
        valveHydraulics: Object.freeze({
          ...firstSample.valveHydraulics,
          AoV: Object.freeze(aorticValveWithoutExactReadback),
        }),
      }),
      ...selectedBeat.samples.slice(1),
    ]),
  });
  return Object.freeze({
    ...result,
    retainedCompleteBeats: Object.freeze(
      result.retainedCompleteBeats.map((beat, index) =>
        index === selectedBeatIndex ? changedBeat : beat,
      ),
    ),
  });
}
