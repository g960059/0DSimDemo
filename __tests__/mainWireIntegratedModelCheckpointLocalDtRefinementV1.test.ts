import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_CLAIM_V1,
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_V1_ID,
  runMainWireIntegratedModelCheckpointLocalDtRefinementV1,
  runMainWireIntegratedModelPeriodicSteadyV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";

describe("MainWire integrated V2 exact-checkpoint local dt refinement V1", () => {
  it("starts both grids from one exact boundary and keeps local numerical evidence separate from periodic physiology", async () => {
    const source = await runMainWireIntegratedModelPeriodicSteadyV2({
      nominalDtSec: 0.002,
      maximumCycleCount: 1,
      executionPurpose: "fixed-horizon-characterization",
    });
    const result =
      await runMainWireIntegratedModelCheckpointLocalDtRefinementV1({
        checkpoint: source.terminalCheckpoint,
      });

    expect(result.experimentId).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_V1_ID,
    );
    expect(result.claim).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_LOCAL_DT_REFINEMENT_CLAIM_V1,
    );
    expect(result.initialCheckpoint.acceptedTimeSec).toBe(1);
    expect(result.initialCheckpoint.zeroBasedCycleIndex).toBe(1);
    expect(result.initialCheckpoint.checkpointSha256).toBe(
      source.terminalCheckpoint.checkpointSha256,
    );
    expect(result.coarse.nominalDtSec).toBe(0.002);
    expect(result.fine.nominalDtSec).toBe(0.001);
    expect(result.coarse.acceptedClock.integratedTimeSec).toBe(2);
    expect(result.fine.acceptedClock.integratedTimeSec).toBe(2);
    expect(result.coarse.invariant.allWithinTolerance).toBe(true);
    expect(result.fine.invariant.allWithinTolerance).toBe(true);
    expect(result.eventIdentityAndTimingMatchAcrossDt).toBe(true);
    expect(result.bothRunsStartFromSameExactCheckpoint).toBe(true);
    expect(result.crossDtSummary.allDifferencesFinite).toBe(true);
    expect(
      result.crossDtSummary.allWithinPredeclaredNumericalTolerance,
    ).toBe(true);
    expect(result.allNumericalChecksPassed).toBe(true);
    expect(result.periodicOrbitEstablished).toBe(false);
    expect(result.physiologicalAcceptanceEstablished).toBe(false);
    expect(result.releaseAcceptanceEstablished).toBe(false);
  }, 60_000);
});
