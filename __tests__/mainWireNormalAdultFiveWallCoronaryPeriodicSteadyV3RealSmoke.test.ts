import { describe, expect, it } from "vitest";

import { runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3 } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3";

describe("canonical coronary V3 real-provider bounded smoke", () => {
  it("advances one physical sinus cycle with accepted autoregulation", async () => {
    const result =
      await runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3({
        dtSec: 0.002,
        maximumBeatCount: 1,
        executionPurpose: "bounded-smoke",
      });

    expect(result.failure).toBeNull();
    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.completedBeatCount).toBe(1);
    expect(result.attemptedStepCount).toBe(500);
    expect(result.committedStepCount).toBe(500);
    expect(result.completedAutoregulationWindowCount).toBe(1);
    expect(result.terminalState.acceptedTimeSec).toBeCloseTo(1, 13);
    expect(result.terminalState.revision).toBe(500);
    expect(result.terminalState.coronaryAutoregulation).toMatchObject({
      windowIndex: 1,
      acceptedDurationSec: 0,
      acceptedStepCount: 0,
      windowControl: null,
    });
    expect(result.periodicSteadyStateClaimed).toBe(false);
    expect(result.independentValidationClaimed).toBe(false);
  }, 30_000);
});
