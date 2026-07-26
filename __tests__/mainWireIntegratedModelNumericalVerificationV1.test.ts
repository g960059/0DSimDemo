import { describe, expect, it } from "vitest";

import {
  HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
} from "@/engine/devices/defaultsV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V1,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1,
  createMainWireIntegratedHeartMateIiVerificationProfileV1,
  runMainWireIntegratedModelNumericalVerificationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV1";

describe("integrated model V1 canonical-provider numerical verification", () => {
  it("preserves accepted invariants and bounded cross-dt agreement for one active-HMII sinus cycle", () => {
    const result = runMainWireIntegratedModelNumericalVerificationV1();

    expect(result.claim).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V1,
    );
    expect(result.claim.evidenceRole).toEqual([
      "construction-verification",
      "literature-transcription-verification",
      "bounded-dt-halving-numerical-verification",
    ]);
    expect(result.claim.waveformOrParameterFittingApplied).toBe(false);
    expect(result.claim.periodicSteadyStateClaimed).toBe(false);
    expect(result.claim.convergenceOrderClaimed).toBe(false);
    expect(result.claim.physiologicalAcceptanceClaimed).toBe(false);
    expect(result.claim.independentValidationClaimed).toBe(false);
    expect(result.claim.clinicalValidationClaimed).toBe(false);
    expect(result.claim.releaseAcceptanceClaimed).toBe(false);
    expect(result.claim.heartMateIiInertanceProfileReleaseApproved).toBe(false);

    const profile = createMainWireIntegratedHeartMateIiVerificationProfileV1();
    expect(profile.profileId).toContain("not-release-approved");
    expect(profile.inertanceByDevice.LVAD).toEqual(
      HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
    );
    expect(result.heartMateIiTranscription).toMatchObject({
      profileReleaseApproved: false,
      lvadEnabled: true,
      lvadSpeedRpm: 9_000,
      pumpInternalInertanceMmHgSec2PerMl: 0.02177,
      drainageInertanceMmHgSec2PerMl: 0.0127,
      returnPathInertanceMmHgSec2PerMl: 0.0127,
    });
    expect(
      result.heartMateIiTranscription.totalCircuitInertanceMmHgSec2PerMl,
    ).toBeCloseTo(0.04717, 14);

    for (const run of [result.coarse, result.fine]) {
      expect(run.completed).toBe(true);
      expect(run.acceptedStepCount).toBeLessThanOrEqual(
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1
          .maximumAcceptedStepCountPerRun,
      );
      expect(run.acceptedClock.integratedTimeSec).toBe(
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.cycleLengthSec,
      );
      expect(run.acceptedClock.maximumOwnerClockSkewSec).toBeLessThanOrEqual(
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.invariantTolerance
          .acceptedOwnerClockSkewSec,
      );
      expect(run.acceptedClock.allOwnerRevisionsMatch).toBe(true);
      expect(run.invariant.acceptedEndTimeMatchesProtocol).toBe(true);
      expect(run.rhythm.scheduledEventIds).toEqual([
        "periodic-sinus:p0:ventricles",
        "periodic-sinus:p1:atria",
      ]);
      expect(run.rhythm.scheduledActivationTimesSec).toEqual([0.012, 0.852]);
      expect(run.rhythm.acceptedEventIds).toEqual(run.rhythm.scheduledEventIds);
      expect(run.rhythm.acceptedActivationTimesSec).toEqual(
        run.rhythm.scheduledActivationTimesSec,
      );
      expect(run.rhythm.terminalCursor).toBe(run.rhythm.scheduledEventCount);
      expect(run.rhythm.terminalCursorMatchesSchedule).toBe(true);
      expect(run.rhythm.acceptedEventSequenceMatchesSchedule).toBe(true);
      expect(run.invariant.maximumGlobalTotalBloodVolumeErrorMl)
        .toBeLessThanOrEqual(
          MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.invariantTolerance
            .globalTotalBloodVolumeErrorMl,
        );
      expect(run.invariant.maximumCoronaryBloodVolumeLedgerResidualMl)
        .toBeLessThanOrEqual(
          MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.invariantTolerance
            .coronaryBloodVolumeLedgerResidualMl,
        );
      expect(run.invariant.maximumDynamicMcsConservationResidualMlPerSec)
        .toBeLessThanOrEqual(
          MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.invariantTolerance
            .dynamicMcsConservationResidualMlPerSec,
        );
      expect(run.invariant.coronaryAutoregulationWindowIndex).toBe(1);
      expect(run.invariant.coronaryAutoregulationWindowIsEmptyAtCycleEnd)
        .toBe(true);
      expect(run.invariant.allWithinTolerance).toBe(true);
      expect(Object.values(run.signal).every(Number.isFinite)).toBe(true);
      expect(Math.abs(run.signal.meanLvadFlowMlPerSec)).toBeGreaterThan(1e-6);
      expect(Math.abs(run.signal.terminalLvadFlowMlPerSec)).toBeGreaterThan(1e-6);
    }

    expect(result.eventIdentityAndCursorMatchAcrossDt).toBe(true);
    expect(result.crossDt).toHaveLength(
      Object.keys(
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.comparisonMetric,
      ).length,
    );
    for (const comparison of result.crossDt) {
      expect(Number.isFinite(comparison.coarseValue)).toBe(true);
      expect(Number.isFinite(comparison.fineValue)).toBe(true);
      expect(comparison.normalizedDelta).toBe(
        comparison.absoluteDelta / comparison.normalizationScale,
      );
      expect(comparison.withinTolerance).toBe(true);
      expect(comparison.normalizedDelta).toBeLessThanOrEqual(
        comparison.numericalToleranceNormalized,
      );
    }
    expect(result.allNumericalChecksPassed).toBe(true);
  }, 55_000);
});
