import { beforeAll, describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COPENHAGEN_REFERENCE_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_METRIC_IDS_V1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonInputV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 matched-alpha saturating heart-rate law comparison V1", () => {
  let inputs: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonInputV1[];
  let comparison: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonV1;

  beforeAll(() => {
    inputs = Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1.map(
        (arm) => {
          const run =
            runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
              { dtSec: arm.dtSec, maximumBeatCount: 1 },
              arm.calciumProfileId,
            );
          return Object.freeze({
            arm,
            calciumProfile: run.saturatingHeartRateLawProfile,
            calciumDriveParams: run.calciumDriveParams,
            periodicResult: run.periodicResult,
            referenceNonCalciumAssembly: run.referenceNonCalciumAssembly,
            exactAssemblyAudit: run.exactAssemblyAudit,
          });
        },
      ),
    );
    comparison =
      compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1(
        inputs,
      );
  }, 120_000);

  it("audits exactly eight catalog identities and reports every requested per-arm readout", () => {
    expect(comparison.arms).toHaveLength(8);
    expect(comparison.arms.map((measured) => measured.arm.armId)).toEqual(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1.map(
        (arm) => arm.armId,
      ),
    );
    expect(
      new Set(comparison.arms.map((arm) => arm.protocolIdentityHash)),
    ).toHaveProperty("size", 8);
    expect(comparison.allReferenceNonCalciumAssemblyIdentitiesRetained).toBe(
      true,
    );
    expect(comparison.allNonCalciumExactAssemblyAuditHashesIdentical).toBe(
      true,
    );
    expect(comparison.allExactReadbacksAvailable).toBe(true);
    expect(comparison.allExactReadbackStationEquationsWithinTolerance).toBe(
      true,
    );
    expect(comparison.allArmsHaveOneDistinctAorticFlowPeak).toBe(true);

    for (const measured of comparison.arms) {
      expect(measured.selectedBeatSampleCount).toBe(2_000);
      expect(measured.completedBeatCount).toBe(1);
      expect(measured.integrationCompletedWithoutFailure).toBe(true);
      expect(measured.referenceNonCalciumAssemblyIdentityRetained).toBe(true);
      expect(measured.exactStationAuditPassed).toBe(true);
      expect(measured.exactReadbackAudit.allSelectedBeatSamplesAvailable).toBe(
        true,
      );
      expect(measured.exactReadbackAudit.availableSelectedBeatSampleCount).toBe(
        measured.selectedBeatSampleCount,
      );
      expect(
        measured.exactReadbackAudit
          .maximumAbsoluteStationAdditivityResidualMmHg,
      ).toBeLessThanOrEqual(1e-9);
      expect(
        measured.exactPressureStations
          .rawLvMinusAorticComplianceNodeGradientMmHg.timeMean,
      ).toBeCloseTo(
        measured.exactPressureStations
          .exactLvMinusProximalConstitutivePortGradientMmHg.timeMean +
          measured.exactPressureStations.characteristicImpedancePressureMmHg
            .timeMean,
        10,
      );
      expect(measured.lawMetadata).toMatchObject({
        designRole: measured.arm.designRole,
        heartRateBpm: measured.arm.heartRateBpm,
        dimensionlessRateCoefficient: measured.arm.dimensionlessRateCoefficient,
        waveformFamily: "periodic-normalized-biexponential-exact-alpha-limit",
      });
      expect(measured.lawMetadata.ventricularRiseTimeConstantSec).toBe(
        measured.lawMetadata.ventricularDecayTimeConstantSec,
      );
      expect(
        measured.reportedMetrics["stroke-volume-per-one-percent-et-ml-per-sec"],
      ).toBeCloseTo(
        measured.reportedMetrics["stroke-volume-ml"]! /
          measured.reportedMetrics[
            "flow-threshold-1-percent-ejection-time-sec"
          ]!,
        12,
      );
      expect(Object.keys(measured.reportedMetrics).sort()).toEqual(
        [
          ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_METRIC_IDS_V1,
        ].sort(),
      );
      expect(
        Object.values(measured.reportedMetrics).every(
          (value) => value === null || Number.isFinite(value),
        ),
      ).toBe(true);
    }
  });

  it("keeps the a=0.40 four-rate trend separate from both endpoint prior sensitivities", () => {
    expect(comparison.mainTrend).toMatchObject({
      designRole: "main-four-heart-rate-design",
      dimensionlessRateCoefficient: 0.4,
      heartRatesBpm: [50, 60, 75, 90],
    });
    expect(
      comparison.mainTrend.armsSortedByHeartRate.map(
        (arm) => arm.arm.heartRateBpm,
      ),
    ).toEqual([50, 60, 75, 90]);
    expect(
      comparison.mainTrend.armsSortedByHeartRate.every(
        (arm) => arm.arm.designRole === "main-four-heart-rate-design",
      ),
    ).toBe(true);
    expect(comparison.endpointPriorSensitivities).toHaveLength(2);
    expect(
      comparison.endpointPriorSensitivities.map(
        (entry) => entry.dimensionlessRateCoefficient,
      ),
    ).toEqual([0.25, 0.66]);

    const metricId = "flow-threshold-1-percent-ejection-time-sec" as const;
    const main50 = comparison.mainTrend.armsSortedByHeartRate[0]!;
    const main90 = comparison.mainTrend.armsSortedByHeartRate[3]!;
    expect(comparison.mainTrend.heartRate90Minus50[metricId]).toBeCloseTo(
      main90.reportedMetrics[metricId]! - main50.reportedMetrics[metricId]!,
      12,
    );
    expect(
      comparison.mainTrend.rangesAcrossHeartRate[metricId]!.span,
    ).toBeGreaterThanOrEqual(0);
    expect([
      "increasing",
      "decreasing",
      "constant",
      "non-monotonic",
      "indeterminate",
    ]).toContain(
      comparison.mainTrend.monotonicDirectionAcrossHeartRate[metricId],
    );

    for (const sensitivity of comparison.endpointPriorSensitivities) {
      expect(sensitivity).toMatchObject({
        designRole: "endpoint-prior-sensitivity",
        heartRatesBpm: [50, 90],
      });
      expect(sensitivity.priorArmsSortedByHeartRate).toHaveLength(2);
      expect(sensitivity.mainReferenceArmsSortedByHeartRate).toHaveLength(2);
      expect(sensitivity.perHeartRatePriorMinusMain).toHaveLength(2);
      expect(
        sensitivity.priorArmsSortedByHeartRate.every(
          (arm) =>
            arm.arm.designRole === "endpoint-prior-sensitivity" &&
            arm.arm.dimensionlessRateCoefficient ===
              sensitivity.dimensionlessRateCoefficient,
        ),
      ).toBe(true);
      expect(
        sensitivity.mainReferenceArmsSortedByHeartRate.every(
          (arm) => arm.arm.dimensionlessRateCoefficient === 0.4,
        ),
      ).toBe(true);
      expect(
        sensitivity.heartRateTrendDifferenceOfDifferences[metricId],
      ).toBeCloseTo(
        sensitivity.priorHeartRate90Minus50[metricId]! -
          sensitivity.mainHeartRate90Minus50[metricId]!,
        12,
      );
      for (const readout of sensitivity.perHeartRatePriorMinusMain) {
        const index = readout.heartRateBpm === 50 ? 0 : 1;
        expect(readout.priorMinusMain[metricId]).toBeCloseTo(
          sensitivity.priorArmsSortedByHeartRate[index]!.reportedMetrics[
            metricId
          ]! -
            sensitivity.mainReferenceArmsSortedByHeartRate[index]!
              .reportedMetrics[metricId]!,
          12,
        );
      }
    }
  });

  it("applies Copenhagen corrections only to direct event analogues and sets no adoption gate", () => {
    expect(comparison.copenhagenReference).toBe(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COPENHAGEN_REFERENCE_V1,
    );
    expect(
      comparison.analysisClaim
        .copenhagenCorrectionAppliedToDirectValveEventAnaloguesOnly,
    ).toBe(true);
    expect(comparison.analysisClaim.correctedTeiIndexConstructed).toBe(false);
    expect(comparison.analysisClaim.fittedOrAdoptionThresholdSpecified).toBe(
      false,
    );
    expect(comparison.analysisClaim.clinicalMeasurementEquivalenceClaimed).toBe(
      false,
    );

    for (const measured of comparison.arms) {
      const heartRateBpm = measured.arm.heartRateBpm;
      const readout = measured.copenhagenTimingReadout;
      const expected = [
        [readout.leftVentricularEjectionTime, 1.4, [347, 415]],
        [readout.isovolumicContractionTime, 0.15, [30, 68]],
        [readout.isovolumicRelaxationTime, 0.27, [76, 151]],
      ] as const;
      expect(readout.heartRateBpm).toBe(heartRateBpm);
      expect(readout.rawLeftVentricularTeiIndex).toBe(
        measured.cycleMetrics.leftVentricularTeiIndex,
      );
      expect(readout.correctedTeiIndexConstructed).toBe(false);
      for (const [timing, coefficient, interval] of expected) {
        expect(timing.correctionCoefficientMsPerBpm).toBe(coefficient);
        expect(timing.correctionAddedMs).toBeCloseTo(
          coefficient * heartRateBpm,
          14,
        );
        expect(timing.correctedPredictionInterval95Ms).toEqual(interval);
        expect(timing.correctedMs).toBeCloseTo(
          timing.rawMs! + coefficient * heartRateBpm,
          12,
        );
      }
    }
  });

  it("keeps one-beat structural runs outside the interpretation gate", () => {
    expect(comparison.allArmsPeriod1AndIntegrationPassed).toBe(false);
    expect(comparison.allArmsInterpretationEligible).toBe(false);
    expect(comparison.mainTrend.interpretationEligible).toBe(false);
    expect(
      comparison.endpointPriorSensitivities.every(
        (entry) => !entry.interpretationEligible,
      ),
    ).toBe(true);
    for (const measured of comparison.arms) {
      expect(measured.periodicSteadyStateClaimed).toBe(false);
      expect(measured.integrationCompletedWithoutFailure).toBe(true);
      expect(measured.period1AndIntegrationPassed).toBe(false);
      expect(measured.interpretationEligible).toBe(false);
    }
  });

  it("rejects incomplete, duplicate, altered-catalog, and altered-runner identities", () => {
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1(
        inputs.slice(0, -1),
      ),
    ).toThrow(/missing V10 matched-alpha saturating-law arm/);
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1([
        ...inputs.slice(0, -1),
        inputs[0]!,
      ]),
    ).toThrow(/duplicate V10 matched-alpha saturating-law arm/);
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1([
        Object.freeze({
          ...inputs[0]!,
          arm: Object.freeze({
            ...inputs[0]!.arm,
            dtSec: inputs[0]!.arm.dtSec * 2,
          }),
        }),
        ...inputs.slice(1),
      ]),
    ).toThrow(/arm catalog identity mismatch/);
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1([
        Object.freeze({
          ...inputs[0]!,
          calciumProfile: inputs[1]!.calciumProfile,
        }),
        ...inputs.slice(1),
      ]),
    ).toThrow(/calcium profile identity mismatch/);
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1([
        Object.freeze({
          ...inputs[0]!,
          calciumDriveParams: inputs[1]!.calciumDriveParams,
        }),
        ...inputs.slice(1),
      ]),
    ).toThrow(/calcium parameter identity mismatch/);
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1([
        Object.freeze({
          ...inputs[0]!,
          referenceNonCalciumAssembly: Object.freeze({
            ...inputs[0]!.referenceNonCalciumAssembly,
          }),
        }) as never,
        ...inputs.slice(1),
      ]),
    ).toThrow(/reference non-calcium assembly identity mismatch/);
    expect(() =>
      compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1([
        Object.freeze({
          ...inputs[0]!,
          exactAssemblyAudit: Object.freeze({
            ...inputs[0]!.exactAssemblyAudit,
            calciumDriveFixedParamsStableHash: "altered",
          }),
        }),
        ...inputs.slice(1),
      ]),
    ).toThrow(/exact assembly audit identity mismatch/);
  });
});
