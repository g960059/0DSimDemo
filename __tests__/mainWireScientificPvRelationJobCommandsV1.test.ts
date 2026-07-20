import { describe, expect, it, vi } from "vitest";

import type {
  MainWireScientificPvRelationJobSnapshotV1,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationJobV1";
import {
  MainWireScientificInProcessKernelV1,
} from "@/engine/scientific/worker/MainWireScientificInProcessKernelV1";
import type {
  MainWireScientificPvRelationJobManagerV1,
} from "@/engine/scientific/worker/MainWireScientificPvRelationJobManagerV1";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandKindV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";

describe("main-wire scientific PV relation job commands V1", () => {
  it("starts, polls, cancels, and disposes under the owning session", async () => {
    const manager = mockPvRelationManager();
    const kernel = new MainWireScientificInProcessKernelV1({
      pvRelationJobManager: manager,
    });
    const sessionId = "pv-relation-command-session";
    expect((await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-pv-create",
      sessionId,
    ))).ok).toBe(true);

    const started = await kernel.handle(baseCommand(
      "startPvRelationsProtocolJob",
      "request-pv-start",
      sessionId,
    ));
    expect(started).toMatchObject({
      ok: true,
      commandKind: "startPvRelationsProtocolJob",
      payload: {
        kind: "pvRelationsProtocolJobStarted",
        job: {
          jobId: "pv-relation-job-1",
          snapshot: { status: "running", sequence: 1 },
        },
        sourceSessionUnchanged: true,
        observableFrame: { revision: 0 },
      },
    });
    expect(manager.start).toHaveBeenCalledWith(expect.objectContaining({
      ownerSessionId: sessionId,
      capsule: expect.objectContaining({
        capsuleId: "main-wire-scientific-hemodynamic-job-capsule-v2",
        source: expect.objectContaining({ revision: 0, acceptedTimeSec: 0 }),
      }),
    }));

    const polled = await kernel.handle({
      ...baseCommand(
        "pollPvRelationsProtocolJob",
        "request-pv-poll",
        sessionId,
      ),
      jobId: "pv-relation-job-1",
    });
    expect(polled).toMatchObject({
      ok: true,
      commandKind: "pollPvRelationsProtocolJob",
      payload: {
        kind: "pvRelationsProtocolJobProgress",
        snapshot: { status: "running", sequence: 2 },
      },
    });

    const cancelled = await kernel.handle({
      ...baseCommand(
        "cancelPvRelationsProtocolJob",
        "request-pv-cancel",
        sessionId,
      ),
      jobId: "pv-relation-job-1",
    });
    expect(cancelled).toMatchObject({
      ok: true,
      commandKind: "cancelPvRelationsProtocolJob",
      payload: {
        kind: "pvRelationsProtocolJobCancelled",
        snapshot: { status: "cancelled", sequence: 3 },
      },
    });
    expect(manager.cancel).toHaveBeenCalledWith({
      ownerSessionId: sessionId,
      jobId: "pv-relation-job-1",
      reason: "host-request",
    });

    expect((await kernel.handle(baseCommand(
      "disposeSession",
      "request-pv-dispose",
      sessionId,
    ))).ok).toBe(true);
    expect(manager.disposeOwner).toHaveBeenCalledWith(sessionId);
  }, 120_000);

  it("rejects an unexpected field on the start command", async () => {
    const manager = mockPvRelationManager();
    const kernel = new MainWireScientificInProcessKernelV1({
      pvRelationJobManager: manager,
    });
    const sessionId = "pv-relation-invalid-command-session";
    expect((await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-invalid-create",
      sessionId,
    ))).ok).toBe(true);

    const response = await kernel.handle({
      ...baseCommand(
        "startPvRelationsProtocolJob",
        "request-invalid-start",
        sessionId,
      ),
      policyPatch: { beatCount: 99 },
    });
    expect(response).toMatchObject({
      ok: false,
      commandKind: "startPvRelationsProtocolJob",
      error: {
        code: "invalid-command",
        message: "command fields do not match its kind",
      },
    });
    expect(manager.start).not.toHaveBeenCalled();
  });
});

function mockPvRelationManager(): MainWireScientificPvRelationJobManagerV1 {
  let source: MainWireScientificPvRelationJobSnapshotV1["source"] | null = null;
  let fingerprint = "a".repeat(64);
  const snapshot = (
    sequence: number,
    status: MainWireScientificPvRelationJobSnapshotV1["status"],
  ): MainWireScientificPvRelationJobSnapshotV1 => Object.freeze({
    jobId: "pv-relation-job-1",
    sequence,
    status,
    stage: status === "running" ? "preload-reduction" : "cancelled",
    source: source!,
    sourceFingerprint: fingerprint,
    cacheStatus: "miss",
    beats: Object.freeze([]),
    progress: null,
    result: null,
    errorMessage: null,
  });
  return {
    start: vi.fn(async (input) => {
      source = input.capsule.source;
      fingerprint = "b".repeat(64);
      return Object.freeze({
        jobId: "pv-relation-job-1",
        snapshot: snapshot(1, "running"),
        suggestedPollIntervalMs: 125,
      });
    }),
    poll: vi.fn(() => snapshot(2, "running")),
    cancel: vi.fn(() => snapshot(3, "cancelled")),
    disposeOwner: vi.fn(),
    dispose: vi.fn(),
  };
}

function baseCommand(
  kind: ScientificCommandKindV1,
  requestId: string,
  sessionId: string,
) {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind,
    requestId,
    sessionId,
  });
}
