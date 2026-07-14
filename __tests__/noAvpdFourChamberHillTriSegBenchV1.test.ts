import { describe, expect, it } from "vitest";

import { runNoAvpdFourChamberHillTriSegBenchV1 } from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1,
  initialNoAvpdFourChamberHillTriSegStateV1,
  totalBloodVolumeMl,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpdFourChamberHillTriSegBenchV1", () => {
  it("leaves cycle convergence unassessed before two complete beats", () => {
    const result = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: 1,
      dtSec: 0.005,
      sampleEverySteps: 1,
    });

    expect(result.status).toBe("pass");
    expect(result.statusScope).toBe("structural-numerical-only");
    expect(result.runProtocol.timeStepRefinementPerformed).toBe(false);
    expect(result.runProtocol.limitCycleIsHardGate).toBe(false);
    expect(result.runProtocol.physiologyIsHardGate).toBe(false);
    expect(result.parameterSnapshot.cycleLengthSec).toBe(1);
    expect(result.beatsCompleted).toBe(1);
    expect(result.reportOnlyCycleConvergence).toBeNull();
    const exactReturnMap = result.reportOnlyExactBeatBoundaryReturnMap;
    expect(exactReturnMap.evidenceStatus).toBe(
      "report-only-not-an-acceptance-gate",
    );
    expect(exactReturnMap.availability).toBe(
      "available-exact-integer-step-boundaries",
    );
    expect(exactReturnMap.stepsPerCycle).toBe(200);
    expect(exactReturnMap.totalBoundaryCountCaptured).toBe(2);
    expect(exactReturnMap.oneBeatMapResidual).not.toBeNull();
    expect(exactReturnMap.twoBeatMapResidual).toBeNull();
    expect(exactReturnMap.thresholdsApplied).toBe(false);
    expect(exactReturnMap.periodClassification).toBe("not-performed");
    expect(
      exactReturnMap.oneBeatMapResidual?.normalizedFullStateDrift
        .componentCount,
    ).toBe(46);
    expect(
      exactReturnMap.oneBeatMapResidual?.rawDriftByNativeUnit
        .wallThinFilamentAvailability01,
    ).toEqual({ componentCount: 0, maxAbs: 0, rms: 0 });

    const sample =
      result.lastBeatSamples[Math.floor(result.lastBeatSamples.length / 2)];
    expect(sample).toBeDefined();
    expect(sample.freeCalciumUm.lvFreeWall).toBeGreaterThanOrEqual(0);
    expect(sample.caTroponin01.lvFreeWall).toBeGreaterThanOrEqual(0);
    expect(sample.caTroponin01.lvFreeWall).toBeLessThanOrEqual(1);
    expect(sample.thinFilamentAvailability01.lvFreeWall).toBeCloseTo(
      sample.activations01.lvFreeWall,
      12,
    );
    expect(sample.wallReadback.lvFreeWall.freeCalciumUm).toBeCloseTo(
      sample.freeCalciumUm.lvFreeWall,
      12,
    );
    expect(sample.wallReadback.lvFreeWall.caTroponin01).toBeCloseTo(
      sample.caTroponin01.lvFreeWall,
      12,
    );

    const morphology = result.reportOnlyLvpMorphology;
    expect(morphology).not.toBeNull();
    expect(morphology?.evidenceStatus).toBe(
      "report-only-not-an-acceptance-gate",
    );
    expect(morphology?.sampleTreatment).toBe(
      "raw-last-beat-samples-no-smoothing",
    );
    expect(morphology?.peakMmHg).toBeGreaterThan(
      morphology?.baselineMinimumMmHg ?? Infinity,
    );
    expect(morphology?.width50Sec).toBeGreaterThan(0);
    expect(morphology?.width80Sec).toBeGreaterThan(0);
    expect(morphology?.width90Sec).toBeGreaterThan(0);
    expect(morphology?.width80Sec ?? Infinity).toBeLessThanOrEqual(
      (morphology?.width50Sec ?? 0) + 1e-12,
    );
    expect(morphology?.width90Sec ?? Infinity).toBeLessThanOrEqual(
      (morphology?.width80Sec ?? 0) + 1e-12,
    );
    expect(morphology?.width90ToWidth50).toBeCloseTo(
      (morphology?.width90Sec ?? Number.NaN) /
        (morphology?.width50Sec ?? Number.NaN),
      12,
    );

    const timing = result.reportOnlyLvActivationTiming;
    expect(timing).not.toBeNull();
    expect(timing?.peakOffsetConvention).toBe(
      "signed-shortest-phase-difference",
    );
    expect(timing?.offsetInterpretation).toBe(
      "peak-phase-offset-not-causal-propagation-delay",
    );
    for (const phase of [
      timing?.freeCalciumPeakPhase01,
      timing?.caTroponinPeakPhase01,
      timing?.thinFilamentAvailabilityPeakPhase01,
      timing?.seriesTensionPeakPhase01,
      timing?.lvPressurePeakPhase01,
    ]) {
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(1);
    }
    for (const delaySec of [
      timing?.calciumToCaTroponinPeakOffsetSec,
      timing?.caTroponinToThinFilamentPeakOffsetSec,
      timing?.thinFilamentToSeriesTensionPeakOffsetSec,
      timing?.seriesTensionToLvPressurePeakOffsetSec,
      timing?.calciumToLvPressurePeakOffsetSec,
    ]) {
      expect(Math.abs(delaySec ?? Infinity)).toBeLessThanOrEqual(0.4 + 1e-12);
    }
    expect(result.reportOnlyPhysiology.evidenceStatus).toBe(
      "fixed-phase-window-proxies-not-acceptance-gates",
    );
    const events = result.reportOnlyEventResolvedDiagnostics;
    expect(events.evidenceStatus).toBe(
      "report-only-operational-events-not-acceptance-gates",
    );
    expect(events.availability).toBe(
      "unavailable-complete-two-cycle-window-not-retained",
    );
    expect(events.sampleTreatment).toBe(
      "two-consecutive-observed-cycles-every-accepted-step-raw-no-smoothing-no-decimation",
    );
    expect(events.physiologyThresholdsApplied).toBe(false);
    expect(events.changesStructuralStatus).toBe(false);
    expect(events.left).toBeNull();
  });

  it("reports phase-matched eight-compartment drift without changing status", () => {
    const result = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: 3,
      dtSec: 0.005,
      sampleEverySteps: 1,
    });

    expect(result.status, result.failureReason ?? undefined).toBe("pass");
    const convergence = result.reportOnlyCycleConvergence;
    expect(convergence).not.toBeNull();
    expect(convergence?.previousBeatIndex).toBe(1);
    expect(convergence?.currentBeatIndex).toBe(2);
    expect(
      Object.keys(convergence?.compartmentVolumeDriftMl ?? {}),
    ).toHaveLength(8);
    expect(
      Math.abs(convergence?.comparedPhaseOffsetSec ?? Number.NaN),
    ).toBeLessThanOrEqual(0.005 + 1e-12);

    const expectedMax = Math.max(
      ...Object.values(convergence?.compartmentVolumeDriftMl ?? {}).map(
        Math.abs,
      ),
    );
    expect(convergence?.maxAbsCompartmentVolumeDriftMl).toBeCloseTo(
      expectedMax,
      12,
    );
    expect(
      Object.keys(convergence?.dynamicStateDrift.calciumDrivers ?? {}),
    ).toHaveLength(5);
    expect(
      Object.keys(convergence?.dynamicStateDrift.walls ?? {}),
    ).toHaveLength(5);

    const expectedFlowMax = Math.max(
      ...Object.values(convergence?.dynamicStateDrift.flowsMlPerSec ?? {}).map(
        Math.abs,
      ),
    );
    expect(convergence?.maxAbsFlowStateDriftMlPerSec).toBeCloseTo(
      expectedFlowMax,
      12,
    );
    const expectedCaDriverMax = Math.max(
      ...Object.values(
        convergence?.dynamicStateDrift.calciumDrivers ?? {},
      ).flatMap((driver) => [
        Math.abs(driver.riseState01),
        Math.abs(driver.decayState01),
      ]),
    );
    expect(convergence?.maxAbsCalciumDriverStateDrift01).toBeCloseTo(
      expectedCaDriverMax,
      12,
    );

    const previous = result.samples.find(
      (sample) => sample.timeSec === convergence?.previousSampleTimeSec,
    );
    const current = result.samples.find(
      (sample) => sample.timeSec === convergence?.currentSampleTimeSec,
    );
    expect(previous).toBeDefined();
    expect(current).toBeDefined();
    expect(convergence?.compartmentVolumeDriftMl.leftAtriumMl).toBeCloseTo(
      (current?.volumesMl.leftAtriumMl ?? Number.NaN) -
        (previous?.volumesMl.leftAtriumMl ?? Number.NaN),
      12,
    );
    expect(
      convergence?.dynamicStateDrift.walls.leftFreeWall.caTroponin01,
    ).toBeCloseTo(
      (current?.acceptedDynamicState.walls.leftFreeWall.caTroponin01 ??
        Number.NaN) -
        (previous?.acceptedDynamicState.walls.leftFreeWall.caTroponin01 ??
          Number.NaN),
      12,
    );
    expect(convergence?.maxAbsWallThinFilamentAvailabilityDrift01).toBe(0);

    const exactReturnMap = result.reportOnlyExactBeatBoundaryReturnMap;
    expect(exactReturnMap.availability).toBe(
      "available-exact-integer-step-boundaries",
    );
    expect(exactReturnMap.totalBoundaryCountCaptured).toBe(4);
    expect(exactReturnMap.retainedBoundaryCount).toBe(3);
    expect(exactReturnMap.lastBoundaryRunBeatIndex).toBe(3);
    expect(exactReturnMap.oneBeatMapResidual?.earlierRunBeatIndex).toBe(2);
    expect(exactReturnMap.oneBeatMapResidual?.laterRunBeatIndex).toBe(3);
    expect(exactReturnMap.twoBeatMapResidual?.earlierRunBeatIndex).toBe(1);
    expect(exactReturnMap.twoBeatMapResidual?.laterRunBeatIndex).toBe(3);
    expect(
      exactReturnMap.oneBeatMapResidual?.phaseAlignmentErrorSec,
    ).toBeLessThan(1e-12);
    expect(
      exactReturnMap.twoBeatMapResidual?.phaseAlignmentErrorSec,
    ).toBeLessThan(1e-12);
    const rawGroups = Object.values(
      exactReturnMap.oneBeatMapResidual?.rawDriftByNativeUnit ?? {},
    );
    expect(
      rawGroups.reduce((sum, group) => sum + group.componentCount, 0),
    ).toBe(46);
    expect(
      rawGroups.every(
        (group) =>
          Number.isFinite(group.maxAbs) &&
          group.maxAbs >= 0 &&
          Number.isFinite(group.rms) &&
          group.rms >= 0,
      ),
    ).toBe(true);
    expect(
      exactReturnMap.oneBeatMapResidual?.normalizedFullStateDrift
        .maxAbsDimensionless,
    ).toBeGreaterThanOrEqual(0);
    expect(
      exactReturnMap.oneBeatMapResidual?.normalizedFullStateDrift
        .rmsDimensionless,
    ).toBeGreaterThanOrEqual(0);

    const events = result.reportOnlyEventResolvedDiagnostics;
    expect(events.availability).toBe("available-complete-raw-two-cycle-window");
    expect(events.rawWindowSampleCount).toBe(401);
    expect(events.observedCycleCount).toBe(2);
    expect(events.eventAnchorBeatIndex).toBe(1);
    expect(events.left?.prescribedCalciumReleaseOnset.phase01).toBeCloseTo(
      0.788,
      12,
    );
    expect(events.left?.valveTransitions.modelHalfOpen.opening).not.toBeNull();
    expect(events.left?.valveTransitions.modelHalfOpen.closure).not.toBeNull();
    expect(events.left?.inflowEvents.ePeak).not.toBeNull();
    expect(events.left?.inflowEvents.aPeak).not.toBeNull();
    expect(events.left?.pressureVolumeEvents.xTrough).not.toBeNull();
    expect(events.left?.pressureVolumeEvents.vPeak).not.toBeNull();
    expect(events.left?.pressureVolumeEvents.yTrough).not.toBeNull();
  });

  it("does not synthesize exact return-map boundaries for a noninteger step ratio", () => {
    const result = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: 1,
      dtSec: 0.0049,
      sampleEverySteps: 8,
    });

    expect(result.status, result.failureReason ?? undefined).toBe("pass");
    const exactReturnMap = result.reportOnlyExactBeatBoundaryReturnMap;
    expect(exactReturnMap.availability).toBe(
      "unavailable-cycle-length-not-integer-multiple-of-dt",
    );
    expect(exactReturnMap.stepsPerCycle).toBeNull();
    expect(exactReturnMap.totalBoundaryCountCaptured).toBe(0);
    expect(exactReturnMap.retainedBoundaryCount).toBe(0);
    expect(exactReturnMap.oneBeatMapResidual).toBeNull();
    expect(exactReturnMap.twoBeatMapResidual).toBeNull();
    expect(exactReturnMap.periodClassification).toBe("not-performed");
  });

  it("resumes an exact cycle-boundary checkpoint with explicit provenance", () => {
    const initialState = initialNoAvpdFourChamberHillTriSegStateV1(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
    );
    const provenance = {
      resumeMode: "exact-same-parameter-checkpoint" as const,
      sourceArtifactId: "unit-test-cycle-boundary",
      sourceNormalizedSha256: "test-normalized-sha256",
      sourceParameterSha256: "test-parameter-sha256",
      sourceImplementationSha256: "test-implementation-sha256",
      sourceModelId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1,
      sourceEquationsVersionId:
        NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1,
      sourceStateLayoutId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1,
      sourceRhythmTopologyId:
        NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1,
      sourceCycleLengthSec:
        DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.cycleLengthSec,
      sourceDtSec: 0.005,
      sourceTotalBloodVolumeMl: totalBloodVolumeMl(initialState.volumes),
      periodClassification: "unclassified" as const,
    };
    const resumed = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: 1,
      dtSec: 0.005,
      sampleEverySteps: 4,
      initialState,
      warmStartProvenance: provenance,
      sampleRetention: "last-two-complete-beats",
    });
    const fullNewtonParams = {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      solver: {
        ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.solver,
        jacobianReuse: {
          ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.solver
            .jacobianReuse,
          maxAcceptedSteps: 0,
        },
      },
    };
    const direct = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: 1,
      dtSec: 0.005,
      sampleEverySteps: 4,
      sampleRetention: "last-two-complete-beats",
      params: fullNewtonParams,
    });

    expect(resumed.status, resumed.failureReason ?? undefined).toBe("pass");
    expect(resumed.beatsCompleted).toBe(1);
    expect(resumed.runProtocol.initialization.mode).toBe("warm-resume");
    expect(
      resumed.runProtocol.initialization.warmStartIsAcceptanceEvidence,
    ).toBe(false);
    expect(resumed.runProtocol.initialization.provenance).toEqual(provenance);
    expect(
      maxNumericDifference(resumed.finalState, direct.finalState),
    ).toBeLessThan(2e-5);
    expect(resumed.solverWork.totalGlobalResidualEvaluations).toBeLessThan(
      direct.solverWork.totalGlobalResidualEvaluations,
    );
    expect(resumed.hardDiagnostics.maxAbsTotalBloodVolumeDriftMl).toBeLessThan(
      1e-8,
    );

    expect(() =>
      runNoAvpdFourChamberHillTriSegBenchV1({
        beats: 1,
        dtSec: 0.005,
        sampleEverySteps: 4,
        initialState,
        warmStartProvenance: {
          ...provenance,
          sourceCycleLengthSec: 0.8,
        },
      }),
    ).toThrow(/cycle length is incompatible/);
  });
});

function maxNumericDifference(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number")
    return Math.abs(left - right);
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return Number.POSITIVE_INFINITY;
    return Math.max(
      0,
      ...left.map((value, index) => maxNumericDifference(value, right[index])),
    );
  }
  if (
    left != null &&
    right != null &&
    typeof left === "object" &&
    typeof right === "object"
  ) {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const keys = Object.keys(leftRecord);
    if (keys.length !== Object.keys(rightRecord).length)
      return Number.POSITIVE_INFINITY;
    return Math.max(
      0,
      ...keys.map((key) =>
        key in rightRecord
          ? maxNumericDifference(leftRecord[key], rightRecord[key])
          : Number.POSITIVE_INFINITY,
      ),
    );
  }
  return Object.is(left, right) ? 0 : Number.POSITIVE_INFINITY;
}
