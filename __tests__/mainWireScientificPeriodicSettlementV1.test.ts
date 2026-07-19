import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
  MainWireScientificSessionV1,
  createMainWireScientificSessionV1,
} from "@/engine/scientific/runtime";
import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("main-wire scientific periodic settlement V1", () => {
  it("advances exactly one same-phase beat per call with bounded output", async () => {
    const session = await createMainWireScientificSessionV1();
    const first = session.settlePeriodic();

    expect(first).toMatchObject({
      completed: true,
      status: "tracking",
      periodicSteadyStateClaimed: false,
      period2OrbitSuspected: false,
      trackerStartedThisCall: true,
      beatCompletedThisCall: true,
      completedStepCountThisCall: 500,
      completedBeatCount: 1,
      anchorAcceptedTimeSec: 0,
      anchorPhase01: 0,
      periodicity: {
        status: "not-converged",
        latestBeatIndex: 1,
        evidenceBeatIndices: [],
      },
      retainedBeatClosure: [{
        beatIndex: 1,
        period1: {
          elapsedTimeSec: expect.closeTo(1, 12),
          maximumNormalizedDelta: expect.any(Number),
          worstPath: expect.any(String),
        },
        period2: null,
      }],
      finalObservation: {
        revision: 500,
        acceptedTimeSec: expect.closeTo(1, 12),
      },
      executionProtocol: {
        maximumBeatCountPerCall: 1,
        maximumStepsPerCall: 500,
        hostCancellationBoundary: "between-calls",
        commitPolicy: "each-step-atomic-partial-progress-retained",
        failedTrialPromotion: false,
      },
    });
    expect(first.completed && first.retainedBeatClosure).toHaveLength(1);
    expect(structuredClone(first)).toEqual(first);
    expect(MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1).toMatchObject({
      dtSec: 0.002,
      stepsPerBeat: 500,
      maximumBeatCount: 32,
    });
  }, 120_000);

  it("stores tracker state in checkpoint V2 and resumes command-exactly", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const source = await createMainWireScientificSessionV1();
    const first = source.settlePeriodic();
    if (first.completed === false) throw new Error(first.message);
    const checkpoint = await source.checkpointLegacyCanonicalExactV2();

    expect(checkpoint).toMatchObject({
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v2",
      schemaVersion: 2,
      periodicSettlementTracker: {
        trackerCheckpointId:
          "main-wire-periodic-settlement-tracker-checkpoint-v1",
        completedBeatCount: 1,
        boundaryTransactions: [
          { revision: 0, acceptedTimeSec: 0 },
          { revision: 500, acceptedTimeSec: expect.closeTo(1, 12) },
        ],
      },
      claim: {
        periodicSettlementTrackerStored: true,
        periodicSettlementExactCommandContinuation: true,
      },
    });

    const restored =
      await MainWireScientificSessionV1.restoreLegacyCanonicalExactV2(
      release,
      JSON.parse(JSON.stringify(checkpoint)),
    );
    await expect(restored.checkpointLegacyCanonicalExactV2())
      .resolves.toEqual(checkpoint);

    const sourceSecond = source.settlePeriodic();
    const restoredSecond = restored.settlePeriodic();
    expect(restoredSecond).toEqual(sourceSecond);
    expect(restoredSecond).toMatchObject({
      completed: true,
      trackerStartedThisCall: false,
      beatCompletedThisCall: true,
      completedStepCountThisCall: 500,
      completedBeatCount: 2,
      periodicity: { latestBeatIndex: 2 },
      retainedBeatClosure: [
        { beatIndex: 1, period2: null },
        { beatIndex: 2, period2: expect.objectContaining({
          elapsedTimeSec: expect.closeTo(2, 12),
        }) },
      ],
      finalObservation: { revision: 1_000 },
    });

    const forgedAnchor = JSON.parse(JSON.stringify(checkpoint));
    forgedAnchor.periodicSettlementTracker.anchorAcceptedTimeSec += 1;
    const { checkpointSha256: _oldSha, ...forgedPayload } = forgedAnchor;
    forgedAnchor.checkpointSha256 = await sha256CanonicalJsonHex(forgedPayload);
    await expect(MainWireScientificSessionV1.restoreLegacyCanonicalExactV2(
      release,
      forgedAnchor,
    )).rejects.toThrow(/terminal time mismatch/);
  }, 120_000);

  it("re-arms at the exact command-start phase after an external step", async () => {
    const session = await createMainWireScientificSessionV1();
    expect(session.step(0.002).converged).toBe(true);
    const settlement = session.settlePeriodic();

    expect(settlement).toMatchObject({
      completed: true,
      trackerStartedThisCall: true,
      completedBeatCount: 1,
      anchorAcceptedTimeSec: 0.002,
      anchorPhase01: 0.002,
      completedStepCountThisCall: 500,
      finalObservation: {
        revision: 501,
        acceptedTimeSec: expect.closeTo(1.002, 12),
      },
      retainedBeatClosure: [{
        period1: { elapsedTimeSec: expect.closeTo(1, 12) },
      }],
    });
  }, 120_000);
});
