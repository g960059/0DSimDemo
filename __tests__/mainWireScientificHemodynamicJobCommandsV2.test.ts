import { describe, expect, it, vi } from "vitest";

import type {
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificProtocolSourceIdentityV1,
  MainWireScientificVascularFunctionCurveV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import {
  emptyMainWireScientificFastTbvPreviewV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import {
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type MainWireScientificHemodynamicJobManagerV2,
  type ScientificCommandKindV1,
} from "@/engine/scientific/worker";

describe("main-wire scientific hemodynamic job commands V2", () => {
  it("starts, polls, cancels, and disposes jobs under the owning session", async () => {
    const manager = mockJobManager();
    const kernel = new MainWireScientificInProcessKernelV1({
      hemodynamicJobManager: manager,
    });
    const sessionId = "hemodynamic-job-session";
    const created = await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-job-create",
      sessionId,
    ));
    expect(created.ok).toBe(true);

    const started = await kernel.handle(baseCommand(
      "startGuytonStarlingProtocolJob",
      "request-job-start",
      sessionId,
    ));
    expect(started).toMatchObject({
      ok: true,
      commandKind: "startGuytonStarlingProtocolJob",
      payload: {
        kind: "guytonStarlingProtocolJobStarted",
        job: {
          jobId: "guyton-starling-job-1",
          suggestedPollIntervalMs: 250,
          snapshot: {
            status: "running",
            stage: "vascular-ready",
            sequence: 0,
          },
        },
        sourceSessionUnchanged: true,
        observableFrame: { revision: 0 },
      },
    });
    expect(manager.start).toHaveBeenCalledOnce();
    expect(vi.mocked(manager.start).mock.calls[0]?.[0]).toMatchObject({
      ownerSessionId: sessionId,
      detailMode: "compare",
      capsule: {
        capsuleId: "main-wire-scientific-hemodynamic-job-capsule-v2",
        source: { revision: 0, acceptedTimeSec: 0 },
      },
    });
    const source = vi.mocked(manager.start).mock.calls[0]![0].capsule.source;

    const polled = await kernel.handle({
      ...baseCommand(
        "pollGuytonStarlingProtocolJob",
        "request-job-poll",
        sessionId,
      ),
      jobId: "guyton-starling-job-1",
    });
    expect(polled).toMatchObject({
      ok: true,
      commandKind: "pollGuytonStarlingProtocolJob",
      payload: {
        kind: "guytonStarlingProtocolJobProgress",
        snapshot: {
          jobId: "guyton-starling-job-1",
          status: "running",
          stage: "continuation",
          sequence: 1,
        },
        sourceSessionUnchanged: true,
        observableFrame: { revision: source.revision },
      },
    });
    expect(manager.poll).toHaveBeenCalledWith({
      ownerSessionId: sessionId,
      jobId: "guyton-starling-job-1",
    });

    const cancelled = await kernel.handle({
      ...baseCommand(
        "cancelGuytonStarlingProtocolJob",
        "request-job-cancel",
        sessionId,
      ),
      jobId: "guyton-starling-job-1",
    });
    expect(cancelled).toMatchObject({
      ok: true,
      commandKind: "cancelGuytonStarlingProtocolJob",
      payload: {
        kind: "guytonStarlingProtocolJobCancelled",
        snapshot: {
          jobId: "guyton-starling-job-1",
          status: "cancelled",
          stage: "cancelled",
          sequence: 2,
        },
        sourceSessionUnchanged: true,
        observableFrame: { revision: source.revision },
      },
    });
    expect(manager.cancel).toHaveBeenCalledWith({
      ownerSessionId: sessionId,
      jobId: "guyton-starling-job-1",
      reason: "host-request",
    });

    const disposed = await kernel.handle(baseCommand(
      "disposeSession",
      "request-job-dispose",
      sessionId,
    ));
    expect(disposed).toMatchObject({
      ok: true,
      payload: { kind: "sessionDisposed", disposedSessionId: sessionId },
    });
    expect(manager.disposeOwner).toHaveBeenCalledOnce();
    expect(manager.disposeOwner).toHaveBeenCalledWith(sessionId);
  }, 120_000);

  it("accepts explicit calculation detail and rejects unsupported detail", async () => {
    const manager = mockJobManager();
    const kernel = new MainWireScientificInProcessKernelV1({
      hemodynamicJobManager: manager,
    });
    const sessionId = "hemodynamic-detail-session";
    expect((await kernel.handle(baseCommand(
      "createCanonicalSession",
      "request-detail-create",
      sessionId,
    ))).ok).toBe(true);

    const started = await kernel.handle({
      ...baseCommand(
        "startGuytonStarlingProtocolJob",
        "request-detail-standard",
        sessionId,
      ),
      detailMode: "standard" as const,
    });
    expect(started.ok).toBe(true);
    expect(manager.start).toHaveBeenCalledWith(expect.objectContaining({
      ownerSessionId: sessionId,
      detailMode: "standard",
    }));

    const rejected = await kernel.handle({
      ...baseCommand(
        "startGuytonStarlingProtocolJob",
        "request-detail-invalid",
        sessionId,
      ),
      detailMode: "adaptive-preview",
    });
    expect(rejected).toMatchObject({
      ok: false,
      error: {
        code: "invalid-command",
        message: "detailMode is unsupported",
      },
    });
    expect(manager.start).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed job IDs and non-exact command fields before dispatch", async () => {
    const manager = mockJobManager();
    const kernel = new MainWireScientificInProcessKernelV1({
      hemodynamicJobManager: manager,
    });

    const malformedJobId = await kernel.handle({
      ...baseCommand(
        "pollGuytonStarlingProtocolJob",
        "request-job-malformed-id",
        "parser-session",
      ),
      jobId: "job id with spaces",
    });
    expect(malformedJobId).toMatchObject({
      ok: false,
      commandKind: "pollGuytonStarlingProtocolJob",
      error: {
        code: "invalid-command",
        message: "jobId is invalid",
        silentFallbackApplied: false,
      },
    });

    const extraField = await kernel.handle({
      ...baseCommand(
        "cancelGuytonStarlingProtocolJob",
        "request-job-extra-field",
        "parser-session",
      ),
      jobId: "job-1",
      reason: "caller-must-not-select-cancellation-semantics",
    });
    expect(extraField).toMatchObject({
      ok: false,
      commandKind: "cancelGuytonStarlingProtocolJob",
      error: {
        code: "invalid-command",
        message: "command fields do not match its kind",
        silentFallbackApplied: false,
      },
    });

    const missingJobId = await kernel.handle(baseCommand(
      "pollGuytonStarlingProtocolJob",
      "request-job-missing-id",
      "parser-session",
    ));
    expect(missingJobId).toMatchObject({
      ok: false,
      commandKind: "pollGuytonStarlingProtocolJob",
      error: {
        code: "invalid-command",
        message: "command fields do not match its kind",
        silentFallbackApplied: false,
      },
    });

    expect(manager.poll).not.toHaveBeenCalled();
    expect(manager.cancel).not.toHaveBeenCalled();
  });
});

