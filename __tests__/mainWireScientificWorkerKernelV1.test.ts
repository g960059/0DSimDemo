import { describe, expect, it, vi } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  mainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  MAIN_WIRE_SCIENTIFIC_IN_PROCESS_KERNEL_V1_CLAIM,
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandKindV1,
} from "@/engine/scientific/worker";
import type {
  MainWireScientificSessionV1,
} from "@/engine/scientific/runtime";

describe("main-wire scientific in-process kernel V1", () => {
  it("returns protocol evidence only when the source session identity remains unchanged", async () => {
    const kernel = new MainWireScientificInProcessKernelV1();
    const sessionId = "protocol-identity-session";
    const created = await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-protocol-identity-create",
      sessionId,
    ));
    expect(created.ok).toBe(true);
    const session = (kernel as unknown as Readonly<{
      sessions: Map<string, MainWireScientificSessionV1>;
    }>).sessions.get(sessionId)!;
    const source = session.stateIdentity();
    const pvRunner = vi.spyOn(session, "runPvRelationsProtocolV1")
      .mockReturnValue(Object.freeze({
        source: Object.freeze({
          revision: source.revision,
          acceptedTimeSec: source.acceptedTimeSec,
          fixedTotalBloodVolumeMl: source.totalBloodVolumeMl,
        }),
      }) as ReturnType<MainWireScientificSessionV1["runPvRelationsProtocolV1"]>);

    const stable = await kernel.handle(baseCommand(
      "runPvRelationsProtocol",
      "request-protocol-identity-stable",
      sessionId,
    ));
    expect(stable).toMatchObject({
      ok: true,
      commandKind: "runPvRelationsProtocol",
      payload: {
        kind: "pvRelationsProtocolCompleted",
        sourceSessionUnchanged: true,
        observableFrame: {
          revision: source.revision,
          acceptedTimeSec: source.acceptedTimeSec,
        },
      },
    });
    expect(pvRunner).toHaveBeenCalledOnce();
    pvRunner.mockRestore();

    const guytonRunner = vi.spyOn(session, "runGuytonStarlingProtocolV1")
      .mockReturnValue(Object.freeze({
        source: Object.freeze({
          revision: source.revision,
          acceptedTimeSec: source.acceptedTimeSec,
          fixedTotalBloodVolumeMl: source.totalBloodVolumeMl,
        }),
      }) as ReturnType<MainWireScientificSessionV1["runGuytonStarlingProtocolV1"]>);
    const identity = vi.spyOn(session, "stateIdentity")
      .mockReturnValueOnce(source)
      .mockReturnValue(Object.freeze({
        ...source,
        revision: source.revision + 1,
      }));
    const mutated = await kernel.handle(baseCommand(
      "runGuytonStarlingProtocol",
      "request-protocol-identity-mutated",
      sessionId,
    ));
    expect(mutated).toMatchObject({
      ok: false,
      commandKind: "runGuytonStarlingProtocol",
      error: {
        code: "command-failed",
        silentFallbackApplied: false,
      },
    });
    expect(mutated.ok === false ? mutated.error.message : "")
      .toMatch(/mutated its source session/i);
    expect(guytonRunner).toHaveBeenCalledOnce();
    expect(identity).toHaveBeenCalledTimes(2);
  });

  it("runs the typed lifecycle and returns observable frames only", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 2,
      maximumTransientStepCountPerCommand: 4,
    });
    const created = await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-create-1",
      "session-1",
    ));

    expect(created).toMatchObject({
      ok: true,
      requestId: "request-create-1",
      sessionId: "session-1",
      releaseRef: {
        id: "circleheart/adult-five-wall-noncoronary",
        version: "0.2.0",
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      },
      sessionOrigin: {
        kind: "canonical-cold-start",
        initializationProtocolVersion: "1.0.0",
      },
      commandKind: "createCanonicalSession",
      payload: {
        kind: "sessionCreated",
        observableFrame: {
          frameId: "main-wire-scientific-observable-frame-v1",
          revision: 0,
        },
      },
      error: null,
    });
    expect(JSON.stringify(created)).not.toContain("acceptedState");
    if (created.ok === false || created.payload.kind !== "sessionCreated") {
      throw new Error("expected created session");
    }
    expect(created.payload.observableFrame.values["hemodynamics.volume.LA"])
      .toMatchObject({ availability: "available", quality: "authoritative-state" });
    expect(created.payload.observableFrame.releaseRef).toEqual(created.releaseRef);
    expect(created.payload.observableFrame.values["coronary.flow.total"])
      .toEqual({
        observableId: "coronary.flow.total",
        value: null,
        availability: "not-modeled",
        quality: "not-assessed",
      });

    const transient = await kernel.handle({
      ...baseCommand("runTransient", "request-run-1", "session-1"),
      dtSec: 0.002,
      stepCount: 1,
      observationStride: 1,
    });
    expect(transient).toMatchObject({
      ok: true,
      requestId: "request-run-1",
      payload: {
        kind: "transientCompleted",
        requestedStepCount: 1,
        completedStepCount: 1,
        executionProtocol: {
          protocolId: "main-wire-normal-adult-five-wall-closed-loop-v1",
          classification: "approved-release-protocol",
          dtSec: 0.002,
          stepCount: 1,
          observationPolicy: { stride: 1 },
          commitPolicy: "each-step-atomic-partial-progress-retained",
        },
      },
    });
    if (transient.ok === false
      || transient.payload.kind !== "transientCompleted") {
      throw new Error("expected completed transient");
    }
    expect(transient.payload.observableFrames).toHaveLength(1);
    expect(transient.payload.finalObservableFrame.revision).toBe(1);
    expect(transient.payload.finalObservableFrame.values[
      "hemodynamics.pressure.absolute.Ao"
    ].availability).toBe("available");

    const failedTransient = await kernel.handle({
      ...baseCommand("runTransient", "request-run-failed", "session-1"),
      dtSec: 0.5,
      stepCount: 1,
      observationStride: 1,
    });
    expect(failedTransient).toMatchObject({
      ok: false,
      releaseRef: created.releaseRef,
      error: {
        code: "simulation-step-failed",
        partialProgress: {
          kind: "transient-partial-progress",
          requestedStepCount: 1,
          completedStepCount: 0,
          executionProtocol: {
            classification: "exploratory-parameterization",
            dtSec: 0.5,
          },
          finalObservableFrame: { revision: 1 },
        },
      },
    });
    expect(structuredClone(failedTransient)).toEqual(failedTransient);

    const beforePeriodic = await kernel.handle(baseCommand(
      "observe",
      "request-observe-before-periodic",
      "session-1",
    ));
    const periodic = await kernel.handle(baseCommand(
      "settlePeriodic",
      "request-periodic-1",
      "session-1",
    ));
    expect(periodic).toMatchObject({
      ok: true,
      releaseRef: created.releaseRef,
      payload: {
        kind: "periodic-settlement-progress",
        status: "tracking",
        periodicSteadyStateClaimed: false,
        trackerStartedThisCall: true,
        beatCompletedThisCall: true,
        completedStepCountThisCall: 500,
        completedBeatCount: 1,
        anchorAcceptedTimeSec: 0.002,
        anchorPhase01: 0.002,
        periodicity: {
          status: "not-converged",
          latestBeatIndex: 1,
        },
        retainedBeatClosure: [{ beatIndex: 1, period2: null }],
        finalObservableFrame: { revision: 501 },
      },
      error: null,
    });
    const afterPeriodic = await kernel.handle(baseCommand(
      "observe",
      "request-observe-after-periodic",
      "session-1",
    ));
    expect(frameRevision(afterPeriodic)).toBe(frameRevision(beforePeriodic) + 500);

    const checkpointResponse = await kernel.handle(baseCommand(
      "getExactCheckpoint",
      "request-checkpoint-1",
      "session-1",
    ));
    if (checkpointResponse.ok === false
      || checkpointResponse.payload.kind !== "exactCheckpoint") {
      throw new Error("expected exact checkpoint");
    }
    expect(checkpointResponse.payload.checkpoint.checkpointSha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(checkpointResponse.payload.checkpoint).toMatchObject({
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v3",
      schemaVersion: 3,
      releaseRef: created.releaseRef,
      sessionInputSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      periodicSettlementTracker: {
        completedBeatCount: 1,
        boundaryTransactions: expect.arrayContaining([
          expect.objectContaining({ revision: 501 }),
        ]),
      },
    });
    expect(structuredClone(checkpointResponse)).toEqual(checkpointResponse);
    const canonicalRelease =
      await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const resolvedSessionInput = await resolveMainWireScientificSessionInputV1(
      canonicalRelease,
      mainWireScientificSessionIntentV1(canonicalRelease.ref),
    );
    const callerReleaseRejected = await kernel.handle({
      ...baseCommand(
        "restoreExactSession",
        "request-restore-caller-release",
        "caller-release-session",
      ),
      resolvedSessionInput,
      checkpoint: checkpointResponse.payload.checkpoint,
      release: canonicalRelease,
    });
    expect(errorCode(callerReleaseRejected)).toBe("invalid-command");
    const restored = await kernel.handle({
      ...baseCommand(
        "restoreExactSession",
        "request-restore-1",
        "session-2",
      ),
      resolvedSessionInput,
      checkpoint: checkpointResponse.payload.checkpoint,
    });
    expect(restored).toMatchObject({
      ok: true,
      sessionId: "session-2",
      sessionOrigin: {
        kind: "exact-checkpoint-restore",
        checkpointSchemaVersion: 3,
        checkpointSha256: checkpointResponse.payload.checkpoint.checkpointSha256,
        sessionInputSha256: resolvedSessionInput.sessionInputSha256,
      },
      payload: {
        kind: "sessionRestored",
        observableFrame: { revision: 501, source: "exact-checkpoint-restore" },
      },
    });
    expect(structuredClone(restored)).toEqual(restored);
    expect(kernel.activeSessionCount()).toBe(2);

    const duplicate = await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-duplicate-1",
      "session-1",
    ));
    expect(errorCode(duplicate)).toBe("duplicate-session-id");
    const atCapacity = await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-capacity-1",
      "session-3",
    ));
    expect(errorCode(atCapacity)).toBe("session-capacity-exceeded");

    const disposed = await kernel.handle(baseCommand(
      "disposeSession",
      "request-dispose-1",
      "session-1",
    ));
    expect(disposed).toMatchObject({
      ok: true,
      releaseRef: created.releaseRef,
      sessionOrigin: { kind: "canonical-cold-start" },
      payload: { kind: "sessionDisposed", disposedSessionId: "session-1" },
    });
    expect(kernel.activeSessionCount()).toBe(1);
    const unknown = await kernel.handle(baseCommand(
      "observe",
      "request-observe-disposed",
      "session-1",
    ));
    expect(errorCode(unknown)).toBe("unknown-session-id");
    expect(unknown.releaseRef).toBeNull();
    expect(MAIN_WIRE_SCIENTIFIC_IN_PROCESS_KERNEL_V1_CLAIM).toMatchObject({
      boundedSessionOwnership: true,
      boundedCommandQueue: true,
      boundedCommandPayload: true,
      boundedOutputFrames: true,
      requestReplayRejected: true,
      retiredSessionIdReuseRejected: true,
      commandSubmissionOrderSerialized: true,
      internalSessionObjectsReturned: false,
      silentFallbackApplied: false,
      legacyBackendFallbackAvailable: false,
      periodicSettlementCapability:
        "release-bound-one-beat-progress-per-command",
      periodicSettlementHostCancellationBoundary: "between-commands",
      genericExactCheckpointCapability:
        "v3-exact-release-and-session-input-bound",
      genericExactRestoreCallerSuppliedReleaseAccepted: false,
      legacyV2RestoreCapability:
        "official-fixed-canonical-preset-internal-only",
    });
  }, 120_000);

  it("serializes concurrent duplicate allocation and rejects malformed commands", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 1,
      maximumTransientStepCountPerCommand: 2,
    });
    const mutable = {
      ...baseCommand(
        "createCanonicalSession",
        "request-captured-1",
        "captured-session",
      ),
    };
    const capturedPromise = kernel.handle(mutable);
    mutable.sessionId = "mutated-after-submit";
    const captured = await capturedPromise;
    expect(captured).toMatchObject({
      ok: true,
      requestId: "request-captured-1",
      sessionId: "captured-session",
    });

    await kernel.handle(baseCommand(
      "disposeSession",
      "request-dispose-captured",
      "captured-session",
    ));
    const [first, second] = await Promise.all([
      kernel.handle(baseCommand(
        "createCanonicalSession",
        "request-concurrent-1",
        "concurrent-session",
      )),
      kernel.handle(baseCommand(
        "createCanonicalSession",
        "request-concurrent-2",
        "concurrent-session",
      )),
    ]);
    expect(first.ok).toBe(true);
    expect(errorCode(second)).toBe("duplicate-session-id");

    const extraField = await kernel.handle({
      ...baseCommand("observe", "request-extra-field", "concurrent-session"),
      fallback: "legacy",
    });
    expect(extraField).toMatchObject({
      ok: false,
      requestId: "request-extra-field",
      releaseRef: expect.objectContaining({
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
      error: { code: "invalid-command", silentFallbackApplied: false },
    });
    const oversized = await kernel.handle({
      ...baseCommand("runTransient", "request-too-many", "concurrent-session"),
      dtSec: 0.002,
      stepCount: 3,
      observationStride: 1,
    });
    expect(errorCode(oversized)).toBe("invalid-command");
    const nonCanonical = await kernel.handle({
      ...baseCommand("observe", "request-nan", "concurrent-session"),
      invalid: Number.NaN,
    });
    expect(nonCanonical).toMatchObject({
      ok: false,
      requestId: "request-nan",
      sessionId: "concurrent-session",
      releaseRef: expect.objectContaining({
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
      error: { code: "invalid-command", silentFallbackApplied: false },
    });
  }, 120_000);

  it("rejects an altered exact checkpoint without allocating a session", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumSessionCount: 2,
    });
    await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-create-source",
      "source-session",
    ));
    const checkpointResponse = await kernel.handle(baseCommand(
      "getExactCheckpoint",
      "request-checkpoint-source",
      "source-session",
    ));
    if (checkpointResponse.ok === false
      || checkpointResponse.payload.kind !== "exactCheckpoint") {
      throw new Error("expected exact checkpoint");
    }
    const alteredCheckpoint = JSON.parse(JSON.stringify(
      checkpointResponse.payload.checkpoint,
    ));
    alteredCheckpoint.transaction.circulation.state
      .dynamicEdgeFlowsMlPerSec.Ao_SA += 1;
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const resolvedSessionInput = await resolveMainWireScientificSessionInputV1(
      release,
      mainWireScientificSessionIntentV1(release.ref),
    );
    const rejected = await kernel.handle({
      ...baseCommand(
        "restoreExactSession",
        "request-restore-altered",
        "rejected-session",
      ),
      resolvedSessionInput,
      checkpoint: alteredCheckpoint,
    });

    expect(rejected).toMatchObject({
      ok: false,
      sessionId: "rejected-session",
      error: {
        code: "exact-restore-rejected",
        retryable: false,
        silentFallbackApplied: false,
      },
    });
    expect(rejected.ok === false ? rejected.error.message : "")
      .toMatch(/outer SHA-256 mismatch/);
    expect(kernel.activeSessionCount()).toBe(1);
    const unknown = await kernel.handle(baseCommand(
      "observe",
      "request-observe-rejected",
      "rejected-session",
    ));
    expect(errorCode(unknown)).toBe("unknown-session-id");

    const v2LikeCheckpoint = {
      ...checkpointResponse.payload.checkpoint,
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v2",
      schemaVersion: 2,
    };
    const v2Rejected = await kernel.handle({
      ...baseCommand(
        "restoreExactSession",
        "request-restore-v2-rejected",
        "v2-rejected-session",
      ),
      resolvedSessionInput,
      checkpoint: v2LikeCheckpoint,
    });
    expect(v2Rejected).toMatchObject({
      ok: false,
      error: {
        code: "exact-restore-rejected",
        message: expect.stringMatching(
          /scientific exact checkpoint V3 rejected: envelope mismatch/,
        ),
      },
    });
  }, 120_000);

  it("bounds queue, request replay, input size, and retired session identities", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumQueuedCommandCount: 1,
      maximumRequestCountPerKernelLifetime: 8,
      maximumSessionIdentityCountPerKernelLifetime: 2,
    });
    const creating = kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-bounded-create",
      "bounded-session",
    ));
    const queueRejected = await kernel.handle(baseCommand(
      "observe",
      "request-bounded-queued",
      "bounded-session",
    ));
    expect(errorCode(queueRejected)).toBe("command-queue-capacity-exceeded");
    const created = await creating;
    expect(created.ok).toBe(true);
    expect(structuredClone(created)).toEqual(created);

    const duplicateRequest = await kernel.handle(baseCommand(
      "observe",
      "request-bounded-create",
      "bounded-session",
    ));
    expect(errorCode(duplicateRequest)).toBe("duplicate-request-id");
    await kernel.handle(baseCommand(
      "disposeSession",
      "request-bounded-dispose",
      "bounded-session",
    ));
    const retired = await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-bounded-reuse",
      "bounded-session",
    ));
    expect(errorCode(retired)).toBe("retired-session-id");

    const tinyInputKernel = new MainWireScientificInProcessKernelV1({
      maximumCommandJsonBytes: 32,
    });
    const oversizedInput = await tinyInputKernel.handle(baseCommand(
      "createCanonicalSession",
      "request-oversized-json",
      "oversized-session",
    ));
    expect(oversizedInput).toMatchObject({
      ok: false,
      requestId: "request-oversized-json",
      sessionId: "oversized-session",
      error: { code: "invalid-command" },
    });

    const shared = Object.freeze({ marker: "shared-json-node" });
    const aliasedInput = {
      ...baseCommand(
        "restoreExactSession",
        "request-aliased-json",
        "aliased-session",
      ),
      resolvedSessionInput: { left: shared, right: shared },
      checkpoint: {},
    };
    const aliasedResult = await kernel.handle(aliasedInput);
    expect(errorCode(aliasedResult)).toBe("exact-restore-rejected");
    expect(aliasedResult.ok === false ? aliasedResult.error.message : "")
      .not.toMatch(/cyclic command input/);

    const recoveryKernel = new MainWireScientificInProcessKernelV1({
      maximumRequestCountPerKernelLifetime: 1,
    });
    await recoveryKernel.handle(baseCommand(
      "createCanonicalSession",
      "request-recovery-create",
      "recovery-session",
    ));
    const overRegularCapacity = await recoveryKernel.handle(baseCommand(
      "observe",
      "request-recovery-observe",
      "recovery-session",
    ));
    expect(errorCode(overRegularCapacity)).toBe("request-capacity-exceeded");
    const recoveryCheckpoint = await recoveryKernel.handle(baseCommand(
      "getExactCheckpoint",
      "request-recovery-checkpoint",
      "recovery-session",
    ));
    expect(recoveryCheckpoint).toMatchObject({
      ok: true,
      payload: { kind: "exactCheckpoint" },
    });
  }, 120_000);

  it("bounds transient chunks and output frames with explicit sampling", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      maximumTransientStepCountPerCommand: 4,
      maximumOutputFrameCountPerCommand: 2,
    });
    await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-sampling-create",
      "sampling-session",
    ));
    const tooManyFrames = await kernel.handle({
      ...baseCommand(
        "runTransient",
        "request-sampling-rejected",
        "sampling-session",
      ),
      dtSec: 0.002,
      stepCount: 4,
      observationStride: 1,
    });
    expect(errorCode(tooManyFrames)).toBe("invalid-command");

    const sampled = await kernel.handle({
      ...baseCommand(
        "runTransient",
        "request-sampling-accepted",
        "sampling-session",
      ),
      dtSec: 0.001,
      stepCount: 4,
      observationStride: 2,
    });
    if (sampled.ok === false || sampled.payload.kind !== "transientCompleted") {
      throw new Error("expected sampled transient");
    }
    expect(sampled.payload.observableFrames.map(({ revision }) => revision))
      .toEqual([2, 4]);
    expect(sampled.payload.executionProtocol).toMatchObject({
      classification: "exploratory-parameterization",
      dtSec: 0.001,
      observationPolicy: { stride: 2 },
    });
    expect(sampled.payload.finalObservableFrame.revision).toBe(4);
  }, 120_000);
});

function baseCommand<TKind extends ScientificCommandKindV1>(
  kind: TKind,
  requestId: string,
  sessionId: string,
) {
  return {
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind,
    requestId,
    sessionId,
  } as const;
}

function errorCode(
  response: Awaited<ReturnType<MainWireScientificInProcessKernelV1["handle"]>>,
): string | null {
  return response.ok === false ? response.error.code : null;
}

function frameRevision(
  response: Awaited<ReturnType<MainWireScientificInProcessKernelV1["handle"]>>,
): number | null {
  if (response.ok === false || response.payload.kind !== "observation") return null;
  return response.payload.observableFrame.revision;
}
