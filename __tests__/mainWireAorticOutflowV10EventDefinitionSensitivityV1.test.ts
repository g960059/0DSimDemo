import { describe, expect, it } from "vitest";

import { measureMainWireAorticOutflowV10EventDefinitionSensitivityV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10EventDefinitionSensitivityV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE } from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import { runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 event-definition sensitivity V1", () => {
  it("separates flow, exact local-pressure, and central-volume timing semantics", () => {
    const run =
      runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
        { dtSec: 0.02, maximumBeatCount: 2 },
        CANDIDATE.kuwProfileId,
        CANDIDATE.complianceProfileId,
        CANDIDATE.characteristicResistancePlacementProfileId,
        CANDIDATE.rootInertanceProfileId,
        CANDIDATE.sarcomereReferenceProfileId,
        CANDIDATE.calciumSensitivityLengthProfileId,
        CANDIDATE.twitchRetentionCandidateId,
        "baseline",
        "baseline",
        CANDIDATE.trefForceLoadProfileId,
        CANDIDATE.sourceVelocityDistortionProfileId,
        CANDIDATE.strongBridgeDeactivationExitProfileId,
        CANDIDATE.atrioventricularDelayProfileId,
        CANDIDATE.pressureRecoveryProfileId,
        CANDIDATE.recoveredRootPortValveProfileId,
      );
    const measured =
      measureMainWireAorticOutflowV10EventDefinitionSensitivityV1(run);

    expect(measured).toMatchObject({
      experimentId:
        "main-wire-aortic-outflow-v10-event-definition-sensitivity-v1",
      candidateId: CANDIDATE.candidateId,
      selectedBeat: {
        sampleCount: 50,
        dtSec: 0.02,
        cycleLengthSec: 1,
        precedingAcceptedSampleAvailable: true,
        backwardEulerCellCount: 50,
        periodicSteadyStateClaimed: false,
        integrationCompletedWithoutFailure: true,
      },
      exactLocalPortReadbackAudit: {
        availableSelectedBeatSampleCount: 50,
        requiredSelectedBeatSampleCount: 50,
        allSelectedBeatSamplesAvailable: true,
        precedingAcceptedSampleReadbackAvailable: true,
      },
    });
    expect(measured.interpretationEligible).toBe(false);
    expect(measured.flowDefinitions).toHaveLength(7);
    expect(
      measured.flowDefinitions.map((definition) => definition.definitionId),
    ).toEqual([
      "strict-positive-flow",
      "peak-fraction-0p1-percent",
      "peak-fraction-0p5-percent",
      "peak-fraction-1-percent-no-floor",
      "peak-fraction-2-percent",
      "peak-fraction-5-percent",
      "legacy-1-percent-plus-1-mL-per-sec-floor",
    ]);
    for (const definition of measured.flowDefinitions) {
      expect(definition.strictGreaterThanThreshold).toBe(true);
      expect(definition.episode.primaryContainsGlobalPositiveFlowPeak).toBe(
        true,
      );
      expect(
        definition.episode.extraActiveSampleCountOutsidePrimaryEpisode,
      ).toBe(0);
      expect(definition.timing.durationSec).toBeGreaterThan(0);
      expect(definition.timing.mvcStartEndMvoCyclicOrderSatisfied).toBe(true);
      expect(
        Math.abs(definition.timing.intervalIdentityResidualSec),
      ).toBeLessThan(1e-12);
      expect(definition.timing.teiLike).toBeCloseTo(
        (definition.timing.mvcToStartSec + definition.timing.endToMvoSec) /
          definition.timing.durationSec,
        12,
      );
    }
    const strict = measured.flowDefinitions[0]!;
    const fivePercent = measured.flowDefinitions[5]!;
    expect(strict.thresholdMlPerSec).toBe(0);
    expect(fivePercent.thresholdMlPerSec).toBeCloseTo(
      0.05 * measured.positiveAorticPeakFlowMlPerSec,
      12,
    );
    expect(fivePercent.timing.durationSec).toBeLessThanOrEqual(
      strict.timing.durationSec,
    );
    const nestedThresholdDurations = measured.flowDefinitions
      .slice(0, 6)
      .map((definition) => definition.timing.durationSec);
    expect(nestedThresholdDurations.every((duration, index) =>
      index === 0 || duration <= nestedThresholdDurations[index - 1]!))
      .toBe(true);

    const samples = run.periodicResult.retainedCompleteBeats.at(-1)!.samples;
    for (const definition of measured.flowDefinitions) {
      for (const boundary of [
        definition.timing.startBoundary,
        definition.timing.endBoundary,
      ]) {
        expect(boundary.cyclePhase01).toBeCloseTo(
          boundary.cycleOffsetFromSelectedBeatStartSec /
            measured.selectedBeat.cycleLengthSec,
          12,
        );
      }
    }

    const pressure = measured.exactLocalPortPressureCrossing;
    expect(pressure.smoothingApplied).toBe(false);
    expect(pressure.timingSemantics).toBe(
      "local-gradient-boundary-timing-surrogate-not-valve-event",
    );
    expect(pressure.timing.startBoundary.boundaryMethod).toBe(
      "linear-zero-crossing-between-accepted-endpoints",
    );
    expect(pressure.timing.endBoundary.boundaryMethod).toBe(
      "linear-zero-crossing-between-accepted-endpoints",
    );
    expect(
      pressure.timing.startBoundary
        .interpolationFractionFromPreviousToCurrent01,
    ).toBeGreaterThanOrEqual(0);
    expect(
      pressure.timing.startBoundary
        .interpolationFractionFromPreviousToCurrent01,
    ).toBeLessThanOrEqual(1);
    expect(
      pressure.timing.endBoundary.interpolationFractionFromPreviousToCurrent01,
    ).toBeGreaterThanOrEqual(0);
    expect(
      pressure.timing.endBoundary.interpolationFractionFromPreviousToCurrent01,
    ).toBeLessThanOrEqual(1);
    expect(pressure.timing.mvcStartEndMvoCyclicOrderSatisfied).toBe(true);
    expect(Math.abs(pressure.timing.intervalIdentityResidualSec)).toBeLessThan(
      1e-12,
    );
    for (const boundary of [
      pressure.timing.startBoundary,
      pressure.timing.endBoundary,
    ]) {
      const currentGradient = samples[boundary.currentAcceptedSampleIndex]!
        .valveHydraulics.AoV.recoveredRootPortExactReadback!
        .localValvePressureGradientMmHg;
      const previousGradient = boundary.previousAcceptedSampleIndex === null
        ? run.periodicResult.retainedCompleteBeats.at(-2)!.samples.at(-1)!
          .valveHydraulics.AoV.recoveredRootPortExactReadback!
          .localValvePressureGradientMmHg
        : samples[boundary.previousAcceptedSampleIndex]!.valveHydraulics.AoV
          .recoveredRootPortExactReadback!.localValvePressureGradientMmHg;
      const reconstructedGradient = previousGradient
        + boundary.interpolationFractionFromPreviousToCurrent01
          * (currentGradient - previousGradient);
      expect(Math.abs(reconstructedGradient)).toBeLessThan(1e-12);
      expect(boundary.cyclePhase01).toBeCloseTo(
        boundary.cycleOffsetFromSelectedBeatStartSec /
          measured.selectedBeat.cycleLengthSec,
        12,
      );
    }

    expect(measured.forwardVolumeWindows).toHaveLength(2);
    const [wide, narrow] = measured.forwardVolumeWindows;
    expect(wide!.centralForwardVolumeFraction01).toBeCloseTo(0.95, 12);
    expect(narrow!.centralForwardVolumeFraction01).toBeCloseTo(0.9, 12);
    expect(narrow!.centralForwardVolumeWindowDurationSec).toBeLessThan(
      wide!.centralForwardVolumeWindowDurationSec,
    );
    for (const window of measured.forwardVolumeWindows) {
      expect(window.startBoundary.boundaryMethod).toBe(
        "backward-Euler-endpoint-cell-volume-quantile",
      );
      expect(window.endBoundary.boundaryMethod).toBe(
        "backward-Euler-endpoint-cell-volume-quantile",
      );
      expect(window.mvcToStartSec).toBeNull();
      expect(window.endToMvoSec).toBeNull();
      expect(window.teiLike).toBeNull();
      expect(window.intervalIdentityResidualSec).toBeNull();
      expect(window.chronologicalWithinSelectedBeatWithoutWrap).toBe(true);
      expect(window.valveEventTimingUnavailableReason).toBe(
        "central-forward-volume-window-boundaries-are-not-valve-events",
      );
      expect(
        Math.abs(window.centralForwardVolumeIdentityResidualMl),
      ).toBeLessThan(1e-12);
      const incrementsMl = samples.map((sample) =>
        Math.max(sample.flowMlPerSec.AoV, 0) * measured.selectedBeat.dtSec);
      const cumulativeAt = (
        boundary: typeof window.startBoundary,
      ) => incrementsMl.slice(0, boundary.currentAcceptedSampleIndex).reduce(
        (sum, incrementMl) => sum + incrementMl,
        0,
      ) + boundary.interpolationFractionFromPreviousToCurrent01
        * incrementsMl[boundary.currentAcceptedSampleIndex]!;
      expect(cumulativeAt(window.startBoundary)).toBeCloseTo(
        window.lowerQuantile01 * window.totalForwardVolumeMl,
        12,
      );
      expect(cumulativeAt(window.endBoundary)).toBeCloseTo(
        window.upperQuantile01 * window.totalForwardVolumeMl,
        12,
      );
    }

    const references = measured.currentReferences;
    expect(references.currentValveEventReference.source).toBe(
      "existing-cycle-diagnostics",
    );
    expect(references.currentProxyReference.source).toBe(
      "main-wire-valve-disease-cycle-metrics-v1",
    );
    expect(references.audit).toMatchObject({
      legacyOpeningSampleIndexMatchesCurrentValveEvent: true,
      legacyClosingSampleIndexMatchesCurrentValveEvent: true,
      currentProxyEpisodeCountMatchesCurrentValveEvent: true,
      currentProxyPrimaryOpeningMatchesCurrentValveEvent: true,
      currentProxyPrimaryClosingMatchesCurrentValveEvent: true,
      legacyExactlyReproducesCurrentValveEvent: true,
    });
    expect(
      Math.abs(
        references.audit.legacyEjectionTimeResidualVersusCurrentValveEventSec,
      ),
    ).toBeLessThan(1e-12);
    expect(
      Math.abs(
        references.currentProxyReference
          .reconstructedAllActiveSampleDurationResidualSec,
      ),
    ).toBeLessThan(1e-12);
    expect(
      Math.abs(
        references.currentProxyReference
          .backwardEulerForwardVolumeResidualVersusWindowTotalMl,
      ),
    ).toBeLessThan(1e-12);
    expect(measured.experimentClaim.volumeWindowsAreValveEvents).toBe(false);
    expect(measured.analysisClaim.volumeWindowIctIvrtOrTeiComputed).toBe(false);
  });
});