function mockJobManager(): MainWireScientificHemodynamicJobManagerV2 {
  let source: MainWireScientificProtocolSourceIdentityV1 | null = null;
  return {
    start: vi.fn(async ({ capsule }) => {
      source = capsule.source;
      return Object.freeze({
        jobId: "guyton-starling-job-1",
        snapshot: snapshot(source, 0, "running", "vascular-ready"),
        suggestedPollIntervalMs: 250,
      });
    }),
    poll: vi.fn(() => snapshot(
      requiredSource(source),
      1,
      "running",
      "continuation",
    )),
    cancel: vi.fn(() => snapshot(
      requiredSource(source),
      2,
      "cancelled",
      "cancelled",
    )),
    disposeOwner: vi.fn(),
    dispose: vi.fn(),
  };
}

function snapshot(
  source: MainWireScientificProtocolSourceIdentityV1,
  sequence: number,
  status: MainWireScientificHemodynamicJobSnapshotV2["status"],
  stage: MainWireScientificHemodynamicJobSnapshotV2["stage"],
): MainWireScientificHemodynamicJobSnapshotV2 {
  return Object.freeze({
    jobId: "guyton-starling-job-1",
    detailMode: "compare",
    sequence,
    status,
    stage,
    source,
    baselinePeriodicity: "period1-converged",
    rightVascularFunction: vascularCurve("right"),
    leftVascularFunction: vascularCurve("left"),
    preloadPointEvidence: Object.freeze([]),
    fastPreloadPreview: emptyMainWireScientificFastTbvPreviewV1({
      source,
      sourceFingerprint: "test-source-fingerprint",
    }),
    progress: Object.freeze({
      completedPointCount: 0,
      plannedPointCountLowerBound: 2,
      activeDirections: Object.freeze([]),
      completedBeatCount: 0,
      fastPreviewCompletedPointCount: 0,
      fastPreviewPlannedPointCount: 9,
    }),
    result: null,
    errorMessage: null,
  });
}

function vascularCurve(
  side: MainWireScientificVascularFunctionCurveV1["side"],
): MainWireScientificVascularFunctionCurveV1 {
  return Object.freeze({
    side,
    xSemantics: side === "right"
      ? "mean-transmural-right-atrial-pressure-cvp-model-equivalent"
      : "mean-transmural-left-atrial-pressure-pcwp-surrogate",
    ySemantics: side === "right"
      ? "systemic-venous-return-l-per-min"
      : "pulmonary-venous-return-l-per-min",
    pressureReferenceOffsetMmHg: 0,
    fillingPressureAbsoluteMmHg: 7,
    fillingPressureTransmuralMmHg: 7,
    points: Object.freeze([]),
  });
}

function requiredSource(
  source: MainWireScientificProtocolSourceIdentityV1 | null,
): MainWireScientificProtocolSourceIdentityV1 {
  if (source === null) throw new Error("job must be started before poll/cancel");
  return source;
}

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
