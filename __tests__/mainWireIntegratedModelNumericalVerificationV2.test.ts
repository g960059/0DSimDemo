import { describe, expect, it } from "vitest";

import {
  HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
} from "@/engine/devices/defaultsV1";
import type { RotarySupportDeviceIdV1 } from "@/engine/devices/typesV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V2,
  createMainWireIntegratedHeartMateIiLvadOnlyVerificationProfileV2,
  runMainWireIntegratedModelNumericalVerificationV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

const NON_LVAD_DEVICE_IDS = Object.freeze([
  "IMPELLA",
  "VA_ECMO",
  "VV_ECMO",
] as const satisfies readonly RotarySupportDeviceIdV1[]);

describe("integrated model V2 real-provider numerical verification", () => {
  it("reports finite event-aware dt-halving, conservation, dynamic-q, and pump-loop evidence without release claims", () => {
    const result = runMainWireIntegratedModelNumericalVerificationV2();

    expect(result.claim).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V2,
    );
    expect(result.claim.evidenceRole).toEqual([
      "construction-verification",
      "literature-transcription-verification",
      "bounded-dt-halving-numerical-verification",
      "exploratory-non-shape-fit-waveform-description",
    ]);
    expect(result.claim.canonicalWholeHeartProviderExercised).toBe(true);
    expect(result.claim.coronaryV3Exercised).toBe(true);
    expect(result.claim.generatedRhythmOwnerExercised).toBe(true);
    expect(result.claim.dynamicMcsAcceptedQExercised).toBe(true);
    expect(result.claim.waveformOrParameterFittingApplied).toBe(false);
    expect(result.claim.periodicSteadyStateClaimed).toBe(false);
    expect(result.claim.convergenceOrderClaimed).toBe(false);
    expect(result.claim.physiologicalAcceptanceClaimed).toBe(false);
    expect(result.claim.independentValidationClaimed).toBe(false);
    expect(result.claim.clinicalValidationClaimed).toBe(false);
    expect(result.claim.releaseAcceptanceClaimed).toBe(false);
    expect(result.claim.releaseReadyClaimed).toBe(false);
    expect(result.claim.heartMateIiInertanceProfileReleaseApproved).toBe(false);
    expect(result.claim.heartMateIiProfileCopiedToOtherDeviceClasses)
      .toBe(false);
    expect(result.claim.otherDeviceInertanceTransferClaimed).toBe(false);

    expect(result.protocol.cycleLengthSec).toBe(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec,
    );
    expect(result.protocol.heartRateBpm).toBe(
      60 / FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec,
    );
    expect(result.protocol.scheduler).toContain("coronary-window-first");

    const profile =
      createMainWireIntegratedHeartMateIiLvadOnlyVerificationProfileV2();
    expect(profile.profileId).toContain("not-release-approved");
    expect(profile.inertanceByDevice.LVAD).toEqual(
      HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
    );
    for (const deviceId of NON_LVAD_DEVICE_IDS) {
      expect(profile.deviceProfileBindingByDevice[deviceId].circuitProfileId)
        .toContain("zero-inertance-not-a-device-profile");
      expect(totalInertance(profile.inertanceByDevice[deviceId])).toBe(0);
      expect(profile.inertanceByDevice[deviceId]).not.toEqual(
        HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
      );
    }
    expect(result.heartMateIiLvadOnlyTranscription).toMatchObject({
      profileReleaseApproved: false,
      lvadEnabled: true,
      lvadSpeedRpm: 9_000,
      pumpInternalInertanceMmHgSec2PerMl: 0.02177,
      drainageInertanceMmHgSec2PerMl: 0.0127,
      returnPathInertanceMmHgSec2PerMl: 0.0127,
      nonLvadDeviceInertancesAreZero: true,
      inertanceCopiedToOtherDeviceClasses: false,
    });
    expect(
      result.heartMateIiLvadOnlyTranscription
        .totalCircuitInertanceMmHgSec2PerMl,
    ).toBeCloseTo(0.04717, 14);

    const expectedActivationTimesSec = [
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular
        .electricalToCalciumDelaySec,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec
        - FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1
          .atrioventricularDelaySec
        + FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial
          .electricalToCalciumDelaySec,
    ];
    for (const run of [result.coarse, result.fine]) {
      expect(run.completed).toBe(true);
      expect(run.acceptedStepCount).toBeLessThanOrEqual(
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V2
          .maximumAcceptedStepCountPerRun,
      );
      expect(run.acceptedClock.integratedTimeSec).toBe(
        result.protocol.cycleLengthSec,
      );
      expect(run.acceptedClock.maximumOwnerClockSkewSec).toBeLessThanOrEqual(
        result.protocol.invariantTolerance.acceptedOwnerClockSkewSec,
      );
      expect(run.acceptedClock.allOwnerRevisionsMatch).toBe(true);
      expect(run.invariant.acceptedEndTimeMatchesRhythmDerivedCycle).toBe(true);
      expect(run.invariant.maximumGlobalTotalBloodVolumeErrorMl)
        .toBeLessThanOrEqual(
          result.protocol.invariantTolerance.globalTotalBloodVolumeErrorMl,
        );
      expect(run.invariant.maximumCoronaryBloodVolumeLedgerResidualMl)
        .toBeLessThanOrEqual(
          result.protocol.invariantTolerance
            .coronaryBloodVolumeLedgerResidualMl,
        );
      expect(run.invariant.maximumDynamicMcsConservationResidualMlPerSec)
        .toBeLessThanOrEqual(
          result.protocol.invariantTolerance
            .dynamicMcsConservationResidualMlPerSec,
        );
      expect(run.invariant.coronaryAutoregulationWindowIndex).toBe(1);
      expect(run.invariant.coronaryAutoregulationWindowIsEmptyAtCycleEnd)
        .toBe(true);
      expect(run.invariant.allWithinTolerance).toBe(true);

      expect(run.rhythm.sourceMode).toBe("regular-sinus");
      expect(run.rhythm.sourcePeriodSec).toBe(result.protocol.cycleLengthSec);
      expect(run.rhythm.acceptedEventIds).toHaveLength(2);
      expect(run.rhythm.acceptedActivationTimesSec).toEqual(
        expectedActivationTimesSec,
      );
      expect(run.rhythm.acceptedEventTargetIds).toEqual([
        ["LVFW", "RVFW", "SEP"],
        ["LA", "RA"],
      ]);
      expect(run.scheduler.effectiveEventBoundaryStepCount).toBe(2);
      expect(run.scheduler.coronaryWindowCompletionCount).toBe(1);

      expect(run.waveform.sampleCount).toBe(run.acceptedStepCount);
      expect(run.waveform.allSamplesFinite).toBe(true);
      for (const extrema of Object.values(run.waveform.extremaBySignal)) {
        expect(Number.isFinite(extrema.minimum)).toBe(true);
        expect(Number.isFinite(extrema.maximum)).toBe(true);
        expect(Number.isFinite(extrema.range)).toBe(true);
        expect(Number.isFinite(extrema.maximumAbsoluteValue)).toBe(true);
        expect(extrema.range).toBeGreaterThanOrEqual(0);
      }
      expect(Object.values(run.signal).every(Number.isFinite)).toBe(true);
      expect(Object.values(run.comparisonValues).every(Number.isFinite))
        .toBe(true);
      expect(run.waveform.lvadPressureFlow.nonzeroFlowSampleCount)
        .toBeGreaterThan(0);
      expect(run.waveform.lvadPressureFlow.maximumAbsoluteFlowMlPerSec)
        .toBeGreaterThan(1e-6);
      expect(run.waveform.lvadPressureFlow.flowRangeMlPerSec)
        .toBeGreaterThan(1e-6);
      expect(run.waveform.lvadPressureFlow.pressureRiseRangeMmHg)
        .toBeGreaterThan(1e-6);
      expect(run.waveform.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec)
        .toBeGreaterThan(1e-6);
      expect(Object.values(
        run.waveform.lvadPressureFlow.constraintOwnerSampleCount,
      ).reduce((sum, count) => sum + count, 0)).toBe(
        run.waveform.sampleCount,
      );
      expect(run.waveform.lvadPressureFlow.limiterOwnedSampleCount)
        .toBeGreaterThanOrEqual(0);
      expect(run.waveform.lvadPressureFlow.periodicEndpointClosureClaimed)
        .toBe(false);
      expect(run.waveform.lvadPressureFlow
        .eligibleForNumericalOrPhysiologicalShapeGate).toBe(false);
      expect(run.waveform.lvadPressureFlow.interpretation)
        .toContain("exploratory-only");
      expect(Math.abs(run.signal.meanLvadFlowMlPerSec)).toBeGreaterThan(1e-6);
      expect(Math.abs(run.signal.terminalLvadFlowMlPerSec))
        .toBeGreaterThan(1e-6);
    }

    expect(result.eventIdentityAndTimingMatchAcrossDt).toBe(true);
    expect(result.crossDt).toHaveLength(
      Object.keys(result.protocol.comparisonMetric).length,
    );
    for (const comparison of result.crossDt) {
      expect(comparison.allValuesFinite).toBe(true);
      expect(comparison.absoluteDelta).toBe(
        Math.abs(comparison.coarseValue - comparison.fineValue),
      );
      expect(comparison.normalizedDelta).toBe(
        comparison.absoluteDelta / comparison.normalizationScale,
      );
      expect(comparison.withinTolerance).toBe(true);
    }
    expect(result.crossDtSummary.allDifferencesFinite).toBe(true);
    expect(Number.isFinite(result.crossDtSummary.maximumAbsoluteDelta))
      .toBe(true);
    expect(Number.isFinite(result.crossDtSummary.maximumNormalizedDelta))
      .toBe(true);
    expect(result.crossDtSummary.allWithinPredeclaredNumericalTolerance)
      .toBe(true);
    expect(result.exploratoryPressureFlowLoopComparison.allValuesFinite)
      .toBe(true);
    expect(result.exploratoryPressureFlowLoopComparison.symmetricRelativeDelta)
      .toBeGreaterThanOrEqual(0);
    expect(result.exploratoryPressureFlowLoopComparison
      .eligibleForNumericalOrPhysiologicalShapeGate).toBe(false);
    expect(result.exploratoryPressureFlowLoopComparison.assessment)
      .toBe("not-assessed-cold-start-nonperiodic-descriptor");
    expect(result.allNumericalChecksPassed).toBe(true);
  }, 60_000);
});

function totalInertance(inertance: Readonly<{
  pumpInternalMmHgSec2PerMl: number;
  drainageMmHgSec2PerMl: number;
  oxygenatorMmHgSec2PerMl: number;
  returnPathMmHgSec2PerMl: number;
}>): number {
  return inertance.pumpInternalMmHgSec2PerMl
    + inertance.drainageMmHgSec2PerMl
    + inertance.oxygenatorMmHgSec2PerMl
    + inertance.returnPathMmHgSec2PerMl;
}
