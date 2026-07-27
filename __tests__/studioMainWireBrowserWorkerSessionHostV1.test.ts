import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  projectMainWireScientificObservationV1,
  type MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
  createMainWireScientificSessionV1,
  type MainWireScientificSessionExactCheckpointV4,
} from "@/engine/scientific/runtime";
import type {
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";
import {
  MainWireBrowserWorkerSessionHostV1,
  MainWireStudioTransientPartialProgressErrorV1,
  type MainWireStudioHostedSessionV1,
} from "@/studio/adapters/mainWire";

type FixtureV1 = Awaited<ReturnType<typeof createFixtureV1>>;

let fixture: FixtureV1;

beforeAll(async () => {
  fixture = await createFixtureV1();
}, 30_000);

describe("MainWire browser Worker Studio host receipt binding", () => {
  it("accepts a V4 restore receipt only when every persisted identity and accepted-state field agrees", async () => {
    const response = restoreResponseV1(fixture, "restore-session");
    const host = hostWithResponseV1(response);

    const restored = await host.restoreV4({
      sessionId: "restore-session",
      resolvedSessionInput: fixture.sessionInput,
      checkpointV4: fixture.checkpoint,
    });

    expect(restored).toMatchObject({
      hostId: "browser-host",
      sessionId: "restore-session",
      baseSessionInputSha256: fixture.checkpoint.baseSessionInputSha256,
      parameterEpoch: fixture.checkpoint.parameterEpoch,
      stateIdentity: {
        revision: fixture.checkpoint.transaction.revision,
        acceptedTimeSec: fixture.checkpoint.transaction.acceptedTimeSec,
        totalBloodVolumeMl: fixture.totalBloodVolumeMl,
      },
    });
  });

  it("rejects a V4 restore receipt that does not restore the checkpoint accepted state", async () => {
    const response = restoreResponseV1(fixture, "restore-session");
    response.payload.researchControlContext.stateIdentity.revision += 1;
    const host = hostWithResponseV1(response);

    await expect(host.restoreV4({
      sessionId: "restore-session",
      resolvedSessionInput: fixture.sessionInput,
      checkpointV4: fixture.checkpoint,
    })).rejects.toThrow(/restore V4 accepted-state binding mismatch/);
  });

  it.each([
    {
      name: "frame schema identity",
      mutate: (frame: MutableResponseV1) => {
        frame.frameId = "foreign-frame";
      },
      message: /observable frame accepted-state mismatch/,
    },
    {
      name: "complete observable catalog",
      mutate: (frame: MutableResponseV1) => {
        delete frame.values["hemodynamics.volume.LV"];
      },
      message: /observable catalog mismatch/,
    },
    {
      name: "observable identity",
      mutate: (frame: MutableResponseV1) => {
        frame.values["hemodynamics.volume.LV"].observableId =
          "hemodynamics.volume.RV";
      },
      message: /observable value mismatch/,
    },
    {
      name: "finite available value",
      mutate: (frame: MutableResponseV1) => {
        frame.values["hemodynamics.volume.LV"].value = Number.NaN;
      },
      message: /observable value mismatch/,
    },
    {
      name: "availability and quality pairing",
      mutate: (frame: MutableResponseV1) => {
        const value = frame.values["hemodynamics.volume.LV"];
        value.value = null;
        value.availability = "not-converged";
        value.quality = "accepted-derived";
      },
      message: /observable value mismatch/,
    },
  ])("rejects a Worker frame with malformed $name", async ({
    mutate,
    message,
  }) => {
    const response = restoreResponseV1(fixture, "restore-session");
    mutate(response.payload.observableFrame);
    const host = hostWithResponseV1(response);

    await expect(host.restoreV4({
      sessionId: "restore-session",
      resolvedSessionInput: fixture.sessionInput,
      checkpointV4: fixture.checkpoint,
    })).rejects.toThrow(message);
  });

  it("rejects a control fork receipt that does not preserve the source accepted state", async () => {
    const source = hostedSessionV1(fixture);
    const response = forkResponseV1(
      fixture,
      source,
      "fork-target",
    );
    response.payload.targetStateIdentity.acceptedTimeSec += 0.002;
    const host = hostWithResponseV1(response);

    await expect(host.forkControl({
      source,
      targetSessionId: "fork-target",
      targetControlState: fixture.checkpoint.controlTargetState,
    })).rejects.toThrow(/control fork accepted-state binding mismatch/);
  });

  it.each([
    {
      name: "execution dt",
      mutate: (response: MutableResponseV1) => {
        response.payload.executionProtocol.dtSec = 0.003;
      },
      message: /transient execution protocol mismatch/,
    },
    {
      name: "non-contiguous observation revisions",
      mutate: (response: MutableResponseV1) => {
        response.payload.observableFrames[0].revision += 1;
      },
      message: /transient observable frame 0 accepted-state mismatch/,
    },
    {
      name: "final frame identity",
      mutate: (response: MutableResponseV1) => {
        response.payload.finalObservableFrame.acceptedTimeSec += 0.001;
      },
      message: /transient final observable frame mismatch/,
    },
  ])("rejects malformed transient $name receipts", async ({
    mutate,
    message,
  }) => {
    const session = hostedSessionV1(fixture);
    const response = transientResponseV1(fixture, session, {
      dtSec: 0.002,
      stepCount: 4,
      observationStride: 2,
    });
    mutate(response);
    const host = hostWithResponseV1(response);

    await expect(host.runTransient({
      session,
      dtSec: 0.002,
      stepCount: 4,
      observationStride: 2,
    })).rejects.toThrow(message);
  });

  it("accepts a transient only when its protocol and complete observation sequence match the request", async () => {
    const session = hostedSessionV1(fixture);
    const response = transientResponseV1(fixture, session, {
      dtSec: 0.002,
      stepCount: 4,
      observationStride: 2,
    });
    const host = hostWithResponseV1(response);

    const completed = await host.runTransient({
      session,
      dtSec: 0.002,
      stepCount: 4,
      observationStride: 2,
    });

    expect(completed.observableFrames.map((frame) => frame.revision))
      .toEqual([
        session.stateIdentity.revision + 2,
        session.stateIdentity.revision + 4,
      ]);
    expect(completed.session.stateIdentity).toMatchObject({
      revision: session.stateIdentity.revision + 4,
      acceptedTimeSec: session.stateIdentity.acceptedTimeSec + 0.008,
    });
  });

  it("preserves a valid zero-step transient failure with its restore frame provenance", async () => {
    const baseSession = hostedSessionV1(fixture);
    const session = Object.freeze({
      ...baseSession,
      observableFrame: frameAtV1(
        baseSession.observableFrame,
        baseSession.stateIdentity.revision,
        baseSession.stateIdentity.acceptedTimeSec,
        "exact-checkpoint-restore",
      ),
    });
    const response = transientPartialErrorResponseV1(
      fixture,
      session,
      {
        dtSec: 0.002,
        stepCount: 4,
        observationStride: 2,
        completedStepCount: 0,
      },
    );
    const host = hostWithResponseV1(response);

    const failure = await host.runTransient({
      session,
      dtSec: 0.002,
      stepCount: 4,
      observationStride: 2,
    }).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(failure)
      .toBeInstanceOf(MainWireStudioTransientPartialProgressErrorV1);
    expect(failure).toMatchObject({
      requestedStepCount: 4,
      completedStepCount: 0,
      acceptedPartialProgress: {
        session: {
          stateIdentity: session.stateIdentity,
          observableFrame: session.observableFrame,
        },
        observableFrames: [session.observableFrame],
      },
    });
  });

  it("rejects a periodic-settlement receipt whose completed work does not produce its final state", async () => {
    const session = hostedSessionV1(fixture);
    const response = settlementResponseV1(fixture, session);
    response.payload.finalObservableFrame.revision -= 1;
    const host = hostWithResponseV1(response);

    await expect(host.settlePeriodic(session))
      .rejects.toThrow(/periodic settlement final observable frame accepted-state mismatch/);
  });

  it("returns the complete periodic evidence only after validating its fixed protocol and beat classification", async () => {
    const session = hostedSessionV1(fixture);
    const host = hostWithResponseV1(
      settlementResponseV1(fixture, session),
    );

    const settlement = await host.settlePeriodic(session);

    expect(settlement).toMatchObject({
      status: "tracking",
      periodicSteadyStateClaimed: false,
      trackerStartedThisCall: true,
      beatCompletedThisCall: true,
      completedStepCountThisCall: 500,
      completedBeatCount: 1,
      periodicity: {
        status: "not-converged",
        latestBeatIndex: 1,
      },
      retainedBeatClosure: [{ beatIndex: 1 }],
    });
  });

  it("rejects a claimed period-1 receipt with zero completed beats", async () => {
    const session = hostedSessionV1(fixture);
    const response = settlementResponseV1(fixture, session);
    response.payload.status = "period1-converged";
    response.payload.periodicSteadyStateClaimed = true;
    response.payload.completedBeatCount = 0;
    const host = hostWithResponseV1(response);

    await expect(host.settlePeriodic(session))
      .rejects.toThrow(/periodic settlement protocol mismatch/);
  });

  it.each([
    {
      name: "base input digest",
      mutate: (
        checkpoint: MainWireScientificSessionExactCheckpointV4,
        _frame: MainWireScientificObservableFrameV1,
      ) => {
        (checkpoint as MutableCheckpointV1).baseSessionInputSha256 =
          "f".repeat(64);
      },
    },
    {
      name: "control digest",
      mutate: (
        checkpoint: MainWireScientificSessionExactCheckpointV4,
        _frame: MainWireScientificObservableFrameV1,
      ) => {
        (checkpoint as MutableCheckpointV1).controlTargetStateSha256 =
          "f".repeat(64);
      },
    },
    {
      name: "parameter epoch",
      mutate: (
        checkpoint: MainWireScientificSessionExactCheckpointV4,
        _frame: MainWireScientificObservableFrameV1,
      ) => {
        (checkpoint as MutableCheckpointV1).parameterEpoch += 1;
      },
    },
    {
      name: "observable frame",
      mutate: (
        _checkpoint: MainWireScientificSessionExactCheckpointV4,
        frame: MainWireScientificObservableFrameV1,
      ) => {
        (frame as MutableFrameV1).acceptedTimeSec += 0.002;
      },
    },
  ])("rejects a checkpoint receipt with a mismatched $name", async ({
    mutate,
  }) => {
    const session = hostedSessionV1(fixture);
    const checkpoint = mutableCloneV1(fixture.checkpoint);
    const frame = mutableCloneV1(session.observableFrame);
    mutate(checkpoint, frame);
    const response = checkpointResponseV1(
      fixture,
      session,
      checkpoint,
      frame,
    );
    const host = hostWithResponseV1(response);

    await expect(host.checkpointV4(session))
      .rejects.toThrow(/checkpoint V4 accepted-state binding mismatch/);
  });

  it("rejects a valid but stale checkpoint for a newer hosted accepted state", async () => {
    const session = hostedSessionV1(fixture, {
      revision: fixture.checkpoint.transaction.revision + 1,
      acceptedTimeSec:
        fixture.checkpoint.transaction.acceptedTimeSec + 0.002,
    });
    const response = checkpointResponseV1(
      fixture,
      session,
      fixture.checkpoint,
      session.observableFrame,
    );
    const host = hostWithResponseV1(response);

    await expect(host.checkpointV4(session))
      .rejects.toThrow(/checkpoint V4 accepted-state binding mismatch/);
  });
});

async function createFixtureV1() {
  const session = await createMainWireScientificSessionV1();
  const step = session.step(0.002);
  if (step.converged === false) throw new Error(step.message);
  return Object.freeze({
    sessionInput: session.sessionInput,
    checkpoint: await session.checkpointExactV4(),
    frame: projectMainWireScientificObservationV1(step.observation),
    totalBloodVolumeMl: session.stateIdentity().totalBloodVolumeMl,
  });
}

function hostedSessionV1(
  base: FixtureV1,
  state: Readonly<{
    revision: number;
    acceptedTimeSec: number;
  }> = base.checkpoint.transaction,
): MainWireStudioHostedSessionV1 {
  return Object.freeze({
    hostId: "browser-host",
    sessionId: "hosted-session",
    baseSessionInputSha256: base.checkpoint.baseSessionInputSha256,
    controlState: base.checkpoint.controlTargetState,
    parameterEpoch: base.checkpoint.parameterEpoch,
    stateIdentity: Object.freeze({
      revision: state.revision,
      acceptedTimeSec: state.acceptedTimeSec,
      totalBloodVolumeMl: base.totalBloodVolumeMl,
    }),
    observableFrame: frameAtV1(
      base.frame,
      state.revision,
      state.acceptedTimeSec,
      "accepted-step",
    ),
  });
}

function hostWithResponseV1(
  response: MutableResponseV1,
): MainWireBrowserWorkerSessionHostV1 {
  const request = vi.fn(async () =>
    response as unknown as MainWireScientificWorkerResponseV1);
  return new MainWireBrowserWorkerSessionHostV1({
    hostId: "browser-host",
    client: {
      request,
      terminate: vi.fn(),
    } as never,
  });
}

function restoreResponseV1(
  base: FixtureV1,
  sessionId: string,
): MutableResponseV1 {
  return mutableCloneV1({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: "restore-request",
    sessionId,
    releaseRef: base.checkpoint.releaseRef,
    sessionOrigin: restoreOriginV1(base),
    commandKind: "restoreExactSessionV4",
    payload: {
      kind: "sessionRestoredV4",
      researchControlContext: {
        stateIdentity: {
          revision: base.checkpoint.transaction.revision,
          acceptedTimeSec: base.checkpoint.transaction.acceptedTimeSec,
          totalBloodVolumeMl: base.totalBloodVolumeMl,
        },
        controlState: base.checkpoint.controlTargetState,
        parameterEpoch: base.checkpoint.parameterEpoch,
      },
      observableFrame: frameAtV1(
        base.frame,
        base.checkpoint.transaction.revision,
        base.checkpoint.transaction.acceptedTimeSec,
        "exact-checkpoint-restore",
      ),
    },
    error: null,
  });
}

function forkResponseV1(
  base: FixtureV1,
  source: MainWireStudioHostedSessionV1,
  targetSessionId: string,
): MutableResponseV1 {
  const targetState = base.checkpoint.controlTargetState;
  const targetEpoch = source.parameterEpoch + 1;
  const stateIdentity = {
    ...source.stateIdentity,
  };
  return mutableCloneV1({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: "fork-request",
    sessionId: targetSessionId,
    releaseRef: source.observableFrame.releaseRef,
    sessionOrigin: {
      kind: "research-control-state-preserving-fork-v0",
      classification: "research-only-experimental-not-clinical",
      releaseRef: source.observableFrame.releaseRef,
      sourceSessionId: source.sessionId,
      baseSessionInputSha256: source.baseSessionInputSha256,
      sourceControlStateSha256: source.controlState.targetStateSha256,
      targetControlStateSha256: targetState.targetStateSha256,
      parameterEpoch: targetEpoch,
      transitionProtocolId:
        "main-wire-research-control-state-preserving-fork-v0",
      transitionProtocolVersion: "0.0.0",
      acceptedStatePreservedAtFork: true,
      periodicTrackerResetAtFork: true,
      sourceSessionRetainedAtFork: true,
      exactCheckpointCapability: "control-aware-exact-checkpoint-v4",
      periodicSteadyStateClaimed: false,
      officialTrustClaimed: false,
      clinicalDiagnosisClaimed: false,
      clinicalValidationClaimed: false,
    },
    commandKind: "forkResearchControlSession",
    payload: {
      kind: "researchControlSessionForked",
      sourceSessionId: source.sessionId,
      sourceStateIdentity: stateIdentity,
      targetStateIdentity: stateIdentity,
      sourceControlStateSha256: source.controlState.targetStateSha256,
      targetControlState: targetState,
      parameterEpoch: targetEpoch,
      acceptedStatePreservedAtFork: true,
      periodicTrackerResetAtFork: true,
      sourceSessionRetainedAtFork: true,
      exactCheckpointAvailable: true,
      periodicSteadyStateClaimed: false,
      observableFrame: frameAtV1(
        source.observableFrame,
        source.stateIdentity.revision,
        source.stateIdentity.acceptedTimeSec,
        "research-control-state-fork",
      ),
    },
    error: null,
  });
}

function transientResponseV1(
  base: FixtureV1,
  session: MainWireStudioHostedSessionV1,
  execution: Readonly<{
    dtSec: number;
    stepCount: number;
    observationStride: number;
  }>,
): MutableResponseV1 {
  const offsets = [2, 4];
  const frames = offsets.map((offset) =>
    frameAtV1(
      session.observableFrame,
      session.stateIdentity.revision + offset,
      session.stateIdentity.acceptedTimeSec + execution.dtSec * offset,
      "accepted-step",
    ));
  return mutableCloneV1({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: "transient-request",
    sessionId: session.sessionId,
    releaseRef: session.observableFrame.releaseRef,
    sessionOrigin: restoreOriginV1(base),
    commandKind: "runTransient",
    payload: {
      kind: "transientCompleted",
      requestedStepCount: execution.stepCount,
      completedStepCount: execution.stepCount,
      executionProtocol: {
        protocolId: "test-transient",
        protocolVersion: "1.0.0",
        classification: "exploratory-parameterization",
        dtSec: execution.dtSec,
        stepCount: execution.stepCount,
        observationPolicy: {
          kind: "accepted-step-stride",
          stride: execution.observationStride,
          finalAcceptedStateAlwaysIncluded: true,
        },
        metricIntegrationPolicy: null,
        commitPolicy: "each-step-atomic-partial-progress-retained",
      },
      observableFrames: frames,
      finalObservableFrame: frames.at(-1),
      metricIntegration: null,
    },
    error: null,
  });
}

function transientPartialErrorResponseV1(
  base: FixtureV1,
  session: MainWireStudioHostedSessionV1,
  execution: Readonly<{
    dtSec: number;
    stepCount: number;
    observationStride: number;
    completedStepCount: number;
  }>,
): MutableResponseV1 {
  const finalObservableFrame = session.observableFrame;
  return mutableCloneV1({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: false,
    requestId: "transient-partial-request",
    sessionId: session.sessionId,
    releaseRef: session.observableFrame.releaseRef,
    sessionOrigin: restoreOriginV1(base),
    commandKind: "runTransient",
    payload: null,
    error: {
      code: "simulation-step-failed",
      message: "synthetic zero-step failure",
      retryable: false,
      silentFallbackApplied: false,
      observableFrames: [finalObservableFrame],
      partialProgress: {
        kind: "transient-partial-progress",
        requestedStepCount: execution.stepCount,
        completedStepCount: execution.completedStepCount,
        executionProtocol: {
          protocolId: "test-transient",
          protocolVersion: "1.0.0",
          classification: "exploratory-parameterization",
          dtSec: execution.dtSec,
          stepCount: execution.stepCount,
          observationPolicy: {
            kind: "accepted-step-stride",
            stride: execution.observationStride,
            finalAcceptedStateAlwaysIncluded: true,
          },
          metricIntegrationPolicy: null,
          commitPolicy: "each-step-atomic-partial-progress-retained",
        },
        finalObservableFrame,
        metricIntegration: null,
      },
    },
  });
}

function settlementResponseV1(
  base: FixtureV1,
  session: MainWireStudioHostedSessionV1,
): MutableResponseV1 {
  const completedStepCount =
    MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.stepsPerBeat;
  const dtSec =
    MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.dtSec;
  return mutableCloneV1({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: "settle-request",
    sessionId: session.sessionId,
    releaseRef: session.observableFrame.releaseRef,
    sessionOrigin: restoreOriginV1(base),
    commandKind: "settlePeriodic",
    payload: {
      kind: "periodic-settlement-progress",
      status: "tracking",
      periodicSteadyStateClaimed: false,
      period2OrbitSuspected: false,
      trackerStartedThisCall: true,
      beatCompletedThisCall: true,
      completedStepCountThisCall: completedStepCount,
      completedBeatCount: 1,
      anchorAcceptedTimeSec: session.stateIdentity.acceptedTimeSec,
      anchorPhase01: cyclePhase01V1(
        session.stateIdentity.acceptedTimeSec,
      ),
      periodicity: {
        status: "not-converged",
        latestBeatIndex: 1,
        consecutiveBeatsRequired: 3,
        evidenceBeatIndices: [],
        latestPeriod1MaximumNormalizedDelta: 1,
        latestPeriod2MaximumNormalizedDelta: null,
      },
      retainedBeatClosure: [{
        beatIndex: 1,
        period1: {
          maximumNormalizedDelta: 1,
          worstGroup: "circulation-node-volume",
          worstPath: "synthetic",
          elapsedTimeSec: 1,
        },
        period2: null,
      }],
      executionProtocol:
        MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
      finalObservableFrame: frameAtV1(
        session.observableFrame,
        session.stateIdentity.revision + completedStepCount,
        session.stateIdentity.acceptedTimeSec
          + dtSec * completedStepCount,
        "accepted-step",
      ),
    },
    error: null,
  });
}

function checkpointResponseV1(
  base: FixtureV1,
  session: MainWireStudioHostedSessionV1,
  checkpoint: MainWireScientificSessionExactCheckpointV4,
  frame: MainWireScientificObservableFrameV1,
): MutableResponseV1 {
  return mutableCloneV1({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: "checkpoint-request",
    sessionId: session.sessionId,
    releaseRef: session.observableFrame.releaseRef,
    sessionOrigin: restoreOriginV1(base),
    commandKind: "getExactCheckpointV4",
    payload: {
      kind: "exactCheckpointV4",
      resolvedSessionInput: base.sessionInput,
      checkpoint,
      observableFrame: frame,
    },
    error: null,
  });
}

function restoreOriginV1(base: FixtureV1) {
  return {
    kind: "control-aware-exact-checkpoint-v4-restore",
    checkpointSchemaVersion: 4,
    checkpointSha256: base.checkpoint.checkpointSha256,
    baseSessionInputSha256: base.checkpoint.baseSessionInputSha256,
    controlTargetStateSha256:
      base.checkpoint.controlTargetStateSha256,
    parameterEpoch: base.checkpoint.parameterEpoch,
  };
}

function frameAtV1(
  frame: MainWireScientificObservableFrameV1,
  revision: number,
  acceptedTimeSec: number,
  source: MainWireScientificObservableFrameV1["source"],
): MainWireScientificObservableFrameV1 {
  return {
    ...frame,
    source,
    revision,
    acceptedTimeSec,
  };
}

function cyclePhase01V1(timeSec: number): number {
  const phase = timeSec - Math.floor(timeSec);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function mutableCloneV1<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type MutableResponseV1 = any;
type MutableFrameV1 = {
  -readonly [TKey in keyof MainWireScientificObservableFrameV1]:
    MainWireScientificObservableFrameV1[TKey];
};
type MutableCheckpointV1 = {
  -readonly [TKey in keyof MainWireScientificSessionExactCheckpointV4]:
    MainWireScientificSessionExactCheckpointV4[TKey];
};
