import { beforeAll, describe, expect, it } from "vitest";

import {
  checkpointMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_CLAIM_V3,
  qualifyMainWireIntegratedModelSnapshotV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelSnapshotQualificationV3";
import {
  classifyMainWireIntegratedModelPeriodicityV3,
  type MainWireIntegratedModelPeriodicClassificationV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import {
  compareMainWireIntegratedModelAcceptedStatesV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

type AcceptedState = MainWireIntegratedModelAcceptedStateV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

type SettledCandidate = Readonly<{
  terminalAcceptedState: AcceptedState;
  classification: MainWireIntegratedModelPeriodicClassificationV3;
}>;

describe("MainWireIntegratedModel candidate snapshot qualification V3", () => {
  let settled: SettledCandidate;

  beforeAll(async () => {
    settled = await createSettledCandidateWithHostYields(0.01, 250);
    expect(settled.classification.status).toBe("period1-converged");
  }, 120_000);

  it("rejects a bad candidate digest and a valid cold candidate that reaches the cap without P1", async () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const context =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      );
    const coldCheckpoint = await checkpointMainWireIntegratedModelV3(
      context,
      fixture.cold.acceptedState,
    );
    const tampered = {
      ...structuredClone(coldCheckpoint),
      checkpointSha256:
        `${coldCheckpoint.checkpointSha256[0] === "0" ? "1" : "0"}` +
        coldCheckpoint.checkpointSha256.slice(1),
    };

    const badDigest = await qualifyMainWireIntegratedModelSnapshotV3({
      candidateCheckpoint: tampered,
      nominalDtSec: 0.01,
      maximumCycleCount: 1,
    });
    expect(badDigest).toMatchObject({
      status: "rejected",
      accepted: false,
      reason: "candidate-checkpoint-rejected",
      failureStage: "candidate-restore",
      completedCycleCount: 0,
      terminalCheckpoint: null,
      snapshotQualificationEstablished: false,
    });
    expect(badDigest.message).toMatch(/SHA-256 mismatch/);

    const capped = await qualifyMainWireIntegratedModelSnapshotV3({
      candidateCheckpoint: coldCheckpoint,
      nominalDtSec: 0.01,
      maximumCycleCount: 1,
    });
    expect(capped).toMatchObject({
      status: "rejected",
      accepted: false,
      reason: "maximum-cycles-reached",
      failureStage: null,
      candidateAcceptedRevision: 0,
      candidateAcceptedTimeSec: 0,
      candidateCheckpointExactRoundTripVerified: true,
      completedCycleCount: 1,
      terminalCheckpoint: null,
      terminalCheckpointExactRoundTripVerified: true,
      snapshotQualificationEstablished: false,
    });
    expect(capped.classification?.status).toBe("not-converged");
    expect(capped.cycles[0]).toMatchObject({
      startTimeSec: 0,
      endTimeSec: 1,
      completedWindowIndex: 0,
      finiteConservationAndExactRegularSinusEventsPassed: true,
    });
  });

  it("continues an off-boundary settled candidate and accepts only after three canonical P1 observations plus exact terminal round-trip", async () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const candidateTimeSec = settled.terminalAcceptedState.acceptedTimeSec + 0.25;
    const offBoundary = advanceToAcceptedTime(
      fixture,
      settled.terminalAcceptedState,
      candidateTimeSec,
      0.01,
    );
    const candidateCheckpoint = await checkpointMainWireIntegratedModelV3(
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      ),
      offBoundary,
    );

    const result = await qualifyMainWireIntegratedModelSnapshotV3({
      candidateCheckpoint,
      nominalDtSec: 0.01,
      maximumCycleCount: 3,
    });

    expect(result).toMatchObject({
      status: "accepted",
      accepted: true,
      reason: "period1-converged",
      failureStage: null,
      candidateAcceptedRevision: offBoundary.revision,
      candidateAcceptedTimeSec: candidateTimeSec,
      candidateCheckpointExactRoundTripVerified: true,
      completedCycleCount: 3,
      terminalCheckpointExactRoundTripVerified: true,
      snapshotQualificationEstablished: true,
      physiologicalAcceptanceEstablished: false,
      clinicalValidationClaimed: false,
      alignment: {
        alignmentRequired: true,
        sourceAcceptedTimeSec: candidateTimeSec,
        boundaryAcceptedTimeSec:
          settled.terminalAcceptedState.acceptedTimeSec + 1,
        completedWindowIndex:
          settled.terminalAcceptedState.coronary.coronaryAutoregulation
            .windowIndex,
        finiteCalciumOwnershipAllOffAndConservationPassed: true,
      },
    });
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.classification).toMatchObject({
      status: "period1-converged",
      evidenceCycleIndices: [1, 2, 3],
    });
    expect(result.observations).toHaveLength(3);
    expect(
      result.observations.every(
        (observation) =>
          observation.evidenceRole === "canonical-periodic-protocol",
      ),
    ).toBe(true);
    expect(
      result.cycles.every(
        (cycle) =>
          cycle.finiteConservationAndExactRegularSinusEventsPassed,
      ),
    ).toBe(true);
    expect(result.terminalCheckpoint).not.toBeNull();
    expect(result.terminalCheckpoint).toMatchObject({
      revision: result.terminalAcceptedRevision,
      acceptedTimeSec: result.terminalAcceptedTimeSec,
    });
    expect(result.terminalAcceptedTimeSec).toBe(
      settled.terminalAcceptedState.acceptedTimeSec + 4,
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_CLAIM_V3)
      .toMatchObject({
        coldStartUsed: false,
        acceptedOutcome: "period1-converged-only",
        completeAcceptedStateComparatorReused: true,
        terminalCheckpoint:
          "exact-V3-checkpoint-restore-and-recheckpoint-equality-required",
      });
  });
});

