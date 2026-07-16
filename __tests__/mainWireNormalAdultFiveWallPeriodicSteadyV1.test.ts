import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire normal-adult five-wall periodic steady runner V1", () => {
  it("runs one canonical coarse beat without overstating periodic closure", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
      initialization: "canonical",
    });

    expect(result.terminationReason).toBe("maximum-beats-reached");
    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.periodicSteadyStateClaimed).toBe(false);
    expect(result.period2OrbitSuspected).toBe(false);
    expect(result.periodicity.status).toBe("not-converged");
    expect(result.completedBeatCount).toBe(1);
    expect(result.beatClosure).toHaveLength(1);
    expect(result.beatClosure[0]!.period1).not.toBeNull();
    expect(result.beatClosure[0]!.period2).toBeNull();
    expect(result.beatClosure[0]!.period1!.elapsedTimeSec).toBeCloseTo(1, 12);
    expect(result.retainedCompleteBeats).toHaveLength(1);
    expect(result.retainedCompleteBeats[0]!.beatIndex).toBe(1);
    expect(result.retainedCompleteBeats[0]!.samples).toHaveLength(100);
    expect(result.retainedCompleteBeats[0]!.samples[0]!.diagnosticSampleId)
      .toBe("main-wire-normal-adult-five-wall-diagnostic-sample-v2");
    expect(result.retainedPartialBeat).toHaveLength(0);
    expect(result.initializationAudit.totalBloodVolumeDifferenceMl).toBe(0);
    expect(result.initializationAudit.transferredVolumeMl).toBe(0);
    expect(result.claim.ordinaryBeatIterationOnly).toBe(true);
    expect(result.claim.shootingOrAndersonAccelerationApplied).toBe(false);
    expect(result.claim.parameterSearch).toBe(false);
    expect(result.policy.retainedCompleteBeatCount).toBe(3);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
      .period1NormalizedTolerance).toBe(1e-3);
  }, 60_000);

  it("keeps the fixed PVen-to-PVein basin audit exactly TBV-neutral", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
      initialization: "pven-to-pvein-10ml",
    });

    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.initializationAudit).toMatchObject({
      totalBloodVolumeDifferenceMl: 0,
      chamberVolumesChanged: false,
      dynamicEdgeFlowsChanged: false,
      valveOpeningStatesChanged: false,
      mechanicsColdInputChanged: false,
      mechanicsColdStateFingerprintChanged: false,
      transferredVolumeMl: 10,
      sourceNode: "PVen",
      destinationNode: "PVein",
      pulmonaryNodeVolumeDeltaMl: {
        PVen: -10,
        PVein: 10,
      },
    });
    expect(result.claim.initializationVariantChangesRuntimeOrMaterialParameters)
      .toBe(false);
    expect(result.claim.pulmonaryRedistributionIsInitialConditionBasinAuditOnly)
      .toBe(true);
    expect(result.claim.samePeriodicOrbitAcrossInitializationsClaimed).toBe(false);
    expect(result.periodicSteadyStateClaimed).toBe(false);
  }, 60_000);

  it("rejects a non-integral HR60 beat grid before running the model", () => {
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.003,
      maximumBeatCount: 1,
    })).toThrow("dtSec must divide the fixed HR60 one-second cycle exactly");
  });
});
