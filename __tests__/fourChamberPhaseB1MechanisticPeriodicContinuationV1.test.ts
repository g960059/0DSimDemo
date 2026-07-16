import { describe, expect, it } from "vitest";
import {
  PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1,
  computeLeftRightCardiacOutputMismatchFractionV1,
  initializePhaseB1MechanisticPeriodicContinuationV1,
  recordPhaseB1MechanisticPeriodicContinuationCycleV1,
  type PhaseB1MechanisticPeriodicContinuationStateV1,
  type PhaseB1MechanisticPeriodicCycleReadbackV1,
} from "@/tools/myocardium/phaseB1MechanisticPeriodicContinuationV1";

describe("Phase B1 mechanistic repeated-cycle periodic continuation", () => {
  it("discards five complete warm-up beats and requires three later passing beats", () => {
    let state = initializePhaseB1MechanisticPeriodicContinuationV1(12);
    for (let cycleIndex = 0; cycleIndex < 5; cycleIndex += 1) {
      const recorded = record(state, passingReadback(cycleIndex));
      state = recorded.state;
      expect(recorded.checkpoint.convergenceGateEligibleThisCycle).toBe(false);
      expect(recorded.checkpoint.consecutivePassingCycleCount).toBe(0);
      expect(recorded.checkpoint.repeatedCycleFixedPointConvergencePass)
        .toBe(false);
    }

    const firstEligible = record(state, passingReadback(5));
    state = firstEligible.state;
    expect(firstEligible.checkpoint.warmupComplete).toBe(true);
    expect(firstEligible.checkpoint.convergenceGateEligibleThisCycle).toBe(true);
    expect(firstEligible.checkpoint.consecutivePassingCycleCount).toBe(1);
    expect(firstEligible.state.terminalStatus).toBe("running");

    const secondEligible = record(state, passingReadback(6));
    state = secondEligible.state;
    expect(secondEligible.checkpoint.consecutivePassingCycleCount).toBe(2);
    expect(secondEligible.state.terminalStatus).toBe("running");

    const converged = record(state, passingReadback(7));
    expect(converged.checkpoint.consecutivePassingCycleCount).toBe(3);
    expect(converged.state.repeatedCycleFixedPointConvergencePass).toBe(true);
    expect(converged.state.terminalStatus)
      .toBe("converged-repeated-cycle-fixed-point");
  });

  it("resets the streak when either complete state or left-right output fails", () => {
    let state = afterWarmup(12);
    state = record(state, passingReadback(5)).state;
    expect(state.consecutivePassingCycleCount).toBe(1);

    const stateFailure = record(state, passingReadback(6, {
      maximumNormalizedEndpointDistance: 2e-6,
    }));
    state = stateFailure.state;
    expect(stateFailure.checkpoint.completeStateEndpointDistancePass).toBe(false);
    expect(state.consecutivePassingCycleCount).toBe(0);

    state = record(state, passingReadback(7)).state;
    const outputFailure = record(state, passingReadback(8, {
      leftCardiacOutputLPerMin: 5,
      rightCardiacOutputLPerMin: 6,
    }));
    expect(outputFailure.checkpoint.leftRightCardiacOutputMismatchPass)
      .toBe(false);
    expect(outputFailure.state.consecutivePassingCycleCount).toBe(0);
    expect(outputFailure.state.terminalStatus).toBe("running");
  });

  it("uses strict endpoint and output inequalities", () => {
    let state = afterWarmup(8);
    const endpointBoundary = record(state, passingReadback(5, {
      maximumNormalizedEndpointDistance:
        PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
          .completeStateEndpointDistanceTolerance,
    }));
    expect(endpointBoundary.checkpoint.completeStateEndpointDistancePass)
      .toBe(false);

    state = endpointBoundary.state;
    const outputBoundary = record(state, passingReadback(6, {
      leftCardiacOutputLPerMin: 5,
      rightCardiacOutputLPerMin: 5 * 2.05 / 1.95,
    }));
    expect(outputBoundary.checkpoint.leftRightCardiacOutputMismatchFraction)
      .toBeCloseTo(0.05, 14);
    expect(outputBoundary.checkpoint.leftRightCardiacOutputMismatchPass)
      .toBe(false);
  });

  it("requires the all-edge flow, ledger, and streak-window gates", () => {
    let state = afterWarmup(14);
    state = record(state, passingReadback(5)).state;
    state = record(state, passingReadback(6)).state;

    const streakFailure = record(state, passingReadback(7, {
      streakWindowNormalizedEndpointDistance: 1.1e-6,
    }));
    expect(streakFailure.checkpoint.streakWindowEndpointDistancePass)
      .toBe(false);
    expect(streakFailure.state.consecutivePassingCycleCount).toBe(0);

    state = record(streakFailure.state, passingReadback(8)).state;
    const edgeFailure = record(state, passingReadback(9, {
      maximumAllEdgeSignedMeanFlowMismatchFraction: 0.051,
    }));
    expect(edgeFailure.checkpoint.allEdgeSignedMeanFlowMismatchPass).toBe(false);
    expect(edgeFailure.state.consecutivePassingCycleCount).toBe(0);

    const ledgerFailure = record(edgeFailure.state, passingReadback(10, {
      structuralAndNumericalIntervalLedgerGatesPass: false,
    }));
    expect(ledgerFailure.checkpoint.cycleLocalConvergencePass).toBe(false);
  });

  it("fails closed when the maximum beat count is exhausted", () => {
    let state = initializePhaseB1MechanisticPeriodicContinuationV1(3);
    for (let cycleIndex = 0; cycleIndex < 3; cycleIndex += 1) {
      state = record(state, passingReadback(cycleIndex)).state;
    }
    expect(state.terminalStatus)
      .toBe("maximum-cycles-exhausted-without-convergence");
    expect(state.repeatedCycleFixedPointConvergencePass).toBe(false);
    expect(state.lastCheckpoint?.maximumCycleExhaustionMeansConvergence)
      .toBe(false);
    expect(() => record(state, passingReadback(3)))
      .toThrow(/not live and consistent/);
  });

  it("defines left-right output mismatch symmetrically and fails zero output closed", () => {
    expect(computeLeftRightCardiacOutputMismatchFractionV1(6, 6 * 1.95 / 2.05))
      .toBeCloseTo(0.05, 14);
    expect(computeLeftRightCardiacOutputMismatchFractionV1(6 * 1.95 / 2.05, 6))
      .toBeCloseTo(0.05, 14);
    expect(computeLeftRightCardiacOutputMismatchFractionV1(0, 0))
      .toBe(1);
  });
});