/**
 * Builds the same canonical P1 candidate used by the periodic protocol while
 * yielding between complete accepted cycles. A full cold-to-P1 run can occupy
 * a two-core CI worker for more than Vitest 2's 60 s RPC timeout if it is one
 * uninterrupted JavaScript turn; cycle boundaries are safe test-only yield
 * points because no model state changes between them. The cycle runner,
 * complete accepted-state comparator, preregistered classifier policy, and
 * early-stop boundary are the production protocol's; only task scheduling is
 * different. The fixed valid protocol hash below is classifier metadata and
 * cannot affect either the numerical state or the selected cycle boundary.
 */
async function createSettledCandidateWithHostYields(
  nominalDtSec: number,
  maximumCycleCount: number,
): Promise<SettledCandidate> {
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const classifierOptions = Object.freeze({
    period1NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
    period2NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2MinimumPeriod1NormalizedDelta,
    consecutiveCycles:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles,
  });
  const observations: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
  const boundaries: AcceptedState[] = [fixture.cold.acceptedState];
  const protocolIdentityHash = "0".repeat(64);
  let accepted = fixture.cold.acceptedState;
  let classification = classifyMainWireIntegratedModelPeriodicityV3(
    observations,
    classifierOptions,
  );

  for (
    let cycleIndex = 1;
    cycleIndex <= maximumCycleCount;
    cycleIndex += 1
  ) {
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      fixture,
      accepted,
      cycleIndex,
      nominalDtSec,
    );
    accepted = run.terminalAcceptedState;
    const previous = boundaries.at(-1)!;
    const twoBack = boundaries.length >= 2 ? boundaries.at(-2)! : null;
    const period1 = compareMainWireIntegratedModelAcceptedStatesV3(
      accepted,
      previous,
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      fixture.config,
    );
    const period2 = twoBack === null
      ? null
      : compareMainWireIntegratedModelAcceptedStatesV3(
          accepted,
          twoBack,
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
          fixture.config,
        );
    observations.push(Object.freeze({
      cycleIndex,
      evidenceRole: "canonical-periodic-protocol" as const,
      protocolIdentityHash,
      period1,
      period2,
    }));
    classification = classifyMainWireIntegratedModelPeriodicityV3(
      observations,
      classifierOptions,
    );
    boundaries.push(accepted);
    if (boundaries.length > 3) boundaries.shift();

    if (classification.status !== "not-converged") {
      return Object.freeze({
        terminalAcceptedState: accepted,
        classification,
      });
    }
    await yieldToHost();
  }

  return Object.freeze({
    terminalAcceptedState: accepted,
    classification,
  });
}

function yieldToHost(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function advanceToAcceptedTime(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  initial: AcceptedState,
  targetTimeSec: number,
  nominalDtSec: number,
): AcceptedState {
  const startTimeSec = initial.acceptedTimeSec;
  let accepted = initial;
  let nominalGridIndex = 1;
  while (accepted.acceptedTimeSec < targetTimeSec) {
    const nominalTargetTimeSec = Math.min(
      targetTimeSec,
      startTimeSec + nominalGridIndex * nominalDtSec,
    );
    if (!(nominalTargetTimeSec > accepted.acceptedTimeSec)) {
      nominalGridIndex += 1;
      continue;
    }
    const limited = limitMainWireIntegratedModelCandidateTimeV3(
      accepted,
      nominalTargetTimeSec,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    const stepped = stepMainWireIntegratedModelV3(
      fixture.provider,
      accepted,
      {
        candidateTimeSec: limited.candidateTimeSec,
        coronary: fixture.coronaryStepInput,
        rhythm: {
          configuration: fixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        },
        dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
      },
    );
    if (stepped.converged === false) {
      throw new Error(stepped.message);
    }
    accepted = stepped.acceptedState;
    if (Math.abs(accepted.acceptedTimeSec - nominalTargetTimeSec) <= 1e-14) {
      nominalGridIndex += 1;
    }
  }
  expect(accepted.acceptedTimeSec).toBe(targetTimeSec);
  return accepted;
}