function afterWarmup(
  maximumCycleCount: number,
): PhaseB1MechanisticPeriodicContinuationStateV1 {
  let state = initializePhaseB1MechanisticPeriodicContinuationV1(
    maximumCycleCount,
  );
  for (let cycleIndex = 0; cycleIndex < 5; cycleIndex += 1) {
    state = record(state, passingReadback(cycleIndex)).state;
  }
  return state;
}

function record(
  state: PhaseB1MechanisticPeriodicContinuationStateV1,
  readback: PhaseB1MechanisticPeriodicCycleReadbackV1,
) {
  return recordPhaseB1MechanisticPeriodicContinuationCycleV1({
    state,
    readback,
  });
}

function passingReadback(
  cycleIndex: number,
  overrides: Partial<PhaseB1MechanisticPeriodicCycleReadbackV1> = {},
): PhaseB1MechanisticPeriodicCycleReadbackV1 {
  return Object.freeze({
    cycleIndex,
    maximumNormalizedEndpointDistance: 5e-7,
    streakWindowNormalizedEndpointDistance: 8e-7,
    leftCardiacOutputLPerMin: 5.5,
    rightCardiacOutputLPerMin: 5.4,
    leftVentricularEndDiastolicVolumeMl: 145,
    leftVentricularEndSystolicVolumeMl: 55,
    systemicArterialMinimumPressureMmHg: 75,
    systemicArterialMaximumPressureMmHg: 120,
    systemicArterialMeanPressureMmHg: 90,
    maximumAllEdgeSignedMeanFlowMismatchFraction: 0.02,
    everyEdgeSignedMeanFlowForward: true,
    committedIntervalTotalBloodVolumeConservationGatePass: true,
    structuralAndNumericalIntervalLedgerGatesPass: true,
    ...overrides,
  });
}
